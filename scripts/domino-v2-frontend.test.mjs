import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../src/lib/dominoV2Client.ts', import.meta.url), 'utf8');
const screen = readFileSync(new URL('../src/components/domino/DominoTabuleiro.tsx', import.meta.url), 'utf8');

test('V2 opt-in requires both explicit flag and allowed room', () => {
  assert.match(client, /VITE_DOMINO_V2_ENABLED === 'true'/);
  assert.match(client, /VITE_DOMINO_V2_ALLOWED_ROOM_IDS/);
  assert.match(client, /permittedRoomIds\.has\(roomId\.toLowerCase\(\)\)/);
});

test('V2 calls server RPCs and avoids browser persistence', () => {
  for (const name of [
    'domino_v2_iniciar_maos', 'domino_v2_minha_mao',
    'domino_v2_jogar', 'domino_v2_passar',
  ]) assert.ok(client.includes(name), name);
  assert.match(screen, /if \(v2Enabled\) return; \/\/ V2 hands must never be saved in browser storage/);
  assert.match(screen, /if \(v2Enabled\) return; \/\/ The V2 server concludes and scores victories atomically/);
  assert.match(screen, /if \(v2Enabled\) return;\s*const \{ mesa, pontaE, pontaD, vezId \} = payload\.payload/);
  assert.match(screen, /if \(v2Enabled\) \{[\s\S]*?await jogarDominoV2/);
});

test('V2 disabled mode leaves legacy paths reachable', () => {
  assert.match(screen, /else if \(!v2Enabled\) \{[\s\S]*?inicializarPedrasCompartilhadas/);
  assert.match(screen, /if \(v2Enabled\) \{[\s\S]*?passarDominoV2\(salaId\)[\s\S]*?else \{[\s\S]*?'passar_vez_domino'/);
  assert.match(screen, /if \(v2Enabled\) \{[\s\S]*?jogarDominoV2\(salaId, pedra, ladoEscolha\)/);
});
