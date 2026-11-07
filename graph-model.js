'use strict';
const GraphModel = (() => {
  const create=()=>({nodes:['A','B','C','D','E','F'],edges:[['A','B'],['A','C'],['B','D'],['C','D'],['C','E'],['E','F']]});
  const clone=s=>({nodes:[...s.nodes],edges:s.edges.map(e=>[...e])});
  const neighbors=(s,id)=>s.edges.filter(e=>e.includes(id)).map(e=>e[0]===id?e[1]:e[0]).sort();
  function frames(input,mode,options) {
    if(!['bfs','dfs','edit'].includes(mode))throw new Error('알 수 없는 연산');
    const state=clone(input),result=[],visited=[],order=[],frontier=[];
    const add=(message,code,active=[],extra={})=>result.push({state:clone(state),message,code,active:[...active],visited:[...visited],order:[...order],frontier:[...frontier],...extra});
    if(mode==='edit'){
      const {from,to,action}=options;
      if(!state.nodes.includes(from)||!state.nodes.includes(to))throw new Error('존재하는 정점을 선택');
      if(from===to){add('이 예시는 자기 자신을 연결하는 간선을 허용하지 않음','self-loop rejected',[],{status:'error'});return result;}
      if(!['add','remove'].includes(action))throw new Error('간선 연산을 선택');
      const pair=[from,to].sort(),index=state.edges.findIndex(e=>e.includes(from)&&e.includes(to));
      add(`${from}–${to} 간선 확인`,`${action}Edge(${from}, ${to})`,[from,to],{edge:pair});
      if(action==='add' && index>=0)add('이미 존재하는 간선 · 그래프 유지','duplicate edge',[from,to],{status:'empty'});
      else if(action==='remove' && index<0)add('제거할 간선 없음 · 그래프 유지','edge not found',[from,to],{status:'empty'});
      else {
        if(action==='add')state.edges.push(pair);else state.edges.splice(index,1);
        add(`무방향 간선 ${from}–${to} ${action==='add'?'추가':'삭제'} 완료 · 양쪽 정점의 연결에 반영`,'edge update complete',[from,to],{edge:pair});
      }
      return result;
    }
    const start=options.start;if(!state.nodes.includes(start))throw new Error('시작 정점을 선택');
    if(mode==='bfs'){
      visited.push(start);frontier.push(start);
      add(`시작 정점 ${start} 방문 예약 · 큐에 추가`,`queue.enqueue(${start})`,[start]);
      while(frontier.length){
        const current=frontier.shift();order.push(current);
        add(`큐 맨 앞 ${current}을 꺼내 처리`,`queue.dequeue() → ${current}`,[current]);
        for(const next of neighbors(state,current)){
          if(visited.includes(next)){add(`${next}은 이미 발견한 정점 · 중복 예약 생략`,'already discovered',[current,next],{edge:[current,next]});continue;}
          visited.push(next);frontier.push(next);
          add(`이웃 ${next}을 발견 · 큐 뒤에 추가`,`queue.enqueue(${next})`,[next],{edge:[current,next]});
        }
      }
    } else {
      function visit(current){
        visited.push(current);order.push(current);frontier.push(current);
        add(`정점 ${current} 방문 · 호출 스택에 추가`,`visit(${current})`,[current]);
        for(const next of neighbors(state,current)){
          if(visited.includes(next)){add(`${next}은 이미 방문한 정점 · 재방문 생략`,'already visited',[current,next],{edge:[current,next]});continue;}
          add(`이웃 ${next}으로 더 깊이 이동`,`dfs(${next})`,[current,next],{edge:[current,next]});visit(next);
        }
        frontier.pop();add(`${current} 탐색 종료 · 이전 호출로 복귀`,'return',[...(frontier.length?[frontier.at(-1)]:[])]);
      }
      visit(start);
    }
    const unreachable=state.nodes.filter(n=>!visited.includes(n));
    add(unreachable.length?`탐색 완료 · 시작점에서 도달 불가: ${unreachable.join(', ')}`:'탐색 완료 · 모든 정점 도달',`${mode.toUpperCase()}: ${order.join(' → ')}`,[],{unreachable});
    return result;
  }
  return {create,clone,neighbors,frames};
})();
if(typeof module!=='undefined')module.exports=GraphModel;
