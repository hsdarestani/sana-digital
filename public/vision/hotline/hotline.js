(() => {
"use strict";
const form=document.getElementById("callForm"),preview=document.getElementById("liveSummary"),feedback=document.getElementById("feedback");
const config=[["needPrescription","prescriptionFields",["prescription"]],["needCallback","callbackFields",["callbackDoctor"]],["needDocuments","documentsFields",["documents","delivery","deliveryAddress"]],["needAppointment","appointmentFields",["appointmentMode"]]];
const value=n=>form.elements[n]?.value?.trim()||"";
const yes=n=>Boolean(form.elements[n]?.checked);
let demoPin=null,verified=false;
function sync(){
 config.forEach(([name,id,children])=>{
  const active=yes(name);document.getElementById(id).hidden=!active;
  children.forEach(key=>{form.elements[key].required=active;if(!active)form.elements[key].value="";});
 });
 const rows=[
  ["Patient",((value("firstName")+" "+value("lastName")).trim()||"Noch nicht angegeben")],
  ["Geburtsdatum",value("birthDate")||"—"],
  ["Telefon",value("phone")||"—"],
  ["Anliegen",value("reason")||"Noch nicht ausgewählt"]
 ];
 if(yes("needPrescription"))rows.push(["Rezept",value("prescription")||"Offen"]);
 if(yes("needCallback"))rows.push(["Arztrückruf",value("callbackDoctor")||"Arzt noch offen"]);
 if(yes("needDocuments"))rows.push(["Unterlagen",value("documents")||"Offen"],["Versand",value("delivery")||"Offen"]);
 if(yes("needAppointment"))rows.push(["Terminweg",value("appointmentMode")||"Noch offen"]);
 preview.replaceChildren();
 rows.forEach(([name,info])=>{
  const item=document.createElement("div");item.className="summary-row";
  const label=document.createElement("span");label.textContent=name;
  const data=document.createElement("b");data.textContent=info;
  item.append(label,data);preview.append(item);
 });
}
form.elements.reason.addEventListener("change",()=>{
 const relation={"Rezept":"needPrescription","Rückruf vom Arzt":"needCallback","Unterlagen":"needDocuments","Terminanfrage":"needAppointment"};
 const key=relation[value("reason")];if(key)form.elements[key].checked=true;
 sync();
});
form.addEventListener("input",sync);form.addEventListener("change",sync);
document.getElementById("fillDemo").addEventListener("click",()=>{
 const example={firstName:"Julia",lastName:"Berger",birthDate:"1972-09-18",phone:"+49 170 0000000",reason:"Mehrere Anliegen",notes:"Beispiel: Patientin bittet um Rückruf bezüglich eines Befundes.",callbackDoctor:"Dr. Wickler",documents:"Befundbericht",delivery:"E-Mail",deliveryAddress:"beispiel@example.de",appointmentMode:"Doctolib-Link per SMS vorbereiten (Konzept)"};
 form.reset();for(const [k,v] of Object.entries(example))form.elements[k].value=v;
 form.elements.needCallback.checked=true;form.elements.needDocuments.checked=true;form.elements.needAppointment.checked=true;
 verified=false;demoPin=null;document.getElementById("demoPin").textContent="Noch kein Testcode";
 document.getElementById("verifiedLabel").textContent="Status: Nicht geprüft (Simulation)";
 feedback.textContent="Fiktive Angaben geladen. Das ist kein echter Patient.";
 sync();
});
document.getElementById("clearForm").addEventListener("click",()=>{
 form.reset();demoPin=null;verified=false;document.getElementById("pinInput").value="";
 document.getElementById("demoPin").textContent="Noch kein Testcode";
 document.getElementById("verifiedLabel").textContent="Status: Nicht geprüft (Simulation)";
 feedback.textContent="Formular geleert.";sync();
});
document.getElementById("sendDemoPin").addEventListener("click",()=>{
 if(!value("phone")){feedback.textContent="Bitte zuerst eine Beispieltelefonnummer eintragen.";form.elements.phone.focus();return;}
 const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);demoPin=String(bytes[0]%1000000).padStart(6,"0");verified=false;
 document.getElementById("demoPin").textContent="Test-PIN: "+demoPin+" (nur auf diesem Gerät)";
 document.getElementById("verifiedLabel").textContent="Status: Demo-PIN noch nicht bestätigt";
 feedback.textContent="Keine SMS versendet. Nur lokale Testsimulation.";
});
document.getElementById("verifyDemoPin").addEventListener("click",()=>{
 const typed=document.getElementById("pinInput").value.trim();
 verified=Boolean(demoPin && typed===demoPin);
 document.getElementById("verifiedLabel").textContent=verified?"Demo-PIN korrekt (keine Identitätsprüfung)":"PIN falsch oder noch nicht angezeigt.";
});
form.addEventListener("submit",event=>{
 event.preventDefault();feedback.textContent="";
 sync();
 if(!form.reportValidity()){feedback.textContent="Bitte Pflichtfelder prüfen.";return;}
 const parts=[
  {title:"Patient und Kontakt",rows:[["Vorname",value("firstName")],["Nachname",value("lastName")],["Geburtsdatum",value("birthDate")],["Telefon",value("phone")],["Grund des Anrufes",value("reason")]]},
  {title:"Anliegen und Bearbeitung",rows:[
   ["Rezept benötigt",yes("needPrescription")?"Ja":"Nein"],["Welches Rezept",yes("needPrescription")?value("prescription"):""],
   ["Arztrückruf gewünscht",yes("needCallback")?"Ja":"Nein"],["Gewünschter Arzt",yes("needCallback")?value("callbackDoctor"):""],
   ["Unterlagen benötigt",yes("needDocuments")?"Ja":"Nein"],["Unterlagen",yes("needDocuments")?value("documents"):""],
   ["Versandweg",yes("needDocuments")?value("delivery"):""],["Kontaktadresse",yes("needDocuments")?value("deliveryAddress"):""],
   ["Terminwunsch",yes("needAppointment")?"Ja":"Nein"],["Terminorganisation",yes("needAppointment")?value("appointmentMode"):""],
   ["Notizen",value("notes")]
  ]},
  {title:"Prüfung und Übergabe",rows:[
   ["SMS-PIN (nur Demo)",verified?"Testcode bestätigt, keine Identitätsprüfung":"Nicht geprüft"],
   ["Nächster Schritt","Mitarbeiter prüft Anliegen und übergibt es an die Praxis. Keine reale Übermittlung."]
  ]}
 ];
 try{
  const filename="SANA_Hotline_Muster_"+new Date().toISOString().slice(0,10)+".pdf";
  window.SanaPDF.download({title:"Hotline Gesprächsprotokoll",subtitle:"A+ Solution · Beispielprozess mit menschlicher Betreuung",sections:parts,filename});
  feedback.textContent="Die PDF-Zusammenfassung wurde lokal erstellt. Keine Daten gespeichert oder verschickt.";
 }catch(err){feedback.textContent="PDF konnte nicht erstellt werden. Bitte auf diesem Gerät erneut versuchen.";console.warn("PDF export failed:",err?.message);}
});
sync();
})();