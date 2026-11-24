import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source('src/lib/safeNavigation.ts'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { getSafeNotificationPath } = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`
);
const origin = 'https://sajtem.vercel.app';

test('notification links allow internal paths and same-site HTTPS urls only', () => {
  assert.equal(getSafeNotificationPath('/eventos', origin), '/eventos');
  assert.equal(getSafeNotificationPath('/notificacoes?tab=all#top', origin), '/notificacoes?tab=all#top');
  assert.equal(getSafeNotificationPath('https://sajtem.vercel.app/empresa', origin), '/empresa');
  assert.equal(getSafeNotificationPath('https://malicious.example/redirect', origin), null);
  assert.equal(getSafeNotificationPath('javascript:alert(1)', origin), null);
  assert.equal(getSafeNotificationPath('//malicious.example', origin), null);
  assert.equal(getSafeNotificationPath('/\\evil', origin), null);
  assert.equal(getSafeNotificationPath('https://sajtem.vercel.app.evil.example/', origin), null);
});

test('notification page, header and foreground toast share safe navigation', () => {
  for (const path of [
    'src/pages/Notifications.tsx',
    'src/components/layout/Header.tsx',
    'src/hooks/useNotifications.tsx',
    'src/contexts/PushNotificationsContext.tsx',
  ]) {
    assert.match(source(path), /getSafeNotificationPath/);
  }
  assert.doesNotMatch(source('src/components/layout/Header.tsx'), /window\.location\.assign\(notification\.action_url\)/);
});

test('notification actions preserve user scoping and communicate failure', () => {
  const hook = source('src/hooks/useNotifications.tsx');
  const page = source('src/pages/Notifications.tsx');
  assert.match(hook, /\.eq\('user_id', user\.id\)/);
  assert.match(hook, /markAllAsReadMutation\.isPending/);
  assert.match(page, /isProcessing/);
  assert.match(page, /Tentar novamente/);
  assert.match(page, /aria-label=\{`Arquivar notificação/);
});

test('notification recipient updates affect only reading and archive fields', () => {
  const sql = source('supabase/migrations/20261120213500_notification_recipient_status_permissions.sql');
  assert.match(sql, /grant update \(read, read_at, archived_at\) on public\.notifications to authenticated/);
  assert.doesNotMatch(sql, /grant update \(title/);
});

test('admin notification campaigns reject unsafe links and duplicate sends', () => {
  const admin = source('src/pages/admin/AdminAvisos.tsx');
  assert.match(admin, /sendingRef\.current/);
  assert.match(admin, /getSafeNotificationPath\(form\.actionUrl\)/);
  assert.match(admin, /loadError/);
  assert.match(admin, /Tentar novamente/);
});

test('push preferences are isolated when the authenticated account changes', () => {
  const push = source('src/contexts/PushNotificationsContext.tsx');
  assert.match(push, /setPreferencesReady\(false\);\s*setEnabled\(false\);\s*setPreferences\(defaultPreferences\);\s*setPushStateReady\(false\)/);
  assert.match(push, /setError\('Não foi possível carregar as preferências de notificação\.'\)/);
  assert.match(push, /if \(!active\) return;/);
});

test('notification preference load failures never opt in to push by default', () => {
  const push = source('src/contexts/PushNotificationsContext.tsx');
  assert.match(push, /setPreferences\(\{ \.\.\.defaultPreferences, in_app_enabled: false, push_enabled: false \}\)/);
  assert.match(push, /\.catch\(\(\) => \{\s*if \(!active\) return;/);
});


test('notifications can load beyond fifty and keep count scoped to active unarchived notices', () => {
  const hook = source('src/hooks/useNotifications.tsx');
  const page = source('src/pages/Notifications.tsx');
  assert.match(hook, /setPageSize\(previous => previous \+ 50\)/);
  assert.match(hook, /\.limit\(pageSize \+ 1\)/);
  assert.match(hook, /loaded\.slice\(0, pageSize\)/);
  assert.match(hook, /loaded\.length > pageSize/);
  assert.match(hook, /setPageSize\(50\)/);
  assert.match(page, /Carregar mais notificações/);
  assert.match(page, /hasMore &&/);
  assert.match(hook, /\.or\(`expires_at\.is\.null,expires_at\.gt\.\$\{new Date\(\)\.toISOString\(\)\}`\)/);
});

test('asynchronous notification preferences never update state after account switch', () => {
  const push = source('src/contexts/PushNotificationsContext.tsx');
  assert.match(push, /currentUserRef\.current = user\?\.id \?\? null/);
  assert.match(push, /const requestedUser = user\.id/);
  assert.match(push, /currentUserRef\.current !== requestedUser/);
  assert.match(push, /user_id: requestedUser/);
});
