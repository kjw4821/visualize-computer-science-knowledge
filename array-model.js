'use strict';
// Each snapshot represents one visible step, including a temporary empty slot.
const ArrayModel = (() => {
  const capacity = 6;
  function frames(values, mode, index, value) {
    if (!Number.isSafeInteger(index)) throw new Error('안전한 범위의 정수 인덱스를 입력');
    if (mode !== 'access' && (index < 0 || index >= values.length + (mode === 'insert' ? 1 : 0))) throw new Error('유효한 인덱스를 입력');
    if (mode === 'insert' && values.length === capacity) throw new Error('배열 용량 초과 · 삭제 후 삽입 가능');
    if (mode === 'insert' && (!Number.isInteger(value) || value < -999 || value > 999)) throw new Error('삽입 값은 -999부터 999까지의 정수');
    const cells = Array.from({length: capacity}, (_, i) => values[i] ?? null);
    const result = [];
    const add = (message, code, active = [], count = values.length) => result.push({cells: [...cells], message, code, active, count});
    if (mode === 'access') {
      if (index < 0 || index >= capacity) {
        add(`인덱스 ${index}은 배열 용량 범위 0–${capacity - 1} 밖의 위치 · 범위 초과 접근`, `arr[${index}] → Index out of bounds`);
        result[0].state = 'error';
      } else if (index >= values.length) {
        add(`인덱스 ${index}은 용량 안의 미사용 슬롯 · 저장된 원소 없음`, `arr[${index}] → null (미사용 슬롯)`, [index]);
        result[0].state = 'empty';
      } else {
        add(`인덱스 ${index}의 원소에 바로 접근 · ${index + 1}번째 원소`, `arr[${index}] → ${cells[index]}`, [index]);
      }
    } else if (mode === 'insert') {
      add(`인덱스 ${index}에 삽입할 위치 표시`, `insert(${index}, ${value})`, [index]);
      for (let i = values.length; i > index; i--) {
        cells[i] = cells[i - 1]; cells[i - 1] = null;
        add(`인덱스 ${i - 1}의 값을 인덱스 ${i}로 이동`, `arr[${i}] ← arr[${i - 1}]`, [i - 1, i]);
      }
      cells[index] = value;
      add(`인덱스 ${index}에 ${value} 저장 · 삽입 완료`, `arr[${index}] ← ${value}`, [index], values.length + 1);
    } else if (mode === 'delete') {
      add(`인덱스 ${index}의 삭제 대상 표시`, `delete(${index})`, [index]);
      const removed = cells[index]; cells[index] = null;
      add(`인덱스 ${index}의 값 ${removed} 제거`, `remove arr[${index}]`, [index], values.length - 1);
      for (let i = index; i < values.length - 1; i++) {
        cells[i] = cells[i + 1]; cells[i + 1] = null;
        add(`인덱스 ${i + 1}의 값을 인덱스 ${i}로 이동`, `arr[${i}] ← arr[${i + 1}]`, [i, i + 1], values.length - 1);
      }
      add('뒤쪽 원소 이동 완료 · 삭제 완료', `arr = [${cells.filter(v => v !== null).join(', ')}]`, [], values.length - 1);
    } else throw new Error('알 수 없는 연산');
    return result;
  }
  return {capacity, frames};
})();
if (typeof module !== 'undefined') module.exports = ArrayModel;
