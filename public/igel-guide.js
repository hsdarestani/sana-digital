/* Sana Digital · voluntary, browser-only IGeL decision checklist.
 * Adapted from BÄK / KBV / DNEbM "Selbst zahlen?", 2nd ed. 2012,
 * last changed January 2014. No responses are transmitted or stored.
 */
(() => {
  'use strict';
  const questions = [
    'Wurde mir erklärt, warum die Leistung für mich notwendig oder empfehlenswert sein soll?',
    'Wurde erklärt, welche wissenschaftlichen Belege für ihren Nutzen vorliegen und wie verlässlich diese sind?',
    'Kenne ich den möglichen Nutzen und die Risiken oder Nebenwirkungen?',
    'Wurde ich sachlich informiert, ohne Werbung oder Entscheidungsdruck?',
    'Gibt es eine schriftliche Vereinbarung über die konkrete Leistung und die voraussichtlichen Kosten?',
    'Habe ich eine unabhängige Entscheidungshilfe oder weiterführende Informationen erhalten?',
    'Kann ich mich frei für oder gegen die vorgeschlagene Leistung entscheiden?',
    'Habe ich genügend Zeit, um in Ruhe darüber nachzudenken?',
    'Weiß ich, dass ich eine zweite ärztliche Meinung einholen kann?'
  ];
  const groups = [
    {title:'Nutzen und ärztliche Aufklärung',first:0,last:4},
    {title:'Verständliche Kosten und Informationen',first:4,last:6},
    {title:'Ihre freie Entscheidung',first:6,last:9}
  ];
  const answers = Array(questions.length).fill('');
  const html = [
    '<div class="igel-intro">',
      '<p>Individuelle Gesundheitsleistungen (IGeL) sind Leistungen, für die Versicherte selbst zahlen, wenn die Krankenkasse sie nicht übernimmt. Eine privat zu zahlende Leistung ist nicht automatisch sinnvoll oder notwendig. Klären Sie vorab, ob Ihre Krankenversicherung die Kosten möglicherweise übernimmt.</p>',
      '<div class="igel-facts">',
        '<div><span>01</span><strong>Nutzen & Risiken</strong><small>Lassen Sie sich ärztlich über wissenschaftliche Belege, Nutzen, mögliche Schäden und Alternativen informieren.</small></div>',
        '<div><span>02</span><strong>Kosten vorher klären</strong><small>Die Leistung und die zu erwartenden Kosten sollten vorab in einer gesonderten schriftlichen Vereinbarung klar sein.</small></div>',
        '<div><span>03</span><strong>Sie entscheiden</strong><small>Sie dürfen ablehnen, nachfragen, sich Zeit nehmen und eine zweite Meinung einholen.</small></div>',
      '</div>',
    '</div>',
    '<p class="igel-care-note">Eine medizinisch notwendige Behandlung darf nicht davon abhängig gemacht werden, ob Sie eine zusätzliche IGeL annehmen.</p>',
    '<div class="igel-check-head"><div><h3>9 Fragen vor Ihrer Entscheidung</h3><p>Freiwillig, ohne Speicherung – und ohne medizinische Bewertung.</p></div><span class="igel-progress" id="igelProgress" aria-live="polite">0 / 9</span></div>',
    '<div class="igel-question-list" id="igelQuestions"></div>',
    '<div class="igel-summary" id="igelSummary" role="status" aria-live="polite"></div>',
    '<div class="igel-after"><span aria-hidden="true">✓</span><div><h3>Nach der Behandlung</h3><p>Prüfen Sie, ob Sie eine nachvollziehbare Rechnung gemäß Gebührenordnung für Ärzte (GOÄ) erhalten. Das ist Punkt 10 der ursprünglichen Patienten-Checkliste.</p></div></div>',
    '<div class="igel-source"><b>Quelle:</b> Bundesärztekammer (BÄK), Kassenärztliche Bundesvereinigung (KBV) und Deutsches Netzwerk Evidenzbasierte Medizin: <i>Selbst zahlen? Ein Ratgeber zu Individuellen Gesundheitsleistungen (IGeL)</i>, 2. Auflage November 2012, zuletzt geändert Januar 2014; Patienten-Checkliste S. 9–16, Anhang S. 29–31.',
      '<p>Die Quelle ist älter. Diese zusammengefassten Hinweise ersetzen keine aktuelle rechtliche Prüfung, individuelle ärztliche Aufklärung oder gesonderte IGeL-Behandlungsvereinbarung. Die Nutzung ist keine Buchung, kein Kauf und keine Einwilligung.</p>',
    '</div>'
  ].join('');

  function make(tag,cls,content){
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(content!==undefined)el.textContent=content;
    return el;
  }
  function renderQuestions(root){
    const host=root.querySelector('#igelQuestions');
    if(!host)return;
    host.replaceChildren();
    for(const group of groups){
      const section=make('section','igel-group');
      section.append(make('h4',null,group.title));
      for(let i=group.first;i<group.last;i++){
        const fs=make('fieldset','igel-question');
        const legend=make('legend');
        legend.append(make('span','igel-number',String(i+1).padStart(2,'0')));
        legend.append(make('span',null,questions[i]));
        fs.append(legend);
        const choices=make('div','igel-answer-row');
        [['ja','Ja'],['offen','Noch offen'],['nein','Nein']].forEach(([value,label])=>{
          const l=make('label');
          const radio=make('input');
          radio.type='radio';radio.name='igel-question-'+i;radio.value=value;radio.dataset.index=String(i);
          radio.checked=answers[i]===value;
          const t=make('span',null,label);
          l.append(radio,t);choices.append(l);
        });
        fs.append(choices);section.append(fs);
      }
      host.append(section);
    }
  }
  function update(root){
    const count=answers.filter(Boolean).length;
    const counter=root.querySelector('#igelProgress');
    if(counter)counter.textContent=count+' / '+questions.length;
    const summary=root.querySelector('#igelSummary');
    if(!summary)return;
    const open=answers.map((value,i)=>value!== 'ja'?i+1:null).filter(Boolean);
    const title=make('b',null,count===0?'Gut zu wissen':count===questions.length?'Ihre Gesprächsnotizen':'Ihr Zwischenstand');
    const note=make('p');
    if(count===0)note.textContent='Ihre Antworten dienen nur Ihnen als Gedankenstütze. Sie werden weder gespeichert noch an Sana übertragen.';
    else if(open.length===0)note.textContent='Sie haben alle neun Punkte aus Ihrer Sicht bestätigt. Das ersetzt keine medizinische Beratung oder individuelle Entscheidung.';
    else note.textContent='Noch zu klären oder mit Nein beantwortet: Punkt '+open.join(', ')+'. Fragen Sie Ihre Ärztin oder Ihren Arzt. Sie müssen heute nichts entscheiden.';
    summary.replaceChildren(title,note);
  }
  function init(root){
    if(!root)return;
    renderQuestions(root);
    root.querySelector('#igelQuestions').addEventListener('change', event=>{
      const radio=event.target;
      if(!radio.matches('input[type="radio"][data-index]'))return;
      const index=Number(radio.dataset.index);
      if(!Number.isInteger(index)||index<0||index>=questions.length)return;
      answers[index]=radio.value;
      update(root);
    });
    update(root);
  }
  window.SanaIgelGuide={title:'IGeL – informiert entscheiden',eyebrow:'WISSEN & SELBST-CHECK',html,init,questionCount:questions.length};
})();