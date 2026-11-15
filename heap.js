'use strict';
let heapDiagram = null;
mountLesson({
  interval:1000,unified:true,reset(){heapDiagram=null;},
  create:HeapModel.create,clone:HeapModel.clone,summary:s=>`heap = [${s.join(', ')}]`,
  fields:[{id:'heap-value',modes:['insert']}],validation:'값은 -999부터 999까지의 정수로 입력',
  frames:(state,mode,args)=>HeapModel.frames(state,mode,Number(args['heap-value'])),
  modes:{
    peek:{title:'루트에서 최솟값 조회',description:'최소 힙은 모든 부모 값이 자식 이하 · 좌우 형제 사이에는 정렬 규칙 없음',action:'Peek · 조회',complexity:'조회 O(1)',explanation:'전체 최솟값이 항상 루트에 위치',hint:'루트 값 조회 · 데이터 유지'},
    insert:{title:'마지막 위치에 추가한 뒤 위로 이동',description:'완전 이진 트리 모양을 유지하며 추가 · 부모보다 작으면 교환 반복',action:'삽입 시작',complexity:'삽입 O(log n)',explanation:'완전 이진 트리 높이만큼 부모와 비교하며 이동',hint:'입력 값 -999–999 · 정수 · 중복 값 허용'},
    extract:{title:'루트를 추출한 뒤 아래로 이동',description:'마지막 노드를 루트에 배치 · 더 작은 자식과 교환하며 최소 힙 조건 복원',action:'최솟값 추출',complexity:'추출 O(log n)',explanation:'루트 교체 후 최대 트리 높이만큼 아래로 이동',hint:'빈 힙과 학습용 최대 15개 상태 안내 제공'}
  },
  draw(values,frame){
    const svg=document.querySelector('#heap-diagram');
    if(!heapDiagram){svg.replaceChildren();heapDiagram={edges:[],nodes:[],cells:[]};document.querySelector('#heap-array').replaceChildren();}
    const layoutCount=Math.max(values.length,frame?.move?frame.move.from+1:0);
    const depth=layoutCount?Math.floor(Math.log2(layoutCount)):-1;
    const width=Math.max(560,Math.pow(2,Math.max(0,depth))*70),height=Math.max(180,125+depth*95);
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.width=`${width}px`;
    svg.setAttribute('aria-label',values.length?`최소 힙 · 배열 ${values.join(', ')} · 루트 ${values[0]}`:'빈 힙');
    const points=Array.from({length:layoutCount},(_,i)=>{const level=Math.floor(Math.log2(i+1)),rank=i-(Math.pow(2,level)-1);return {x:width*(rank+.5)/Math.pow(2,level),y:60+level*95};});
    if(!heapDiagram.empty){heapDiagram.empty=lessonSvg('text',{x:width/2,y:85,class:'tree-empty'},'Empty heap');svg.append(heapDiagram.empty);}
    heapDiagram.empty.style.opacity=values.length?'0':'1';
    heapDiagram.nodes.forEach(n=>{n.g.style.opacity='0';n.g.setAttribute('aria-hidden','true');});
    heapDiagram.cells.forEach(c=>c.hidden=true);heapDiagram.edges.forEach(e=>e.style.opacity='0');
    for(let i=0;i<values.length;i++){
      const token=frame?.ids[i]??i;
      if(!heapDiagram.nodes[token]){
        const g=lessonSvg('g',{class:'tree-node'}),text=lessonSvg('text',{x:0,y:5,class:'tree-data'});
        g.append(lessonSvg('circle',{cx:0,cy:0,r:23}),text,lessonSvg('text',{x:0,y:40,class:'tree-role'},`[${i}]`));svg.append(g);
        heapDiagram.nodes[token]={g,text};
      }
      if(!heapDiagram.cells[i]){const cell=document.createElement('span');document.querySelector('#heap-array').append(cell);heapDiagram.cells[i]=cell;}
      if(i&&!heapDiagram.edges[i]){const line=lessonSvg('line',{class:'tree-edge'});svg.append(line);heapDiagram.edges[i]=line;}
      const {g,text}=heapDiagram.nodes[token],p=points[i],cell=heapDiagram.cells[i];
      g.style.opacity=p?'1':'0';g.setAttribute('aria-hidden',String(!p));cell.hidden=!p;
      if(p){g.style.transform=`translate(${p.x}px, ${p.y}px)`;text.textContent=values[i];g.children[2].textContent=`[${i}]`;g.setAttribute('class',`tree-node${frame?.active.includes(i)?' active':''}`);cell.className=`heap-array-cell${frame?.active.includes(i)?' active':''}`;cell.textContent=`[${i}] ${values[i]}`;}
      if(i){const line=heapDiagram.edges[i];line.style.opacity=p?'1':'0';if(p){const parent=points[Math.floor((i-1)/2)],dx=p.x-parent.x,dy=p.y-parent.y,len=Math.hypot(dx,dy);Object.entries({x1:parent.x+dx/len*23,y1:parent.y+dy/len*23,x2:p.x-dx/len*23,y2:p.y-dy/len*23}).forEach(([k,v])=>line.setAttribute(k,v));}}
    }
    if(!heapDiagram.arrow){
      const defs=lessonSvg('defs',{}),marker=lessonSvg('marker',{id:'heap-move-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});
      marker.append(lessonSvg('path',{d:'M 0 0 L 10 5 L 0 10 Z',fill:'#8550ba'}));defs.append(marker);
      const arrow=lessonSvg('path',{class:'heap-move',fill:'none','marker-end':'url(#heap-move-arrow)'});
      const label=lessonSvg('text',{class:'heap-move-label'});
      const layer=lessonSvg('g',{'aria-hidden':'true'});layer.append(arrow,label);svg.append(defs,layer);
      heapDiagram.arrow=arrow;heapDiagram.arrowLabel=label;heapDiagram.arrowLayer=layer;
    }
    const {arrow,arrowLabel,arrowLayer}=heapDiagram;
    arrowLayer.style.opacity=frame?.move?'1':'0';
    if(frame?.move){
      const {from,to,swap}=frame.move,a=points[from],b=points[to];
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
      const start={x:a.x+ux*30,y:a.y+uy*30},end={x:b.x-ux*30,y:b.y-uy*30};
      const cx=(start.x+end.x)/2-uy*40,cy=(start.y+end.y)/2+ux*40;
      arrow.setAttribute('d',`M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`);
      if(swap)arrow.setAttribute('marker-start','url(#heap-move-arrow)');else arrow.removeAttribute('marker-start');
      arrowLabel.setAttribute('x',(start.x+2*cx+end.x)/4-uy*12);arrowLabel.setAttribute('y',(start.y+2*cy+end.y)/4+ux*12);
      arrowLabel.textContent='';
      svg.setAttribute('aria-label',`최소 힙 · 배열 ${values.join(', ')} · ${swap?'교환':'이동'}: 인덱스 ${from}${swap?'와':'에서'} ${to}${swap?' 사이':' 방향'}`);
    }
    document.querySelector('#lesson-size').textContent=`노드 수 ${values.length} / 학습용 최대 15개`;
    document.querySelector('#lesson-summary').textContent=frame?.returned!==undefined?`조회·추출 값 ${frame.returned}`:`루트 ${values[0]??'없음'}`;
  }
});
