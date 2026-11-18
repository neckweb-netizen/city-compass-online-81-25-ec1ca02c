#!/usr/bin/env bash
# Only for GitHub Actions ephemeral PostgreSQL fixture. Never run against production.
set -euo pipefail
: "${PGDATABASE:?PGDATABASE must be set}"
if [[ "$PGDATABASE" != "domino_v2_ci" ]]; then
  echo "Refusing to run concurrency test outside the disposable domino_v2_ci database" >&2
  exit 1
fi

room="dddddddd-dddd-4ddd-8ddd-dddddddddddd"
player="11111111-1111-4111-8111-111111111111"
other="22222222-2222-4222-8222-222222222222"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

psql -X -q -v ON_ERROR_STOP=1 <<SQL
INSERT INTO public.domino_salas
(id,numero_sala,status,jogador_1_id,jogador_2_id,vez_usuario_id)
VALUES ('$room',4,'jogando','$player','$other','$player');
INSERT INTO private.domino_v2_salas_habilitadas (sala_id) VALUES ('$room');
SQL

# Session 1 acquires the room lock and deliberately holds it.
# Session 2 races the same idempotent RPC and must get false, not a second hand.
psql -X -qAt -v ON_ERROR_STOP=1 >"$tmp/deal-one" 2>"$tmp/deal-one.err" <<SQL &
BEGIN;
SET ROLE authenticated;
SET request.jwt.claim.sub = '$player';
SELECT id FROM public.domino_salas WHERE id='$room' FOR UPDATE;
SELECT pg_sleep(2);
SELECT public.domino_v2_iniciar_maos('$room');
COMMIT;
SQL
p1=$!
sleep 0.5
psql -X -qAt -v ON_ERROR_STOP=1 >"$tmp/deal-two" 2>"$tmp/deal-two.err" <<SQL &
SET ROLE authenticated;
SET request.jwt.claim.sub = '$player';
SELECT public.domino_v2_iniciar_maos('$room');
SQL
p2=$!
wait "$p1" || { cat "$tmp/deal-one.err" >&2; exit 1; }
wait "$p2" || { cat "$tmp/deal-two.err" >&2; exit 1; }
if ! grep -q '^t$' "$tmp/deal-one" || ! grep -q '^f$' "$tmp/deal-two"; then
  echo "Concurrent deal did not return true then false" >&2
  cat "$tmp/deal-one" "$tmp/deal-two" >&2
  exit 1
fi

psql -X -qAt -v ON_ERROR_STOP=1 <<SQL | grep -qx '14|7|7|14'
SELECT count(*)::text || '|' ||
  count(*) FILTER(WHERE jogador_id='$player')::text || '|' ||
  count(*) FILTER(WHERE jogador_id='$other')::text || '|' ||
  count(DISTINCT pedra)::text
FROM private.domino_v2_maos WHERE sala_id='$room';
SQL

# Both requests use exactly the same tile by the same player. The first
# transaction locks the room, plays the tile, then commits. The second must
# reject the attempt (either out-of-turn or already-consumed tile).
tile="$(psql -X -qAt -v ON_ERROR_STOP=1 -c "SELECT pedra FROM private.domino_v2_maos WHERE sala_id='$room' AND jogador_id='$player' ORDER BY pedra LIMIT 1")"
test -n "$tile"
psql -X -qAt -v ON_ERROR_STOP=1 >"$tmp/move-one" 2>"$tmp/move-one.err" <<SQL &
BEGIN;
SET ROLE authenticated;
SET request.jwt.claim.sub = '$player';
SELECT id FROM public.domino_salas WHERE id='$room' FOR UPDATE;
SELECT pg_sleep(2);
SELECT public.domino_v2_jogar('$room','$tile','esquerda');
COMMIT;
SQL
p1=$!
sleep 0.5
psql -X -qAt -v ON_ERROR_STOP=1 >"$tmp/move-two" 2>"$tmp/move-two.err" <<SQL &
SET ROLE authenticated;
SET request.jwt.claim.sub = '$player';
SELECT public.domino_v2_jogar('$room','$tile','esquerda');
SQL
p2=$!
wait "$p1" || { cat "$tmp/move-one.err" >&2; exit 1; }
if wait "$p2"; then
  echo "FAIL: concurrent replay of identical tile succeeded" >&2
  exit 1
fi
if ! grep -Eq 'Partida encerrada ou fora da vez|Esta peça não pertence à sua mão' "$tmp/move-two.err"; then
  echo "Unexpected concurrent rejection:" >&2
  cat "$tmp/move-two.err" >&2
  exit 1
fi

actual="$(psql -X -qAt -v ON_ERROR_STOP=1 <<SQL
SELECT
  (SELECT count(*) FROM private.domino_v2_maos WHERE sala_id='$room')::text || '|' ||
  (SELECT jsonb_array_length(historico_jogadas) FROM public.domino_salas WHERE id='$room')::text || '|' ||
  (SELECT count(*) FROM private.domino_v2_maos WHERE sala_id='$room' AND jogador_id='$player')::text || '|' ||
  (SELECT vez_usuario_id='$other' FROM public.domino_salas WHERE id='$room')::text;
SQL
)"
if [[ "$actual" != '13|1|6|true' ]]; then
  echo "FAIL: expected 13|1|6|true (remaining tiles|board tiles|player hand|next turn), received [$actual]" >&2
  echo "First move response: $(cat "$tmp/move-one")" >&2
  echo "Second move rejection: $(cat "$tmp/move-two.err")" >&2
  exit 1
fi
echo "PASS: two concurrent hand initiations yielded 14 unique tiles; concurrent replay made exactly one move."
