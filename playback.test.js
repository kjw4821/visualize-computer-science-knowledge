'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function harness(name) {
  let now = 0, serial = 0;
  const timers = new Map(), elements = new Map();
  function element() { return {dataset:{},style:{},handlers:{},value:'99',children:[],setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},addEventListener(k,f){this.handlers[k]=f},replaceChildren(...nodes){this.children=nodes},append(...nodes){this.children.push(...nodes)},focus(){}}; }
  const modes = name === 'heap' ? ['peek','insert','extract'] : name === 'graph' ? ['bfs','dfs','edit'] : name === 'queue' ? ['peek','enqueue','dequeue'] : name === 'stack' ? ['peek','push','pop'] : name === 'array' ? ['access','insert','delete'] : ['search','insert','delete'];
  const tabs=modes.map(mode=>{const e=element();e.dataset.mode=mode;return e;});
  const document={querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll(){return tabs},createElement:element,createElementNS:element};
  const context=vm.createContext({document,ArrayModel:require('./array-model.js'),LinkedListModel:require('./linked-list-model.js'),StackModel:require('./stack-model.js'),QueueModel:require('./queue-model.js'),TreeModel:require('./tree-model.js'),HeapModel:require('./heap-model.js'),GraphModel:require('./graph-model.js'),HashTableModel:require('./hash-table-model.js'),setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,time:now+delay});return id;},clearTimeout(id){timers.delete(id);}});
  vm.runInContext(fs.readFileSync('step-player.js','utf8'),context);
  if(['heap','graph','hash-table'].includes(name))vm.runInContext(fs.readFileSync('lesson-player.js','utf8'),context);
  vm.runInContext(fs.readFileSync(name+'.js','utf8'),context);
  const get=s=>document.querySelector(s), prefix=name==='tree'?'tree':name==='queue'?'queue':name==='stack'?'stack':name==='array'?'array':'list';
  return {get,timers,context,
    mode(mode){tabs[modes.indexOf(mode)].handlers.click();},
    run(index=1){get(`#${prefix}-index`).value=String(index);get(`#${prefix}-form`).handlers.submit({preventDefault(){}});},
    reset(){get(`#${prefix}-reset`).handlers.click();},
    advance(ms){const end=now+ms;while(true){const next=[...timers].sort((a,b)=>a[1].time-b[1].time)[0];if(!next || next[1].time>end)break;timers.delete(next[0]);now=next[1].time;next[1].fn();}now=end;}
  };
}
for (const name of ['array','linked-list']) {
  test(`${name}: automatic steps wait 2000ms, complete and preserve edits`,()=>{
    const h=harness(name);h.mode('insert');h.run();
    const first=h.get('#step-count').textContent;
    assert.equal(h.timers.size,1);
    h.advance(1999);assert.equal(h.get('#step-count').textContent,first);
    h.advance(1);assert.notEqual(h.get('#step-count').textContent,first);
    h.advance(60000);assert.equal(h.get('#step-status').textContent,'진행 완료');assert.equal(h.timers.size,0);
    h.mode(name==='array'?'access':'search');assert.match(h.get('#array-code').textContent,/12.*99.*24/);
    h.mode('delete');h.run();h.advance(60000);h.mode(name==='array'?'access':'search');
    assert.doesNotMatch(h.get('#array-code').textContent,/99/);
  });
  test(`${name}: reset, tab changes and duplicate submissions cannot leave stale playback`,()=>{
    const h=harness(name);h.mode('insert');h.run();h.run();assert.equal(h.timers.size,1);
    h.advance(2000);h.reset();assert.equal(h.timers.size,0);
    const reset=h.get('#array-code').textContent;h.advance(60000);assert.equal(h.get('#array-code').textContent,reset);
    h.run();h.advance(2000);h.mode('delete');assert.equal(h.timers.size,0);
    const tab=h.get('#array-code').textContent;h.advance(60000);assert.equal(h.get('#array-code').textContent,tab);
    assert.doesNotMatch(tab,/99/);
  });
}
test('linked-list: search and out-of-range traversal automatically reach result',()=>{
  const h=harness('linked-list');h.run(2);h.advance(60000);assert.match(h.get('#array-code').textContent,/36/);assert.equal(h.timers.size,0);
  h.run(10);h.advance(60000);assert.match(h.get('#array-code').textContent,/null/);assert.equal(h.timers.size,0);
});
test('array: direct access never schedules a timer',()=>{
  const h=harness('array');h.run(2);assert.match(h.get('#array-code').textContent,/36/);assert.equal(h.timers.size,0);
});
test('StepPlayer ignores obsolete callbacks after stop',()=>{
  const h=harness('array');
  vm.runInContext('globalThis.probe = new StepPlayer(); globalThis.calls = 0; probe.play(() => { calls++; return true; });',h.context);
  const obsolete=[...h.timers.values()][0].fn;
  vm.runInContext('probe.stop()',h.context);obsolete();
  assert.equal(h.context.calls,0);assert.equal(h.timers.size,0);
});
for (const name of ['array','linked-list']) {
  test(`${name}: manual navigation restarts the 2s countdown and refreshes the progress bar`,()=>{
    const h=harness(name);h.mode('insert');h.run();
    assert.equal(h.get('#step-prev').disabled,true);
    assert.equal(h.get('#step-next').disabled,false);
    assert.match(h.get('#step-progress').children[0].className,/running/);
    h.advance(1500);
    h.get('#step-next').handlers.click();
    const manual=h.get('#step-count').textContent;
    h.advance(1999);assert.equal(h.get('#step-count').textContent,manual);
    h.advance(1);assert.notEqual(h.get('#step-count').textContent,manual);
    h.get('#step-prev').handlers.click();
    assert.equal(h.get('#step-count').textContent,manual);
    assert.equal(h.timers.size,1);
    h.advance(60000);
    assert.equal(h.timers.size,0);assert.equal(h.get('#step-next').disabled,true);
    assert.match(h.get('#step-progress').children[0].className,/complete/);
    h.get('#step-prev').handlers.click();
    assert.match(h.get('#step-progress').children[0].className,/running/);
    assert.equal(h.timers.size,1);
    h.get('#step-next').handlers.click();
    assert.equal(h.timers.size,0);assert.equal(h.get('#step-status').textContent,'진행 완료');
  });
  test(`${name}: manual jumps cannot revive a cancelled timer`,()=>{
    const h=harness(name);h.mode('insert');h.run();
    const obsolete=[...h.timers.values()][0].fn;
    h.get('#step-next').handlers.click();
    const current=h.get('#step-count').textContent;
    obsolete();assert.equal(h.get('#step-count').textContent,current);assert.equal(h.timers.size,1);
    h.reset();assert.equal(h.timers.size,0);
  });
}

