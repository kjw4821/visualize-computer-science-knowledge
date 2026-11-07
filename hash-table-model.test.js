'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),model=require('./hash-table-model.js');
const empty=()=>Array.from({length:model.bucketCount},()=>[]);
function valid(s){const keys=[];s.forEach((chain,i)=>chain.forEach(e=>{assert.equal(model.hash(e.key),i);keys.push(e.key);}));assert.equal(keys.length,new Set(keys).size);}
test('colliding keys remain distinct; update preserves entry count and immutable snapshots',()=>{
  let state=empty();
  for(const key of [10,17,24,0,-7,-1]){const before=JSON.stringify(state);const frames=model.frames(state,'insert',key,key+100);assert.equal(JSON.stringify(state),before);state=frames.at(-1).state;valid(state);}
  assert.equal(state[3].length,3);assert.equal(model.hash(-1),6);assert.equal(model.hash(-7),0);
  for(const key of [10,17,24,0,-7,-1])assert.equal(model.frames(state,'search',key).at(-1).returned,key+100);
  const frames=model.frames(state,'insert',17,0);assert.equal(model.size(frames.at(-1).state),6);assert.equal(model.frames(frames.at(-1).state,'search',17).at(-1).returned,0);
  assert.equal(model.frames(frames[0].state,'search',17).at(-1).returned,117);
});
test('deleting head, middle, tail and last colliding entry preserves survivors',()=>{
  for(const removed of [10,17,24]){
    let state=empty();for(const key of [10,17,24])state=model.frames(state,'insert',key,key).at(-1).state;
    state=model.frames(state,'delete',removed).at(-1).state;valid(state);
    assert.deepEqual(state[3].map(e=>e.key),[10,17,24].filter(k=>k!==removed));
    assert.equal(model.frames(state,'search',removed).at(-1).status,'empty');
    for(const key of [10,17,24].filter(k=>k!==removed))state=model.frames(state,'delete',key).at(-1).state;
    assert.deepEqual(state,empty());
  }
});
test('entry limit permits updates, missing keys do not mutate, negative hashes and input validation',()=>{
  let state=empty();for(let i=0;i<12;i++)state=model.frames(state,'insert',i*7,i).at(-1).state;
  assert.equal(model.frames(state,'insert',99,1).at(-1).status,'error');
  state=model.frames(state,'insert',0,-99).at(-1).state;assert.equal(model.size(state),12);assert.equal(model.frames(state,'search',0).at(-1).returned,-99);
  assert.deepEqual(model.frames(state,'delete',-999).at(-1).state,state);
  for(let key=-999;key<=999;key++)assert.ok(model.hash(key)>=0 && model.hash(key)<7);
  for(const key of [NaN,Infinity,0.5,1000])assert.throws(()=>model.frames(state,'search',key));
  assert.throws(()=>model.frames(state,'insert',0,0.5));
});
