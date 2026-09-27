import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { VPR_ROUNDS, evaluatePlaceChoice, MEDICAL_SAMPLES, createAnnotationState, annotateSample, undoAnnotation, rankUnlabeledSamples } from '../topic-perception.js';
import { createInitialCalendar, proposeSchedule, RECTANGLE_EXERCISES, evaluateRectangle } from '../topic-workbench.js';

const read = name => fs.readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const canvasSource = await read('research-canvas.js');

test('place recognition keys use invariant landmarks rather than day/night appearance', () => {
  for (const round of VPR_ROUNDS) {
    const matches = round.candidates.filter(candidate => evaluatePlaceChoice(round.id, candidate.id).samePlace);
    assert.equal(matches.length, 1);
    assert.notEqual(matches[0].time, round.view.time);
    for (const candidate of round.candidates) {
      const result = evaluatePlaceChoice(round.id, candidate.id);
      assert.equal(result.samePlace, result.landmarks.every(item => item.matches));
    }
  }
  assert.throws(() => evaluatePlaceChoice('missing', 'A'), RangeError);
});

test('annotation consumes budget exactly once and undo restores it without mutating prior state', () => {
  let state = createAnnotationState();
  const initial = state;
  for (const sample of MEDICAL_SAMPLES.slice(0, 3)) {
    const previous = state;
    state = annotateSample(state, sample.id, 'unsure');
    assert.notEqual(state, previous);
    assert.equal(annotateSample(state, sample.id, 'lobed'), state);
  }
  assert.deepEqual(initial.annotations, {});
  assert.equal(annotateSample(state, MEDICAL_SAMPLES[3].id, 'single'), state);
  const restored = undoAnnotation(state, MEDICAL_SAMPLES[0].id);
  assert.equal(Object.keys(restored.annotations).length, 2);
  assert.equal(Object.keys(state.annotations).length, 3);
  assert.equal(Object.keys(annotateSample(restored, MEDICAL_SAMPLES[3].id, 'single').annotations).length, 3);
  assert.throws(() => annotateSample(state, 'unknown', 'single'), RangeError);
  assert.throws(() => createAnnotationState(-1), RangeError);
});

test('sample acquisition uses committee disagreement, not image blur, and excludes already labeled samples', () => {
  const initial = createAnnotationState();
  const ranked = rankUnlabeledSamples(initial);
  assert.equal(ranked[0].id, 'S03');
  assert.equal(ranked[0].ambiguity, 'clear');
  assert.deepEqual(ranked[0].votes, [2, 2]);
  const labeled = annotateSample(initial, 'S03', 'lobed');
  assert.equal(rankUnlabeledSamples(labeled)[0].id, 'S06');
  assert.ok(rankUnlabeledSamples(labeled).every(sample => sample.id !== 'S03'));
  assert.deepEqual(initial.annotations, {});
});

test('calendar proposals preserve the saved calendar and meet all scheduling constraints', () => {
  const events = createInitialCalendar();
  const initial = structuredClone(events);
  for (const request of ['focus', 'meeting-reading']) {
    for (const bufferMinutes of [0, 15, 30]) {
      for (const focusMinutes of [30, 60, 90, 120]) {
        const proposal = proposeSchedule({ events, request, bufferMinutes, focusMinutes });
        const tasks = request === 'focus' ? [focusMinutes] : [30, 45];
        const possible = (remaining, earliest) => {
          if (!remaining.length) return true;
          for (let start = earliest; start + remaining[0] <= 1020; start += 15) {
            const end = start + remaining[0];
            if (events.every(event => end + bufferMinutes <= event.start || event.end + bufferMinutes <= start)
              && possible(remaining.slice(1), end + bufferMinutes)) return true;
          }
          return false;
        };
        assert.equal(proposal.ok, possible(tasks, 540));
        for (const addition of proposal.additions) {
          assert.ok(addition.start >= 540 && addition.end <= 1020);
          for (const other of proposal.events.filter(item => item.id !== addition.id)) {
            assert.ok(addition.end + bufferMinutes <= other.start || other.end + bufferMinutes <= addition.start);
          }
        }
      }
    }
  }
  assert.deepEqual(events, initial);
});

test('impossible schedules and conflicting edits never produce partial proposals', () => {
  for (const input of [
    { windowStart: 600, windowEnd: 630 },
    { reviewStart: 540, reviewMinutes: 60 },
    { windowStart: 1000, windowEnd: 540 },
    { focusMinutes: -30 },
    { request: 'unsupported' }
  ]) {
    const proposal = proposeSchedule(input);
    assert.equal(proposal.ok, false);
    assert.deepEqual(proposal.additions, []);
  }
});

