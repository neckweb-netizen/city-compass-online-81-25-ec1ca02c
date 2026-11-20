import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('review database restricts customer, company and administrator edits', () => {
  const sql = source('supabase/migrations/20261120232000_guard_reviews_ownership_and_content.sql');
  assert.match(sql, /private\.admin_mfa_verified\(v_city, false\)/);
  assert.match(sql, /to_jsonb\(new\) - 'nota' - 'comentario' - 'imagens' - 'atualizado_em'/);
  assert.match(sql, /to_jsonb\(new\) - 'resposta_empresa' - 'respondido_em' - 'atualizado_em'/);
  assert.match(sql, /guard_review_fields/);
  assert.match(sql, /drop policy if exists "Admins podem excluir avaliações"/);
  assert.match(sql, /avaliacoes_comentario_tamanho/);
  assert.match(sql, /avaliacoes_resposta_tamanho/);
});

test('review publication prevents forged owner replies and self reviews', () => {
  const sql = source('supabase/migrations/20261120235500_review_creation_timestamp_normalization.sql');
  assert.match(sql, /new\.usuario_id is distinct from \(select auth\.uid\(\)\)/);
  assert.match(sql, /new\.resposta_empresa is not null/);
  assert.match(sql, /e\.usuario_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /new\.criado_em := now\(\)/);
});

test('reviews have one report per signed-in user with limited visibility', () => {
  const sql = source('supabase/migrations/20261120234500_review_reports_and_insert_guard.sql');
  assert.match(sql, /unique \(avaliacao_id, usuario_id\)/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /usuario_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /Administradores com MFA podem ver denúncias/);
});

test('public review screen shows company response and report actions', () => {
  const page = source('src/pages/LocalProfile.tsx');
  const actions = source('src/components/empresa/ReviewActions.tsx');
  assert.match(page, /<ReviewActions reviewId=\{avaliacao\.id\}/);
  assert.match(actions, /useResponderAvaliacao/);
  assert.match(actions, /denuncias_avaliacoes/);
  assert.match(actions, /reportRef\.current/);
  assert.match(actions, /isOwner/);
});

test('review writer, profile editor and admin editor prevent duplicate requests', () => {
  for (const path of [
    'src/components/empresa/AvaliacaoModal.tsx',
    'src/components/admin/forms/EditAvaliacaoModal.tsx',
    'src/components/profile/EditOwnReview.tsx',
  ]) {
    const file = source(path);
    assert.match(file, /Ref\.current/);
    assert.match(file, /4000/);
  }
});

test('review hooks confirm updates and deletion and refresh derived statistics', () => {
  const hook = source('src/hooks/useAvaliacoes.tsx');
  assert.match(hook, /if \(!data\) throw new Error\('Avaliação não encontrada/);
  assert.match(hook, /if \(!data\) throw new Error\('Avaliação não encontrada ou sem permissão para remover/);
  assert.match(hook, /empresa-estatisticas-avaliacoes/);
  assert.match(hook, /useResponderAvaliacao/);
});

test('moderation can list reports with retry and confirm deleting review', () => {
  const admin = source('src/components/admin/sections/AvaliacoesSection.tsx');
  assert.match(admin, /admin-denuncias-avaliacoes/);
  assert.match(admin, /refetchReports/);
  assert.match(admin, /Denúncias recebidas/);
  assert.match(admin, /isRemoving/);
});
