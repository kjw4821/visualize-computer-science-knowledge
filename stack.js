'use strict';
const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-mode]')];
const content = {
  peek: ['TOP에서 가장 최근 원소 조회', 'Peek는 가장 위 원소를 제거하지 않고 값만 조회', 'Peek · 조회', 'Peek O(1)', 'TOP의 값만 조회 · 데이터와 TOP 유지'],
  push: ['TOP 위에 새 원소 삽입', '새 값을 스택 맨 위에 저장한 뒤 TOP을 새 원소로 이동', 'Push · 삽입', 'Push O(1)', '다른 원소 이동 없이 TOP 위에 저장 · 용량이 고정된 배열 기반 예시'],
  pop: ['TOP의 원소를 꺼내고 제거', '가장 최근에 넣은 값을 반환한 뒤 TOP을 바로 아래 원소로 이동', 'Pop · 꺼내기', 'Pop O(1)', '가장 위 원소만 제거 · 마지막에 넣은 원소가 먼저 나오는 LIFO']
};
let mode = 'peek', values = [12, 24, 36], steps = [], cursor = 0;
const player = new StepPlayer();
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
  const frame = steps[cursor], current = frame ? frame.values : values;
  const locked = steps.length > 0 && cursor < steps.length - 1;
  $('#stack-cells').replaceChildren(...Array.from({length: StackModel.capacity}, (_, index) => {
    const row = document.createElement('div');
    row.className = `stack-slot${index >= current.length ? ' empty' : ''}${frame?.active === index ? ' highlighted' : ''}`;
    const top = document.createElement('span');top.className = 'stack-top-marker';
    top.textContent = current.length && index === current.length - 1 ? 'TOP →' : '';
    const block = document.createElement('span');block.className = 'stack-block';block.textContent = current[index] ?? '—';
    const position = document.createElement('span');position.className = 'stack-position';position.textContent = index;
    row.setAttribute('aria-label', `위치 ${index}: ${index < current.length ? current[index] : '빈칸'}${index === current.length - 1 ? ', TOP' : ''}`);
    row.append(top, block, position);return row;
  }));
  $('#stack-top').textContent = current.length - 1;
  $('#stack-size').textContent = `원소 수 ${current.length} / 용량 ${StackModel.capacity}`;
  $('#stack-transfer').textContent = frame?.incoming !== undefined ? `넣을 값 → ${frame.incoming}` : frame?.returned !== undefined ? `${mode === 'pop' ? '꺼낸 값' : '조회 값'} → ${frame.returned}` : mode === 'push' ? 'Push · 맨 위에 삽입' : mode === 'pop' ? 'Pop · 맨 위에서 제거' : 'Peek · 데이터 유지';
  $('#array-code').textContent = frame?.code || `stack = [${values.join(', ')}]`;
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
  $('#stack-value').disabled = locked || mode !== 'push';
  $('#stack-run').disabled = locked;
  $('#range-hint').textContent = locked ? '단계 진행 중 · 초기화 또는 탭 전환 시 미완료 연산 취소' : mode === 'push' ? (current.length === StackModel.capacity ? '가득 찬 스택 · 실행 시 용량 초과 표시' : '삽입 값 -999–999 · 정수') : !current.length ? '빈 스택 · 실행 시 Stack underflow 표시' : mode === 'pop' ? '가장 위 원소 반환 후 제거' : '가장 위 원소만 조회 · 데이터 유지';
}
function changeMode(next) {
  settle(); mode = next;
  tabs.forEach(tab => {const selected = tab.dataset.mode === mode;tab.setAttribute('aria-selected', String(selected));tab.tabIndex = selected ? 0 : -1;});
  $('#stack-panel').setAttribute('aria-labelledby', `tab-${mode}`);
  const [title, description, action, complexity, explanation] = content[mode];
  $('#concept-title').textContent = title;$('#concept-description').textContent = description;
  $('#stack-run').textContent = action;$('#complexity-title').textContent = complexity;$('#complexity-description').textContent = explanation;
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
$('#stack-reset').addEventListener('click', () => {values = [12,24,36];steps = [];cursor = 0;$('#stack-value').value = 99;changeMode(mode);});
changeMode('peek');
