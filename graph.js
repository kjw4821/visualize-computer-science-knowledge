'use strict';
(()=>{
  const $=s=>document.querySelector(s),state=GraphModel.create(),player=new StepPlayer(2000),tabs=[...document.querySelectorAll('[data-mode]')];
  $('#graph-node').value='A';$('#graph-direction').value='undirected';$('#step-auto').checked=true;
  let mode='basics',steps=[],cursor=0;
  const info={basics:['정점과 간선, 차수','정점은 대상, 간선은 관계 · 정점을 선택해 연결된 간선과 차수 확인','정점과 간선의 개수','무방향 그래프에서 모든 정점의 차수 합은 간선 수의 두 배'],direction:['무방향·방향 그래프','같은 연결 구조에서 방향 유무를 전환 · 진입·진출 차수 비교','방향에 따른 연결 관계','방향 그래프에서 진입 차수의 합과 진출 차수의 합은 각각 간선 수와 동일'],weight:['가중치 그래프','간선에 거리·시간·비용 등의 값을 저장 · 예시는 거리(km)','가중치와 차수','차수는 연결된 간선의 개수 · 가중치는 각 연결에 부여한 값']};
  const svgEl=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;};
  function render(){
    const f=steps[cursor],node=$('#graph-node').value,directed=mode==='direction'&&$('#graph-direction').value==='directed',d=GraphModel.degree(state,node),svg=$('#graph-diagram');
    const pos={A:[85,145],B:[225,65],C:[225,235],D:[385,65],E:[385,235],F:[535,145]};
    svg.replaceChildren();svg.setAttribute('viewBox','0 0 620 310');svg.style.width='620px';
    const defs=svgEl('defs',{}),marker=svgEl('marker',{id:'graph-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});marker.append(svgEl('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'context-stroke'}));defs.append(marker);svg.append(defs);
    const highlighted=f?.edges||state.edges.filter(e=>e[0]===node||e[1]===node);
    state.edges.forEach(e=>{const [a,b,w]=e,[x,y]=pos[a],[u,v]=pos[b],len=Math.hypot(u-x,v-y),dx=(u-x)/len,dy=(v-y)/len,active=highlighted.some(h=>h[0]===a&&h[1]===b);
      svg.append(svgEl('line',{x1:x+dx*27,y1:y+dy*27,x2:u-dx*29,y2:v-dy*29,class:`tree-edge${active?' graph-edge-active':''}`,...(directed?{'marker-end':'url(#graph-arrow)'}:{})}));
      if(mode==='weight'){const t=svgEl('text',{x:(x+u)/2-dy*14,y:(y+v)/2+dx*14,'text-anchor':'middle',fill:'#69458e','font-size':14,stroke:'white','stroke-width':5,'paint-order':'stroke'},`${w} km`);svg.append(t);}
    });
    state.nodes.forEach(id=>{const [x,y]=pos[id],g=svgEl('g',{class:`tree-node${(f?.active||[node]).includes(id)?' active':''}`});g.append(svgEl('circle',{cx:x,cy:y,r:25}),svgEl('text',{x,y:y+5,class:'tree-data'},id));if(mode==='basics')g.append(svgEl('text',{x,y:y-36,'text-anchor':'middle',fill:'#806096','font-size':13},`차수 ${GraphModel.degree(state,id).total}`));svg.append(g);});
    svg.setAttribute('aria-label',`${directed?'방향':'무방향'}${mode==='weight'?' 가중치':''} 그래프. ${node} 차수 ${d.total}. ${state.edges.map(([a,b,w])=>`${a}${directed?'에서':'와'} ${b}${mode==='weight'?` ${w} km`:''}`).join(', ')}`);
    $('#graph-kind').textContent=mode==='weight'?'WEIGHTED GRAPH':directed?'DIRECTED GRAPH':'UNDIRECTED GRAPH';
    $('#lesson-size').textContent=`정점 ${state.nodes.length}개 · 간선 ${state.edges.length}개`;
    $('#lesson-summary').textContent='보라색: 현재 설명 중인 정점·간선';
    $('#graph-degree').textContent=directed?`${node} · 진입 ${d.incoming} / 진출 ${d.outgoing}`:`${node} · 차수 ${d.total}`;
    $('#graph-relation').textContent=mode==='weight'?'숫자: 두 정점 사이의 거리(km)':directed?'A → B가 있어도 B → A를 의미하지 않음':'A — B는 A와 B의 상호 연결';
    $('#graph-list-title').textContent=directed?'진입·진출 차수':mode==='weight'?'인접 정점과 거리':'인접 정점과 차수';
    $('#graph-adjacency').replaceChildren(...state.nodes.map(id=>{const li=document.createElement('li'),n=GraphModel.degree(state,id);li.textContent=directed?`${id} · 진입 ${n.incoming} / 진출 ${n.outgoing}`:mode==='weight'?`${id}: ${state.edges.filter(e=>e[0]===id||e[1]===id).map(([a,b,w])=>`${a===id?b:a} (${w} km)`).join(', ')}`:`${id}: ${GraphModel.neighbors(state,id).join(', ')} · 차수 ${n.total}`;return li;}));
    $('.array-feedback').hidden=!f;$('#array-code').textContent=f?.code||'';$('#array-message').textContent=f?.message||'';
    $('#step-controls').hidden=!f;$('#step-count').textContent=`${cursor+1} / ${steps.length}`;$('#step-prev').disabled=cursor===0;$('#step-next').disabled=cursor>=steps.length-1;
    const running=!!f&&cursor<steps.length-1,auto=$('#step-auto').checked;
    $('#step-status').textContent=running?(auto?'자동 진행':'수동 진행'):'설명 완료';
    const fill=document.createElement('span');fill.className=`step-progress-fill ${running?(auto?'running':'manual'):'complete'}`;fill.style.animationDuration='2s';if(running&&!auto)fill.style.transform=`scaleX(${(cursor+1)/steps.length})`;$('#step-progress').replaceChildren(fill);$('#step-progress').setAttribute('aria-label',running?(auto?'다음 단계까지 2초':'수동 진행'):'설명 완료');
    $('#lesson-reset').textContent=!f?'시작':running?'↻ 초기화':'다시 시작';
  }
  function play(){player.stop();if($('#step-auto').checked&&steps.length&&cursor<steps.length-1)player.play(()=>{cursor++;render();return cursor<steps.length-1;});}
  function reset(){player.stop();steps=[];cursor=0;render();}
  function change(next){mode=next;tabs.forEach(t=>{const yes=t.dataset.mode===mode;t.setAttribute('aria-selected',String(yes));t.tabIndex=yes?0:-1;});$('#lesson-panel').setAttribute('aria-labelledby',`tab-${mode}`);const i=info[mode];$('#concept-title').textContent=i[0];$('#concept-description').textContent=i[1];$('#complexity-title').textContent=i[2];$('#complexity-description').textContent=i[3];$('#graph-direction-field').hidden=mode!=='direction';reset();}
  tabs.forEach((t,i)=>{t.addEventListener('click',()=>change(t.dataset.mode));t.addEventListener('keydown',e=>{const j=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:e.key==='Home'?0:e.key==='End'?2:null;if(j!==null){e.preventDefault();change(tabs[j].dataset.mode);tabs[j].focus();}});});
  $('#lesson-form').addEventListener('submit',e=>e.preventDefault());['#graph-node','#graph-direction'].forEach(s=>$(s).addEventListener('change',reset));
  $('#lesson-reset').addEventListener('click',()=>{if(steps.length&&cursor<steps.length-1){reset();return;}steps=GraphModel.frames(state,mode,{node:$('#graph-node').value,directed:$('#graph-direction').value==='directed'});cursor=0;render();play();});
  [['#step-prev',-1],['#step-next',1]].forEach(([s,delta])=>$(s).addEventListener('click',()=>{cursor+=delta;render();play();}));$('#step-auto').addEventListener('change',()=>{render();play();});change(mode);
})();
