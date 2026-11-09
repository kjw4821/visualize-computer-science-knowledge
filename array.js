'use strict';
const $ = selector => document.querySelector(selector);
const player = new StepPlayer(1000);
let steps = [];
let cursor = 0;
let mode = 'structure';
let dimension = 2;
const tabs = [...document.querySelectorAll('[data-mode]')];
function playbackInterval() {
  return mode === 'multi' ? (dimension === 2 ? 500 : 300) : 1000;
}
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
function render() {
  const frame = steps[cursor];
  const locked = !!frame && cursor < steps.length - 1;
  $('#array-memory').hidden = mode !== 'structure' || !frame;
  $('#multi-memory').hidden = mode !== 'multi' || !frame;
  if (mode === 'multi') renderMultidimensional(frame);
  $('#array-placeholder').hidden = !!frame;
  $('#array-cells').replaceChildren(...(frame && mode === 'structure' ? frame.cells : []).map((value, i) => {
    const cell = document.createElement('div');
    cell.className = `array-cell${value === null ? ' empty' : ''}${frame.active.includes(i) ? ' highlighted' : ''}`;
    const valueBox = document.createElement('span');
    valueBox.className = 'cell-value'; valueBox.textContent = value === null ? '?' : value;
    const indexBox = document.createElement('span');
    indexBox.className = 'cell-index'; indexBox.textContent = `arr[${i}]`;
    cell.setAttribute('aria-label', `인덱스 ${i}: ${value === null ? '미정 값' : value}`);
    cell.append(valueBox, indexBox);
    return cell;
  }));
  const error = frame?.state === 'error';
  const active = frame?.active[0];
  $('#array-pointer').hidden = active === undefined;
  $('#array-pointer').textContent = `i = ${active ?? 0}`;
  $('#array-pointer').style.left = `${((active ?? 0) + 0.5) * 20}%`;
  $('#array-outside-pointer').hidden = !error;
  $('#array-outside').className = `array-outside${error ? ' outside-active' : ''}`;
  const total = mode === 'multi' ? MultidimensionalArrayModel.shape(dimension).reduce((a, b) => a * b, 1) : 5;
  $('#array-size').textContent = mode === 'multi' ? (frame ? `값 대입 ${frame.cells.filter(v => v !== null).length} / ${total}` : `선언 전 · 원소 ${total}개`) : frame ? `크기 n = 5 · 값 대입 ${frame.cells.filter(v => v !== null).length} / 5` : '선언 전 · 크기 n = 5';
  $('#array-code').textContent = frame ? frame.code : 'int arr[5];';
  $('#array-message').textContent = frame ? frame.message : '시작 대기';
  $('.array-feedback').hidden = !frame;
  $('.array-feedback').setAttribute('data-state', frame?.state || 'normal');
  $('#array-reset').textContent = !frame ? '시작' : locked ? '↺ 초기화' : '다시 시작';
  $('#step-controls').hidden = !frame;
  $('#step-count').textContent = frame ? `${cursor + 1} / ${steps.length}` : '';
  $('#step-prev').disabled = !frame || cursor === 0;
  $('#step-next').disabled = !locked;
  $('#step-status').textContent = locked ? '자동 진행' : '진행 완료';
  const fill = document.createElement('span');
  fill.className = locked ? 'step-progress-fill running' : 'step-progress-fill complete';
  fill.style.animationDuration = `${playbackInterval()}ms`;
  $('#step-progress').replaceChildren(fill);
  $('#step-progress').setAttribute('aria-label', locked ? `다음 단계까지 ${playbackInterval() / 1000}초 · 자동 진행 중` : '모든 단계 진행 완료');
}
function moveStep(offset) {
  const next = cursor + offset;
  if (!steps.length || next < 0 || next >= steps.length) return;
  cursor = next; render(); playSteps();
}
$('#step-prev').addEventListener('click', () => moveStep(-1));
$('#step-next').addEventListener('click', () => moveStep(1));
$('#array-reset').addEventListener('click', () => {
  player.stop();
  if (steps.length && cursor < steps.length - 1) {
    steps = []; cursor = 0; render();
    return;
  }
  steps = mode === 'multi' ? MultidimensionalArrayModel.frames(dimension) : ArrayModel.frames(); cursor = 0;
  render(); playSteps();
});
function renderMultidimensional(frame) {
  const dimensions = MultidimensionalArrayModel.shape(dimension);
  const layers = dimension === 3 ? dimensions[0] : 1;
  const rows = dimensions[dimensions.length - 2];
  const columns = dimensions[dimensions.length - 1];
  $('#multi-spatial').className = `multi-spatial${dimension === 3 ? ' three-dimensional' : ''}`;
  const tables = [];
  for (let layer = 0; layer < layers; layer++) {
    const table = document.createElement('table');
    table.className = 'multi-plane';
    const caption = document.createElement('caption');
    caption.textContent = dimension === 3 ? `arr[${layer}] · 층 ${layer}` : 'arr · 행 × 열';
    table.append(caption);
    const head = document.createElement('tr');
    const corner = document.createElement('th'); corner.textContent = '행 / 열'; head.append(corner);
    for (let column = 0; column < columns; column++) {
      const th = document.createElement('th'); th.textContent = column; th.setAttribute('scope', 'col'); head.append(th);
    }
    table.append(head);
    for (let row = 0; row < rows; row++) {
      const tr = document.createElement('tr');
      const th = document.createElement('th'); th.textContent = row; th.setAttribute('scope', 'row'); tr.append(th);
      for (let column = 0; column < columns; column++) {
        const index = (layer * rows + row) * columns + column;
        const td = document.createElement('td');
        td.className = `multi-value${frame?.active.includes(index) ? ' active' : ''}${frame?.cells[index] === null ? ' uninitialized' : ''}`;
        td.textContent = frame?.cells[index] ?? '?';
        td.setAttribute('aria-label', `${MultidimensionalArrayModel.expression(MultidimensionalArrayModel.coordinates(index, dimensions))}: ${frame?.cells[index] ?? '미정 값'}`);
        tr.append(td);
      }
      table.append(tr);
    }
    tables.push(table);
  }
  $('#multi-spatial').replaceChildren(...tables);
  $('#multi-formula').textContent = dimension === 2 ? '위치 = i × 4 + j' : '위치 = (i × 3 + j) × 4 + k';
  $('#multi-linear').replaceChildren(...(frame?.cells ?? []).map((value, index) => {
    const cell = document.createElement('div');
    cell.className = `multi-linear-cell${frame.active.includes(index) ? ' active' : ''}`;
    const location = document.createElement('span'); location.textContent = index;
    const data = document.createElement('strong'); data.textContent = value ?? '?';
    const label = document.createElement('small');
    label.textContent = MultidimensionalArrayModel.coordinates(index, dimensions).map(i => `[${i}]`).join('');
    cell.append(location, data, label); return cell;
  }));
}
function changeMode(next) {
  player.stop(); steps = []; cursor = 0; mode = next;
  tabs.forEach(tab => {
    const selected = tab.dataset.mode === mode;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
  });
  $('#array-panel').setAttribute('aria-labelledby', `tab-${mode}`);
  $('#dimension-controls').hidden = mode !== 'multi';
  $('#concept-title').textContent = mode === 'multi' ? '02 · 다차원 배열' : '01 · 배열의 구조와 접근';
  const dimensions = mode === 'multi' ? MultidimensionalArrayModel.shape(dimension) : [5];
  $('#array-declaration-code').textContent = `int arr${dimensions.map(n => `[${n}]`).join('')};`;
  $('#array-declaration-description').textContent = mode === 'multi'
    ? (dimension === 2 ? '3행 × 4열 · i: 0–2, j: 0–3' : '2층 × 3행 × 4열 · i: 0–1, j: 0–2, k: 0–3')
    : '원소 5개 · 유효 인덱스 0–4';
  render();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => changeMode(tab.dataset.mode));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); changeMode(tabs[next].dataset.mode); tabs[next].focus(); }
  });
});
$('#array-dimension').addEventListener('change', () => {
  dimension = Number($('#array-dimension').value);
  changeMode('multi');
});
changeMode('structure');
