import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function migration(filename) {
  return readFileSync(new URL(`../supabase/migrations/${filename}`, import.meta.url), 'utf8');
}

test('booking update protection remains in the schema migration', () => {
  const sql = migration('20261117181651_prevent_appointment_status_overlap.sql');
  assert.match(sql, /CREATE TRIGGER prevent_appointment_update_conflict/i);
  assert.match(sql, /BEFORE UPDATE OF status, duracao_minutos/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /tstzrange\(/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION private\.prevent_appointment_update_conflict\(\)/i);
});

test('domino matching and passing enforce match status', () => {
  const enter = migration('20261117222238_restrict_domino_matchmaking_to_waiting_rooms.sql');
  const pass = migration('20261117191447_guard_domino_pass_active_match.sql');
  assert.match(enter, /where status = 'aguardando'/i);
  assert.match(enter, /for update skip locked/i);
  assert.match(pass, /v_sala\.status <> 'jogando'/i);
  assert.match(pass, /v_sala\.resultado_registrado is true/i);
});

test('domino queue write permissions are owner-scoped', () => {
  const sql = migration('20261118012608_dedupe_domino_queue_read_rls.sql');
  assert.match(sql, /FOR INSERT TO authenticated WITH CHECK \(usuario_id = \(select auth\.uid\(\)\)\)/i);
  assert.match(sql, /FOR UPDATE TO authenticated USING \(usuario_id = \(select auth\.uid\(\)\)\)/i);
  assert.match(sql, /FOR DELETE TO authenticated USING \(usuario_id = \(select auth\.uid\(\)\)\)/i);
  assert.doesNotMatch(sql, /DROP POLICY "Jogadores autenticados podem ver a fila"/i);
});

test('derived company statistics and ranking remain protected from direct writes', () => {
  for (const [filename, table] of [
    ['20261118015630_protect_company_stats_from_direct_user_writes.sql', 'estatisticas'],
    ['20261118021524_protect_leaderboard_cache_from_direct_user_writes.sql', 'leaderboard_cache'],
  ]) {
    const sql = migration(filename);
    assert.ok(sql.includes(`REVOKE INSERT, UPDATE, DELETE ON TABLE public.${table} FROM authenticated;`), filename);
    assert.doesNotMatch(sql, /REVOKE SELECT/i);
  }
});

test('redundant review/statistics triggers were removed without dropping their replacements', () => {
  const sql = migration('20261118022145_remove_duplicate_review_stats_triggers.sql');
  assert.match(sql, /DROP TRIGGER IF EXISTS atualizar_stats_avaliacoes ON public\.avaliacoes/i);
  assert.match(sql, /DROP TRIGGER IF EXISTS refresh_populares_on_stats_change ON public\.estatisticas/i);
  assert.doesNotMatch(sql, /DROP TRIGGER IF EXISTS trigger_avaliacoes_estatisticas/i);
  assert.doesNotMatch(sql, /DROP TRIGGER IF EXISTS trigger_estatisticas_refresh_populares/i);
});

test('appointment phone normalization safely strips formatted non-digits', () => {
  const sql = migration('20261118030137_fix_appointment_phone_normalization.sql');
  assert.ok(sql.includes("v_new text := chr(39) || '[^0-9]' || chr(39)"));
  assert.ok(sql.includes("v_original := pg_get_functiondef('public.validar_agendamento_antes_insert()'::regprocedure)"));
  assert.match(sql, /EXECUTE v_updated/);
});

test('loyalty idempotency replay stays bound to card and transaction details', () => {
  const sql = migration('20261118093041_guard_loyalty_transaction_idempotency_identity.sql');
  for (const condition of [
    'v_existing.card_id IS DISTINCT FROM v_card.id',
    'v_existing.tipo IS DISTINCT FROM p_tipo',
    'v_existing.quantidade IS DISTINCT FROM p_quantidade',
    'v_existing.reward_id IS DISTINCT FROM p_reward_id',
  ]) assert.ok(sql.includes(condition), condition);
  assert.match(sql, /RAISE EXCEPTION 'Esta chave de solicitação já foi usada em outra operação'/);
});

test('review and statistics privileged routines use restricted search paths', () => {
  const sql = migration('20261118094522_harden_review_stats_privileged_search_paths.sql');
  for (const name of [
    'atualizar_estatisticas_empresa(uuid)',
    'trigger_atualizar_estatisticas()',
    'trigger_refresh_populares()',
  ]) {
    assert.ok(sql.includes(`ALTER FUNCTION public.${name} SET search_path = '';`), name);
  }
});

test('automatic domino matchmaking only selects and locks waiting rooms', () => {
  const sql = migration('20261118105507_guard_domino_auto_queue_waiting_and_lock.sql');
  assert.match(sql, /'WHERE status = ' \|\| chr\(39\) \|\| 'aguardando'/i);
  assert.match(sql, /FOR UPDATE SKIP LOCKED/);
  assert.match(sql, /EXECUTE v_new/);
});

test('automatic domino queue locks the selected player as well as the room', () => {
  const sql = migration('20261118111154_lock_domino_queued_player_during_matchmaking.sql');
  assert.match(sql, /ORDER BY entrou_em ASC LIMIT 1 FOR UPDATE SKIP LOCKED/);
  assert.match(sql, /regexp_matches\(v_before,v_pattern,'g'\)/);
  assert.match(sql, /EXECUTE v_after/);
});

test('automatic domino queue assigns the initial turn when a match starts', () => {
  const sql = migration('20261118114406_set_initial_turn_in_domino_auto_matchmaking.sql');
  assert.match(sql, /vez_usuario_id = CASE WHEN v_j2 IS NOT NULL THEN v_j2 ELSE null END/);
  assert.match(sql, /vez_usuario_id = v_j1/);
  assert.match(sql, /EXECUTE v_new/);
});

test('domino server rejects forged tile faces and missing endpoints', () => {
  const sql = migration('20261118120600_validate_domino_tile_faces_and_endpoints.sql');
  assert.ok(sql.includes('v_a is null or v_b is null'));
  assert.ok(sql.includes('new.mesa_ponta_esquerda is null'));
  assert.ok(sql.includes('new.mesa_ponta_direita is null'));
  assert.ok(sql.includes('least(v_a,v_b) is distinct from'));
  assert.ok(sql.includes('greatest(v_a,v_b) is distinct from'));
});

test('internal domino triggers retain restricted function search paths', () => {
  const sql = migration('20261118121330_harden_domino_internal_trigger_search_paths.sql');
  for (const name of [
    'processar_fila_domino()',
    'preparar_nova_partida_domino()',
    'registrar_empate_domino_ao_trancar()',
  ]) {
    assert.ok(sql.includes(`ALTER FUNCTION public.${name} SET search_path = '';`), name);
  }
});

test('domino v2 prototype keeps player hands private and cannot redraw', () => {
  const sql = migration('20261118141500_domino_v2_private_server_hands_prototype.sql');
  assert.match(sql, /CREATE TABLE private\.domino_v2_partidas/);
  assert.match(sql, /CREATE TABLE private\.domino_v2_maos/);
  assert.match(sql, /REVOKE ALL ON TABLE private\.domino_v2_partidas, private\.domino_v2_maos/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/g);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /IF EXISTS \(SELECT 1 FROM private\.domino_v2_partidas WHERE sala_id = p_sala_id\)/);
  assert.match(sql, /ORDER BY gen_random_uuid\(\)/);
  assert.match(sql, /WHERE a\.n <= b\.n/);
  assert.match(sql, /WHERE pos <= 14/);
  assert.match(sql, /v_uid IN \(p\.jogador_1_id,p\.jogador_2_id\)/);
  assert.match(sql, /m\.jogador_id=v_uid/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.domino_v2_minha_mao\(uuid\) FROM PUBLIC, anon/);
});

test('double-six deck contains exactly 28 distinct unordered pieces', () => {
  const deck = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) deck.push(`${a}-${b}`);
  }
  assert.equal(deck.length, 28);
  assert.equal(new Set(deck).size, 28);
});
