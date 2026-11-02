(() => {
  'use strict';
  const list=document.getElementById('records'),detail=document.getElementById('detail');
  let selected=null;
  const statuses={new:'Neu',reviewed:'Geprüft',archived:'Archiviert'};
  function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
  async function api(url,options={}){
    const res=await fetch(url,{...options,cache:'no-store',credentials:'same-origin',headers:{'Accept':'application/json',...(options.headers||{})}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'Verbindung fehlgeschlagen ('+res.status+').');
    return data;
  }
  function prettyDate(iso){try{return new Date(iso).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch{return iso||'–';}}
  function statusBadge(v){return el('span','status '+v,statuses[v]||v);}
  async function refresh(){
    list.replaceChildren(el('div','empty-list','Lade Aufnahmen …'));document.getElementById('listStatus').textContent='Laden …';
    try{
      const {records}=await api('/api/admin/records');
      document.getElementById('totalCount').textContent=records.length;
      document.getElementById('newCount').textContent=records.filter(r=>r.status==='new').length;
      document.getElementById('listStatus').textContent=records.length+' Einträge';
      list.replaceChildren();
      if(!records.length)list.append(el('div','empty-list','Noch keine Aufnahmen vorhanden.'));
      for(const record of records){
        const btn=el('button','record'+(selected===record.id?' selected':''));
        btn.type='button';
        btn.addEventListener('click',()=>openRecord(record.id));
        const avatar=el('span','avatar',record.name.trim().split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase()||'P');
        const mid=el('span');
        mid.append(el('span','record-title',record.name||'Unbekannt'));
        mid.append(el('span','record-sub',record.reference+' · '+prettyDate(record.createdAt)));
        btn.append(avatar,mid,statusBadge(record.status));
        list.append(btn);
      }
      if(selected && records.some(r=>r.id===selected))await openRecord(selected);
    }catch(error){
      document.getElementById('listStatus').textContent='Fehler';
      list.replaceChildren(el('div','fatal',error.message+' Prüfen Sie Cloudflare Access, DB-Binding und Secret-Konfiguration.'));
    }
  }
  function category(root,title,items){
    const section=el('section','category');section.append(el('h3',null,title));
    const grid=el('div','data-grid');
    items.forEach(([label,value])=>{
      const item=el('div','data-item');
      item.append(el('small',null,label),el('span',null,Array.isArray(value)?value.join(', ')||'–':value===true?'Ja':value===false?'Nein':String(value||'–')));
      grid.append(item);
    });
    section.append(grid);root.append(section);
  }
  async function openRecord(id){
    selected=id;
    list.querySelectorAll('.record').forEach(el=>el.classList.remove('selected'));
    detail.replaceChildren(el('div','empty-state','Lade Patientenakte …'));
    try{
      const {record:r}=await api('/api/admin/records/'+encodeURIComponent(id));
      const p=r.data,container=el('div','detail-inner'),heading=el('div','detail-top'),identity=el('div'),actions=el('div','detail-actions');
      identity.append(el('small',null,r.reference),el('h2',null,p.firstName+' '+p.lastName),el('p',null,'Eingegangen am '+prettyDate(r.createdAt)));
      const selector=el('select');
      selector.setAttribute('aria-label','Bearbeitungsstatus');
      for(const status of Object.keys(statuses)){const opt=el('option',null,statuses[status]);opt.value=status;opt.selected=r.status===status;selector.append(opt);}
      selector.addEventListener('change',async()=>{
        const previous=r.status;
        selector.disabled=true;
        try{
          await api('/api/admin/records/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:selector.value})});
          r.status=selector.value;await refresh();
        }catch(err){selector.value=previous;alert(err.message);}finally{selector.disabled=false;}
      });
      const print=el('button','print-btn','Drucken');print.type='button';print.addEventListener('click',()=>window.print());
      actions.append(selector,print);heading.append(identity,actions);container.append(heading);
      category(container,'Persönliche Daten',[
        ['Vorname',p.firstName],['Nachname',p.lastName],['Geburtsdatum',p.birthDate],['Mobil',p.mobile],['Telefon',p.phone],['E-Mail',p.email],['Straße',p.street],['PLZ / Ort',(p.postalCode||'')+' '+(p.city||'')],['Krankenkasse',p.insurance],['Versicherungsnummer',p.insuranceNumber],['Gesetzliche Vertretung',[p.guardianFirstName,p.guardianLastName].filter(Boolean).join(' ')],['Verhältnis',p.guardianRelation],['Vertreter geboren',p.guardianBirthDate],['Vertreter Anschrift',p.guardianAddress]]);
      category(container,'Gesundheit & Anamnese',[
        ['Hausarzt',p.familyDoctor],['Beruf',p.occupation],['Größe / Gewicht',(p.heightCm||'–')+' cm / '+(p.weightKg||'–')+' kg'],['Sport',p.sports],['Sportarten',p.sportsDetails],
        ['Regelmäßige Medikamente',p.medications],['Medikamente im Detail',p.medicationDetails],['Vorerkrankungen',p.conditions],['Weitere Erkrankungen',p.conditionDetails],
        ['Allergien',p.allergies],['Allergien im Detail',p.allergyDetails],['Operationen',p.operations],['Operationen im Detail',p.operationDetails],['Rauchen',p.smoking],['Zigaretten / Tag',p.cigarettesPerDay]]);
      category(container,'Erklärungen',[
        ['Abrechnung Büdingen',p.externalBillingConsent],['Information über ergänzende Leistungen',p.informationConsent],['Richtigkeit bestätigt',p.accuracyConfirm],['Erfahren über',p.discovery],['Dokumentversion',p.documentVersion],['Unterzeichnet am',prettyDate(p.signedAt)]
      ]);
      const sig=el('section','category');sig.append(el('h3',null,'Unterschrift'));
      if(/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(p.signature||'')){const image=el('img','signature-image');image.src=p.signature;image.alt='Unterschrift des Patienten';sig.append(image);}
      container.append(sig);
      detail.replaceChildren(container);
    }catch(error){detail.replaceChildren(el('div','fatal',error.message));}
  }
  document.getElementById('refresh').addEventListener('click',refresh);
  refresh();
})();