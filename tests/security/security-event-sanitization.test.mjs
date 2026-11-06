import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../supabase/functions/log-security-event/index.ts',import.meta.url),'utf8');
const start = source.indexOf('const ALLOWED_EVENTS =');
const end = source.indexOf('\nDeno.serve(',start);
assert.ok(start >= 0 && end > start);
const snippet = source.slice(start,end);
const javascript = ts.transpileModule(snippet,{
  compilerOptions: {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}
}).outputText;
class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
const { sanitizeSecurityMetadata } = runInNewContext(javascript+'\n({sanitizeSecurityMetadata})',{HttpError});

test('discards PII and arbitrary browser metadata',()=>{
  const out=sanitizeSecurityMetadata('user_creation',{
    account_type:'usuario',email:'secret@example.invalid',ip_address:'1.2.3.4',
    token:'secret',password:'nope',metadata:{nested:'secret'},
  });
  assert.equal(out.account_type,'usuario');
  for(const key of ['email','ip_address','token','password','metadata'])
    assert.equal(Object.hasOwn(out,key),false);
});

test('rejects fabricated event types, malformed metadata, privilege strings',()=>{
  assert.throws(()=>sanitizeSecurityMetadata('payment_approved',{}),e=>e.status===400);
  assert.throws(()=>sanitizeSecurityMetadata('login_success','hello'),e=>e.status===400);
  assert.equal(Object.hasOwn(sanitizeSecurityMetadata('logout',{account_type:'root'}),'account_type'),false);
});

test('accepts empty metadata',()=>{
  assert.equal(Object.keys(sanitizeSecurityMetadata('logout',undefined)).length,0);
});
