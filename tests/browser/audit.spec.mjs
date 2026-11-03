import {test as base,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../public/',import.meta.url));
const csp=(await readFile(path.join(root,'_headers'),'utf8')).match(/Content-Security-Policy: (.+)/)[1];
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.md':'text/markdown; charset=utf-8'};
const test=base.extend({site:async({context,page},use)=>{
 const requests=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());requests.push({method:req.method(),url:url.href});
  if(req.method()!=='GET'||url.origin!=='https://sana.test'){await route.abort();return;}
  const filename=path.join(root,decodeURIComponent(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
  try{await route.fulfill({status:200,body:await readFile(filename),contentType:types[path.extname(filename)]||'application/octet-stream',headers:{'Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}});}catch{await route.fulfill({status:404,body:'Missing asset'});}
 });
 await use({page,requests,errors});expect(errors).toEqual([]);expect(requests.filter(r=>r.method!=='GET')).toEqual([]);
}});
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);}

test('visibility audit: entry, seven chapters, dated query evidence, concepts, roadmap and return paths',async({site},info)=>{
 const {page}=site;await page.goto('/vision/');await page.getByRole('link',{name:'Digitaler Sichtbarkeits-Check',exact:true}).click();
 await expect(page.locator('#auftakt')).toBeVisible();await expect(page.locator('.rating')).toHaveText('5,0/ 5');await noOverflow(page);
 await page.screenshot({path:info.outputPath('audit-opening.png'),fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Check starten',exact:true}).click();await expect(page.locator('#suche')).toBeVisible();
 const raw=JSON.parse(await readFile(path.join(root,'vision/sichtbarkeit/google-stichprobe.json'),'utf8'));
 for(let i=0;i<3;i++){
  await page.locator(`[data-query="${i}"]`).click();await expect(page.locator('#resultCount')).toHaveText(`${raw.searches[i].organicResultCount} dokumentierte Ergebnisse`);
  await expect(page.locator('#observedQuery')).toContainText(raw.searches[i].query);const positions=await page.locator('#resultList li>span').allTextContents();expect(positions).toEqual(raw.searches[i].organicResults.map(x=>String(x.positionInObservedOrganicList)));
  if(i===2)await expect(page.locator('#searchCounter')).toContainText('Dr. Jens Herresthal');await noOverflow(page);
 }
 await page.locator('#searchEvidence').click();await expect(page.locator('#evidenceDialog')).toBeVisible();await expect(page.locator('#evidenceContent')).toContainText('genauer Standort unbekannt');await page.getByRole('button',{name:'Quellen schließen'}).click();
 await page.locator('#nextScene').click();await expect(page.locator('#vergleich')).toBeVisible();await expect(page.locator('.top-ten-item')).toHaveCount(10);await noOverflow(page);await page.screenshot({path:info.outputPath('audit-comparison.png'),fullPage:true,animations:'disabled'});
 await page.locator('#nextScene').click();for(const id of ['daten','einstieg','medizin']){await page.locator(`[data-finding="${id}"]`).click();await expect(page.locator(`#finding-${id}`)).toBeVisible();await noOverflow(page);}
 await expect(page.locator('#finding-medizin')).toContainText('Privatpatienten und Selbstzahler');
 await page.locator('#nextScene').click();await expect(page.locator('#todayView img')).toBeVisible();expect(await page.locator('#todayView img').evaluate(img=>img.complete&&img.naturalWidth>100)).toBeTruthy();
 await page.locator('[data-view=concept]').click();await expect(page.locator('#conceptView')).toBeVisible();await expect(page.locator('.concept-badge')).toContainText('NICHT LIVE');await expect(page.locator('.concept-body .primary')).toHaveAttribute('href','https://www.ortho-frankfurt.de/termine/');await noOverflow(page);await page.screenshot({path:info.outputPath('audit-concept.png'),fullPage:true,animations:'disabled'});
 await page.locator('[data-view=today]').click();await expect(page.locator('#conceptView')).not.toBeVisible();
 await page.locator('#nextScene').click();for(const period of ['30','60','90']){await page.locator(`[data-period="${period}"]`).click();await expect(page.locator(`[data-period="${period}"]`)).toHaveAttribute('aria-pressed','true');await noOverflow(page);}
 await expect(page.locator('#roadmapKpi')).toContainText('bestätigten Buchung');
 await page.locator('#nextScene').click();await expect(page.locator('#messbarkeit')).toBeVisible();await expect(page.locator('.measurement-flow')).toContainText('nicht verfügbar');await noOverflow(page);
 await page.getByRole('button',{name:'Check erneut ansehen'}).click();await expect(page.locator('#auftakt')).toBeVisible();await expect(page.locator('#prevScene')).toBeDisabled();
 await page.getByRole('button',{name:'Messbarer Nutzen',exact:true}).click();await page.locator('#nextScene').click();await expect(page).toHaveURL('https://sana.test/vision/');
});

test('visibility audit: sources, complete report, local downloads, deep links and no real data collection',async({site},info)=>{
 const {page,requests}=site;await page.goto('/vision/sichtbarkeit/#befunde');await expect(page.locator('#befunde')).toBeVisible();
 await page.getByRole('link',{name:'Quellen & Methodik'}).click();await expect(page.locator('#evidenceDialog')).toBeVisible();await expect(page.locator('.evidence-item')).toHaveCount(13);await noOverflow(page);
 await page.keyboard.press('Escape');await expect(page.locator('#evidenceDialog')).not.toBeVisible();await expect(page.getByRole('link',{name:'Quellen & Methodik'})).toBeFocused();
 await page.goto('/vision/sichtbarkeit/belege.html#E08');await expect(page.locator('.report-source')).toHaveCount(13);await expect(page.locator('#E08')).toContainText('HTTP 429');await expect(page.locator('#E11')).toContainText('no_api_units');await noOverflow(page);
 const wait=page.waitForEvent('download');await page.getByRole('link',{name:'Quellenbericht herunterladen',exact:true}).click();const file=await wait;await file.saveAs(info.outputPath('Quellenbericht.md'));expect(await readFile(info.outputPath('Quellenbericht.md'),'utf8')).toContain('herresthal.info');
 const dataWait=page.waitForEvent('download');await page.getByRole('link',{name:'Messdaten als JSON',exact:true}).click();const json=await dataWait;await json.saveAs(info.outputPath('evidence.json'));const evidence=JSON.parse(await readFile(info.outputPath('evidence.json'),'utf8'));expect(evidence.sources).toHaveLength(13);
 await page.getByRole('button',{name:'Drucken / als PDF sichern'}).click();await page.getByRole('link',{name:'Zur Präsentation',exact:true}).click();await expect(page.locator('#auftakt')).toBeVisible();
 expect(requests.every(r=>new URL(r.url).origin==='https://sana.test')).toBeTruthy();expect(requests.some(r=>r.url.includes('/api/'))).toBeFalsy();
});

test('visibility audit: manual chapter controls and reduced motion',async({site})=>{
 const {page}=site;await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/vision/sichtbarkeit/');
 await expect(page.locator('#playTour')).toHaveCount(0);
 await expect(page.locator('#pauseTour')).toHaveCount(0);
 await page.getByRole('button',{name:'Check starten',exact:true}).click();
 await expect(page.locator('#suche')).toBeVisible();
 await page.getByRole('link',{name:'Quellen & Methodik'}).click();
 await expect(page.locator('#evidenceDialog')).toBeVisible();
 await page.getByRole('button',{name:'Quellen schließen'}).click();
 await expect(page.locator('#suche')).toBeVisible();
 for(const id of ['vergleich','befunde','konzept','fahrplan','messbarkeit']){
  await page.locator('#nextScene').click();
  await expect(page.locator('#'+id)).toBeVisible();
 }
 await page.getByRole('button',{name:'Ausgangspunkt',exact:true}).click();
 await expect(page.locator('#auftakt')).toBeVisible();
});
