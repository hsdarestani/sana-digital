"use strict";
(() => {
 const buttons = {
   current: document.getElementById("today"),
   future: document.getElementById("future")
 };
 const title = document.getElementById("mode-title");
 function setMode(mode) {
   if (mode !== "current" && mode !== "future") return;
   document.body.dataset.mode = mode;
   buttons.current.setAttribute("aria-pressed", String(mode === "current"));
   buttons.future.setAttribute("aria-pressed", String(mode === "future"));
   title.textContent = mode === "current"
     ? "Diese Herausforderungen kennen viele Praxen."
     : "So könnte Ihr Praxisalltag aussehen.";
 }
 buttons.current.addEventListener("click", () => setMode("current"));
 buttons.future.addEventListener("click", () => setMode("future"));
 setMode("future");
})();