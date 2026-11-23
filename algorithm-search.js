'use strict';

const graphPositions = {
  A: [110, 46], B: [55, 102], C: [170, 102],
  D: [55, 155], E: [170, 155], F: [275, 102], G: [382, 46],
};
const graphEdges = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'E'], ['C', 'F']];
const graphNeighbors = Object.fromEntries(Object.keys(graphPositions).map(node => [node, []]));
for (const [left, right] of graphEdges) {
  graphNeighbors[left].push(right);
  graphNeighbors[right].push(left);
}
Object.values(graphNeighbors).forEach(neighbors => neighbors.sort());

function binarySearchSteps(values, target) {
  const steps = [];
  let low = 0;
  let high = values.length - 1;
  let comparisons = 0;
  function record(code, message, mid = null, found = null) {
    steps.push({ low, high, comparisons, mid, found, code, message });
  }
  record('low = 0; high = length - 1', '배열 전체를 후보 구간으로 설정');
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    comparisons++;
    record('mid = low + floor((high - low) / 2)', `인덱스 ${mid}의 값 ${values[mid]}과 찾을 값 ${target} 비교`, mid);
    if (values[mid] === target) {
      record('return mid', `인덱스 ${mid}에서 ${target} 발견`, mid, mid);
      return steps;
    }
    if (values[mid] < target) {
      low = mid + 1;
      record('low = mid + 1', `${values[mid]} < ${target} · 가운데 칸과 왼쪽 구간 제외`);
    } else {
      high = mid - 1;
      record('high = mid - 1', `${values[mid]} > ${target} · 가운데 칸과 오른쪽 구간 제외`);
    }
  }
  record('return -1', `후보 구간이 비어 ${target}을 찾지 못함`);
  return steps;
}

function graphSearchSteps(start, depthFirst) {
  const steps = [];
  const discovered = new Set([start]);
  const pending = [start];
  const order = [];
  function record(code, message, current = null) {
    steps.push({ code, message, current, pending: [...pending], order: [...order] });
  }
  function visit(node) {
    order.push(node);
    record('visit(node)', `${node} 방문 · 이웃을 이름순으로 확인`, node);
    for (const neighbor of graphNeighbors[node]) {
      if (discovered.has(neighbor)) continue;
      discovered.add(neighbor);
      pending.push(neighbor);
      record('dfs(neighbor)', `${node}에서 ${neighbor}(으)로 내려감`, neighbor);
      visit(neighbor);
    }
    pending.pop();
    const parent = pending.at(-1);
    record('return', parent ? `${node}의 호출을 마치고 ${parent}(으)로 돌아감` : `${node}의 호출 종료`, parent);
  }
  if (depthFirst) {
    record('dfs(start)', `시작 정점 ${start}의 호출을 스택에 추가`, start);
    visit(start);
  } else {
    record('queue.enqueue(start)', `시작 정점 ${start}을 큐에 추가하고 발견 처리`);
    while (pending.length) {
      const node = pending.shift();
      order.push(node);
      record('node = queue.dequeue()', `큐 앞의 ${node} 방문 · 이웃을 이름순으로 확인`, node);
      for (const neighbor of graphNeighbors[node]) {
        if (discovered.has(neighbor)) continue;
        discovered.add(neighbor);
        pending.push(neighbor);
        record('queue.enqueue(neighbor)', `${node}의 이웃 ${neighbor}을 큐에 추가하고 발견 처리`, node);
      }
    }
  }
  record('return order', `탐색 완료 · 방문 순서 ${order.join(' → ')}`);
  return steps;
}

function randomSortedValues(count) {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 99)).sort((a, b) => a - b);
}

