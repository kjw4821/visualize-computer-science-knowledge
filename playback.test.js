'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function harness(name) {
  let now = 0, serial = 0;
  const timers = new Map(), elements = new Map();
  function element() { return {dataset:{},style:{},handlers:{},value:'99',children:[],reportValidity(){return true},setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},addEventListener(k,f){this.handlers[k]=f},replaceChildren(...nodes){this.children=nodes},append(...nodes){this.children.push(...nodes)},focus(){}}; }
  const modes = name === 'heap' ? ['peek','insert','extract'] : name === 'graph' ? ['bfs','dfs','edit'] : name === 'queue' ? ['peek','enqueue','dequeue'] : name === 'stack' ? ['peek','push','pop'] : name === 'array' ? ['structure','multi'] : ['search','insert','delete'];
  const tabs=modes.map(mode=>{const e=element();e.dataset.mode=mode;return e;});
  const document={querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll(){return tabs},createElement:element,createElementNS:element};
  const context=vm.createContext({document,MultidimensionalArrayModel:require('./multidimensional-array-model.js'),ArrayModel:require('./array-model.js'),LinkedListModel:require('./linked-list-model.js'),StackModel:require('./stack-model.js'),QueueModel:require('./queue-model.js'),TreeModel:require('./tree-model.js'),HeapModel:require('./heap-model.js'),GraphModel:require('./graph-model.js'),HashTableModel:require('./hash-table-model.js'),setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,time:now+delay});return id;},clearTimeout(id){timers.delete(id);}});
  vm.runInContext(fs.readFileSync('step-player.js','utf8'),context);
  if(['heap','graph','hash-table'].includes(name))vm.runInContext(fs.readFileSync('lesson-player.js','utf8'),context);
  vm.runInContext(fs.readFileSync(name+'.js','utf8'),context);
  const get=s=>document.querySelector(s), prefix=name==='tree'?'tree':name==='queue'?'queue':name==='stack'?'stack':name==='array'?'array':'list';
  return {get,timers,context,
    mode(mode){tabs[modes.indexOf(mode)].handlers.click();},
    run(index=1){if(name==='array'){get('#array-reset').handlers.click();return;}get(`#${prefix}-index`).value=String(index);get(`#${prefix}-form`).handlers.submit({preventDefault(){}});},
    reset(){if (name === 'stack' || name === 'queue') { vm.runInContext('reset()', context); return; } get(`#${prefix}-reset`).handlers.click();},
    advance(ms){const end=now+ms;while(true){const next=[...timers].sort((a,b)=>a[1].time-b[1].time)[0];if(!next || next[1].time>end)break;timers.delete(next[0]);now=next[1].time;next[1].fn();}now=end;}
  };
}
for (const name of ['linked-list']) {
  test(`${name}: automatic steps wait 1000ms, complete and preserve edits`,()=>{
    const h=harness(name);h.mode('insert');h.run();
    const first=h.get('#step-count').textContent;
    assert.equal(h.timers.size,1);
    h.advance(999);assert.equal(h.get('#step-count').textContent,first);
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
test('array: declaration, timed assignments, bounds stop, reset and restart',()=>{
  const h=harness('array');
  assert.equal(h.get('#array-memory').hidden,true);
  h.run();const first=h.get('#step-count').textContent;
  assert.equal(h.get('#array-cells').children.length,5);
  assert.equal(h.get('#array-reset').textContent,'↺ 초기화');
  assert.equal(h.timers.size,1);
  h.advance(999);assert.equal(h.get('#step-count').textContent,first);
  h.advance(1);assert.match(h.get('#array-code').textContent,/arr\[0\] =/);
  assert.equal(h.get('#array-pointer').hidden,false);
  assert.equal(h.get('#array-pointer').textContent,'i = 0');
  assert.equal(h.get('#array-pointer').style.left,'10%');
  h.advance(4000);assert.match(h.get('#array-code').textContent,/arr\[4\] =/);
  assert.equal(h.get('#array-pointer').textContent,'i = 4');
  assert.equal(h.get('#array-pointer').style.left,'90%');
  h.advance(1000);assert.match(h.get('#array-code').textContent,/arr\[5\] =/);
  assert.match(h.get('#array-outside').className,/outside-active/);
  assert.equal(h.get('#array-pointer').hidden,true);
  assert.equal(h.get('#array-outside-pointer').hidden,false);
  assert.equal(h.get('#array-cells').children.length,5);
  assert.equal(h.get('#array-reset').textContent,'다시 시작');assert.equal(h.timers.size,0);
  h.run();assert.equal(h.get('#step-count').textContent,'1 / 7');
  const obsolete=[...h.timers.values()][0].fn;
  h.reset();obsolete();h.advance(60000);
  assert.equal(h.get('#array-memory').hidden,true);assert.equal(h.timers.size,0);
  assert.equal(h.get('#step-controls').hidden,true);
  assert.equal(h.get('#array-reset').textContent,'시작');
  assert.equal(h.get('#array-pointer').hidden,true);
  assert.equal(h.get('#array-outside-pointer').hidden,true);
  h.run();assert.equal(h.get('#step-count').textContent,'1 / 7');
  assert.equal(h.timers.size,1);
});

test('StepPlayer ignores obsolete callbacks after stop',()=>{
  const h=harness('array');
  vm.runInContext('globalThis.probe = new StepPlayer(); globalThis.calls = 0; probe.play(() => { calls++; return true; });',h.context);
  const obsolete=[...h.timers.values()][0].fn;
  vm.runInContext('probe.stop()',h.context);obsolete();
  assert.equal(h.context.calls,0);assert.equal(h.timers.size,0);
});
for (const name of ['array','linked-list']) {
  test(`${name}: manual navigation restarts the countdown and refreshes the progress bar`,()=>{
    const h=harness(name);if(name !== 'array') h.mode('insert');h.run();
    assert.equal(h.get('#step-prev').disabled,true);
    assert.equal(h.get('#step-next').disabled,false);
    assert.match(h.get('#step-progress').children[0].className,/running/);
    const interval = 1000;
    h.advance(interval - 500);
    h.get('#step-next').handlers.click();
    const manual=h.get('#step-count').textContent;
    h.advance(interval - 1);assert.equal(h.get('#step-count').textContent,manual);
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
    const h=harness(name);if(name !== 'array') h.mode('insert');h.run();
    const obsolete=[...h.timers.values()][0].fn;
    h.get('#step-next').handlers.click();
    const current=h.get('#step-count').textContent;
    obsolete();assert.equal(h.get('#step-count').textContent,current);assert.equal(h.timers.size,1);
    h.reset();assert.equal(h.timers.size,0);
  });
}

test('stack: timed push, manual replay, peek and pop preserve LIFO',()=>{
  const h=harness('stack');h.mode('push');h.run();
  assert.equal(h.get('#stack-run').textContent,'↺ 초기화');
  const first=h.get('#step-count').textContent;h.advance(999);assert.equal(h.get('#step-count').textContent,first);
  h.advance(1);assert.notEqual(h.get('#step-count').textContent,first);
  h.get('#step-prev').handlers.click();assert.equal(h.timers.size,1);
  h.get('#step-next').handlers.click();h.advance(1000);
  assert.equal(h.get('#stack-top').textContent,3);assert.equal(h.timers.size,0);
  assert.match(h.get('#step-progress').children[0].className,/complete/);
  h.mode('peek');h.run();h.advance(1000);assert.match(h.get('#array-code').textContent,/99/);
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
  const first=h.get('#step-count').textContent;h.advance(999);assert.equal(h.get('#step-count').textContent,first);
  h.advance(1);assert.notEqual(h.get('#step-count').textContent,first);
  h.get('#step-prev').handlers.click();assert.equal(h.timers.size,1);
  h.get('#step-next').handlers.click();h.advance(1000);
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

test('multidimensional: matched spatial and memory states, row and layer boundaries, dimension cancellation', () => {
  const h = harness('array');
  h.mode('multi');
  assert.equal(h.get('#array-declaration-code').textContent, 'int arr[3][4];');
  h.run();
  assert.equal(h.get('#multi-spatial').children.length, 1);
  assert.equal(h.get('#multi-linear').children.length, 12);
  assert.equal(h.get('#step-progress').children[0].style.animationDuration, '500ms');
  h.advance(499);assert.equal(h.get('#step-count').textContent, '1 / 13');
  h.advance(1);
  const first = h.get('#multi-spatial').children[0].children[2].children[1];
  assert.match(first.className, /active/);
  assert.equal(first.textContent, h.get('#multi-linear').children[0].children[1].textContent);
  h.advance(2000);assert.match(h.get('#array-code').textContent, /arr\[1\]\[0\] =/);
  const obsolete = [...h.timers.values()][0].fn;
  h.get('#array-dimension').value = '3';h.get('#array-dimension').handlers.change();
  obsolete();assert.equal(h.timers.size, 0);
  assert.equal(h.get('#array-declaration-code').textContent, 'int arr[2][3][4];');
  assert.equal(h.get('#multi-memory').hidden, true);
  h.run();
  assert.equal(h.get('#multi-spatial').children.length, 2);
  assert.equal(h.get('#multi-linear').children.length, 24);
  assert.equal(h.get('#step-progress').children[0].style.animationDuration, '300ms');
  h.advance(299);assert.equal(h.get('#step-count').textContent, '1 / 25');
  h.advance(1);assert.equal(h.get('#step-count').textContent, '2 / 25');
  h.advance(3600);assert.match(h.get('#array-code').textContent, /arr\[1\]\[0\]\[0\] =/);
  h.get('#step-prev').handlers.click();
  assert.match(h.get('#array-code').textContent, /arr\[0\]\[2\]\[3\] =/);
  h.advance(300);assert.match(h.get('#array-code').textContent, /arr\[1\]\[0\]\[0\] =/);
  h.advance(60000);assert.equal(h.get('#step-count').textContent, '25 / 25');
  assert.equal(h.timers.size, 0);assert.equal(h.get('#array-reset').textContent, '다시 시작');
  h.run();h.mode('structure');h.advance(60000);
  assert.equal(h.timers.size, 0);assert.equal(h.get('#array-memory').hidden, true);
  h.run();assert.equal(h.get('#step-count').textContent, '1 / 7');
});


test('linked-list: search uses unified start, one-second playback and cancellation', () => {
  const h = harness('linked-list');
  assert.equal(h.get('.array-feedback').hidden, true);
  assert.equal(h.get('#list-reset').textContent, '시작');
  h.get('#list-index').value = '2';h.reset();
  assert.equal(h.get('#list-reset').textContent, '↺ 초기화');
  assert.equal(h.get('#step-count').textContent, '1 / 4');
  assert.equal(h.get('#list-index').disabled, true);
  assert.equal(h.get('#step-progress').children[0].style.animationDuration, '1000ms');
  h.advance(999);assert.equal(h.get('#step-count').textContent, '1 / 4');
  h.advance(1);assert.equal(h.get('#step-count').textContent, '2 / 4');
  h.get('#step-prev').handlers.click();
  h.advance(999);assert.equal(h.get('#step-count').textContent, '1 / 4');
  h.advance(1);assert.equal(h.get('#step-count').textContent, '2 / 4');
  const obsolete = [...h.timers.values()][0].fn;
  h.reset();obsolete();h.advance(10000);
  assert.equal(h.timers.size, 0);assert.equal(h.get('.array-feedback').hidden, true);
  assert.equal(h.get('#step-controls').hidden, true);
  h.get('#list-index').value = '10';h.reset();h.advance(10000);
  assert.match(h.get('#array-code').textContent, /null/);
  assert.equal(h.get('#list-reset').textContent, '다시 시작');
  assert.equal(h.get('#list-index').disabled, false);
  h.reset();assert.equal(h.get('#step-count').textContent, '1 / 6');
  h.mode('insert');h.advance(10000);assert.equal(h.timers.size, 0);
});


test('linked-list: search keeps SVG elements through forward, backward and null steps', () => {
  const h = harness('linked-list');
  const diagram = h.get('#list-diagram');
  const initial = [...diagram.children];
  h.run(10);
  assert.deepEqual(diagram.children, initial);
  const pointer = diagram.children.find(child => child.class === 'list-current');
  assert.equal(pointer.style.transform, 'translateX(170px)');
  h.advance(1000);
  assert.equal(pointer.style.transform, 'translateX(335px)');
  h.get('#step-prev').handlers.click();
  assert.equal(pointer.style.transform, 'translateX(170px)');
  h.advance(10000);
  assert.equal(pointer.style.transform, 'translateX(805px)');
  assert.match(pointer.class, /error/);
  assert.deepEqual(diagram.children, initial);
  h.get('#step-prev').handlers.click();h.reset();
  assert.equal(pointer.style.opacity, '0');
  assert.equal(h.timers.size, 0);
});


for (const mode of ['insert', 'delete']) {
  for (const index of (mode === 'insert' ? [0, 2, 4] : [0, 2, 3])) {
    test(`linked-list: ${mode} at ${index} keeps nodes and unified playback`, () => {
      const h = harness('linked-list');h.mode(mode);
      const svg = h.get('#list-diagram');
      const original = svg.children.filter(child => child.class === 'list-node');
      h.get('#list-index').value = String(index);h.reset();
      assert.equal(h.get('#list-reset').textContent, '↺ 초기화');
      assert.equal(h.get('#step-progress').children[0].style.animationDuration, '1000ms');
      const first = h.get('#step-count').textContent;
      h.advance(999);assert.equal(h.get('#step-count').textContent, first);
      h.advance(1);assert.notEqual(h.get('#step-count').textContent, first);
      h.get('#step-prev').handlers.click();
      assert.equal(h.get('#step-count').textContent, first);
      original.forEach(node => assert.ok(svg.children.includes(node)));
      h.advance(10000);
      assert.equal(h.get('#list-reset').textContent, '다시 시작');
      assert.equal(h.get('#list-index').disabled, false);
      assert.equal(h.timers.size, 0);
      assert.equal(h.get('#list-size').textContent, `연결된 노드 수 ${mode === 'insert' ? 5 : 3}`);
      h.get('#step-prev').handlers.click();
      original.forEach(node => assert.ok(svg.children.includes(node)));
      const obsolete = [...h.timers.values()][0].fn;
      h.reset();obsolete();h.advance(10000);
      assert.equal(h.get('#list-size').textContent, '연결된 노드 수 4');
      assert.equal(h.get('.array-feedback').hidden, true);
      assert.equal(h.timers.size, 0);
    });
  }
}
for (const name of ['stack', 'queue']) {
  test(`${name}: value motion leaves connector boxes fixed and cancels on reset`, () => {
    const h = harness(name);
    h.context.window = {matchMedia: () => ({matches: false})};
    const rect = {left: 20, right: 80, top: 30, bottom: 90, width: 60, height: 60};
    const transfer = h.get(`#${name}-transfer`);
    transfer.getBoundingClientRect = () => rect;
    h.get(`#${name}-connector`).getBoundingClientRect = () => ({left: 0, top: 0});
    let animated = null, cancelled = 0;
    const label = transfer.children[0];
    label.animate = function() { animated = this; return {cancel() { cancelled++; }}; };
    transfer.animate = () => { throw new Error('The transfer box must stay fixed'); };
    const cells = h.get(`#${name}-cells`).children;
    cells.forEach(cell => {
      cell.children[1].getBoundingClientRect = () => rect;
      cell.children[1].animate = () => { throw new Error('A data box must stay fixed'); };
      cell.children[1].children[0].animate = label.animate;
    });
    h.mode('peek'); h.run(); h.advance(1000);
    assert.equal(animated, label);
    const path = h.get(`#${name}-direction`).d;
    vm.runInContext('updateTransferArrow()', h.context);
    assert.equal(h.get(`#${name}-direction`).d, path);
    h.reset();
    assert.equal(cancelled, 1);
    h.mode(name === 'stack' ? 'push' : 'enqueue'); h.run(); h.advance(2000);
    assert.equal(animated, cells[3].children[1].children[0]);
  });
}

for (const name of ['stack', 'queue']) {
  test(`${name}: transfer label replaces the initial placeholder`, () => {
    const h = harness(name);
    const transfer = h.get(`#${name}-transfer`);
    transfer.children = [];
    transfer.textContent = '—';
    const replace = transfer.replaceChildren;
    let replacements = 0;
    transfer.replaceChildren = function(...nodes) {
      replacements++;
      this.textContent = '';
      replace.apply(this, nodes);
    };
    h.mode('peek'); h.run(); h.advance(1000);
    assert.equal(replacements, 1);
    assert.equal(transfer.textContent, '');
    assert.equal(transfer.children.length, 1);
    assert.equal(transfer.children[0].textContent, name === 'stack' ? 36 : 12);
    h.reset();
    assert.equal(transfer.children[0].textContent, '—');
    assert.equal(replacements, 1);
  });
}
