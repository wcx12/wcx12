const base = new URL(import.meta.url);
let placeModule;
function loadPlace() {
  const url = new URL('./topic-perception.js', base);
  url.search = base.search;
  return placeModule ||= import(url.href).catch(() => { placeModule = null; return null; });
}

let scene, sceneLoading = false, heroVisible = false, heroDetail;
function loadScene() {
  if (scene || sceneLoading || !heroVisible || !window.SiteMotion?.enabled()) return;
  sceneLoading = true;
  const url = new URL('./hero-scene.js', base);
  url.search = base.search;
  import(url.href).then(({ mountHeroScene }) => {
    scene = mountHeroScene({
      host: document.querySelector('.hero-preview-panel'),
      fallback: document.getElementById('heroPreviewCanvas'),
      getTopic: () => heroDetail?.id,
      motion: () => window.SiteMotion.enabled()
    });
  }).catch(() => { sceneLoading = false; });
}

export function enhanceHeroPreview(detail) {
  const meta = document.getElementById('heroPreviewMeta');
  if (!meta) return;
  if (!heroDetail) {
    const fallback = document.getElementById('heroPreviewCanvas');
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) loadScene();
    }, { threshold: .08 }).observe(fallback);
    else { heroVisible = true; loadScene(); }
    window.addEventListener('site:motion-change', loadScene);
    new MutationObserver(() => scene?.themeChanged()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang'] });
  }
  heroDetail = detail;
  meta.querySelector('.hero-scene-topics')?.remove();
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
