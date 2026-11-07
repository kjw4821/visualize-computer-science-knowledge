'use strict';
const TreeModel = (() => {
  const limit = 15;
  const clone = state => ({root: state.root, serial: state.serial, nodes: state.nodes.map(n => ({...n}))});
  function create(values = [40, 20, 60, 10, 30, 50, 70]) {
    const state = {root: null, serial: 1, nodes: []};
    for (const value of values) {
      if (!Number.isInteger(value) || Math.abs(value) > 999) throw new Error('값은 -999부터 999까지의 정수로 입력');
      let parent = null, id = state.root, side;
      while (id !== null) {
        parent = state.nodes.find(n => n.id === id);
        if (value === parent.value) break;
        side = value < parent.value ? 'left' : 'right'; id = parent[side];
      }
      if (id !== null) continue;
      const node = {id: `T${state.serial++}`, value, left: null, right: null}; state.nodes.push(node);
      if (parent) parent[side] = node.id; else state.root = node.id;
    }
    return state;
  }
  function inorder(state) {
    const result = [], byId = new Map(state.nodes.map(n => [n.id, n]));
    function visit(id) { if (id === null) return;const n = byId.get(id);visit(n.left);result.push(n.value);visit(n.right); }
    visit(state.root);return result;
  }
  function frames(input, mode, value) {
    if (!['search', 'insert', 'delete'].includes(mode)) throw new Error('알 수 없는 연산');
    if (!Number.isInteger(value) || Math.abs(value) > 999) throw new Error('값은 -999부터 999까지의 정수로 입력');
    const state = clone(input), result = [], visited = [];
    const node = id => state.nodes.find(n => n.id === id);
    const add = (message, code, active = [], options = {}) => result.push({state: clone(state), message, code, active: [...active], visited: [...visited], ...options});
    let current = state.root, parent = null, side = null;
    if (current !== null) add('루트에서 비교 시작', 'current = root', [current]);
    while (current !== null) {
      const n = node(current);visited.push(current);
      if (value === n.value) {add(`값 ${value} 발견`, `${value} = ${n.value}`, [current]);break;}
      side = value < n.value ? 'left' : 'right';parent = current;
      add(`${value} ${side === 'left' ? '<' : '>'} ${n.value} · ${side === 'left' ? '왼쪽' : '오른쪽'} 자식 선택`, `current = current.${side}`, [current]);
      current = n[side];
      add(current ? `다음 노드 ${node(current).value}로 이동` : '자식 참조가 null · 탐색 경로 끝', current ? `current.data = ${node(current).value}` : 'current = null', current ? [current] : []);
    }
    if (mode === 'search') {
      add(current ? `탐색 완료 · 값 ${value} 존재` : `탐색 완료 · 값 ${value} 없음`, current ? `search(${value}) → found` : `search(${value}) → not found`, current ? [current] : [], {status: current ? 'normal' : 'empty'});
    } else if (mode === 'insert') {
      if (current) add('중복 값 · 이 예시에서는 같은 값을 추가하지 않음', `insert(${value}) → duplicate`, [current], {status: 'empty'});
      else if (state.nodes.length >= limit) add('학습용 최대 노드 수 15개 · 삭제 후 삽입 가능', 'node limit reached', [], {status: 'error'});
      else {
        add('빈 자식 위치 확인 · 새 노드를 연결할 준비', parent ? `${side} child of ${node(parent).value} = null` : 'root = null', parent ? [parent] : []);
        const fresh = {id: `T${state.serial++}`, value, left: null, right: null};state.nodes.push(fresh);
        if (parent) node(parent)[side] = fresh.id; else state.root = fresh.id;
        add(parent ? `새 값 ${value}을 ${node(parent).value}의 ${side === 'left' ? '왼쪽' : '오른쪽'} 자식으로 연결` : `첫 값 ${value}을 루트로 설정`, parent ? `parent.${side} = newNode(${value})` : `root = newNode(${value})`, [fresh.id]);
      }
    } else if (!current) {
      add(`삭제할 값 ${value} 없음 · 트리 유지`, `delete(${value}) → not found`, [], {status: 'empty'});
    } else {
      const target = node(current);
      if (target.left && target.right) {
        add('자식 2개 · 오른쪽 서브트리에서 최솟값인 후속자 탐색', 'successor = current.right', [current, target.right]);
        let successorParent = current, successor = target.right;
        while (node(successor).left) {
          successorParent = successor;successor = node(successor).left;
          add('후속자를 찾기 위해 왼쪽 자식으로 이동', 'successor = successor.left', [successor]);
        }
        const replacement = node(successor);
        add(`후속자 ${replacement.value} 확인 · 왼쪽 자식이 없는 노드`, `successor.data = ${replacement.value}`, [successor]);
        target.value = replacement.value;
        add(`삭제 대상의 값을 후속자 ${replacement.value}로 대체 · 다음 단계에서 후속자 노드 제거`, 'current.data = successor.data', [current, successor]);
        if (successorParent === current) target.right = replacement.right;
        else node(successorParent).left = replacement.right;
        state.nodes = state.nodes.filter(n => n.id !== successor);
        add('후속자 노드 제거 · 후속자의 오른쪽 자식이 있으면 부모에 연결', 'unlink successor', [current]);
      } else {
        const child = target.left || target.right;
        add(child ? '자식 1개 · 부모를 대상의 자식에 연결할 준비' : '리프 노드 · 부모의 자식 참조를 null로 바꿀 준비', child ? 'replacement = current.left or current.right' : 'replacement = null', [current]);
        if (parent) node(parent)[side] = child; else state.root = child;
        state.nodes = state.nodes.filter(n => n.id !== current);
        add(parent ? '부모 연결 변경 후 대상 노드 제거' : '루트 참조 변경 후 대상 노드 제거', parent ? `parent.${side} = replacement` : 'root = replacement', child ? [child] : []);
      }
    }
    return result;
  }
  return {limit, create, clone, inorder, frames};
})();
if (typeof module !== 'undefined') module.exports = TreeModel;
