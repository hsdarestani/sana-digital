/* Branded, searchable A4 documents. Only static font/logo assets are fetched.
   All form data and generated PDF bytes stay in the current browser session. */
(() => {
  'use strict';
  const PAGE = [595.28, 841.89], M = 44, RIGHT = PAGE[0] - M, BOTTOM = 765;
  const BLUE = '#0078aa', INK = '#183e54', MUTED = '#526c7b', LINE = '#dce6ec';
  let assetsPromise, currentUrl;
  const clean = s => String(s ?? '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
  function formatDate(value) {
    const parts = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return parts ? `${parts[3]}.${parts[2]}.${parts[1]}` : String(value || '');
  }
  function assets() {
    if (!assetsPromise) assetsPromise = Promise.all([
      '/assets/fonts/DejaVuSans.ttf', '/assets/fonts/DejaVuSans-Bold.ttf', '/assets/sana-logo.png'
    ].map(async path => {
      const result = await fetch(path, {credentials:'same-origin', cache:'force-cache'});
      if (!result.ok) throw new Error('Die PDF-Schriften konnten nicht geladen werden.');
      return new Uint8Array(await result.arrayBuffer());
    })).catch(error => { assetsPromise = null; throw error; });
    return assetsPromise;
  }
  async function prepare({title='Zusammenfassung', subtitle='Konzeptdemo · Nicht übermittelt', sections=[], filename='SANA_Zusammenfassung.pdf', signature=null, signoff=false, createdAt=new Date()}={}) {
    const {PDFDocument, rgb} = window.PDFLib;
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(window.fontkit);
    const [normalBytes, boldBytes, logoBytes] = await assets();
    const regular = await pdf.embedFont(normalBytes, {subset:true});
    const bold = await pdf.embedFont(boldBytes, {subset:true});
    const logo = await pdf.embedPng(logoBytes);
    pdf.setTitle(title); pdf.setAuthor('Sana MVZ Frankfurt-Westend · Konzeptdemo');
    pdf.setSubject('Lokal erstellte Zusammenfassung · Nicht an die Praxis übermittelt');
    pdf.setCreator('SANA NEXT'); pdf.setCreationDate(new Date(createdAt)); pdf.setModificationDate(new Date(createdAt)); pdf.setLanguage('de-DE');
    const color = hex => rgb(...hex.match(/[a-f0-9]{2}/gi).map(n => parseInt(n,16)/255));
    let page, y, sectionNumber=0;
    const pages=[];
    function text(s,x,top,size=10,font=regular,hex=INK) {
      page.drawText(clean(s), {x, y:PAGE[1]-top-size, size, font, color:color(hex), lineHeight:size*1.4});
    }
    function rule(top, x=M, end=RIGHT) {page.drawLine({start:{x,y:PAGE[1]-top},end:{x:end,y:PAGE[1]-top},thickness:.65,color:color(LINE)});}
    function rect(x,top,w,h,hex) {page.drawRectangle({x,y:PAGE[1]-top-h,width:w,height:h,color:color(hex)});}
    function wrap(value, width, size=10.5, font=regular) {
      const lines=[];
      for (const paragraph of clean(value).split('\n')) {
        if (!paragraph.trim()) {lines.push(''); continue;}
        let line='';
        for (const word of paragraph.trim().split(/\s+/u)) {
          if (font.widthOfTextAtSize(word,size)>width) {
            if (line) {lines.push(line);line='';}
            let chunk='';
            for (const ch of Array.from(word)) {
              if (chunk && font.widthOfTextAtSize(chunk+ch,size)>width) {lines.push(chunk);chunk='';}
              chunk+=ch;
            }
            line=chunk;
          } else if (line && font.widthOfTextAtSize(line+' '+word,size)>width) {lines.push(line);line=word;}
          else line=line?line+' '+word:word;
        }
        if (line) lines.push(line);
      }
      return lines.length?lines:[''];
    }
    function newPage(first=false) {
      page=pdf.addPage(PAGE); pages.push(page);
      rect(0,0,PAGE[0],4,BLUE);
      rect(M,29,31,56,BLUE);
      page.drawImage(logo,{x:M+5,y:PAGE[1]-79,width:21,height:38});
      text('Sana MVZ',88,32,15,bold,BLUE);
      text('Orthopädie und Chirurgie',88,54,9,regular,MUTED);
      text('Frankfurt-Westend',88,68,9,regular,MUTED);
      const stamp=new Date(createdAt).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
      const stampWidth=regular.widthOfTextAtSize(stamp,9);
      text(stamp,RIGHT-stampWidth,36,9,regular,MUTED);
      text('KONZEPTDEMO',RIGHT-bold.widthOfTextAtSize('KONZEPTDEMO',7.5),54,7.5,bold,BLUE);
      if(first) {
        const titleLines=wrap(title,RIGHT-M,23,bold);
        let top=109;
        titleLines.forEach(line=>{text(line,M,top,23,bold);top+=29;});
        const subLines=wrap(subtitle,RIGHT-M-24,9,regular);
        const height=subLines.length*13+18;
        rect(M,top+9,RIGHT-M,height,'#eef6fa');
        subLines.forEach((line,i)=>text(line,M+12,top+18+i*13,9,regular,BLUE));
        y=top+height+36;
      } else {
        rule(100);
        text(title,M,112,12,bold);
        text('Fortsetzung · Nicht an die Praxis übermittelt',M,132,8.5,regular,MUTED);
        y=160;
      }
    }
    function ensure(height) {if(y+height>BOTTOM)newPage();}
    function heading(title, number, continued=false) {
      const label=title+(continued?' · Fortsetzung':'');
      const lines=wrap(label,RIGHT-M-35,10.5,bold);
      ensure(34+lines.length*15+38);
      rect(M,y,23,23,'#e6f2f8');
      text(String(number).padStart(2,'0'),M+5,y+5,8.5,bold,BLUE);
      lines.forEach((line,i)=>text(line,M+35,y+4+i*15,10.5,bold,BLUE));
      y+=Math.max(23,lines.length*15)+12;
    }
    function field(label,value,sectionTitle,number) {
      const keyLines=wrap(label,157,9.5,regular);
      const lines=wrap(value,RIGHT-226,10.5,regular);
      const gap=15;
      let at=0, first=true;
      while(at<lines.length) {
        const minHeight=Math.max(keyLines.length*gap,Math.min(lines.length-at,2)*gap)+10;
        if(y+minHeight>BOTTOM){newPage();heading(sectionTitle,number,true);}
        const count=Math.max(1,Math.min(lines.length-at,Math.floor((BOTTOM-y-10)/gap)));
        const visibleKeys=first?keyLines:wrap(label+' (Fortsetzung)',157,9.5);
        const h=Math.max(visibleKeys.length,count)*gap+10;
        if(y+h>BOTTOM){newPage();heading(sectionTitle,number,true);continue;}
        visibleKeys.forEach((line,i)=>text(line,M,y+6+i*gap,9.5,regular,MUTED));
        lines.slice(at,at+count).forEach((line,i)=>text(line,226,y+5+i*gap,10.5,regular,INK));
        rule(y+h-1);y+=h;at+=count;first=false;
      }
    }
    newPage(true);
    for(const [blockIndex,block] of sections.entries()) {
      const rows=(block?.rows||[]).filter(pair=>Array.isArray(pair)&&pair[1]!==null&&pair[1]!==undefined&&String(pair[1]).trim());
      if(!rows.length)continue;
      if((signature||signoff) && blockIndex===sections.length-1){
        const estimate=35+16+155+rows.reduce((sum,pair)=>sum+Math.max(wrap(pair[0],157,9.5).length,wrap(pair[1],RIGHT-226,10.5).length)*15+10,0);
        if(estimate<=BOTTOM-160 && y+estimate>BOTTOM)newPage();
      }
      sectionNumber++;heading(block.title||'Weitere Angaben',sectionNumber);
      for(const pair of rows)field(clean(pair[0]),pair[1]==='ja'?'Ja':pair[1]==='nein'?'Nein':clean(pair[1]),block.title||'Weitere Angaben',sectionNumber);
      y+=16;
    }
    if(signature || signoff) {
      ensure(155);sectionNumber++;heading(signature?'Unterschrift':'Interne Prüfung',sectionNumber);
      if(signature?.sample) {
        page.drawSvgPath('M 0 25 C 12 5 22 4 12 31 S 9 34 29 16 S 28 42 42 23 S 42 34 57 19 S 60 31 71 18 S 70 31 89 22 S 88 29 110 19 S 114 27 134 16', {x:M+9,y:PAGE[1]-y-12,scale:1.2,borderWidth:1.1,borderColor:color(INK)});
        text('Beispielunterschrift · Keine wirksame Einwilligung',M,y+63,8,regular,MUTED);
      } else if(signature) {
        const png=await pdf.embedPng(typeof signature==='string'?signature:signature.toDataURL('image/png'));
        const width=Math.min(250,png.width),height=Math.min(78,width*png.height/png.width);
        page.drawImage(png,{x:M,y:PAGE[1]-y-height,width,height});
        text('Unterschrift aus dem Formular',M,y+82,8.5,regular,MUTED);
      } else {
        rule(y+44,M,M+220);rule(y+44,M+275,RIGHT);
        text('Bearbeitung / Kürzel',M,y+52,8.5,regular,MUTED);
        text('Datum / Sichtvermerk der Praxis',M+275,y+52,8.5,regular,MUTED);
      }
    }
    pages.forEach((p,i)=>{
      page=p;rule(788);
      text('KONZEPTDEMO · Nicht an die Praxis übermittelt',M,800,7.5,regular,MUTED);
      const n=`Seite ${i+1} von ${pages.length}`;
      text(n,RIGHT-regular.widthOfTextAtSize(n,8),800,8,regular,MUTED);
      text('Sana MVZ Frankfurt-Westend · Nur zur Vorführung',M,816,7,regular,MUTED);
    });
    const bytes=await pdf.save();
    return {blob:new Blob([bytes],{type:'application/pdf'}),filename:filename.replace(/[^a-z0-9äöüÄÖÜß_.-]/gi,'_').slice(0,120),pageCount:pages.length};
  }
  async function download(options) {
    const result=await prepare(options);
    if(currentUrl)URL.revokeObjectURL(currentUrl);
    currentUrl=URL.createObjectURL(result.blob);
    const a=document.createElement('a');a.href=currentUrl;a.download=result.filename;a.rel='noopener';a.hidden=true;
    document.body.append(a);a.click();a.remove();
    return {...result,url:currentUrl};
  }
  function showResult(root,result) {
    root.replaceChildren();root.hidden=false;
    const p=document.createElement('p');p.textContent=`PDF erstellt · ${result.pageCount} ${result.pageCount===1?'Seite':'Seiten'} · Nur auf diesem Gerät.`;
    const view=document.createElement('a');view.href=result.url;view.target='_blank';view.rel='noopener';view.textContent='PDF öffnen';
    const save=document.createElement('a');save.href=result.url;save.download=result.filename;save.textContent='PDF erneut herunterladen';
    root.append(p,view,save);
  }
  function collect(form) {
    const v=n=>form.elements[n]?.value?.trim()||'';
    const r=n=>form.querySelector(`input[name="${n}"]:checked`)?.value||'Nicht angegeben';
    const fields=keys=>keys.map(([key,label])=>[label,key.toLowerCase().includes('birthdate')?formatDate(v(key)):v(key)]).filter(row=>row[1]);
    const sections=[{title:'Persönliche Daten',rows:fields([
      ['firstName','Vorname'],['lastName','Nachname'],['birthDate','Geburtsdatum'],['mobile','Mobilnummer'],['phone','Telefon'],['email','E-Mail'],['street','Straße und Hausnummer'],['postalCode','Postleitzahl'],['city','Ort'],['insurance','Krankenkasse / Kostenträger'],['insuranceNumber','Versicherungsnummer']
    ])}];
    const guardian=fields([['guardianFirstName','Vorname der Vertretung'],['guardianLastName','Nachname der Vertretung'],['guardianBirthDate','Geburtsdatum der Vertretung'],['guardianRelation','Verhältnis'],['guardianAddress','Anschrift der Vertretung']]);
    if(guardian.length){guardian.push(['Sorgeberechtigung bestätigt',form.elements.guardianAuthorityConfirm.checked?'Ja':'Nicht bestätigt']);sections.push({title:'Gesetzliche Vertretung',rows:guardian});}
    const conditions=Array.from(form.querySelectorAll('input[name="conditions"]:checked')).map(el=>el.value);
    sections.push({title:'Gesundheitsangaben',rows:[
      ...fields([['familyDoctor','Hausarzt / Hausärztin'],['occupation','Beruf'],['heightCm','Größe (cm)'],['weightKg','Gewicht (kg)']]),
      ['Sport',r('sports')],...fields(r('sports')==='ja'?[['sportsDetails','Sportarten']]:[]),
      ['Regelmäßige Medikamente',r('medications')],...fields(r('medications')==='ja'?[['medicationDetails','Medikamente und Dosierung']]:[]),
      ['Vorerkrankungen',conditions.length?conditions.join(', '):'Keine ausgewählt'],...fields([['conditionDetails','Weitere Erkrankungen / Ergänzungen']]),
      ['Allergien / Unverträglichkeiten',r('allergies')],...fields(r('allergies')==='ja'?[['allergyDetails','Allergien im Einzelnen']]:[]),
      ['Operationen',r('operations')],...fields(r('operations')==='ja'?[['operationDetails','Art / Zeitpunkt der Operation']]:[]),
      ['Rauchen',r('smoking')],...fields(r('smoking')==='ja'?[['cigarettesPerDay','Zigaretten pro Tag']]:[])
    ]});
    sections.push({title:'Datenschutz und Einwilligungen',rows:[
      ['Externe Abrechnung (freiwillig)',form.elements.externalBillingConsent.checked?'Einwilligung erteilt':'Keine Einwilligung erteilt'],
      ['Informationen zu ergänzenden Gesundheitsleistungen (freiwillig)',form.elements.informationConsent.checked?'Einwilligung erteilt':'Keine Einwilligung erteilt'],
      ...fields([['discovery','Auf die Praxis aufmerksam durch']]),
      ['Richtigkeit der Angaben und Kenntnisnahme der Patienteninformationen',form.elements.accuracyConfirm.checked?'Bestätigt':'Nicht bestätigt'],
      ['Dokumentstatus','Lokal erstellt. Nicht an die Praxis übermittelt. Die IGeL-Entscheidungshilfe ist freiwillig; Antworten daraus sind nicht Bestandteil dieser Aufnahme.']
    ]});
    return sections;
  }
  window.SanaPDF={prepare,download,collect,formatDate,showResult};
})();
