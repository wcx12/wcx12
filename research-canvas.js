const topicsUrl = new URL('./topic-experiences.js', import.meta.url);
const assetVersion = new URL(import.meta.url).searchParams.get('v');
if (assetVersion) topicsUrl.searchParams.set('v', assetVersion);
const { createTopicExperiences } = await import(topicsUrl.href);

let researchCanvasInstance = null;

export function createResearchCanvas(options) {
  if (researchCanvasInstance) return researchCanvasInstance;

  const {
    getActiveEntry,
    getContext,
    getPrimaryInterestId,
    requestMotionFrame = () => {}
  } = options;
  const interestCanvas = document.getElementById('interestCanvas');
  const interestCtx = interestCanvas?.getContext('2d');
  const interestCanvasStatus = document.getElementById('interestCanvasStatus');
  const interestDemoPrevious = document.getElementById('interestDemoPrevious');
  const interestDemoAction = document.getElementById('interestDemoAction');
  const interestDemoReset = document.getElementById('interestDemoReset');
  const controlsContainer = document.querySelector('#interestCanvasControls');
  controlsContainer.classList.add('research-demo-controls');
  const topicExperiences = createTopicExperiences({ panel: interestCanvas.parentElement, getContext });
  const registrationNote = document.createElement('p');
  registrationNote.className = 'research-demo-content';
  controlsContainer.prepend(registrationNote);
  const say = (en, zh) => currentLang === 'zh' ? zh : en;
  const compactInterestMotionQuery = window.matchMedia('(max-width: 720px), (hover: none), (pointer: coarse)');
  const themeColorCache = new Map();
  const MAX_CANVAS_DPR = 2;
  const INTEREST_DESKTOP_FRAME_MS = 46;
  const INTEREST_MOBILE_IDLE_FRAME_MS = 200;
  let currentLang = 'en';
  let interestTick = 0;
  let lastInterestFrame = 0;
  let interestCanvasVisible = !('IntersectionObserver' in window);
  let interestCanvasSize = { width: 0, height: 0, scale: 1 };

  function syncContext() {
    currentLang = getContext().lang;
  }

  function activeInterestEntry() {
    return getActiveEntry();
  }

  function primaryInterestId(item, kind) {
    return getPrimaryInterestId(item, kind);
  }

  function isResearchViewActive() {
    return document.getElementById('research')?.classList.contains('active');
  }

  function updateInterestCanvasSize(width, height) {
    if (!interestCanvas || !interestCtx) return false;
    const scale = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);
    const cssWidth = Math.max(0, width);
    const cssHeight = Math.max(0, height);
    const pixelWidth = Math.max(1, Math.floor(cssWidth * scale));
    const pixelHeight = Math.max(1, Math.floor(cssHeight * scale));
    const changed = interestCanvas.width !== pixelWidth
      || interestCanvas.height !== pixelHeight
      || interestCanvasSize.width !== cssWidth
      || interestCanvasSize.height !== cssHeight
      || interestCanvasSize.scale !== scale;
    if (interestCanvas.width !== pixelWidth) interestCanvas.width = pixelWidth;
    if (interestCanvas.height !== pixelHeight) interestCanvas.height = pixelHeight;
    interestCtx.setTransform(scale, 0, 0, scale, 0, 0);
    interestCanvasSize = { width: cssWidth, height: cssHeight, scale };
    return changed;
  }

  function measureInterestCanvasSize() {
    if (!interestCanvas) return false;
    const rect = interestCanvas.getBoundingClientRect();
    return updateInterestCanvasSize(rect.width, rect.height);
  }

  function interestPointer(event) {
    return {
      x: Math.max(0, Math.min(interestCanvasSize.width, Number(event.offsetX) || 0)),
      y: Math.max(0, Math.min(interestCanvasSize.height, Number(event.offsetY) || 0))
    };
  }

  function colorWithAlpha(color, alpha) {
    const value = String(color || '').trim();
    let hex = value;
    if (/^#[0-9a-f]{3}$/i.test(hex)) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
      const number = Number.parseInt(hex.slice(1), 16);
      const r = (number >> 16) & 255;
      const g = (number >> 8) & 255;
      const b = number & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (value.startsWith('rgb(')) return value.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    return `rgba(255, 255, 255, ${alpha})`;
  }

  function hashString(value) {
    return String(value).split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
  }

  function themeColor(name) {
    if (themeColorCache.has(name)) return themeColorCache.get(name);
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    themeColorCache.set(name, value);
    return value;
  }

const pointCloudInteraction = {
  active: false,
  dragging: false,
  x: 0.5,
  y: 0.5,
  scrub: 0.48,
  targetScrub: 0.48,
  energy: 0,
  completed: false
};

const registrationState = {
  points: [],
  seed: 7,
  params: {
    noise: 12,
    missing: 18,
    rotation: 34
  }
};

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function generateRegistrationPoints() {
  const random = seededRandom(registrationState.seed);
  registrationState.points = Array.from({ length: 42 }, (_, index) => {
    const angle = index * 0.52;
    const ring = 0.12 + (index % 9) * 0.035;
    return {
      x: Math.cos(angle) * ring + (random() - 0.5) * 0.06,
      y: Math.sin(angle) * ring + (random() - 0.5) * 0.06,
      keep: random()
    };
  });
}

function registrationParams() {
  return registrationState.params;
}

function transformPoint(point, index, params) {
  const angle = (params.rotation * Math.PI) / 180;
  const random = seededRandom(registrationState.seed + index * 97);
  const noise = params.noise / 360;
  const nx = (random() - 0.5) * noise;
  const ny = (random() - 0.5) * noise;
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle) + 0.12 + nx,
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle) - 0.08 + ny,
    visible: point.keep > params.missing / 100
  };
}


