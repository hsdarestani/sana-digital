(() => {
'use strict';
const form=document.getElementById('callForm'), preview=document.getElementById('liveSummary'), feedback=document.getElementById('feedback'), resultRoot=document.getElementById('pdfResult');
const config=[['needPrescription','prescriptionFields',['prescription']],['needCallback','callbackFields',['callbackDoctor']],['needDocuments','documentsFields',['documents','delivery','deliveryAddress']],['needAppointment','appointmentFields',['appointmentMode']]];
const value=n=>form.elements[n]?.value?.trim()||'', yes=n=>Boolean(form.elements[n]?.checked);
const pinInput=document.getElementById('pinInput'),pinLabel=document.getElementById('demoPin'),verifiedLabel=document.getElementById('verifiedLabel');
let demoPin=null,verified=false,pinIdentity='',pinTime=0,exporting=false;
const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());form.elements.birthDate.max=today.toISOString().slice(0,10);
document.getElementById('summaryDetails').open=matchMedia('(min-width:960px)').matches;
const identity=()=>[value('firstName'),value('lastName'),value('birthDate'),value('phone')].join('|');
function clearValidation(field){
  const fields=field?[field]:Array.from(form.elements);
  fields.forEach(el=>{el.removeAttribute('aria-invalid');const errorId='call-error-'+el.name;document.getElementById(errorId)?.remove();const descriptions=(el.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!==errorId);if(descriptions.length)el.setAttribute('aria-describedby',descriptions.join(' '));else el.removeAttribute('aria-describedby');});
}
function markInvalid(field){
  clearValidation(field);field.setAttribute('aria-invalid','true');
  const note=document.createElement('span');note.id='call-error-'+field.name;note.className='field-error';note.setAttribute('role','alert');
  note.textContent=field.validity.valueMissing?'Bitte dieses Pflichtfeld ausfüllen.':'Bitte diese Angabe prüfen.';
  field.insertAdjacentElement('afterend',note);field.setAttribute('aria-describedby',[field.getAttribute('aria-describedby'),note.id].filter(Boolean).join(' '));field.focus();
}
function resetPin(){demoPin=null;verified=false;pinIdentity='';pinTime=0;pinInput.value='';pinLabel.textContent='Noch kein Testcode';verifiedLabel.textContent='Nicht geprüft · Simulation';}
function sync(){
  config.forEach(([name,id,children])=>{
    const active=yes(name);document.getElementById(id).hidden=!active;
    children.forEach(key=>{form.elements[key].required=active;form.elements[key].disabled=!active;if(!active){form.elements[key].value='';clearValidation(form.elements[key]);}});
  });
  if(demoPin && identity()!==pinIdentity)resetPin();
  const rows=[['Patient',[value('firstName'),value('lastName')].filter(Boolean).join(' ')||'Noch nicht angegeben'],['Geburtsdatum',window.SanaPDF.formatDate(value('birthDate'))||'Noch nicht angegeben'],['Telefon',value('phone')||'Noch nicht angegeben'],['Versicherung',value('insurance')||'Nicht angegeben'],['Versicherungsnummer',value('insuranceNumber')||'Nicht angegeben'],['Anliegen',value('reason')||'Noch nicht ausgewählt']];
  if(yes('needPrescription'))rows.push(['Rezept',value('prescription')||'Bitte ergänzen']);
  if(yes('needCallback'))rows.push(['Arztrückruf',value('callbackDoctor')||'Arzt ergänzen']);
  if(yes('needDocuments'))rows.push(['Unterlagen',value('documents')||'Bitte ergänzen'],['Versandweg · Simulation',value('delivery')||'Bitte wählen'],['Empfänger',value('deliveryAddress')||'Bitte ergänzen']);
  if(yes('needAppointment'))rows.push(['Terminweg · Simulation',value('appointmentMode')||'Bitte wählen']);
  if(value('notes'))rows.push(['Notizen',value('notes')]);
  rows.push(['Test-PIN',verified?'Bestätigt · Keine Identitätsprüfung':'Nicht geprüft · Simulation']);
  preview.replaceChildren();
  rows.forEach(([name,info])=>{const item=document.createElement('div');item.className='summary-row';const label=document.createElement('dt');label.textContent=name;const data=document.createElement('dd');data.textContent=info;item.append(label,data);preview.append(item);});
}
form.elements.reason.addEventListener('change',()=>{
  const relation={'Rezept':'needPrescription','Rückruf vom Arzt':'needCallback','Unterlagen':'needDocuments','Terminanfrage':'needAppointment'};
  const key=relation[value('reason')];if(key)form.elements[key].checked=true;sync();
});
function edited(event){clearValidation(event.target);resultRoot.hidden=true;sync();}
form.addEventListener('input',edited);form.addEventListener('change',edited);
document.getElementById('fillDemo').addEventListener('click',()=>{
  form.reset();clearValidation();resetPin();sync();
  const example={firstName:'Julia',lastName:'Müller',birthDate:'1972-09-18',phone:'+49 170 0000000',insurance:'Beispielkasse',insuranceNumber:'MUSTER-12345',reason:'Mehrere Anliegen',prescription:'Folgerezept für das bereits verordnete Medikament; ärztliche Prüfung erforderlich.',notes:'Fiktives Gespräch: Die Patientin bittet um Rückruf zum Befund. Rückruf möglichst am Nachmittag. Keine medizinische Auskunft erteilt.',callbackDoctor:'Dr. Wickler',documents:'Befundbericht der letzten Untersuchung',delivery:'E-Mail',deliveryAddress:'julia.mueller@example.invalid',appointmentMode:'Terminanfrage für das Praxisteam aufnehmen'};
  config.forEach(([name])=>form.elements[name].checked=true);sync();
  for(const [k,v]of Object.entries(example))form.elements[k].value=v;
  resultRoot.hidden=true;feedback.textContent='Fiktives Beispiel geladen. Sie können alle Angaben ändern und die PDF erstellen.';sync();
});
document.getElementById('clearForm').addEventListener('click',()=>{form.reset();clearValidation();resetPin();resultRoot.hidden=true;feedback.textContent='Formular geleert.';sync();form.elements.firstName.focus();});
document.getElementById('sendDemoPin').addEventListener('click',()=>{
  if(!form.elements.phone.checkValidity()){feedback.textContent='Bitte zuerst eine gültige Beispieltelefonnummer eintragen.';markInvalid(form.elements.phone);return;}
  const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);demoPin=String(bytes[0]%1000000).padStart(6,'0');verified=false;pinIdentity=identity();pinTime=Date.now();pinInput.value='';
  pinLabel.textContent='Test-PIN: '+demoPin+' · 5 Minuten gültig';verifiedLabel.textContent='Testcode noch nicht bestätigt · Simulation';feedback.textContent='Keine SMS versendet. Nur lokale Testsimulation.';sync();
});
document.getElementById('verifyDemoPin').addEventListener('click',()=>{
  verified=Boolean(demoPin && pinInput.value.trim()===demoPin && pinIdentity===identity() && Date.now()-pinTime<300000);
  verifiedLabel.textContent=verified?'Demo-PIN korrekt · Keine Identitätsprüfung':'PIN falsch, abgelaufen oder noch nicht angezeigt.';sync();resultRoot.hidden=true;
});
form.addEventListener('submit',async event=>{
  event.preventDefault();if(exporting)return;feedback.textContent='';sync();
  const invalid=Array.from(form.elements).find(el=>el.willValidate&&!el.checkValidity());
  if(invalid){markInvalid(invalid);feedback.textContent='Bitte ergänzen Sie das markierte Pflichtfeld.';return;}
  if(verified&&Date.now()-pinTime>=300000){resetPin();sync();}
  const parts=[{title:'Patient und Kontakt',rows:[['Vorname',value('firstName')],['Nachname',value('lastName')],['Geburtsdatum',window.SanaPDF.formatDate(value('birthDate'))],['Telefon',value('phone')],['Versicherung',value('insurance')],['Versicherungsnummer',value('insuranceNumber')],['Grund des Anrufes',value('reason')]]},{title:'Anliegen und Bearbeitung',rows:[
    ['Rezept benötigt',yes('needPrescription')?'Ja':'Nein'],['Welches Rezept',value('prescription')],['Arztrückruf gewünscht',yes('needCallback')?'Ja':'Nein'],['Gewünschter Arzt',value('callbackDoctor')],['Unterlagen benötigt',yes('needDocuments')?'Ja':'Nein'],['Welche Unterlagen',value('documents')],['Versandweg (Simulation)',value('delivery')],['Kontaktadresse / Empfänger',value('deliveryAddress')],['Termin gewünscht',yes('needAppointment')?'Ja':'Nein'],['Terminorganisation (Simulation)',value('appointmentMode')],['Notizen',value('notes')]
  ]},{title:'Prüfung und Übergabe',rows:[['SMS-PIN (nur Demo)',verified?'Testcode bestätigt. Keine Identitätsprüfung.':'Nicht geprüft'],['Nächster Schritt','Ärztliche Anliegen und Rezepte werden durch die Praxis geprüft. Kein Termin wurde gebucht; keine SMS und keine Unterlagen wurden verschickt.'],['Dokumentstatus','Nur zur Vorführung. Lokal erstellt und nicht an die Praxis übermittelt.']]}];
  const btn=form.querySelector('button[type="submit"]');exporting=true;btn.disabled=true;btn.textContent='PDF wird erstellt …';
  try{const result=await window.SanaPDF.download({title:'Telefonisches Anliegen',subtitle:'A+ Solution · Gesprächsprotokoll · Fiktive Demonstration',sections:parts,signoff:true,filename:'SANA_Hotline_'+new Date().toISOString().slice(0,10)+'.pdf'});window.SanaPDF.showResult(resultRoot,result);feedback.textContent='PDF erstellt. Keine Daten gespeichert oder verschickt.';}
  catch(error){feedback.textContent='Die PDF konnte nicht erstellt werden. Bitte prüfen Sie die Verbindung und versuchen Sie es erneut.';}
  finally{exporting=false;btn.disabled=false;btn.textContent='PDF-Zusammenfassung erstellen';}
});
sync();
})();
