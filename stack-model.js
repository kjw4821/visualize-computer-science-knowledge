'use strict';
const StackModel = (() => {
  const capacity = 6;
  function frames(values, mode, value) {
    if (!['peek', 'push', 'pop'].includes(mode)) throw new Error('알 수 없는 연산');
    if (mode === 'push' && (!Number.isInteger(value) || Math.abs(value) > 999)) throw new Error('값은 -999부터 999까지의 정수로 입력');
    const result = [];
    const add = (message, code, options = {}) => result.push({values: [...values], message, code, ...options});
    if (mode === 'push') {
      if (values.length >= capacity) {
        add('스택이 가득 찬 상태 · 기존 데이터 유지', 'push → Stack overflow', {status: 'error'});
      } else {
        add('TOP 위의 빈 공간 확인', `size ${values.length} < capacity ${capacity}`, {active: values.length});
        add(`새 값 ${value}을 TOP 위에 넣을 준비`, `push(${value})`, {active: values.length, incoming: value});
        values = [...values, value];
        add(`값 ${value} 삽입 완료 · 새 원소로 TOP 이동`, `TOP = ${values.length - 1}`, {active: values.length - 1});
      }
    } else if (!values.length) {
      add('스택이 비어 있는 상태 · TOP이 가리키는 원소 없음', `${mode} → Stack underflow`, {status: 'error'});
    } else {
      const top = values.length - 1, returned = values[top];
      add(`TOP이 가리키는 값 ${returned} 확인`, `TOP = ${top}`, {active: top});
      if (mode === 'peek') {
        add(`값 ${returned} 조회 · 원소와 TOP 유지`, `peek() → ${returned}`, {active: top, returned});
      } else {
        add(`마지막에 넣은 값 ${returned}을 꺼낼 준비`, `pop() → ${returned}`, {active: top, returned});
        values = values.slice(0, -1);
        add(values.length ? '맨 위 원소 제거 · 바로 아래 원소로 TOP 이동' : '마지막 원소 제거 · 빈 스택의 TOP은 -1', `pop() → ${returned} · TOP = ${values.length - 1}`, {active: values.length - 1, returned});
      }
    }
    return result;
  }
  return {capacity, frames};
})();
if (typeof module !== 'undefined') module.exports = StackModel;
