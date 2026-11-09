'use strict';
const ArrayModel = (() => {
  const size = 5;
  function frames(random = Math.random) {
    const cells = Array(size).fill(null);
    const result = [];
    const add = (code, message, active = [], state = 'normal') => {
      result.push({cells: [...cells], code, message, active, state});
    };
    add('int arr[5];', '연속된 int 5칸 생성 · ?는 초기화 전 미정 값');
    for (let i = 0; i < size; i++) {
      const sample = random();
      if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('난수는 0 이상 1 미만');
      cells[i] = Math.floor(sample * 100);
      add(`arr[${i}] = ${cells[i]};`, `인덱스 ${i}에 ${cells[i]} 대입`, [i]);
    }
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('난수는 0 이상 1 미만');
    add(`arr[5] = ${Math.floor(sample * 100)}; // 범위 초과`, '인덱스 5는 범위 밖 · 정의되지 않은 동작', [], 'error');
    return result;
  }
  return {size, frames};
})();
if (typeof module !== 'undefined') module.exports = ArrayModel;