test('stack: timed push, manual replay, peek and pop preserve LIFO',()=>{
  const h=harness('stack');h.mode('push');h.run();
  assert.equal(h.get('#stack-run').disabled,true);
  const first=h.get('#step-count').textContent;h.advance(1999);assert.equal(h.get('#step-count').textContent,first);
  h.advance(1);assert.notEqual(h.get('#step-count').textContent,first);
  h.get('#step-prev').handlers.click();assert.equal(h.timers.size,1);
  h.get('#step-next').handlers.click();h.advance(2000);
  assert.equal(h.get('#stack-top').textContent,3);assert.equal(h.timers.size,0);
  assert.match(h.get('#step-progress').children[0].className,/complete/);
  h.mode('peek');h.run();h.advance(2000);assert.match(h.get('#array-code').textContent,/99/);
  h.mode('pop');h.run();h.advance(60000);assert.match(h.get('#array-code').textContent,/99/);
  assert.equal(h.get('#stack-top').textContent,2);
  h.mode('peek');assert.doesNotMatch(h.get('#array-code').textContent,/99/);
});
test('stack: overflow, underflow, reset and cancelled previews',()=>{
  const h=harness('stack');h.mode('push');
  for(let i=0;i<3;i++){h.run();h.advance(60000);}
  h.run();assert.match(h.get('#array-code').textContent,/overflow/);assert.equal(h.timers.size,0);
  h.mode('pop');for(let i=0;i<6;i++){h.run();h.advance(60000);}
  h.run();assert.match(h.get('#array-code').textContent,/underflow/);assert.equal(h.timers.size,0);
  h.mode('peek');h.run();assert.match(h.get('#array-code').textContent,/underflow/);
  h.reset();assert.equal(h.get('#stack-top').textContent,2);
  h.mode('push');h.run();const obsolete=[...h.timers.values()][0].fn;
  h.mode('pop');obsolete();assert.equal(h.timers.size,0);assert.equal(h.get('#stack-top').textContent,2);
  h.mode('push');h.run();h.reset();h.advance(60000);assert.equal(h.get('#stack-top').textContent,2);assert.equal(h.timers.size,0);
});

