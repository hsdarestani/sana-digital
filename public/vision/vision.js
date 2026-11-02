import {doctors,initialState,capacity,metrics} from './model.js';
const $=s=>document.querySelector(s);
const stage=$('#stage'),nav=$('.chapter-nav');
let state=initialState(),scene=-1,guided=false,contactKind='callback',shift='morning',teamView='reception',tech=0,toastTimer;
const names=['Empfang & Rückrufe','Ärzteauslastung','Digitale Aufnahme','Praxisübersicht','SANA 2028'];
const kinds={
 callback:{title:'Rückrufwunsch',description:'Julia Berger bittet um einen Rückruf zur Organisation ihres Praxisbesuchs.',action:'Rückruf durch das Praxisteam'},
 documents:{title:'Unterlagenfrage',description:'Julia Berger benötigt Informationen zu Unterlagen für den nächsten Praxisbesuch.',action:'Informationen vom Empfang bereitstellen'},
 general:{title:'Allgemeines Anliegen',description:'Julia Berger hat eine organisatorische Frage an das Team.',action:'Anliegen persönlich beantworten'}
};
const techs=[
 ['Menschen bleiben erreichbar.','Persönlicher Empfang','Eine verlässliche Ansprechperson im Alltag.','Eine zusätzliche oder gezielt eingesetzte Empfangskraft könnte Anrufe entgegennehmen, Anliegen dokumentieren und Rückrufe koordinieren.','Voraussetzungen: gemeinsam festgelegte Personalplanung, Zuständigkeiten und klare Vertretungsregelungen. Keine automatische Gesprächsführung.'],
 ['Kapazität verstehen.','Teamkapazität','Auslastung erkennen, ohne neue Buchungssysteme.','Eine verständliche Auswertung vorhandener, freigegebener Praxisdaten könnte dem Team helfen, Engpässe und freie Kapazitäten zu verstehen.','Die Terminbuchung bleibt bei Doctolib. Keine Doppelbuchung oder automatische Arztzuweisung. Reale Kalenderdaten werden hier nicht verwendet.'],
 ['Informationen reisen mit.','Digitale Aufnahme','Einmal erfassen, sinnvoll prüfen.','Die bereits erstellte digitale Patientenaufnahme kann als Ausgangspunkt dienen. Später könnten autorisierte Mitarbeiter Informationen für den Praxisbesuch vorbereiten.','Voraussetzungen: Datenschutzfreigabe, sichere Identifikation, Rollen und Berechtigungen sowie Prüfung der Praxissoftware.'],
 ['Eine Praxis. Ein Überblick.','Praxisorganisation','Ein gemeinsamer Blick auf offene Arbeit.','Offene Rückrufe, interne Bearbeitungsstände und der Status digitaler Aufnahmen könnten dem Team in einer klaren Ansicht helfen.','Dies ist eine Konzeptdemo mit rein fiktiven Daten. Keine Verbindung zur echten Rezeption oder Praxissoftware.']
];
function model(active=-1){return `<div class="spatial"><div class="blueprint"></div><div class="practice"><div class="practice-floor"><div class="connection"></div>${['Empfang','Behandlung','Warten','Organisation'].map((name,i)=>`<button class="room room-${'abcd'[i]} ${active===i?'selected':''}" data-room="${i}" aria-label="${name}: Zukunftsidee öffnen"><span>${name}</span><i class="furniture ${i===0?'desk':i===2?'sofa':'bed'}"></i>${i===0?'<i class="furniture chair"></i>':''}<i class="plant"></i></button>`).join('')}<div class="person"></div></div></div><div class="floating-label fl-a"><span class="live-dot"></span> VERNETZTE PRAXIS<b>Mehr Zeit für Menschen.</b></div><div class="floating-label fl-b">IM MITTELPUNKT<b>Ihr Praxisteam.</b></div><div class="model-caption">RÄUME ANKLICKEN & ENTDECKEN</div><span class="orbit-word">RAUM FÜR MÖGLICHKEITEN / 2028</span></div>`;}
function notify(message){$('.toast').textContent=message;$('.toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').classList.remove('visible'),3300);}
function showTech(i){tech=i;const t=techs[i];$('#detail-content').innerHTML=`<div class="eyebrow">SANA 2028 · MÖGLICHKEIT ${i+1}</div><h2>${t[0]}</h2><p>${t[3]}</p><p class="hint">${t[4]}</p><span class="pill">Zukunftskonzept · nicht angebunden</span>`;$('#detail').showModal();}
function intro(){const features=[
 ['01','Empfang & Rückrufe','Anfragen erfassen','Empfang ansehen','telephone'],
 ['02','Ärzteauslastung','Kapazitäten verstehen','Auslastung ansehen','capacity'],
 ['03','Digitale Aufnahme','Papier vermeiden','Aufnahme testen','intake'],
 ['04','Praxisübersicht','Alles im Blick','Übersicht öffnen','dashboard'],
 ['05','SANA 2028','Die Zukunft erleben','Zukunft entdecken','future']
];return `<section class="landing landing-focus"><div class="hero"><div class="hero-copy"><div class="eyebrow">SANA NEXT · FRANKFURT</div><h1>Die Praxis.<br><em>Neu gedacht.</em></h1><p>Weniger Papier. Mehr Überblick. Mehr Zeit für Patienten.</p><div class="hero-actions"><button class="primary" data-action="guided">Geführte Präsentation starten</button></div></div><div class="hero-preview" aria-label="Interaktives Praxismodell">${model()}</div></div><div class="landing-directory"><div class="directory-heading"><div><span class="eyebrow">FÜNF MÖGLICHKEITEN</span><h2>Ein Thema auswählen</h2></div><span class="directory-tip">Interaktive Konzeptdemo · fiktive Daten</span></div><div class="entry-grid">${features.map((item,i)=>`<button class="entry-card entry-${item[4]}" data-scene="${i}" aria-label="${item[1]}: ${item[2]}"><span class="entry-index">${item[0]}</span><span class="entry-copy"><strong>${item[1]}</strong><span class="entry-desc">${item[2]}</span></span><span class="entry-art" aria-hidden="true"><i></i><i></i><i></i></span><span class="entry-action">${item[3]}</span></button>`).join('')}</div></div></section>`;}
function header(n,title,aside){return `<div class="scene-header"><div><div class="eyebrow">${String(n+1).padStart(2,'0')} / 05 · ${names[n]}</div><h1 class="scene-title" tabindex="-1">${title}</h1><p class="scene-explainer">${aside}</p></div></div>`;}
function controls(message,button='Weiter erleben'){return `<div class="scene-controls"><button class="primary" data-action="next">${button}</button></div>`;}
function calls(){
 const item=kinds[contactKind];
 return header(0,'Persönlich erreichbar.<br><em>Spürbar entlastet.</em>','Anliegen werden persönlich aufgenommen und zuverlässig nachgehalten.')
 +`<div class="scene-grid reception-grid">
  <div class="reception-stage" aria-label="Beispiel eines persönlich organisierten Empfangs">
    <div class="reception-screen">
      <div class="reception-topline"><div class="reception-identity"><span class="signal-mark"></span>SANA / EMPFANG</div><span class="reception-demo">SIMULATION</span></div>
      <div class="reception-feature">
        <span class="reception-kicker">PERSÖNLICHER PATIENTENKONTAKT</span>
        <h2>Jeder Anruf<br>verdient <em>Antwort.</em></h2>
        <p>Ein Team. Ein klarer Ablauf.</p>
        <div class="signal-art" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      </div>
      <div class="reception-process" aria-label="Drei Arbeitsschritte">
        <div class="process-item"><span class="process-index">01</span><div><strong>Persönlich annehmen</strong><small>Ein Mitarbeiter ist erreichbar.</small></div><span class="process-indicator"></span></div>
        <div class="process-item"><span class="process-index">02</span><div><strong>Anliegen dokumentieren</strong><small>Der nächste Schritt ist eindeutig.</small></div><span class="process-indicator ${state.request?'on':''}"></span></div>
        <div class="process-item"><span class="process-index">03</span><div><strong>Im Team nachhalten</strong><small>Offen oder erledigt, jederzeit nachvollziehbar.</small></div><span class="process-indicator ${state.callbackDone?'on':''}"></span></div>
      </div>
      <div class="reception-screen-foot"><span class="screen-status"><i></i> MENSCHLICH BETREUT</span><span>OHNE KI · OHNE TERMINBUCHUNG</span></div>
    </div>
  </div>
  <section class="panel reception-actions" aria-label="Beispielanliegen bearbeiten">
    <div class="panel-label">EINEN VORGANG AUSPROBIEREN <span class="pill">Fiktive Daten</span></div>
    <h2 class="reception-action-heading">Was möchte die Patientin?</h2>
    <p class="overview">Julia Berger · Beispielpatientin</p>
    <label class="compact-choice"><span>Anliegen</span><select id="contact-kind-select" aria-label="Art des Anliegens" ${state.request?'disabled':''}><option value="callback" ${contactKind==='callback'?'selected':''}>Rückruf</option><option value="documents" ${contactKind==='documents'?'selected':''}>Unterlagen</option><option value="general" ${contactKind==='general'?'selected':''}>Allgemeine Frage</option></select></label>
    <div class="reception-request-preview"><span class="request-preview-label">AUSGEWÄHLTES ANLIEGEN</span><h3>${item.title}</h3><p>${item.description}</p><div class="request-next"><span>Bearbeitung durch</span><strong>${item.action}</strong></div></div>
    ${state.request?`<div class="receipt-confirm" role="status"><span class="receipt-check" aria-hidden="true"></span><div><strong>Im Beispielteam erfasst</strong><p>Der Vorgang erscheint jetzt in der Praxisübersicht.</p></div></div><button class="secondary full-width" data-action="to-command">In Praxisübersicht anzeigen</button>`:`<button class="primary full-width" data-action="record-contact">Anliegen im Team erfassen</button>`}
    <details class="demo-fineprint"><summary>Über diese Demo</summary><p>Keine echten Anrufe oder Patientendaten. Terminbuchungen bleiben bei Doctolib.</p></details>
  </section>
 </div>`+controls('Eine zusätzliche Empfangskraft könnte Anrufe organisieren und Rückrufe nachvollziehbar bearbeiten.','Ärzteauslastung ansehen');
}
function scheduling(){
 const numbers=capacity(shift),total=numbers.reduce((sum,v)=>sum+v,0);
 return header(1,'Eine Praxis.<br><em>Den Überblick behalten.</em>','Wo ist das Team ausgelastet, wo gibt es Kapazität?')
 +`<div class="scene-grid"><div class="panel"><div class="panel-label">AUSLASTUNGSÜBERSICHT <span class="pill">Fiktive Zahlen</span></div><div class="segmented capacity-choices"><button data-shift="morning" class="${shift==='morning'?'active':''}">Vormittag</button><button data-shift="afternoon" class="${shift==='afternoon'?'active':''}">Nachmittag</button></div><div class="capacity-doctors">${doctors.map((d,i)=>`<div class="capacity-item"><div class="doctor-summary"><span class="avatar">${d.initials}</span><div class="doctor-name">${d.name}<small>${d.field}</small></div><span class="capacity-value">${numbers[i]}/6</span></div><div class="capacity-track"><span style="width:${Math.round(numbers[i]/6*100)}%"></span></div></div>`).join('')}</div></div><div class="panel"><div class="panel-label">INTERAKTIVE BETRACHTUNG</div><div class="utilization-number">${total}<small> von 18 Beispiel-Zeitfenstern</small></div><div class="utilization-track"><span style="width:${Math.round(total/18*100)}%"></span></div><div class="match"><span class="pill">MÖGLICHE FRAGE AN DAS TEAM</span><h3>Wo entstehen Engpässe?</h3><p>Kapazitäten erkennen und Maßnahmen im Team entscheiden.</p></div><details class="demo-fineprint"><summary>Zur Simulation</summary><p>Fiktive Zahlen und Arztprofile. Keine echten Kalender, Reservierungen oder automatische Arztzuweisung. Doctolib bleibt bestehen.</p></details></div></div>`
 +controls('Vergleichen Sie die beiden Tageshälften. Die Zahlen dienen allein zur Veranschaulichung.','Weniger Papier erleben');
}
function paper(){return header(2,'Einmal erfassen.<br><em>Besser vorbereitet.</em>','Patientendaten einmal eingeben und intern prüfen.')
+`<div class="scene-grid paper-grid"><div class="panel device-scene"><div class="phone"><div class="panel-label">SANA · AUFNAHME</div><h3>Guten Tag,<br>Frau Berger.</h3><p class="subtle">Ihre Vorbereitung beginnt hier.<br>Nur fiktive Beispielangaben.</p><label for="mobility">Unterstützung beim Besuch</label><select id="mobility" ${state.intake?'disabled':''}><option value="Keine Unterstützung">Keine Unterstützung</option><option value="Barrierearmer Zugang">Barrierearmer Zugang</option><option value="Begleitperson vorgesehen">Begleitperson vorgesehen</option></select><label class="check-row"><input type="checkbox" id="intake-consent" ${state.intake?'checked disabled':''}>Beispielangaben zur Prüfung freigeben.</label><button class="primary" data-action="send-intake" ${state.intake?'disabled':''}>${state.intake?'Beispielangaben übermittelt':'Beispielangaben senden'}</button><p class="subtle">Keine echten Daten eingeben.</p></div><div class="flow-arrow ${state.intake?'active':''}" aria-hidden="true"></div><div class="workstation"><div class="panel-label">PRAXISANSICHT <span class="live-dot"></span></div><div class="segmented"><button data-view="reception" class="${teamView==='reception'?'active':''}">Anmeldung</button><button data-view="doctor" class="${teamView==='doctor'?'active':''}">Arzt</button></div>${!state.intake?'<p class="empty-state">Noch keine Angaben.<br>Bitte ein Beispiel auf dem Smartphone freigeben.</p>':teamView==='doctor'&&!state.reviewed?'<p class="empty-state">Die Anmeldung prüft<br>die Angaben zuerst.</p>':`<div class="record"><h3>Julia Berger <span class="pill">Fiktiv</span></h3><div class="record-item"><span>Unterstützung</span><b>${state.intake.support}</b></div><div class="record-item"><span>Status</span><b>${state.reviewed?'Durch Anmeldung geprüft':'Prüfung ausstehend'}</b></div>${teamView==='reception'&&!state.reviewed?'<button class="primary full-width" data-action="review-intake">Prüfen und intern freigeben</button>':''}${teamView==='doctor'?'<p class="hint">Patientenangabe, keine ärztliche Diagnose oder Befundung.</p>':''}</div>`}</div></div><div class="paper-copy"><span class="panel-label">INFORMATIONEN, DIE MITREISEN</span><h3>Der Mensch kommt an.<br>Die Informationen<br>sind vorbereitet.</h3><p>Vom Smartphone zur Anmeldung und weiter zum Arzt.</p><ol class="step-list"><li class="${state.intake?'done':''}"><span>01</span>Patientin gibt Beispielangaben frei</li><li class="${state.reviewed?'done':''}"><span>02</span>Anmeldung prüft und gibt frei</li><li class="${state.reviewed&&teamView==='doctor'?'done':''}"><span>03</span>Arzt sieht die Vorbereitung</li></ol><a class="link-button" href="/" target="_blank" rel="noopener">Bestehende Patientenaufnahme ansehen</a><details class="demo-fineprint"><summary>Zur Simulation</summary><p>Keine echte Datenübertragung. Die vorhandene Patientenaufnahme bleibt unverändert.</p></details></div></div>`
+controls('Wählen Sie nach der Freigabe die Arztansicht, um die interne Übergabe zu sehen.','Die Praxiszentrale entdecken');}
function command(){
 const m=metrics(state,shift),events=[];
 if(state.request)events.push(`<div class="event"><span>1</span><div>${kinds[state.request.kind].title} im Team erfasst<small>Julia Berger · ${state.callbackDone?'Bearbeitung abgeschlossen':'Offen zur persönlichen Bearbeitung'}</small></div>${!state.callbackDone?'<button class="secondary" data-action="callback-done">Als erledigt markieren</button>':''}</div>`);
 if(state.intake)events.push(`<div class="event"><span>2</span><div>Digitale Aufnahme eingegangen<small>${state.reviewed?'Geprüft und intern freigegeben':'Wartet auf Prüfung durch die Anmeldung'}</small></div>${!state.reviewed?'<button class="secondary" data-action="to-paper">Prüfen</button>':''}</div>`);
 const values=capacity(shift);
 return header(3,'Alles im Blick.<br><em>Das Team entlasten.</em>','Alles auf einen Blick. Mit Ihren Aktionen aktualisiert.')
 +`<div class="metric-row"><div class="metric"><small>OFFENE ANLIEGEN</small><strong>${m.requests.toString().padStart(2,'0')}</strong><p>Aus dem simulierten Empfang</p></div><div class="metric"><small>DIGITALE AUFNAHMEN</small><strong>${m.records.toString().padStart(2,'0')}</strong><p>Aus Ihrer Beispielreise</p></div><div class="metric"><small>INTERN GEPRÜFT</small><strong>${m.reviewed.toString().padStart(2,'0')}</strong><p>Vom Team freigegebene Angaben</p></div></div><div class="command-grid"><div class="panel"><div class="panel-label">BEISPIELAUSLASTUNG <span class="pill">${shift==='morning'?'Vormittag':'Nachmittag'} · ${m.occupied}/18</span></div><div class="chart">${doctors.map((d,i)=>`<div class="chart-bar"><i data-height="${Math.round(capacity('morning')[i]/6*100)}"></i><i data-height="${Math.round(values[i]/6*100)}"></i><small>${d.name}</small></div>`).join('')}</div><div class="legend chart-legend"><span><i class="busy"></i>Vormittag</span><span><i></i>Ausgewählte Tageshälfte</span></div><details class="demo-fineprint"><summary>Zur Simulation</summary><p>18 fiktive Kapazitätseinheiten. Keine Buchungsfunktion oder echten Kalenderdaten. Doctolib bleibt bestehen.</p></details></div><div class="panel"><div class="panel-label">VORGÄNGE IM PRAXISTEAM <span>FIKTIVE PATIENTIN: JULIA BERGER</span></div><div class="event-log">${events.length?events.join(''):'<div class="empty-events">Noch keine Einträge. Starten Sie am Empfang oder mit der digitalen Aufnahme.<div><button class="link-button" data-action="to-call">Empfang erleben</button></div></div>'}</div></div></div>`
 +controls('Alles nachvollziehbar und ausschließlich simuliert. Keine Einsparversprechen oder versteckten Annahmen.','Die Zukunft entdecken');
}
function future(){return header(4,'Die Zukunft ist<br><em>ein Zusammenspiel.</em>','Alle Möglichkeiten der Praxis in einem Bild.')
+`<div class="future-grid">${model(tech)}<div class="tech-list">${techs.map((t,i)=>`<button class="tech-item ${tech===i?'active':''}" data-tech="${i}"><span class="tech-num">0${i+1}</span><div><b>${t[1]}</b><small>${t[2]}</small></div></button>`).join('')}<div class="finish"><span class="eyebrow">NÄCHSTER SCHRITT</span><button class="link-button" data-action="pilot">Pilotprojekt ansehen</button></div></div></div>`
+controls('Alles konzeptionell. Die eigentliche Terminbuchung bleibt in Doctolib.','Noch einmal erleben');}
function render(){
 nav.hidden=scene<0;
 nav.innerHTML=`<div class="desktop-chapters"><button data-action="overview" class="overview-tab" aria-label="Zur Startübersicht">Alle Bereiche</button>${names.map((name,i)=>`<button data-scene="${i}" class="${scene===i?'active':''}" ${scene===i?'aria-current="step"':''}><span class="num">0${i+1}</span>${name}</button>`).join('')}</div><div class="mobile-chapters"><button data-action="overview" class="mobile-overview">Übersicht</button><label class="mobile-current"><span>${String(scene+1).padStart(2,'0')} / 05</span><select id="mobile-chapter-select" aria-label="Bereich auswählen">${names.map((name,i)=>`<option value="${i}" ${i===scene?'selected':''}>${name}</option>`).join('')}</select><span class="select-chevron" aria-hidden="true"></span></label></div>`;
 stage.innerHTML=(scene>=0&&guided?`<div class="guide-strip"><b>GEFÜHRTE PRÄSENTATION</b><span>Schritt ${scene+1} von 5 · Sie bestimmen das Tempo.</span><button data-action="unguided">Frei erkunden</button></div>`:'')+(scene<0?intro():`<section class="scene">${[calls,scheduling,paper,command,future][scene]()}</section>`);
 document.querySelectorAll('[data-height]').forEach(el=>el.style.height=el.dataset.height+'%');
 if(state.intake&&$('#mobility'))$('#mobility').value=state.intake.support;
}
function go(n){scene=n;render();window.scrollTo({top:0,behavior:'instant'});$('.scene-title')?.focus({preventScroll:true});}
function reset(){state=initialState();contactKind='callback';shift='morning';teamView='reception';tech=0;guided=false;go(-1);}
document.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button||button.disabled)return;const d=button.dataset;
 if(d.scene!==undefined){go(Number(d.scene));return;}
 if(d.room!==undefined){showTech(Number(d.room));return;}
 if(d.tech!==undefined){tech=Number(d.tech);render();showTech(tech);return;}
 if(d.contactkind){contactKind=d.contactkind;render();return;}
 if(d.shift){shift=d.shift;render();return;}
 if(d.view){teamView=d.view;render();return;}
 switch(d.action){
 case 'guided':guided=true;go(0);break;
 case 'explore':guided=false;go(0);break;
 case 'unguided':guided=false;render();notify('Bereiche frei auswählen.');break;
 case 'overview':guided=false;go(-1);break;
 case 'record-contact':if(!state.request){state.request={kind:contactKind};render();notify('Anliegen im fiktiven Praxisteam erfasst.');}break;
 case 'next':if(scene===4)reset();else go(Math.min(scene+1,4));break;
 case 'send-intake':if(!$('#intake-consent')?.checked){notify('Bitte die Freigabe der Beispielangaben bestätigen.');return;}if(!state.intake){state.intake={support:$('#mobility').value};render();notify('Beispielangaben wurden intern an die Anmeldung übergeben.');}break;
 case 'review-intake':if(state.intake&&!state.reviewed){state.reviewed=true;render();notify('Für die Arztansicht freigegeben.');}break;
 case 'to-call':go(0);break;
 case 'to-paper':go(2);break;
 case 'to-command':go(3);break;
 case 'callback-done':state.callbackDone=true;render();notify('Vorgang als erledigt markiert.');break;
 case 'pilot':$('#detail-content').innerHTML='<div class="eyebrow">VON DER VISION ZUM PILOT</div><h2>Persönliche Betreuung.<br>Besser organisierte Abläufe.</h2><p>Gemeinsam mit dem Team einen Engpass auswählen: etwa die Organisation des Empfangs, die Nachverfolgung von Rückrufen oder eine digitale Vorabaufnahme.</p><p>Vor dem Start: Zuständigkeiten, Datenschutz und technische Voraussetzungen klären. Doctolib bleibt für die Terminbuchung bestehen.</p><a class="primary" href="/" target="_blank" rel="noopener">Bestehende Aufnahme ansehen</a>';$('#detail').showModal();break;
 case 'confirm-reset':$('#detail').close();reset();notify('Alle Beispielaktionen wurden zurückgesetzt.');break;
 }
});
$('#home').addEventListener('click',()=>{guided=false;go(-1);});
$('#reset').addEventListener('click',()=>{
 if(!state.request&&!state.intake){reset();return;}
 $('#detail-content').innerHTML='<div class="eyebrow">NEU BEGINNEN</div><h2>Eine neue Praxisreise?</h2><p>Die simulierten Anliegen und die Beispielaufnahme werden zurückgesetzt. Die vorhandene Patientenaufnahme bleibt unberührt.</p><button class="primary" data-action="confirm-reset">Beispielreise zurücksetzen</button>';
 $('#detail').showModal();
});
$('.close-dialog').addEventListener('click',()=>$('#detail').close());
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else notify('Vollbild ist in diesem Browser nicht verfügbar.');}catch{notify('Vollbild ist hier nicht verfügbar.');}});
document.addEventListener('fullscreenchange',()=>$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'Vollbild beenden':'Vollbild öffnen'));
document.addEventListener('change',e=>{if(e.target.id==='contact-kind-select'&&!state.request&&kinds[e.target.value]){contactKind=e.target.value;render();return;}if(e.target.id==='mobile-chapter-select'){const index=Number(e.target.value);if(Number.isInteger(index)&&index>=0&&index<names.length)go(index);}});
document.addEventListener('keydown',e=>{if($('#detail').open||e.target.matches('input,select,textarea,button,a')||scene<0)return;if(e.key==='ArrowRight'&&scene<4){e.preventDefault();$('[data-action="next"]')?.click();}if(e.key==='ArrowLeft'&&scene>0){e.preventDefault();go(scene-1);}});
render();
