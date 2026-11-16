'use strict';
// Pure lesson frames: the view never mutates a previous step.
function analysisFrames(mode, n, example) {
  const frame=(code,message,count=0,extra={})=>({code,message,count,...extra});
  if(mode==='time'){
    const quadratic=example==='nested', total=quadratic?n*n:n;
    const frames=[frame(quadratic?'for (i=0; i<n; i++)\n  for (j=0; j<n; j++) visit(a[i], a[j]);':'for (i=0; i<n; i++) visit(a[i]);','반복문 준비 · visit 호출 횟수를 셈',0,{total,quadratic})];
    for(let i=1;i<=total;i++)frames.push(frame(quadratic?`i = ${Math.floor((i-1)/n)}, j = ${(i-1)%n}; visit(a[i], a[j]);`:`i = ${i-1}; visit(a[i]);`,`주요 연산 ${i} / ${total}회`,i,{total,quadratic}));
    frames.push(frame(quadratic?'T(n) = n × n ∈ Θ(n²);':'T(n) = n ∈ Θ(n);',`완료 · n=${n}일 때 ${total}회. 반복 제어 비용을 포함해도 차수는 동일`,total,{total,quadratic}));return frames;
  }
  if(mode==='space'){
    const array=example==='array',recursive=example==='recursive', peak=array?n+1:recursive?n:2;
    const frames=[frame(array?'int i; int buffer[n];':recursive?'solve(n): solve(n-1);':'int i; int sum = 0;','보조 공간만 계산 · 입력 배열은 제외',0,{peak})];
    const size=array?n:recursive?n:1;
    for(let i=1;i<=size;i++)frames.push(frame(array?`buffer[${i-1}] = a[${i-1}];`:recursive?`solve(${n-i+1}) → 다음 호출`:'sum += a[i];',array?'배열 n칸과 반복 변수 1칸을 함께 유지':recursive?`반환 전 호출 프레임 ${i}개 유지 · 프레임당 고정 크기 가정`:'입력 크기와 무관하게 반복 변수와 합계 2칸 재사용',array?peak:recursive?i:2,{peak}));
    if(recursive)for(let i=n-1;i>=0;i--)frames.push(frame('return;','호출 반환으로 스택 해제 · 복잡도는 최대 사용량 기준',i,{peak}));
    frames.push(frame(`S_aux(n) = ${array?'n + 1':recursive?'n':'2'} ∈ Θ(${array||recursive?'n':'1'});`,`최대 보조 공간 ${peak}칸${recursive?' · 꼬리 호출 최적화 없는 실행 모델':''}. 입력 배열 n칸까지 포함한 전체 공간은 Θ(n)`,recursive?0:peak,{peak}));return frames;
  }
  if(mode==='bounds')return [frame('f(n) = 2n + 3; g(n) = n;','동일한 함수 f(n)의 상한·하한을 비교',0,{bound:0}),frame('f(n) ≤ 3n  (n ≥ 3)','O(n): c=3, n₀=3 이후 f(n)이 상한 3n 아래에 위치',0,{bound:1}),frame('2n ≤ f(n)  (n ≥ 3)','Ω(n): c=2, n₀=3 이후 f(n)이 하한 2n 위에 위치',0,{bound:2}),frame('2n ≤ 2n+3 ≤ 3n  (n ≥ 3)','Θ(n): 같은 차수의 상한과 하한을 모두 만족',0,{bound:3}),frame('f(n) ∈ O(n²) 도 참; f(n) ∈ Θ(n);','O는 꼭 가장 타이트한 상한일 필요 없음. 최선·평균·최악은 분석 경우이며 O·Ω·Θ와 별개',0,{bound:3})];
  return [frame('T(n) = 3n² + 2n + 5;','다항식의 각 항을 입력 크기에 따라 비교',0,{compare:0}),frame('T(n) / n² = 3 + 2/n + 5/n²;','n이 커질수록 낮은 차수 항의 비중 감소',0,{compare:1}),frame('T(n) ∈ Θ(n²);','상수 계수와 낮은 차수 항을 생략한 증가 차수',0,{compare:2}),frame('1, log₂ n, n, n log₂ n, n², 2ⁿ','대표 증가율 비교 · 작은 입력의 실제 속도는 상수와 구현에도 영향받음',0,{compare:3})];
}
// Deadlines are measured from one origin, so delayed renders do not add drift.
class AnalysisTimeline {
  constructor(clock={now:()=>performance.now(),set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}) {
    this.clock=clock;this.timer=null;this.generation=0;
  }
  stop(){this.generation++;if(this.timer!==null)this.clock.clear(this.timer);this.timer=null;}
  play(length,cursor,draw){
    this.stop();if(cursor>=length-1)return;
    const generation=this.generation,origin=this.clock.now(),interval=7000/(length-1),base=cursor;
    const tick=()=>{
      if(generation!==this.generation)return;
      this.timer=null;
      const elapsed=this.clock.now()-origin;
      const next=Math.min(length-1,base+Math.floor((elapsed+0.000001)/interval));
      if(next>cursor){cursor=next;draw(cursor);}
      if(generation!==this.generation||cursor>=length-1)return;
      this.timer=this.clock.set(tick,Math.max(1,(cursor-base+1)*interval-(this.clock.now()-origin)));
    };
    this.timer=this.clock.set(tick,interval);
  }
}
if(typeof module!=='undefined')module.exports={analysisFrames,AnalysisTimeline};
if(typeof document!=='undefined'){
const $=s=>document.querySelector(s), tabs=[...document.querySelectorAll('[data-mode]')],player=new StepPlayer(1000),timeline=new AnalysisTimeline();
let mode='time',frames=[],cursor=0,automatic=true;
const topics={time:['시간 복잡도','단일 반복문과 중첩 반복문의 주요 연산 횟수','단일 반복 Θ(n) · 중첩 반복 Θ(n²)','이 예제는 모든 입력에서 같은 횟수 실행 · visit은 상수 시간으로 가정 · 자동 시각화는 전체 7초이며 실제 알고리즘 실행 시간이 아님'],space:['공간 복잡도','변수·추가 배열·재귀 호출 스택의 최대 동시 사용량','보조 공간 Θ(1) 또는 Θ(n)','입력 배열 n칸은 보조 공간에서 제외 · 전체 공간과 보조 공간을 구분'],bounds:['점근적 표기법','충분히 큰 입력에서 함수를 둘러싸는 경계','O: 상한 · Ω: 하한 · Θ: 양쪽 경계','양의 상수 c와 기준 n₀의 존재로 정의 · O=최악, Ω=최선, Θ=평균이라는 대응은 잘못된 해석'],compare:['비교 및 적용','낮은 차수 항과 상수 계수를 생략하여 증가율 비교','3n² + 2n + 5 ∈ Θ(n²)','표의 숫자는 증가율 함수값 · 실제 실행 시간이나 서로 다른 알고리즘의 정확한 연산 횟수가 아님']};
const choices={time:[['linear','단일 반복문'],['nested','중첩 반복문']],space:[['constant','고정 변수'],['array','추가 배열'],['recursive','재귀 호출 스택']]};
function stopPlayback(){player.stop();timeline.stop();}
function schedule(){
  stopPlayback();if(!automatic||cursor>=frames.length-1)return;
  if(mode==='time')timeline.play(frames.length,cursor,next=>{cursor=next;render();});
  else player.play(()=>{cursor++;render();return cursor<frames.length-1;});
}
function stepInterval(){return mode==='time'&&frames.length>1?7000/(frames.length-1):1000;}
function cells(n,count,grid=false){const box=document.createElement('div');box.className=grid?'analysis-grid':'analysis-cells';if(grid)box.style.gridTemplateColumns=`repeat(${n}, 24px)`;for(let i=0;i<(grid?n*n:n);i++){const cell=document.createElement('span');cell.className='analysis-cell';cell.textContent=i;box.append(cell);}$('#analysis-visual').replaceChildren(box);highlight(count);}
function highlight(count){document.querySelectorAll('.analysis-cell').forEach((c,i)=>c.classList.toggle('active',i<count));}
function chart(bound){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 540 300');svg.setAttribute('class','analysis-chart');svg.setAttribute('role','img');svg.setAttribute('aria-label','f(n)=2n+3, 상한 3n, 하한 2n 그래프. n=3 이후 양쪽 경계 만족');
 const add=(tag,attrs,text)=>{const el=document.createElementNS(svg.namespaceURI,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text)el.textContent=text;svg.append(el);};
 add('path',{d:'M45 15V260H520',fill:'none',stroke:'#bba6cf'});add('text',{x:480,y:290},'입력 n');add('text',{x:4,y:14},'함수값');
 [0,3,8,16].forEach(x=>{add('text',{x:45+x*28,y:278},String(x));});[0,24,48].forEach(y=>add('text',{x:12,y:264-y*5},String(y)));
 const lines=[['f(n)=2n+3','#8550ba',x=>2*x+3],...(bound===1||bound===3?[['상한 3n','#238d80',x=>3*x]]:[]),...(bound>=2?[['하한 2n','#d17b4c',x=>2*x]]:[])];
 lines.forEach(([label,color,fn])=>add('polyline',{points:Array.from({length:17},(_,x)=>`${45+x*28},${260-fn(x)*5}`).join(' '),stroke:color}));
 add('path',{d:'M129 15V260',stroke:'#aaa','stroke-dasharray':'5 5'});add('text',{x:135,y:28},'n₀=3');const legend=document.createElement('div');legend.className='analysis-legend';lines.forEach(([label,color])=>{const s=document.createElement('span');s.textContent=label;s.style.setProperty('--line',color);legend.append(s);});const records=document.createElement('div');records.className='analysis-bound-records';
 const entries=[
   ['O(n) · 빅 O','상한','f(n) ≤ 3n','c = 3, n₀ = 3','#238d80'],
   ['Ω(n) · 오메가','하한','2n ≤ f(n)','c = 2, n₀ = 3','#d17b4c'],
   ['Θ(n) · 세타','상한과 하한','2n ≤ f(n) ≤ 3n','c₁ = 2, c₂ = 3, n₀ = 3','#8550ba']
 ];
 entries.slice(0,bound).forEach(([notation,meaning,inequality,witness,color])=>{
   const record=document.createElement('section');record.className='analysis-bound-record';record.style.setProperty('--bound-color',color);
   const title=document.createElement('h3');title.textContent=`${notation} — ${meaning}`;
   const formula=document.createElement('code');formula.textContent=inequality;
   const detail=document.createElement('p');detail.textContent=`${witness} · 모든 n ≥ 3에서 성립`;
   record.append(title,formula,detail);records.append(record);
 });
 if(bound)records.setAttribute('aria-label','지금까지 학습한 점근적 표기법 · f(n) = 2n + 3');
 $('#analysis-visual').replaceChildren(svg,legend,records);
}
function compare(stage,n){const table=document.createElement('table');table.className='analysis-table';const rows=stage<3?[['n','3n²','2n+5','T(n)'],...[2,4,8,16].map(x=>[x,3*x*x,2*x+5,3*x*x+2*x+5])]:[['n','1','log₂ n','n','n log₂ n','n²','2ⁿ'],...[2,4,8,16].map(x=>[x,1,Math.log2(x),x,x*Math.log2(x),x*x,2**x])];rows.forEach((row,i)=>{const tr=document.createElement('tr');if(row[0]===n)tr.className='active';row.forEach(value=>{const c=document.createElement(i?'td':'th');if(!i)c.scope='col';c.textContent=typeof value==='number'?String(Math.round(value*100)/100):value;tr.append(c);});table.append(tr);});$('#analysis-visual').replaceChildren(table);}
function draw(frame,rebuild=false){const n=Number($('#analysis-n').value),f=frame||{count:0};if(mode==='bounds')chart(f.bound||0);else if(mode==='compare')compare(f.compare||0,n);else {const grid=mode==='time'&&$('#analysis-example').value==='nested';const capacity=mode==='space'?(f.peak||($('#analysis-example').value==='constant'?2:$('#analysis-example').value==='array'?n+1:n)):n;if(rebuild||!$('.analysis-cells, .analysis-grid'))cells(capacity,f.count,grid);else highlight(f.count);}$('#analysis-metrics').textContent=mode==='space'?`n = ${n} · 현재 보조 공간 ${f.count}칸 · 최대 ${f.peak||'—'}칸`:mode==='bounds'?'n ≥ n₀인 구간의 경계 비교':mode==='compare'?'n=2, 4, 8, 16에서 함수값 비교':`n = ${n} · 주요 연산 ${f.count}회`;}
function render(rebuild=false){const f=frames[cursor],running=!!f&&cursor<frames.length-1;draw(f,rebuild);$('#analysis-feedback').hidden=!f;$('#step-controls').hidden=!f;$('#analysis-code').textContent=f?.code||'';$('#analysis-message').textContent=f?.message||'';$('#analysis-run').textContent=!f?'시작':running?'↺ 초기화':'다시 시작';$('#analysis-n').disabled=running;$('#analysis-example').disabled=running;$('#step-prev').disabled=cursor===0;$('#step-next').disabled=!running;$('#step-count').textContent=`${cursor+1} / ${frames.length}`;$('#step-status').textContent=running?(automatic?'자동 진행':'수동 진행'):'실행 완료';const fill=document.createElement('span');fill.className='step-progress-fill '+(running?(automatic?'running':'manual'):'complete');fill.style.animationDuration=`${stepInterval()}ms`;if(running&&!automatic)fill.style.transform=`scaleX(${(cursor+1)/frames.length})`;$('#step-progress').replaceChildren(fill);$('#step-progress').setAttribute('aria-label',running?(automatic?`다음 단계까지 약 ${(stepInterval()/1000).toFixed(2)}초`:'수동 진행 · 시간 애니메이션 없음'):'실행 완료');}
function reset(){stopPlayback();frames=[];cursor=0;$('#analysis-error').textContent='';render(true);}
function select(modeName){mode=modeName;
tabs.forEach(t=>{const active=t.dataset.mode===mode;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});$('#lesson-panel').setAttribute('aria-labelledby',`tab-${mode}`);const info=topics[mode];['#concept-title','#concept-description','#analysis-complexity','#analysis-note'].forEach((s,i)=>$(s).textContent=info[i]);$('#analysis-example').replaceChildren(...(choices[mode]||[]).map(([v,label])=>{const o=document.createElement('option');o.value=v;o.textContent=label;return o;}));$('#example-field').hidden=!choices[mode];$('#analysis-n').value=8;reset();}
function start(){if(frames.length&&cursor<frames.length-1){reset();return;}if(!$('#analysis-form').reportValidity()){$('#analysis-error').textContent='입력 크기는 2~16 사이 정수';return;}stopPlayback();frames=analysisFrames(mode,Number($('#analysis-n').value),$('#analysis-example').value);cursor=0;$('#analysis-error').textContent='';render(true);schedule();}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(tab.dataset.mode));tab.addEventListener('keydown',e=>{const j=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(j!==null){e.preventDefault();select(tabs[j].dataset.mode);tabs[j].focus();tabs[j].scrollIntoView({block:'nearest',inline:'nearest'});}});});
$('#analysis-run').addEventListener('click',start);$('#analysis-form').addEventListener('submit',e=>{e.preventDefault();start();});['#analysis-n','#analysis-example'].forEach(s=>$(s).addEventListener('change',()=>{if($('#analysis-form').checkValidity())reset();}));
[-1,1].forEach((delta,i)=>$(i?'#step-next':'#step-prev').addEventListener('click',()=>{const next=cursor+delta;if(next<0||next>=frames.length)return;cursor=next;render();schedule();}));$('#step-auto').addEventListener('change',()=>{automatic=$('#step-auto').checked;stopPlayback();render();schedule();});window.addEventListener('pagehide',stopPlayback);select('time');
}
