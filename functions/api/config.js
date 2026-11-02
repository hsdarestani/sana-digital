import {json,configured} from '../_lib.js';

// Report only a single public readiness boolean. Never disclose which secret,
// schema element or account setting is missing to unauthenticated visitors.
export async function onRequestGet({env}){
  let enabled=env.INTAKE_ENABLED==='true' && configured(env);
  if(enabled && (Boolean(env.TURNSTILE_SECRET)!==Boolean(env.TURNSTILE_SITE_KEY)))enabled=false;
  if(enabled){
    try{
      // A D1 binding alone is not enough; the actual migration must have run.
      await env.DB.prepare('SELECT id FROM intakes LIMIT 1').first();
    }catch{enabled=false;}
  }
  return json({enabled,turnstileSiteKey:enabled?(env.TURNSTILE_SITE_KEY||null):null});
}
