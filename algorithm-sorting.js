'use strict';

function bubbleSortSteps(values) {
  const items = values.map((value, id) => ({ value, id }));
  const steps = [];
  let comparisons = 0;
  let swaps = 0;
  let fixedFrom = items.length;

  function record(code, message, active = [], willSwap = false) {
    steps.push({ items: [...items], comparisons, swaps, fixedFrom, code, message, active, willSwap });
  }

  for (let end = items.length - 1; end > 0; end--) {
    let swapped = false;
    for (let index = 0; index < end; index++) {
      const left = items[index];
      const right = items[index + 1];
      const outOfOrder = left.value > right.value;
      comparisons++;
      record('if (a[j] > a[j + 1])',
        `${left.value}와 ${right.value} 비교 · ${outOfOrder ? '교환 예정' : '현재 순서 유지'}`,
        [left.id, right.id], outOfOrder);
      if (outOfOrder) {
        items[index] = right;
        items[index + 1] = left;
        swapped = true;
        swaps++;
        record('swap(a[j], a[j + 1])', `${left.value}와 ${right.value}의 위치 교환`, [left.id, right.id]);
      }
    }
    if (!swapped) {
      fixedFrom = 0;
      record('if (!swapped) break', '이번 회차에 교환이 없어 정렬 완료');
      return steps;
    }
    fixedFrom = end;
    record('end--', `${items[end].value}의 최종 위치 확정 · 다음 회차의 비교 범위 축소`);
  }
  fixedFrom = 0;
  record('return a', '오름차순 정렬 완료');
  return steps;
}

function selectionSortSteps(values) {
  const items = values.map((value, id) => ({ value, id }));
  const steps = [];
  let comparisons = 0;
  let swaps = 0;
  let fixedUntil = 0;

  function record(code, message, active = [], candidate = null, willSwap = false) {
    steps.push({ items: [...items], comparisons, swaps, fixedUntil, code, message, active, candidate, willSwap });
  }

  for (let start = 0; start < items.length - 1; start++) {
    let minimum = start;
    record('min = i', `${items[start].value}를 최솟값 후보로 선택`, [], items[start].id);
    for (let index = start + 1; index < items.length; index++) {
      const current = items[index];
      const candidate = items[minimum];
      comparisons++;
      record('if (a[j] < a[min])', `${current.value}와 후보 ${candidate.value} 비교`, [current.id], candidate.id);
      if (current.value < candidate.value) {
        minimum = index;
        record('min = j', `더 작은 값 ${current.value}로 후보 갱신`, [], current.id);
      }
    }

    const first = items[start];
    const smallest = items[minimum];
    if (minimum !== start) {
      const pair = [first.id, smallest.id];
      record('if (min !== i)', `${smallest.value}를 정렬되지 않은 구간의 맨 앞으로 이동 예정`, pair, null, true);
      items[start] = smallest;
      items[minimum] = first;
      swaps++;
      record('swap(a[i], a[min])', `${first.value}와 ${smallest.value}의 위치 교환`, pair);
    }
    fixedUntil = start + 1;
    const message = minimum === start ? `교환 없이 ${smallest.value}의 위치 확정` : `${smallest.value}의 최종 위치 확정`;
    record('i++', message);
  }
  fixedUntil = items.length;
  record('return a', '오름차순 정렬 완료');
  return steps;
}

function insertionSortSteps(values) {
  const items = values.map((value, id) => ({ value, id }));
  const steps = [];
  let comparisons = 0;
  let shifts = 0;
  let sortedUntil = Math.min(1, items.length);
  let key = null;
  let hole = -1;

  function record(code, message, active = [], shiftId = null) {
    steps.push({ items: [...items], comparisons, shifts, sortedUntil, key, hole, code, message, active, shiftId });
  }

  for (let start = 1; start < items.length; start++) {
    key = items[start];
    hole = start;
    items[hole] = null;
    record('key = a[i]', `${key.value}를 key로 보관`);

    while (hole > 0) {
      const left = items[hole - 1];
      const shouldShift = left.value > key.value;
      comparisons++;
      record('a[j] > key', `${left.value}와 key ${key.value} 비교 · ${shouldShift ? '오른쪽으로 이동 예정' : '빈칸에 삽입 예정'}`,
        [left.id], shouldShift ? left.id : null);
      if (!shouldShift) break;
      items[hole] = left;
      hole--;
      items[hole] = null;
      shifts++;
      record('a[j + 1] = a[j]', `${left.value}를 오른쪽으로 한 칸 이동`, [left.id]);
    }

    const inserted = key;
    items[hole] = inserted;
    key = null;
    hole = -1;
    sortedUntil = start + 1;
    record('a[j + 1] = key', `${inserted.value}를 빈칸에 삽입 · 앞 ${sortedUntil}개 정렬`, [inserted.id]);
  }
  record('return a', '오름차순 정렬 완료');
  return steps;
}

