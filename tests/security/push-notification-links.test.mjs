import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../public/sw.js',import.meta.url),'utf8');
const start = source.indexOf('const safeNotificationTarget =');
const end = source.indexOf("self.addEventListener('notificationclick'",start);
assert.ok(start >= 0 && end > start);
const self = {location:{origin:'https://sajtem.vercel.app'}};
const {safeNotificationTarget} = runInNewContext(
  source.slice(start,end) + '\n({safeNotificationTarget})',
  {self,URL},
);

test('keeps internal notification routes',()=>{
  assert.equal(safeNotificationTarget('/notificacoes'),'https://sajtem.vercel.app/notificacoes');
  assert.equal(safeNotificationTarget('/empresa-dashboard'),'https://sajtem.vercel.app/empresa-dashboard');
});
test('refuses cross-origin, script and malformed targets',()=>{
  for(const value of ['https://attacker.example/login','//attacker.example/','javascript:alert(1)','https://sajtem.vercel.app.attacker.example','http://sajtem.vercel.app/login','http://[']) {
    assert.equal(safeNotificationTarget(value),'https://sajtem.vercel.app/notificacoes');
  }
});
