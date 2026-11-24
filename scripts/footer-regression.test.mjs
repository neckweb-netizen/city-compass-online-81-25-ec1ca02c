import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const footer = readFileSync(new URL('../src/components/ui/watermark.tsx', import.meta.url), 'utf8');

test('rodapé mostra Deivid sem a assinatura antiga', () => {
  assert.match(footer, /aria-label="Desenvolvido por Deivid"/);
  assert.match(footer, />\s*Deivid\s*</);
  assert.doesNotMatch(footer, /David Jorge|footer-crown-gold/);
});

test('rodapé exibe a coroa original em arquivo público e anima sem vídeo embutido', () => {
  assert.match(footer, /src="\/deivid-crown\.png"/);
  assert.match(footer, /deivid-crown-spin_2s_linear_infinite/);
  assert.match(footer, /@keyframes deivid-crown-spin/);
  assert.doesNotMatch(footer, /data:video\/webm;base64,/);
});

test('rodapé preserva navegação de privacidade, termos e tutorial', () => {
  assert.match(footer, /to="\/politica-de-privacidade"/);
  assert.match(footer, /to="\/termos-de-uso"/);
  assert.match(footer, /sajtem:start-visitor-tour/);
});
