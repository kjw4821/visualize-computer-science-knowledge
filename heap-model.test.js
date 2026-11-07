'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),model=require('./heap-model.js');
function valid(s){s.forEach((v,i)=>{if(i)assert.ok(s[Math.floor((i-1)/2)]<=v);});}
test('heap insertion, duplicates and repeated extraction preserve minimum and shape',()=>{
  for(const data of [[5,2,8,1,0,-3,2],[9,8,7,6,5,4,3,2,1],Array(15).fill(0)]){
    let state=[];
    for(const value of data){const before=[...state],f=model.frames(state,'insert',value);assert.deepEqual(state,before);state=f.at(-1).state;valid(state);}
    const output=[];
    while(state.length){const before=[...state],f=model.frames(state,'extract');assert.deepEqual(state,before);output.push(f.at(-1).returned);state=f.at(-1).state;valid(state);}
    assert.deepEqual(output,[...data].sort((a,b)=>a-b));
  }
});
test('heap lookup, limits, empty state and invalid input',()=>{
  const initial=model.create();assert.equal(model.frames(initial,'peek')[0].returned,10);
  assert.deepEqual(model.frames(initial,'peek')[0].state,initial);
  for(const mode of ['peek','extract'])assert.equal(model.frames([],mode)[0].status,'error');
  assert.equal(model.frames(Array(15).fill(0),'insert',9).at(-1).status,'error');
  for(const value of [NaN,Infinity,0.5,1000])assert.throws(()=>model.frames([],'insert',value));
});
