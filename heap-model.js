'use strict';
const HeapModel = (() => {
  const limit = 15;
  const create = () => [10,20,30,40,50,60,70];
  const clone = values => [...values];
  function frames(input, mode, value) {
    if(!['peek','insert','extract'].includes(mode))throw new Error('알 수 없는 연산');
    if(mode==='insert' && (!Number.isInteger(value)||Math.abs(value)>999))throw new Error('값은 -999부터 999까지의 정수로 입력');
    const values=clone(input), result=[];
    const add=(message,code,active=[],extra={})=>result.push({state:clone(values),message,code,active:[...active],...extra});
    if(mode==='peek') {
      add(values.length?'루트가 전체 최솟값 · 데이터 유지':'빈 힙 · 조회할 값 없음',values.length?`peek() → ${values[0]}`:'peek → Empty heap',values.length?[0]:[],values.length?{returned:values[0]}:{status:'error'});
    } else if(mode==='insert') {
      if(values.length===limit){add('학습용 최대 노드 수 15개 · 삭제 후 삽입 가능','node limit reached',[],{status:'error'});return result;}
      add('완전 이진 트리의 마지막 위치에 새 노드 추가 준비',`insert(${value})`);
      values.push(value);let i=values.length-1;
      add('마지막 위치에 저장 · 부모와 비교하며 위로 이동',`heap[${i}] = ${value}`,[i]);
      while(i>0) {
        const parent=Math.floor((i-1)/2);
        add(`부모 ${values[parent]}와 새 값 ${values[i]} 비교`,`heap[${parent}] ≤ heap[${i}] ?`,[parent,i]);
        if(values[parent]<=values[i])break;
        [values[parent],values[i]]=[values[i],values[parent]];
        add('자식이 더 작으므로 부모와 교환',`swap(${parent}, ${i})`,[parent,i]);i=parent;
      }
      add('삽입 완료 · 모든 부모 값은 자식 이하','insert complete',[i]);
    } else if(!values.length) add('빈 힙 · 추출할 값 없음','extractMin → Empty heap',[],{status:'error'});
    else {
      const returned=values[0];
      const emit=(message,code,active=[])=>add(message,code,active,{returned});
      emit(`루트의 최솟값 ${returned} 반환 준비`,`min = ${returned}`,[0]);
      if(values.length===1){values.pop();emit('마지막 노드 제거 · 빈 힙','extractMin complete');return result;}
      const last=values.pop();values[0]=last;
      emit('마지막 노드를 루트로 이동 · 마지막 위치 제거',`heap[0] = ${last}`,[0]);
      let i=0;
      while(2*i+1<values.length) {
        let child=2*i+1;
        if(child+1<values.length && values[child+1]<values[child])child++;
        emit(`더 작은 자식 ${values[child]}과 부모 ${values[i]} 비교`,`heap[${i}] ≤ heap[${child}] ?`,[i,child]);
        if(values[i]<=values[child])break;
        [values[i],values[child]]=[values[child],values[i]];
        emit('부모가 더 크므로 작은 자식과 교환',`swap(${i}, ${child})`,[i,child]);i=child;
      }
      emit('최솟값 추출 완료 · 최소 힙 조건 복원',`extractMin() → ${returned}`,[i]);
    }
    return result;
  }
  return {limit,create,clone,frames};
})();
if(typeof module!=='undefined')module.exports=HeapModel;
