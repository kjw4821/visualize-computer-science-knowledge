'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('./tree-model.js');
function valid(state) {
  const seen=new Set(),byId=new Map(state.nodes.map(n=>[n.id,n]));
  function visit(id, low=-Infinity, high=Infinity) {
    if(id===null)return;
    assert.ok(!seen.has(id));seen.add(id);const n=byId.get(id);assert.ok(n);
    assert.ok(n.value>low && n.value<high);visit(n.left,low,n.value);visit(n.right,n.value,high);
  }
  visit(state.root);assert.equal(seen.size,state.nodes.length);
}
test('search, insert and delete across balanced, skewed and empty BSTs',()=>{
  for(const data of [[],[0],[40,20,60,10,30,50,70],[1,2,3,4,5],[5,4,3,2,1],[40,20,70,50,80,45,55,47]]){
    const initial=model.create(data),saved=JSON.stringify(initial);
    for(const value of [...data,-99,99]){
      const found=model.frames(initial,'search',value).at(-1);
      assert.match(found.code,data.includes(value)?/→ found/:/not found/);
      assert.deepEqual(found.state,initial);
      const inserted=model.frames(initial,'insert',value).at(-1).state;valid(inserted);
      assert.deepEqual(model.inorder(inserted),[...new Set([...data,value])].sort((a,b)=>a-b));
      const deleted=model.frames(initial,'delete',value).at(-1).state;valid(deleted);
      assert.deepEqual(model.inorder(deleted),data.filter(v=>v!==value).sort((a,b)=>a-b));
      assert.equal(JSON.stringify(initial),saved);
    }
  }
});
test('two-child successor with right child is reconnected correctly',()=>{
  const initial=model.create([40,20,70,50,80,45,55,47]);
  const frames=model.frames(initial,'delete',40);const final=frames.at(-1).state;valid(final);
  assert.deepEqual(model.inorder(final),[20,45,47,50,55,70,80]);
  assert.equal(final.nodes.find(n=>n.id===final.root).value,45);
  assert.ok(frames.some(f=>/후속자/.test(f.message)));
  // Snapshot edits must not alter earlier frames.
  assert.equal(frames[0].state.nodes.find(n=>n.id===initial.root).value,40);
});
test('repeated root deletion drains tree; reinsertion, duplicates, limits and invalid inputs',()=>{
  let state=model.create();
  while(state.root){const value=state.nodes.find(n=>n.id===state.root).value;state=model.frames(state,'delete',value).at(-1).state;valid(state);}
  assert.deepEqual(state.nodes,[]);
  state=model.frames(state,'insert',0).at(-1).state;valid(state);assert.deepEqual(model.inorder(state),[0]);
  const full=model.create(Array.from({length:15},(_,i)=>i));
  const limited=model.frames(full,'insert',99).at(-1);assert.equal(limited.status,'error');assert.deepEqual(limited.state,full);
  assert.deepEqual(model.frames(full,'insert',0).at(-1).state,full);
  for(const value of [NaN,Infinity,0.5,1000,-1000])assert.throws(()=>model.frames(state,'insert',value));
});
