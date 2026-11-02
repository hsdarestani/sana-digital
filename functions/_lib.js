// Server-only helpers for Cloudflare Pages Functions.
// Never expose encryption keys, Access JWTs, patient payloads, or signatures in logs.
export const noStore = { 'Cache-Control':'no-store, no-cache, must-revalidate', 'Pragma':'no-cache', 'X-Content-Type-Options':'nosniff' };
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...noStore,'Content-Type':'application/json; charset=utf-8'}});}
const toBase64 = bytes => {
  let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(out);
};
const fromBase64 = value => Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export function configured(env){return Boolean(env.DB && env.DATA_ENCRYPTION_KEY);}
async function cryptoKey(env){
  const raw=fromBase64(env.DATA_ENCRYPTION_KEY||'');
  if(raw.length!==32)throw new Error('Invalid data encryption configuration');
  return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
export async function encrypt(payload,env){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await cryptoKey(env);
  const plain=new TextEncoder().encode(JSON.stringify(payload));
  const bytes=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain));
  return {iv:toBase64(iv),data:toBase64(bytes)};
}
export async function decrypt(row,env){
  const key=await cryptoKey(env);
  const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64(row.iv)},key,fromBase64(row.encrypted_payload));
  return JSON.parse(new TextDecoder().decode(bytes));
}
const bad = () => json({error:'Bitte prüfen Sie Ihre Angaben.'},422);
const text=(v,max=200)=>typeof v==='string'&&v.length<=max?v.trim():null;
const required=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;
const allowedCondition=new Set(['Bluthochdruck','Niedriger Blutdruck','Herzerkrankungen','Gefäßerkrankungen','Nierenerkrankungen','Lungenerkrankungen','Bauchspeicheldrüse','Diabetes','Gicht','Blutungsneigung','Lebererkrankungen','Thrombose']);
export function validatePatient(v){
  if(!v||typeof v!=='object'||Array.isArray(v))return false;
  if(!required(v.firstName,1,80)||!required(v.lastName,1,80)||!required(v.mobile,5,30)||!required(v.street,3,160)||!required(v.postalCode,3,12)||!required(v.city,2,90)||!required(v.insurance,2,120))return false;
  const bd=/^\d{4}-\d{2}-\d{2}$/.test(v.birthDate||'')?new Date(v.birthDate+'T12:00:00Z'):null;
  if(!bd||Number.isNaN(bd.getTime())||bd.getTime()>Date.now()||bd.getUTCFullYear()<1900||bd.toISOString().slice(0,10)!==v.birthDate)return false;
  const now=new Date();let age=now.getUTCFullYear()-bd.getUTCFullYear();if(now.getUTCMonth()<bd.getUTCMonth()||(now.getUTCMonth()===bd.getUTCMonth()&&now.getUTCDate()<bd.getUTCDate()))age--;
  if(age<18&&(!required(v.guardianFirstName,1,80)||!required(v.guardianLastName,1,80)||!['Mutter','Vater','Sonstige'].includes(v.guardianRelation)||v.guardianAuthorityConfirm!==true))return false;
  if(typeof v.guardianAuthorityConfirm!=='boolean')return false;
  if(v.email&&(!required(v.email,3,150)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)))return false;
  const sizes={phone:30,insuranceNumber:40,guardianFirstName:80,guardianLastName:80,guardianBirthDate:10,guardianRelation:30,guardianAddress:180,familyDoctor:130,occupation:110,heightCm:15,weightKg:15,sportsDetails:240,medicationDetails:1500,conditionDetails:1500,allergyDetails:1500,operationDetails:1500,cigarettesPerDay:5,discovery:60};
  for(const [key,max] of Object.entries(sizes))if(text(v[key],max)===null)return false;
  for(const key of ['sports','medications','allergies','operations','smoking'])if(!['','ja','nein'].includes(v[key]))return false;
  if(!Array.isArray(v.conditions)||v.conditions.length>12||v.conditions.some(c=>!allowedCondition.has(c)))return false;
  if(typeof v.externalBillingConsent!=='boolean'||typeof v.informationConsent!=='boolean'||v.accuracyConfirm!==true)return false;
  if(typeof v.signature!=='string'||!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(v.signature)||v.signature.length<140||v.signature.length>150000)return false;
  if(typeof v.documentVersion!=='string'||v.documentVersion!=='2026-11-02.1')return false;
  if(v.website)return false;
  return true;
}
function base64url(s){return fromBase64(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));}
function jwtPart(s){return JSON.parse(new TextDecoder().decode(base64url(s)));}
export async function requireStaff(request,env){
  // A Cloudflare Access application must protect BOTH /admin* and /api/admin*.
  // Always verify the JWT; headers claiming an email alone are not authentication.
  let domain=(env.ACCESS_TEAM_DOMAIN||'').trim().replace(/^https?:\/\//,'').replace(/\/$/,'');
  if(!domain||!env.ACCESS_AUD)return null;
  if(!/^[a-z0-9.-]+\.cloudflareaccess\.com$/i.test(domain))return null;
  const jwt=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!jwt)return null;
  const parts=jwt.split('.');if(parts.length!==3)return null;
  try{
    const header=jwtPart(parts[0]),claims=jwtPart(parts[1]);
    if(header.alg!=='RS256'||typeof header.kid!=='string')return null;
    const now=Math.floor(Date.now()/1000);
    if(!claims.exp||claims.exp<=now||claims.nbf>now+60)return null;
    if(claims.iss!=='https://'+domain)return null;
    if(!Array.isArray(claims.aud)||!claims.aud.includes(env.ACCESS_AUD))return null;
    const response=await fetch('https://'+domain+'/cdn-cgi/access/certs');
    if(!response.ok)return null;
    const jwks=await response.json();
    const jwk=jwks.keys?.find(k=>k.kid===header.kid&&k.kty==='RSA');
    if(!jwk)return null;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const verified=await crypto.subtle.verify({name:'RSASSA-PKCS1-v1_5'},key,base64url(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
    return verified?{email:claims.email||'',sub:claims.sub||''}:null;
  }catch{return null;}
}
export async function verifyTurnstile(token,request,env){
  if(!env.TURNSTILE_SECRET)return true; // Strongly recommend enabling before launch.
  if(typeof token!=='string'||!token)return false;
  const body=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
  const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body});
  if(!response.ok)return false;
  const result=await response.json();
  if(!result.success)return false;
  const origin=new URL(request.url).hostname;
  return result.hostname===origin;
}
