const mounted = new WeakMap();
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => value * value * (3 - 2 * value);
const fract = (value) => value - Math.floor(value);

function topicKey(id) {
  const name = String(id || '').toLowerCase();
  if (name === 'vpr') return 'vpr';
  if (name.includes('agent')) return 'agent';
  if (name === 'ai4edu' || name === 'education') return 'education';
  if (name.includes('medical')) return 'medical';
  if (name.includes('generative')) return 'generative';
  return 'arch';
}

function boxPoint(u, v, face, x, y, z, width, height, depth) {
  const a = u - 0.5;
  const b = v - 0.5;
  if (face === 0) return [x + a * width, y + b * height, z + depth / 2];
  if (face === 1) return [x + width / 2, y + b * height, z + a * depth];
  if (face === 2) return [x + a * width, y + height / 2, z + b * depth];
  if (face === 3) return [x - width / 2, y + b * height, z + a * depth];
  return [x + a * width, y + b * height, z - depth / 2];
}

// Deterministic surface samples keep every topic recognizable without an asset download.
function makeShape(key, count) {
  const result = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const u = fract(i * 0.61803398875);
    const v = fract(i * 0.41421356237);
    let point;
    if (key === 'vpr') {
      if (i % 7 === 0) {
        point = [(u - 0.5) * 4.6, -1.45, (v - 0.5) * 3.4];
      } else {
        const block = i % 10;
        const side = block % 2 ? 1 : -1;
        const row = Math.floor(block / 2);
        const height = [1.2, 1.85, 2.6, 1.5, 2.15][row];
        const sample = Math.floor(i / 10);
        const grid = Math.floor(sample / 5);
        point = boxPoint((grid % 7) / 6, (Math.floor(grid / 7) % 7) / 6, sample % 5,
          side * (1.05 + (row % 2) * 0.14), -1.4 + height / 2,
          (row - 2) * 0.68, 0.86, height, 0.52);
      }
    } else if (key === 'agent') {
      const layer = i % 3;
      const cell = Math.floor(i / 3) % 35;
      const column = cell % 7;
      const row = Math.floor(cell / 7);
      const x = (column - 3) * 0.4 + (layer - 1) * 0.18;
      const y = 0.8 - row * 0.43 + layer * 0.15;
      const z = (layer - 1) * 0.78;
      const sample = Math.floor(i / 105) % 24;
      const edge = Math.floor(sample / 6);
      const along = sample % 6 / 5 - 0.5;
      point = [x + (edge % 2 ? (edge === 1 ? 0.155 : -0.155) : along * 0.31),
        y + (edge % 2 ? along * 0.32 : (edge === 0 ? 0.16 : -0.16)), z];
      if (i % 19 === 0) point = [(u - 0.5) * 2.85, 1.19 + layer * 0.15, z];
    } else if (key === 'education') {
      const tile = i % 12;
      const column = tile % 4;
      const row = Math.floor(tile / 4);
      const lift = column > row ? 0.26 * (column - row) : 0;
      const sample = Math.floor(i / 12);
      const grid = Math.floor(sample / 5);
      point = boxPoint((grid % 7) / 6, (Math.floor(grid / 7) % 7) / 6, sample % 5,
        (column - 1.5) * 0.86, -0.72 + row * 0.56 + lift,
        (row - 1) * 0.86, 0.74, 0.38, 0.74);
    } else if (key === 'medical') {
      const slice = i % 28;
      const y = (slice / 27 - 0.5) * 2.85;
      const angle = u * TAU;
      const envelope = Math.pow(Math.max(0.035, 1 - (y / 1.57) ** 2), 0.55);
      const radius = envelope * (0.82 + 0.14 * Math.cos(angle * 3 + y * 1.4));
      point = [Math.cos(angle) * radius + 0.15 * Math.sin(y * 2), y,
        Math.sin(angle) * radius * 0.79];
      if (i % 9 === 0) point = [0.28 * Math.sin(y * 2.6), y, 0.22 * Math.cos(y * 2.6)];
    } else if (key === 'generative') {
      const token = i % 5;
      const angle = u * TAU;
      const edge = Math.floor(u * 6);
      const along = fract(u * 6);
      const a = edge * TAU / 6;
      const b = (edge + 1) * TAU / 6;
      const radius = token === 2 ? 1.08 : 0.72;
      const x = (Math.cos(a) * (1 - along) + Math.cos(b) * along) * radius;
      const y = (Math.sin(a) * (1 - along) + Math.sin(b) * along) * radius;
      const face = Math.floor(i / 5) % 3;
      const scale = face === 0 ? Math.sqrt(v) : 1;
      point = [x * scale + (token - 2) * 0.41,
        y * scale + Math.sin(token * 1.2) * 0.3,
        (token - 2) * 0.57 + (face === 0 ? 0.09 : (v - 0.5) * 0.18)];
      if (i % 23 === 0) point = [Math.cos(angle) * 1.85, -1.35, Math.sin(angle) * 1.3];
    } else {
      const rib = i % 9;
      const sample = Math.floor(i / 9);
      const t = (sample % 72) / 71;
      const band = Math.floor(sample / 72);
      const radius = 1.13 + band * 0.12;
      let x;
      let y;
      if (t < 0.22) {
        x = -radius;
        y = -1.38 + (t / 0.22) * 1.55;
      } else if (t > 0.78) {
        x = radius;
        y = 0.17 - ((t - 0.78) / 0.22) * 1.55;
      } else {
        const angle = Math.PI * (1 - (t - 0.22) / 0.56);
        x = Math.cos(angle) * radius;
        y = 0.17 + Math.sin(angle) * (radius * 1.04);
      }
      const lean = (rib - 4) * 0.043;
      point = [x + lean, y + Math.sin(rib * 0.35) * 0.045, (rib - 4) * 0.285];
    }
    result.set(point, i * 3);
  }
  return result;
}

