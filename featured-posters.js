const base = new URL(import.meta.url);
let placeModule;
function loadPlace() {
  const url = new URL('./topic-perception.js', base);
  url.search = base.search;
  return placeModule ||= import(url.href).catch(() => { placeModule = null; return null; });
}

const compact = matchMedia('(max-width: 767px), (pointer: coarse)');
let scene, sceneLoading = false, heroVisible = false, heroDetail;
let activated = false, sceneFailed = false, attempts = 0, launchButton;
let restoreLaunchFocus = false, heroSignature = '';
function updateLaunch() {
  if (!launchButton) return;
  const zh = document.documentElement.lang.startsWith('zh');
  const label = sceneLoading ? (zh ? '正在加载三维场景' : 'Loading 3D scene')
    : sceneFailed ? (zh ? '重试三维交互' : 'Retry 3D scene') : (zh ? '开启三维交互' : 'Explore in 3D');
  launchButton.title = label;
  launchButton.setAttribute('aria-label', label);
  launchButton.setAttribute('aria-busy', String(sceneLoading));
  launchButton.hidden = !!scene && !sceneFailed && !sceneLoading || !window.SiteMotion?.enabled();
  launchButton.disabled = sceneLoading;
}
function loadScene() {
  updateLaunch();
  if (scene || sceneLoading || !heroVisible || !window.SiteMotion?.enabled()) return;
  if (!activated) return;
  sceneLoading = true;
  sceneFailed = false;
  updateLaunch();
  const url = new URL('./hero-scene.js', base);
  url.search = base.search;
  if (attempts++) url.searchParams.set('retry', String(attempts));
  import(url.href).then(({ mountHeroScene }) => {
    if (!heroVisible || !window.SiteMotion?.enabled()) {
      sceneLoading = false;
      updateLaunch();
      return;
    }
    scene = mountHeroScene({
      host: document.querySelector('.hero-preview-panel'),
      fallback: document.getElementById('heroPreviewCanvas'),
      getTopic: () => heroDetail?.id,
      getStage: () => heroDetail?.stage ?? 0,
      motion: () => window.SiteMotion.enabled()
    });
  }).catch(failedScene);
}
function failedScene(event) {
  const active = document.activeElement;
  const restore = event?.detail?.restoreFocus || restoreLaunchFocus
    && (active === launchButton || active === document.body);
  scene?.destroy();
  scene = null;
  sceneLoading = false;
  sceneFailed = true;
  activated = false;
  updateLaunch();
  if (restore) {
    const target = !launchButton.hidden ? launchButton
      : document.querySelector('.hero-story [aria-pressed="true"]')
        || document.querySelector('.hero-scene-topics [aria-pressed="true"]')
        || document.querySelector('.hero-preview-title');
    target?.focus({ preventScroll: true });
  }
  restoreLaunchFocus = false;
}