function mergeSortSteps(values) {
  const items = values.map((value, id) => ({ value, id }));
  const steps = [];
  let comparisons = 0;
  let bufferWrites = 0;
  let arrayWrites = 0;

  function record(code, message, { range = null, buffer = [], active = [], source = null } = {}) {
    steps.push({ items: [...items], comparisons, bufferWrites, arrayWrites, code, message,
      range, buffer: [...buffer], active, source });
  }

  function sort(start, end) {
    if (end - start < 2) return;
    const middle = Math.floor((start + end) / 2);
    const range = { start, middle, end };
    record('mid = floor((lo + hi) / 2)',
      `앞 ${middle - start}개와 뒤 ${end - middle}개로 분할`, { range });
    sort(start, middle);
    sort(middle, end);

    let left = start;
    let right = middle;
    const buffer = [];
    while (left < middle || right < end) {
      let takeLeft = right === end;
      if (left < middle && right < end) {
        const a = items[left];
        const b = items[right];
        takeLeft = a.value <= b.value;
        comparisons++;
        record('a[left] <= a[right]', `${a.value}와 ${b.value} 비교`,
          { range, buffer, active: [a.id, b.id], source: takeLeft ? a.id : b.id });
      }
      const item = items[takeLeft ? left++ : right++];
      buffer.push(item);
      bufferWrites++;
      record(takeLeft ? 'temp[k] = a[left++]' : 'temp[k] = a[right++]',
        `${item.value}를 임시 배열에 복사`, { range, buffer, active: [item.id] });
    }

    record('copy(temp, a, lo)', '정렬된 임시 배열을 원본에 반영할 차례', { range, buffer });
    buffer.forEach((item, offset) => { items[start + offset] = item; });
    arrayWrites += buffer.length;
    record('a[lo:hi] = temp', `인덱스 ${start}~${end - 1}에 병합 결과 반영`, { range, buffer });
  }

  sort(0, items.length);
  record('return a', '오름차순 정렬 완료');
  return steps;
}

function quickSortSteps(values) {
  const items = values.map((value, id) => ({ value, id }));
  const steps = [];
  const fixed = Array(items.length).fill(false);
  let comparisons = 0;
  let swaps = 0;

  function record(code, message, { partition = null, candidate = null, active = [], willSwap = false } = {}) {
    steps.push({ items: [...items], fixed: [...fixed], comparisons, swaps,
      code, message, partition, candidate, active, willSwap });
  }

  function swap(left, right) {
    [items[left], items[right]] = [items[right], items[left]];
    swaps++;
  }

  function sort(start, end) {
    if (start > end) return;
    if (start === end) {
      fixed[start] = true;
      record('if (lo == hi) return', `원소가 하나인 구간 · ${items[start].value}의 위치 확정`,
        { active: [items[start].id] });
      return;
    }

    const pivot = items[end];
    const partition = { start, end };
    let boundary = start;
    record('pivot = a[hi]', `인덱스 ${start}~${end}의 마지막 값 ${pivot.value}를 피벗으로 선택`,
      { partition, candidate: pivot.id });
    for (let scan = start; scan < end; scan++) {
      const current = items[scan];
      const smaller = current.value < pivot.value;
      comparisons++;
      const willSwap = smaller && boundary !== scan;
      const active = willSwap ? [items[boundary].id, current.id] : [current.id];
      const outcome = smaller ? (willSwap ? '왼쪽 구간으로 교환 예정' : '현재 자리를 왼쪽 구간에 포함') :
        '오른쪽 구간에 유지';
      record('a[j] < pivot', `${current.value}와 피벗 ${pivot.value} 비교 · ${outcome}`,
        { partition, candidate: pivot.id, active, willSwap });
      if (smaller) {
        if (willSwap) {
          swap(boundary, scan);
          record('swap(a[i], a[j])', `${current.value}를 왼쪽 구간으로 이동`,
            { partition, candidate: pivot.id, active });
        }
        boundary++;
      }
    }
    if (boundary !== end) {
      record('swap(a[i], a[hi])', `피벗 ${pivot.value}를 인덱스 ${boundary}로 이동 예정`,
        { partition, candidate: pivot.id, active: [items[boundary].id, pivot.id], willSwap: true });
      swap(boundary, end);
    }
    fixed[boundary] = true;
    record('p = i', `피벗 ${pivot.value}의 위치 확정 · 왼쪽 ${boundary - start}개, 오른쪽 ${end - boundary}개로 분할`,
      { partition, active: [pivot.id] });
    sort(start, boundary - 1);
    sort(boundary + 1, end);
  }

  sort(0, items.length - 1);
  record('return a', '오름차순 정렬 완료');
  return steps;
}

