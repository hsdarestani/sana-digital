// The report and the presentation share exactly the same dated evidence records.
// Source content is rendered as text, never interpreted as markup.
export function evidenceItem(record, className='evidence-item'){
  const article=document.createElement('article');article.className=className;article.id=record.id;
  const meta=document.createElement('div');meta.className='evidence-meta';meta.textContent=`${record.id} · ${record.kind} · ${record.measuredAt}`;
  const heading=document.createElement('h3');heading.textContent=record.title;
  const method=document.createElement('p');method.className='source-method';method.textContent=`Methode: ${record.method}`;
  const findings=document.createElement('p');findings.textContent=record.findings;
  const limit=document.createElement('p');limit.className='source-limit';limit.textContent=`Einordnung / Grenze: ${record.limitation}`;
  const links=document.createElement('ul');links.className='source-urls';
  for(const source of record.urls){
    const li=document.createElement('li'),a=document.createElement('a');
    const url=new URL(source.url,window.location.origin);
    if(url.protocol!=='https:'&&url.origin!==window.location.origin)continue;
    a.href=url.href;a.textContent=source.label;
    if(url.origin!==window.location.origin){a.target='_blank';a.rel='noopener noreferrer';}
    li.append(a);links.append(li);
  }
  article.append(meta,heading,method,findings,limit,links);return article;
}
let evidencePromise;
export function loadEvidence(){
  if(!evidencePromise)evidencePromise=fetch('/vision/sichtbarkeit/evidence.json',{credentials:'omit'}).then(response=>{if(!response.ok)throw new Error('Quellen nicht erreichbar');return response.json();}).catch(error=>{evidencePromise=undefined;throw error;});
  return evidencePromise;
}
export function wireDownloads(root=document){
  root.querySelectorAll('a[download]').forEach(link=>link.addEventListener('click',async event=>{
    const url=new URL(link.href,location.href);if(url.origin!==location.origin)return;
    event.preventDefault();if(link.getAttribute('aria-busy')==='true')return;
    link.setAttribute('aria-busy','true');
    try{
      const response=await fetch(url.href,{credentials:'omit'});if(!response.ok)throw new Error('Download nicht erreichbar');
      const blob=await response.blob(),objectUrl=URL.createObjectURL(blob),save=document.createElement('a');
      save.href=objectUrl;save.download=link.download||decodeURIComponent(url.pathname.split('/').pop());save.hidden=true;
      document.body.append(save);save.click();save.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
    }catch{window.location.assign(url.href);}
    finally{link.removeAttribute('aria-busy');}
  }));
}
