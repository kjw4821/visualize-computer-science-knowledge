'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('./multidimensional-array-model.js');
for (const dimension of [2, 3]) {
  test(`${dimension}D: row-major coordinates and independent assignment snapshots`, () => {
    const shape = model.shape(dimension);
    const count = shape.reduce((a, b) => a * b, 1);
    const frames = model.frames(dimension, () => .42);
    assert.equal(frames.length, count + 1);
    assert.ok(frames[0].cells.every(v => v === null));
    assert.equal(frames[0].code, dimension === 2 ? 'int arr[3][4];' : 'int arr[2][3][4];');
    for (let index = 0; index < count; index++) {
      const coords = model.coordinates(index, shape);
      assert.equal(coords.reduce((flat, coordinate, axis) => flat * shape[axis] + coordinate, 0), index);
      assert.equal(frames[index + 1].code, `${model.expression(coords)} = 42;`);
      assert.equal(frames[index + 1].cells.filter(v => v !== null).length, index + 1);
    }
    assert.deepEqual(model.coordinates(4, shape), dimension === 2 ? [1, 0] : [0, 1, 0]);
    if (dimension === 3) assert.deepEqual(model.coordinates(12, shape), [1, 0, 0]);
    assert.throws(() => model.coordinates(count, shape));
    assert.throws(() => model.coordinates(-1, shape));
    frames[1].cells[0] = -1;
    assert.equal(frames[0].cells[0], null);
    assert.equal(frames[2].cells[0], 42);
  });
}
test('multidimensional: rejects unsupported dimensions and invalid random samples', () => {
  assert.throws(() => model.shape(4));
  assert.throws(() => model.frames(2, () => NaN));
  assert.throws(() => model.frames(3, () => 1));
  const shape = model.shape(2); shape[0] = 100;
  assert.deepEqual(model.shape(2), [3, 4]);
});
