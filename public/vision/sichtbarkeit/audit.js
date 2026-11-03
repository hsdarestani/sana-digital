import {evidenceItem,loadEvidence,wireDownloads} from './evidence-view.js';
const scenes=[...document.querySelectorAll('.scene')];
const chapters=[...document.querySelectorAll('[data-scene]')];
const previous=document.querySelector('#prevScene'),next=document.querySelector('#nextScene');
const dialog=document.querySelector('#evidenceDialog'),evidenceContent=document.querySelector('#evidenceContent');
let sceneIndex=0,opener=null,evidenceGeneration=0;
document.documentElement.classList.add('enhanced');
wireDownloads();

function stopTour(){}
function showScene(index,{focus=true,manual=true}={}){
  if(manual)stopTour();sceneIndex=Math.min(Math.max(index,0),scenes.length-1);
  scenes.forEach((scene,i)=>{scene.hidden=i!==sceneIndex;});
  chapters.forEach((chapter,i)=>{if(i===sceneIndex)chapter.setAttribute('aria-current','step');else chapter.removeAttribute('aria-current');});
  previous.disabled=sceneIndex===0;next.textContent=sceneIndex===scenes.length-1?'Zur Übersicht':'Weiter';
  document.querySelector('#pageCount').replaceChildren(document.createTextNode(`${String(sceneIndex+1).padStart(2,'0')} `),Object.assign(document.createElement('span'),{textContent:'/ 07'}));
  history.replaceState(null,'',`#${scenes[sceneIndex].id}`);
  document.title=`${scenes[sceneIndex].dataset.title} | Sichtbarkeitsanalyse · SANA NEXT`;
  if(focus){window.scrollTo({top:0,behavior:'auto'});scenes[sceneIndex].querySelector('h1,h2')?.focus({preventScroll:true});}
}
previous.addEventListener('click',()=>showScene(sceneIndex-1));
next.addEventListener('click',()=>{if(sceneIndex===scenes.length-1)window.location.assign('/vision/');else showScene(sceneIndex+1);});
chapters.forEach(chapter=>chapter.addEventListener('click',()=>showScene(Number(chapter.dataset.scene))));
document.querySelectorAll('[data-next]').forEach(button=>button.addEventListener('click',()=>showScene(sceneIndex+1)));
document.querySelector('#restartTour').addEventListener('click',()=>showScene(0));
document.addEventListener('keydown',event=>{
  if(dialog.open||event.altKey||event.ctrlKey||event.metaKey)return;
  const active=document.activeElement;if(active?.closest('button,a,input,select,textarea,[contenteditable]'))return;
  if(event.key==='ArrowRight'&&sceneIndex<scenes.length-1){event.preventDefault();showScene(sceneIndex+1);}
  if(event.key==='ArrowLeft'&&sceneIndex>0){event.preventDefault();showScene(sceneIndex-1);}
});
window.addEventListener('hashchange',()=>{const index=scenes.findIndex(scene=>`#${scene.id}`===location.hash);if(index>=0&&index!==sceneIndex)showScene(index);});
const initial=scenes.findIndex(scene=>`#${scene.id}`===location.hash);showScene(initial>=0?initial:0,{focus:false});

