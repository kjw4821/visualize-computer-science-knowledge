'use strict';
mountLesson({
  create:GraphModel.create,clone:GraphModel.clone,summary:s=>`V = ${s.nodes.length} · E = ${s.edges.length}`,
  fields:[{id:'graph-start',modes:['bfs','dfs']},{id:'graph-from',modes:['edit']},{id:'graph-to',modes:['edit']},{id:'graph-action',modes:['edit']}],
  validation:'정점과 간선 연산을 선택',frames:(state,mode,args)=>GraphModel.frames(state,mode,{start:args['graph-start'],from:args['graph-from'],to:args['graph-to'],action:args['graph-action']}),
  modes:{
    bfs:{title:'가까운 정점부터 너비 우선 탐색',description:'큐를 사용해 발견한 이웃을 예약 · 큐에서 꺼낸 순서대로 처리',action:'BFS 시작',complexity:'BFS O(V + E)',explanation:'인접 리스트 기준 · 도달 가능한 정점과 연결된 간선을 확인',hint:'이웃은 알파벳 순서 · 발견 즉시 중복 예약 방지'},
    dfs:{title:'한 경로를 따라 깊이 우선 탐색',description:'이웃을 따라 깊이 이동 · 더 갈 곳이 없으면 이전 호출로 복귀',action:'DFS 시작',complexity:'DFS O(V + E)',explanation:'인접 리스트 기준 · 재귀 호출 스택으로 경로와 복귀 표현',hint:'이웃은 알파벳 순서 · 방문한 정점은 재방문하지 않음'},
    edit:{title:'간선을 바꿔 정점 사이의 연결 변경',description:'무방향 간선은 양쪽 정점을 연결 · 간선을 지우면 그래프가 끊어질 수 있음',action:'간선 변경',complexity:'정점 V · 간선 E',explanation:'고정 정점 6개 · 단순 무방향·비가중 그래프 예시',hint:'중복 간선·자기 루프 제외 · 정점 위치는 연결 구조와 무관'}
  },
  draw(state,frame,mode){
    const svg=document.querySelector('#graph-diagram');svg.replaceChildren();svg.setAttribute('viewBox','0 0 620 310');svg.style.width='620px';
    const positions={A:[85,145],B:[225,65],C:[225,235],D:[385,65],E:[385,235],F:[535,145]};
    svg.setAttribute('aria-label',`무방향 그래프 · ${state.edges.map(e=>e.join('–')).join(', ')} · 처리 순서 ${(frame?.order||[]).join(', ')}`);
    state.edges.forEach(([a,b])=>{
      const [x1,y1]=positions[a],[x2,y2]=positions[b];
      const active=frame?.edge?.includes(a)&&frame.edge.includes(b);
      svg.append(lessonSvg('line',{x1,y1,x2,y2,class:`tree-edge${active?' graph-edge-active':''}`}));
    });
    state.nodes.forEach(id=>{
      const [x,y]=positions[id],g=lessonSvg('g',{class:`tree-node${frame?.visited.includes(id)?' visited':''}${frame?.active.includes(id)?' active':''}`});
      g.append(lessonSvg('circle',{cx:x,cy:y,r:25}),lessonSvg('text',{x,y:y+5,class:'tree-data'},id));svg.append(g);
    });
    document.querySelector('#lesson-size').textContent=`정점 ${state.nodes.length}개 · 간선 ${state.edges.length}개`;
    document.querySelector('#lesson-summary').textContent='진한 색: 현재 대상 · 연한 색: 발견한 정점';
    document.querySelector('#graph-order').textContent=(frame?.order||[]).join(' → ')||'—';
    document.querySelector('#graph-frontier-title').textContent=mode==='dfs'?'호출 스택 · 오른쪽이 TOP':'대기 큐 · 왼쪽부터 처리';
    document.querySelector('#graph-frontier').textContent=mode==='edit'?'—':`[${(frame?.frontier||[]).join(', ')}]`;
    document.querySelector('#graph-adjacency').replaceChildren(...state.nodes.map(id=>{const li=document.createElement('li');li.textContent=`${id} → ${GraphModel.neighbors(state,id).join(', ')||'없음'}`;return li;}));
  }
});