function activeInterestAnimationType() { return activeInterestEntry()?.child.animation; }
function isPointCloudInterestActive() { return activeInterestAnimationType() === 'point-cloud'; }
function isInterestDragging() { return pointCloudInteraction.dragging; }
function clamp01(value) { return Math.max(0, Math.min(1, value)); }
function showActivePresentation() {
  syncContext();
  const registration = isPointCloudInterestActive();
  interestCanvas.hidden = !registration;
  controlsContainer.hidden = !registration;
  interestCanvasStatus.parentElement.hidden = !registration;
  interestCanvas.parentElement.dataset.presentation = registration ? 'registration' : 'topic';
  topicExperiences.show(registration ? null : activeInterestAnimationType());
  return registration;
}
function bindItemToInterestAnimation(item, kind, interestId) {
  if (!item || (interestId || primaryInterestId(item, kind)) !== 'point-cloud-registration') return;
  const hash = Math.abs(hashString(item.name || item.title || ''));
  pointCloudInteraction.active = true;
  pointCloudInteraction.x = 0.25 + (hash % 50) / 100;
  pointCloudInteraction.targetScrub = pointCloudInteraction.x;
  pointCloudInteraction.energy = 1;
}
function pointCloudStatusText() {
  const params = registrationParams();
  const error = Math.max(0.2, (1 - clamp01(pointCloudInteraction.targetScrub)) * 8 + params.noise * 0.03 + params.missing * 0.015);
  if (currentLang === 'zh') {
    return pointCloudInteraction.completed
      ? `配准示意完成，示意对齐误差 ${error.toFixed(2)}，旋转 ${params.rotation}°。`
      : `当前旋转 ${params.rotation}°，示意对齐误差 ${error.toFixed(2)}。`;
  }
  return pointCloudInteraction.completed
    ? `Illustrative registration complete. Simulated alignment error ${error.toFixed(2)} at ${params.rotation}° rotation.`
    : `Current rotation ${params.rotation}°. Simulated alignment error ${error.toFixed(2)}.`;
}
function updateInterestCanvasAccessibility() {
  interestCanvas.setAttribute('role', 'img');
  interestCanvas.setAttribute('aria-label', say(
    'Illustrative point-cloud registration concept. Drag to inspect point-set alignment.',
    '点云配准概念演示。拖动指针观察点集对齐。'));
  interestCanvas.tabIndex = -1;
  interestDemoPrevious.textContent = say('Rotate', '旋转');
  interestDemoAction.textContent = say('Register', '执行配准');
  interestDemoReset.textContent = say('Reset', '重置');
  registrationNote.textContent = say('Concept demo · synthetic data and illustrative values.', '概念演示 · 合成数据与示意数值。');
  registrationNote.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  const status = pointCloudStatusText();
  interestCanvasStatus.tabIndex = 0;
  if (interestCanvasStatus.textContent !== status) interestCanvasStatus.textContent = status;
}
function commitInterestDemoControl() {
  updateInterestCanvasAccessibility();
  drawInterestInteractionFrame();
  requestMotionFrame({ immediate: true });
}
function runInterestDemoPrevious() {
  const type = activeInterestAnimationType();
  if (type === 'point-cloud') {
    const rotation = (registrationParams().rotation + 15) % 360;
    registrationState.params.rotation = rotation;
    pointCloudInteraction.scrub = 0.22;
    pointCloudInteraction.targetScrub = 0.22;
    pointCloudInteraction.x = 0.22;
    pointCloudInteraction.active = true;
    pointCloudInteraction.energy = 1;
    pointCloudInteraction.completed = false;
  }
  commitInterestDemoControl();
}

