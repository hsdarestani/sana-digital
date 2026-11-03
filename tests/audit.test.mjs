import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';
const dir=new URL('../public/vision/sichtbarkeit/',import.meta.url);
const evidence=JSON.parse(await readFile(new URL('evidence.json',dir),'utf8'));
const google=JSON.parse(await readFile(new URL('google-stichprobe.json',dir),'utf8'));
const website=JSON.parse(await readFile(new URL('website-pruefung.json',dir),'utf8'));
test('audit evidence has unique records, dates, methods, limitations and real sources',()=>{
 assert.equal(evidence.measurementDate,'2026-11-03');assert.equal(new Set(evidence.sources.map(s=>s.id)).size,13);
 for(const s of evidence.sources){for(const key of ['title','kind','measuredAt','method','findings','limitation'])assert.ok(s[key]?.length>5,`${s.id} ${key}`);assert.ok(s.urls.length);for(const u of s.urls)assert.match(u.url,/^(https:\/\/|\/vision\/sichtbarkeit\/)/);}
});
test('search claims preserve their exact scope and counter-evidence',()=>{
 assert.equal(google.methodology.preciseFrankfurtLocationPinned,false);assert.deepEqual(google.searches.map(s=>s.organicResultCount),[7,9,10]);
 for(const s of google.searches){assert.equal(s.organicResults.length,s.organicResultCount);assert.equal(s.ownPracticeDomainObserved,false);assert.deepEqual(s.organicResults.map(r=>r.positionInObservedOrganicList),Array.from({length:s.organicResultCount},(_,i)=>i+1));assert.ok(s.organicResults.every(r=>new URL(r.url).hostname!=='www.ortho-frankfurt.de'));}
 assert.match(google.searches[0].organicResults[5].url,/orthinform/);assert.match(google.searches[2].organicResults[6].url,/herresthal.info/);
 assert.equal(google.googleBusinessProfile.reviewCount,19);assert.equal(google.googleBusinessProfile.rating,5);
});
test('technical counts in the presentation agree with the captured five-page sample',()=>{
 const core=website.filter(p=>['home','team','leistungen','termine','kontakt'].includes(p.name));assert.equal(core.length,5);assert.equal(core.filter(p=>p.telLinks===0).length,5);assert.equal(core.filter(p=>p.description[0].startsWith('Startseite /')).length,4);assert.equal(core.filter(p=>p.h1.length===0).length,2);
 for(const p of core){assert.equal(p.status,200);assert.ok(p.sha256);const org=JSON.parse(p.jsonld[0])['@graph'].find(s=>Array.isArray(s['@type'])&&s['@type'].includes('MedicalBusiness'));assert.deepEqual(org.openingHours,['Mo,Tu,We,Th,Fr,Sa,Su 09:00-17:00']);}
});
test('every presentation citation resolves to an evidence record, and all local report sources exist',async()=>{
 const html=await readFile(new URL('index.html',dir),'utf8');const ids=new Set(evidence.sources.map(s=>s.id));for(const match of html.matchAll(/data-evidence="([^"]+)"/g))for(const id of match[1].split(','))assert.ok(id==='all'||ids.has(id),id);
 for(const s of evidence.sources)for(const u of s.urls)if(u.url.startsWith('/vision/sichtbarkeit/'))await access(new URL(u.url.replace('/vision/sichtbarkeit/',''),dir));
 assert.match(html,/NICHT LIVE/);assert.match(html,/Core Web Vitals derzeit nicht erhoben/);assert.match(html,/genauer Standort unbekannt/);
});

test('presentation copy is concise, icon-guided and preserves source disclosure',async()=>{
 const html=await readFile(new URL('index.html',dir),'utf8');
 const css=await readFile(new URL('audit.css',dir),'utf8');
 const js=await readFile(new URL('audit.js',dir),'utf8');
 assert.doesNotMatch(html,/Ein klarer Plan\.|In 90 Tagen\./);
 assert.match(html,/Was jetzt zählt\./);
 assert.ok((html.match(/class="audit-icon"/g)||[]).length>=20);
 assert.ok((html.match(/class="method-details"/g)||[]).length>=4);
 const defined=new Set([...html.matchAll(/<(?:symbol|path|clipPath|mask|linearGradient|radialGradient)\\b[^>]*\\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const match of html.matchAll(/<use href="#([^"]+)"/g))assert.ok(defined.has(match[1]),match[1]);
 for(const id of ['suche','vergleich','befunde','konzept','fahrplan','messbarkeit'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/data-period/);
 assert.match(css,/\.audit-icon/);
 assert.match(html,/belege\.html#E12/);
});
