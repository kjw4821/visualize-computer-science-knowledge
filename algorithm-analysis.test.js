const {test}=require('node:test');
const assert=require('node:assert/strict');
const {analysisFrames}=require('./algorithm-analysis.js');
test('analysis: linear and quadratic visit counts across input limits',()=>{
  for(const n of [2,8,16])for(const example of ['linear','nested']){
    const frames=analysisFrames('time',n,example),total=example==='nested'?n*n:n;
    assert.equal(frames[0].count,0);
    assert.equal(frames.at(-1).count,total);
    assert.equal(frames.length,total+2);
    for(let i=1;i<=total;i++)assert.equal(frames[i].count,i);
  }
});
test('analysis: space uses peak allocation even after recursive unwind',()=>{
  for(const n of [2,8,16]){
    assert.equal(analysisFrames('space',n,'constant').at(-1).peak,2);
    assert.equal(analysisFrames('space',n,'array').at(-1).peak,n+1);
    const stack=analysisFrames('space',n,'recursive');
    assert.equal(Math.max(...stack.map(f=>f.count)),n);
    assert.equal(stack.at(-1).count,0);
    assert.equal(stack.at(-1).peak,n);
    assert.equal(stack.filter(f=>f.code==='return;').length,n);
  }
});
test('analysis: bound example satisfies the stated witnesses from n0 onward',()=>{
  for(let n=3;n<=1000;n++)assert.ok(2*n<=2*n+3&&2*n+3<=3*n);
  assert.ok(2*2+3>3*2);
  assert.deepEqual(analysisFrames('bounds',8,'').map(f=>f.bound),[0,1,2,3,3]);
});

function timelineClock(){
  let now=0,id=0;const tasks=new Map();
  return {now:()=>now,set:(fn,ms)=>{tasks.set(++id,{fn,at:now+ms});return id;},clear:id=>tasks.delete(id),
    advance(ms){const target=now+ms;for(;;){const next=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>target)break;now=next[1].at;tasks.delete(next[0]);next[1].fn();}now=target;},
    delay(ms){now+=ms;const due=[...tasks].filter(([,t])=>t.at<=now);for(const [id,t] of due){tasks.delete(id);t.fn();}},
    pending:()=>tasks.size,callbacks:()=>[...tasks.values()].map(t=>t.fn)};
}
const {AnalysisTimeline}=require('./algorithm-analysis.js');
test('analysis: all time lessons finish at seven seconds regardless of input and loop type',()=>{
  for(const n of [2,8,16])for(const example of ['linear','nested']){
    const clock=timelineClock(),player=new AnalysisTimeline(clock),frames=analysisFrames('time',n,example);
    let cursor=0;player.play(frames.length,0,next=>cursor=next);
    clock.advance(6999);assert.ok(cursor<frames.length-1);
    clock.advance(1);assert.equal(cursor,frames.length-1);assert.equal(clock.pending(),0);
  }
});
test('analysis: delayed rendering catches up without extending the seven second timeline',()=>{
  const clock=timelineClock(),player=new AnalysisTimeline(clock);let cursor=0;
  player.play(258,0,next=>cursor=next);clock.delay(3500);
  assert.equal(cursor,128);clock.advance(3500);assert.equal(cursor,257);assert.equal(clock.pending(),0);
});
test('analysis: pause cancels old callbacks and resume uses remaining steps only',()=>{
  const clock=timelineClock(),player=new AnalysisTimeline(clock);let cursor=0;
  player.play(8,0,next=>cursor=next);clock.advance(3000);assert.equal(cursor,3);
  const stale=clock.callbacks();player.stop();clock.advance(10000);stale.forEach(fn=>fn());assert.equal(cursor,3);
  player.play(8,cursor,next=>cursor=next);clock.advance(3999);assert.equal(cursor,6);
  clock.advance(1);assert.equal(cursor,7);assert.equal(clock.pending(),0);
});
