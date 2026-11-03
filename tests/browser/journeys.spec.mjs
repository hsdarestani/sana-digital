import {test as base,expect} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const root=fileURLToPath(new URL('../../public/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.pdf':'application/pdf','.ttf':'font/ttf'};
const headers=await readFile(path.join(root,'_headers'),'utf8');
const csp=headers.match(/Content-Security-Policy: (.+)/)[1];
const test=base.extend({site:async({context,page},use)=>{
 const requests=[],errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 // Run the shipped files, CSP and actual font assets entirely offline. No test server,
 // DNS, external integration or real patient data is involved.
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());requests.push({method:req.method(),path:url.pathname});
  if(url.origin!=='https://sana.test'){await route.abort();return;}
  if(req.method()!=='GET'){await route.fulfill({status:403,body:'Test forbids writes'});return;}
  if(url.pathname==='/api/config'){await route.fulfill({contentType:'application/json',body:JSON.stringify({enabled:true,turnstileSiteKey:null})});return;}
  const pathname=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
  try{const bytes=await readFile(path.join(root,decodeURIComponent(pathname)));await route.fulfill({status:200,body:bytes,contentType:types[path.extname(pathname)]||'application/octet-stream',headers:{'Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}});}
  catch{await route.fulfill({status:404,body:'Not found'});}
 });
 await use({page,requests,errors});expect(errors).toEqual([]);expect(requests.filter(r=>r.method!=='GET')).toEqual([]);
}});
async function noOverflow(page){const result=await page.evaluate(()=>({pixels:document.documentElement.scrollWidth-window.innerWidth,scrollX:window.scrollX,bodyWidth:document.body.scrollWidth,overflowNodes:[...document.querySelectorAll('body *')].filter(el=>el.clientWidth>0&&el.scrollWidth>el.clientWidth+1).slice(0,18).map(el=>({tag:el.tagName,id:el.id,name:el.name,scroll:el.scrollWidth,width:el.clientWidth})),client:document.documentElement.clientWidth,vv:window.visualViewport?{width:visualViewport.width,scale:visualViewport.scale,left:visualViewport.offsetLeft}:null,nodes:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>window.innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,name:el.name||el.className,right:el.getBoundingClientRect().right}))}));expect(result.pixels,JSON.stringify(result)).toBeLessThanOrEqual(1);}
async function textFrom(file){const doc=await getDocument({data:new Uint8Array(await readFile(file)),useSystemFonts:false}).promise;let s='',values='';for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i);expect(p.view[2]).toBeCloseTo(595.28,1);expect(p.view[3]).toBeCloseTo(841.89,1);const content=await p.getTextContent();s+=content.items.map(i=>i.str||'').join(' ')+' ';values+=content.items.filter(i=>i.str&&i.transform[4]>=225&&i.transform[5]>76&&i.transform[5]<682).map(i=>i.str).join(' ')+' ';}return {text:s,values};}
async function saveDownload(page,button,info,name){const wait=page.waitForEvent('download');await button.click();const download=await wait;const file=info.outputPath(name+'.pdf');await download.saveAs(file);await expect(page.locator('#pdfResult')).toBeVisible();return textFrom(file);}

test('presentation: both one-click entries, return paths, sample PDF and responsive layout',async({site},info)=>{
 const {page,requests}=site;await page.goto('/vision/');await expect(page.getByRole('heading',{level:1})).toHaveText('Mehr Zeit.Für Ihre Patienten.');
 await noOverflow(page);await expect(page.getByRole('link',{name:'Telefonservice erleben'})).toBeInViewport();await expect(page.getByRole('link',{name:'Patientenaufnahme starten'})).toBeVisible();
 const buttonHeights=await page.locator('.button').evaluateAll(items=>items.map(el=>el.getBoundingClientRect().height));expect(buttonHeights.every(x=>x>=44)).toBeTruthy();
 await page.screenshot({path:info.outputPath('vision.png'),fullPage:true});
 await page.getByRole('link',{name:'Telefonservice erleben'}).click();await expect(page.locator('#callForm')).toBeVisible();await noOverflow(page);
 await page.getByRole('link',{name:'Zurück zur Übersicht',exact:true}).click();await page.getByRole('link',{name:'Patientenaufnahme starten'}).click();
 await expect(page.locator('#previewNotice')).toBeVisible();await expect(page.locator('#fillPatientDemo')).toBeVisible();await noOverflow(page);
 await page.getByRole('link',{name:'Zurück zu SANA NEXT'}).click();await page.getByRole('link',{name:'Muster-PDF ansehen'}).click();
 await expect.poll(()=>requests.some(r=>r.path.endsWith('SANA_Patientenaufnahme_Muster.pdf'))).toBeTruthy();
});

