'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('./queue-model.js');
test('enqueue at REAR and dequeue at FRONT preserve FIFO at all sizes', () => {
  for(let size=0;size<model.capacity;size++){
    const input=Array.from({length:size},(_,i)=>i-2),saved=[...input];
    const frames=model.frames(input,'enqueue',99);
    assert.deepEqual(frames[0].values,input);assert.deepEqual(input,saved);
    const enqueued=frames.at(-1).values;
    assert.deepEqual(enqueued,[...input,99]);
    const dequeued=model.frames(enqueued,'dequeue').at(-1);
    assert.equal(dequeued.returned,enqueued[0]);assert.deepEqual(dequeued.values,enqueued.slice(1));
  }
});
test('peek keeps data, empty and full errors leave state unchanged',()=>{
  const full=[0,1,2,3,4,5];
  assert.equal(model.frames(full,'peek').at(-1).returned,0);
  assert.deepEqual(model.frames(full,'peek').at(-1).values,full);
  const overflow=model.frames(full,'enqueue',7)[0];assert.equal(overflow.status,'error');assert.deepEqual(overflow.values,full);
  for(const mode of ['peek','dequeue']){const f=model.frames([],mode)[0];assert.match(f.code,/underflow/);assert.deepEqual(f.values,[]);}
  for(const value of [NaN,Infinity,0.5,1000,-1000])assert.throws(()=>model.frames([],'enqueue',value));
});
test('repeated enqueue/dequeue reuses capacity and returns the original FIFO order',()=>{
  let values=[];
  for(let round=0;round<20;round++){
    for(let i=0;i<6;i++)values=model.frames(values,'enqueue',round*6+i).at(-1).values;
    for(let i=0;i<6;i++){const f=model.frames(values,'dequeue').at(-1);assert.equal(f.returned,round*6+i);values=f.values;}
    assert.deepEqual(values,[]);
  }
});
