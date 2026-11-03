import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as PDFLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {samplePatient,formFrom,hotlineSections} from '../scripts/pdf-fixtures.mjs';
globalThis.window={PDFLib,fontkit};
globalThis.fetch=async path=>{assert.match(path,/^\/assets\/(fonts\/DejaVuSans(?:-Bold)?\.ttf|sana-logo\.png)$/);const b=readFileSync(new URL('../public'+path,import.meta.url));return {ok:true,arrayBuffer:async()=>new Uint8Array(b).buffer};};
vm.runInThisContext(readFileSync(new URL('../public/pdf-summary.js',import.meta.url),'utf8'));
const pdf=window.SanaPDF;
const squash=s=>s.replace(/\s/g,'');
async function inspect(bytes){
 const doc=await getDocument({data:new Uint8Array(bytes),useSystemFonts:false}).promise;
 const texts=[],values=[];
 for(let i=1;i<=doc.numPages;i++){
  const p=await doc.getPage(i),content=await p.getTextContent();
  assert.ok(Math.abs(p.view[2]-595.28)<.1);assert.ok(Math.abs(p.view[3]-841.89)<.1);
  const text=content.items.filter(x=>x.str).map(x=>x.str).join(' ');
  assert.ok(text.length>180,'no empty or footer-only pages');
  assert.ok(text.includes(`Seite ${i} von ${doc.numPages}`));
  for(const item of content.items){if(!item.str)continue;assert.ok(item.transform[4]>=43,'left margin');assert.ok(item.transform[4]+item.width<=552.4,'right edge: '+item.str);assert.ok(item.transform[5]>=15,'footer edge');}
  texts.push(text);values.push(content.items.filter(x=>x.str&&x.transform[4]>=225&&x.transform[5]>76&&x.transform[5]<682).map(x=>x.str).join(' '));
 }
 return {text:texts.join(' '),values:values.join(' ')};
}
test('every patient answer has its correct human label; sensitive hidden/voluntary IGeL answers are excluded',()=>{
 const data={...samplePatient,guardianFirstName:'Änne',guardianLastName:'Groß',guardianBirthDate:'1980-02-03',guardianRelation:'Mutter',guardianAddress:'Großstraße 3',guardianAuthorityConfirm:true,externalBillingConsent:true,informationConsent:true};
 const sections=pdf.collect(formFrom(data)),flat=sections.flatMap(x=>x.rows);
 for(const [key,value]of Object.entries(data))if(typeof value==='string'&&value)assert.ok(flat.some(([label,answer])=>answer===(key.toLowerCase().includes('birthdate')?pdf.formatDate(value):value)),key);
 assert.ok(flat.some(([key,value])=>key==='Vorerkrankungen'&&value==='Bluthochdruck'));
 const without=pdf.collect(formFrom({...data,medications:'nein',medicationDetails:'HIDDEN_MUST_NOT_EXPORT'}));
 assert.ok(!JSON.stringify(without).includes('HIDDEN_MUST_NOT_EXPORT'));
 assert.doesNotMatch(JSON.stringify(sections),/accuracyConfirm|informationConsent|guardianFirstName|website/);
});
test('PDFs preserve long text, German umlauts, long tokens and trailing answers without clipping',async()=>{
 const long='Ärztliche Rücksprache: Größe, Füße, Überweisung. '+('Langtext '.repeat(140))+'ENDE_ÜMLAUT_ß';
 const token='Adresse_'+('Ä'.repeat(250))+'_ENDE';
 const sections=[...pdf.collect(formFrom({...samplePatient,medicationDetails:long,conditionDetails:token})),{title:'Zusätzliche Notiz',rows:[['Nachtrag',long]]}];
 const result=await pdf.prepare({title:'Digitale Patientenaufnahme',sections,signature:{sample:true}});
 const {text,values}=await inspect(await result.blob.arrayBuffer());
 for(const answer of [long,token,'Müller','Bürokauffrau','18.09.1972'])assert.ok(squash(values).includes(squash(answer)),answer.slice(0,35));
 assert.equal((text.match(/ENDE_ÜMLAUT_ß/g)||[]).length,2);
 assert.match(text,/Beispielunterschrift/);
});
test('both downloadable samples are valid compact A4 documents with searchable data and full pagination',async()=>{
 for(const kind of ['Patientenaufnahme','Hotline']){
  const b=readFileSync(new URL(`../public/assets/SANA_${kind}_Muster.pdf`,import.meta.url));const doc=await PDFLib.PDFDocument.load(b);assert.equal(doc.getPageCount(),2);
  const {text}=await inspect(b);assert.match(text,/Müller/);assert.match(text,/Nicht an die Praxis übermittelt/);
 }
});
test('hotline fields and handover notes all survive PDF layout',async()=>{
 const sections=structuredClone(hotlineSections);sections[1].rows.push(['Lange Gesprächsnotiz','Rezept, Rückruf und Unterlagen. '.repeat(48)+'SCHLUSS_ÄÖÜ']);
 const result=await pdf.prepare({title:'Telefonisches Anliegen',sections,signoff:true});const {text,values}=await inspect(await result.blob.arrayBuffer());
 for(const section of sections)for(const [label,value]of section.rows)assert.ok(squash(values).includes(squash(value)),label);
 assert.match(text,/Bearbeitung \/ Kürzel/);assert.match(text,/SCHLUSS_ÄÖÜ/);
});