function makeTints(key, count) {
  const tints = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const seed = fract(i * 0.754877666);
    const pink = key === 'vpr' ? i % 2 === 0
      : key === 'agent' ? i % 3 === 2
        : key === 'education' ? i % 4 > 1
          : key === 'medical' ? i % 28 > 19
            : key === 'generative' ? i % 5 > 2 : i % 9 > 5;
    tints[i] = pink ? 0.72 + seed * 0.28 : seed * 0.42;
  }
  return tints;
}

const vertexShader = `
  attribute vec3 aNext;
  attribute float aSeed;
  attribute float aTint;
  uniform float uMorph;
  uniform float uReveal;
  uniform float uPixelRatio;
  uniform float uPointSize;
  uniform float uScatter;
  uniform vec2 uPointer;
  uniform float uAspect;
  varying float vTint;
  varying float vAlpha;
  void main() {
    vec3 p = mix(position, aNext, uMorph);
    float opening = 1.0 - uReveal;
    p.x += sin(aSeed * 63.0) * opening * 0.38;
    p.y -= opening * (0.35 + aSeed * 0.35);
    p.z += cos(aSeed * 47.0) * opening * 0.6;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * viewPosition;
    vec2 delta = clip.xy / clip.w - uPointer;
    delta.x *= uAspect;
    float local = 1.0 - smoothstep(0.0, 0.34, length(delta));
    vec2 direction = normalize(delta + vec2(0.0001));
    viewPosition.xy += (direction * 0.32 + vec2(sin(aSeed * 87.0), cos(aSeed * 71.0)) * 0.16)
      * local * uScatter;
    viewPosition.z += sin(aSeed * 51.0) * local * uScatter * 0.2;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(uPointSize * uPixelRatio * (7.5 / -viewPosition.z)
      * (0.82 + aSeed * 0.32), 1.0, 6.0 * uPixelRatio);
    vTint = aTint;
    vAlpha = (0.7 + aSeed * 0.3) * (0.3 + uReveal * 0.7);
  }
`;

