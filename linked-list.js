'use strict';
const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-mode]')];
let state = LinkedListModel.create(), mode = 'search', steps = [], cursor = 0;
const descriptions = {
  search: ['HEAD부터 next를 따라 순차 탐색', '노드는 데이터와 다음 노드의 참조로 구성 · 마지막 노드의 next는 null', '탐색 시작', '탐색 O(n)', 'HEAD에서 시작해 원하는 위치까지 next를 따라 이동'],
  insert: ['새 노드를 만들고 연결 변경', '새 노드를 다음 노드에 먼저 연결한 뒤 이전 노드 또는 HEAD의 참조 변경', '삽입 시작', '위치 탐색 O(n) · 연결 변경 O(1)', '이전 노드의 위치를 찾는 과정 포함 · 맨 앞 삽입은 O(1)'],
  delete: ['대상 노드를 건너뛰도록 연결 변경', '이전 노드 또는 HEAD를 다음 노드에 연결한 뒤 대상 노드 제거', '삭제 시작', '위치 탐색 O(n) · 연결 변경 O(1)', '이전 노드의 위치를 찾는 과정 포함 · 맨 앞 삭제는 O(1)']
};
const player = new StepPlayer(1000);
function playbackInterval() { return 1000; }
function playSteps() {
  player.stop();
  if (cursor >= steps.length - 1) return;
  player.interval = playbackInterval();
  player.play(() => {
    cursor++;
    render();
    return cursor < steps.length - 1;
  });
}
function settle() {
  player.stop();
  if (steps.length && cursor === steps.length - 1) state = LinkedListModel.clone(steps[cursor].state);
  steps = []; cursor = 0;
}
function svgElement(tag, attributes, text) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  if (text !== undefined) element.textContent = text;
  return element;
}
let diagram = null;
function draw(frame) {
  const svg = $('#list-diagram');
  const snapshot = frame?.state || state;
  const ids = frame?.layout || LinkedListModel.order(snapshot);
  const positions = new Map(ids.map((id, i) => [id, {x: 115 + i * 165, y: 60}]));
  const freshFrame = steps.find(step => step.fresh);
  const freshId = freshFrame?.fresh;
  const freshPosition = {x: 115 + Number($('#list-index').value) * 165, y: 205};
  if (frame?.fresh) positions.set(frame.fresh, freshPosition);
  const slots = Math.max(ids.length, ...steps.map(step => step.layout.length));
  const nullX = 130 + slots * 165;
  const width = Math.max(620, 285 + slots * 165);
  if (!diagram) {
    svg.replaceChildren();
    const defs = svgElement('defs', {});
    const marker = svgElement('marker', {id: 'list-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'});
    marker.append(svgElement('path', {d: 'M 0 0 L 10 5 L 0 10 Z', fill: '#a58abd'}));
    defs.append(marker);svg.append(defs);
    const edges = svgElement('g', {});
    const headEdge = svgElement('path', {class: 'list-edge', 'marker-end': 'url(#list-arrow)'});
    edges.append(headEdge);
    const end = svgElement('text', {class: 'list-null'}, 'null');
    const pointer = svgElement('g', {class: 'list-current', 'aria-hidden': 'true'});
    const label = svgElement('text', {x: 0, y: 19}, 'current');
    pointer.append(svgElement('rect', {x: -46, y: 2, width: 92, height: 25, rx: 12}), label, svgElement('path', {d: 'M -5 30 L 5 30 L 0 36 Z'}));
    svg.append(edges, end, svgElement('text', {x: 20, y: 32, class: 'list-head'}, 'HEAD'), pointer);
    diagram = {edges, headEdge, end, pointer, label, nodes: new Map()};
  }
  svg.setAttribute('viewBox', `0 0 ${width} ${freshFrame ? 325 : 200}`);
  svg.style.width = `${width}px`;
  svg.setAttribute('aria-label', `단일 연결 리스트 · HEAD ${snapshot.head ?? 'null'} · ${snapshot.nodes.map(n => `${n.id}: 값 ${n.value}, next ${n.next ?? 'null'}`).join(' · ')}`);
  diagram.end.setAttribute('x', nullX);diagram.end.setAttribute('y', 105);
  const head = positions.get(snapshot.head);
  diagram.headEdge.setAttribute('d', `M 55 38 L ${head ? head.x : nullX} ${head ? head.y + 10 : 90}`);
  // Keep even absent nodes mounted so insertion, removal and reverse playback can fade.
  const pool = new Map([...state.nodes, ...steps.flatMap(step => step.state.nodes)].map(node => [node.id, node]));
  pool.forEach(node => {
    if (diagram.nodes.has(node.id)) return;
    const group = svgElement('g', {class: 'list-node'});
    const data = svgElement('text', {x: 55, y: 30, class: 'list-data'}, node.value);
    const next = svgElement('text', {x: 55, y: 62, class: 'list-next'});
    const note = svgElement('text', {x: 55, y: 98, class: 'list-node-id'});
    group.append(svgElement('rect', {x: 0, y: 0, width: 110, height: 74, rx: 8}),
      svgElement('text', {x: 55, y: -10, class: 'list-node-id'}, node.id),
      data,
      svgElement('line', {x1: 0, y1: 43, x2: 110, y2: 43}), next, note);
    const edge = svgElement('path', {class: 'list-edge', 'marker-end': 'url(#list-arrow)'});
    group.style.opacity = '0';
    if (node.id === freshId) group.style.transform = `translate(${freshPosition.x}px, ${freshPosition.y}px)`;
    diagram.edges.append(edge);svg.append(group);
    diagram.nodes.set(node.id, {group, edge, data, next, note});
  });
  diagram.nodes.forEach(({group, edge, data, next, note}, id) => {
    const node = snapshot.nodes.find(item => item.id === id);
    const source = positions.get(id);
    const visible = !!node && !!source;
    group.style.opacity = visible ? (frame?.detached === id ? '.5' : '1') : '0';
    group.setAttribute('aria-hidden', String(!visible));
    edge.style.opacity = visible ? '1' : '0';
    if (!visible) return;
    group.style.transform = `translate(${source.x}px, ${source.y}px)`;
    group.setAttribute('class', `list-node${frame?.active.includes(id) ? ' active' : ''}${frame?.detached === id ? ' detached' : ''}`);
    data.textContent = node.value;
    next.textContent = `next: ${node.next ?? 'null'}`;
    note.textContent = frame?.detached === id ? '분리된 노드' : frame?.fresh === id ? '새 노드' : '';
    const target = positions.get(node.next);
    const x1 = source.x + 111, y1 = source.y + 37;
    const x2 = target ? target.x - 6 : nullX - 8, y2 = target ? target.y + 37 : 97;
    const bend = target && (target.y !== source.y || target.x > source.x + 170) ? 65 : 0;
    edge.setAttribute('d', `M ${x1} ${y1} C ${x1 + 25} ${y1 + bend}, ${x2 - 25} ${y2 + bend}, ${x2} ${y2}`);
  });
  const activeId = frame?.fresh || frame?.detached || frame?.active[0];
  const current = positions.get(activeId);
  const show = !!frame && (mode === 'search' || !!current);
  diagram.pointer.style.transform = mode === 'search'
    ? `translateX(${current ? current.x + 55 : frame ? nullX + 15 : 170}px)`
    : `translate(${current ? current.x + 55 : 170}px, ${current ? current.y - 60 : 0}px)`;
  diagram.pointer.style.opacity = show ? '1' : '0';
  diagram.pointer.setAttribute('class', `list-current${frame?.status === 'error' ? ' error' : ''}`);
  diagram.label.textContent = mode === 'search' ? 'current' : frame?.fresh ? 'newNode' : frame?.code.includes('target') ? 'target' : frame?.code === 'position = 0' ? 'HEAD' : 'prev';
}
function render() {
  const frame = steps[cursor], locked = steps.length > 0 && cursor < steps.length-1;
  const size=LinkedListModel.order(frame?.state || state).length;
  draw(frame);
  $('#list-size').textContent=`연결된 노드 수 ${size}`;
  $('#array-code').textContent=frame?.code || `head → ${LinkedListModel.order(state).map(id=>state.nodes.find(n=>n.id===id).value).concat('null').join(' → ')}`;
  $('#array-message').textContent=frame?.message || '위치 설정 후 시작';
  $('.array-feedback').hidden = !frame;
  $('#list-reset').textContent = !frame ? '시작' : locked ? '↺ 초기화' : '다시 시작';
  $('#list-run').hidden = true;
  $('#list-reset').disabled = !locked && mode === 'delete' && size === 0 && !frame;
  $('.array-feedback').setAttribute('data-state',frame?.status || 'normal');
  $('#step-controls').hidden=!steps.length;
  $('#step-count').textContent=`${cursor+1} / ${steps.length}`;
  $('#step-prev').disabled = cursor === 0;
  $('#step-next').disabled = cursor >= steps.length - 1;
  $('#step-status').textContent = locked ? '자동 진행' : '진행 완료';
  const fill = document.createElement('span');
  fill.className = locked ? 'step-progress-fill running' : 'step-progress-fill complete';
  fill.style.animationDuration = `${playbackInterval()}ms`;
  $('#step-progress').replaceChildren(fill);
  $('#step-progress').setAttribute('aria-label', locked ? `다음 단계까지 ${playbackInterval() / 1000}초 · 자동 진행 중` : '모든 단계 진행 완료');
  $('#list-index').disabled=locked;$('#list-value').disabled=locked || mode!=='insert';
  $('#list-run').disabled=locked || (mode==='delete' && size===0);
  $('#list-index').min=0;
  if(mode==='search') $('#list-index').removeAttribute('max'); else $('#list-index').max=Math.max(0,mode==='insert'?size:size-1);
  $('#range-hint').textContent=locked?'단계 진행 중 · 탭 전환 시 미완료 연산 취소':mode==='search'?'위치는 0부터 시작 · 범위 밖은 null까지 순차 탐색':mode==='delete' && !size?'빈 목록 · 삽입 후 삭제 가능':`입력 가능한 위치 0–${mode==='insert'?size:size-1}`;
}
function changeMode(next) {
  settle();mode=next;
  $('.linked-list-page').setAttribute('data-mode', mode);
  $('#list-index-label').textContent = mode === 'search' ? '탐색 위치' : '위치';
  tabs.forEach(tab=>{const selected=tab.dataset.mode===mode;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
  $('#list-panel').setAttribute('aria-labelledby',`tab-${mode}`);
  const [title,description,action,complexity,explanation]=descriptions[mode];
  $('#concept-title').textContent=title;$('#concept-description').textContent=description;
  $('#list-run').textContent=action;$('#complexity-title').textContent=complexity;$('#complexity-description').textContent=explanation;
  $('#list-value-label').hidden=mode!=='insert';$('#list-value').required=mode==='insert';
  $('#list-index').value=mode==='search'?Math.min(2,Math.max(0,LinkedListModel.order(state).length-1)):0;
  $('#list-error').textContent='';render();
}
tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>changeMode(tab.dataset.mode));
  tab.addEventListener('keydown',event=>{
    const next=event.key==='ArrowRight'?(i+1)%3:event.key==='ArrowLeft'?(i+2)%3:event.key==='Home'?0:event.key==='End'?2:null;
    if(next!==null){event.preventDefault();changeMode(tabs[next].dataset.mode);tabs[next].focus();}
  });
});
function startOperation() {
  if(steps.length && cursor<steps.length-1)return;
  settle();
  try{steps=LinkedListModel.frames(state,mode,Number($('#list-index').value),Number($('#list-value').value));cursor=0;$('#list-error').textContent='';}
  catch(error){$('#list-error').textContent=error.message;}
  render(); playSteps();
}
$('#list-form').addEventListener('submit',event=>{ event.preventDefault(); startOperation(); });
$('#list-form').addEventListener('invalid',event=>{$('#list-error').textContent=event.target===$('#list-index')?'유효한 범위의 정수 위치를 입력':'값은 -999부터 999까지의 정수로 입력';},true);
function moveStep(offset) {
  const next = cursor + offset;
  if (!steps.length || next < 0 || next >= steps.length) return;
  cursor = next;
  render();
  playSteps();
}
$('#step-prev').addEventListener('click', () => moveStep(-1));
$('#step-next').addEventListener('click', () => moveStep(1));
$('#list-reset').addEventListener('click',()=>{
  if (!steps.length || cursor === steps.length - 1) {
    if ($('#list-form').reportValidity()) startOperation();
    return;
  }
  player.stop();state=LinkedListModel.create();steps=[];cursor=0;$('#list-value').value=99;changeMode(mode);
});
changeMode('search');
