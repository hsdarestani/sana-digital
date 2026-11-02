import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePatient,encrypt,decrypt} from '../functions/_lib.js';
const patient=()=>({
  firstName:'Max',lastName:'Mustermann',birthDate:'1993-04-22',mobile:'+49 151 12345678',phone:'',email:'',
  street:'Musterstraße 10',postalCode:'60313',city:'Frankfurt',insurance:'TK',insuranceNumber:'',
  guardianFirstName:'',guardianLastName:'',guardianBirthDate:'',guardianRelation:'',guardianAddress:'',
  guardianAuthorityConfirm:false,
  familyDoctor:'',occupation:'',heightCm:'',weightKg:'',sports:'',sportsDetails:'',medications:'',
  medicationDetails:'',conditions:[],conditionDetails:'',allergies:'',allergyDetails:'',operations:'',
  operationDetails:'',smoking:'',cigarettesPerDay:'',discovery:'',externalBillingConsent:false,
  informationConsent:false,accuracyConfirm:true,signature:'data:image/png;base64,'+'A'.repeat(160),
  documentVersion:'2026-11-02.1',website:''
});
test('adult can submit without optional external billing or marketing consent',()=>{
  assert.equal(validatePatient(patient()),true);
});
test('required identity, signature and acknowledgement enforced',()=>{
  assert.equal(validatePatient({...patient(),firstName:''}),false);
  assert.equal(validatePatient({...patient(),signature:''}),false);
  assert.equal(validatePatient({...patient(),accuracyConfirm:false}),false);
});
test('minors require guardian identity and authority',()=>{
  const data={...patient(),birthDate:'2021-05-01'};
  assert.equal(validatePatient(data),false);
  Object.assign(data,{guardianFirstName:'Anne',guardianLastName:'Mustermann',guardianRelation:'Mutter',guardianAuthorityConfirm:true});
  assert.equal(validatePatient(data),true);
});
test('reject unknown medical conditions and oversized text',()=>{
  assert.equal(validatePatient({...patient(),conditions:['NOT_VALID']}),false);
  assert.equal(validatePatient({...patient(),conditionDetails:'x'.repeat(1600)}),false);
});
test('AES-GCM encrypted records round-trip and do not contain plaintext name',async()=>{
  const key=Buffer.from(new Uint8Array(32).fill(17)).toString('base64');
  const env={DATA_ENCRYPTION_KEY:key};
  const original=patient();
  const encrypted=await encrypt(original,env);
  assert.ok(!encrypted.data.includes(original.firstName));
  const restored=await decrypt({iv:encrypted.iv,encrypted_payload:encrypted.data},env);
  assert.deepEqual(restored,original);
});
