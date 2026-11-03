import {evidenceItem,loadEvidence,wireDownloads} from './evidence-view.js';
wireDownloads();
document.querySelector('#printReport').addEventListener('click',()=>window.print());
try{
  const data=await loadEvidence();
  document.querySelector('#reportSources').replaceChildren(...data.sources.map(source=>evidenceItem(source,'report-source')));
  document.querySelector('#printReport').disabled=false;
  const toc=document.querySelector('#reportToc');
  for(const source of data.sources){const a=document.createElement('a');a.href=`#${source.id}`;a.textContent=`${source.id} · ${source.title.split(' – ')[0].split(':')[0]}`;toc.append(a);}
  if(location.hash){const target=document.getElementById(location.hash.slice(1));target?.scrollIntoView();}
}catch{
  document.querySelector('#reportSources').textContent='Die Online-Belege konnten gerade nicht geladen werden. Bitte laden Sie den vollständigen Quellenbericht oben herunter.';
}