test('hotline: required fields, every conditional, delivery channel, PIN invalidation, summary and real PDF download',async({site},info)=>{
 const {page}=site;await page.goto('/vision/hotline/');await page.getByRole('button',{name:'PDF-Zusammenfassung erstellen'}).click();await expect(page.locator('[name=firstName]')).toHaveAttribute('aria-invalid','true');
 for(const [reason,box]of [['Rezept','needPrescription'],['Rückruf vom Arzt','needCallback'],['Unterlagen','needDocuments'],['Terminanfrage','needAppointment']]){await page.getByRole('button',{name:'Formular leeren'}).click();await page.locator('[name=reason]').selectOption(reason);await expect(page.locator(`[name=${box}]`)).toBeChecked();}
 await page.getByRole('button',{name:'Beispiel laden',exact:true}).click();
 for(const [box,child]of [['needPrescription','prescription'],['needCallback','callbackDoctor'],['needDocuments','documents'],['needAppointment','appointmentMode']]){
  await page.locator(`[name=${box}]`).uncheck();await expect(page.locator(`[name=${child}]`)).not.toBeVisible();await expect(page.locator(`[name=${child}]`)).toBeDisabled();
  await page.locator(`[name=${box}]`).check();await page.getByRole('button',{name:'PDF-Zusammenfassung erstellen'}).click();await expect(page.locator(`[name=${child}]`)).toHaveAttribute('aria-invalid','true');await page.getByRole('button',{name:'Beispiel laden',exact:true}).click();
 }
 for(const option of ['E-Mail','Fax','WhatsApp','Post']){await page.locator('[name=delivery]').selectOption(option);await expect(page.locator('#liveSummary')).toContainText(option);}
 await page.locator('[name=delivery]').selectOption('E-Mail');
 for(const option of await page.locator('[name=appointmentMode] option').allTextContents()){if(option==='Bitte auswählen')continue;await page.locator('[name=appointmentMode]').selectOption({label:option});await expect(page.locator('#liveSummary')).toContainText(option);}
 await page.locator('[name=appointmentMode]').selectOption({label:'Terminanfrage für das Praxisteam aufnehmen'});
 await page.getByRole('button',{name:'Prüfen',exact:true}).click();await expect(page.locator('#verifiedLabel')).toContainText('PIN falsch');
 await page.getByRole('button',{name:'Test-PIN anzeigen'}).click();const pin=(await page.locator('#demoPin').textContent()).match(/\d{6}/)[0];
 await page.locator('#pinInput').fill(pin);await page.getByRole('button',{name:'Prüfen',exact:true}).click();await expect(page.locator('#verifiedLabel')).toContainText('Demo-PIN korrekt');
 await page.locator('[name=phone]').fill('+49 170 0000001');await expect(page.locator('#verifiedLabel')).toContainText('Nicht geprüft');
 const long='Füße, Größe, Rückruf. '+('Ärzte '.repeat(210))+' ENDE_HOTLINE_ÄÖÜ';await page.locator('[name=notes]').fill(long);await expect(page.locator('#liveSummary')).toContainText(long);
 await noOverflow(page);const {text,values}=await saveDownload(page,page.getByRole('button',{name:'PDF-Zusammenfassung erstellen'}),info,'hotline');
 for(const value of ['Müller','18.09.1972','Folgerezept','Dr. Wickler','julia.mueller@example.invalid','ENDE_HOTLINE_ÄÖÜ'])expect(text).toContain(value);
 expect(values.replace(/\s/g,'')).toContain(long.replace(/\s/g,''));
 await page.getByRole('button',{name:'Formular leeren'}).click();await expect(page.locator('[name=firstName]')).toHaveValue('');await expect(page.locator('#pdfResult')).not.toBeVisible();
});