function heapSortSteps(values) {
  const items = values.map((value, id) => ({ value, id }));
  const steps = [];
  let comparisons = 0;
  let swaps = 0;
  let fixedFrom = items.length;

  function record(code, message, { active = [], parent = null, willSwap = false } = {}) {
    steps.push({ items: [...items], comparisons, swaps, fixedFrom, code, message, active, parent, willSwap });
  }

  function swap(left, right) {
    [items[left], items[right]] = [items[right], items[left]];
    swaps++;
  }

  function siftDown(start) {
    let root = start;
    while (2 * root + 1 < fixedFrom) {
      const left = 2 * root + 1;
      const right = left + 1;
      const parent = items[root].id;
      let child = left;
      if (right < fixedFrom) {
        comparisons++;
        if (items[right].value > items[left].value) child = right;
        record('a[right] > a[left]', `자식 ${items[left].value}와 ${items[right].value} 비교 · ${items[child].value} 선택`,
          { parent, active: [items[left].id, items[right].id] });
      }

      const active = [parent, items[child].id];
      const willSwap = items[child].value > items[root].value;
      comparisons++;
      record('a[child] > a[parent]', `부모 ${items[root].value}와 자식 ${items[child].value} 비교 · ${willSwap ? '교환 예정' : '현재 위치 유지'}`,
        { parent, active, willSwap });
      if (!willSwap) break;
      swap(root, child);
      record('swap(a[parent], a[child])', `큰 값 ${items[root].value}를 부모 위치로 이동`, { parent, active });
      root = child;
    }
  }

  for (let root = Math.floor(items.length / 2) - 1; root >= 0; root--) {
    record('siftDown(i)', `인덱스 ${root}에서 아래로 내려가며 최대 힙 구성`, { parent: items[root].id });
    siftDown(root);
  }
  if (items.length > 1) record('buildMaxHeap(a)', `최대 힙 완성 · 루트의 최댓값 ${items[0].value}`, { parent: items[0].id });

  while (fixedFrom > 1) {
    const end = fixedFrom - 1;
    const max = items[0];
    record('swap(a[0], a[end])', `최댓값 ${max.value}를 남은 힙의 마지막 자리로 이동 예정`,
      { parent: max.id, active: [max.id, items[end].id], willSwap: true });
    swap(0, end);
    fixedFrom = end;
    record('heapSize--', `${max.value}의 위치 확정 · 앞 ${fixedFrom}개에서 최대 힙 복구`,
      { active: [max.id], parent: items[0].id });
    siftDown(0);
  }

  fixedFrom = 0;
  record('return a', '오름차순 정렬 완료');
  return steps;
}

