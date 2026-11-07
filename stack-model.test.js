'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('./stack-model.js');
test('push and pop follow LIFO for all sizes, including zero and negative values', () => {
  for (let size = 0; size < model.capacity; size++) {
    const input = Array.from({length:size}, (_,i)=>i-2), saved=[...input];
    const push=model.frames(input,'push',-99);
    assert.deepEqual(push[0].values,input);
    assert.deepEqual(push.at(-1).values,[...input,-99]);
    assert.deepEqual(input,saved);
    const pop=model.frames(push.at(-1).values,'pop');
    assert.equal(pop.at(-1).returned,-99);
    assert.deepEqual(pop.at(-1).values,input);
  }
});
test('peek preserves contents, capacity overflow and empty underflow preserve state', () => {
  const full=[0,1,2,3,4,5];
  assert.deepEqual(model.frames(full,'peek').at(-1).values,full);
  assert.equal(model.frames(full,'peek').at(-1).returned,5);
  const overflow=model.frames(full,'push',99)[0];
  assert.equal(overflow.status,'error');assert.deepEqual(overflow.values,full);
  for(const mode of ['pop','peek']){
    const empty=model.frames([],mode)[0];assert.equal(empty.status,'error');assert.deepEqual(empty.values,[]);
  }
  for(const value of [NaN,Infinity,0.5,1000,-1000])assert.throws(()=>model.frames([],'push',value));
});
