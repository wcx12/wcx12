const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(pointer: fine)');
let preference = 'on';
try { preference = localStorage.getItem('wcx12-motion') || 'on'; } catch {}
const animations = new Set();
let themeTransition;
let transitionGeneration = 0;
const enabled = () => preference !== 'off' && !reduced.matches && !document.hidden;

function animate(element, frames, options = {}) {
  if (!element || !enabled() || !element.animate) return null;
  const animation = element.animate(frames, { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', ...options });
  animations.add(animation);
  animation.finished.catch(() => {}).finally(() => animations.delete(animation));
  return animation;
}

function syncMotion() {
  root.dataset.motion = preference !== 'off' && !reduced.matches ? 'on' : 'off';
  if (!enabled()) {
    for (const animation of animations) animation.cancel();
    themeTransition?.skipTransition();
  }
  document.querySelectorAll('[data-motion-setting]').forEach(input => {
    input.checked = preference !== 'off' && !reduced.matches;
    input.disabled = reduced.matches;
  });
  window.dispatchEvent(new CustomEvent('site:motion-change', { detail: { enabled: enabled() } }));
}

function transitionTheme(update, source) {
  clearWorkTransition();
  const generation = ++transitionGeneration;
  themeTransition?.skipTransition();
  if (!enabled() || !document.startViewTransition) { update(); return; }
  const rect = source?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : 40;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.dataset.transition = 'theme';
  const transition = document.startViewTransition(update);
  themeTransition = transition;
  transition.ready.then(() => {
    if (generation !== transitionGeneration || !enabled()) return;
    animate(root, { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, {
      duration: 620, pseudoElement: '::view-transition-new(root)', easing: 'cubic-bezier(.22,.7,.2,1)'
    });
  }).catch(() => {});
  transition.finished.catch(() => {}).finally(() => {
    if (generation === transitionGeneration) { delete root.dataset.transition; themeTransition = null; }
  });
}

let homeEnhancements;
function preview(detail) {
  if (!homeEnhancements) {
    const url = new URL('./featured-posters.js', import.meta.url);
    url.search = new URL(import.meta.url).search;
    homeEnhancements = import(url.href).then(module => { module.mountFeaturedPosters(); return module; });
  }
  homeEnhancements.then(module => module.enhanceHeroPreview(detail)).catch(() => {});
}
function attachCards(container) {
  container.querySelectorAll('.interactive-card').forEach(card => {
    if (card.dataset.interactiveBound) return;
    card.dataset.interactiveBound = 'true';
    card.addEventListener('pointermove', event => {
      if (!enabled() || !fine.matches) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / Math.max(1, rect.width) * 100).toFixed(1)}%`);
      card.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / Math.max(1, rect.height) * 100).toFixed(1)}%`);
    }, { passive: true });
    card.addEventListener('pointerdown', () => { if (enabled()) card.classList.add('is-pressed'); });
    card.addEventListener('pointerup', () => card.classList.remove('is-pressed'));
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-pressed');
      card.style.setProperty('--pointer-x', '50%');
      card.style.setProperty('--pointer-y', '50%');
    });
    card.addEventListener('pointercancel', () => card.classList.remove('is-pressed'));
  });
}
window.SiteMotion = { enabled, animate, transitionTheme, preview, attachCards };
syncMotion();
reduced.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
window.addEventListener('storage', event => {
  if (event.key !== 'wcx12-motion') return;
  preference = event.newValue === 'off' ? 'off' : 'on';
  syncMotion();
});

const footer = document.querySelector('.blog-footer') || document.querySelector('body > footer');
if (footer && !document.querySelector('#notesEditor')) {
  const label = document.createElement('label');
  label.className = 'site-motion-setting';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.role = 'switch';
  input.dataset.motionSetting = '';
  const text = document.createElement('span');
  const translate = () => { text.textContent = root.lang.startsWith('zh') ? '动态效果' : 'Motion effects'; };
  translate();
  new MutationObserver(translate).observe(root, { attributes: true, attributeFilter: ['lang'] });
  label.append(input, text);
  footer.append(label);
  input.addEventListener('change', () => {
    preference = input.checked ? 'on' : 'off';
    try { localStorage.setItem('wcx12-motion', preference); } catch {}
    syncMotion();
  });
  syncMotion();
}

