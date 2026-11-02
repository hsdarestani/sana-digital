/* SANA demo PDF: on-device A4 export, no network, no local storage. */
(() => {
"use strict";
const W=595,H=842,S=2;
function prepare({title="Zusammenfassung",subtitle="Konzeptdemo – nicht übermittelt",sections=[],filename="sana-zusammenfassung.pdf",signature=null}={}){
 const pages=[];let canvas,ctx,y;
 function label(s,x,yy,size=11,bold=false,color="#173b52"){
   ctx.font=(bold?"700 ":"400 ")+size+"px Arial,sans-serif";ctx.fillStyle=color;ctx.fillText(String(s||""),x,yy);
 }
 function newPage(){
   canvas=document.createElement("canvas");canvas.width=W*S;canvas.height=H*S;
   ctx=canvas.getContext("2d",{alpha:false});if(!ctx)throw Error("PDF auf diesem Gerät nicht verfügbar.");
   ctx.scale(S,S);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);ctx.fillStyle="#103d59";ctx.fillRect(0,0,W,102);
   label("sana.",42,38,24,true,"#fff");label("MVZ FRANKFURT · KONZEPTDEMO",42,55,9,false,"#aad7e8");
   label(title.toUpperCase().slice(0,55),42,80,17,true,"#fff");
   ctx.fillStyle="#eaf6fb";ctx.fillRect(42,118,511,37);
   label(subtitle.slice(0,98),54,141,10,true,"#246886");
   y=178;pages.push({canvas,ctx});
 }
 function wrap(value,max=316){
   ctx.font="10.5px Arial,sans-serif";
   const rows=[];
   for(const part of String(value??"").slice(0,1000).split(/\r?\n/)){
     let line="";
     for(const word of part.split(/\s+/).filter(Boolean)){
       let pending=word;
       while(pending.length && ctx.measureText(pending).width>max){
         let cut=1;while(cut<pending.length && ctx.measureText(pending.slice(0,cut+1)).width<=max)cut++;
         if(line){rows.push(line);line="";}
         rows.push(pending.slice(0,cut));pending=pending.slice(cut);
       }
       if(pending){const candidate=line?line+" "+pending:pending;if(line&&ctx.measureText(candidate).width>max){rows.push(line);line=pending;}else line=candidate;}
     }
     rows.push(line||"—");
   }
   return rows;
 }
 function heading(s){
   if(y>742)newPage();
   ctx.fillStyle="#e8f4f9";ctx.fillRect(42,y,511,27);label(s.toUpperCase(),52,y+17,10,true,"#1376a0");y+=40;
 }
 function field(k,v){
   if(v===null||v===undefined||!String(v).trim())return;
   const parts=wrap(v);let idx=0;
   while(idx<parts.length){
     if(y>742)newPage();
     const room=Math.max(1,Math.min(18,Math.floor((776-y-12)/14)));
     const slice=parts.slice(idx,idx+room);
     const h=Math.max(29,slice.length*14+12);
     if(y+h>782){newPage();continue;}
     if(idx===0)label(k.slice(0,33),49,y+14,10,true,"#4f7184");
     slice.forEach((line,j)=>label(line,215,y+14+j*14,10.5,false,"#234b61"));
     ctx.strokeStyle="#e7edf0";ctx.beginPath();ctx.moveTo(47,y+h-3);ctx.lineTo(549,y+h-3);ctx.stroke();
     y+=h;idx+=slice.length;
   }
 }
 newPage();
 for(const block of sections.slice(0,26)){
   if(!block||!Array.isArray(block.rows)||!block.rows.length)continue;
   heading(block.title||"Weitere Angaben");
   for(const pair of block.rows.slice(0,90))field(pair[0],pair[1]);
   y+=10;
 }
 if(signature){
   if(y>634)newPage();heading("Unterschrift");
   try{ctx.drawImage(signature,51,y,255,83);label("Unterschrift aus dem Formular",323,y+45,9,false,"#6f8b9b");y+=100;}catch{}
 }
 pages.forEach((page,i)=>{
   const c=page.ctx;c.fillStyle="#fff";c.fillRect(0,788,W,54);c.strokeStyle="#dde9f0";c.beginPath();c.moveTo(42,795);c.lineTo(552,795);c.stroke();
   c.fillStyle="#6b8394";c.font="10px Arial,sans-serif";c.fillText("KONZEPTDEMO · Nicht an die Praxis übermittelt",42,816);c.fillText((i+1)+" / "+pages.length,520,816);
 });
 const enc=new TextEncoder(),chunks=[],locations=[];let size=0;
 const add=z=>{const b=typeof z==="string"?enc.encode(z):z;chunks.push(b);size+=b.length;};
 const start=i=>{locations[i]=size;add(i+" 0 obj\n");},end=()=>add("\nendobj\n");
 add(new Uint8Array([37,80,68,70,45,49,46,52,10,37,226,227,207,211,10]));
 start(1);add("<< /Type /Catalog /Pages 2 0 R >>");end();
 const kids=pages.map((_,i)=>(3+3*i)+" 0 R").join(" ");
 start(2);add("<< /Type /Pages /Count "+pages.length+" /Kids [ "+kids+" ] >>");end();
 pages.forEach(({canvas},i)=>{
   const n=3+i*3,body=n+1,im=n+2;
   const raw=atob(canvas.toDataURL("image/jpeg",.91).split(",")[1]);
   const jpg=Uint8Array.from(raw,c=>c.charCodeAt(0));
   start(n);add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Pg "+im+" 0 R >> >> /Contents "+body+" 0 R >>");end();
   const instructions="q 595 0 0 842 0 0 cm /Pg Do Q\n";
   start(body);add("<< /Length "+enc.encode(instructions).length+" >>\nstream\n"+instructions+"endstream");end();
   start(im);add("<< /Type /XObject /Subtype /Image /Width "+canvas.width+" /Height "+canvas.height+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+jpg.length+" >>\nstream\n");add(jpg);add("\nendstream");end();
 });
 const xref=size,max=2+pages.length*3;add("xref\n0 "+(max+1)+"\n0000000000 65535 f \n");
 for(let i=1;i<=max;i++)add(String(locations[i]).padStart(10,"0")+" 00000 n \n");
 add("trailer\n<< /Size "+(max+1)+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF");
 return {blob:new Blob(chunks,{type:"application/pdf"}),filename:filename.replace(/[^a-z0-9äöüÄÖÜß_.-]/gi,"_").slice(0,90)};
}
function download(options){
 const {blob,filename}=prepare(options);const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=filename;a.rel="noopener";a.style.display="none";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);return blob.size;
}
function collect(form){
 const titles=["Persönliche Daten","Gesundheitsangaben","Datenschutz & Abrechnung","Weitere Informationen","Bestätigung"];
 return [...form.querySelectorAll(".step")].map((step,i)=>{
   const rows=[],seen=new Set();
   step.querySelectorAll("input[name],textarea[name],select[name]").forEach(el=>{
     if(!el.name||seen.has(el.name)||el.name==="website"||el.closest(".hidden")||(el.closest("[hidden]") && el.closest("[hidden]")!==step))return;
     if(["hidden","file","submit"].includes(el.type))return;
     seen.add(el.name);
     const siblings=[...step.querySelectorAll("input[name],textarea[name],select[name]")].filter(x=>x.name===el.name);
     let val;
     if(el.type==="radio")val=siblings.filter(x=>x.checked).map(x=>x.value).join(", ");
     else if(el.type==="checkbox")val=siblings.length>1?siblings.filter(x=>x.checked).map(x=>x.value).join(", "):(el.checked?"Ja":"Nein");
     else val=el.value?.trim()||"";
     if(!val)return;
     const field=el.closest("label");
     let title=field?.childNodes?.[0]?.textContent?.trim()||el.name;
     if(!title||title.length<2)title=el.name;
     rows.push([title.slice(0,58),val]);
   });
   return {title:titles[i]||"Zusatzangaben",rows};
 }).filter(x=>x.rows.length);
}
window.SanaPDF={prepare,download,collect};
})();