import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('civic comments remain private until moderation, without editing vote counts', () => {
  const sql = read('supabase/migrations/20261120235930_community_comments_moderation.sql');
  assert.match(sql, /ativo = true and moderado = true/);
  assert.match(sql, /usuario_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /private\.admin_mfa_verified\(null, false\)/);
  assert.match(sql, /new\.moderado := false/);
  assert.match(sql, /new\.votos_positivos := 0/);
  assert.match(sql, /Somente o texto do comentário pode ser editado/);
});

test('civic comment hook queries only approved comments and validates length', () => {
  const hook = read('src/hooks/useProblemasCidade.tsx');
  assert.match(hook, /\.eq\('moderado', true\)/);
  assert.match(hook, /novoComentario\.conteudo\.trim\(\)\.length > 4000/);
  assert.match(hook, /Comentário enviado para moderação/);
  assert.match(hook, /comentariosError/);
});

test('civic comment form preserves input on errors and blocks double send', () => {
  const form = read('src/components/problemas/ComentarioForm.tsx');
  assert.match(form, /submittingRef\.current/);
  assert.match(form, /await criarComentario\.mutateAsync/);
  assert.match(form, /catch/);
  assert.match(form, /maxLength=\{4000\}/);
});

test('civic comment moderation confirms affected record', () => {
  const admin = read('src/components/admin/sections/ComentariosProblemaSection.tsx');
  assert.match(admin, /if \(!updated\) throw new Error/);
  assert.match(admin, /\.eq\('moderado', false\)/);
  assert.match(admin, /isError, refetch/);
  assert.match(admin, /moderarComentario\.isPending/);
});

test('Entre Nós does not reveal author identity and confirms moderation', () => {
  const page = read('src/pages/EntreNos.tsx');
  const admin = read('src/pages/admin/AdminEntreNos.tsx');
  assert.match(page, /<b className="text-xs">Anônimo<\/b>/);
  assert.match(page, /reportComment/);
  assert.match(page, /comentario_id: commentId/);
  assert.match(admin, /if\(!data\)throw new Error/);
  assert.match(admin, /loadError/);
  assert.match(admin, /disabled=\{processing\}/);
});

test('Entre Nós reporting rejects duplicates and self-reports without touching old data', () => {
  const sql = read('supabase/migrations/20261120235940_guard_entre_nos_reports.sql');
  assert.match(sql, /v_author is not distinct from \(select auth\.uid\(\)\)/);
  assert.match(sql, /Você já denunciou este conteúdo/);
  assert.match(sql, /new\.status := 'aberta'/);
  assert.doesNotMatch(sql, /delete from public\.entre_nos_denuncias/i);
});


test('Entre Nós reports show targets to moderators and give clear duplicate feedback', () => {
  const admin = read('src/pages/admin/AdminEntreNos.tsx');
  const page = read('src/pages/EntreNos.tsx');
  assert.match(admin, /const reportTarget=/);
  assert.match(admin, /Conteúdo removido/);
  assert.match(admin, /target\?\.conteudo/);
  assert.match(page, /Você já denunciou esta publicação/);
  assert.match(page, /Este comentário não pode ser denunciado/);
});


test('Entre Nós moderation requires MFA and preserves owner/public reads', () => {
  const sql = read('supabase/migrations/20261121005841_entre_nos_mfa_moderation_policies.sql');
  for (const policy of [
    'Admin modera postagem', 'Admin modera comentario',
    'Admin ve denuncias', 'Admin revisa denuncias',
  ]) {
    assert.ok(sql.includes('alter policy "' + policy + '"'), 'Missing MFA policy: ' + policy);
  }
  assert.match(sql, /private\.admin_mfa_verified\(null, false\)/);
  assert.match(sql, /status = 'aprovado' or usuario_id = \(select auth\.uid\(\)\)/);
  assert.doesNotMatch(sql, /drop table|delete from public\.entre_nos_/i);
});


test('civic moderation does not fetch emails or dismiss a pending action', () => {
  const admin = read('src/components/admin/sections/ComentariosProblemaSection.tsx');
  assert.match(admin, /\.select\('nome'\)/);
  assert.doesNotMatch(admin, /\.select\('nome, email'\)/);
  assert.match(admin, /if \(!open && !moderarComentario\.isPending\)/);
  assert.match(admin, /if \(moderarComentario\.isPending\) event\.preventDefault\(\)/);
  assert.match(admin, /if \(!updated\) throw new Error/);
});
