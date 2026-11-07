'use strict';
// Shared playback shell for the heap and graph lessons.
function mountLesson(config) {
  const $=selector=>document.querySelector(selector),tabs=[...document.querySelectorAll('[data-mode]')];
  const player=new StepPlayer();let state=config.create(),mode=tabs[0].dataset.mode,steps=[],cursor=0;
  function settle(){player.stop();if(steps.length && cursor===steps.length-1)state=config.clone(steps[cursor].state);steps=[];cursor=0;}
  function play(){player.stop();if(cursor>=steps.length-1)return;player.play(()=>{cursor++;render();return cursor<steps.length-1;});}
  function render(){
    const frame=steps[cursor],locked=steps.length>0 && cursor<steps.length-1;
    config.draw(frame?.state || state,frame,mode);
    $('#array-code').textContent=frame?.code || config.summary(state);
    $('#array-message').textContent=frame?.message || '연산 시작 후 2초 간격 자동 진행 · 좌우 버튼으로 단계 이동 가능';
    $('.array-feedback').setAttribute('data-state',frame?.status || 'normal');
    $('#step-controls').hidden=!steps.length;
    $('#step-count').textContent=`${cursor+1} / ${steps.length}`;
    $('#step-prev').disabled=cursor===0;$('#step-next').disabled=cursor>=steps.length-1;
    $('#step-status').textContent=locked?'자동 진행':frame?.status==='error'?'연산 중단':'진행 완료';
    const fill=document.createElement('span');fill.className=locked?'step-progress-fill running':'step-progress-fill complete';
    $('#step-progress').replaceChildren(fill);$('#step-progress').setAttribute('aria-label',locked?'다음 단계까지 2초 · 자동 진행 중':'진행 종료');
    for(const field of config.fields){const visible=field.modes.includes(mode);$(`#${field.id}-field`).hidden=!visible;$(`#${field.id}`).disabled=locked||!visible;}
    $('#lesson-run').disabled=locked;
    $('#range-hint').textContent=locked?'단계 진행 중 · 초기화 또는 탭 전환 시 미완료 연산 취소':config.modes[mode].hint;
  }
  function changeMode(next){
    settle();mode=next;
    tabs.forEach(tab=>{const selected=tab.dataset.mode===mode;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
    $('#lesson-panel').setAttribute('aria-labelledby',`tab-${mode}`);
    const info=config.modes[mode];$('#concept-title').textContent=info.title;$('#concept-description').textContent=info.description;
    $('#lesson-run').textContent=info.action;$('#complexity-title').textContent=info.complexity;$('#complexity-description').textContent=info.explanation;
    $('#lesson-error').textContent='';render();
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>changeMode(tab.dataset.mode));
    tab.addEventListener('keydown',event=>{
      const next=event.key==='ArrowRight'?(i+1)%tabs.length:event.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
      if(next!==null){event.preventDefault();changeMode(tabs[next].dataset.mode);tabs[next].focus();}
    });
  });
  $('#lesson-form').addEventListener('submit',event=>{
    event.preventDefault();if(steps.length && cursor<steps.length-1)return;settle();
    try{const args=Object.fromEntries(config.fields.map(f=>[f.id,$(`#${f.id}`).value]));steps=config.frames(state,mode,args);$('#lesson-error').textContent='';}
    catch(error){$('#lesson-error').textContent=error.message;}render();play();
  });
  $('#lesson-form').addEventListener('invalid',()=>{$('#lesson-error').textContent=config.validation;},true);
  function move(delta){const next=cursor+delta;if(!steps.length||next<0||next>=steps.length)return;cursor=next;render();play();}
  $('#step-prev').addEventListener('click',()=>move(-1));$('#step-next').addEventListener('click',()=>move(1));
  $('#lesson-reset').addEventListener('click',()=>{player.stop();state=config.create();steps=[];cursor=0;changeMode(mode);});
  changeMode(mode);
}
function lessonSvg(tag,attributes,text){
  const element=document.createElementNS('http://www.w3.org/2000/svg',tag);
  Object.entries(attributes).forEach(([key,value])=>element.setAttribute(key,value));
  if(text!==undefined)element.textContent=text;return element;
}