test('queue: FIFO, timed and manual steps, progress and front/rear updates',()=>{
  const h=harness('queue');h.mode('enqueue');h.run();
  const first=h.get('#step-count').textContent;h.advance(1999);assert.equal(h.get('#step-count').textContent,first);
  h.advance(1);assert.notEqual(h.get('#step-count').textContent,first);
  h.get('#step-prev').handlers.click();assert.equal(h.timers.size,1);
  h.get('#step-next').handlers.click();h.advance(2000);
  assert.equal(h.get('#queue-front').textContent,12);assert.equal(h.get('#queue-rear').textContent,99);
  assert.match(h.get('#step-progress').children[0].className,/complete/);assert.equal(h.timers.size,0);
  h.mode('peek');h.run();h.advance(60000);assert.match(h.get('#array-code').textContent,/12/);
  h.mode('dequeue');h.run();h.advance(60000);
  assert.match(h.get('#array-code').textContent,/12/);assert.equal(h.get('#queue-front').textContent,24);assert.equal(h.get('#queue-rear').textContent,99);
});
test('queue: overflow, underflow, single-node references and stale timer cancellation',()=>{
  const h=harness('queue');h.mode('enqueue');for(let i=0;i<3;i++){h.run();h.advance(60000);}
  h.run();assert.match(h.get('#array-code').textContent,/overflow/);assert.equal(h.timers.size,0);
  h.mode('dequeue');for(let i=0;i<6;i++){h.run();h.advance(60000);}
  assert.equal(h.get('#queue-front').textContent,'null');assert.equal(h.get('#queue-rear').textContent,'null');
  h.run();assert.match(h.get('#array-code').textContent,/underflow/);
  h.mode('peek');h.run();assert.match(h.get('#array-code').textContent,/underflow/);
  h.mode('enqueue');h.run();h.advance(60000);assert.equal(h.get('#queue-front').textContent,99);assert.equal(h.get('#queue-rear').textContent,99);
  h.reset();h.mode('enqueue');h.run();const obsolete=[...h.timers.values()][0].fn;
  h.mode('dequeue');obsolete();assert.equal(h.timers.size,0);assert.equal(h.get('#queue-front').textContent,12);
  h.mode('enqueue');h.run();h.reset();h.advance(60000);assert.equal(h.get('#queue-rear').textContent,36);assert.equal(h.timers.size,0);
});

test('tree: timed and manual comparisons, insert, two-child deletion and progress',()=>{
  const h=harness('tree');h.get('#tree-value').value='30';h.run();
  const first=h.get('#step-count').textContent;h.advance(1999);assert.equal(h.get('#step-count').textContent,first);
  h.advance(1);assert.notEqual(h.get('#step-count').textContent,first);
  h.get('#step-prev').handlers.click();assert.equal(h.timers.size,1);
  h.get('#step-next').handlers.click();h.advance(60000);assert.match(h.get('#array-code').textContent,/found/);
  assert.equal(h.timers.size,0);assert.match(h.get('#step-progress').children[0].className,/complete/);
  h.mode('insert');h.get('#tree-value').value='25';h.run();h.advance(60000);assert.match(h.get('#tree-size').textContent,/8/);
  h.mode('delete');h.get('#tree-value').value='40';h.run();h.advance(60000);assert.match(h.get('#tree-summary').textContent,/루트 50/);assert.match(h.get('#tree-size').textContent,/7/);
  h.mode('search');h.get('#tree-value').value='25';h.run();h.advance(60000);assert.match(h.get('#array-code').textContent,/→ found/);
  h.get('#tree-value').value='40';h.run();h.advance(60000);assert.match(h.get('#array-code').textContent,/not found/);
});
test('tree: duplicate values, missing values, cancelled operations and reset',()=>{
  const h=harness('tree');h.mode('insert');h.get('#tree-value').value='40';h.run();h.advance(60000);
  assert.match(h.get('#array-code').textContent,/duplicate/);assert.match(h.get('#tree-size').textContent,/7/);
  h.get('#tree-value').value='25';h.run();const obsolete=[...h.timers.values()][0].fn;
  h.mode('search');obsolete();assert.equal(h.timers.size,0);
  h.get('#tree-value').value='25';h.run();h.advance(60000);assert.match(h.get('#array-code').textContent,/not found/);
  h.mode('delete');h.get('#tree-value').value='20';h.run();h.advance(2000);h.reset();
  h.advance(60000);assert.equal(h.timers.size,0);assert.match(h.get('#tree-summary').textContent,/루트 40/);assert.match(h.get('#tree-size').textContent,/7/);
});

