(() => {
  'use strict';
  const form = document.getElementById('intakeForm');
  const steps = Array.from(document.querySelectorAll('.step'));
  const names = ['Persönlich', 'Gesundheit', 'Einwilligungen', 'Information', 'Abschluss'];
  const headings = ['Persönliche Daten', 'Gesundheitsangaben', 'Datenschutz & Abrechnung', 'Weitere Informationen', 'Prüfen & Absenden'];
  const nextBtn = document.getElementById('nextBtn');
  const backBtn = document.getElementById('backBtn');
  const submitBtn = document.getElementById('submitBtn');
  const downloadPdfBtn = document.getElementById('downloadPdf');
  const formError = document.getElementById('formError');
  const dialog = document.getElementById('detailDialog');
  const canvas = document.getElementById('signature');
  const ctx = canvas.getContext('2d');
  let current = 0;
  let signed = false;
  let drawing = false;
  let sending = false;
  let intakeEnabled = false;
  let turnstileKey = null;
  let turnstileToken = null;
  let pdfExporting = false;
  const presentationDemo = new URLSearchParams(location.search).get('demo') === '1';
  const pdfResult = document.getElementById('pdfResult');
  const today = new Date(); today.setMinutes(today.getMinutes()-today.getTimezoneOffset());
  for (const name of ['birthDate','guardianBirthDate']) {
    form.elements[name].min='1900-01-01';
    form.elements[name].max=today.toISOString().slice(0,10);
  }
  const tags = document.getElementById('step-tags');
  tags.innerHTML = names.map((s,i) => '<span class="step-tag" data-tag="'+i+'">'+s+'</span>').join('');

  function isMinor(){
    const v = form.elements.birthDate.value;
    if (!v) return false;
    const birth = new Date(v + 'T12:00:00');
    if (Number.isNaN(birth.getTime())) return false;
    const today = new Date(); let years = today.getFullYear()-birth.getFullYear();
    if (today.getMonth()<birth.getMonth() || (today.getMonth()===birth.getMonth() && today.getDate()<birth.getDate())) years--;
    return years<18;
  }
  function minorRequirements(){
    const minor = isMinor();
    for (const name of ['guardianFirstName','guardianLastName','guardianRelation']) form.elements[name].required=minor;
    const label = document.getElementById('guardianRequiredLabel');
    label.textContent = minor ? 'Erforderlich' : 'Optional';
    document.getElementById('guardianBox').classList.toggle('guardian-active',minor);
    document.getElementById('guardianAck').hidden=!minor;
    form.elements.guardianAuthorityConfirm.required=minor;
  }
  function updateConditionals(){
    document.querySelectorAll('[data-show]').forEach(el=>{
      const bits = el.dataset.show.split(':');
      const radio = form.querySelector('input[name="'+bits[0]+'"]:checked');
      const visible = !!radio && radio.value===bits[1];
      el.classList.toggle('hidden',!visible);
      el.querySelectorAll('input,textarea,select').forEach(input=>{input.required=visible;input.disabled=!visible;if(!visible){input.value='';clearFieldError(input);}});
    });
  }
  function moveTo(step){
    if(step<0||step>=steps.length)return;
    current=step; steps.forEach((el,i)=>{el.hidden=i!==step;el.classList.toggle('active',i===step);});
    document.getElementById('step-count').textContent=String(step+1).padStart(2,'0');
    document.getElementById('step-heading').textContent=headings[step];
    document.getElementById('progress-fill').style.width=((step+1)*20)+'%';
    document.getElementById('progress').setAttribute('aria-valuenow',String(step+1));
    document.querySelectorAll('.step-tag').forEach((el,i)=>{el.classList.toggle('is-active',i===step);el.classList.toggle('is-complete',i<step);if(i===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    backBtn.hidden=false;
    backBtn.textContent=step===0?'Zur Übersicht':'Zurück';
    nextBtn.textContent=['Weiter zur Gesundheit','Weiter zu Einwilligungen','Weiter zu Informationen','Weiter zum Abschluss'][step]||'Weiter';
    nextBtn.hidden=step===steps.length-1;
    submitBtn.hidden=step!==steps.length-1;
    downloadPdfBtn.hidden=step!==steps.length-1;
    formError.hidden=true;
    if(step===4) renderReview();
    const panel=document.getElementById('formPanel');
    if(panel.getBoundingClientRect().top<-20) window.scrollTo({top: Math.max(0,window.scrollY+panel.getBoundingClientRect().top-12),behavior:'smooth'});
    if(document.activeElement?.id==='nextBtn'||document.activeElement?.id==='backBtn'||document.activeElement?.classList.contains('review-edit')) steps[step].querySelector('h2')?.focus({preventScroll:true});
  }
  function fail(message){formError.textContent=message;formError.hidden=false;}
  function clearFieldError(input){
    input.removeAttribute('aria-invalid');
    const errorId=input.dataset.errorId;
    if(errorId){document.getElementById(errorId)?.remove();input.removeAttribute('aria-describedby');delete input.dataset.errorId;}
  }
  function fieldError(input){
    clearFieldError(input);input.setAttribute('aria-invalid','true');
    const error=document.createElement('span');error.className='field-error';error.id='error-'+input.name;
    error.textContent=input.validity.valueMissing?'Bitte füllen Sie dieses Pflichtfeld aus.':input.type==='date'?'Bitte geben Sie ein gültiges Datum zwischen 1900 und heute ein.':input.type==='email'?'Bitte geben Sie eine gültige E-Mail-Adresse ein.':'Bitte prüfen Sie Ihre Eingabe und den erlaubten Wertebereich.';
    input.dataset.errorId=error.id;input.setAttribute('aria-describedby',error.id);
    if(input.type==='checkbox')input.closest('label').after(error);else input.after(error);
  }
  function validateStep(i){
    minorRequirements();
    const visibleInputs=Array.from(steps[i].querySelectorAll('input,textarea,select')).filter(el=>!el.closest('.hidden') && (!el.closest('[hidden]') || el.closest('[hidden]')===steps[i]) && el.name!=='website');
    for(const input of visibleInputs){
      clearFieldError(input);
      if(!input.checkValidity()){
        if(i===current){fieldError(input);input.focus();input.reportValidity();}
        return false;
      }
    }
    if(i===0){
      const d=new Date(form.elements.birthDate.value+'T12:00:00');
      if (!form.elements.birthDate.value || d>new Date() || d.getFullYear()<1900){form.elements.birthDate.focus();form.elements.birthDate.setAttribute('aria-invalid','true');return false;}
    }
    return true;
  }
  nextBtn.addEventListener('click',()=>{if(validateStep(current))moveTo(current+1);});
  backBtn.addEventListener('click',()=>{if(current===0)location.href='/vision/';else moveTo(current-1);});
  form.addEventListener('input',event=>{clearFieldError(event.target);pdfResult.hidden=true;});
  form.addEventListener('change',event=>{clearFieldError(event.target);pdfResult.hidden=true;});
  document.querySelectorAll('input[type="radio"]').forEach(el=>el.addEventListener('change',updateConditionals));
  form.elements.birthDate.addEventListener('change',minorRequirements);

  function value(name) {return String(form.elements[name]?.value || '').trim();}
  function radio(name) {return form.querySelector('input[name="'+name+'"]:checked')?.value || 'Keine Angabe';}
  function reviewRow(title,body,step){
    const card=document.createElement('div');card.className='review-card';
    const left=document.createElement('div'),head=document.createElement('h3'),p=document.createElement('p');
    head.textContent=title;p.textContent=body;left.append(head,p);
    const btn=document.createElement('button');btn.className='review-edit';btn.type='button';btn.textContent='Ändern';btn.addEventListener('click',()=>moveTo(step));card.append(left,btn);return card;
  }
  function renderReview(){
    const root=document.getElementById('review');root.replaceChildren();
    for(const block of window.SanaPDF.collect(form)){
      const index=block.title==='Gesundheitsangaben'?1:block.title==='Datenschutz und Einwilligungen'?2:0;
      const card=reviewRow(block.title,'',index),list=document.createElement('dl');list.className='review-dl';
      card.querySelector('p').remove();
      for(const [label,answer] of block.rows){
        if(label==='Dokumentstatus'||label.startsWith('Richtigkeit der Angaben'))continue;
        const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=answer==='ja'?'Ja':answer==='nein'?'Nein':answer;list.append(dt,dd);
      }
      card.firstElementChild.append(list);card.querySelector('button').setAttribute('aria-label',block.title+' ändern');root.append(card);
    }
  }
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#123c55';ctx.lineWidth=3.5;
  function position(ev){const r=canvas.getBoundingClientRect();return {x:(ev.clientX-r.left)*canvas.width/r.width,y:(ev.clientY-r.top)*canvas.height/r.height};}
  canvas.addEventListener('pointerdown',ev=>{ev.preventDefault();drawing=true;canvas.setPointerCapture(ev.pointerId);const p=position(ev);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+.15,p.y+.15);ctx.stroke();signed=true;pdfResult.hidden=true;document.getElementById('signaturePlaceholder').hidden=true;});
  canvas.addEventListener('pointermove',ev=>{if(!drawing)return;ev.preventDefault();const p=position(ev);ctx.lineTo(p.x,p.y);ctx.stroke();});
  function endDrawing(){drawing=false;}
  canvas.addEventListener('pointerup',endDrawing);canvas.addEventListener('pointercancel',endDrawing);
  document.getElementById('clearSignature').addEventListener('click',()=>{ctx.clearRect(0,0,canvas.width,canvas.height);signed=false;pdfResult.hidden=true;document.getElementById('signaturePlaceholder').hidden=false;});

  const info = {
    billing:{title:'Externe Abrechnung',eyebrow:'PATIENTENINFORMATION',html:
      '<p>Die Ärztliche Verrechnungsstelle Büdingen GmbH, Gymnasiumstraße 18–20, 63654 Büdingen, übernimmt bei erteilter Einwilligung die Honorarabrechnung und den Einzug der Forderung. Die Einwilligung erfolgt freiwillig und ist für zukünftige Vorgänge widerrufbar.</p>'+
      '<h3>Welche Daten?</h3><p>Für Abrechnung und Forderungsabwicklung erforderliche Stammdaten, Behandlungs- und Rechnungsdaten sowie die mit der Abrechnung zusammenhängenden Informationen.</p>'+
      '<h3>Wer kann Daten erhalten?</h3><p>Beauftragte Auftragsverarbeiter, gegebenenfalls Bonitätsdienstleister (beispielsweise SCHUFA / Boniversum) im gesetzlich zulässigen Rahmen und zuständige öffentliche Stellen.</p>'+
      '<h3>Ihre Rechte</h3><p>Sie können unter den gesetzlichen Voraussetzungen Auskunft, Berichtigung, Löschung, Einschränkung und Widerspruch verlangen. Eine gesetzliche Aufbewahrung von Rechnungsunterlagen kann eine Löschung zeitlich begrenzen. Im Dokument wird eine Frist von zehn Jahren ab Rechnungsdatum genannt.</p>'+
      '<h3>Freiwilligkeit / Widerruf</h3><p>Ihre Behandlung ist unabhängig von der Zustimmung zur externen Abrechnung. Bei Ablehnung erfolgt keine Einwilligung zur externen Weitergabe auf dieser Grundlage.</p>'+
      '<p>Weitere Informationen: <a href="https://www.buedingen-holding.de/patienteninformation" target="_blank" rel="noopener noreferrer">Patienteninformation Büdingen</a>.</p>'},
    privacy:{title:'Datenschutz & Vertraulichkeit',eyebrow:'PATIENTENINFORMATION',html:
      '<p>Verantwortlich für die Verarbeitung Ihrer Patientendaten ist der jeweilige Praxisbetreiber des Sana MVZ Orthopädie und Chirurgie Frankfurt-Westend. Verbindliche Kontaktdaten und die vollständige Datenschutzerklärung erhalten Sie direkt von der Praxis.</p>'+
      '<h3>Zweck der Erfassung</h3><p>Patientenaufnahme, Kontakt, Dokumentation medizinischer Angaben, Behandlungsvorbereitung und gegebenenfalls gesetzlich erforderliche Abrechnung.</p>'+
      '<h3>Besonders geschützte Daten</h3><p>Gesundheitsdaten werden vertraulich verarbeitet und unterliegen zusätzlichen datenschutzrechtlichen Anforderungen sowie der ärztlichen Schweigepflicht. Die Verarbeitung für die medizinische Versorgung kann sich auf Art. 9 Abs. 2 lit. h DSGVO und die jeweils einschlägigen Rechtsgrundlagen stützen.</p>'+
      '<h3>Technische Übermittlung</h3><p>Dieses digitale Formular überträgt die Angaben verschlüsselt über HTTPS an die Praxisanwendung. Die sichere Aufbewahrung, Zugriffsrechte, Löschfristen und die Vereinbarungen mit Dienstleistern müssen durch die Praxis verantwortet und freigegeben werden.</p>'+
      '<h3>Ihre Datenschutzrechte</h3><p>Nach den gesetzlichen Voraussetzungen bestehen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung sowie Beschwerde bei einer Datenschutzaufsichtsbehörde.</p>'+
      '<p><strong>Hinweis:</strong> Diese Kurzinfo ersetzt nicht die vollständige Datenschutzinformation des Praxisbetreibers. Diese muss vor dem produktiven Einsatz rechtlich und organisatorisch bereitgestellt werden.</p>'}
  };
  function showDialog(which){
    const data=which==='igelguide'?window.SanaIgelGuide:info[which];
    if(!data)return;
    document.getElementById('dialogTitle').textContent=data.title;
    document.getElementById('dialogEyebrow').textContent=data.eyebrow;
    const content=document.getElementById('dialogContent');
    content.innerHTML=data.html;
    if(which==='igelguide')window.SanaIgelGuide.init(content);
    backdropPressed=false;
    dialog.showModal();
  }
  document.querySelectorAll('[data-dialog]').forEach(btn=>btn.addEventListener('click',()=>showDialog(btn.dataset.dialog)));
  document.getElementById('closeDialog').addEventListener('click',()=>dialog.close());
  document.getElementById('doneDialog').addEventListener('click',()=>dialog.close());
  // A touch which opens the modal must never also dismiss its new backdrop.
  let backdropPressed=false;
  const outsideDialog=ev=>{const r=dialog.getBoundingClientRect();return ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom;};
  dialog.addEventListener('pointerdown',ev=>{backdropPressed=ev.target===dialog&&outsideDialog(ev);});
  dialog.addEventListener('pointercancel',()=>{backdropPressed=false;});
  dialog.addEventListener('click',ev=>{if(backdropPressed&&ev.target===dialog&&outsideDialog(ev))dialog.close();backdropPressed=false;});

  function payload(){
    const fields=['firstName','lastName','birthDate','mobile','phone','email','street','postalCode','city','insurance','insuranceNumber','guardianFirstName','guardianLastName','guardianBirthDate','guardianRelation','guardianAddress','familyDoctor','occupation','heightCm','weightKg','sportsDetails','medicationDetails','conditionDetails','allergyDetails','operationDetails','cigarettesPerDay','discovery'];
    const data={};for(const key of fields)data[key]=value(key);
    for(const name of ['sports','medications','allergies','operations','smoking'])data[name]=radio(name)==='Keine Angabe'?'':radio(name);
    data.conditions=Array.from(form.querySelectorAll('input[name="conditions"]:checked')).map(el=>el.value);
    data.guardianAuthorityConfirm=form.elements.guardianAuthorityConfirm.checked;
    data.externalBillingConsent=form.elements.externalBillingConsent.checked;
    data.informationConsent=form.elements.informationConsent.checked;
    data.accuracyConfirm=form.elements.accuracyConfirm.checked;
    data.signature=canvas.toDataURL('image/png');
    data.documentVersion='2026-11-02.1';
    data.turnstileToken=turnstileToken||'';
    data.website=value('website');
    return data;
  }
  downloadPdfBtn.addEventListener('click',async()=>{
    if(sending||pdfExporting)return;
    for(let i=0;i<steps.length;i++){
      if(!validateStep(i)){moveTo(i);validateStep(i);fail('Bitte vervollständigen Sie zuerst die Pflichtfelder.');return;}
    }
    if(!signed){fail('Bitte unterschreiben Sie zuerst im Unterschriftsfeld.');canvas.focus();return;}
    if(!form.elements.accuracyConfirm.checked){fail('Bitte bestätigen Sie Ihre Angaben.');return;}
    pdfExporting=true;downloadPdfBtn.disabled=true;downloadPdfBtn.textContent='PDF wird erstellt …';
    const signatureImage=canvas.toDataURL('image/png');
    try{
      const first=value('firstName'),last=value('lastName');
      const name=[first,last].filter(Boolean).join('_').replace(/[^a-z0-9äöüÄÖÜß_-]/gi,'_');
      const result=await window.SanaPDF.download({
        title:'Digitale Patientenaufnahme',
        subtitle:'Zusammenfassung Ihrer Angaben · Nicht an die Praxis übermittelt',
        sections:window.SanaPDF.collect(form),
        signature:signatureImage,
        filename:'SANA_Patientenaufnahme_'+(name||'Muster')+'.pdf'
      });
      window.SanaPDF.showResult(pdfResult,result);
      formError.hidden=true;
    }catch(error){fail('Die PDF-Datei konnte nicht erstellt werden. Bitte prüfen Sie die Verbindung und versuchen Sie es erneut.');}
    finally{pdfExporting=false;downloadPdfBtn.disabled=false;downloadPdfBtn.textContent='PDF-Zusammenfassung herunterladen';}
  });
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();
    if(sending)return;
    if(!intakeEnabled){fail('Dieses Formular ist derzeit nur eine Vorschau. Bitte keine echten Patientendaten eingeben.');return;}
    if(turnstileKey&&!turnstileToken){fail('Bitte schließen Sie zuerst die Sicherheitsprüfung ab.');return;}
    for(let i=0;i<steps.length;i++){if(!validateStep(i)){moveTo(i);validateStep(i);fail('Bitte prüfen Sie die markierten Pflichtfelder.');return;}}
    if(!signed){fail('Bitte unterschreiben Sie im Unterschriftsfeld.');return;}
    if(!form.elements.accuracyConfirm.checked){fail('Bitte bestätigen Sie die Richtigkeit Ihrer Angaben.');return;}
    const data=payload();
    sending=true;submitBtn.disabled=true;submitBtn.textContent='Wird sicher gesendet …';formError.hidden=true;
    try{
      const response=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store',credentials:'same-origin'});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'Ihre Angaben konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.');
      document.getElementById('reference').textContent=result.reference||'Bestätigt';
      form.hidden=true;document.querySelector('.progress-head').hidden=true;document.getElementById('progress').hidden=true;tags.hidden=true;
      document.getElementById('success').hidden=false;
      document.getElementById('success').scrollIntoView({block:'center',behavior:'smooth'});
    }catch(error){fail(error.message||'Verbindung fehlgeschlagen. Bitte versuchen Sie es erneut.');}
    finally{sending=false;submitBtn.disabled=!intakeEnabled;submitBtn.textContent='Angaben sicher senden';}
  });
  document.getElementById('newForm').addEventListener('click',()=>window.location.reload());
  window.addEventListener('beforeunload',ev=>{if(intakeEnabled && document.getElementById('success').hidden && Array.from(form.elements).some(el=>el.name && el.name!=='website' && el.type!=='hidden' && ((el.type==='checkbox'||el.type==='radio')?el.checked:Boolean(el.value)))){ev.preventDefault();}});
  function setupTurnstile(sitekey){
    if(document.getElementById('turnstileBox'))return;
    const box=document.createElement('div');
    box.id='turnstileBox';box.className='turnstile-box';
    box.setAttribute('aria-label','Sicherheitsprüfung');
    document.querySelector('.required-check').after(box);
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;
    script.onload=()=>{
      if(!window.turnstile){return;}
      window.turnstile.render(box,{sitekey,callback:(token)=>{turnstileToken=token;},'expired-callback':()=>{turnstileToken=null;},'error-callback':()=>{turnstileToken=null;}});
    };
    document.head.append(script);
  }
  async function checkActivation(){
    try{
      if(presentationDemo)throw new Error('Presentation mode never submits.');
      const response=await fetch('/api/config',{cache:'no-store'});
      const result=response.ok?await response.json():{};
      intakeEnabled=result.enabled===true;
      turnstileKey=result.turnstileSiteKey||null;
      if(intakeEnabled&&turnstileKey)setupTurnstile(turnstileKey);
    }catch{intakeEnabled=false;}
    document.getElementById('previewNotice').hidden=intakeEnabled;
    submitBtn.disabled=!intakeEnabled;
    if(!intakeEnabled)submitBtn.textContent='Demo · Es werden keine Daten gesendet';
    document.getElementById('demoTools').hidden=intakeEnabled;
  }
  document.getElementById('fillPatientDemo').addEventListener('click',()=>{
    if(intakeEnabled)return;
    form.reset();ctx.clearRect(0,0,canvas.width,canvas.height);signed=false;document.getElementById('signaturePlaceholder').hidden=false;
    const example={firstName:'Julia',lastName:'Müller',birthDate:'1972-09-18',mobile:'+49 170 0000000',phone:'+49 69 0000000',email:'julia.mueller@example.invalid',street:'Musterstraße 12',postalCode:'60313',city:'Frankfurt am Main',insurance:'Beispielkasse',insuranceNumber:'MUSTER-123',familyDoctor:'Dr. Beispiel',occupation:'Bürokauffrau',heightCm:'168',weightKg:'72',sportsDetails:'Schwimmen, zweimal wöchentlich',medicationDetails:'Fiktives Beispiel: Medikament A, 5 mg morgens.',conditionDetails:'Fiktive Angaben zu Demonstrationszwecken.',allergyDetails:'Penicillin (fiktives Beispiel)',operationDetails:'Knieoperation im März 2018 (fiktiv)',discovery:'Empfehlung'};
    for(const [name,val]of Object.entries(example))form.elements[name].value=val;
    for(const name of ['sports','medications','allergies','operations'])form.querySelector('input[name="'+name+'"][value="ja"]').checked=true;
    form.querySelector('input[name="smoking"][value="nein"]').checked=true;
    form.querySelector('input[name="conditions"][value="Bluthochdruck"]').checked=true;
    form.querySelectorAll('[aria-invalid]').forEach(clearFieldError);minorRequirements();updateConditionals();moveTo(0);pdfResult.hidden=true;
    document.getElementById('previewNotice').innerHTML='<b>FIKTIVES BEISPIEL</b> Musterangaben eingetragen. Einwilligungen und Unterschrift wählen Sie selbst. Es wird nichts übermittelt.';
  });
  minorRequirements();updateConditionals();moveTo(0);checkActivation();
})();