export function enhanceHeroPreview(detail) {
  const meta = document.getElementById('heroPreviewMeta');
  if (!meta) return;
  const signature = JSON.stringify([detail.id, detail.label, detail.topics, detail.stages]);
  if (heroDetail && heroSignature === signature && meta.querySelector('.hero-story')) {
    Object.assign(heroDetail, detail);
    scene?.setTopic(detail.id);
    scene?.setStage(detail.stage ?? 0);
    return;
  }
  if (!heroDetail) {
    const fallback = document.getElementById('heroPreviewCanvas');
    const host = fallback.closest('.hero-preview-panel');
    launchButton = document.createElement('button');
    launchButton.type = 'button';
    launchButton.className = 'hero-scene-launch';
    // Lucide Box (ISC license in assets/vendor/lucide/LICENSE).
    launchButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg><span aria-hidden="true">3D</span>';
    launchButton.addEventListener('click', () => {
      restoreLaunchFocus = document.activeElement === launchButton;
      activated = true;
      loadScene();
    });
    let intentTimer;
    host.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || compact.matches || sceneFailed) return;
      intentTimer = setTimeout(() => { activated = true; loadScene(); }, 350);
    });
    host.addEventListener('pointerleave', () => clearTimeout(intentTimer));
    host.append(launchButton);
    host.addEventListener('hero-scene:ready', () => {
      const focused = document.activeElement === launchButton
        || restoreLaunchFocus && document.activeElement === document.body;
      sceneLoading = false;
      updateLaunch();
      if (focused) host.querySelector('.hero-scene-canvas')?.focus({ preventScroll: true });
      restoreLaunchFocus = false;
    });
    host.addEventListener('hero-scene:error', failedScene);
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) loadScene();
    }, { threshold: .08 }).observe(fallback);
    else { heroVisible = true; loadScene(); }
    window.addEventListener('site:motion-change', loadScene);
    compact.addEventListener('change', loadScene);
    new MutationObserver(() => { scene?.themeChanged(); updateLaunch(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang'] });
    updateLaunch();
  }
  heroDetail = detail;
  heroSignature = signature;
  meta.querySelector('.hero-scene-topics')?.remove();
  meta.querySelector('.hero-story')?.remove();
  const story = document.createElement('div');
  story.className = 'hero-story';
  const zh = document.documentElement.lang.startsWith('zh');
  const steps = document.createElement('div');
  steps.className = 'hero-story-steps';
  steps.role = 'group';
  steps.setAttribute('aria-label', zh ? '概念示例阶段' : 'Concept example stages');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'hero-story-next';
  next.setAttribute('aria-controls', 'heroStageStatus');
  const updateStage = () => {
    for (const button of steps.children) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.heroStage) === detail.stage));
    }
    const restart = detail.stage === detail.stages.length - 1;
    const label = restart ? (zh ? '回到起点' : 'Start again')
      : `${zh ? '下一步：' : 'Next: '}${detail.stages[detail.stage + 1]?.label || ''}`;
    next.title = label;
    next.setAttribute('aria-label', label);
    // Lucide ArrowRight / RotateCcw, ISC license retained in assets/vendor/lucide.
    next.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${restart
      ? '<path d="M3 11a9 9 0 1 1 2.7 6.4M3 3v8h8"/>'
      : '<path d="M5 12h14m-6-6 6 6-6 6"/>'}</svg>`;
    story.dataset.stage = String(detail.stage);
  };
  const selectStage = value => {
    if (value < 0 || value >= detail.stages.length) return;
    detail.stage = value;
    const caption = meta.querySelector('.hero-topic-caption');
    if (caption) caption.textContent = detail.stages[value].description;
    scene?.setStage(value);
    detail.stageChanged(value);
    updateStage();
  };
  for (const [index, stage] of (detail.stages || []).entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.heroStage = String(index);
    button.setAttribute('aria-controls', 'heroStageStatus');
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    number.setAttribute('aria-hidden', 'true');
    button.append(number, document.createTextNode(stage.label));
    button.addEventListener('click', () => selectStage(index));
    steps.append(button);
  }
  if (detail.stages?.length) {
    next.addEventListener('click', () => selectStage((detail.stage + 1) % detail.stages.length));
    story.append(steps, next);
    updateStage();
  } else {
    // Reserve the same space without adding controls to the retained point-cloud scene.
    story.setAttribute('aria-hidden', 'true');
  }
  meta.append(story);
  const group = document.createElement('div');
  group.className = 'hero-scene-topics';
  group.role = 'group';
  group.setAttribute('aria-label', detail.label);
  for (const [id, title] of detail.topics) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.sceneInterest = id;
    button.textContent = title;
    button.setAttribute('aria-pressed', String(id === detail.id));
    button.addEventListener('click', () => {
      detail.select(id);
      requestAnimationFrame(() => meta.querySelector(`[data-scene-interest="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }));
    });
    group.append(button);
  }
  meta.append(group);
  scene?.setTopic(detail.id);
  scene?.setStage(detail.stage ?? 0);
}

export function mountFeaturedPosters() {
  for (const poster of document.querySelectorAll('[data-work-poster]')) {
    const button = poster.querySelector('button');
    const canvas = poster.querySelector('canvas');
    let visible = false, sequence = 0;
    const running = new Set();
    const stop = () => {
      sequence++;
      for (const animation of running) animation.cancel();
      running.clear();
      delete poster.dataset.playing;
    };
    const paintPlace = async night => {
      if (!canvas || !visible) return;
      const module = await loadPlace();
      if (!visible || !canvas.isConnected || !module?.paintPlacePreview) return;
      module.paintPlacePreview(canvas, { night, highlight: night });
      poster.dataset.painted = 'true';
    };
    const play = async () => {
      stop();
      const id = sequence;
      if (!window.SiteMotion?.enabled()) { await paintPlace(true); return; }
      poster.dataset.playing = 'true';
      for (const [index, layer] of [...poster.querySelectorAll('[data-poster-layer]')].entries()) {
        const animation = window.SiteMotion.animate(layer, [
          { opacity: .25, transform: 'translateY(18px)' },
          { opacity: 1, transform: 'translateY(0)', offset: .4 },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 1050, delay: index * 110 });
        if (animation) { running.add(animation); animation.finished.catch(() => {}).finally(() => running.delete(animation)); }
      }
      if (canvas) {
        await paintPlace(true);
        if (id !== sequence || !visible) return;
        const animation = window.SiteMotion.animate(canvas, [
          { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }
        ], { duration: 1000 });
        if (animation) running.add(animation);
      }
    };
    button?.addEventListener('click', play);
    poster.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') void play(); });
    poster.addEventListener('pointerleave', () => { stop(); void paintPlace(false); });
    poster.addEventListener('focusin', event => { if (event.target === button) void play(); });
    window.addEventListener('site:motion-change', () => { if (!window.SiteMotion?.enabled()) stop(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) void paintPlace(false);
        else stop();
      }, { rootMargin: '100px' }).observe(poster);
    } else { visible = true; void paintPlace(false); }
    if (canvas && 'ResizeObserver' in window) new ResizeObserver(() => { if (visible) void paintPlace(false); }).observe(poster);
    new MutationObserver(() => { if (visible) void paintPlace(false); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
}