const fragmentShader = `
  uniform vec3 uMint;
  uniform vec3 uPink;
  uniform vec3 uPale;
  varying float vTint;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = (1.0 - smoothstep(0.28, 0.5, d)) * vAlpha;
    vec3 color = mix(uMint, uPink, smoothstep(0.42, 0.65, vTint));
    color = mix(color, uPale, step(0.94, vTint) * 0.6);
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Mounts asynchronously and returns synchronous controls. The fallback is never removed.
 * `motion` accepts a boolean, a function, or an object with enabled(); SiteMotion and
 * prefers-reduced-motion are also respected. The canvas tracks the fallback's bounds;
 * set --hero-scene-bounds: host for a full-host scene. --hero-scene-center-x/y
 * (0..1, default .5) can reserve space for copy in that full-width host.
 */
export function mountHeroScene({ host, fallback, getTopic, motion } = {}) {
  if (!host?.ownerDocument) {
    return { setTopic() {}, themeChanged() {}, pause() {}, resume() {}, destroy() {} };
  }
  mounted.get(host)?.destroy();
  const doc = host.ownerDocument;
  const view = doc.defaultView;
  const media = view.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = view.matchMedia('(max-width: 640px), (pointer: coarse)').matches;
  const count = mobile ? 1944 : 2592;
  const cleanup = [];
  let key = 'arch';
  try { key = topicKey(typeof getTopic === 'function' ? getTopic() : getTopic); } catch { /* Keep the default sculpture. */ }
  let destroyed = false;
  let failed = false;
  let paused = false;
  let inView = false;
  let ready = false;
  let prepared = false;
  let cancelStartup = null;
  let renderer;
  let scene;
  let camera;
  let sculpture;
  let geometry;
  let material;
  let stage;
  let canvas;
  let raf = 0;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let rect;
  let revealStart = 0;
  let morphStart = 0;
  let pulseStart = -Infinity;
  let lastTime = 0;
  let frameDeadline = 0;
  let pendingMorph = false;
  let currentYaw = -0.28;
  let targetYaw = -0.28;
  let currentPitch = 0;
  let targetPitch = 0;
  let dragYaw = 0;
  let dragPitch = 0;
  let pointerX = 0;
  let pointerY = 0;
  let drag = null;
  let centerX = 0.5;
  let centerY = 0.5;
  let useFallbackBounds = true;
  let shaderFailed = false;
  let nextShape;

  function enabled() {
    if (media.matches || view.SiteMotion?.enabled?.() === false) return false;
    if (typeof motion === 'boolean') return motion;
    if (typeof motion === 'function') return Boolean(motion());
    return motion?.enabled?.() !== false;
  }

  function on(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    cleanup.push(() => target.removeEventListener(type, listener, options));
  }

  function cancel() {
    if (raf) view.cancelAnimationFrame(raf);
    raf = 0;
    lastTime = 0;
  }

  // Separate context creation, scene setup, and shader warmup into browser tasks.
  function yieldStartup() {
    if (destroyed || failed) return Promise.resolve(false);
    return new Promise((resolve) => {
      const idle = typeof view.requestIdleCallback === 'function';
      const finish = () => {
        cancelStartup = null;
        resolve(!destroyed && !failed);
      };
      const handle = idle ? view.requestIdleCallback(finish, { timeout: 200 }) : view.setTimeout(finish, 0);
      cancelStartup = () => {
        if (idle) view.cancelIdleCallback(handle);
        else view.clearTimeout(handle);
        cancelStartup = null;
        resolve(false);
      };
    });
  }

  function canRender() {
    return !destroyed && !failed && !paused && inView && !doc.hidden
      && prepared && renderer && width > 0 && height > 0;
  }

  function restoreFallback() {
    host.classList.remove('hero-scene-ready');
    if (canvas) canvas.tabIndex = -1;
  }

  function releaseGraphics() {
    geometry?.dispose();
    material?.dispose();
    stage?.geometry.dispose();
    stage?.material.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    canvas?.remove();
  }

  function fail() {
    if (failed || destroyed) return;
    failed = true;
    cancel();
    cancelStartup?.();
    cleanup.splice(0).forEach((dispose) => dispose());
    restoreFallback();
    releaseGraphics();
    host.dispatchEvent(new view.CustomEvent('hero-scene:error'));
  }

  function readTheme() {
    if (!material || destroyed || failed) return;
    const styles = view.getComputedStyle(host);
    const color = (name, defaultColor) => styles.getPropertyValue(name).trim() || defaultColor;
    material.uniforms.uMint.value.set(color('--cyan', '#75dcc8'));
    material.uniforms.uPink.value.set(color('--pink', '#f2b8bf'));
    material.uniforms.uPale.value.set(color('--text', '#eef3f3'));
    stage.material.color.set(color('--line', '#607078'));
    const x = Number.parseFloat(styles.getPropertyValue('--hero-scene-center-x'));
    const y = Number.parseFloat(styles.getPropertyValue('--hero-scene-center-y'));
    centerX = Number.isFinite(x) ? clamp(x, 0.2, 0.8) : 0.5;
    centerY = Number.isFinite(y) ? clamp(y, 0.2, 0.8) : 0.5;
    useFallbackBounds = styles.getPropertyValue('--hero-scene-bounds').trim() !== 'host';
  }

  function size() {
    if (!renderer || !material || failed || destroyed) return;
    const hostRect = host.getBoundingClientRect();
    const fallbackRect = useFallbackBounds && host.contains(fallback) ? fallback.getBoundingClientRect() : null;
    rect = fallbackRect?.width && fallbackRect?.height ? fallbackRect : hostRect;
    const previousWidth = width;
    const previousHeight = height;
    width = rect.width;
    height = rect.height;
    if (!width || !height) return;
    canvas.style.left = `${rect.left - hostRect.left - host.clientLeft + host.scrollLeft}px`;
    canvas.style.top = `${rect.top - hostRect.top - host.clientTop + host.scrollTop}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const compact = view.matchMedia('(max-width: 640px), (pointer: coarse)').matches;
    const nextPixelRatio = Math.min(view.devicePixelRatio || 1, compact ? 1 : 1.5);
    if (width !== previousWidth || height !== previousHeight || nextPixelRatio !== pixelRatio) {
      pixelRatio = nextPixelRatio;
      renderer.setDrawingBufferSize(width, height, pixelRatio);
    }
    camera.aspect = width / height;
    const fit = Math.min(camera.aspect * 2 * Math.min(centerX, 1 - centerX), 1.35);
    const distance = Math.max(7.4 / (2 * Math.min(centerY, 1 - centerY)), 6.3 / Math.max(0.35, fit));
    camera.position.set(distance * 0.34, distance * 0.19, distance);
    camera.lookAt(0, -0.04, 0);
    camera.setViewOffset(width, height, width * (0.5 - centerX), height * (0.5 - centerY), width, height);
    camera.updateProjectionMatrix();
    material.uniforms.uPixelRatio.value = pixelRatio;
    material.uniforms.uAspect.value = camera.aspect;
    material.uniforms.uPointSize.value = compact ? 2.5 : 2.15;
  }

  function settle() {
    if (!material) return;
    material.uniforms.uReveal.value = 1;
    material.uniforms.uMorph.value = 1;
    material.uniforms.uScatter.value = 0;
    currentYaw = targetYaw;
    currentPitch = targetPitch;
    revealStart = 0;
    morphStart = 0;
    pendingMorph = false;
  }

  function draw(time) {
    raf = 0;
    if (!canRender()) return;
    const animate = enabled();
    if (!ready && animate && !revealStart) revealStart = time;
    if (pendingMorph && animate) {
      morphStart = time;
      pendingMorph = false;
    }
    const dt = lastTime ? Math.min(time - lastTime, 48) : 16;
    lastTime = time;
    if (!animate || (ready && time > frameDeadline)) {
      settle();
    } else {
      if (revealStart) material.uniforms.uReveal.value = smooth(clamp((time - revealStart) / 1050, 0, 1));
      if (morphStart) material.uniforms.uMorph.value = smooth(clamp((time - morphStart) / 850, 0, 1));
      const pulse = clamp((time - pulseStart) / 800, 0, 1);
      material.uniforms.uScatter.value = Math.sin(pulse * Math.PI) * (1 - pulse) * 1.55;
      const ease = 1 - Math.exp(-dt / 110);
      currentYaw += (targetYaw - currentYaw) * ease;
      currentPitch += (targetPitch - currentPitch) * ease;
    }
    sculpture.rotation.set(currentPitch, currentYaw, 0);
    try {
      renderer.render(scene, camera);
      if (shaderFailed || renderer.getContext().isContextLost()) return fail();
      if (!ready) {
        if (!renderer.info.render.points || renderer.getContext().getError() !== 0) return fail();
        ready = true;
        canvas.tabIndex = 0;
        host.classList.add('hero-scene-ready');
        host.dispatchEvent(new view.CustomEvent('hero-scene:ready'));
      }
    } catch {
      fail();
      return;
    }
    const busy = material.uniforms.uReveal.value < 1 || material.uniforms.uMorph.value < 1
      || time - pulseStart < 800 || Math.abs(targetYaw - currentYaw) > 0.0003
      || Math.abs(targetPitch - currentPitch) > 0.0003;
    if (animate && busy && time < frameDeadline) raf = view.requestAnimationFrame(draw);
    else lastTime = 0;
  }

  function requestFrame(duration = 0) {
    if (!canRender()) return;
    frameDeadline = Math.max(frameDeadline, view.performance.now() + Math.min(duration, 1800));
    if (!raf) raf = view.requestAnimationFrame(draw);
  }

  function resetPointer() {
    pointerX = 0;
    pointerY = 0;
    targetYaw = -0.28 + dragYaw;
    targetPitch = dragPitch;
    pulseStart = -Infinity;
    requestFrame(800);
  }

  function endDrag(event) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const id = drag.id;
    drag = null;
    canvas?.classList.remove('is-dragging');
    if (canvas?.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    resetPointer();
  }

  function syncMotion() {
    cancel();
    endDrag();
    resetPointer();
    if (!enabled()) settle();
    requestFrame(0);
  }

  const api = {
    setTopic(id) {
      if (destroyed || failed) return;
      const nextKey = topicKey(id);
      if (key === nextKey) return;
      key = nextKey;
      if (!geometry) return;
      nextShape = makeShape(key, count);
      const current = geometry.attributes.position;
      const next = geometry.attributes.aNext;
      const progress = material.uniforms.uMorph.value;
      for (let i = 0; i < current.array.length; i += 1) {
        current.array[i] += (next.array[i] - current.array[i]) * progress;
      }
      current.needsUpdate = true;
      next.array.set(nextShape);
      next.needsUpdate = true;
      geometry.attributes.aTint.array.set(makeTints(key, count));
      geometry.attributes.aTint.needsUpdate = true;
      material.uniforms.uMorph.value = 0;
      pendingMorph = true;
      morphStart = 0;
      host.dataset.heroSceneTopic = key;
      requestFrame(1200);
    },
    themeChanged() {
      readTheme();
      size();
      requestFrame();
    },
    pause() {
      paused = true;
      cancel();
      endDrag();
    },
    resume() {
      if (destroyed || failed) return;
      paused = false;
      size();
      requestFrame(1200);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancel();
      cancelStartup?.();
      endDrag();
      cleanup.splice(0).forEach((dispose) => dispose());
      restoreFallback();
      releaseGraphics();
      host.classList.remove('hero-scene-host', 'hero-scene-positioned');
      fallback?.classList.remove('hero-scene-fallback');
      delete host.dataset.heroSceneTopic;
      mounted.delete(host);
    }
  };
  mounted.set(host, api);

  async function boot() {
    try {
      const moduleUrl = new URL('./assets/vendor/three/three.module.min.js', import.meta.url);
      const version = new URL(import.meta.url).searchParams.get('v');
      if (version) moduleUrl.searchParams.set('v', version);
      const retry = new URL(import.meta.url).searchParams.get('retry');
      if (retry) moduleUrl.searchParams.set('retry', retry);
      const THREE = await import(moduleUrl.href);
      if (!await yieldStartup()) return;
      canvas = doc.createElement('canvas');
      canvas.className = 'hero-scene-canvas';
      canvas.tabIndex = -1;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', host.getAttribute('aria-label') || 'Spatial point sculpture');
      canvas.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown Home');
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.debug.onShaderError = () => { shaderFailed = true; };
      on(canvas, 'webglcontextlost', (event) => { event.preventDefault(); fail(); });
      if (!await yieldStartup()) return;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
      sculpture = new THREE.Group();
      scene.add(sculpture);
      nextShape = makeShape(key, count);
      const seeds = new Float32Array(count);
      for (let i = 0; i < count; i += 1) {
        seeds[i] = fract(i * 0.754877666);
      }
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(nextShape.slice(), 3));
      geometry.setAttribute('aNext', new THREE.BufferAttribute(nextShape.slice(), 3));
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
      geometry.setAttribute('aTint', new THREE.BufferAttribute(makeTints(key, count), 1));
      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader,
        fragmentShader,
        uniforms: {
          uMint: { value: new THREE.Color() },
          uPink: { value: new THREE.Color() },
          uPale: { value: new THREE.Color() },
          uMorph: { value: 1 },
          uReveal: { value: 0 },
          uScatter: { value: 0 },
          uPixelRatio: { value: 1 },
          uPointSize: { value: 2.15 },
          uAspect: { value: 1 },
          uPointer: { value: new THREE.Vector2(20, 20) }
        }
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      sculpture.add(points);
      const floor = [];
      for (let i = -3; i <= 3; i += 1) {
        const n = i * 0.6;
        floor.push(-2.15, -1.48, n, 2.15, -1.48, n);
        floor.push(n, -1.48, -1.9, n, -1.48, 1.9);
      }
      stage = new THREE.LineSegments(
        new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(floor, 3)),
        new THREE.LineBasicMaterial({ transparent: true, opacity: 0.16, depthWrite: false })
      );
      sculpture.add(stage);
      if (view.getComputedStyle(host).position === 'static') host.classList.add('hero-scene-positioned');
      host.classList.add('hero-scene-host');
      fallback?.classList.add('hero-scene-fallback');
      host.dataset.heroSceneTopic = key;
      host.append(canvas);
      readTheme();
      size();
      inView = rect?.bottom > 0 && rect?.top < view.innerHeight
        && rect?.right > 0 && rect?.left < view.innerWidth;

      on(canvas, 'pointerdown', (event) => {
        if (!event.isPrimary || event.button !== 0 || paused) return;
        rect = canvas.getBoundingClientRect();
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: dragYaw, captured: false };
        if (event.pointerType !== 'touch') canvas.focus({ preventScroll: true });
      });
      on(canvas, 'pointermove', (event) => {
        if (paused || !inView) return;
        if (drag && event.pointerId === drag.id) {
          const dx = event.clientX - drag.x;
          const dy = event.clientY - drag.y;
          if (!drag.captured && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
            endDrag(event);
            return;
          }
          if (!drag.captured && Math.abs(dx) > 7) {
            drag.captured = true;
            canvas.setPointerCapture(event.pointerId);
            canvas.classList.add('is-dragging');
          }
          if (drag.captured) dragYaw = clamp(drag.yaw + dx / Math.max(240, width) * 2.5, -1.3, 1.3);
        } else if (event.pointerType === 'touch') return;
        rect = canvas.getBoundingClientRect();
        pointerX = clamp((event.clientX - rect.left) / width * 2 - 1, -1, 1);
        pointerY = clamp((event.clientY - rect.top) / height * 2 - 1, -1, 1);
        const animate = enabled();
        targetYaw = -0.28 + dragYaw + (animate ? pointerX * 0.075 : 0);
        targetPitch = dragPitch + (animate ? pointerY * 0.045 : 0);
        material.uniforms.uPointer.value.set(pointerX, -pointerY);
        pulseStart = view.performance.now();
        requestFrame(1100);
      }, { passive: true });
      on(canvas, 'pointerup', endDrag);
      on(canvas, 'pointercancel', endDrag);
      on(canvas, 'lostpointercapture', endDrag);
      on(canvas, 'pointerleave', () => { if (!drag?.captured) { endDrag(); resetPointer(); } });
      on(canvas, 'blur', () => { endDrag(); resetPointer(); });
      on(canvas, 'keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || paused) return;
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Escape', 'r', 'R'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'ArrowLeft') dragYaw = clamp(dragYaw - 0.16, -1.3, 1.3);
        else if (event.key === 'ArrowRight') dragYaw = clamp(dragYaw + 0.16, -1.3, 1.3);
        else if (event.key === 'ArrowUp') dragPitch = clamp(dragPitch - 0.08, -0.3, 0.3);
        else if (event.key === 'ArrowDown') dragPitch = clamp(dragPitch + 0.08, -0.3, 0.3);
        else { dragYaw = 0; dragPitch = 0; }
        resetPointer();
      });
      on(doc, 'visibilitychange', () => {
        cancel();
        if (doc.hidden) endDrag();
        else requestFrame(1200);
      });
      on(view, 'site:motion-change', syncMotion);
      on(media, 'change', syncMotion);
      on(view, 'resize', () => { readTheme(); size(); requestFrame(); }, { passive: true });
      if ('IntersectionObserver' in view) {
        const observer = new view.IntersectionObserver(([entry]) => {
          inView = Boolean(entry?.isIntersecting);
          if (inView) requestFrame(1200);
          else { cancel(); endDrag(); }
        }, { threshold: 0 });
        observer.observe(canvas);
        cleanup.push(() => observer.disconnect());
      }
      if ('ResizeObserver' in view) {
        const observer = new view.ResizeObserver(() => { readTheme(); size(); requestFrame(); });
        observer.observe(host);
        if (fallback && host.contains(fallback)) observer.observe(fallback);
        cleanup.push(() => observer.disconnect());
      }
      if ('MutationObserver' in view) {
        const observer = new view.MutationObserver(() => api.themeChanged());
        observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        cleanup.push(() => observer.disconnect());
      }
      if (!await yieldStartup()) return;
      // With KHR_parallel_shader_compile this waits without forcing first-use shader queries.
      await renderer.compileAsync(scene, camera);
      if (destroyed || failed) return;
      prepared = true;
      if (!enabled()) settle();
      requestFrame(1500);
    } catch {
      fail();
    }
  }
  void boot();
  return api;
}
