'use strict';
const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-mode]')];
const content = {
  peek: ['TOP에서 가장 최근 원소 조회', 'Peek는 가장 위 원소를 제거하지 않고 값만 조회', 'Peek · 조회', 'Peek O(1)', 'TOP의 값만 조회 · 데이터와 TOP 유지'],
  push: ['TOP 위에 새 원소 삽입', '새 값을 스택 맨 위에 저장한 뒤 TOP을 새 원소로 이동', 'Push · 삽입', 'Push O(1)', '다른 원소 이동 없이 TOP 위에 저장 · 용량이 고정된 배열 기반 예시'],
  pop: ['TOP의 원소를 꺼내고 제거', '가장 최근에 넣은 값을 반환한 뒤 TOP을 바로 아래 원소로 이동', 'Pop · 꺼내기', 'Pop O(1)', '가장 위 원소만 제거 · 마지막에 넣은 원소가 먼저 나오는 LIFO']
};
let valueAnimation = null;
let lastRenderedCursor = -1;
let mode = 'peek', values = [12, 24, 36], steps = [], cursor = 0;
const player = new StepPlayer(1000);
function settle() {
  player.stop();
  if (steps.length && cursor === steps.length - 1) values = [...steps[cursor].values];
  steps = []; cursor = 0;
}
function playSteps() {
  player.stop();
  if (cursor >= steps.length - 1) return;
  player.play(() => { cursor++; render(); return cursor < steps.length - 1; });
}
function render() {
  valueAnimation?.cancel();
  valueAnimation = null;
  const frame = steps[cursor], current = frame ? frame.values : values;
  const locked = steps.length > 0 && cursor < steps.length - 1;
  if (!$('#stack-cells').children.length) $('#stack-cells').replaceChildren(...Array.from({length: StackModel.capacity}, (_, index) => {
    const row = document.createElement('div');
    row.className = `stack-slot${index >= current.length ? ' empty' : ''}${frame?.active === index ? ' highlighted' : ''}`;
    const top = document.createElement('span');top.className = 'stack-top-marker';
    top.textContent = current.length && index === current.length - 1 ? 'TOP →' : '';
    const block = document.createElement('span');block.className = 'stack-block';const label = document.createElement('span'); label.textContent = current[index] ?? '—'; block.append(label);
    const position = document.createElement('span');position.className = 'stack-position';position.textContent = index;
    row.setAttribute('aria-label', `위치 ${index}: ${index < current.length ? current[index] : '빈칸'}${index === current.length - 1 ? ', TOP' : ''}`);
    row.append(top, block, position);return row;
  }));
  [...$('#stack-cells').children].forEach((row, index) => {
    row.className = `stack-slot${index >= current.length ? ' empty' : ''}${frame?.active === index ? ' highlighted' : ''}`;
    row.children[0].textContent = current.length && index === current.length - 1 ? 'TOP →' : '';
    row.children[1].children[0].textContent = current[index] ?? '—';
    row.setAttribute('aria-label', `위치 ${index}: ${index < current.length ? current[index] : '빈칸'}${index === current.length - 1 ? ', TOP' : ''}`);
  });
  $('#stack-top').textContent = current.length - 1;
  $('#stack-size').textContent = `원소 수 ${current.length} / 용량 ${StackModel.capacity}`;
  const transfer = $('#stack-transfer');
  if (!transfer.children.length) transfer.replaceChildren(document.createElement('span'));
  const transferLabel = transfer.children[0];
  transferLabel.textContent = frame?.status === 'error' ? frame.code.split(' → ')[1] : frame?.incoming !== undefined ? frame.incoming : frame?.returned !== undefined ? frame.returned : '—';
  transfer.setAttribute('aria-label', frame?.status === 'error' ? transferLabel.textContent : frame?.incoming !== undefined ? `넣을 값 ${frame.incoming}` : frame?.returned !== undefined ? `반환 값 ${frame.returned}` : '이동할 값 없음');
  if (frame && cursor === lastRenderedCursor + 1 && cursor > 0 && typeof transferLabel.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const previous = steps[cursor - 1];
    const inserting = mode === 'push' && previous.incoming !== undefined && frame.incoming === undefined;
    const returning = mode !== 'push' && frame.returned !== undefined && previous.returned === undefined;
    const index = inserting ? frame.active : previous.active;
    const cell = $('#stack-cells').children[index];
    if ((inserting || returning) && cell) {
      const from = (inserting ? transfer : cell.children[1]).getBoundingClientRect();
      const to = (inserting ? cell.children[1] : transfer).getBoundingClientRect();
      const moving = inserting ? cell.children[1].children[0] : transferLabel;
      valueAnimation = moving.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`, opacity: .5 }, { transform: 'translate(0, 0)', opacity: 1 }], {duration: 400, easing: 'ease-out'});
    }
  }
  updateTransferArrow();
  lastRenderedCursor = frame ? cursor : -1;
  $('#array-code').textContent = frame?.code || `stack = [${values.join(', ')}]`;
  $('#array-message').textContent = frame?.message || '연산 시작 후 1초 간격 자동 진행 · 좌우 버튼으로 단계 이동 가능';
  $('.array-feedback').setAttribute('data-state', frame?.status || 'normal');
  $('#step-controls').hidden = !steps.length;
  $('#step-count').textContent = `${cursor + 1} / ${steps.length}`;
  $('#step-prev').disabled = cursor === 0;
  $('#step-next').disabled = cursor >= steps.length - 1;
  $('#step-status').textContent = locked ? '자동 진행' : frame?.status === 'error' ? '연산 중단' : '진행 완료';
  const fill = document.createElement('span');fill.className = locked ? 'step-progress-fill running' : 'step-progress-fill complete';
  $('#step-progress').replaceChildren(fill);
  $('#step-progress').setAttribute('aria-label', locked ? '다음 단계까지 1초 · 자동 진행 중' : '진행 종료');
  $('#stack-value').disabled = locked || mode !== 'push';
  $('#stack-run').textContent = locked ? '↺ 초기화' : steps.length ? '다시 시작' : '시작';
  $('#stack-run').type = locked ? 'button' : 'submit';
  $('#range-hint').textContent = locked ? '단계 진행 중 · 초기화 또는 탭 전환 시 미완료 연산 취소' : mode === 'push' ? (current.length === StackModel.capacity ? '가득 찬 스택 · 실행 시 용량 초과 표시' : '삽입 값 -999–999 · 정수') : !current.length ? '빈 스택 · 실행 시 Stack underflow 표시' : mode === 'pop' ? '가장 위 원소 반환 후 제거' : '가장 위 원소만 조회 · 데이터 유지';
}
function changeMode(next) {
  settle(); mode = next;
  tabs.forEach(tab => {const selected = tab.dataset.mode === mode;tab.setAttribute('aria-selected', String(selected));tab.tabIndex = selected ? 0 : -1;});
  $('#stack-panel').setAttribute('aria-labelledby', `tab-${mode}`);
  const [title, description, action, complexity, explanation] = content[mode];
  $('#concept-title').textContent = title;$('#concept-description').textContent = description;
  $('#complexity-title').textContent = complexity;$('#complexity-description').textContent = explanation;
  $('#stack-value-label').hidden = mode !== 'push';$('#stack-value').required = mode === 'push';
  $('#stack-error').textContent = '';render();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => changeMode(tab.dataset.mode));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (i + 1) % 3 : event.key === 'ArrowLeft' ? (i + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
    if (next !== null) {event.preventDefault();changeMode(tabs[next].dataset.mode);tabs[next].focus();}
  });
});
$('#stack-form').addEventListener('submit', event => {
  event.preventDefault();if (steps.length && cursor < steps.length - 1) return;
  settle();
  try {steps = StackModel.frames(values, mode, Number($('#stack-value').value));$('#stack-error').textContent = '';}
  catch (error) {$('#stack-error').textContent = error.message;}
  render();playSteps();
});
function moveStep(offset) {
  const next = cursor + offset;
  if (!steps.length || next < 0 || next >= steps.length) return;
  cursor = next;render();playSteps();
}
$('#step-prev').addEventListener('click', () => moveStep(-1));
$('#step-next').addEventListener('click', () => moveStep(1));
$('#stack-form').addEventListener('invalid', () => {$('#stack-error').textContent = '값은 -999부터 999까지의 정수로 입력';}, true);
$('#stack-run').addEventListener('click', event => { if (steps.length && cursor < steps.length - 1) { event.preventDefault(); reset(); } });
function reset() {player.stop();values = [12,24,36];steps = [];cursor = 0;$('#stack-value').value = 99;changeMode(mode);}
changeMode('peek');


function updateTransferArrow() {
  const path = $('#stack-direction');
  const frame = steps[cursor];
  const inserting = mode === 'push';
  const current = frame ? frame.values : values;
  const index = inserting ? Math.min(current.length - (frame && cursor === steps.length - 1 ? 1 : 0), 5) : mode === 'pop' && frame?.returned !== undefined ? steps[0].active : Math.max(0, current.length - 1);
  const cell = $('#stack-cells').children[index];
  const box = $('#stack-transfer');
  if (!cell || typeof box.getBoundingClientRect !== 'function') return;
  if (frame?.status === 'error' || (!inserting && !current.length && frame?.returned === undefined)) { path.setAttribute('d', ''); return; }
  const root = $('#stack-connector').getBoundingClientRect();
  const a = cell.children[1].getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const start = {x: a.right - root.left + 4, y: a.top + a.height / 2 - root.top};
  const end = {x: b.left - root.left - 4, y: b.top + b.height / 2 - root.top};
  
  const from = inserting ? end : start, to = inserting ? start : end;
  const mid = (from.x + to.x) / 2;
  path.setAttribute('d', `M ${from.x} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`);
}
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateTransferArrow);
  document.addEventListener('scroll', updateTransferArrow, true);
}
