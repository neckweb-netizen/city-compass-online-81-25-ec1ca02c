import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';

// Execute the real TypeScript helpers with Node's sandbox, not regex-only assertions.
function loadSource(path, resolve = () => { throw new Error('Unexpected import'); }) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  runInNewContext(js, {
    module,
    exports: module.exports,
    require: resolve,
    TextEncoder,
    crypto: webcrypto,
    Intl,
    Date,
    console,
  }, { filename: path, timeout: 3000 });
  return module.exports;
}
const parser = loadSource('src/lib/parseBrazilianNumber.ts');
const model = loadSource('src/features/cobrancas/microCrm.ts', name => {
  if (name === '@/lib/parseBrazilianNumber') return parser;
  throw new Error('Unexpected import: ' + name);
});
const client = { id: '11111111-1111-4111-8111-111111111111', nome: 'Cliente de teste', telefone: '75999999999', criadoEm: '2026-11-23T12:00:00.000Z' };
const charge = { id: '22222222-2222-4222-8222-222222222222', clienteId: client.id, descricao: 'Serviço fictício', valorCentavos: 123456, vencimento: '2026-12-15', status: 'pendente', pagoEm: null, criadoEm: '2026-11-23T12:00:00.000Z' };
const sample = () => ({ versao: 1, clientes: [{ ...client }], cobrancas: [{ ...charge }] });

test('amounts in Brazilian format are converted to exact positive cents', () => {
  assert.equal(model.parseCobrancaCentavos('1.234,56'), 123456);
  assert.equal(model.parseCobrancaCentavos('0,01'), 1);
  for (const text of ['0', '-1', '1,234', '1.2.3', 'abc', '']) {
    assert.equal(model.parseCobrancaCentavos(text), null, text);
  }
});

test('backup validator accepts records and rejects invalid references, duplicates and dates', () => {
  assert.equal(model.validarBackupCobrancas(sample()).cobrancas[0].valorCentavos, 123456);
  const orphan = sample(); orphan.cobrancas[0].clienteId = '33333333-3333-4333-8333-333333333333';
  assert.equal(model.validarBackupCobrancas(orphan), null);
  const duplicate = sample(); duplicate.cobrancas.push({ ...duplicate.cobrancas[0] });
  assert.equal(model.validarBackupCobrancas(duplicate), null);
  const invalidDate = sample(); invalidDate.cobrancas[0].vencimento = '2026-02-30';
  assert.equal(model.validarBackupCobrancas(invalidDate), null);
  const invalidStatus = sample(); invalidStatus.cobrancas[0].status = 'paga';
  assert.equal(model.validarBackupCobrancas(invalidStatus), null);
});

test('snapshots only retain known fields and never accept another object shape', () => {
  const extra = sample(); extra.cobrancas[0].untrusted = 'discard';
  const normalized = model.validarBackupCobrancas(extra);
  assert.equal(Object.hasOwn(normalized.cobrancas[0], 'untrusted'), false);
  assert.equal(model.validarBackupCobrancas({ versao: 1, clientes: {}, cobrancas: [] }), null);
});

test('legacy fingerprint is deterministic and changes if the backup changes', async () => {
  const first = await model.legacyBackupFingerprint(sample());
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, await model.legacyBackupFingerprint(sample()));
  const changed = sample(); changed.cobrancas[0].valorCentavos += 1;
  assert.notEqual(first, await model.legacyBackupFingerprint(changed));
});

test('legacy and synchronized cache use separate per-account keys', () => {
  const uid = '11111111-1111-4111-8111-111111111111';
  assert.notEqual(model.cobrancasStorageKey(uid), model.cobrancasSyncCacheKey(uid));
  assert.notEqual(model.cobrancasImportedLegacyKey(uid), model.cobrancasSyncCacheKey(uid));
  assert.notEqual(model.cobrancasSyncCacheKey(uid), model.cobrancasSyncCacheKey('another-account'));
});
