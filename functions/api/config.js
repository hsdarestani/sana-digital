import {json,configured} from '../_lib.js';
export function onRequestGet({env}){
  return json({enabled:env.INTAKE_ENABLED==='true'&&configured(env)});
}