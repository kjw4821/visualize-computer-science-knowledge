'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('./array-model.js');
test('array: uninitialized declaration, valid assignments and rejected out-of-bounds write', () => {
  let next = 0;
  const frames = model.frames(() => [0, .99, .12, .5, .75, .42][next++]);
  assert.equal(frames.length, 7);
  assert.deepEqual(frames[0].cells, [null, null, null, null, null]);
  assert.deepEqual(frames[1].cells, [0, null, null, null, null]);
  assert.deepEqual(frames[5].cells, [0, 99, 12, 50, 75]);
  assert.deepEqual(frames[6].cells, frames[5].cells);
  assert.equal(frames[6].state, 'error');
  assert.match(frames[6].message, /정의되지 않은 동작/);
  frames[5].cells[0] = -1;
  assert.equal(frames[1].cells[0], 0);
  assert.equal(frames[6].cells[0], 0);
});
test('array: generated values remain integer values in the displayed range', () => {
  for (let i = 0; i < 20; i++) {
    assert.ok(model.frames()[5].cells.every(v => Number.isInteger(v) && v >= 0 && v <= 99));
  }
});