test('geometry feedback is exact for every reachable grid state and each exercise is solvable', () => {
  for (const exercise of RECTANGLE_EXERCISES) {
    let solutions = 0;
    for (let width = 1; width <= 10; width++) {
      for (let height = 1; height <= 10; height++) {
        const result = evaluateRectangle(exercise.id, width, height);
        assert.equal(result.area, width * height);
        assert.equal(result.perimeter, 2 * (width + height));
        assert.equal(result.solved, result.area === exercise.area && result.perimeter === exercise.perimeter);
        if (result.solved) solutions++;
      }
    }
    assert.ok(solutions > 0);
  }
  assert.throws(() => evaluateRectangle('courtyard', 0, 3), RangeError);
  assert.throws(() => evaluateRectangle('courtyard', 2.5, 3), RangeError);
});

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.dataset = {};
    this.style = {};
    this.className = '';
    this.ownText = '';
    this.value = '';
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.scrollTop = 0;
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (name) => { this.className = this.className.split(/\s+/).filter((item) => item !== name).join(' '); }
    };
  }

  get textContent() { return this.ownText + this.children.map((child) => child.textContent).join(''); }
  set textContent(value) { this.replaceChildren(); this.ownText = String(value); }
  get options() { return this.children.filter((child) => child.tagName === 'OPTION'); }
  get visible() { return !this.hidden && (!this.parentElement || this.parentElement.visible); }
  get descendants() { return this.children.flatMap((child) => [child, ...child.descendants]); }

  append(...nodes) {
    for (const node of nodes) {
      assert.equal(node.parentElement, null, 'fake DOM only supports inserting detached nodes');
      node.parentElement = this;
      this.children.push(node);
    }
  }

  prepend(...nodes) {
    this.append(...nodes);
    this.children = [...this.children.slice(-nodes.length), ...this.children.slice(0, -nodes.length)];
  }

  replaceChildren(...nodes) {
    for (const child of this.children) child.parentElement = null;
    this.children = [];
    this.ownText = '';
    this.append(...nodes);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === 'id') this.id = String(value);
  }

  getAttribute(name) { return this.attributes.get(name) ?? null; }

  getBoundingClientRect() { return this.rect || { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  dispatch(type, properties = {}) {
    const event = { type, target: this, currentTarget: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...properties };
    for (const listener of this.listeners.get(type) || []) listener.call(this, event);
    return event;
  }

  click() {
    assert.ok(this.visible && !this.disabled, 'test must not click a hidden or disabled control');
    const changed = this.type === 'radio' && !this.checked;
    if (this.type === 'radio') {
      let root = this;
      while (root.parentElement) root = root.parentElement;
      for (const node of root.descendants) {
        if (node.type === 'radio' && node.name === this.name) node.checked = node === this;
      }
    }
    this.dispatch('click');
    if (changed) this.dispatch('change');
  }
}

function createCanvasHarness({ type = 'point-cloud', lang = 'en', reducedMotion = false, width = 960, height = 360, observers = false } = {}) {
  const page = new FakeElement('main');
  const add = (tag, id, parent = page) => {
    const node = new FakeElement(tag);
    node.id = id;
    parent.append(node);
    return node;
  };
  const research = add('section', 'research');
  research.classList.add('active');
  const canvas = add('canvas', 'interestCanvas', research);
  const controls = add('div', 'interestCanvasControls', research);
  // The homepage enables these controls after lazy-module activation succeeds.
  const previous = add('button', 'interestDemoPrevious', controls);
  const action = add('button', 'interestDemoAction', controls);
  const reset = add('button', 'interestDemoReset', controls);
  const status = add('p', 'interestCanvasStatus', add('div', 'feedback', research));
  const topicHost = add('div', 'topicHost', research);
  const topicCalls = [];
  const document = {
    documentElement: page,
    activeElement: null,
    visibilityState: 'visible',
    createElement: (tag) => new FakeElement(tag),
    getElementById: (id) => page.descendants.find((node) => node.id === id) || null,
    querySelector: (selector) => {
      assert.match(selector, /^#[\w-]+$/, 'extend the fake only when production needs another selector');
      return document.getElementById(selector.slice(1));
    }
  };
  const paint = [];
  const ctx = {
    clearRect: (...args) => { paint.length = 0; paint.push(['clearRect', ...args]); },
    measureText: (value) => ({ width: [...String(value)].length * 7 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} })
  };
  for (const method of ['setTransform', 'save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'arc', 'ellipse', 'clip', 'fill', 'stroke', 'fillRect', 'fillText', 'translate', 'rotate']) {
    ctx[method] = (...args) => paint.push([method, ...args]);
  }
  let measurements = 0;
  canvas.getContext = (kind) => { assert.equal(kind, '2d'); return ctx; };
  canvas.getBoundingClientRect = () => { measurements += 1; return { width, height }; };
  canvas.blur = () => { document.activeElement = null; };
  canvas.setPointerCapture = () => {};
  canvas.releasePointerCapture = () => {};
  const scrolls = [];
  canvas.scrollIntoView = (options) => scrolls.push(options);
  const motionRequests = [];
  const browser = { devicePixelRatio: 1, matchMedia: () => ({ matches: width <= 720, addEventListener() {} }) };
  const observerInstances = {};
  if (observers) {
    for (const kind of ['ResizeObserver', 'IntersectionObserver']) {
      browser[kind] = class {
        constructor(callback) { this.callback = callback; observerInstances[kind] = this; }
        observe(target) { assert.equal(target, canvas); this.target = target; }
        notify(entry) { this.callback([entry]); }
      };
    }
  }
  const context = { lang, reducedMotion };
  let entry = { child: { animation: type } };
  const options = {
    getActiveEntry: () => entry,
    getContext: () => context,
    getPrimaryInterestId: (item) => item.interests?.[0],
    requestMotionFrame: (request) => motionRequests.push(request)
  };
  const factoryStart = canvasSource.indexOf('let researchCanvasInstance');
  assert.ok(factoryStart >= 0, 'VM adapter must preserve the module singleton and factory');
  // The initialization header is tested separately; retain all factory behavior.
  const runtime = canvasSource.slice(factoryStart).replace('export function createResearchCanvas', 'function createResearchCanvas');
  const createResearchCanvas = vm.runInNewContext(`${runtime}\ncreateResearchCanvas;`, {
    createTopicExperiences: () => ({ element: topicHost, show: (type) => { topicHost.hidden = !type; topicCalls.push(type); } }),
    document, window: browser,
    ...(observers ? { ResizeObserver: browser.ResizeObserver, IntersectionObserver: browser.IntersectionObserver } : {}),
    getComputedStyle: () => ({ getPropertyValue: () => '#778899' }),
    fetch: () => assert.fail('demo behavior must not request the network'),
    requestAnimationFrame: () => assert.fail('demo behavior must not schedule its own frames')
  }, { filename: 'research-canvas.behavior.vm.js', timeout: 1000 });
  const api = createResearchCanvas(options);
  if (observers) observerInstances.IntersectionObserver.notify({ isIntersecting: true });
  api.render();
  const byClass = (name) => {
    const node = page.descendants.find((item) => item.classList.contains(name));
    assert.ok(node, `rendered DOM is missing .${name}`);
    return node;
  };
  const picker = page.descendants.find((node) => node.tagName === 'SELECT');
  const radios = page.descendants.filter((node) => node.type === 'radio');
  return {
    api, canvas, controls, context, document, research, previous, action, reset, status, picker, radios, topicCalls, topicHost,
    paint, motionRequests, scrolls, observerInstances, byClass,
    sameInstance: () => createResearchCanvas(options),
    get measurements() { return measurements; },
    get canvasText() { return paint.filter(([method]) => method === 'fillText').map(([, text]) => String(text)).join('\n'); },
    get visibleText() { return page.descendants.filter((node) => node.visible).flatMap((node) => [node.ownText, node.getAttribute('aria-label') || '']).join('\n'); },
    get selectedAnswers() { return radios.filter((input) => input.checked).map((input) => input.value); },
    pick(value) {
      assert.ok(picker.visible && picker.options.some((option) => option.value === String(value)), `unknown or hidden picker value: ${value}`);
      picker.value = String(value);
      picker.dispatch('change');
    },
    answer(value) {
      const input = radios.find((node) => node.value === value);
      assert.ok(input, `rendered answer ${value} is missing`);
      input.click();
      return input;
    },
    setLanguage(value) { context.lang = value; api.contextChanged(); },
    setType(value) { entry = { child: { animation: value } }; api.contextChanged(); }
  };
}


test('registration actions preserve the approved alignment, rotation and reset behavior', () => {
  const h = createCanvasHarness({ reducedMotion: true });
  assert.equal(h.api, h.sameInstance());
  assert.match(h.status.textContent, /34/);
  assert.equal(h.canvas.hidden, false);
  assert.ok(h.paint.filter(([method]) => method === 'arc').length > 80);
  h.action.click();
  assert.match(h.status.textContent, /complete/);
  h.previous.click();
  assert.equal(h.api.getRegistrationParams().rotation, 49);
  h.reset.click();
  assert.equal(h.api.getRegistrationParams().rotation, 34);
  assert.doesNotMatch(h.status.textContent, /complete/);
});

test('registration pointer capture and reduced motion support direct manipulation without a frame loop', () => {
  const h = createCanvasHarness({ reducedMotion: true });
  assert.equal(h.api.frame(500), false);
  h.canvas.dispatch('pointerdown', { offsetX: 100, offsetY: 50, pointerId: 1 });
  h.canvas.dispatch('pointermove', { offsetX: 700, offsetY: 60 });
  h.canvas.dispatch('pointerup', { offsetX: 960, offsetY: 60, pointerId: 1 });
  assert.match(h.status.textContent, /complete/);
  assert.ok(h.motionRequests.length);
  h.canvas.dispatch('pointercancel');
  assert.notEqual(h.canvas.style.cursor, 'grabbing');
});

test('topic switching hides the registration canvas, does not dispatch old scenes, and retains registration state', () => {
  const h = createCanvasHarness();
  h.previous.click();
  for (const type of ['vpr', 'medical-image', 'agent', 'education', 'none']) {
    h.setType(type);
    assert.equal(h.canvas.hidden, true);
    assert.equal(h.controls.hidden, true);
    assert.equal(h.api.frame(500), false);
    assert.equal(h.api.isVisible(), false);
    assert.equal(h.topicCalls.at(-1), type);
  }
  h.setType('point-cloud');
  assert.equal(h.canvas.hidden, false);
  assert.equal(h.controls.hidden, false);
  assert.equal(h.topicCalls.at(-1), null);
  assert.equal(h.api.getRegistrationParams().rotation, 49);
  assert.doesNotMatch(canvasSource, /robotTeacher|vprCandidateScores|medicalCases|humanAiCollab/);
});

test('registration language and theme refresh preserve completed state', () => {
  const h = createCanvasHarness({ reducedMotion: true });
  h.action.click();
  h.setLanguage('zh');
  assert.match(h.status.textContent, /完成/);
  assert.equal(h.action.textContent, '执行配准');
  h.setLanguage('en');
  assert.match(h.status.textContent, /complete/);
  assert.equal(h.action.textContent, 'Register');
});

test('registration stops out of view or in background and repaints on resize/reentry', () => {
  const h = createCanvasHarness({ observers: true, width: 390 });
  assert.equal(h.api.cadence(), 200);
  assert.equal(h.api.frame(600), true);
  h.observerInstances.IntersectionObserver.notify({ isIntersecting: false });
  assert.equal(h.api.frame(1000), false);
  h.observerInstances.IntersectionObserver.notify({ isIntersecting: true });
  h.document.visibilityState = 'hidden';
  assert.equal(h.api.frame(1200), false);
  h.document.visibilityState = 'visible';
  h.context.reducedMotion = true;
  h.observerInstances.ResizeObserver.notify({ contentRect: { width: 320, height: 200 } });
  assert.equal(h.canvas.width, 320);
  assert.equal(h.api.frame(1400), false);
});

test('topic assets share version fingerprints and stay off the eager homepage path', async () => {
  const host = await read('topic-experiences.js');
  assert.match(canvasSource, /new URL\('\.\/topic-experiences\.js', import\.meta\.url\)/);
  assert.match(canvasSource, /searchParams\.set\('v', assetVersion\)/);
  assert.match(host, /searchParams\.set\('v', version\)/);
  assert.match(host, /await withTimeout\(import\(asset/);
  for (const file of ['topic-perception.js', 'topic-workbench.js']) {
    const source = await read(file);
    assert.doesNotMatch(source, /fetch\(|requestAnimationFrame\(|setInterval\(|localStorage|sessionStorage/);
  }
});

test('all presentations retain the bounded workbench and local scrolling contract', async () => {
  const css = await read('styles.css');
  assert.match(css, /\.research-workbench\s*\{[^}]*height:\s*clamp\(/s);
  assert.match(css, /\.topic-experiences\s*\{[^}]*overflow:\s*auto/s);
  assert.match(css, /\.topic-experiences:focus-visible/);
  assert.match(css, /\.interest-demo \[hidden\]\s*\{[^}]*display:\s*none !important/s);
});
