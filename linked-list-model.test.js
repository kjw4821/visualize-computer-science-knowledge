'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('./linked-list-model.js');
const values = state => model.order(state).map(id => state.nodes.find(n => n.id === id).value);
test('insert and delete at every position preserve links, values and immutable history', () => {
  for (let size = 0; size <= 8; size++) {
    const data = Array.from({length: size}, (_, i) => i * 12);
    const initial = model.create(data), saved = JSON.stringify(initial);
    for (let at = 0; at <= size; at++) {
      const frames = model.frames(initial, 'insert', at, -99);
      const expected = [...data]; expected.splice(at, 0, -99);
      assert.deepEqual(values(frames.at(-1).state), expected);
      assert.equal(frames.at(-1).state.nodes.length, size + 1);
      const fresh = frames.find(f => f.fresh);
      assert.equal(model.order(fresh.state).length, size);
      // Every intermediate next pointer is valid, even for a detached node.
      for (const frame of frames) for (const n of frame.state.nodes) {
        assert.ok(n.next === null || frame.state.nodes.some(target => target.id === n.next));
      }
      assert.equal(JSON.stringify(initial), saved);
    }
    for (let at = 0; at < size; at++) {
      const frames = model.frames(initial, 'delete', at);
      const expected = [...data]; expected.splice(at, 1);
      assert.deepEqual(values(frames.at(-1).state), expected);
      assert.equal(frames.at(-1).state.nodes.length, size - 1);
      assert.equal(JSON.stringify(initial), saved);
      const search = model.frames(initial, 'search', at);
      assert.match(search.at(-1).code, new RegExp(String(data[at])));
      assert.equal(search.at(-1).active[0], model.order(initial)[at]);
    }
    const past = model.frames(initial, 'search', size + 10);
    assert.match(past.at(-1).code, /null/);
    assert.equal(past.at(-1).status, 'error');
    assert.ok(past.length <= size + 3);
  }
});
test('head removal, empty list recovery, unique IDs and repeated edits', () => {
  let state = model.create([1]);
  state = model.frames(state, 'delete', 0).at(-1).state;
  assert.equal(state.head, null);
  state = model.frames(state, 'insert', 0, 0).at(-1).state;
  state = model.frames(state, 'insert', 1, 5).at(-1).state;
  assert.deepEqual(values(state), [0, 5]);
  assert.equal(new Set(state.nodes.map(n => n.id)).size, 2);
  assert.equal(model.frames(state, 'search', 1).at(-1).state.head, state.head);
});
test('invalid input is rejected without changing the list', () => {
  const state = model.create([1, 2]);
  for (const at of [-1, 0.5, Infinity]) assert.throws(() => model.frames(state, 'search', at));
  assert.throws(() => model.frames(state, 'insert', 3, 7));
  assert.throws(() => model.frames(state, 'insert', 0, 1000));
  assert.throws(() => model.frames(state, 'delete', 2));
  assert.throws(() => model.frames(model.create([]), 'delete', 0));
  assert.deepEqual(values(state), [1, 2]);
});
