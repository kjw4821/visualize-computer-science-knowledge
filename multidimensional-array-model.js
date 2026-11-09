'use strict';
const MultidimensionalArrayModel = (() => {
  const shapes = {2: [3, 4], 3: [2, 3, 4]};
  function shape(dimension) {
    if (!Object.hasOwn(shapes, dimension)) throw new Error('2차원 또는 3차원 선택');
    return [...shapes[dimension]];
  }
  function coordinates(index, dimensions) {
    const total = dimensions.reduce((a, b) => a * b, 1);
    if (!Number.isInteger(index) || index < 0 || index >= total) throw new Error('범위 밖 원소 위치');
    const result = [];
    for (let i = dimensions.length - 1; i >= 0; i--) {
      result.unshift(index % dimensions[i]);
      index = Math.floor(index / dimensions[i]);
    }
    return result;
  }
  const expression = indices => 'arr' + indices.map(i => `[${i}]`).join('');
  function frames(dimension, random = Math.random) {
    const dimensions = shape(dimension);
    const cells = Array(dimensions.reduce((a, b) => a * b, 1)).fill(null);
    const frames = [{cells: [...cells], active: [], code: `int ${expression(dimensions)};`, message: `${dimension}차원 배열 생성 · ?는 초기화 전 미정 값`}];
    for (let i = 0; i < cells.length; i++) {
      const sample = random();
      if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('난수는 0 이상 1 미만');
      cells[i] = Math.floor(sample * 100);
      frames.push({cells: [...cells], active: [i], code: `${expression(coordinates(i, dimensions))} = ${cells[i]};`, message: `연속 메모리 위치 ${i} · 마지막 인덱스부터 증가`});
    }
    return frames;
  }
  return {shape, coordinates, expression, frames};
})();
if (typeof module !== 'undefined') module.exports = MultidimensionalArrayModel;
