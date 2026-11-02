(() => {
  "use strict";
  const btn=document.getElementById("samplePdf");
  const status=document.getElementById("pdfStatus");
  btn.addEventListener("click",()=>{
    try {
      window.SanaPDF.download({
        title:"Digitale Patientenaufnahme",
        subtitle:"MUSTER MIT FIKTIVEN DATEN · NICHT ÜBERMITTELT",
        filename:"SANA_Patientenaufnahme_Muster.pdf",
        sections:[
          {title:"Persönliche Daten",rows:[["Vorname","Julia"],["Nachname","Berger"],["Geburtsdatum","18.09.1972"],["Telefon","+49 170 0000000"],["Anschrift","Musterstraße 12, 60313 Frankfurt"],["Krankenversicherung","Beispielkasse"]]},
          {title:"Gesundheitsangaben",rows:[["Grund der Vorstellung","Vorstellung in der orthopädischen Sprechstunde"],["Hausarzt","Dr. Muster"],["Medikamente","Keine Angabe"],["Allergien","Keine Angabe"],["Operationen","Keine Angabe"]]},
          {title:"Datenschutz und Bestätigung",rows:[["Patienteninformationen","Zur Kenntnis genommen (Beispiel)"],["Externe Abrechnung","Keine Einwilligung erteilt"],["Zusammenfassung","Diese Datei dient ausschließlich zur Demonstration. Keine echte Patientenaufnahme oder medizinische Dokumentation."]]}
        ]
      });
      status.textContent="Muster-PDF erstellt. Alle Daten sind erfunden.";
    } catch(error) {
      status.textContent="PDF konnte auf diesem Gerät nicht erstellt werden. Bitte erneut versuchen.";
    }
  });
})();