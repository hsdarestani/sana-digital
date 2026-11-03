import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the presentation opens exactly two demos and a native sample PDF',()=>{
 const html=read('public/vision/index.html');
 assert.match(html,/Telefonservice erleben/);assert.match(html,/Patientenaufnahme starten/);
 assert.match(html,/href="\/vision\/hotline\/"/);assert.match(html,/href="\/\?demo=1"/);
 assert.match(html,/href="\/assets\/SANA_Patientenaufnahme_Muster.pdf"/);
 assert.doesNotMatch(html,/(KI-Empfang|Command Center|SANA 2028|Ärzteauslastung)/);
});
test('the hotline retains every requested field and does not send or persist form data',()=>{
 const html=read('public/vision/hotline/index.html'),js=read('public/vision/hotline/hotline.js');
 for(const key of ['firstName','lastName','birthDate','phone','reason','notes','needPrescription','prescription','needCallback','callbackDoctor','needDocuments','documents','delivery','deliveryAddress','needAppointment','appointmentMode'])assert.ok(html.includes('name="'+key+'"'),key);
 for(const channel of ['E-Mail','Fax','WhatsApp','Post'])assert.ok(html.includes(channel==='E-Mail'?'<option value="E-Mail">E Mail</option>':'<option>'+channel+'</option>'));
 assert.match(html,/SMS Verfahren als optionale Simulation/);assert.match(html,/Zurück zur Übersicht/);
 assert.doesNotMatch(js,/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
});
test('presentation intake is always non-submitting; activation and consents stay separate',()=>{
 const app=read('public/app.js'),html=read('public/index.html');
 assert.match(app,/if\(presentationDemo\)throw/);assert.match(app,/if\(!intakeEnabled\)/);
 assert.match(app,/window.SanaPDF.collect\(form\)/);assert.match(app,/if\(!signed\)/);
 for(const optional of ['externalBillingConsent','informationConsent'])assert.doesNotMatch(html,new RegExp('name="'+optional+'"[^>]*required'));
});
