import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const script = new URL('./verify-backup-bundle.mjs', import.meta.url).pathname;
const invoke = (mode, directory, manifest) => spawnSync(process.execPath, [script, mode, directory, manifest], { encoding: 'utf8' });

test('offline backup manifest detects corruption and never overwrites existing receipt', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'saj-backup-test-'));
  try {
    const folder = path.join(root, 'backup');
    const manifest = path.join(root, 'receipt.json');
    await mkdir(folder);
    await writeFile(path.join(folder, 'database.sql'), 'fixture de teste');
    assert.equal(invoke('create', folder, manifest).status, 0);
    const receipt = JSON.parse(await readFile(manifest, 'utf8'));
    assert.equal(receipt.version, 1);
    assert.equal(receipt.files.length, 1);
    assert.match(receipt.files[0].sha256, /^[0-9a-f]{64}$/);
    assert.equal(invoke('verify', folder, manifest).status, 0);
    assert.notEqual(invoke('create', folder, manifest).status, 0);
    await writeFile(path.join(folder, 'database.sql'), 'fixture adulterada');
    assert.notEqual(invoke('verify', folder, manifest).status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('offline inventory rejects symlinks, empty backups and manifest in data folder', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'saj-backup-test-'));
  try {
    const folder = path.join(root, 'backup');
    await mkdir(folder);
    assert.notEqual(invoke('create', folder, path.join(root, 'receipt.json')).status, 0);
    await writeFile(path.join(folder, 'data.sql'), 'fake');
    assert.notEqual(invoke('create', folder, path.join(folder, 'receipt.json')).status, 0);
    await symlink(path.join(folder, 'data.sql'), path.join(folder, 'linked.sql'));
    assert.notEqual(invoke('create', folder, path.join(root, 'receipt.json')).status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
