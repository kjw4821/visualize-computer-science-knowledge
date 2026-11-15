'use strict';
const GraphModel = (() => {
  const create=()=>({nodes:['A','B','C','D','E','F'],edges:[['A','B',4],['A','C',2],['B','D',5],['C','D',3],['C','E',6],['E','F',1]]});
  const clone=s=>({nodes:[...s.nodes],edges:s.edges.map(e=>[...e])});
  const incident=(s,id)=>s.edges.filter(([a,b])=>a===id||b===id);
  const neighbors=(s,id,directed=false)=>s.edges.filter(([a,b])=>a===id||(!directed&&b===id)).map(([a,b])=>a===id?b:a).sort();
  const degree=(s,id)=>({total:incident(s,id).length,incoming:s.edges.filter(e=>e[1]===id).length,outgoing:s.edges.filter(e=>e[0]===id).length});
  function frames(s,mode,{node='A',directed=false}={}){
    if(!['basics','direction','weight'].includes(mode)||!s.nodes.includes(node))throw new Error('학습 종류와 정점 확인');
    const d=degree(s,node),base={state:clone(s),node,directed:mode==='direction'&&directed,edges:[],active:[]};
    const frame=(message,code,extra={})=>({...base,state:clone(s),message,code,...extra});
    if(mode==='basics')return [frame('정점은 관계의 대상 · A–F는 서로 다른 개체','G = (V, E)',{active:s.nodes}),frame('간선은 두 정점 사이의 관계 · 화살표가 없으면 무방향 연결',`|V| = ${s.nodes.length}, |E| = ${s.edges.length}`,{edges:s.edges}),frame(`${node}에 연결된 간선 ${d.total}개 · 이 개수가 정점의 차수`,`deg(${node}) = ${d.total}`,{active:[node],edges:incident(s,node)})];
    if(mode==='direction')return [frame(directed?'화살표의 시작점에서 끝점으로 향하는 관계':'화살표 없는 간선 하나가 양쪽의 연결을 표현',directed?'A → B ≠ B → A':'A — B = B — A',{edges:s.edges}),frame(directed?`${node}에서 나가는 간선 ${d.outgoing}개 · 진출 차수`:`${node}의 인접 정점: ${neighbors(s,node).join(', ')}`,directed?`outdegree(${node}) = ${d.outgoing}`:`deg(${node}) = ${d.total}`,{active:[node],edges:directed?s.edges.filter(e=>e[0]===node):incident(s,node)}),frame(directed?`${node}로 들어오는 간선 ${d.incoming}개 · 진입 차수`:'무방향에서는 진입·진출을 나누지 않고 차수로 표현',directed?`indegree(${node}) = ${d.incoming}`:'Σ deg(v) = 2|E|',{active:[node],edges:directed?s.edges.filter(e=>e[1]===node):s.edges})];
    return [frame('간선의 숫자는 두 정점 사이의 거리 · 단위 km','w(A, B) = 4 km',{edges:[s.edges[0]]}),frame(`${node}에 연결된 거리 확인 · 간선의 수와 가중치의 합은 다른 값`,`deg(${node}) = ${d.total}`,{active:[node],edges:incident(s,node)}),frame('거리 외에도 소요 시간·요금·비용 등을 간선에 저장 가능','weight = distance / time / cost',{edges:s.edges})];
  }
  return {create,clone,neighbors,degree,frames};
})();
if(typeof module!=='undefined')module.exports=GraphModel;