const queries=[{"query":"Orthopäde Frankfurt Westend","count":7,"results":[["1","Orthopädie Frankfurt Westend · Dr. Dara Emanuel Frömel","orthopaede-frankfurt-westend.de"],["2","Dr. Albrecht-Schoeck und Dr. Sandberg · Orthopäde Westend","orthopaede-westend.de"],["3","Orthopädisches Centrum Prof. Rangger, Dr. Pfeifer & Dr. Latif …","orthopaedie-frankfurt.de"],["4","Orthopädie Frankfurt Westend · main medic all","mainmedicall.de"],["5","Praxis Orthopädie im Westend · Doctolib","doctolib.de"],["6","Orthopädische Gemeinschaftspraxis in Frankfurt am Main · Orthinform","orthinform.de"],["7","Orthopädie im Westend · Dr. Frömel · Facebook","facebook.com"]],"counter":"Sana Praxiseintrag bei Orthinform auf Platz 6."},{"query":"Kniespezialist Frankfurt","count":9,"results":[["1","SPORTHOLOGICUM® Kniezentrum Frankfurt | #noshortcuts","sporthologicum.de"],["2","Kniezentrum Frankfurt · Versorgungsgemeinschaft für akute …","kniezentrum-frankfurt.de"],["3","Kniechirurgie | BG Unfallklinik Frankfurt am Main","bg-kliniken.de"],["4","Sportorthopäde Frankfurt | Facharztpraxis chirurgie maintaunus","sportorthopaede-frankfurt.de"],["5","Knie · ORTHOmedic Frankfurt Offenbach","orthomedic-of.de"],["6","Kniechirurgie · Universitätsmedizin Frankfurt","unimedizin-ffm.de"],["7","Ihr Kniespezialist in Frankfurt am Main · Lumedis","lumedis.de"],["8","Orthopaedicum Frankfurt","orthopaedicum-frankfurt.de"],["9","Prof. Dr. med. Dr. rer. nat. Thomas Stein · SPORTHOLOGICUM","sporthologicum.de"]],"counter":"Offizielle Praxiswebsite in dieser Stichprobe nicht enthalten."},{"query":"Schulterspezialist Frankfurt","count":10,"results":[["1","Professor Dr. Aristotelis Kaisidis · Leading Medicine Guide","leading-medicine-guide.com"],["2","Schulterchirurgie · Über uns · Frankfurter Rotkreuz-Kliniken","rotkreuzkliniken.de"],["3","Schulterchirurgie | BG Unfallklinik Frankfurt am Main","bg-kliniken.de"],["4","Zentrum für Schulterchirurgie in Frankfurt · Orthopädisches Zentrum Dr. A. Rümelin","dr-ruemelin.de"],["5","Schulter · ORTHOmedic Frankfurt Offenbach","orthomedic-of.de"],["6","Schulter · Orthopaedicum Frankfurt","orthopaedicum-frankfurt.de"],["7","herresthal.info: Aktuelles · Orthopäde · Knie- und …","herresthal.info"],["8","Ihr Schulterspezialist in Frankfurt · Lumedis","lumedis.de"],["9","Schulterschmerzen · Frankfurt am Main · Dr. Baron & Kollegen","drbaron.de"],["10","Spezialsprechstunde Schulter · Orthopädie am Kurhaus","orthopaedie-am-kurhaus.de"]],"counter":"Website von Dr. Jens Herresthal mit Sana Bezug auf Platz 7."}];
function selectQuery(index){
  const data=queries[index];
  document.querySelectorAll('[data-query]').forEach(button=>{const active=Number(button.dataset.query)===index;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  document.querySelector('#observedQuery').textContent=data.query;
  document.querySelector('#resultCount').textContent=data.count+' dokumentierte Ergebnisse';
  const list=document.querySelector('#resultList');list.replaceChildren();
  for(const [position,title,domain] of data.results){
    const li=document.createElement('li'),rank=document.createElement('span'),copy=document.createElement('div'),name=document.createElement('strong'),site=document.createElement('small');
    rank.textContent=position;name.textContent=title.replace(/[-–—]/g,' ');site.textContent=domain.includes('-')?'Website im Quellenbericht':domain;copy.append(name,site);li.append(rank,copy);list.append(li);
  }
  document.querySelector('#searchCounter').textContent=data.counter;
}
document.querySelectorAll('[data-query]').forEach(button=>button.addEventListener('click',()=>selectQuery(Number(button.dataset.query))));
selectQuery(0);

document.querySelectorAll('[data-finding]').forEach(button=>button.addEventListener('click',()=>{
  stopTour();document.querySelectorAll('[data-finding]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));document.querySelector(`#finding-${b.dataset.finding}`).hidden=b!==button;});
}));
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  stopTour();const concept=button.dataset.view==='concept';
  document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  document.querySelector('#todayView').hidden=concept;document.querySelector('#conceptView').hidden=!concept;
  document.querySelector('#viewLabel').textContent=concept?'Gestaltungsvorschlag':'Praxiswebsite aktuell';
  document.querySelector('#conceptExplanation').textContent=concept?'Leistungen, Termin und Telefon sofort sichtbar.':'Der Termin liegt auf einer Unterseite.';
}));
const periods={
  '30':{priority:'PRIORITÄT 1 · VERLÄSSLICHE PRAXISDATEN',title:'Richtig gefunden.\nRichtig angekommen.',tasks:['Kartenlink, Adresse und Öffnungszeiten korrigieren.','Googleprofil, Leistungen und Terminlink prüfen.','Search Console auswerten, Ausgangswerte dokumentieren.'],kpi:'Korrekte Praxisdaten und dokumentierte Ausgangswerte.',access:'Benötigt: CMS, Googleprofil, Search Console.'},
  '60':{priority:'PRIORITÄT 2 · INHALTE UND PATIENTENWEG',title:'Kompetenz sichtbar.\nKontakt einfach.',tasks:['Arztprofile und lokale Leistungsseiten aktualisieren.','Terminzugang und Anrufwege vereinfachen; Mobilansicht prüfen.','Freiwilligen, neutralen Rezensionsprozess abstimmen.'],kpi:'Freigegebene Inhalte und geprüfte Kontaktwege.',access:'Benötigt: CMS, medizinische Freigaben, Datenschutzkonzept.'},
  '90':{priority:'PRIORITÄT 3 · WIRKUNG NACHVOLLZIEHEN',title:'Ergebnisse verstehen.\nGezielt weiterentwickeln.',tasks:['Klicks, Impressionen und CTR über 28 Tage vergleichen.','Profilaktionen und freigegebene Kontaktklicks auswerten.','Suchstichproben wiederholen und Maßnahmen priorisieren.'],kpi:'Vergleich mit Quellen. Ein Klick entspricht noch keiner bestätigten Buchung.',access:'Benötigt: freigegebene Messdaten und Buchungsdaten.'}
};
document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{
  stopTour();const data=periods[button.dataset.period];document.querySelectorAll('[data-period]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  document.querySelector('#roadmapPriority').textContent=data.priority;
  const title=document.querySelector('#roadmapTitle');title.replaceChildren();data.title.split('\n').forEach((line,i)=>{if(i)title.append(document.createElement('br'));title.append(document.createTextNode(line));});
  document.querySelector('#roadmapTasks').replaceChildren(...data.tasks.map(text=>Object.assign(document.createElement('li'),{textContent:text})));
  document.querySelector('#roadmapKpi').textContent=data.kpi;document.querySelector('#roadmapAccess').textContent=data.access;
}));

async function openEvidence(link){
  stopTour();opener=link;const generation=++evidenceGeneration;
  evidenceContent.replaceChildren(Object.assign(document.createElement('p'),{textContent:'Belege werden geladen …'}));
  if(!dialog.open)dialog.showModal();
  try{const data=await loadEvidence();if(generation!==evidenceGeneration)return;const ids=link.dataset.evidence.split(',');const selected=ids.includes('all')?data.sources:data.sources.filter(source=>ids.includes(source.id));evidenceContent.replaceChildren(...selected.map(source=>evidenceItem(source)));dialog.scrollTop=0;}
  catch{evidenceContent.replaceChildren(Object.assign(document.createElement('p'),{textContent:'Die Belege konnten gerade nicht geladen werden. Der vollständige Quellenbericht ist unten verlinkt.'}));}
}
document.querySelectorAll('[data-evidence]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openEvidence(link);}));
document.querySelector('#closeEvidence').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{evidenceGeneration++;opener?.focus({preventScroll:true});});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