// Indicators keep their previous geometry across dynamic topic-rail renders.
const rails = new Map();
function bindRail(rail) {
  if (rails.has(rail)) return;
  const vertical = rail.id === 'interestRail';
  const marker = document.createElement('span');
  marker.className = `motion-marker${vertical ? ' motion-marker-vertical' : ''}`;
  marker.setAttribute('aria-hidden', 'true');
  rail.classList.add('motion-rail');
  let previous;
  function move(target) {
    if (!target || !target.getClientRects().length) { marker.hidden = true; return; }
    if (!marker.isConnected) rail.append(marker);
    const a = rail.getBoundingClientRect(), b = target.getBoundingClientRect();
    const next = vertical
      ? { transform: `translateY(${b.top - a.top + rail.scrollTop}px)`, height: `${b.height}px` }
      : { transform: `translateX(${b.left - a.left + rail.scrollLeft}px)`, width: `${b.width}px` };
    Object.assign(marker.style, next);
    marker.hidden = false;
    if (previous && (previous.transform !== next.transform || previous.width !== next.width || previous.height !== next.height)) {
      marker.getAnimations().forEach(animation => animation.cancel());
      animate(marker, [previous, next], { duration: 380 });
    }
    previous = next;
  }
  const current = () => move(rail.querySelector('[aria-current], [aria-selected="true"], .cmd.active'));
  rail.addEventListener('pointerover', event => {
    if (!fine.matches || vertical) return;
    const target = event.target.closest('.site-nav-link, .cmd, [data-interest-panel]');
    if (target && rail.contains(target)) move(target);
  });
  rail.addEventListener('pointerleave', current);
  rail.addEventListener('focusin', event => { if (!vertical && event.target.matches('a, button')) move(event.target); });
  rail.addEventListener('focusout', current);
  let frame;
  const refresh = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = null; current(); });
  };
  new MutationObserver(records => {
    if (records.some(record => record.type === 'attributes' || [...record.addedNodes, ...record.removedNodes].some(node => node !== marker))) refresh();
  }).observe(rail, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current', 'aria-selected', 'class'] });
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(rail);
  rails.set(rail, current);
  current();
}
// Let content paint before nonessential indicator geometry triggers layout.
function afterContentPaint(callback) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(callback, { timeout: 1500 });
    else setTimeout(callback, 0);
  }));
}
afterContentPaint(() => document.querySelectorAll('.site-navigation, .command-row, #interestRail, .interest-section-tabs').forEach(bindRail));

// Visible by default: a failed observer or disabled JS cannot hide content.
const revealed = new WeakSet();
const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting || revealed.has(entry.target)) continue;
    revealed.add(entry.target);
    observer.unobserve(entry.target);
    entry.target.classList.add('motion-entered');
    animate(entry.target, [{ opacity: .25, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 600 });
  }
}, { threshold: .08 }) : null;
afterContentPaint(() => document.querySelectorAll('.selected-work-list article, .blog-section-head, .profile-entry, .timeline article, .resume-entry').forEach(element => {
  if (element.getBoundingClientRect().top >= innerHeight - 30) observer?.observe(element);
}));

let topicAnimations = [];
window.addEventListener('site:topic-change', () => {
  topicAnimations.forEach(animation => animation?.cancel());
  topicAnimations = [];
  const detail = document.querySelector('.interest-detail');
  if (!detail || detail.getBoundingClientRect().bottom < 0) return;
  for (const [index, element] of [...detail.querySelectorAll('.interest-detail-head, .interest-section-tabs, [data-interest-tabpanel]:not([hidden])')].entries()) {
    topicAnimations.push(animate(element, [{ opacity: .35, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: index * 45 }));
  }
});

const heroHeading = document.querySelector('.hero h1');
if (heroHeading) animate(heroHeading, [{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(12px)' }, { clipPath: 'inset(0)', transform: 'none' }], { duration: 700 });

// Native document navigation remains native, including back/forward scroll restoration.
window.addEventListener('pageswap', event => {
  event.viewTransition?.ready.catch(() => {});
  if (!enabled()) return;
  root.dataset.transition = 'page';
});
window.addEventListener('pagereveal', event => { event.viewTransition?.ready.catch(() => {}); });
window.addEventListener('pageshow', event => {
  if (root.dataset.transition === 'page') delete root.dataset.transition;
  if (event.persisted) clearWorkTransition();
});

const cursor = document.getElementById('customCursor');
if (cursor) {
  document.addEventListener('pointerover', event => {
    const target = event.target.closest('[data-cursor], [draggable="true"], input[type="range"], .hero-scene-canvas, [data-figure-zoom]');
    cursor.dataset.mode = target?.dataset.cursor || (target?.matches('.hero-scene-canvas') ? 'rotate' : target?.matches('[data-figure-zoom]') ? 'zoom' : target ? 'drag' : 'default');
  }, { passive: true });
}

// Article scroll-spy reads geometry once per scroll frame, never animates prose.
const tocLinks = [...document.querySelectorAll('.blog-toc a[href^="#"]')];
const headings = [...new Set(tocLinks.map(link => {
  try { return document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return null; }
}).filter(Boolean))];
if (headings.length) {
  let frame = 0, active;
  const update = () => {
    frame = 0;
    let current = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 155) current = heading;
      else break;
    }
    if (current === active) return;
    active = current;
    for (const link of tocLinks) {
      if (decodeURIComponent(link.hash.slice(1)) === current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  document.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  afterContentPaint(update);
}

function clearWorkTransition() {
  document.querySelectorAll('.selected-work h3, main h1').forEach(heading => {
    if (heading.style.viewTransitionName === 'work-heading') heading.style.removeProperty('view-transition-name');
  });
}

try {
  const pendingTitle = sessionStorage.getItem('wcx12-work-transition');
  sessionStorage.removeItem('wcx12-work-transition');
  if (pendingTitle === location.pathname) document.querySelector('main h1')?.style.setProperty('view-transition-name', 'work-heading');
} catch {}
document.querySelectorAll('.selected-work h3 a').forEach(link => {
  link.addEventListener('click', event => {
    if (!enabled() || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    try {
      clearWorkTransition();
      sessionStorage.setItem('wcx12-work-transition', new URL(link.href).pathname);
      link.closest('h3').style.viewTransitionName = 'work-heading';
    } catch {}
  });
});