test('patient intake: four steps, validation, optional consents, editing, signature and complete PDF',async({site},info)=>{
 const {page,requests}=site;await page.goto('/?demo=1');await page.locator('#nextBtn').click();await expect(page.locator('[name=firstName]')).toHaveAttribute('aria-invalid','true');
 await page.locator('#fillPatientDemo').click();await page.locator('[name=email]').fill('invalid');await page.locator('#nextBtn').click();await expect(page.locator('[name=email]')).toHaveAttribute('aria-invalid','true');await page.locator('[name=email]').fill('julia.mueller@example.invalid');
 await page.locator('#nextBtn').click();await expect(page.locator('[data-step="1"]')).toBeVisible();
 for(const [name,child,example]of [['sports','sportsDetails','Schwimmen'],['allergies','allergyDetails','Penicillin (fiktiv)'],['operations','operationDetails','Knieoperation im März 2018 (fiktiv)'],['smoking','cigarettesPerDay','4']]){await page.locator(`[name=${name}][value=ja]`).check();await expect(page.locator(`[name=${child}]`)).toBeEnabled();await page.locator(`[name=${child}]`).fill(example);await page.locator(`[name=${name}][value=nein]`).check();await expect(page.locator(`[name=${child}]`)).toHaveValue('');await expect(page.locator(`[name=${child}]`)).toBeDisabled();if(name!=='smoking'){await page.locator(`[name=${name}][value=ja]`).check();await page.locator(`[name=${child}]`).fill(example);}}
 const long='Ärztliche Prüfung: Füße, Größe. '+('Medikament '.repeat(120))+' ENDE_PATIENT_ÄÖÜ';await page.locator('[name=medicationDetails]').fill(long);
 await page.locator('[name=medications][value=nein]').check();await expect(page.locator('[name=medicationDetails]')).toHaveValue('');await expect(page.locator('[name=medicationDetails]')).toBeDisabled();
 await page.locator('[name=medications][value=ja]').check();await page.locator('#nextBtn').click();await expect(page.locator('[name=medicationDetails]')).toHaveAttribute('aria-invalid','true');await page.locator('[name=medicationDetails]').fill(long);await page.locator('#nextBtn').click();
 await expect(page.locator('[data-step="2"]')).toBeVisible();await expect(page.locator('[name=externalBillingConsent]')).not.toBeChecked();await expect(page.locator('[name=informationConsent]')).not.toBeChecked();
 for(const key of ['privacy','billing']){await page.locator(`[data-dialog=${key}]`).click();await expect(page.locator('#detailDialog')).toBeVisible();await page.locator('#doneDialog').click();await expect(page.locator('#detailDialog')).not.toBeVisible();}
 await page.locator('#nextBtn').click();await expect(page.locator('[data-step="3"]')).toBeVisible();await page.locator('#backBtn').click();await expect(page.locator('[data-step="2"]')).toBeVisible();await page.locator('#nextBtn').click();
 await expect(page.locator('[data-step="3"]')).toBeVisible();await expect(page.locator('#review')).toContainText('Keine Einwilligung erteilt');await expect(page.locator('#review')).toContainText('ENDE_PATIENT_ÄÖÜ');
 await page.locator('#downloadPdf').click();await expect(page.locator('#formError')).toContainText('Pflichtfelder');await page.locator('[name=accuracyConfirm]').check();await page.locator('#downloadPdf').click();await expect(page.locator('#formError')).toContainText('unterschreiben');
 await page.locator('#signature').scrollIntoViewIfNeeded();const b=await page.locator('#signature').boundingBox();await page.mouse.move(b.x+30,b.y+65);await page.mouse.down();await page.mouse.move(b.x+70,b.y+38);await page.mouse.move(b.x+110,b.y+90);await page.mouse.move(b.x+175,b.y+55);await page.mouse.up();
 await noOverflow(page);const {text,values}=await saveDownload(page,page.locator('#downloadPdf'),info,'patient');
 for(const v of ['Müller','18.09.1972','Bürokauffrau','Penicillin','März 2018','Keine Einwilligung erteilt','Unterschrift aus dem Formular','ENDE_PATIENT_ÄÖÜ'])expect(text).toContain(v);
 expect(values.replace(/\s/g,'')).toContain(long.replace(/\s/g,''));await expect(page.locator('#submitBtn')).toBeDisabled();expect(requests.some(r=>r.path==='/api/config')).toBeFalsy();
 await page.locator('#review .review-edit').first().click();await expect(page.locator('[data-step="0"]')).toBeVisible();await expect(page.locator('[name=firstName]')).toHaveValue('Julia');
});

test('patient intake: future dates and minors cannot bypass guardian confirmation',async({site})=>{
 const {page}=site;await page.goto('/?demo=1');await page.locator('#fillPatientDemo').click();await page.locator('[name=birthDate]').fill('2099-01-01');await page.locator('#nextBtn').click();await expect(page.locator('[name=birthDate]')).toHaveAttribute('aria-invalid','true');
 await page.locator('[name=birthDate]').fill('2015-05-01');await page.locator('#nextBtn').click();await expect(page.locator('[name=guardianFirstName]')).toHaveAttribute('aria-invalid','true');
 await page.locator('[name=guardianFirstName]').fill('Änne');await page.locator('[name=guardianLastName]').fill('Groß');await page.locator('[name=guardianRelation]').selectOption('Mutter');await page.locator('#nextBtn').click();await expect(page.locator('[data-step="0"]')).toBeVisible();
 await page.locator('[name=guardianAuthorityConfirm]').check();await page.locator('#nextBtn').click();await expect(page.locator('[data-step="1"]')).toBeVisible();
});
