import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('global password recovery opens on Supabase event and validates the session', () => {
  const app = read('src/App.tsx');
  const recovery = read('src/components/auth/PasswordRecoveryHandler.tsx');
  const dialog = read('src/components/auth/AuthDialog.tsx');
  assert.match(app, /<PasswordRecoveryHandler \/>/);
  assert.match(dialog, /password_recovery=1/);
  assert.match(recovery, /event === 'PASSWORD_RECOVERY'/);
  assert.match(recovery, /supabase\.auth\.getUser\(\)/);
  assert.match(recovery, /supabase\.auth\.updateUser\(\{ password \}\)/);
  assert.match(recovery, /password\.length < 8/);
  assert.match(recovery, /password !== confirmation/);
  assert.match(recovery, /saving \? 'Salvando\.\.\.' : 'Atualizar senha'/);
});

test('signup prevents repeated submissions and clarifies email confirmation', () => {
  const auth = read('src/components/auth/AuthDialog.tsx');
  const signup = read('src/components/auth/SignUpDialog.tsx');
  for (const component of [auth, signup]) {
    assert.match(component, /if \(loading\) return;/);
    assert.match(component, /password\.length < 8/);
    assert.match(component, /Confira seu e-mail para confirmar a conta/);
  }
  assert.match(signup, /type="button"\s+aria-label=\{showPassword/);
  assert.match(signup, /emailRedirectTo/);
});

test('sign out clears the in-memory profile cache', () => {
  const auth = read('src/hooks/useAuth.tsx');
  assert.match(auth, /supabaseCache\.clear\(\);\s+window\.location\.href = '\/'/);
});
