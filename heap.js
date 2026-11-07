'use strict';
mountLesson({
  create:HeapModel.create,clone:HeapModel.clone,summary:s=>`heap = [${s.join(', ')}]`,
  fields:[{id:'heap-value',modes:['insert']}],validation:'값은 -999부터 999까지의 정수로 입력',
  frames:(state,mode,args)=>HeapModel.frames(state,mode,Number(args['heap-value'])),
  modes:{
    peek:{title:'루트에서 최솟값 조회',description:'최소 힙은 모든 부모 값이 자식 이하 · 좌우 형제 사이에는 정렬 규칙 없음',action:'Peek · 조회',complexity:'조회 O(1)',explanation:'전체 최솟값이 항상 루트에 위치',hint:'루트 값 조회 · 데이터 유지'},
    insert:{title:'마지막 위치에 추가한 뒤 위로 이동',description:'완전 이진 트리 모양을 유지하며 추가 · 부모보다 작으면 교환 반복',action:'삽입 시작',complexity:'삽입 O(log n)',explanation:'완전 이진 트리 높이만큼 부모와 비교하며 이동',hint:'입력 값 -999–999 · 정수 · 중복 값 허용'},
    extract:{title:'루트를 추출한 뒤 아래로 이동',description:'마지막 노드를 루트에 배치 · 더 작은 자식과 교환하며 최소 힙 조건 복원',action:'최솟값 추출',complexity:'추출 O(log n)',explanation:'루트 교체 후 최대 트리 높이만큼 아래로 이동',hint:'빈 힙과 학습용 최대 15개 상태 안내 제공'}
  },
  draw(values,frame){
    const svg=document.querySelector('#heap-diagram');svg.replaceChildren();
    const depth=values.length?Math.floor(Math.log2(values.length)):-1;
    const width=Math.max(560,Math.pow(2,Math.max(0,depth))*70),height=Math.max(180,125+depth*95);
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.width=`${width}px`;
    svg.setAttribute('aria-label',values.length?`최소 힙 · 배열 ${values.join(', ')} · 루트 ${values[0]}`:'빈 힙');
    const points=values.map((_,i)=>{const level=Math.floor(Math.log2(i+1)),rank=i-(Math.pow(2,level)-1);return {x:width*(rank+.5)/Math.pow(2,level),y:60+level*95};});
    if(!values.length)svg.append(lessonSvg('text',{x:width/2,y:85,class:'tree-empty'},'Empty heap'));
    values.forEach((value,i)=>{
      const p=points[i];if(i){const parent=points[Math.floor((i-1)/2)];svg.append(lessonSvg('line',{x1:parent.x,y1:parent.y+23,x2:p.x,y2:p.y-23,class:'tree-edge'}));}
    });
    values.forEach((value,i)=>{
      const p=points[i],g=lessonSvg('g',{class:`tree-node${frame?.active.includes(i)?' active':''}`});
      g.append(lessonSvg('circle',{cx:p.x,cy:p.y,r:23}),lessonSvg('text',{x:p.x,y:p.y+5,class:'tree-data'},value),lessonSvg('text',{x:p.x,y:p.y+40,class:'tree-role'},`[${i}]`));svg.append(g);
    });
    document.querySelector('#heap-array').replaceChildren(...values.map((value,i)=>{
      const cell=document.createElement('span');cell.className=`heap-array-cell${frame?.active.includes(i)?' active':''}`;cell.textContent=`[${i}] ${value}`;return cell;
    }));
    document.querySelector('#lesson-size').textContent=`노드 수 ${values.length} / 학습용 최대 15개`;
    document.querySelector('#lesson-summary').textContent=frame?.returned!==undefined?`조회·추출 값 ${frame.returned}`:`루트 ${values[0]??'없음'}`;
  }
});
