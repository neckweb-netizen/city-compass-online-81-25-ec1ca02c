import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const footer = readFileSync(new URL('../src/components/ui/watermark.tsx', import.meta.url), 'utf8');

test('rodapé mostra Deivid sem a assinatura antiga', () => {
  assert.match(footer, /aria-label="Desenvolvido por Deivid"/);
  assert.match(footer, />\s*Deivid\s*</);
  assert.doesNotMatch(footer, /David Jorge|footer-crown-gold/);
});

test('rodapé utiliza o vídeo original da coroa com reprodução silenciosa', () => {
  assert.match(footer, /<video[\s\S]*?autoPlay[\s\S]*?loop[\s\S]*?muted[\s\S]*?playsInline/);
  assert.match(footer, /src="data:video\/webm;base64,[A-Za-z0-9+/=]+"/);
  assert.match(footer, /aria-label="Coroa dourada original girando"/);
});

test('rodapé preserva navegação de privacidade, termos e tutorial', () => {
  assert.match(footer, /to="\/politica-de-privacidade"/);
  assert.match(footer, /to="\/termos-de-uso"/);
  assert.match(footer, /sajtem:start-visitor-tour/);
});
