'use strict';
const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-mode]')];
let state = LinkedListModel.create(), mode = 'search', steps = [], cursor = 0;
const descriptions = {
  search: ['HEAD부터 next를 따라 순차 탐색', '노드는 데이터와 다음 노드의 참조로 구성 · 마지막 노드의 next는 null', '탐색 시작', '탐색 O(n)', 'HEAD에서 시작해 원하는 위치까지 next를 따라 이동'],
  insert: ['새 노드를 만들고 연결 변경', '새 노드를 다음 노드에 먼저 연결한 뒤 이전 노드 또는 HEAD의 참조 변경', '삽입 시작', '위치 탐색 O(n) · 연결 변경 O(1)', '이전 노드의 위치를 찾는 과정 포함 · 맨 앞 삽입은 O(1)'],
  delete: ['대상 노드를 건너뛰도록 연결 변경', '이전 노드 또는 HEAD를 다음 노드에 연결한 뒤 대상 노드 제거', '삭제 시작', '위치 탐색 O(n) · 연결 변경 O(1)', '이전 노드의 위치를 찾는 과정 포함 · 맨 앞 삭제는 O(1)']
};
const player = new StepPlayer();
function playSteps() {
  player.stop();
  if (cursor >= steps.length - 1) return;
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
function draw(frame) {
  const snapshot = frame?.state || state;
  const ids = frame?.layout || LinkedListModel.order(snapshot);
  const positions = new Map(ids.map((id, i) => [id, {x: 115 + i * 165, y: 60}]));
  if (frame?.fresh) {
    const insertion = Number($('#list-index').value);
    positions.set(frame.fresh, {x: 115 + Math.min(insertion, ids.length) * 165, y: 205});
  }
  const width = Math.max(620, 285 + ids.length * 165);
  const svg = $('#list-diagram'); svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${width} ${frame?.fresh ? 325 : 200}`);
  svg.style.width = `${width}px`;
  svg.setAttribute('aria-label', `단일 연결 리스트 · HEAD ${snapshot.head ?? 'null'} · ${snapshot.nodes.map(n => `${n.id}: 값 ${n.value}, next ${n.next ?? 'null'}`).join(' · ')}`);
  const defs = svgElement('defs', {}), marker = svgElement('marker', {id: 'list-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'});
  marker.append(svgElement('path', {d: 'M 0 0 L 10 5 L 0 10 Z', fill: '#a58abd'}));defs.append(marker);svg.append(defs);
  const arrow = (x1,y1,x2,y2,curved=false) => svg.append(svgElement('path', {d: curved ? `M ${x1} ${y1} C ${x1+70} ${y1+65}, ${x2-70} ${y2+65}, ${x2} ${y2}` : `M ${x1} ${y1} L ${x2} ${y2}`, class:'list-edge', 'marker-end':'url(#list-arrow)'}));
  const nullX = 130 + ids.length * 165;
  svg.append(svgElement('text', {x: nullX, y: 105, class: 'list-null'}, 'null'));
  const head = positions.get(snapshot.head);
  svg.append(svgElement('text', {x: 20, y: 32, class: 'list-head'}, 'HEAD'));
  arrow(55,38, head ? head.x : nullX, head ? head.y + 10 : 90);
  snapshot.nodes.forEach(node => {
    const source = positions.get(node.id); if (!source) return;
    const target = positions.get(node.next);
    if (node.next !== null && target) {
      const crossRow = source.y !== target.y;
      arrow(source.x+111,source.y+37,target.x-6,target.y+37, crossRow || target.x > source.x+170);
    } else if (node.next === null) {
      if (source.y > 100) {
        arrow(source.x+111,source.y+37,source.x+140,source.y+37);
        svg.append(svgElement('text',{x:source.x+145,y:source.y+42,class:'list-null'},'null'));
      } else arrow(source.x+111,source.y+37,nullX-8,97);
    }
  });
  snapshot.nodes.forEach(node => {
    const p=positions.get(node.id);if(!p)return;
    const group=svgElement('g',{class:`list-node${frame?.active.includes(node.id)?' active':''}${frame?.detached===node.id?' detached':''}`});
    group.append(svgElement('rect',{x:p.x,y:p.y,width:110,height:74,rx:8}));
    group.append(svgElement('text',{x:p.x+55,y:p.y-10,class:'list-node-id'},node.id));
    group.append(svgElement('text',{x:p.x+55,y:p.y+30,class:'list-data'},node.value));
    group.append(svgElement('line',{x1:p.x,y1:p.y+43,x2:p.x+110,y2:p.y+43}));
    group.append(svgElement('text',{x:p.x+55,y:p.y+62,class:'list-next'},`next: ${node.next ?? 'null'}`));
    if(frame?.detached===node.id) group.append(svgElement('text',{x:p.x+55,y:p.y+98,class:'list-node-id'},'분리된 노드'));
    if(frame?.fresh===node.id) group.append(svgElement('text',{x:p.x+55,y:p.y+98,class:'list-node-id'},'새 노드'));
    svg.append(group);
  });
}
function render() {
  const frame = steps[cursor], locked = steps.length > 0 && cursor < steps.length-1;
  const size=LinkedListModel.order(frame?.state || state).length;
  draw(frame);
  $('#list-size').textContent=`연결된 노드 수 ${size}`;
  $('#array-code').textContent=frame?.code || `head → ${LinkedListModel.order(state).map(id=>state.nodes.find(n=>n.id===id).value).concat('null').join(' → ')}`;
  $('#array-message').textContent=frame?.message || (mode==='search'?'위치 입력 후 탐색 시작 · 2초 간격으로 next 참조를 따라 이동':'위치 설정 후 시작 · 2초 간격으로 참조 변경 자동 진행');
  $('.array-feedback').setAttribute('data-state',frame?.status || 'normal');
  $('#step-controls').hidden=!steps.length;
  $('#step-count').textContent=`${cursor+1} / ${steps.length}`;
  $('#step-prev').disabled = cursor === 0;
  $('#step-next').disabled = cursor >= steps.length - 1;
  $('#step-status').textContent = locked ? '자동 진행' : '진행 완료';
  const fill = document.createElement('span');
  fill.className = locked ? 'step-progress-fill running' : 'step-progress-fill complete';
  $('#step-progress').replaceChildren(fill);
  $('#step-progress').setAttribute('aria-label', locked ? '다음 단계까지 2초 · 자동 진행 중' : '모든 단계 진행 완료');
  $('#list-index').disabled=locked;$('#list-value').disabled=locked || mode!=='insert';
  $('#list-run').disabled=locked || (mode==='delete' && size===0);
  $('#list-index').min=0;
  if(mode==='search') $('#list-index').removeAttribute('max'); else $('#list-index').max=Math.max(0,mode==='insert'?size:size-1);
  $('#range-hint').textContent=locked?'단계 진행 중 · 탭 전환 시 미완료 연산 취소':mode==='search'?'위치는 0부터 시작 · 범위 밖은 null까지 순차 탐색':mode==='delete' && !size?'빈 목록 · 삽입 후 삭제 가능':`입력 가능한 위치 0–${mode==='insert'?size:size-1}`;
}
function changeMode(next) {
  settle();mode=next;
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
$('#list-form').addEventListener('submit',event=>{
  event.preventDefault();if(steps.length && cursor<steps.length-1)return;
  settle();
  try{steps=LinkedListModel.frames(state,mode,Number($('#list-index').value),Number($('#list-value').value));cursor=0;$('#list-error').textContent='';}
  catch(error){$('#list-error').textContent=error.message;}
  render(); playSteps();
});
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
$('#list-reset').addEventListener('click',()=>{state=LinkedListModel.create();steps=[];cursor=0;$('#list-value').value=99;changeMode(mode);});
changeMode('search');
