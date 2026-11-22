import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('public raffle reads use sanitized RPC instead of unrestricted table SELECT', () => {
  const page = read('src/pages/ferramentas/GeradorRifa.tsx');
  const sql = read('supabase/migrations/20261122165000_raffle_buyer_privacy_public_safe_lookup.sql');
  assert.match(page, /supabase\.rpc\('get_public_raffle' as any, \{ p_id: idRifaPublica \}\)/);
  assert.match(page, /\.select\('\*'\)\.eq\('user_id', userId\)/);
  assert.match(page, /if \(!userId\) \{/);
  assert.match(sql, /drop policy if exists "Qualquer pessoa pode visualizar rifas pelo link"/);
  assert.match(sql, /jsonb_build_object\('numero', n\.item->>'numero', 'status', n\.item->>'status'\)/);
  assert.match(sql, /to anon, authenticated/);
});

test('public reservation RPC strips buyer name and phone from every returned number', () => {
  const sql = read('supabase/migrations/20261122165000_raffle_buyer_privacy_public_safe_lookup.sql');
  const page = read('src/pages/ferramentas/GeradorRifa.tsx');
  assert.match(sql, /jsonb_agg\(item - 'nome' - 'telefone'/);
  assert.match(sql, /create policy "Criador ou admin MFA visualiza dados pessoais da rifa"/);
  assert.match(page, /isModoComprador && !podeGerenciarRifa/);
  assert.match(page, /const sanitized = data\.numeros as NumeroRifa\[\]/);
  assert.match(page, /window\.setInterval\(\(\) => \{ void refresh\(\); \}, 20_000\)/);
});

test('raffle creation validates Brazilian prices before writing or estimating revenue', () => {
  const page = read('src/pages/ferramentas/GeradorRifa.tsx');
  assert.match(page, /\(parseBrazilianNumber\(valorNumero\) \?\? 0\) <= 0/);
  assert.match(page, /totalPagos \* \(parseBrazilianNumber\(valorNumero\) \?\? 0\)/);
  assert.match(page, /if \(!numeroSelecionado \|\| !rifaAtiva\?\.id \|\| salvandoReserva\) return/);
});


test('raffle session switches erase buyer contact state and ignore previous requests', () => {
  const page = read('src/pages/ferramentas/GeradorRifa.tsx');
  assert.match(page, /const initSequenceRef = useRef\(0\)/);
  assert.match(page, /const request = \+\+initSequenceRef\.current/);
  assert.match(page, /setNomeComprador\(''\)/);
  assert.match(page, /setTelefoneComprador\(''\)/);
  assert.match(page, /setModalReservaOpen\(false\)/);
  assert.match(page, /setIsModoComprador\(Boolean\(idRifaPublica\)\)/);
  assert.match(page, /if \(request !== initSequenceRef\.current\) return/);
  assert.match(page, /\[idRifaPublica, user\?\.id\]/);
  assert.match(page, /return \(\) => \{ initSequenceRef\.current \+= 1; \}/);
});
