'use strict';
const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-mode]')];
const content = {
  search: ['루트부터 값을 비교하며 탐색', '작으면 왼쪽, 크면 오른쪽 자식으로 이동 · 일치하거나 null에 도달할 때까지 비교', '탐색 시작', '탐색 O(h)', '트리 높이 h에 비례 · 균형이 좋으면 O(log n), 편향되면 O(n)'],
  insert: ['비교를 따라 빈 자식 위치에 삽입', '루트부터 대소 비교 · null에 도달하면 새 노드 연결', '삽입 시작', '삽입 O(h)', '삽입 위치까지 탐색 후 연결 · 자동 균형 조정이 없는 BST'],
  delete: ['자식 수에 따라 연결을 바꾸며 삭제', '자식 0개는 제거, 1개는 자식 연결, 2개는 오른쪽 서브트리의 최솟값으로 대체', '삭제 시작', '삭제 O(h)', '대상 탐색과 후속자 탐색에 높이 h만큼 이동 · 최악의 경우 O(n)']
};
let mode = 'search', state = TreeModel.create(), steps = [], cursor = 0;
const player = new StepPlayer();
function settle() {
  player.stop();
  if (steps.length && cursor === steps.length - 1) state = TreeModel.clone(steps[cursor].state);
  steps = []; cursor = 0;
}
function playSteps() {
  player.stop();
  if (cursor >= steps.length - 1) return;
  player.play(() => { cursor++; render(); return cursor < steps.length - 1; });
}
function svgElement(tag, attributes, text) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  if (text !== undefined) element.textContent = text;
  return element;
}
function draw(frame) {
  const current = frame?.state || state, byId = new Map(current.nodes.map(n => [n.id, n]));
  const positions = new Map();let rank = 0, height = -1;
  function place(id, depth) {
    if (id === null) return;
    const node = byId.get(id);place(node.left, depth + 1);
    positions.set(id, {x: 55 + rank++ * 70, y: 65 + depth * 100});height = Math.max(height, depth);
    place(node.right, depth + 1);
  }
  place(current.root, 0);
  const width = Math.max(560, 110 + Math.max(0, rank - 1) * 70), svg = $('#tree-diagram');
  svg.replaceChildren();svg.setAttribute('viewBox', `0 0 ${width} ${Math.max(180, 130 + height * 100)}`);svg.style.width = `${width}px`;
  svg.setAttribute('aria-label', current.nodes.length ? `이진 탐색 트리 · 루트 ${byId.get(current.root).value} · ${current.nodes.map(n => `값 ${n.value}: 왼쪽 ${byId.get(n.left)?.value ?? 'null'}, 오른쪽 ${byId.get(n.right)?.value ?? 'null'}`).join(' · ')}` : '빈 트리 · root = null');
  if (!current.nodes.length) svg.append(svgElement('text', {x: width/2, y: 85, class:'tree-empty'}, 'root → null'));
  current.nodes.forEach(n => {
    const p = positions.get(n.id);
    for (const side of ['left','right']) {
      if (!n[side]) continue;
      const child = positions.get(n[side]), dx = child.x-p.x, dy = child.y-p.y, length = Math.hypot(dx,dy);
      svg.append(svgElement('line', {x1:p.x+dx/length*23, y1:p.y+dy/length*23, x2:child.x-dx/length*23, y2:child.y-dy/length*23, class:'tree-edge'}));
      svg.append(svgElement('text', {x:(p.x+child.x)/2+(side==='left'?-9:9), y:(p.y+child.y)/2, class:'tree-side'}, side==='left'?'L':'R'));
    }
  });
  current.nodes.forEach(n => {
    const p = positions.get(n.id), active = frame?.active.includes(n.id), visited = frame?.visited.includes(n.id);
    const group = svgElement('g', {class:`tree-node${visited?' visited':''}${active?' active':''}`});
    group.append(svgElement('circle', {cx:p.x,cy:p.y,r:23}));
    group.append(svgElement('text', {x:p.x,y:p.y+5,class:'tree-data'}, n.value));
    if(n.id===current.root)group.append(svgElement('text', {x:p.x,y:p.y-34,class:'tree-role'}, 'ROOT'));
    if(!n.left && !n.right)group.append(svgElement('text', {x:p.x,y:p.y+42,class:'tree-role'}, 'LEAF'));
    svg.append(group);
  });
  $('#tree-size').textContent = `노드 수 ${current.nodes.length} / 학습용 최대 15개`;
  $('#tree-summary').textContent = `루트 ${byId.get(current.root)?.value ?? 'null'} · 리프 ${current.nodes.filter(n=>!n.left&&!n.right).length}개 · 높이 ${height}`;
}
function render() {
  const frame = steps[cursor];
  const locked = steps.length > 0 && cursor < steps.length - 1;
  draw(frame);
  $('#array-code').textContent = frame?.code || `root = ${state.nodes.find(n=>n.id===state.root)?.value ?? 'null'}`;
  $('#array-message').textContent = frame?.message || '연산 시작 후 2초 간격 자동 진행 · 좌우 버튼으로 단계 이동 가능';
  $('.array-feedback').setAttribute('data-state', frame?.status || 'normal');
  $('#step-controls').hidden = !steps.length;
  $('#step-count').textContent = `${cursor + 1} / ${steps.length}`;
  $('#step-prev').disabled = cursor === 0;
  $('#step-next').disabled = cursor >= steps.length - 1;
  $('#step-status').textContent = locked ? '자동 진행' : frame?.status === 'error' ? '연산 중단' : '진행 완료';
  const fill = document.createElement('span');fill.className = locked ? 'step-progress-fill running' : 'step-progress-fill complete';
  $('#step-progress').replaceChildren(fill);
  $('#step-progress').setAttribute('aria-label', locked ? '다음 단계까지 2초 · 자동 진행 중' : '진행 종료');
  $('#tree-value').disabled = locked;
  $('#tree-run').disabled = locked;
  $('#range-hint').textContent = locked ? '단계 진행 중 · 초기화 또는 탭 전환 시 미완료 연산 취소' : '입력 값 -999–999 · 정수 · 중복 값 삽입 불가';
}
function changeMode(next) {
  settle(); mode = next;
  tabs.forEach(tab => {const selected = tab.dataset.mode === mode;tab.setAttribute('aria-selected', String(selected));tab.tabIndex = selected ? 0 : -1;});
  $('#tree-panel').setAttribute('aria-labelledby', `tab-${mode}`);
  const [title, description, action, complexity, explanation] = content[mode];
  $('#concept-title').textContent = title;$('#concept-description').textContent = description;
  $('#tree-run').textContent = action;$('#complexity-title').textContent = complexity;$('#complexity-description').textContent = explanation;
  $('#tree-value').required = true;
  $('#tree-error').textContent = '';render();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => changeMode(tab.dataset.mode));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (i + 1) % 3 : event.key === 'ArrowLeft' ? (i + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
    if (next !== null) {event.preventDefault();changeMode(tabs[next].dataset.mode);tabs[next].focus();}
  });
});
$('#tree-form').addEventListener('submit', event => {
  event.preventDefault();if (steps.length && cursor < steps.length - 1) return;
  settle();
  try {steps = TreeModel.frames(state, mode, Number($('#tree-value').value));$('#tree-error').textContent = '';}
  catch (error) {$('#tree-error').textContent = error.message;}
  render();playSteps();
});
function moveStep(offset) {
  const next = cursor + offset;
  if (!steps.length || next < 0 || next >= steps.length) return;
  cursor = next;render();playSteps();
}
$('#step-prev').addEventListener('click', () => moveStep(-1));
$('#step-next').addEventListener('click', () => moveStep(1));
$('#tree-form').addEventListener('invalid', () => {$('#tree-error').textContent = '값은 -999부터 999까지의 정수로 입력';}, true);
$('#tree-reset').addEventListener('click', () => {state = TreeModel.create();steps = [];cursor = 0;$('#tree-value').value = 30;changeMode(mode);});
changeMode('search');
