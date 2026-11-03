import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,capacity,metrics} from '../public/vision/model.js';
// Retained historical simulator model, no longer linked from the presentation.
test('legacy capacity examples stay independent of intake and requests',()=>{
 const state=initialState();assert.deepEqual(capacity('morning'),[6,3,2]);assert.deepEqual(capacity('afternoon'),[5,2,3]);assert.deepEqual(metrics(state),{requests:0,records:0,reviewed:0,occupied:11,total:18});
});
test('legacy review state never changes capacity',()=>{
 const state=initialState();state.request={kind:'callback'};state.intake={support:'Barrierearmer Zugang'};state.reviewed=true;assert.equal(metrics(state).requests,1);assert.equal(metrics(state).records,1);assert.equal(metrics(state).reviewed,1);assert.equal(metrics(state).occupied,11);state.callbackDone=true;assert.equal(metrics(state).requests,0);
});
