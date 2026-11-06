'use strict';
const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-mode]')];
const content = {
  access: ['인덱스로 원소에 접근', '인덱스는 원소의 위치를 나타내며 0부터 시작', '접근', '접근 O(1)', '인덱스로 위치를 계산해 바로 접근'],
  insert: ['공간을 확보한 뒤 새 원소 삽입', '삽입 위치부터 뒤쪽 원소를 오른쪽으로 이동 · 마지막 원소부터 진행', '삽입 시작', '중간 삽입 O(n)', '순서를 유지하기 위해 뒤쪽 원소 이동 · 끝에 삽입하는 경우 O(1)'],
  delete: ['원소를 제거한 뒤 빈자리 채우기', '삭제 위치의 뒤쪽 원소를 왼쪽으로 이동 · 인덱스는 고정', '삭제 시작', '중간 삭제 O(n)', '순서를 유지하기 위해 뒤쪽 원소 이동 · 끝에서 삭제하는 경우 O(1)']
};
let mode = 'access';
let values = [12, 24, 36, 48];
let steps = []; let cursor = 0;
function settle() {
  // Completed operations persist; switching tabs cancels an unfinished preview.
  if (steps.length && cursor === steps.length - 1) values = steps[cursor].cells.filter(v => v !== null);
  steps = []; cursor = 0;
}
function render() {
  const frame = steps[cursor];
  const cells = frame ? frame.cells : Array.from({length: 6}, (_, i) => values[i] ?? null);
  const locked = steps.length > 0 && cursor < steps.length - 1;
  $('#array-cells').replaceChildren(...cells.map((value, i) => {
    const cell = document.createElement('div');
    cell.className = `array-cell${value === null ? ' empty' : ''}${frame?.active.includes(i) ? ' highlighted' : ''}`;
    const valueBox = document.createElement('span'); valueBox.className = 'cell-value'; valueBox.textContent = value ?? '—';
    const indexBox = document.createElement('span'); indexBox.className = 'cell-index'; indexBox.textContent = i;
    cell.setAttribute('aria-label', `인덱스 ${i}: ${value === null ? '빈칸' : value}`);
    cell.append(valueBox, indexBox); return cell;
  }));
  const count = frame ? frame.count : values.length;
  $('#array-size').textContent = `원소 수 ${count} / 용량 6`;
  $('#array-code').textContent = frame ? frame.code : `arr = [${values.join(', ')}]`;
  $('#array-message').textContent = frame ? frame.message : (mode === 'access' ? '인덱스를 입력하면 해당 위치의 원소를 강조' : '위치와 값을 설정한 뒤 시작 · 다음 단계로 원소 이동 확인');
  $('#step-controls').hidden = !steps.length || mode === 'access';
  $('#step-count').textContent = `${cursor + 1} / ${steps.length}`;
  $('#step-prev').disabled = cursor === 0;
  $('#step-next').disabled = cursor >= steps.length - 1;
  $('#array-index').disabled = locked; $('#array-value').disabled = locked;
  const size = frame && !locked ? count : values.length;
  const max = mode === 'insert' ? size : size - 1;
  const unavailable = mode === 'insert' ? size === 6 : mode === 'delete' && size === 0;
  $('#array-run').disabled = locked || unavailable;
  if (mode === 'access') {
    $('#array-index').removeAttribute('min');
    $('#array-index').removeAttribute('max');
  } else {
    $('#array-index').min = 0;
    $('#array-index').max = Math.max(0, max);
  }
  $('.array-feedback').setAttribute('data-state', frame?.state || 'normal');
  $('#range-hint').textContent = mode === 'access' ? `저장된 원소 ${size ? `0–${size - 1}` : '없음'} · 용량 범위 0–5 · 범위 밖 인덱스도 입력 가능` : locked ? '단계 진행 중 · 초기화 또는 탭 전환 시 미완료 연산 취소' : unavailable ? (mode === 'insert' ? '배열 용량 초과 · 삭제 후 삽입 가능' : '빈 배열 · 삽입 후 접근 및 삭제 가능') : `입력 가능한 인덱스 0–${max}`;
}
function changeMode(next) {
  settle(); mode = next;
  tabs.forEach(tab => { const selected = tab.dataset.mode === mode; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
  $('#array-panel').setAttribute('aria-labelledby', `tab-${mode}`);
  const [title, description, action, complexity, explanation] = content[mode];
  $('#concept-title').textContent = title; $('#concept-description').textContent = description;
  $('#array-run').textContent = action; $('#complexity-title').textContent = complexity; $('#complexity-description').textContent = explanation;
  $('#array-value-label').hidden = mode !== 'insert'; $('#array-value').required = mode === 'insert';
  $('#array-index').value = mode === 'access' ? Math.min(2, Math.max(0, values.length - 1)) : 0;
  $('#array-error').textContent = ''; render();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => changeMode(tab.dataset.mode));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); changeMode(tabs[next].dataset.mode); tabs[next].focus(); }
  });
});
$('#array-form').addEventListener('submit', event => {
  event.preventDefault();
  if (steps.length && cursor < steps.length - 1) return;
  settle();
  try {
    steps = ArrayModel.frames(values, mode, Number($('#array-index').value), Number($('#array-value').value)); cursor = 0;
    $('#array-error').textContent = ''; render();
  } catch (error) { $('#array-error').textContent = error.message; render(); }
});
$('#step-prev').addEventListener('click', () => { if (cursor > 0) { cursor--; render(); } });
$('#step-next').addEventListener('click', () => { if (cursor < steps.length - 1) { cursor++; render(); } });
$('#array-reset').addEventListener('click', () => { values = [12, 24, 36, 48]; steps = []; cursor = 0; $('#array-value').value = 99; changeMode(mode); });
// Custom messages stay beside the controls, including native numeric constraint failures.
$('#array-form').addEventListener('invalid', event => {
  $('#array-error').textContent = event.target === $('#array-index') ? (mode === 'access' ? '인덱스는 정수로 입력' : `인덱스는 0부터 ${$('#array-index').max}까지의 정수`) : '삽입 값은 -999부터 999까지의 정수';
}, true);
changeMode('access');
