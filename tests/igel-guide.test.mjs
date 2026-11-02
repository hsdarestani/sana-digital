import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const file=readFileSync('public/igel-guide.js','utf8');
const patientHTML=readFileSync('public/index.html','utf8');
const app=readFileSync('public/app.js','utf8');
const db=readFileSync('migrations/0001_init.sql','utf8');
const win={};
runInNewContext(file,{window:win});
const guide=win.SanaIgelGuide;
test('IGeL guide follows nine voluntary questions before treatment',()=>{
  assert.equal(guide.questionCount,9);
  assert.match(guide.title,/IGeL/);
  assert.match(guide.html,/9 Fragen vor Ihrer Entscheidung/);
  assert.match(guide.html,/Nach der Behandlung/);
});
test('IGeL source attribution is present and transparently dated',()=>{
  assert.match(guide.html,/Bundesärztekammer/);
  assert.match(guide.html,/Kassenärztliche Bundesvereinigung/);
  assert.match(guide.html,/2012/);
  assert.match(guide.html,/2014/);
  assert.match(guide.html,/keine aktuelle rechtliche Prüfung/);
});
test('Guide loads before form and is user-optional',()=>{
  assert.ok(patientHTML.indexOf('/igel-guide.js')<patientHTML.indexOf('/app.js'));
  assert.match(patientHTML,/data-dialog="igelguide"/);
  assert.match(app,/window\.SanaIgelGuide\.init/);
  assert.doesNotMatch(patientHTML,/name="igel-question-/);
});
test('IGeL self-check responses never touch browser persistence or backend',()=>{
  assert.doesNotMatch(file,/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bfetch\s*\(|\bXMLHttpRequest\b/);
  assert.doesNotMatch(app,/data\.igelQuestion|data\.igelAnswers/);
  assert.doesNotMatch(db,/\bigel_question\b|\bigel_answer\b/i);
});

test('removed IGeL price list and SLAP treatment are not rendered or bundled',()=>{
  assert.doesNotMatch(patientHTML,/data-dialog="igel"|data-dialog="slap"/);
  assert.doesNotMatch(patientHTML,/Preisliste ansehen|Behandlungsplan ansehen|SLAP – Nachbehandlungsplan/);
  assert.doesNotMatch(app,/const igelRows|igel:\s*\{\s*title:|slap:\s*\{\s*title:|Fokussierte Stoßwellentherapie|Gilchrist/);
  assert.match(patientHTML,/data-dialog="igelguide"/);
});
