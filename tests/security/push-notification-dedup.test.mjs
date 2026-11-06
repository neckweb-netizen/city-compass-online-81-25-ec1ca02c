import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const text = readFileSync(new URL('../../src/lib/notificationToastDedup.ts',import.meta.url),'utf8');
const js = ts.transpileModule(text,{compilerOptions:{
  target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS
}}).outputText;
const exports = {};
runInNewContext(js,{exports,Date,Map});
const { shouldShowNotificationToast } = exports;

test('shows a unique push notification once across both foreground sources',()=>{
  assert.equal(shouldShowNotificationToast('notification-test-a'),true);
  assert.equal(shouldShowNotificationToast('notification-test-a'),false);
  assert.equal(shouldShowNotificationToast('notification-test-b'),true);
});

test('does not silence unrelated messages lacking an id',()=>{
  assert.equal(shouldShowNotificationToast(undefined),true);
  assert.equal(shouldShowNotificationToast(null),true);
});

test('allows the same notification after deduplication window',()=>{
  class MockDate extends Date {static now(){return 1_000_000}}
  const scoped = {exports:{},Date:MockDate,Map};
  runInNewContext(js,scoped);
  assert.equal(scoped.exports.shouldShowNotificationToast('repeat-id'),true);
  assert.equal(scoped.exports.shouldShowNotificationToast('repeat-id'),false);
  MockDate.now = () => 1_061_000;
  assert.equal(scoped.exports.shouldShowNotificationToast('repeat-id'),true);
});