function mountSearchLesson() {
  const find = name => document.getElementById(`search-${name}`);
  const player = new StepPlayer(1000);
  const form = find('form');
  const size = find('size');
  const targetField = find('target');
  const start = find('start');
  const auto = find('auto');
  const graph = find('graph');
  const worklist = find('worklist');
  const worklistItems = find('worklist-items');
  const array = find('array');
  const run = find('run');
  const progress = find('progress');
  const nodes = {};
  const worklistSlots = [];
  let topic = 'tab-0';
  let index = -1;
  let steps = [];
  let values = [];
  let cells = [];

  function svgElement(tag, attributes, label = '') {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (label) element.textContent = label;
    return element;
  }
  for (const [left, right] of graphEdges) {
    const [x1, y1] = graphPositions[left];
    const [x2, y2] = graphPositions[right];
    graph.append(svgElement('line', { x1, y1, x2, y2 }));
  }
  for (const [node, [x, y]] of Object.entries(graphPositions)) {
    const option = document.createElement('option');
    option.value = option.textContent = node;
    start.append(option);
    const group = svgElement('g', { transform: `translate(${x} ${y})` });
    group.append(svgElement('circle', { r: 19 }), svgElement('text', {}, node));
    graph.append(group);
    nodes[node] = group;
    const slot = document.createElement('li');
    worklistItems.append(slot);
    worklistSlots.push(slot);
  }

  function generateArray() {
    values = randomSortedValues(size.valueAsNumber);
    targetField.value = values[Math.floor(Math.random() * values.length)];
    cells = values.map(value => {
      const cell = document.createElement('div');
      const label = document.createElement('small');
      const number = document.createElement('strong');
      cell.className = 'search-cell';
      number.textContent = value;
      cell.append(label, number);
      return { cell, label };
    });
    array.replaceChildren(...cells.map(({ cell }) => cell));
  }

  function renderArray(step) {
    cells.forEach(({ cell, label }, position) => {
      const excluded = step && (position < step.low || position > step.high);
      const state = step?.found === position ? '발견' : step?.mid === position ? '비교' : excluded ? '제외' : '';
      cell.dataset.state = state;
      label.textContent = state ? `${position} · ${state}` : position;
    });
    const range = step?.low > step?.high || !values.length ? '없음' : `${step?.low ?? 0}–${step?.high ?? values.length - 1}`;
    find('metrics').textContent = `후보 인덱스 ${range} · 비교 ${step?.comparisons ?? 0}회`;
  }

  function renderGraph(step) {
    const pending = step?.pending ?? [];
    const order = step?.order ?? [];
    const status = step?.current ? ` · 현재 ${step.current}` : '';
    find('metrics').textContent = `방문 순서 ${order.join(' → ') || '없음'}${status}`;
    const items = topic === 'tab-1' ? pending : [...pending].reverse();
    worklistItems.hidden = !items.length;
    find('worklist-empty').hidden = Boolean(items.length);
    worklistSlots.forEach((slot, index) => {
      slot.hidden = index >= items.length;
      slot.textContent = items[index] ?? '';
    });
    for (const [node, group] of Object.entries(nodes)) {
      group.dataset.state = node === step?.current ? 'current' :
        pending.includes(node) ? 'pending' : order.includes(node) ? 'visited' : 'idle';
    }
  }

  function render() {
    const step = steps[index];
    const complete = Boolean(step) && index === steps.length - 1;
    if (topic === 'tab-0') renderArray(step);
    else renderGraph(step);
    run.textContent = !step ? '시작' : complete ? '다시 시작' : '↺ 초기화';
    size.disabled = targetField.disabled = start.disabled = Boolean(step) && !complete;
    find('feedback').hidden = find('controls').hidden = !step;
    if (!step) return;
    find('code').textContent = step.code;
    find('message').textContent = step.message;
    find('count').textContent = `${index + 1} / ${steps.length} 단계`;
    find('status').textContent = complete ? '완료' : auto.checked ? '자동 진행' : '수동 진행';
    find('prev').disabled = index === 0;
    find('next').disabled = complete;
    progress.classList.remove('running');
    progress.style.transform = `scaleX(${index / (steps.length - 1)})`;
    if (auto.checked && !complete) {
      // Restart the one-second animation when playback resumes or changes step.
      void progress.offsetWidth;
      progress.classList.add('running');
    }
  }

  function showStep(target) {
    player.stop();
    index = target;
    render();
    if (auto.checked && index >= 0 && index < steps.length - 1) {
      player.play(() => {
        index++;
        render();
        return index < steps.length - 1;
      });
    }
  }

  function prepare() {
    if (topic === 'tab-0') {
      if (size.validity.valid && values.length !== size.valueAsNumber) generateArray();
      const invalidSize = !size.validity.valid;
      const invalidTarget = !targetField.validity.valid;
      const error = invalidSize ? '원소 개수는 1~20 사이의 정수 입력' :
        invalidTarget ? '찾을 값은 −9999~9999 사이의 정수 입력' : '';
      size.setAttribute('aria-invalid', String(invalidSize));
      targetField.setAttribute('aria-invalid', String(invalidTarget));
      find('error').textContent = error;
      find('error').hidden = !error;
      run.disabled = Boolean(error);
      steps = error ? [] : binarySearchSteps(values, targetField.valueAsNumber);
    } else {
      find('error').hidden = true;
      run.disabled = false;
      steps = graphSearchSteps(start.value, topic === 'tab-2');
    }
    showStep(-1);
  }

  function selectTopic(id) {
    topic = id;
    const binary = id === 'tab-0';
    const bfs = id === 'tab-1';
    find('array-settings').hidden = array.hidden = !binary;
    find('graph-settings').hidden = find('graph-region').hidden = binary;
    worklist.dataset.structure = bfs ? 'queue' : 'stack';
    find('worklist-title').textContent = bfs ? '큐' : '호출 스택';
    find('worklist-direction').textContent = bfs ? '앞 → 뒤' : '맨 위부터';
    find('visual-title').textContent = binary ? '오름차순 배열' : '무방향 그래프';
    find('description').textContent = binary ?
      '가운데 값과 비교해 후보 구간을 절반씩 줄임 · 중복값은 탐색 중 처음 일치한 위치 반환' :
      bfs ? '큐를 사용해 시작 정점에 가까운 정점부터 방문' : '한 갈래를 따라 방문하고, 호출을 마치면 이전 정점으로 복귀';
    find('legend').textContent = binary ? '강조 · 비교 또는 발견 / 흐림 · 제외' :
      bfs ? '보라 · 현재 / 황색 · 큐 / 초록 · 방문' : '보라 · 현재 / 황색 · 호출 스택 / 초록 · 방문';
    find('complexity').textContent = binary ? '시간 · 최선 Θ(1), 최악 Θ(log n) / 보조 공간 · Θ(1)' :
      '시간 · O(V + E) / 보조 공간 · O(V)';
    find('complexity-detail').textContent = binary ?
      'n은 배열 길이 · 반복문에서 비교할 때마다 남은 후보 구간 축소' :
      '인접 리스트 기준 · V는 정점 수, E는 간선 수 · 시작점에서 도달할 수 있는 정점과 연결 간선만 확인';
    prepare();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (run.disabled) return;
    showStep(index < 0 || index === steps.length - 1 ? 0 : -1);
  });
  [size, targetField].forEach(field => field.addEventListener('input', prepare));
  start.addEventListener('change', prepare);
  find('prev').addEventListener('click', () => showStep(index - 1));
  find('next').addEventListener('click', () => showStep(index + 1));
  auto.addEventListener('change', () => showStep(index));
  document.querySelector('#lesson-panel').addEventListener('lesson-tab-change', event => selectTopic(event.detail));
  window.addEventListener('pagehide', () => showStep(-1));
  selectTopic(topic);
}

if (typeof module !== 'undefined') module.exports = { binarySearchSteps, graphSearchSteps, randomSortedValues };
if (typeof document !== 'undefined') mountSearchLesson();
