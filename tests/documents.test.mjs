import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const app = readFileSync(new URL('../public/documents/app.js', import.meta.url), 'utf8');
const page = readFileSync(new URL('../public/documents/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../public/documents/styles.css', import.meta.url), 'utf8');
const staff = readFileSync(new URL('../public/admin/admin.js', import.meta.url), 'utf8');

test('Document studio JavaScript parses', () => {
  assert.doesNotThrow(() => new Script(app, {filename: 'documents/app.js'}));
});

test('All three templates and PDF preview are present', () => {
  for (const type of ['school', 'attest', 'report']) {
    assert.match(page, new RegExp('data-type="' + type + '"'));
  }
  for (const id of ['outPatient', 'outContent', 'outClinician', 'reviewConfirm', 'printBottom']) {
    assert.ok(page.includes('id="' + id + '"'));
  }
  assert.match(css, /@page\s*\{size:A4/);
  assert.match(css, /@media print/);
});

test('No patient data is serialized into links or persisted in browser storage', () => {
  assert.match(app, /new URLSearchParams\(location\.search\)\.get\('record'\)/);
  assert.match(app, /api\/admin\/records\//);
  assert.match(app, /state\.drafts = blankDrafts\(\)/);
  assert.doesNotMatch(app, /localStorage|sessionStorage|indexedDB/);
  assert.match(staff, /\/documents\/\?record=/);
});

test('Print requires review and still prints clearly marked unsigned draft', () => {
  assert.match(app, /reviewConfirm'\)\.checked/);
  assert.match(app, /window\.print\(\)/);
  assert.match(page, />ENTWURF</);
  assert.match(page, /Unterschrift der behandelnden Ärztin/);
});
