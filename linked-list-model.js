'use strict';
const LinkedListModel = (() => {
  function create(values = [12, 24, 36, 48]) {
    return {head: values.length ? 'N1' : null, serial: values.length + 1,
      nodes: values.map((value, i) => ({id: `N${i + 1}`, value, next: i + 1 < values.length ? `N${i + 2}` : null}))};
  }
  function clone(state) { return {...state, nodes: state.nodes.map(node => ({...node}))}; }
  function order(state) {
    const ids = []; let id = state.head;
    while (id !== null) {
      if (ids.includes(id)) throw new Error('순환 연결');
      const node = state.nodes.find(n => n.id === id);
      if (!node) throw new Error('유효하지 않은 참조');
      ids.push(id); id = node.next;
    }
    return ids;
  }
  function frames(input, mode, index, value) {
    const state = clone(input), ids = order(state), size = ids.length;
    if (!Number.isSafeInteger(index) || index < 0) throw new Error('위치는 0 이상의 정수로 입력');
    if (!['search', 'insert', 'delete'].includes(mode)) throw new Error('알 수 없는 연산');
    if (mode !== 'search' && index >= size + (mode === 'insert' ? 1 : 0)) throw new Error('목록 범위 안의 위치를 입력');
    if (mode === 'insert' && (!Number.isInteger(value) || Math.abs(value) > 999)) throw new Error('값은 -999부터 999까지의 정수로 입력');
    const result = [];
    const node = id => state.nodes.find(n => n.id === id);
    const add = (message, code, active = [], options = {}) => result.push({state: clone(state), message, code, active: [...active], layout: [...ids], ...options});
    if (mode === 'search') {
      let current = state.head;
      add('HEAD가 가리키는 첫 노드에서 탐색 시작', 'current = head', current ? [current] : []);
      for (let i = 0; i < Math.min(index, size) && current !== null; i++) {
        current = node(current).next;
        add(`next를 따라 위치 ${i + 1}로 이동`, 'current = current.next', current ? [current] : []);
      }
      if (current === null) add('null에 도달 · 해당 위치의 노드 없음 · null.next 접근 시 오류 가능', `nodeAt(${index}) → null`, [], {status: 'error'});
      else add(`위치 ${index}의 노드 값 ${node(current).value} 확인`, `current.data → ${node(current).value}`, [current]);
    } else {
      const previous = index > 0 ? ids[index - 1] : null;
      if (previous) {
        add('HEAD에서 이전 노드 탐색 시작', 'prev = head', [state.head]);
        for (let i = 1; i < index; i++) add(`next를 따라 위치 ${i}의 이전 노드로 이동`, 'prev = prev.next', [ids[i]]);
      } else add('맨 앞 위치 · HEAD 참조를 변경하는 연산', 'position = 0', state.head ? [state.head] : []);
      if (mode === 'insert') {
        const successor = previous ? node(previous).next : state.head;
        const fresh = {id: `N${state.serial++}`, value, next: null}; state.nodes.push(fresh);
        add(`값 ${value}의 새 노드 생성 · 아직 목록과 분리된 상태`, `newNode = Node(${value})`, [fresh.id], {fresh: fresh.id});
        fresh.next = successor;
        add('새 노드의 next를 기존 다음 노드에 연결', 'newNode.next = ' + (previous ? 'prev.next' : 'head'), [fresh.id], {fresh: fresh.id});
        if (previous) node(previous).next = fresh.id; else state.head = fresh.id;
        add(previous ? '이전 노드의 next를 새 노드에 연결' : 'HEAD를 새 노드로 변경', previous ? 'prev.next = newNode' : 'head = newNode', [previous, fresh.id].filter(Boolean), {fresh: fresh.id});
        add('삽입 완료 · 데이터 이동 없이 참조만 변경', 'insert complete', [fresh.id], {layout: order(state)});
      } else {
        const target = ids[index], successor = node(target).next;
        add(`삭제할 값 ${node(target).value}의 노드 확인`, previous ? 'target = prev.next' : 'target = head', [target]);
        if (previous) node(previous).next = successor; else state.head = successor;
        add(previous ? '이전 노드가 삭제 대상의 다음 노드를 가리키도록 변경' : 'HEAD를 다음 노드로 변경', previous ? 'prev.next = target.next' : 'head = target.next', [previous, target].filter(Boolean), {detached: target});
        state.nodes = state.nodes.filter(n => n.id !== target);
        add('삭제 완료 · 분리한 노드 제거', 'remove target', [], {layout: order(state)});
      }
    }
    return result;
  }
  return {create, clone, order, frames};
})();
if (typeof module !== 'undefined') module.exports = LinkedListModel;
