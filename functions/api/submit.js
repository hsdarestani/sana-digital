import {json,configured,validatePatient,encrypt,verifyTurnstile} from '../_lib.js';
export async function onRequestPost({request,env}){
  if(env.INTAKE_ENABLED!=='true')return json({error:'Die Patientenaufnahme befindet sich noch im Vorschaumodus.'},503);
  if(!configured(env))return json({error:'Die sichere Speicherung ist noch nicht eingerichtet. Bitte wenden Sie sich an die Anmeldung.'},503);
  if(!['application/json','application/json; charset=utf-8'].includes((request.headers.get('content-type')||'').toLowerCase()))return json({error:'Ungültiger Inhaltstyp.'},415);
  const origin=request.headers.get('Origin');
  if(origin&&origin!==new URL(request.url).origin)return json({error:'Anfrage nicht zugelassen.'},403);
  const size=Number(request.headers.get('content-length')||'0');
  if(size>200000)return json({error:'Die Eingabe ist zu groß.'},413);
  let data;
  try{
    const body=await request.text();
    if(body.length>200000)return json({error:'Die Eingabe ist zu groß.'},413);
    data=JSON.parse(body);
  }catch{return json({error:'Ungültige Daten.'},400);}
  if(!validatePatient(data))return json({error:'Bitte prüfen Sie Ihre Eingaben und die Unterschrift.'},422);
  if(!await verifyTurnstile(data.turnstileToken,request,env))return json({error:'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte erneut versuchen.'},403);
  const id=crypto.randomUUID();
  const reference='SA-'+Array.from(crypto.getRandomValues(new Uint8Array(5)),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
  const createdAt=new Date().toISOString();
  const {website,turnstileToken,...patient}=data;
  try{
    const encrypted=await encrypt({...patient,signedAt:createdAt},env);
    await env.DB.prepare('INSERT INTO intakes (id, reference, created_at, status, encrypted_payload, iv, schema_version) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id,reference,createdAt,'new',encrypted.data,encrypted.iv,1).run();
  }catch{
    // No patient fields or request content in logs.
    return json({error:'Ihre Daten konnten nicht gespeichert werden. Bitte wenden Sie sich an die Anmeldung.'},503);
  }
  return json({ok:true,reference},201);
}
export function onRequestGet(){return json({error:'Methode nicht erlaubt.'},405);}
