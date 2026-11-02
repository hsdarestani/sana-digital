(() => {
  'use strict';

  const TYPES = {
    school: {
      name: 'Schulbescheinigung',
      overline: 'BESCHEINIGUNG FÜR DIE SCHULE',
      description: 'Praxisbesuch und gegebenenfalls den ärztlich bestätigten Zeitraum dokumentieren.',
      fields: [
        {key: 'visitDate', label: 'Datum des Praxisbesuchs', type: 'date'},
        {key: 'from', label: 'Beginn des bescheinigten Zeitraums (optional)', type: 'date'},
        {key: 'to', label: 'Ende des bescheinigten Zeitraums (optional)', type: 'date'},
        {key: 'statement', label: 'Zusätzlicher Bescheinigungstext', type: 'textarea', placeholder: 'Nur ärztlich bestätigte Tatsachen eintragen.'}
      ]
    },
    attest: {
      name: 'Ärztliches Attest',
      overline: 'ÄRZTLICHE BESCHEINIGUNG',
      description: 'Medizinische Feststellungen ausschließlich durch die behandelnde Fachperson ergänzen.',
      fields: [
        {key: 'from', label: 'Gültig ab (optional)', type: 'date'},
        {key: 'to', label: 'Gültig bis (optional)', type: 'date'},
        {key: 'statement', label: 'Ärztliche Feststellung / Attesttext', type: 'textarea', placeholder: 'Ärztlich überprüften Attesttext eintragen.'},
        {key: 'additional', label: 'Ergänzende Hinweise (optional)', type: 'textarea', placeholder: 'Nur falls medizinisch erforderlich.'}
      ]
    },
    report: {
      name: 'Medizinischer Bericht',
      overline: 'MEDIZINISCHER BERICHT',
      description: 'Anlass, Befund, Beurteilung und Empfehlung getrennt dokumentieren.',
      fields: [
        {key: 'reason', label: 'Anlass / Fragestellung', type: 'textarea', placeholder: 'Behandlungsanlass'},
        {key: 'findings', label: 'Befunde', type: 'textarea', placeholder: 'Erhobene und verifizierte Befunde'},
        {key: 'assessment', label: 'Ärztliche Beurteilung', type: 'textarea', placeholder: 'Ärztliche Einschätzung'},
        {key: 'recommendation', label: 'Empfehlung / weiteres Vorgehen', type: 'textarea', placeholder: 'Nach ärztlicher Prüfung'}
      ]
    }
  };

  const today = (() => {
    const date = new Date();
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  })();

  const DEMO_PATIENT = Object.freeze({
    firstName: 'Max', lastName: 'Mustermann', birthDate: '2011-05-12',
    street: 'Musterstraße 12', postalCode: '60313', city: 'Frankfurt am Main'
  });
  const demoDrafts = () => ({
    school: {visitDate: today, from: '', to: '', statement: 'Diese Bescheinigung wurde ausschließlich für die Vorführung mit fiktiven Angaben erstellt.'},
    attest: {from: '', to: '', statement: 'Mustertext für ein ärztliches Attest. Vor Verwendung durch die behandelnde Ärztin oder den behandelnden Arzt vollständig ersetzen.', additional: ''},
    report: {reason: 'Fiktiver Vorstellungsgrund für die Demovorschau.', findings: 'Beispieltext. Kein tatsächlicher medizinischer Befund.', assessment: 'Hier steht nach Untersuchung die ärztliche Beurteilung.', recommendation: 'Hier steht das individuell empfohlene weitere Vorgehen.'}
  });
  const blankDrafts = () => ({
    school: {visitDate: '', from: '', to: '', statement: ''},
    attest: {from: '', to: '', statement: '', additional: ''},
    report: {reason: '', findings: '', assessment: '', recommendation: ''}
  });
  const state = {
    type: 'school',
    patient: {...DEMO_PATIENT},
    common: {issuedAt: today, place: 'Frankfurt am Main', clinician: 'Dr. med. Erika Beispiel'},
    drafts: demoDrafts(),
    source: 'demo'
  };

  const byId = id => document.getElementById(id);
  const safe = value => String(value == null ? '' : value).trim();
  const setText = (id, value) => {byId(id).textContent = value;};
  const asDate = iso => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return '';
    const parsed = new Date(iso + 'T12:00:00Z');
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) return '';
    return new Intl.DateTimeFormat('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'}).format(parsed);
  };
  const fullName = () => [state.patient.firstName, state.patient.lastName].map(safe).filter(Boolean).join(' ') || 'Name nicht angegeben';
  const periodText = (data) => {
    const start = asDate(data.from), end = asDate(data.to);
    if (start && end) return 'Zeitraum: ' + start + ' bis ' + end;
    if (start) return 'Ab dem ' + start;
    if (end) return 'Bis zum ' + end;
    return '';
  };

  function showFeedback(message, kind = 'error') {
    const notice = byId('feedback');
    notice.hidden = !message;
    notice.textContent = message || '';
    notice.dataset.kind = kind;
  }
  function markUnchecked() {
    byId('reviewConfirm').checked = false;
    showFeedback('');
  }
  function createNode(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function bindPatientInputs() {
    document.querySelectorAll('[data-patient]').forEach(input => {
      input.value = state.patient[input.dataset.patient] || '';
    });
    document.querySelectorAll('[data-common]').forEach(input => {
      input.value = state.common[input.dataset.common] || '';
    });
  }
  function renderFields() {
    setText('templateDescription', TYPES[state.type].description);
    const root = byId('templateFields');
    root.replaceChildren();
    for (const field of TYPES[state.type].fields) {
      const label = createNode('label', field.type === 'textarea' ? 'wide' : '');
      label.append(document.createTextNode(field.label));
      const input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
      if (field.type === 'textarea') {
        input.rows = 4;
        input.maxLength = 4000;
      } else {
        input.type = field.type;
      }
      input.name = field.key;
      if (field.placeholder) input.placeholder = field.placeholder;
      input.value = state.drafts[state.type][field.key] || '';
      input.addEventListener('input', () => {
        state.drafts[state.type][field.key] = input.value;
        markUnchecked();
        renderPreview();
      });
      label.append(input);
      root.append(label);
    }
    document.querySelectorAll('[data-type]').forEach(button => {
      const active = button.dataset.type === state.type;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function addSection(root, title, value, placeholder = 'Noch keine Angabe – ärztlich ergänzen') {
    const section = createNode('section', 'document-section');
    if (title) section.append(createNode('h3', null, title));
    section.append(createNode('p', safe(value) ? '' : 'document-placeholder', safe(value) || placeholder));
    root.append(section);
  }
  function renderPreview() {
    const type = TYPES[state.type], draft = state.drafts[state.type], root = byId('outContent');
    setText('outTitle', type.name);
    setText('outOverline', type.overline);
    setText('outDate', [safe(state.common.place), asDate(state.common.issuedAt)].filter(Boolean).join(', '));
    setText('outPatient', fullName());
    setText('outBirth', state.patient.birthDate ? 'Geburtsdatum: ' + (asDate(state.patient.birthDate) || 'Bitte Datum prüfen') : 'Geburtsdatum: —');
    setText('outAddress', [safe(state.patient.street), [safe(state.patient.postalCode), safe(state.patient.city)].filter(Boolean).join(' ')].filter(Boolean).join(' · '));
    setText('outClinician', safe(state.common.clinician));
    root.replaceChildren();
    if (state.type === 'school') {
      const visit = asDate(draft.visitDate);
      addSection(root, '', visit ? 'Hiermit wird bestätigt, dass ' + fullName() + ' am ' + visit + ' in unserer Praxis vorgestellt wurde.' : '', 'Praxisbesuch erst nach Prüfung bescheinigen.');
      if (periodText(draft)) addSection(root, 'Ärztlich bestätigter Zeitraum', periodText(draft));
      if (safe(draft.statement)) addSection(root, 'Weitere Angaben', draft.statement);
    } else if (state.type === 'attest') {
      addSection(root, 'Ärztliche Feststellung', draft.statement);
      if (periodText(draft)) addSection(root, 'Zeitraum', periodText(draft));
      if (safe(draft.additional)) addSection(root, 'Ergänzende Hinweise', draft.additional);
    } else {
      addSection(root, 'Anlass / Fragestellung', draft.reason);
      addSection(root, 'Befunde', draft.findings);
      addSection(root, 'Ärztliche Beurteilung', draft.assessment);
      addSection(root, 'Empfehlung / weiteres Vorgehen', draft.recommendation);
    }
  }
  function changeType(type) {
    if (!Object.hasOwn(TYPES, type)) return;
    state.type = type;
    markUnchecked();
    renderFields();
    renderPreview();
  }
  function resetDemo() {
    state.patient = {...DEMO_PATIENT};
    state.common = {issuedAt: today, place: 'Frankfurt am Main', clinician: 'Dr. med. Erika Beispiel'};
    state.drafts = demoDrafts();
    state.source = 'demo';
    history.replaceState(null, '', '/documents/');
    byId('sourceNotice').innerHTML = '<span class="source-icon">✧</span><span><b>Demomodus mit fiktiven Daten</b><small>Keine echten Patientendaten eingeben. Dokumente werden hier nicht gespeichert oder versendet.</small></span>';
    setText('patientSource', 'MUSTERDATEN');
    changeType('school');
    bindPatientInputs();
    showFeedback('');
  }
  function validate() {
    const draft = state.drafts[state.type];
    if (!safe(state.patient.firstName) || !safe(state.patient.lastName)) return 'Bitte Vor- und Nachnamen prüfen.';
    if (!asDate(state.common.issuedAt)) return 'Bitte ein gültiges Ausstellungsdatum eintragen.';
    if (!safe(state.common.clinician)) return 'Bitte die behandelnde Ärztin oder den behandelnden Arzt eintragen.';
    if (draft.from && draft.to && draft.from > draft.to) return 'Das Enddatum liegt vor dem Anfangsdatum.';
    if (state.type === 'school' && !asDate(draft.visitDate) && !safe(draft.statement)) return 'Bitte Praxisbesuch oder Bescheinigungstext eintragen.';
    if (state.type === 'attest' && !safe(draft.statement)) return 'Bitte den ärztlich geprüften Attesttext eintragen.';
    if (state.type === 'report' && (!safe(draft.reason) || !safe(draft.findings) || !safe(draft.assessment))) return 'Bitte Anlass, Befunde und ärztliche Beurteilung ausfüllen.';
    if (!byId('reviewConfirm').checked) return 'Bitte vor dem Drucken die Prüfung des Inhalts bestätigen.';
    return '';
  }
  function printDocument() {
    const error = validate();
    if (error) {
      showFeedback(error);
      byId('feedback').scrollIntoView({behavior: 'smooth', block: 'nearest'});
      return;
    }
    showFeedback('Der Browser öffnet den Druckdialog. Dort können Sie „Als PDF speichern“ auswählen.', 'success');
    window.print();
  }
  async function loadRecord() {
    const id = new URLSearchParams(location.search).get('record');
    if (!id) return;
    if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
      showFeedback('Ungültige Aktenreferenz. Die Demodaten bleiben aktiv.');
      return;
    }
    setText('patientSource', 'VERBINDUNG WIRD GEPRÜFT');
    try {
      const response = await fetch('/api/admin/records/' + encodeURIComponent(id), {
        credentials: 'same-origin', cache: 'no-store', headers: {'Accept': 'application/json'}
      });
      if (!response.ok || !(response.headers.get('Content-Type') || '').includes('application/json')) throw new Error('Kein Zugriff auf die Patientenakte.');
      const data = await response.json();
      if (!data.record || !data.record.data) throw new Error('Keine gültigen Patientendaten.');
      const record = data.record.data;
      state.patient = {
        firstName: safe(record.firstName), lastName: safe(record.lastName),
        birthDate: safe(record.birthDate), street: safe(record.street),
        postalCode: safe(record.postalCode), city: safe(record.city)
      };
      state.common = {issuedAt: today, place: safe(record.city) || 'Frankfurt am Main', clinician: ''};
      state.drafts = blankDrafts();
      state.source = 'record';
      const notice = byId('sourceNotice');
      notice.replaceChildren(createNode('span', 'source-icon', '✓'));
      const message = createNode('span');
      message.append(createNode('b', null, 'Patientenaufnahme sicher übernommen'), createNode('small', null, 'Persönliche Angaben wurden aus der geschützten Akte übernommen. Es werden keine Diagnosen, Schulunfähigkeit oder ärztlichen Aussagen automatisch abgeleitet.'));
      notice.append(message);
      setText('patientSource', 'AUS PATIENTENAKTE');
      byId('reviewConfirm').checked = false;
      bindPatientInputs();
      renderFields();
      renderPreview();
      showFeedback('');
    } catch {
      resetDemo();
      showFeedback('Die geschützte Akte konnte nicht geladen werden. Es werden ausschließlich fiktive Musterdaten gezeigt. Bitte Cloudflare Access und die Datenbank prüfen.');
    }
  }

  document.querySelectorAll('[data-type]').forEach(button => button.addEventListener('click', () => changeType(button.dataset.type)));
  document.querySelectorAll('[data-patient]').forEach(input => input.addEventListener('input', () => {
    state.patient[input.dataset.patient] = input.value;
    markUnchecked();
    renderPreview();
  }));
  document.querySelectorAll('[data-common]').forEach(input => input.addEventListener('input', () => {
    state.common[input.dataset.common] = input.value;
    markUnchecked();
    renderPreview();
  }));
  byId('resetDemo').addEventListener('click', resetDemo);
  byId('printTop').addEventListener('click', printDocument);
  byId('printBottom').addEventListener('click', printDocument);
  bindPatientInputs();
  renderFields();
  renderPreview();
  loadRecord();
})();
