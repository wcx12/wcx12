// Illustrative workflow only: no private database query is executed.
export function mountResearchScanner(host) {
  const zh = document.documentElement.lang.startsWith('zh');
  const t = (en, cn) => zh ? cn : en;
  host.setAttribute('aria-label', t('major-intel query walkthrough', 'major-intel 查询流程'));
  const rows = [
    { label: t('1. Question', '1. 问题'),
      title: t('Computer science or software engineering?', '计算机科学还是软件工程？'),
      text: t('Example question: I enjoy programming. How do these majors differ at the same university? Specify the university, degree level and curriculum year before comparing required courses.', '示例问题：我喜欢编程，同一所大学的这两个专业有什么区别？比较必修课程前，需明确学校、学位层次和培养方案年份。'),
      data: t('QUESTION\nCompare computer science and software engineering.\n\nINPUTS\nInterest: programming\nUniversity: not supplied\nDegree level: not supplied\nCurriculum year: not supplied\n\nNEXT\nAsk for missing inputs; do not assume a university.', '问题\n比较计算机科学与软件工程。\n\n输入\n兴趣：编程\n学校：未提供\n学位层次：未提供\n培养方案年份：未提供\n\n下一步\n补充缺失输入，不擅自选定学校。') },
    { label: t('2. Query / tools', '2. 查询 / 工具'),
      title: t('Turn the question into a retrieval plan.', '把问题拆成检索步骤。'),
      text: t('With those inputs, SQL-backed retrieval would filter both majors by university, degree and year, then compare required courses. Source lookup would attach curriculum references; mismatched years stay separate.', '输入补齐后，基于 SQL 的检索可按学校、学位和年份筛选两个专业，再比较必修课程。来源检索需附上培养方案依据；不同年份不可混为一谈。'),
      data: t('PROPOSED OPERATIONS, NOT API CALLS\n1. Validate the missing inputs.\n2. Filter curriculum records for both majors.\n3. Compare required courses and credits.\n4. Retrieve source titles, URLs and years.\n\nEXECUTION\nPrivate database not running.\nNo query executed; no records returned.', '拟议操作，并非 API 调用\n1. 核对并补齐输入。\n2. 筛选两个专业的培养方案记录。\n3. 比较必修课程与学分。\n4. 检索来源标题、链接及年份。\n\n执行状态\n私有数据库未运行。\n未执行查询，未返回记录。') },
    { label: t('3. Source-backed response', '3. 有据回答'),
      title: t('Evidence first; gaps stay visible.', '先有证据，再给回答。'),
      text: t('A source-backed answer would compare shared and distinct required courses, citing each curriculum and year. Here, inputs and source records are missing: no course differences, admission chances or recommendation can be established.', '有据回答应比较共同与不同的必修课程，并逐项引用培养方案及年份。本例缺少输入和来源记录，不能据此确定课程差异、录取概率或推荐结论。'),
      data: t('RESPONSE OUTLINE, NOT FINDINGS\nShared courses: awaiting cited records\nDifferent requirements: awaiting cited records\nEach claim needs: source title, URL, year\n\nCURRENT RESPONSE\nPlease supply university, degree and year.\nNo source-backed comparison is available.\nMissing data is not evidence of no difference.', '回答提纲，并非查询结论\n共同课程：待获取可引用记录\n不同要求：待获取可引用记录\n每项结论需：来源标题、链接、年份\n\n当前回答\n请提供学校、学位和年份。\n目前无法给出有来源支持的比较。\n数据缺失不等于不存在差异。') }
  ];
  rows.forEach(row => {
    row.kind = t('major-intel / illustrative example', 'major-intel / 流程示例');
    row.link = 'projects/#project-major-intel';
  });
  host.innerHTML = `<header class="scanner-heading"><div><span class="scanner-eyebrow">HUMAN / MACHINE</span><h2>${t('major-intel: one question, three stages.', 'major-intel：一个问题，三个阶段。')}</h2></div><p>${t('Question, retrieval plan, evidence boundary.', '问题、检索计划与证据边界。')}</p></header><div class="scanner-tabs" role="group" aria-label="${t('Query stages', '查询阶段')}"></div><div class="scanner-stage"><div class="scanner-code"><span class="scanner-eyebrow">WORKFLOW</span><pre></pre></div><article class="scanner-document"><div class="scanner-paper-mark" aria-hidden="true">↗</div><span class="scanner-kind"></span><h3></h3><p></p><span class="scanner-source">wcx12 / major-intel</span></article><canvas aria-hidden="true"></canvas><div class="scanner-line" aria-hidden="true"><span>READ</span></div></div><div class="scanner-controls"><button type="button" class="scanner-play" title="${t('Scan once', '扫描一次')}" aria-label="${t('Scan once', '扫描一次')}">▶</button><label><span>${t('Representation boundary', '表示边界')}</span><input type="range" min="0" max="100" value="48" aria-label="${t('Representation boundary', '表示边界')}"></label><a class="scanner-link"></a></div><p class="scanner-disclaimer">${t('Illustrative example only. Private database not running; no live query or real results.', '仅为流程示例。私有数据库未运行；没有实时查询或真实结果。')}</p>`;
  const labLabel = document.querySelector('[data-lab-label]');
  if (labLabel) labLabel.textContent = t('Interactive lab', '交互实验室');
  const stage = host.querySelector('.scanner-stage'), range = host.querySelector('input');
  const canvas = host.querySelector('canvas'), ctx = canvas.getContext('2d');
  const code = host.querySelector('pre');
  code.tabIndex = 0;
  code.setAttribute('aria-label', t('Query workflow details', '查询流程详情'));
  code.addEventListener('keydown', event => {
    if (event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    code.scrollTop = event.key === 'Home' ? 0 : code.scrollHeight;
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let progress = matchMedia('(max-width: 767px)').matches ? 0 : 48, frame = 0, start = 0, visible = false, dragging = false;
  const draw = () => {
    stage.style.setProperty('--cut', progress+'%');
    range.value = String(Math.round(progress));
    code.tabIndex = progress > 0 ? 0 : -1;
    code.parentElement.setAttribute('aria-hidden', String(progress === 0));
    if (!ctx) return;
    const {width:w,height:h} = stage.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) {canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const x=w*progress/100;
    ctx.fillStyle=getComputedStyle(stage).getPropertyValue('--scanner-accent');
    // Fixed surface coordinates keep the dissolve reversible and avoid flashing.
    for(let gx=0;gx<48;gx+=4)for(let y=8;y<h-8;y+=5){
      const seed=((gx*37+y*19)%101)/101;
      if(seed>1-gx/48)continue;
      ctx.globalAlpha=(1-gx/48)*.65;ctx.fillRect(x+gx,y,1+seed*2,1+seed*2);
    }
    ctx.globalAlpha=1;
  };
  const stop=()=>{cancelAnimationFrame(frame);frame=0;host.querySelector('.scanner-play').setAttribute('aria-pressed','false');};
  code.addEventListener('focus',()=>{stop();progress=100;draw();});
  range.addEventListener('input',()=>{stop();progress=Number(range.value);draw();});
  const scrub=e=>{const r=stage.getBoundingClientRect();progress=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100));draw();};
  stage.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('pre'))return;stop();dragging=true;stage.setPointerCapture(e.pointerId);scrub(e);});
  stage.addEventListener('pointermove',e=>{if(dragging)scrub(e);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>{dragging=false;});
  const play=host.querySelector('.scanner-play');
  play.addEventListener('click',()=>{
    if(frame){stop();return;}if(reduced.matches||window.SiteMotion?.enabled()===false){progress=progress<50?100:0;draw();return;}
    start=performance.now();play.setAttribute('aria-pressed','true');
    const tick=now=>{if(!visible||document.hidden){stop();return;}const p=Math.min(1,(now-start)/6000);progress=(.5-.5*Math.cos(p*Math.PI))*100;draw();if(p<1)frame=requestAnimationFrame(tick);else stop();};
    frame=requestAnimationFrame(tick);
  });
  rows.forEach((row,i)=>{const button=document.createElement('button');button.type='button';button.textContent=row.label;button.setAttribute('aria-pressed',String(i===0));button.addEventListener('click',()=>select(i));host.querySelector('.scanner-tabs').append(button);});
  function select(i){stop();const r=rows[i];host.querySelector('.scanner-kind').textContent=r.kind;host.querySelector('h3').textContent=r.title;host.querySelector('.scanner-document p').textContent=r.text;host.querySelector('pre').textContent=r.data;const link=host.querySelector('.scanner-link');link.href=(zh?'../zh/':'./')+r.link;link.textContent=t('Explore major-intel →','查看 major-intel →');host.querySelectorAll('.scanner-tabs button').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));draw();}
  new ResizeObserver(draw).observe(stage);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(!visible)stop();}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('site:motion-change',()=>{if(!window.SiteMotion?.enabled())stop();});
  reduced.addEventListener('change',stop);
  new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  select(0);
}
