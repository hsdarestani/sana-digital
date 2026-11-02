import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,capacity,metrics} from '../public/vision/model.js';
test('illustrative capacity values are independent of requests and patient intake',()=>{
  const state=initialState();
  assert.deepEqual(capacity('morning'),[6,3,2]);
  assert.deepEqual(capacity('afternoon'),[5,2,3]);
  assert.deepEqual(metrics(state),{requests:0,records:0,reviewed:0,occupied:11,total:18});
  assert.deepEqual(metrics(state,'afternoon'),{requests:0,records:0,reviewed:0,occupied:10,total:18});
});
test('human-managed requests and reviewed intake update only the intended metrics',()=>{
 const state=initialState(); state.request={kind:'callback'};
 assert.equal(metrics(state).requests,1);
 state.intake={support:'Barrierearmer Zugang'};
 state.reviewed=true;
 assert.equal(metrics(state).records,1);
 assert.equal(metrics(state).reviewed,1);
 state.callbackDone=true;
 assert.equal(metrics(state).requests,0);
});
test('vision contains no AI assistant, booking workflow, arrow glyphs or backend calls',()=>{
 const js=readFileSync(new URL('../public/vision/vision.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/vision/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(js,/\b(speechSynthesis|reserve|book|Anruf annehmen|KI-Empfang|KI-Telefonassistenz|data-action="call")\b/i);
 assert.doesNotMatch(js,/[↗↘↖↙→←↺]/);
 assert.doesNotMatch(html,/[↗↘↖↙→←↺]/);
 assert.doesNotMatch(js,/\b(fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage)\b/);
 assert.match(js,/Doctolib/);
 assert.match(js,/href="\/" target="_blank" rel="noopener"/);
});
