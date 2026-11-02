import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Ashkan's iPad pitch has just the two actionable product demos",()=>{
 const html=read("public/vision/index.html");
 assert.match(html,/Telefonhotline/);
 assert.match(html,/Mitarbeiterformular live testen/);
 assert.match(html,/Patientenformular öffnen/);
 assert.match(html,/Muster-PDF ansehen/);
 assert.doesNotMatch(html,/(ÄRZTEAUSLASTUNG|Praxisübersicht)/);
 assert.match(html,/\/vision\/hotline\//);
});
test("operator's form has all requested inputs and channel choices",()=>{
 const html=read("public/vision/hotline/index.html");
 for(const key of ["firstName","lastName","birthDate","phone","reason","notes","needPrescription","prescription","needCallback","callbackDoctor","needDocuments","documents","delivery","deliveryAddress","needAppointment","appointmentMode"])
   assert.ok(html.includes('name="'+key+'"'),key);
 for(const channel of ["E-Mail","Fax","WhatsApp","Post"])
   assert.ok(html.includes("<option>"+channel+"</option>"));
 assert.match(html,/Test-PIN anzeigen/);
 assert.match(html,/Keine echten Patientendaten/);
 assert.match(html,/Zurück zur Übersicht/);
});
test("both paths to SANA NEXT have a return path; iPad controls are senior-friendly",()=>{
 const root=read("public/index.html");
 const staff=read("public/vision/hotline/index.html");
 const css=read("public/accessible.css");
 assert.match(root,/class="back-to-presentation"/);
 assert.match(staff,/class="back"/);
 assert.match(root,/id="downloadPdf"/);
 assert.match(root,/src="\/pdf-summary.js"/);
 assert.match(css,/min-height:56px/);
 assert.match(css,/font-size:18px!important/);
 assert.doesNotMatch(root,/[↗↘↖↙→←]/);
});
test("PDF export is guarded by form validation, signature, and is local to device",()=>{
 const app=read("public/app.js"),staff=read("public/vision/hotline/hotline.js");
 const pdf=read("public/pdf-summary.js");
 assert.match(app,/downloadPdfBtn.addEventListener/);
 assert.match(app,/window.SanaPDF.collect\(form\)/);
 assert.match(app,/if\(!signed\)/);
 assert.match(app,/el.closest\('\[hidden\]'\)===steps\[i\]/);
 assert.match(staff,/window.SanaPDF.download/);
 assert.match(staff,/Keine SMS versendet/);
 assert.doesNotMatch(staff,/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
 assert.match(pdf,/URL.createObjectURL\(blob\)/);
 assert.doesNotMatch(pdf,/\bfetch\s*\(/);
});
test("PDF builder emits locally generated standard PDF bytes",async()=>{
 const file=read("public/pdf-summary.js");
 const ctx={scale(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(){},measureText(s){return {width:String(s).length*5};}};
 const created=[];
 const doc={createElement(tag){if(tag==="canvas"){const item={width:0,height:0,getContext:()=>ctx,toDataURL:()=>"data:image/jpeg;base64,/9j/2Q=="};created.push(item);return item;}return {};}};
 const local={};
 vm.runInNewContext(file,{document:doc,window:local,TextEncoder,Blob,Uint8Array,atob,URL,setTimeout,console});
 const pdf=local.SanaPDF.prepare({sections:[{title:"Test",rows:[["Name","Julia Berger"],["Notiz","Beispiel ".repeat(30)]]}]});
 const buf=new Uint8Array(await pdf.blob.arrayBuffer());
 assert.equal(String.fromCharCode(...buf.slice(0,8)),"%PDF-1.4");
 assert.ok(buf.length>400);
 const tail=new TextDecoder().decode(buf.slice(-100));
 assert.match(tail,/%%EOF$/);
 assert.ok(created.length>=1);
});
