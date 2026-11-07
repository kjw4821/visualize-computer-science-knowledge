'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),model=require('./graph-model.js');
test('BFS and DFS use deterministic orders and visit cycles once',()=>{
  const input=model.create(),saved=JSON.stringify(input);
  assert.deepEqual(model.frames(input,'bfs',{start:'A'}).at(-1).order,['A','B','C','D','E','F']);
  assert.deepEqual(model.frames(input,'dfs',{start:'A'}).at(-1).order,['A','B','D','C','E','F']);
  for(const mode of ['bfs','dfs'])for(const start of input.nodes){
    const frames=model.frames(input,mode,{start}),last=frames.at(-1);
    assert.equal(last.order[0],start);assert.equal(new Set(last.order).size,6);assert.equal(last.order.length,6);
    assert.deepEqual(last.frontier,[]);assert.equal(JSON.stringify(input),saved);
    for(const f of frames)assert.equal(new Set(f.frontier).size,f.frontier.length);
  }
});
test('undirected edge updates, duplicates, self loops, missing edges and disconnected graphs',()=>{
  const input=model.create();
  const remove=model.frames(input,'edit',{from:'F',to:'E',action:'remove'}).at(-1).state;
  assert.deepEqual(model.neighbors(remove,'F'),[]);assert.equal(input.edges.length,6);
  for(const mode of ['bfs','dfs']){
    const f=model.frames(remove,mode,{start:'A'}).at(-1);assert.deepEqual(f.unreachable,['F']);assert.equal(f.order.length,5);
    const isolated=model.frames(remove,mode,{start:'F'}).at(-1);assert.deepEqual(isolated.order,['F']);assert.equal(isolated.unreachable.length,5);
  }
  const add=model.frames(remove,'edit',{from:'F',to:'E',action:'add'}).at(-1).state;
  assert.ok(model.neighbors(add,'F').includes('E'));assert.ok(model.neighbors(add,'E').includes('F'));
  assert.equal(model.frames(add,'edit',{from:'E',to:'F',action:'add'}).at(-1).status,'empty');
  assert.equal(model.frames(add,'edit',{from:'A',to:'A',action:'add'}).at(-1).status,'error');
  assert.equal(model.frames(add,'edit',{from:'A',to:'F',action:'remove'}).at(-1).status,'empty');
  assert.throws(()=>model.frames(add,'bfs',{start:'Z'}));
  assert.throws(()=>model.frames(add,'edit',{from:'Z',to:'A',action:'add'}));
  assert.deepEqual(model.frames({nodes:['A'],edges:[]},'dfs',{start:'A'}).at(-1).order,['A']);
});