test('heap: shared playback, manual countdown restart, persistent extraction and cancellation',()=>{
  const h=harness('heap');const run=()=>h.get('#lesson-form').handlers.submit({preventDefault(){}});
  h.mode('insert');h.get('#heap-value').value='1';run();
  assert.equal(h.get('#lesson-run').disabled,true);const first=h.get('#step-count').textContent;
  h.advance(1999);assert.equal(h.get('#step-count').textContent,first);h.advance(1);assert.notEqual(h.get('#step-count').textContent,first);
  h.get('#step-prev').handlers.click();assert.equal(h.timers.size,1);h.get('#step-next').handlers.click();
  const manual=h.get('#step-count').textContent;h.advance(1999);assert.equal(h.get('#step-count').textContent,manual);
  h.advance(60000);assert.equal(h.timers.size,0);assert.match(h.get('#step-progress').children[0].className,/complete/);
  h.mode('peek');run();assert.match(h.get('#array-code').textContent,/→ 1$/);
  h.mode('extract');run();h.advance(60000);assert.match(h.get('#lesson-summary').textContent,/1/);
  h.mode('peek');run();assert.match(h.get('#array-code').textContent,/→ 10$/);
  h.mode('insert');run();const obsolete=[...h.timers.values()][0].fn;
  h.mode('peek');obsolete();assert.equal(h.timers.size,0);
  h.mode('insert');run();h.get('#lesson-reset').handlers.click();h.advance(60000);assert.equal(h.timers.size,0);assert.match(h.get('#lesson-size').textContent,/7/);
});
test('graph: BFS and DFS playback, edge edits and disconnected results',()=>{
  const h=harness('graph');const run=()=>h.get('#lesson-form').handlers.submit({preventDefault(){}});
  h.get('#graph-start').value='A';run();const first=h.get('#step-count').textContent;
  h.advance(1999);assert.equal(h.get('#step-count').textContent,first);h.advance(1);assert.notEqual(h.get('#step-count').textContent,first);
  h.get('#step-prev').handlers.click();h.get('#step-next').handlers.click();h.advance(120000);
  assert.equal(h.get('#graph-order').textContent,'A → B → C → D → E → F');assert.equal(h.timers.size,0);
  h.mode('dfs');run();h.advance(120000);assert.equal(h.get('#graph-order').textContent,'A → B → D → C → E → F');
  h.mode('edit');h.get('#graph-from').value='E';h.get('#graph-to').value='F';h.get('#graph-action').value='remove';run();h.advance(2000);
  assert.match(h.get('#lesson-size').textContent,/간선 5개/);
  h.mode('bfs');run();h.advance(120000);assert.match(h.get('#array-message').textContent,/도달 불가: F/);
  h.mode('edit');h.get('#graph-action').value='add';run();const obsolete=[...h.timers.values()][0].fn;
  h.get('#lesson-reset').handlers.click();obsolete();h.advance(60000);assert.equal(h.timers.size,0);assert.match(h.get('#lesson-size').textContent,/간선 6개/);
});

test('hash table: collisions, timed/manual playback, updates and deletion',()=>{
  const h=harness('hash-table');const run=()=>h.get('#lesson-form').handlers.submit({preventDefault(){}});
  h.get('#hash-key').value='24';run();const first=h.get('#step-count').textContent;
  h.advance(1999);assert.equal(h.get('#step-count').textContent,first);h.advance(1);assert.notEqual(h.get('#step-count').textContent,first);
  h.get('#step-prev').handlers.click();assert.equal(h.timers.size,1);h.get('#step-next').handlers.click();
  h.advance(60000);assert.match(h.get('#array-code').textContent,/240/);assert.equal(h.timers.size,0);
  assert.match(h.get('#step-progress').children[0].className,/complete/);
  h.mode('insert');h.get('#hash-key').value='17';h.get('#hash-value').value='0';run();h.advance(60000);
  assert.match(h.get('#lesson-size').textContent,/항목 5개/);
  h.mode('search');run();h.advance(60000);assert.match(h.get('#array-code').textContent,/→ 0$/);
  h.mode('delete');run();h.advance(60000);assert.match(h.get('#lesson-size').textContent,/항목 4개/);
  h.mode('search');h.get('#hash-key').value='24';run();h.advance(60000);assert.match(h.get('#array-code').textContent,/240/);
  h.get('#hash-key').value='17';run();h.advance(60000);assert.match(h.get('#array-code').textContent,/not found/);
});
test('hash table: negative keys, missing keys and cancelled operations',()=>{
  const h=harness('hash-table');const run=()=>h.get('#lesson-form').handlers.submit({preventDefault(){}});
  h.mode('insert');h.get('#hash-key').value='-1';h.get('#hash-value').value='-5';run();
  const obsolete=[...h.timers.values()][0].fn;h.mode('search');obsolete();assert.equal(h.timers.size,0);
  run();h.advance(60000);assert.match(h.get('#array-code').textContent,/not found/);
  h.mode('insert');run();h.advance(60000);assert.match(h.get('#lesson-size').textContent,/항목 6개/);
  h.mode('search');run();h.advance(60000);assert.match(h.get('#hash-result').textContent,/버킷 \[6\]/);assert.match(h.get('#array-code').textContent,/→ -5$/);
  h.mode('delete');run();h.get('#lesson-reset').handlers.click();h.advance(60000);assert.equal(h.timers.size,0);assert.match(h.get('#lesson-size').textContent,/항목 5개/);
});
