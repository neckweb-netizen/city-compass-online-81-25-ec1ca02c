// HTTP-level test through a throwaway PostgREST service + PostgreSQL 17 fixture.
// The tokens and users here are fabricated and not related to Supabase production.
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

const base = process.env.DOMINO_V2_TEST_API || 'http://127.0.0.1:3001';
const secret = process.env.PGRST_JWT_SECRET;
assert.ok(secret && secret.length >= 32, 'A disposable test JWT secret is required');

const room = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const outsider = '33333333-3333-4333-8333-333333333333';
function token(id) {
  const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    role:'authenticated',sub:id,exp:Math.floor(Date.now()/1000)+600
  })).toString('base64url');
  const signed = header+'.'+body;
  return signed+'.'+createHmac('sha256',secret).update(signed).digest('base64url');
}
async function rpc(name, body, user) {
  const res = await fetch(base+'/rpc/'+name,{
    method:'POST',
    headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+token(user)}:{})},
    body:JSON.stringify(body)
  });
  let json;
  const responseText = await res.text();
  try { json=JSON.parse(responseText); } catch { json=responseText; }
  return {status:res.status,ok:res.ok,data:json};
}
function successful(result,description) {
  assert.equal(result.ok,true,description+': '+JSON.stringify(result));
}
function rejected(result,description) {
  assert.equal(result.ok,false,description+': '+JSON.stringify(result));
  assert.ok(result.status===401||result.status===403||result.status===404,description+': '+JSON.stringify(result));
}
const request={p_sala_id:room};
rejected(await rpc('domino_v2_iniciar_maos',request), 'Anonymous dealing');
rejected(await rpc('domino_v2_minha_mao',request), 'Anonymous hand access');
rejected(await rpc('domino_v2_iniciar_maos',request,outsider),'Nonparticipant dealing');
rejected(await rpc('domino_v2_minha_mao',request,outsider),'Nonparticipant reading');

const deal = await rpc('domino_v2_iniciar_maos',request,userA);
successful(deal,'Participant initiating deal');
assert.equal(deal.data,true,'Deal should be performed only once');
const retry=await rpc('domino_v2_iniciar_maos',request,userB);
successful(retry,'Participant retry');
assert.equal(retry.data,false,'Repeat should not reshuffle hands');

const handA=await rpc('domino_v2_minha_mao',request,userA);
const handB=await rpc('domino_v2_minha_mao',request,userB);
successful(handA,'Player A hand');successful(handB,'Player B hand');
assert.equal(handA.data.length,7);
assert.equal(handB.data.length,7);
const a=handA.data.map(x=>x.pedra),b=handB.data.map(x=>x.pedra);
assert.equal(new Set([...a,...b]).size,14,'Both hands must have unique tiles');
rejected(await rpc('domino_v2_jogar',{...request,p_pedra:b[0],p_lado:'direita'},userA),'Playing opponent tile');

const invalid = await rpc('domino_v2_jogar',{...request,p_pedra:'0-7',p_lado:'esquerda'},userA);
assert.equal(invalid.ok,false,'Malformed tile must fail');
const move=await rpc('domino_v2_jogar',{...request,p_pedra:a[0],p_lado:'esquerda'},userA);
successful(move,'Playing valid owned tile');
assert.equal(move.data.pecas_restantes,6);
assert.equal(move.data.proxima_vez_usuario_id,userB);

const after=await rpc('domino_v2_minha_mao',request,userA);
successful(after,'Hand after playing');
assert.equal(after.data.length,6);
assert.ok(!after.data.some(x=>x.pedra===a[0]),'Played piece must be removed');
rejected(await rpc('domino_v2_jogar',{...request,p_pedra:a[0],p_lado:'esquerda'},userA),'Replaying tile');
const timeout = await rpc('domino_v2_passar',{...request,p_motivo:'tempo'},userB);
assert.equal(timeout.status,400,'Untrusted timeout should return validation error 400');
assert.equal(timeout.data?.code,'22023');
console.log('PASS: HTTP JWT role isolation, both hands, anti-cheat move validation and replay rejection.');
