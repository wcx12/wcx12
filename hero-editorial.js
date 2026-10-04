// Native, finite editorial scenes. All copy is a synthetic example, never inference.
export const isEditorialTopic = id => id === 'agent' || id === 'ai4edu';

export function mountHeroEditorial(host, fallback) {
  const root = document.createElement('div');
  root.className = 'hero-editorial';
  root.hidden = true;
  root.setAttribute('role', 'img');
  host.append(root);
  let signature = '', currentStage = -1, visible = false;
  const animations = new Set();
  const stop = () => {
    for (const animation of animations) animation.cancel();
    for (const animation of root.getAnimations({ subtree: true })) animation.cancel();
    animations.clear();
  };
  const position = () => {
    Object.assign(root.style, { left: `${fallback.offsetLeft}px`, top: `${fallback.offsetTop}px`,
      width: `${fallback.clientWidth}px`, height: `${fallback.clientHeight}px` });
    root.dataset.compact = String(fallback.clientWidth < 400 || fallback.clientHeight < 250);
    root.dataset.largeType = String(parseFloat(getComputedStyle(document.documentElement).fontSize) > 21);
  };
  const resize = new ResizeObserver(position);
  resize.observe(host);
  resize.observe(fallback);
  const syncMotion = () => {
    root.dataset.motion = String(visible && !!window.SiteMotion?.enabled());
    if (root.dataset.motion !== 'true') stop();
  };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncMotion(); });
  observer.observe(fallback);
  window.addEventListener('site:motion-change', syncMotion);

  function update(detail) {
    const active = isEditorialTopic(detail.id);
    root.hidden = !active;
    host.toggleAttribute('data-editorial-hero', active);
    if (!active) { stop(); return; }
    const zh = document.documentElement.lang.startsWith('zh');
    const nextSignature = `${detail.id}/${zh}`;
    const changed = signature !== nextSignature || currentStage !== detail.stage;
    if (changed) stop();
    if (signature !== nextSignature) {
      signature = nextSignature;
      root.dataset.subject = detail.id;
      // Authored static strings only. Never interpolate fetched notes or user HTML.
      root.innerHTML = detail.id === 'agent' ? `
        <div class="brief-heading"><span>${zh ? '示例资料 / 03' : 'EXAMPLE SOURCES / 03'}</span><span class="brief-status"></span></div>
        <div class="brief-surface">
          <div class="brief-title"><span>${zh ? '从资料到' : 'From sources to'}</span><strong>${zh ? '研究简报' : 'Research brief'}</strong></div>
          <div class="brief-lines">
            <div class="brief-line"><span class="brief-index">01</span><div><small>${zh ? '问题' : 'QUESTION'}</small><strong>${zh ? '光照改变，地点未变。' : 'New light. Same place.'}</strong></div><span class="brief-citation">[1]</span></div>
            <div class="brief-line"><span class="brief-index">02</span><div><small>${zh ? '线索' : 'EVIDENCE'}</small><strong>${zh ? '门窗与轮廓仍然对应。' : 'Windows and outlines align.'}</strong></div><span class="brief-citation">[2]</span></div>
            <div class="brief-line"><span class="brief-index">03</span><div><small>${zh ? '核验' : 'REVIEW'}</small><strong>${zh ? '回到来源，核对结论。' : 'Check every claim at source.'}</strong></div><span class="brief-citation">[3]</span></div>
          </div>
          <div class="brief-scan"></div>
        </div>
        <div class="brief-foot"><span class="brief-tool"></span><span class="brief-stamp">${zh ? '待人工核验' : 'FOR HUMAN REVIEW'}</span></div>` : `
        <div class="geometry-heading"><span>${zh ? '几何探索 / 01' : 'GEOMETRY / 01'}</span><span>½ + ½ = 1</span></div>
        <div class="geometry-space">
          <div class="geometry-target"></div>
          <div class="geometry-piece geometry-a"><span>A</span></div>
          <div class="geometry-piece geometry-b"><span>B</span></div>
          <div class="geometry-turn"><span>180°</span></div>
          <div class="geometry-measure"><span>a</span></div>
          <div class="geometry-equation"><span>½a²</span><b>+</b><span>½a²</span><b>=</b><strong>a²</strong></div>
        </div>
        <div class="geometry-foot"><span class="geometry-state"></span><span class="geometry-footnote">${zh ? '面积守恒' : 'SAME TOTAL AREA'}</span></div>`;
    }
    position();
    currentStage = detail.stage;
    root.dataset.stage = String(currentStage);
    root.setAttribute('aria-label', `${detail.stages[currentStage].description} ${detail.id === 'agent'
      ? (zh ? '示例简报包含问题、线索和核验三条摘录；方括号数字代表示例来源。' : 'The example brief groups three excerpts as question, evidence and review. Bracketed numbers mark example sources.')
      : (zh ? 'A 与 B 是全等三角形；每块面积为二分之一 a 平方，总面积为 a 平方。' : 'A and B are congruent triangles. Each has area one half a squared; together their area is a squared.')}`);
    if (detail.id === 'agent') {
      root.querySelector('.brief-status').textContent = (zh ? ['待整理', '提取与归并', '摘要草稿'] : ['COLLECTED', 'SYNTHESIZING', 'DRAFT READY'])[currentStage];
      root.querySelector('.brief-tool').textContent = (zh ? ['3 条摘录', '读取 → 整理 → 保留来源', '3 条要点 · 3 个来源'] : ['3 source excerpts', 'Read → organize → cite', '3 findings · 3 sources'])[currentStage];
    } else {
      root.querySelector('.geometry-state').textContent = (zh ? ['两块三角形，一个正方形？', '旋转，再沿斜边拼合。', '两块三角形，恰好一个正方形。'] : ['Two triangles. One square?', 'Rotate. Join the diagonal edges.', 'Two triangles. One complete square.'])[currentStage];
    }
    if (changed) {
      if (visible && window.SiteMotion?.enabled()) {
        const moving = detail.id === 'agent' ? root.querySelectorAll('.brief-line') : root.querySelectorAll('.geometry-piece');
        for (const [index, node] of [...moving].entries()) {
          const frames = detail.id === 'agent'
            ? [{ opacity: .2, translate: `${currentStage === 0 ? -10 : 10}px 8px` }, { opacity: 1, translate: '0 0' }]
            : [{ translate: `${index ? 14 : -14}px 10px`, opacity: .55 }, { translate: '0 0', opacity: 1 }];
          const animation = window.SiteMotion.animate(node, frames, { duration: 700, delay: index * 100 });
          if (animation) { animations.add(animation); animation.finished.catch(() => {}).finally(() => animations.delete(animation)); }
        }
        const scan = root.querySelector('.brief-scan');
        if (scan && currentStage === 1) {
          const animation = window.SiteMotion.animate(scan, [{ top: '5%', opacity: 0 }, { opacity: 1, offset: .15 }, { top: '95%', opacity: 0 }], { duration: 1600 });
          if (animation) { animations.add(animation); animation.finished.catch(() => {}).finally(() => animations.delete(animation)); }
        }
      }
    }
  }
  return { update };
}
