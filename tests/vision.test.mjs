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


test('first-time visitors can see all five topics and enter any chapter directly',()=>{
 const js=readFileSync(new URL('../public/vision/vision.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/vision/index.html',import.meta.url),'utf8');
 const topics=['Empfang & Rückrufe','Ärzteauslastung','Digitale Aufnahme','Praxisübersicht','SANA 2028'];
 for(const title of topics) assert.ok(js.includes(title),title);
 assert.match(js,/class="entry-card" data-scene=/);
 assert.match(js,/Geführte Präsentation starten/);
 assert.match(js,/Ein Thema auswählen/);
 assert.match(js,/Probieren: Anliegen auswählen/);
 assert.match(js,/Probieren: Vormittag und Nachmittag vergleichen/);
 assert.match(js,/case 'overview':guided=false;go\(-1\)/);
 assert.ok(html.indexOf('class="chapter-nav"')<html.indexOf('id="stage"'));
});
test('light Sana blue branding and navigable controls have no arrows',()=>{
 const css=readFileSync(new URL('../public/vision/vision.css',import.meta.url),'utf8');
 assert.match(css,/color-scheme:light/);
 assert.match(css,/--mint:#087eaf/);
 assert.match(css,/\.entry-grid/);
 assert.match(css,/\.chapter-nav\{position:sticky;top:0/);
});

test('human reception is a connected workflow instead of a cartoon or AI assistant',()=>{
 const js=readFileSync(new URL('../public/vision/vision.js',import.meta.url),'utf8');
 assert.match(js,/reception-process/);
 assert.match(js,/reception-screen/);
 assert.match(js,/case 'to-command':go\(3\)/);
 assert.doesNotMatch(js,/staff-avatar|human-art|speechSynthesis/);
 assert.doesNotMatch(js,/data-action="book"/);
});
test('responsive chapter navigation uses a native selector without emoji arrows',()=>{
 const js=readFileSync(new URL('../public/vision/vision.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/vision/index.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../public/vision/atelier.css',import.meta.url),'utf8');
 assert.match(js,/mobile-chapter-select/);
 assert.match(js,/desktop-chapters/);
 assert.match(js,/case 'overview':guided=false;go\(-1\)/);
 assert.match(html,/\/vision\/atelier\.css/);
 assert.match(css,/\.mobile-chapters\{display:flex/);
 assert.match(css,/\.reception-stage/);
 assert.doesNotMatch(js+html,/[↗↘↖↙→←↺]/);
});
