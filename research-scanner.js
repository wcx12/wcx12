import { staticPublications } from './site-data.js';

// A deterministic view of public records, not model inference or a token benchmark.
export function mountResearchScanner(host) {
  const zh = document.documentElement.lang.startsWith('zh');
  const t = (en, cn) => zh ? cn : en;
  host.setAttribute('aria-label', t('Research representations', '研究内容与结构化表示'));
  const paper = staticPublications.find(p => p.title.startsWith('TF-VPR'));
  const rows = [
    { label: 'TF-VPR', title: paper.title,
      text: t('Visual place recognition without task-specific fine-tuning.', '无需任务特定微调的视觉地点识别。'),
      kind: t('Published research', '已发表研究'), link: 'publications/tf-vpr/',
      data: { type: 'ScholarlyArticle', name: paper.title, doi: paper.doi, task: 'visual place recognition', training: 'training-free' } },
    { label: 'major-intel', title: t('A question becomes a tool call.', '从一个问题，到一次工具调用。'),
      text: t('College-major research through SQL-backed tools and inspectable sources.', '借助 SQL 工具与可核查来源研究大学专业。'),
      kind: t('Engineering prototype', '工程原型'), link: 'projects/#project-major-intel',
      data: { type: 'SoftwareSourceCode', name: 'major-intel', interfaces: ['function_calls / registry.py', 'retrieval_tools.py'], evidence: ['source_tables', 'tool_trace'], maturity: 'prototype', database: 'private' } },
    { label: 'TIGER', title: t('From item content to semantic IDs.', '从物品内容，到语义 ID。'),
      text: t('Reading notes on residual quantization and generative recommendation.', '关于残差量化与生成式推荐的阅读笔记。'),
      kind: t('Research notes', '研究笔记'), link: 'research/generative-retrieval/',
      data: { type: 'ReadingNote', subject: 'TIGER', tokenizer: 'RQ-VAE', stages: ['content embedding', 'residual quantization', 'semantic ID', 'autoregressive generation'], evidence: 'paper discussion, not a live model' } }
  ];
  host.innerHTML = `<header class="scanner-heading"><div><span class="scanner-eyebrow">HUMAN / MACHINE</span><h2>${t('One idea. Two representations.', '同一份研究，两种表达。')}</h2></div><p>${t('Public material, structured for inspection.', '公开研究材料，以结构化形式展开。')}</p></header><div class="scanner-tabs" role="group" aria-label="${t('Research material', '研究材料')}"></div><div class="scanner-stage"><div class="scanner-code"><span class="scanner-eyebrow">STRUCTURED RECORD</span><pre></pre></div><article class="scanner-document"><div class="scanner-paper-mark" aria-hidden="true">↗</div><span class="scanner-kind"></span><h3></h3><p></p><span class="scanner-source">wcx12 / research</span></article><canvas aria-hidden="true"></canvas><div class="scanner-line" aria-hidden="true"><span>READ</span></div></div><div class="scanner-controls"><button type="button" class="scanner-play" title="${t('Scan once', '扫描一次')}" aria-label="${t('Scan once', '扫描一次')}">▶</button><label><span>${t('Representation boundary', '表示边界')}</span><input type="range" min="0" max="100" value="48" aria-label="${t('Representation boundary', '表示边界')}"></label><a class="scanner-link"></a></div><p class="scanner-disclaimer">${t('Illustrated transformation of public information. No live inference or measured compression.', '公开信息的表示示意，不代表实时推理或实测压缩效果。')}</p>`;
  const labLabel = document.querySelector('[data-lab-label]');
  if (labLabel) labLabel.textContent = t('Interactive lab', '交互实验室');
  const stage = host.querySelector('.scanner-stage'), range = host.querySelector('input');
  const canvas = host.querySelector('canvas'), ctx = canvas.getContext('2d');
  const code = host.querySelector('pre');
  code.tabIndex = 0;
  code.setAttribute('aria-label', t('Structured research record', '结构化研究记录'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let progress = matchMedia('(max-width: 767px)').matches ? 0 : 48, frame = 0, start = 0, visible = false, dragging = false;
  const draw = () => {
    stage.style.setProperty('--cut', progress+'%');
    range.value = String(Math.round(progress));
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
  function select(i){stop();const r=rows[i];host.querySelector('.scanner-kind').textContent=r.kind;host.querySelector('h3').textContent=r.title;host.querySelector('.scanner-document p').textContent=r.text;host.querySelector('pre').textContent=JSON.stringify(r.data,null,2);const link=host.querySelector('.scanner-link');link.href=(zh?'../zh/':'./')+r.link;link.textContent=t('Read the work →','查看内容 →');host.querySelectorAll('.scanner-tabs button').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));draw();}
  new ResizeObserver(draw).observe(stage);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(!visible)stop();}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('site:motion-change',()=>{if(!window.SiteMotion?.enabled())stop();});
  reduced.addEventListener('change',stop);
  new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  select(0);
}
