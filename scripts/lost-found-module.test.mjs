import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('lost-found publications must enter moderation', () => {
  const sql = source('supabase/migrations/20261120174500_secure_lost_found_moderation.sql');
  assert.match(sql, /new\.status := 'pendente'/);
  assert.match(sql, /if current_user = 'anon' then new\.usuario_id := null/);
  assert.match(sql, /create policy "Administradores com MFA podem moderar achados"/);
  assert.match(sql, /private\.admin_mfa_verified\(null, false\)/);
  assert.match(sql, /grant update \(status\) on public\.achados_perdidos to authenticated/);
});

test('owner can resolve own approved case only without editing other fields', () => {
  const sql = source('supabase/migrations/20261120174500_secure_lost_found_moderation.sql');
  assert.match(sql, /old\.usuario_id is distinct from \(select auth\.uid\(\)\)/);
  assert.match(sql, /old\.status <> 'aprovado'/);
  assert.match(sql, /new\.status <> 'resolvido'/);
  assert.match(sql, /to_jsonb\(new\) - 'status'/);
});

test('public lost-found page validates contacts and confirms status changes', () => {
  const page = source('src/pages/AchadosPerdidos.tsx');
  assert.match(page, /getJobApplicationHref\("whatsapp", contatoTelefone\)/);
  assert.match(page, /getJobApplicationHref\("whatsapp", item\.contato_telefone\)/);
  assert.match(page, /submittingRef\.current/);
  assert.match(page, /\.eq\("usuario_id", usuarioLogadoId\)/);
  assert.match(page, /\.eq\("status", "aprovado"\)/);
  assert.match(page, /if \(!updated\) throw new Error/);
  assert.match(page, /loadError/);
  assert.match(page, /Tentar novamente/);
});

test('moderation confirms changes and handles errors safely', () => {
  const page = source('src/pages/admin/AdminAchadosPerdidos.tsx');
  assert.match(page, /\.eq\("status", novoStatus === "resolvido" \? "aprovado" : "pendente"\)/);
  assert.match(page, /if \(!updated\) throw new Error/);
  assert.match(page, /if \(!removed\) throw new Error/);
  assert.match(page, /setProcessingId/);
  assert.match(page, /getJobApplicationHref\("whatsapp", item\.contato_telefone/);
  assert.match(page, /loadError/);
});
