(() => {
  "use strict";
  const names = ["calls","capacity","paper","cockpit"];
  const tabs = [...document.querySelectorAll("[data-scenario]")];
  const panels = [...document.querySelectorAll(".scenario-panel")];
  const selectScenario = (name, shouldFocus = false) => {
    if (!names.includes(name)) return;
    tabs.forEach(t => {
      const selected = t.dataset.scenario === name;
      t.classList.toggle("active",selected);
      t.setAttribute("aria-selected",String(selected));
      t.setAttribute("tabindex",selected ? "0" : "-1");
      if (selected && shouldFocus) t.focus();
    });
    panels.forEach(p => {
      const selected = p.id === "pane-" + name;
      p.hidden = !selected;
      p.classList.toggle("active",selected);
    });
  };
  tabs.forEach((tab,index) => {
    tab.addEventListener("click",() => {
      selectScenario(tab.dataset.scenario);
      if (window.history && window.history.replaceState) window.history.replaceState(null,"","#"+tab.dataset.scenario);
    });
    tab.addEventListener("keydown",event => {
      if (!["ArrowRight","ArrowLeft","Home","End"].includes(event.key)) return;
      event.preventDefault();
      let newIndex = index;
      if (event.key === "Home") newIndex = 0;
      if (event.key === "End") newIndex = tabs.length-1;
      if (event.key === "ArrowRight") newIndex = (index+1)%tabs.length;
      if (event.key === "ArrowLeft") newIndex = (index-1+tabs.length)%tabs.length;
      selectScenario(names[newIndex],true);
      if (window.history && window.history.replaceState) window.history.replaceState(null,"","#"+names[newIndex]);
    });
  });
  const initial = window.location.hash.replace("#","");
  if (names.includes(initial)) selectScenario(initial);

  const requests = {
    termin: {
      prompt: "„Ich benötige einen Termin wegen Kniebeschwerden.“",
      title: "Terminanfrage vorbereitet",
      body: "Kategorie: Terminwunsch. Nächster Schritt: Terminwunsch durch das Team prüfen und geeignete Möglichkeiten nennen."
    },
    rueckruf: {
      prompt: "„Ich habe eine Frage zur Sprechstunde und möchte zurückgerufen werden.“",
      title: "Rückrufwunsch vorbereitet",
      body: "Kategorie: Rückruf. Nächster Schritt: Anfrage im Praxisteam priorisieren und bei Gelegenheit bearbeiten."
    },
    unterlagen: {
      prompt: "„Welche Unterlagen soll ich zum ersten Termin mitbringen?“",
      title: "Anfrage zu Unterlagen vorbereitet",
      body: "Kategorie: Patienteninformation. Nächster Schritt: Freigegebene Informationen bereitstellen oder eine Mitarbeiterin hinzuziehen."
    }
  };
  let request = "termin";
  document.querySelectorAll("[data-request]").forEach(button => button.addEventListener("click",() => {
    request = button.dataset.request;
    document.querySelectorAll("[data-request]").forEach(b => b.classList.toggle("active",b===button));
    document.getElementById("callPrompt").textContent = requests[request].prompt;
    document.getElementById("callResult").hidden = true;
    document.getElementById("simulateCall").innerHTML = "Anfrage simulieren <span aria-hidden=\"true\">→</span>";
  }));
  document.getElementById("simulateCall").addEventListener("click",() => {
    document.getElementById("callResultTitle").textContent=requests[request].title;
    document.getElementById("callResultBody").textContent=requests[request].body+" Keine Daten gespeichert oder gesendet.";
    document.getElementById("callResult").hidden = false;
    document.getElementById("simulateCall").textContent = "Anderes Beispiel wählen ↑";
  });
  const needs = {
    knee: ["Passenden Termin finden","Dr. Wickler oder ein fachlich geeigneter verfügbarer Arzt — nach Prüfung der Qualifikation und mit Zustimmung des Patienten."],
    routine: ["Allgemeine Orthopädie","Ein geeigneter Facharzt mit freier Kapazität könnte als Option angezeigt werden. Die Praxis legt die Eignung und Regeln fest."],
    shoulder: ["Schulter-Sprechstunde","Bei entsprechender fachlicher Qualifikation könnten verfügbare Optionen ergänzt werden — ohne automatisches Umlenken von Patienten."]
  };
  document.querySelectorAll("[data-need]").forEach(button => button.addEventListener("click",() => {
    document.querySelectorAll("[data-need]").forEach(b => b.classList.toggle("active",b===button));
    const data=needs[button.dataset.need];
    document.getElementById("matchingTitle").textContent=data[0];
    document.getElementById("matchingCopy").textContent=data[1];
  }));
  const calls=document.getElementById("callsRange"), missed=document.getElementById("missedRange"), capture=document.getElementById("captureRange");
  function updateForecast() {
    const c=Number(calls.value),m=Number(missed.value),s=Number(capture.value);
    const missedCalls=Math.round(5*c*m/100);
    const requests=Math.round(missedCalls*s/100);
    document.getElementById("callsNum").textContent=c.toLocaleString("de-DE");
    document.getElementById("missedNum").textContent=m+" %";
    document.getElementById("captureNum").textContent=s+" %";
    document.getElementById("lostCount").textContent=missedCalls.toLocaleString("de-DE");
    document.getElementById("recoveredCount").textContent=requests.toLocaleString("de-DE");
    document.getElementById("captureLabel").textContent=s+" %";
    document.getElementById("captureTrack").style.width=s+"%";
  }
  [calls,missed,capture].forEach(range => range.addEventListener("input",updateForecast));
  updateForecast();
})();