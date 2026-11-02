import {json,configured,decrypt,requireStaff} from '../../_lib.js';
export async function onRequestGet({request,env}){
  const staff=await requireStaff(request,env);
  if(!staff)return json({error:'Nicht autorisiert. Melden Sie sich mit Ihrem Sana-Mitarbeiterkonto an.'},401);
  if(!configured(env))return json({error:'Datenbank oder Verschlüsselung nicht konfiguriert.'},503);
  try{
    const {results}=await env.DB.prepare('SELECT id, reference, created_at, status, encrypted_payload, iv FROM intakes ORDER BY created_at DESC LIMIT 100').all();
    const records=[];
    for(const row of results){
      const p=await decrypt(row,env);
      records.push({id:row.id,reference:row.reference,createdAt:row.created_at,status:row.status,name:[p.firstName,p.lastName].filter(Boolean).join(' '),birthDate:p.birthDate});
    }
    return json({records});
  }catch{return json({error:'Daten konnten nicht gelesen werden.'},503);}
}