function mountSortingLesson() {
  const find = id => document.getElementById(id);
  const chart = find('sorting-chart');
  const viewport = find('sorting-viewport');
  const size = find('sorting-size');
  const run = find('sorting-run');
  const auto = find('sorting-auto');
  const previous = find('sorting-prev');
  const next = find('sorting-next');
  const progress = find('sorting-progress');
  const swapLegend = find('sorting-swap-legend');
  const topics = document.querySelectorAll('[data-sort-topic]');
  const sorters = {
    'tab-0': bubbleSortSteps,
    'tab-1': selectionSortSteps,
    'tab-2': insertionSortSteps,
    'tab-3': mergeSortSteps,
    'tab-4': quickSortSteps,
    'tab-5': heapSortSteps
  };
  const bufferRow = find('sorting-buffer');
  const holeMarker = document.createElement('div');
  holeMarker.className = 'sorting-hole';
  holeMarker.setAttribute('aria-hidden', 'true');
  let sorter = bubbleSortSteps;
  let player;
  let bars;
  let bufferCells;
  let steps;
  let initial;
  let index = -1;

  function setExample() {
    const valid = size.validity.valid;
    size.setAttribute('aria-invalid', String(!valid));
    find('sorting-size-error').textContent = valid ? '' : `${size.min}~${size.max} 사이의 정수 입력`;
    run.disabled = !valid;
    if (!valid) return;

    const count = size.valueAsNumber;
    if (bars?.length === count) return;
    const values = Array.from({ length: count }, (_, index) => index + 1);
    for (let index = values.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [values[index], values[other]] = [values[other], values[index]];
    }
    initial = { items: values.map((value, id) => ({ value, id })), comparisons: 0,
      swaps: 0, fixedFrom: count, active: [] };
    chart.style.setProperty('--bar-width', `${70 / count}%`);
    chart.style.setProperty('--bar-inset', `${15 / count}%`);
    chart.style.setProperty('--chart-min-width', `${count * 30}px`);
    bars = values.map(value => {
      const bar = document.createElement('div');
      const arrow = document.createElement('span');
      bar.className = 'sorting-bar';
      bar.style.setProperty('--value', value / count);
      arrow.className = 'sorting-arrow';
      bar.append(String(value), arrow);
      return { bar, arrow };
    });
    chart.replaceChildren(holeMarker, ...bars.map(({ bar }) => bar));
    bufferCells = values.map(() => document.createElement('span'));
    bufferRow.style.setProperty('--slot-count', count);
    bufferRow.replaceChildren(...bufferCells);
    prepareSteps();
  }

  function prepareSteps() {
    player?.stop();
    steps = sorter(initial.items.map(item => item.value));
    const interval = Math.max(80, Math.min(1000, Math.round(10000 / (steps.length - 1))));
    player = new StepPlayer(interval);
    chart.style.setProperty('--bar-motion', `${Math.min(350, interval * 0.7)}ms`);
    progress.style.setProperty('--sorting-interval', `${interval}ms`);
    showStep(-1);
  }

  function render() {
    const started = index >= 0;
    const complete = index === steps.length - 1;
    const step = started ? steps[index] : initial;
    const insertion = sorter === insertionSortSteps;
    const merge = sorter === mergeSortSteps;
    const quick = sorter === quickSortSteps;
    const heap = sorter === heapSortSteps;
    const range = step.range;
    const partition = step.partition;
    chart.classList.toggle('is-insertion', insertion);
    swapLegend.hidden = insertion || merge || quick || heap;
    holeMarker.hidden = !step.key;
    if (step.key) holeMarker.style.setProperty('--position', `${step.hole / bars.length * 100}%`);
    step.items.forEach((item, position) => {
      const id = (item ?? step.key).id;
      const { bar, arrow } = bars[id];
      bar.style.setProperty('--position', `${position / bars.length * 100}%`);
      bar.classList.toggle('is-key', item === null);
      bar.classList.toggle('is-active', step.active.includes(id));
      bar.classList.toggle('is-candidate', id === step.candidate);
      bar.classList.toggle('is-heap-parent', id === step.parent);
      bar.classList.toggle('is-merge-left', Boolean(range && position >= range.start && position < range.middle));
      bar.classList.toggle('is-merge-right', Boolean(range && position >= range.middle && position < range.end));
      bar.classList.toggle('is-partition', Boolean(partition && position >= partition.start && position <= partition.end));
      bar.classList.toggle('is-fixed', Boolean(step.fixed?.[position]) || position < step.fixedUntil || position >= step.fixedFrom);
      const sortedUntil = step.key ? step.hole : started ? step.sortedUntil : Number(insertion);
      bar.classList.toggle('is-sorted', position < sortedUntil);
      arrow.textContent = id === step.source ? '↓' : id === step.shiftId ? '→' :
        step.willSwap && step.active.includes(id) ? (id === step.active[0] ? '→' : '←') : '';
    });
    if (merge) {
      bufferCells.forEach((cell, position) => {
        const item = range && step.buffer[position - range.start];
        const inRange = Boolean(range && position >= range.start && position < range.end);
        const content = item ? String(item.value) : '';
        if (cell.textContent !== content) cell.textContent = content;
        cell.classList.toggle('is-merge-slot', inRange);
        cell.classList.toggle('is-filled', Boolean(item));
      });
    }
    if (!started) viewport.scrollLeft = 0;
    const focusIds = step.active.length ? step.active : [step.candidate];
    const positions = focusIds.map(id => step.items.findIndex(item => item?.id === id)).filter(position => position >= 0);
    if (step.key) positions.push(step.hole);
    if (step.parent !== null && step.parent !== undefined) {
      positions.push(step.items.findIndex(item => item.id === step.parent));
    }
    if (range && !positions.length) positions.push(range.start, range.end - 1);
    if (quick && step.candidate !== null && step.candidate !== undefined && step.active.length) {
      positions.push(step.items.findIndex(item => item.id === step.candidate));
    }
    if (positions.length && viewport.clientWidth) {
      const slotWidth = chart.clientWidth / bars.length;
      const left = chart.offsetLeft + Math.min(...positions) * slotWidth;
      const right = chart.offsetLeft + (Math.max(...positions) + 1) * slotWidth;
      if (right - left > viewport.clientWidth || left < viewport.scrollLeft) viewport.scrollLeft = left;
      else if (right > viewport.scrollLeft + viewport.clientWidth) viewport.scrollLeft = right - viewport.clientWidth;
    }
    const order = step.items.map(item => item?.value ?? '빈칸').join(', ');
    const heldKey = step.key ? ` · key ${step.key.value} 보관 중` : '';
    chart.setAttribute('aria-label', `배열 순서: ${order}${heldKey}`);
    const temporary = step.buffer?.length ? ` · 임시 배열 [${step.buffer.map(item => item.value).join(', ')}]` : '';
    const moves = merge ? `임시 배열 쓰기 ${step.bufferWrites ?? 0}회 · 원본 반영 ${step.arrayWrites ?? 0}회` :
      insertion ? `밀기 ${step.shifts ?? 0}회` : `교환 ${step.swaps}회`;
    find('sorting-metrics').textContent = `비교 ${step.comparisons}회 · ${moves}`;
    find('sorting-feedback').hidden = !started;
    find('sorting-controls').hidden = !started;
    run.textContent = !started ? '시작' : complete ? '다시 시작' : '↺ 초기화';
    size.disabled = started && !complete;
    if (!started) return;

    find('sorting-code').textContent = step.code;
    find('sorting-message').textContent = `${step.message} · 배열 [${order}]${heldKey}${temporary}`;
    find('sorting-count').textContent = `${index + 1} / ${steps.length} 단계`;
    find('sorting-status').textContent = complete ? '완료' : auto.checked ? '자동 진행' : '수동 진행';
    previous.disabled = index === 0;
    next.disabled = complete;
    const fill = document.createElement('span');
    fill.className = 'step-progress-fill';
    if (complete) fill.classList.add('complete');
    else if (auto.checked) fill.classList.add('running');
    else fill.style.transform = `scaleX(${index / (steps.length - 1)})`;
    progress.replaceChildren(fill);
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

  run.addEventListener('click', () => showStep(index < 0 || index === steps.length - 1 ? 0 : -1));
  previous.addEventListener('click', () => showStep(index - 1));
  next.addEventListener('click', () => showStep(index + 1));
  auto.addEventListener('change', () => showStep(index));
  size.addEventListener('change', setExample);
  find('sorting-settings').addEventListener('submit', event => {
    event.preventDefault();
    setExample();
  });
  find('lesson-panel').addEventListener('lesson-tab-change', event => {
    const selectedSorter = sorters[event.detail];
    const selected = Boolean(selectedSorter);
    find('sorting-lesson').hidden = !selected;
    find('sorting-placeholder').hidden = selected;
    topics.forEach(topic => { topic.hidden = topic.dataset.sortTopic !== event.detail; });
    if (selected && selectedSorter !== sorter) {
      sorter = selectedSorter;
      prepareSteps();
    } else {
      showStep(-1);
    }
  });
  window.addEventListener('pagehide', () => showStep(-1));
  if (!size.validity.valid) size.value = size.defaultValue;
  setExample();
}

if (typeof module !== 'undefined') {
  module.exports = bubbleSortSteps;
  module.exports.selectionSortSteps = selectionSortSteps;
  module.exports.insertionSortSteps = insertionSortSteps;
  module.exports.mergeSortSteps = mergeSortSteps;
  module.exports.quickSortSteps = quickSortSteps;
  module.exports.heapSortSteps = heapSortSteps;
}
if (typeof document !== 'undefined') mountSortingLesson();
