'use strict';
const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-mode]')];
const content = {
  peek: ['FRONT에서 가장 먼저 들어온 원소 조회', 'Peek는 맨 앞 원소를 제거하지 않고 값만 조회', 'Peek · 조회', 'Peek O(1)', 'FRONT의 값만 조회 · 원소와 참조 유지'],
  enqueue: ['REAR 뒤에 새 원소 삽입', '새 값을 큐의 뒤에 연결한 뒤 REAR를 새 원소로 변경', 'Enqueue · 삽입', 'Enqueue O(1)', 'FRONT·REAR 참조를 유지하는 연결 방식 · 뒤쪽에 새 원소 연결'],
  dequeue: ['FRONT의 원소를 꺼내고 제거', '가장 먼저 넣은 값을 반환한 뒤 FRONT를 다음 원소로 변경', 'Dequeue · 꺼내기', 'Dequeue O(1)', '가장 앞 원소만 제거 · 먼저 넣은 원소가 먼저 나오는 FIFO']
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
  if (!$('#queue-cells').children.length) $('#queue-cells').replaceChildren(...Array.from({length: QueueModel.capacity}, (_, index) => {
    const cell = document.createElement('div');
    cell.className = `queue-cell${index >= current.length ? ' empty' : ''}${frame?.active === index ? ' highlighted' : ''}`;
    const marker = document.createElement('span');marker.className = 'queue-marker';
    marker.textContent = current.length && index === 0 ? 'FRONT' : '';
    const block = document.createElement('span');block.className = 'cell-value';const label = document.createElement('span'); label.textContent = current[index] ?? '—'; block.append(label);
    const rear = document.createElement('span');rear.className = 'queue-marker';
    rear.textContent = current.length && index === current.length - 1 ? 'REAR' : '';
    cell.setAttribute('aria-label', `순서 ${index}: ${index < current.length ? current[index] : '빈칸'}${index === 0 && current.length ? ', FRONT' : ''}${index === current.length - 1 ? ', REAR' : ''}`);
    cell.append(marker, block, rear);return cell;
  }));
  [...$('#queue-cells').children].forEach((cell, index) => {
    cell.className = `queue-cell${index >= current.length ? ' empty' : ''}${frame?.active === index ? ' highlighted' : ''}`;
    cell.children[0].textContent = current.length && index === 0 ? 'FRONT' : '';
    cell.children[1].children[0].textContent = current[index] ?? '—';
    cell.children[2].textContent = current.length && index === current.length - 1 ? 'REAR' : '';
    cell.setAttribute('aria-label', `순서 ${index}: ${index < current.length ? current[index] : '빈칸'}${index === 0 && current.length ? ', FRONT' : ''}${index === current.length - 1 ? ', REAR' : ''}`);
  });
  $('#queue-front').textContent = current.length ? current[0] : 'null';
  $('#queue-rear').textContent = current.length ? current[current.length - 1] : 'null';
  $('#queue-size').textContent = `원소 수 ${current.length} / 용량 ${QueueModel.capacity}`;
  const transfer = $('#queue-transfer');
  if (!transfer.children.length) transfer.replaceChildren(document.createElement('span'));
  const transferLabel = transfer.children[0];
  transferLabel.textContent = frame?.status === 'error' ? frame.code.split(' → ')[1] : frame?.incoming !== undefined ? frame.incoming : frame?.returned !== undefined ? frame.returned : '—';
  transfer.setAttribute('aria-label', frame?.status === 'error' ? transferLabel.textContent : frame?.incoming !== undefined ? `넣을 값 ${frame.incoming}` : frame?.returned !== undefined ? `반환 값 ${frame.returned}` : '이동할 값 없음');
  if (frame && cursor === lastRenderedCursor + 1 && cursor > 0 && typeof transferLabel.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const previous = steps[cursor - 1];
    const inserting = mode === 'enqueue' && previous.incoming !== undefined && frame.incoming === undefined;
    const returning = mode !== 'enqueue' && frame.returned !== undefined && previous.returned === undefined;
    const index = inserting ? frame.active : previous.active;
    const cell = $('#queue-cells').children[index];
    if ((inserting || returning) && cell) {
      const from = (inserting ? transfer : cell.children[1]).getBoundingClientRect();
      const to = (inserting ? cell.children[1] : transfer).getBoundingClientRect();
      const moving = inserting ? cell.children[1].children[0] : transferLabel;
      valueAnimation = moving.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`, opacity: .5 }, { transform: 'translate(0, 0)', opacity: 1 }], {duration: 400, easing: 'ease-out'});
    }
  }
  updateTransferArrow();
  lastRenderedCursor = frame ? cursor : -1;
  $('#array-code').textContent = frame?.code || `queue = [${values.join(', ')}]`;
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
  $('#queue-value').disabled = locked || mode !== 'enqueue';
  $('#queue-run').textContent = locked ? '↺ 초기화' : steps.length ? '다시 시작' : '시작';
  $('#queue-run').type = locked ? 'button' : 'submit';
  $('#range-hint').textContent = locked ? '단계 진행 중 · 초기화 또는 탭 전환 시 미완료 연산 취소' : mode === 'enqueue' ? (current.length === QueueModel.capacity ? '가득 찬 큐 · 실행 시 용량 초과 표시' : '삽입 값 -999–999 · 정수') : !current.length ? '빈 큐 · 실행 시 Queue underflow 표시' : mode === 'dequeue' ? '가장 앞 원소 반환 후 제거' : '가장 앞 원소만 조회 · 데이터 유지';
}
function changeMode(next) {
  settle(); mode = next;
  tabs.forEach(tab => {const selected = tab.dataset.mode === mode;tab.setAttribute('aria-selected', String(selected));tab.tabIndex = selected ? 0 : -1;});
  $('#queue-panel').setAttribute('aria-labelledby', `tab-${mode}`);
  const [title, description, action, complexity, explanation] = content[mode];
  $('#concept-title').textContent = title;$('#concept-description').textContent = description;
  $('#complexity-title').textContent = complexity;$('#complexity-description').textContent = explanation;
  $('#queue-value-label').hidden = mode !== 'enqueue';$('#queue-value').required = mode === 'enqueue';
  $('#queue-error').textContent = '';render();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => changeMode(tab.dataset.mode));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (i + 1) % 3 : event.key === 'ArrowLeft' ? (i + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
    if (next !== null) {event.preventDefault();changeMode(tabs[next].dataset.mode);tabs[next].focus();}
  });
});
$('#queue-form').addEventListener('submit', event => {
  event.preventDefault();if (steps.length && cursor < steps.length - 1) return;
  settle();
  try {steps = QueueModel.frames(values, mode, Number($('#queue-value').value));$('#queue-error').textContent = '';}
  catch (error) {$('#queue-error').textContent = error.message;}
  render();playSteps();
});
function moveStep(offset) {
  const next = cursor + offset;
  if (!steps.length || next < 0 || next >= steps.length) return;
  cursor = next;render();playSteps();
}
$('#step-prev').addEventListener('click', () => moveStep(-1));
$('#step-next').addEventListener('click', () => moveStep(1));
$('#queue-form').addEventListener('invalid', () => {$('#queue-error').textContent = '값은 -999부터 999까지의 정수로 입력';}, true);
$('#queue-run').addEventListener('click', event => { if (steps.length && cursor < steps.length - 1) { event.preventDefault(); reset(); } });
function reset() {player.stop();values = [12,24,36];steps = [];cursor = 0;$('#queue-value').value = 99;changeMode(mode);}
changeMode('peek');


function updateTransferArrow() {
  const path = $('#queue-direction');
  const frame = steps[cursor];
  const inserting = mode === 'enqueue';
  const current = frame ? frame.values : values;
  const index = inserting ? Math.min(current.length - (frame && cursor === steps.length - 1 ? 1 : 0), 5) : 0;
  const cell = $('#queue-cells').children[index];
  const box = $('#queue-transfer');
  if (!cell || typeof box.getBoundingClientRect !== 'function') return;
  if (frame?.status === 'error' || (!inserting && !current.length && frame?.returned === undefined)) { path.setAttribute('d', ''); return; }
  const root = $('#queue-connector').getBoundingClientRect();
  const a = cell.children[1].getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const start = {x: a.right - root.left + 4, y: a.top + a.height / 2 - root.top};
  const end = {x: b.left - root.left - 4, y: b.top + b.height / 2 - root.top};
  start.x = a.left + a.width / 2 - root.left; start.y = a.bottom - root.top + 4; end.x = b.left + b.width / 2 - root.left; end.y = b.top - root.top - 4;
  const from = inserting ? end : start, to = inserting ? start : end;
  const mid = (from.y + to.y) / 2;
  path.setAttribute('d', `M ${from.x} ${from.y} C ${from.x} ${mid}, ${to.x} ${mid}, ${to.x} ${to.y}`);
}
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateTransferArrow);
  document.addEventListener('scroll', updateTransferArrow, true);
}
