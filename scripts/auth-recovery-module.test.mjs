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


test('auth does not silently recreate missing historical profiles or claim successful login', () => {
  const auth = read('src/hooks/useAuth.tsx');
  assert.doesNotMatch(auth, /const createUserProfile =/);
  assert.doesNotMatch(auth, /\.from\('usuarios'\)\s*\.insert\(/);
  assert.match(auth, /Conta de Auth sem perfil histórico/);
  assert.match(auth, /if \(!userProfile\) \{/);
  assert.match(auth, /Conta autenticada, mas não foi possível carregar seu perfil/);
});


test('all auth entry points deny missing profiles and sign out incomplete sessions', () => {
  const base = read('src/hooks/useAuth.tsx');
  const secure = read('src/hooks/useSecureAuth.tsx');
  const route = read('src/components/auth/ProtectedRoute.tsx');
  assert.match(base, /await supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
  assert.match(secure, /await supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
  assert.doesNotMatch(secure, /const createUserProfile =/);
  assert.doesNotMatch(secure, /\.from\('usuarios'\)\s*\.insert\(/);
  assert.match(secure, /Contas históricas sem/);
  assert.match(route, /const \{ user, profile, loading \} = useAuth\(\)/);
  assert.match(route, /if \(!user \|\| !profile\)/);
});


test('secure auth ignores old profile lookups after account changes and never leaks uncaught fetch errors', () => {
  const hook = read('src/hooks/useSecureAuth.tsx');
  assert.match(hook, /let requestSequence = 0/);
  assert.match(hook, /requestSequence === sequence/);
  assert.match(hook, /if \(profileTimer\) clearTimeout\(profileTimer\)/);
  assert.match(hook, /setProfile\(null\);\s*setLoading\(!!session\?\.user\)/);
  assert.match(hook, /Falha ao consultar perfil de autenticação/);
});