function runInterestDemoAction() {
  const type = activeInterestAnimationType();
  if (type === 'point-cloud') {
    pointCloudInteraction.scrub = 1;
    pointCloudInteraction.targetScrub = 1;
    pointCloudInteraction.x = 1;
    pointCloudInteraction.active = true;
    pointCloudInteraction.energy = 1;
    pointCloudInteraction.completed = true;
  }
  commitInterestDemoControl();
}

function resetInterestDemo() {
  const type = activeInterestAnimationType();
  if (type === 'point-cloud') {
    registrationState.params = { noise: 12, missing: 18, rotation: 34 };
    pointCloudInteraction.active = false;
    pointCloudInteraction.dragging = false;
    pointCloudInteraction.x = 0.5;
    pointCloudInteraction.y = 0.5;
    pointCloudInteraction.scrub = 0.48;
    pointCloudInteraction.targetScrub = 0.48;
    pointCloudInteraction.energy = 0;
    pointCloudInteraction.completed = false;
  }
  commitInterestDemoControl();
}

interestDemoPrevious?.addEventListener('click', runInterestDemoPrevious);
interestDemoAction?.addEventListener('click', runInterestDemoAction);
interestDemoReset?.addEventListener('click', resetInterestDemo);


function drawInterestAnimation() {
  const { width, height } = interestCanvasSize;
  if (width < 2 || height < 2) return;
  const entry = activeInterestEntry();
  if (!entry) return;
  const type = entry.child.animation;
  const primary = themeColor('--cyan') || '#00f5ff';
  const secondary = themeColor('--pink') || '#ff2e88';
  const muted = themeColor('--muted') || '#9ca9cf';
  const t = interestTick * 0.05;

  interestCtx.clearRect(0, 0, width, height);
  interestCtx.fillStyle = 'rgba(3, 7, 18, 0.46)';
  interestCtx.fillRect(0, 0, width, height);
  interestCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  interestCtx.lineWidth = 1;
  for (let x = 24; x < width; x += 36) {
    interestCtx.beginPath();
    interestCtx.moveTo(x, 0);
    interestCtx.lineTo(x, height);
    interestCtx.stroke();
  }
  for (let y = 24; y < height; y += 36) {
    interestCtx.beginPath();
    interestCtx.moveTo(0, y);
    interestCtx.lineTo(width, y);
    interestCtx.stroke();
  }

  if (type === 'point-cloud') {
    const cx = width * 0.5;
    const cy = height * 0.52;
    const scale = Math.min(width, height) * 0.8;
    const pointerX = pointCloudInteraction.x * width;
    const pointerY = pointCloudInteraction.y * height;
    const autoScrub = 0.36 + Math.sin(t * 0.74) * 0.28;
    pointCloudInteraction.targetScrub = pointCloudInteraction.dragging
      ? pointCloudInteraction.targetScrub
      : pointCloudInteraction.active
        ? pointCloudInteraction.x
        : autoScrub;
    pointCloudInteraction.scrub += (pointCloudInteraction.targetScrub - pointCloudInteraction.scrub) * (pointCloudInteraction.dragging ? 0.72 : 0.18);
    pointCloudInteraction.energy += ((pointCloudInteraction.active ? 1 : 0) - pointCloudInteraction.energy) * 0.16;
    const progress = Math.max(0, Math.min(1, pointCloudInteraction.scrub));
    const params = registrationParams();

    registrationState.points.forEach((point, index) => {
      const target = transformPoint(point, index, params);
      if (!target.visible) return;
      const sourceX = cx + point.x * scale;
      const sourceY = cy + point.y * scale;
      const targetX = cx + target.x * scale;
      const targetY = cy + target.y * scale;
      let x = sourceX + (targetX - sourceX) * progress;
      let y = sourceY + (targetY - sourceY) * progress;
      const pointerDistance = Math.hypot(pointerX - x, pointerY - y);
      const influence = pointCloudInteraction.active
        ? Math.max(0, 1 - pointerDistance / (scale * 0.52)) ** 1.35
        : 0;
      const orbit = Math.sin(t + index * 0.43) * influence * scale * 0.022;
      x += (targetX - x) * influence * 0.92 + orbit;
      y += (targetY - y) * influence * 0.92 - orbit;

      interestCtx.beginPath();
      interestCtx.arc(sourceX, sourceY, 2.1, 0, Math.PI * 2);
      interestCtx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      interestCtx.fill();

      interestCtx.beginPath();
      interestCtx.arc(targetX, targetY, 2.8, 0, Math.PI * 2);
      interestCtx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      interestCtx.fill();

      interestCtx.beginPath();
      interestCtx.moveTo(x, y);
      interestCtx.lineTo(targetX, targetY);
      interestCtx.strokeStyle = `rgba(232, 240, 255, ${0.08 + influence * 0.34})`;
      interestCtx.lineWidth = 0.8 + influence * 1.7;
      interestCtx.stroke();

      interestCtx.beginPath();
      interestCtx.arc(x, y, 3.8 + influence * 6.4, 0, Math.PI * 2);
      interestCtx.fillStyle = index % 2 ? primary : secondary;
      interestCtx.fill();
    });

    if (pointCloudInteraction.energy > 0.02) {
      const lens = interestCtx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, scale * 0.22);
      lens.addColorStop(0, `rgba(255, 255, 255, ${0.2 * pointCloudInteraction.energy})`);
      lens.addColorStop(0.58, `rgba(255, 255, 255, ${0.05 * pointCloudInteraction.energy})`);
      lens.addColorStop(1, 'rgba(255, 255, 255, 0)');
      interestCtx.fillStyle = lens;
      interestCtx.beginPath();
      interestCtx.arc(pointerX, pointerY, scale * 0.22, 0, Math.PI * 2);
      interestCtx.fill();

      interestCtx.beginPath();
      interestCtx.arc(pointerX, pointerY, scale * 0.16 + Math.sin(t * 1.5) * 5, 0, Math.PI * 2);
      interestCtx.strokeStyle = `rgba(255, 255, 255, ${(pointCloudInteraction.dragging ? 0.72 : 0.38) * pointCloudInteraction.energy})`;
      interestCtx.lineWidth = pointCloudInteraction.dragging ? 2.8 : 1.8;
      interestCtx.stroke();

      if (pointCloudInteraction.dragging) {
        interestCtx.beginPath();
        interestCtx.moveTo(pointerX, 16);
        interestCtx.lineTo(pointerX, height - 16);
        interestCtx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        interestCtx.lineWidth = 1;
        interestCtx.stroke();
      }
    }

    const barWidth = Math.min(220, width * 0.46);
    const barX = width - barWidth - 18;
    const barY = height - 20;
    interestCtx.lineCap = 'round';
    interestCtx.lineWidth = 8;
    interestCtx.beginPath();
    interestCtx.moveTo(barX, barY);
    interestCtx.lineTo(barX + barWidth, barY);
    interestCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    interestCtx.stroke();
    interestCtx.beginPath();
    interestCtx.moveTo(barX, barY);
    interestCtx.lineTo(barX + barWidth * progress, barY);
    interestCtx.strokeStyle = secondary;
    interestCtx.stroke();
    interestCtx.beginPath();
    interestCtx.arc(barX + barWidth * progress, barY, pointCloudInteraction.dragging ? 8 : 6, 0, Math.PI * 2);
    interestCtx.fillStyle = primary;
    interestCtx.fill();
    interestCtx.strokeStyle = 'rgba(3, 7, 18, 0.8)';
    interestCtx.lineWidth = 2;
    interestCtx.stroke();
    interestCtx.lineCap = 'butt';
    interestCtx.lineWidth = 1;
  }
}
function updatePointCloudPointer(event) {
  const pointer = interestPointer(event);
  pointCloudInteraction.x = clamp01(pointer.x / Math.max(1, interestCanvasSize.width));
  pointCloudInteraction.y = clamp01(pointer.y / Math.max(1, interestCanvasSize.height));
  pointCloudInteraction.active = true;
  pointCloudInteraction.targetScrub = pointCloudInteraction.x;
  pointCloudInteraction.completed = pointCloudInteraction.x >= 0.999;
  if (pointCloudInteraction.dragging) pointCloudInteraction.scrub = pointCloudInteraction.x;
}
function canvasCursorForActiveInterest() { return pointCloudInteraction.dragging ? 'grabbing' : 'crosshair'; }
function drawInterestInteractionFrame() {
  if (!isPointCloudInterestActive() || document.visibilityState !== 'visible' || !interestCanvasVisible || !isResearchViewActive()) return;
  drawInterestAnimation();
}
interestCanvas.addEventListener('pointerenter', (event) => {
  if (isPointCloudInterestActive()) updatePointCloudPointer(event);
});
interestCanvas.addEventListener('pointermove', (event) => {
  if (!isPointCloudInterestActive()) return;
  updatePointCloudPointer(event);
  if (isInterestDragging()) drawInterestInteractionFrame();
});
interestCanvas.addEventListener('pointerdown', (event) => {
  if (!isPointCloudInterestActive()) return;
  event.preventDefault();
  pointCloudInteraction.dragging = true;
  updatePointCloudPointer(event);
  interestCanvas.style.cursor = 'grabbing';
  try { interestCanvas.setPointerCapture?.(event.pointerId); } catch { /* Synthetic events may not own capture. */ }
  drawInterestInteractionFrame();
  requestMotionFrame({ immediate: true });
});
interestCanvas.addEventListener('pointerup', (event) => {
  if (!isPointCloudInterestActive()) return;
  pointCloudInteraction.dragging = false;
  updatePointCloudPointer(event);
  updateInterestCanvasAccessibility();
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
  try { interestCanvas.releasePointerCapture?.(event.pointerId); } catch { /* Synthetic events may not own capture. */ }
  drawInterestInteractionFrame();
  requestMotionFrame({ immediate: true });
});
interestCanvas.addEventListener('pointercancel', () => {
  pointCloudInteraction.dragging = false;
  pointCloudInteraction.active = false;
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
  drawInterestInteractionFrame();
});
interestCanvas.addEventListener('pointerleave', () => {
  if (pointCloudInteraction.dragging) return;
  pointCloudInteraction.active = false;
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
  drawInterestInteractionFrame();
});
  function frameInterval() {
    if (isInterestDragging()) return INTEREST_DESKTOP_FRAME_MS;
    return compactInterestMotionQuery.matches ? INTEREST_MOBILE_IDLE_FRAME_MS : INTEREST_DESKTOP_FRAME_MS;
  }

  function render() {
    if (!interestCanvas || !interestCtx) return;
    if (!showActivePresentation()) return;
    if (interestCanvasSize.width < 2 || interestCanvasSize.height < 2) measureInterestCanvasSize();
    syncContext();
    updateInterestCanvasAccessibility();
    interestCanvas.style.cursor = canvasCursorForActiveInterest();
    drawInterestAnimation();
  }

  function frame(timestamp = 0) {
    const { lang, reducedMotion } = getContext();
    if (!isPointCloudInterestActive() || reducedMotion || document.visibilityState !== 'visible' || !interestCanvasVisible || !isResearchViewActive()) return false;
    if (timestamp - lastInterestFrame < frameInterval()) return false;
    lastInterestFrame = timestamp;
    currentLang = lang;
    interestTick += 1;
    drawInterestAnimation();
    return true;
  }

  function contextChanged() {
    syncContext();
    themeColorCache.clear();
    lastInterestFrame = 0;
    if (!showActivePresentation()) return;
    updateInterestCanvasAccessibility();
    if (isResearchViewActive() && interestCanvasVisible) drawInterestAnimation();
  }

  function resize() {
    measureInterestCanvasSize();
    render();
  }

  generateRegistrationPoints();
  syncContext();
  measureInterestCanvasSize();

  if ('ResizeObserver' in window && interestCanvas) {
    const resizeObserver = new ResizeObserver(([entry]) => {
      const rect = entry?.contentRect;
      if (!rect || !updateInterestCanvasSize(rect.width, rect.height)) return;
      if (isResearchViewActive() && interestCanvasVisible) render();
      requestMotionFrame({ immediate: true });
    });
    resizeObserver.observe(interestCanvas);
  }

  if ('IntersectionObserver' in window && interestCanvas) {
    const observer = new IntersectionObserver(([entry]) => {
      const nextVisible = Boolean(entry?.isIntersecting);
      if (interestCanvasVisible === nextVisible) return;
      interestCanvasVisible = nextVisible;
      lastInterestFrame = 0;
      if (nextVisible && isResearchViewActive() && document.visibilityState === 'visible') {
        render();
      }
      requestMotionFrame({ immediate: nextVisible });
    }, { threshold: 0.05 });
    observer.observe(interestCanvas);
  }

  compactInterestMotionQuery.addEventListener?.('change', () => {
    lastInterestFrame = 0;
    if (isResearchViewActive() && interestCanvasVisible) requestMotionFrame({ immediate: true });
  });

  researchCanvasInstance = {
    bindItem: bindItemToInterestAnimation,
    cadence: frameInterval,
    contextChanged,
    frame,
    getRegistrationParams: () => ({ ...registrationParams() }),
    isVisible: () => isPointCloudInterestActive() && interestCanvasVisible,
    render,
    resize,
    scrollIntoView: () => (isPointCloudInterestActive() ? interestCanvas : topicExperiences.element)?.scrollIntoView({ behavior: getContext().reducedMotion ? 'auto' : 'smooth', block: 'center' })
  };
  return researchCanvasInstance;
}
