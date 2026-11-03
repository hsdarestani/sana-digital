import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as PDFLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {samplePatient,formFrom,hotlineSections} from './pdf-fixtures.mjs';
const scope={window:{PDFLib,fontkit},Uint8Array,Blob,Date,console,URL,fetch:async path=>({ok:true,arrayBuffer:async()=>new Uint8Array(await readFile(new URL('../public'+path,import.meta.url))).buffer})};
globalThis.window=scope.window;globalThis.fetch=scope.fetch;
vm.runInThisContext(await readFile(new URL('../public/pdf-summary.js',import.meta.url),'utf8'));
const pdf=scope.window.SanaPDF;
for(const kind of ['Patientenaufnahme','Hotline']){
 const options=kind==='Patientenaufnahme'?{title:'Digitale Patientenaufnahme',subtitle:'Muster mit fiktiven Angaben · Nicht an die Praxis übermittelt',sections:pdf.collect(formFrom({...samplePatient,occupation:'',heightCm:'',weightKg:'',conditionDetails:'',insuranceNumber:''})),signature:{sample:true}}:{title:'Telefonisches Anliegen',subtitle:'A+ Solution · Fiktives Gesprächsprotokoll · Nicht übermittelt',sections:hotlineSections,signoff:true};
 const result=await pdf.prepare({...options,createdAt:new Date('2026-11-03T09:00:00+01:00')});
 const path=new URL(`../public/assets/SANA_${kind}_Muster.pdf`,import.meta.url);
 await writeFile(path,new Uint8Array(await result.blob.arrayBuffer()));
 console.log(`${kind}: ${result.pageCount} A4-Seiten, ${result.blob.size} Bytes`);
}
