'use strict';
const HashTableModel = (() => {
  const bucketCount=7,limit=12;
  const hash=key=>((key % bucketCount)+bucketCount)%bucketCount;
  const clone=state=>state.map(chain=>chain.map(entry=>({...entry})));
  const size=state=>state.reduce((total,chain)=>total+chain.length,0);
  function create(){const state=Array.from({length:bucketCount},()=>[]);for(const [key,value] of [[10,100],[17,170],[24,240],[5,50],[8,80]])state[hash(key)].push({key,value});return state;}
  function frames(input,mode,key,value){
    if(!['search','insert','delete'].includes(mode))throw new Error('알 수 없는 연산');
    if(!Number.isInteger(key)||Math.abs(key)>999)throw new Error('키는 -999부터 999까지의 정수로 입력');
    if(mode==='insert' && (!Number.isInteger(value)||Math.abs(value)>999))throw new Error('값은 -999부터 999까지의 정수로 입력');
    const state=clone(input),bucket=hash(key),chain=state[bucket],result=[],visited=[];
    const add=(message,code,activeKey=null,extra={})=>result.push({state:clone(state),message,code,bucket,activeKey,visited:[...visited],...extra});
    add(`키 ${key}의 해시값 계산 · 버킷 ${bucket} 선택`,`h(${key}) = ((${key} % 7) + 7) % 7 = ${bucket}`);
    let index=-1;
    for(let i=0;i<chain.length;i++){
      visited.push(chain[i].key);
      add(`버킷 ${bucket}에서 키 ${chain[i].key}와 ${key} 비교`,`${chain[i].key} === ${key} ?`,chain[i].key);
      if(chain[i].key===key){index=i;break;}
      add('해시값은 같지만 키가 다름 · 체인의 다음 항목 확인','current = current.next',chain[i].key);
    }
    if(mode==='search'){
      if(index>=0)add(`키 ${key} 발견 · 값 ${chain[index].value} 반환`,`get(${key}) → ${chain[index].value}`,key,{returned:chain[index].value});
      else add('체인 끝에 도달 · 해당 키 없음',`get(${key}) → not found`,null,{status:'empty'});
    }else if(mode==='insert'){
      if(index>=0){const old=chain[index].value;chain[index].value=value;add(`기존 키 ${key}의 값 ${old}을 ${value}로 갱신 · 항목 수 유지`,`set(${key}, ${value}) → updated`,key);}
      else if(size(state)>=limit)add('학습용 최대 항목 수 12개 · 기존 키의 값 갱신은 가능','entry limit reached',null,{status:'error'});
      else {
        add(chain.length?'같은 해시값의 다른 키 존재 · 체인 끝에 추가 준비':'빈 버킷 · 첫 항목 연결 준비',`new Entry(${key}, ${value})`);
        chain.push({key,value});add('새 키·값 항목 연결 완료 · 기존 충돌 항목 유지',`set(${key}, ${value}) → inserted`,key);
      }
    }else if(index<0)add('삭제할 키 없음 · 테이블 유지',`delete(${key}) → not found`,null,{status:'empty'});
    else {
      add(`키 ${key} 항목을 제외하도록 앞뒤 연결 변경 준비`,'unlink current',key);
      chain.splice(index,1);add('대상 항목 삭제 완료 · 같은 버킷의 다른 항목 유지',`delete(${key}) → removed`);
    }
    return result;
  }
  return {bucketCount,limit,hash,clone,size,create,frames};
})();
if(typeof module!=='undefined')module.exports=HashTableModel;
