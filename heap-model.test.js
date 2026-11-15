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

test('heap movement marks swaps and last-node relocation only on movement frames',()=>{
  for(const mode of ['insert','extract']){
    const frames=model.frames(model.create(),mode,1);
    const moves=frames.filter(f=>f.move);
    assert.ok(moves.length);
    for(const frame of moves){
      const {from,to,swap}=frame.move;
      assert.notEqual(from,to);
      if(swap){assert.match(frame.code,/swap/);assert.ok(from<frame.state.length&&to<frame.state.length);}
      else {assert.equal(mode,'extract');assert.equal(from,6);assert.equal(to,0);}
    }
    assert.equal(frames.at(-1).move,undefined);
  }
  for(const [data,mode,value] of [[[10],'insert',20],[[10],'extract'],[[],'peek']])
    assert.ok(model.frames(data,mode,value).every(f=>!f.move));
});
