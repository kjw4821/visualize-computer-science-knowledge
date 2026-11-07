'use strict';
const QueueModel = (() => {
  const capacity = 6;
  function frames(values, mode, value) {
    if (!['peek', 'enqueue', 'dequeue'].includes(mode)) throw new Error('알 수 없는 연산');
    if (mode === 'enqueue' && (!Number.isInteger(value) || Math.abs(value) > 999)) throw new Error('값은 -999부터 999까지의 정수로 입력');
    const result = [];
    const add = (message, code, options = {}) => result.push({values: [...values], message, code, ...options});
    if (mode === 'enqueue') {
      if (values.length >= capacity) {
        add('큐가 가득 찬 상태 · 기존 데이터 유지', 'enqueue → Queue overflow', {status: 'error'});
      } else {
        add(values.length ? 'REAR 뒤에 삽입할 위치 확인' : '빈 큐 · 첫 원소를 넣을 준비', `size ${values.length} < capacity ${capacity}`, {active: values.length});
        add(`새 값 ${value}을 큐의 뒤에 넣을 준비`, `enqueue(${value})`, {active: values.length, incoming: value});
        values = [...values, value];
        add(values.length === 1 ? '첫 원소 삽입 · FRONT와 REAR가 같은 원소를 참조' : `값 ${value} 삽입 완료 · REAR를 새 원소로 변경`, `REAR.data → ${value}`, {active: values.length - 1});
      }
    } else if (!values.length) {
      add('큐가 비어 있는 상태 · FRONT와 REAR가 가리키는 원소 없음', `${mode} → Queue underflow`, {status: 'error'});
    } else {
      const returned = values[0];
      add(`FRONT가 가리키는 값 ${returned} 확인`, `FRONT.data → ${returned}`, {active: 0});
      if (mode === 'peek') {
        add(`값 ${returned} 조회 · 원소와 FRONT 유지`, `peek() → ${returned}`, {active: 0, returned});
      } else {
        add(`가장 먼저 넣은 값 ${returned}을 꺼낼 준비`, `dequeue() → ${returned}`, {active: 0, returned});
        values = values.slice(1);
        add(values.length ? '첫 원소 제거 · FRONT를 다음 원소로 변경' : '마지막 원소 제거 · FRONT와 REAR는 null', `dequeue() → ${returned}`, {active: values.length ? 0 : -1, returned});
      }
    }
    return result;
  }
  return {capacity, frames};
})();
if (typeof module !== 'undefined') module.exports = QueueModel;
