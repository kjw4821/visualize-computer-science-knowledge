'use strict';
mountLesson({
  create:HashTableModel.create,clone:HashTableModel.clone,summary:s=>`buckets = 7 · entries = ${HashTableModel.size(s)}`,
  fields:[{id:'hash-key',modes:['search','insert','delete']},{id:'hash-value',modes:['insert']}],
  validation:'키와 값은 -999부터 999까지의 정수로 입력',
  frames:(state,mode,args)=>HashTableModel.frames(state,mode,Number(args['hash-key']),Number(args['hash-value'])),
  modes:{
    search:{title:'해시값으로 버킷을 찾고 키 비교',description:'해시 함수로 버킷 선택 · 충돌한 항목은 체인을 따라 키를 비교',action:'탐색 시작',complexity:'평균 O(1 + α) · 최악 O(n)',explanation:'α = 항목 수 / 버킷 수 · 키가 고르게 분산되고 α를 작게 유지하면 평균 O(1)',hint:'예시 충돌 키 10 · 17 · 24 → 버킷 3'},
    insert:{title:'새 항목 삽입 또는 기존 값 갱신',description:'같은 키는 값을 갱신 · 다른 키의 해시값이 같으면 체인에 추가',action:'삽입·갱신 시작',complexity:'평균 O(1 + α) · 최악 O(n)',explanation:'기존 키를 확인한 뒤 갱신 또는 연결 · 체인이 길어질수록 비교 횟수 증가',hint:'키와 값 -999–999 · 정수 · 기존 키 갱신 시 항목 수 유지'},
    delete:{title:'키를 찾아 체인에서 항목 제거',description:'해시값으로 버킷 선택 · 일치하는 키만 제거하고 다른 항목 유지',action:'삭제 시작',complexity:'평균 O(1 + α) · 최악 O(n)',explanation:'체인에서 일치하는 항목 탐색 후 연결 변경',hint:'없는 키는 테이블을 변경하지 않음'}
  },
  draw(state,frame){
    document.querySelector('#hash-buckets').replaceChildren(...state.map((chain,index)=>{
      const row=document.createElement('div');row.className=`hash-row${frame?.bucket===index?' selected':''}`;
      const label=document.createElement('span');label.className='hash-index';label.textContent=`[${index}]`;
      const list=document.createElement('div');list.className='hash-chain';
      chain.forEach(entry=>{
        const arrow=document.createElement('span');arrow.className='hash-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');
        const card=document.createElement('div');card.className=`hash-entry${frame?.visited.includes(entry.key)?' visited':''}${frame?.activeKey===entry.key?' active':''}`;
        const key=document.createElement('span');key.textContent=`key ${entry.key}`;
        const value=document.createElement('strong');value.textContent=`value ${entry.value}`;
        card.setAttribute('aria-label',`키 ${entry.key}, 값 ${entry.value}`);card.append(key,value);list.append(arrow,card);
      });
      const end=document.createElement('span');end.className='hash-null';end.textContent='→ null';list.append(end);
      row.setAttribute('aria-label',`버킷 ${index} · ${chain.length}개 항목`);row.append(label,list);return row;
    }));
    const count=HashTableModel.size(state);
    document.querySelector('#lesson-size').textContent=`버킷 7개 · 항목 ${count}개 / 학습용 최대 12개`;
    document.querySelector('#lesson-summary').textContent=`부하율 α = ${count}/7 ≈ ${(count/7).toFixed(2)}`;
    document.querySelector('#hash-result').textContent=frame?`선택 버킷 [${frame.bucket}]${frame.returned!==undefined?` · 반환 값 ${frame.returned}`:''}`:'해시값 = 버킷 번호 · 0–6';
  }
});
