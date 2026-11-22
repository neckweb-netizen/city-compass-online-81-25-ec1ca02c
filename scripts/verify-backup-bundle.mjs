#!/usr/bin/env node
// Inventário local de cópias de segurança. Nunca envia dados a serviços externos.
// Uso: node scripts/verify-backup-bundle.mjs create <diretorio> <manifesto.json>
//      node scripts/verify-backup-bundle.mjs verify <diretorio> <manifesto.json>
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [command, directory, manifestFile] = process.argv.slice(2);
if (!['create', 'verify'].includes(command) || !directory || !manifestFile) {
  console.error('Uso: node scripts/verify-backup-bundle.mjs <create|verify> <diretorio> <manifesto.json>');
  process.exitCode = 2;
} else {
  try {
    const base = path.resolve(directory);
    const manifestPath = path.resolve(manifestFile);
    if (manifestPath === base || !path.relative(base, manifestPath).startsWith('..')) {
      throw new Error('Guarde o manifesto fora da pasta de backup.');
    }
    if (!(await lstat(base)).isDirectory()) throw new Error('Diretório inválido.');
    const files = [];
    const walk = async (dir, prefix = '') => {
      const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        const relative = path.posix.join(prefix, entry.name);
        const full = path.join(dir, entry.name);
        if (entry.isSymbolicLink()) throw new Error('Links simbólicos não são permitidos no backup.');
        if (entry.isDirectory()) await walk(full, relative);
        else if (entry.isFile()) {
          const metadata = await lstat(full);
          const hash = createHash('sha256');
          for await (const chunk of createReadStream(full)) hash.update(chunk);
          files.push({ path: relative, bytes: metadata.size, sha256: hash.digest('hex') });
        } else throw new Error('Tipo de arquivo não permitido no backup.');
      }
    };
    await walk(base);
    files.sort((a, b) => a.path.localeCompare(b.path));
    if (!files.length) throw new Error('Não é possível inventariar um backup vazio.');
    if (command === 'create') {
      const manifest = { version: 1, generatedAt: new Date().toISOString(), files };
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      console.log(`Manifesto local criado: ${files.length} arquivo(s). Isso NÃO comprova restauração.`);
    } else {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      if (manifest.version !== 1 || !Array.isArray(manifest.files)) throw new Error('Manifesto inválido.');
      const expected = JSON.stringify(manifest.files);
      const actual = JSON.stringify(files);
      if (expected !== actual) throw new Error('Backup diferente do manifesto: arquivo ausente, extra ou alterado.');
      console.log(`Integridade SHA-256 confirmada: ${files.length} arquivo(s). Isso NÃO comprova restauração.`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Falha de verificação.');
    process.exitCode = 1;
  }
}
