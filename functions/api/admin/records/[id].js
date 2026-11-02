import {json,configured,decrypt,requireStaff} from '../../../_lib.js';
const statuses=['new','reviewed','archived'];
async function guard(context){
  const user=await requireStaff(context.request,context.env);
  if(!user)return {error:json({error:'Nicht autorisiert.'},401)};
  if(!configured(context.env))return {error:json({error:'Speicher nicht konfiguriert.'},503)};
  return {user};
}
export async function onRequestGet(context){
  const {error}=await guard(context);if(error)return error;
  const id=context.params.id;
  if(!/^[0-9a-f-]{36}$/.test(id))return json({error:'Datensatz nicht gefunden.'},404);
  try{
    const row=await context.env.DB.prepare('SELECT * FROM intakes WHERE id=?').bind(id).first();
    if(!row)return json({error:'Datensatz nicht gefunden.'},404);
    return json({record:{id:row.id,reference:row.reference,createdAt:row.created_at,status:row.status,data:await decrypt(row,context.env)}});
  }catch{return json({error:'Datensatz konnte nicht gelesen werden.'},503);}
}
export async function onRequestPatch(context){
  const {error}=await guard(context);if(error)return error;
  const id=context.params.id;
  if(!/^[0-9a-f-]{36}$/.test(id))return json({error:'Ungültige ID.'},400);
  let data;try{data=await context.request.json();}catch{return json({error:'Ungültige Daten.'},400);}
  if(!statuses.includes(data?.status))return json({error:'Ungültiger Status.'},422);
  try{
    const result=await context.env.DB.prepare('UPDATE intakes SET status=? WHERE id=?').bind(data.status,id).run();
    if(!result.meta?.changes)return json({error:'Datensatz nicht gefunden.'},404);
    return json({ok:true,status:data.status});
  }catch{return json({error:'Status konnte nicht geändert werden.'},503);}
}