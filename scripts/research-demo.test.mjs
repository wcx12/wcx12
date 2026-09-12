import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import {
  AGENT_TASKS,
  EDUCATION_EXERCISES,
  evaluateAnswer,
  localize,
  nextAgentStage
} from '../research-demo-content.js';

const read = (name) => fs.readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const canvasSource = await read('research-canvas.js');
const contentSource = await read('research-demo-content.js');
const languages = ['en', 'zh'];
const verdicts = new Set(['empty', 'correct', 'incorrect']);

function assertText(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`);
  assert.ok(value.trim().length > 0, `${label} must not be blank`);
  assert.doesNotMatch(value, /^(?:todo|tbd|placeholder|coming soon)[.!\s]*$/i, `${label} is placeholder content`);
}

function assertLocalized(value, label, { prose = true } = {}) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must contain en and zh`);
  for (const lang of languages) {
    assert.ok(Object.hasOwn(value, lang), `${label}.${lang} is missing`);
    assertText(value[lang], `${label}.${lang}`);
    assert.equal(localize(value, lang), value[lang], `${label} must select the requested language`);
  }
  if (prose) {
    assert.match(value.en, /[A-Za-z]/, `${label}.en must contain English prose`);
    assert.match(value.zh, /\p{Script=Han}/u, `${label}.zh must contain Chinese prose`);
  }
}

function assertUniqueIds(items, label) {
  assert.ok(Array.isArray(items), `${label} must be an array`);
  for (const item of items) assertText(item?.id, `${label} item id`);
  assert.equal(new Set(items.map(({ id }) => id)).size, items.length, `${label} ids must be unique`);
}

// Match the existing named-function style without extending into the next function.
function canvasFunction(name) {
  const match = canvasSource.match(new RegExp(`(?:^|\\n)([ \\t]*)(?:export\\s+)?function\\s+${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\1\\}`, 'm'));
  assert.ok(match, `research-canvas.js must retain ${name}()`);
  return match[0];
}

test('localize selects either language without mutating the bilingual value', () => {
  const value = Object.freeze({ en: 'English sample', zh: '\u4e2d\u6587\u793a\u4f8b' });
  for (let repeat = 0; repeat < 3; repeat += 1) {
    assert.equal(localize(value, 'en'), value.en);
    assert.equal(localize(value, 'zh'), value.zh);
  }
  assert.deepEqual(value, { en: 'English sample', zh: '\u4e2d\u6587\u793a\u4f8b' });
});

test('all three Agent tasks have bilingual requests, retrieval evidence and substantive results', async (t) => {
  assertUniqueIds(AGENT_TASKS, 'AGENT_TASKS');
  assert.equal(AGENT_TASKS.length, 3);
  for (const task of AGENT_TASKS) {
    await t.test(task.id, () => {
      for (const field of ['title', 'request', 'result']) assertLocalized(task[field], `${task.id}.${field}`);
      assertUniqueIds(task.snippets, `${task.id}.snippets`);
      assert.ok(task.snippets.length > 0, `${task.id} must retrieve at least one snippet`);
      for (const snippet of task.snippets) assertLocalized(snippet.text, `${task.id}.snippets.${snippet.id}.text`);
      for (const lang of languages) {
        const result = task.result[lang].trim();
        // A minimum content floor rejects status-only deliveries, not particular wording.
        assert.ok(result.length >= (lang === 'en' ? 24 : 12), `${task.id}.result.${lang} must contain more than a status label`);
        assert.notEqual(result, task.title[lang].trim(), `${task.id} must not deliver its title`);
        assert.notEqual(result, task.request[lang].trim(), `${task.id} must not merely repeat the request`);
        const snippets = task.snippets.map(({ text }) => text[lang].trim());
        assert.equal(new Set(snippets).size, snippets.length, `${task.id} repeats retrieval snippets in ${lang}`);
        for (const snippet of snippets) {
          assert.ok(snippet.length >= (lang === 'en' ? 12 : 6), `${task.id} retrieval snippets must contain evidence, not just labels`);
        }
      }
    });
  }
});

test('Agent stages advance monotonically and deliver is terminal', () => {
  const stages = ['request', 'work', 'deliver'];
  for (const [index, start] of stages.entries()) {
    let stage = start;
    for (let step = 0; step < 100; step += 1) {
      const next = nextAgentStage(stage);
      assert.equal(next, stages[Math.min(index + step + 1, stages.length - 1)]);
      assert.ok(stages.indexOf(next) >= stages.indexOf(stage), `${stage} must not regress to ${next}`);
      stage = next;
    }
    assert.equal(stage, 'deliver');
  }
  for (const stage of ['work', 'request', 'deliver', 'request', 'work']) {
    assert.equal(nextAgentStage(stage), stage === 'request' ? 'work' : 'deliver', 'interleaved tasks must not share stage state');
  }
});

test('Agent transitions need no clock, random source, timer or animation frame', (t) => {
  const unexpected = () => assert.fail('nextAgentStage must depend only on its stage argument');
  try {
    t.mock.method(Date, 'now', unexpected);
    t.mock.method(performance, 'now', unexpected);
    t.mock.method(Math, 'random', unexpected);
    t.mock.method(globalThis, 'setTimeout', unexpected);
    t.mock.method(globalThis, 'setInterval', unexpected);
    if (typeof globalThis.requestAnimationFrame === 'function') {
      t.mock.method(globalThis, 'requestAnimationFrame', unexpected);
    }
    assert.equal(nextAgentStage('request'), 'work');
    assert.equal(nextAgentStage('work'), 'deliver');
    assert.equal(nextAgentStage('deliver'), 'deliver');
  } finally {
    t.mock.restoreAll();
  }
  assert.doesNotMatch(contentSource, /\b(?:requestAnimationFrame|setTimeout|setInterval|interestTick)\b|\b(?:Date|performance)\s*\.\s*now\s*\(/, 'content logic must stay independent of the rendering clock');
});

test('the five education exercises have complete bilingual content and valid answer keys', async (t) => {
  assertUniqueIds(EDUCATION_EXERCISES, 'EDUCATION_EXERCISES');
  assert.deepEqual(EDUCATION_EXERCISES.map(({ id }) => id).sort(), ['algebra', 'functions', 'geometry', 'proof', 'word']);
  for (const exercise of EDUCATION_EXERCISES) {
    await t.test(exercise.id, () => {
      for (const field of ['label', 'question', 'hint', 'explanation']) {
        assertLocalized(exercise[field], `${exercise.id}.${field}`);
      }
      assertUniqueIds(exercise.choices, `${exercise.id}.choices`);
      assert.ok(exercise.choices.length >= 2, `${exercise.id} needs a correct choice and a distractor`);
      for (const choice of exercise.choices) {
        // Mathematical answers may legitimately be identical in both languages.
        assertLocalized(choice.text, `${exercise.id}.choices.${choice.id}.text`, { prose: false });
      }
      assertText(exercise.answer, `${exercise.id}.answer`);
      assert.equal(exercise.choices.filter(({ id }) => id === exercise.answer).length, 1, `${exercise.id} must name exactly one existing choice as its answer`);
    });
  }
});

test('every choice of every exercise is graded from its answer key', async (t) => {
  for (const exercise of EDUCATION_EXERCISES) {
    await t.test(exercise.id, async (t) => {
      let correctCount = 0;
      for (const choice of exercise.choices) {
        await t.test(choice.id, () => {
          const expected = choice.id === exercise.answer ? 'correct' : 'incorrect';
          const actual = evaluateAnswer(exercise.id, choice.id);
          assert.equal(actual, expected, `${exercise.id}/${choice.id} was graded incorrectly`);
          if (actual === 'correct') correctCount += 1;
        });
      }
      assert.equal(correctCount, 1, `${exercise.id} must accept exactly one answer`);
    });
  }
});

test('empty answers remain empty and unknown choices can never be correct', () => {
  for (const exercise of EDUCATION_EXERCISES) {
    for (const empty of ['', null, undefined]) {
      assert.equal(evaluateAnswer(exercise.id, empty), 'empty', `${exercise.id} must not grade an empty answer`);
    }
    const unknowns = ['__missing_choice__', '__proto__', 'constructor', 'toString'];
    const foreignChoices = EDUCATION_EXERCISES.flatMap(({ choices }) => choices.map(({ id }) => id));
    const ownChoices = new Set(exercise.choices.map(({ id }) => id));
    for (const answer of new Set([...unknowns, ...foreignChoices])) {
      if (ownChoices.has(answer)) continue;
      const actual = evaluateAnswer(exercise.id, answer);
      assert.ok(verdicts.has(actual), `${exercise.id}/${answer} must return a known verdict`);
      assert.notEqual(actual, 'correct', `${exercise.id} accepted an unknown choice: ${answer}`);
    }
  }
});

test('unknown exercise ids never accept even a known correct answer', () => {
  const unknownIds = ['__missing_exercise__', '__proto__', 'constructor', 'toString', '', null, undefined];
  const answers = new Set(['', null, undefined, '__missing_choice__', ...EDUCATION_EXERCISES.flatMap(({ choices }) => choices.map(({ id }) => id))]);
  for (const id of unknownIds) {
    for (const answer of answers) {
      const actual = evaluateAnswer(id, answer);
      assert.ok(verdicts.has(actual), `unknown exercise ${String(id)} must return a known verdict`);
      assert.notEqual(actual, 'correct', `unknown exercise ${String(id)} accepted ${String(answer)}`);
    }
  }
});

test('grading is repeatable across exercises and does not mutate exported content', () => {
  const before = structuredClone({ tasks: AGENT_TASKS, exercises: EDUCATION_EXERCISES });
  for (let repeat = 0; repeat < 3; repeat += 1) {
    for (const exercise of [...EDUCATION_EXERCISES].reverse()) {
      assert.equal(evaluateAnswer(exercise.id, exercise.answer), 'correct');
      for (const choice of [...exercise.choices].reverse()) {
        assert.equal(evaluateAnswer(exercise.id, choice.id), choice.id === exercise.answer ? 'correct' : 'incorrect');
      }
      assert.equal(evaluateAnswer(exercise.id, ''), 'empty', 'a previous correct answer must not leak into an empty submission');
    }
  }
  assert.deepEqual({ tasks: AGENT_TASKS, exercises: EDUCATION_EXERCISES }, before);
});

test('research canvas literal DOM ids exist in both fixed-language homepages', async () => {
  const lookups = [...canvasSource.matchAll(/\bgetElementById\(\s*(['"])([^'"]+)\1\s*\)/g)].map((match) => match[2]);
  assert.ok(lookups.includes('interestCanvas'), 'research canvas must keep its literal canvas lookup');
  for (const filename of ['index.html', 'zh/index.html']) {
    const html = await read(filename);
    const ids = new Set([...html.matchAll(/\bid\s*=\s*(['"])([^'"]+)\1/g)].map((match) => match[2]));
    assert.deepEqual([...new Set(lookups)].filter((id) => !ids.has(id)), [], `${filename} is missing research canvas DOM ids`);
  }
});

test('research demos stay local without external AI or network requests', () => {
  for (const [name, source] of [['research-canvas.js', canvasSource], ['research-demo-content.js', contentSource]]) {
    assert.doesNotMatch(source, /\bfetch\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource)\s*\(|\bsendBeacon\s*\(|\baxios\s*(?:\(|\.)/, `${name} must not issue demo network requests`);
    assert.doesNotMatch(source, /\b(?:from\s*|import\s*(?:\(\s*)?)['"](?:https?:)?\/\//i, `${name} must not load a remote AI client`);
  }
});

test('createResearchCanvas retains its singleton interface and caller-owned frame lifecycle', () => {
  assert.match(canvasSource, /export\s+function\s+createResearchCanvas\(options\)/);
  assert.match(canvasSource, /if\s*\(researchCanvasInstance\)\s*return researchCanvasInstance/);
  const api = canvasSource.match(/researchCanvasInstance\s*=\s*\{([\s\S]*?)\r?\n[ \t]*\};/);
  assert.ok(api, 'research canvas must expose its public instance');
  for (const method of ['bindItem', 'cadence', 'contextChanged', 'frame', 'getRegistrationParams', 'isVisible', 'render', 'resize', 'scrollIntoView']) {
    assert.match(api[1], new RegExp(`(?:^|[,\\n])\\s*${method}\\s*(?=[:,(])`), `research canvas API is missing ${method}`);
  }
  assert.match(canvasSource, /return researchCanvasInstance\s*;/);
  const frame = canvasFunction('frame');
  for (const guard of ['reducedMotion', 'document.visibilityState', 'interestCanvasVisible', 'isResearchViewActive()']) {
    assert.ok(frame.includes(guard), `frame() lost its ${guard} guard`);
  }
  assert.match(frame, /return false/);
  assert.match(frame, /frameInterval\(\)/);
  assert.match(canvasSource, /new ResizeObserver\(/);
  assert.match(canvasSource, /new IntersectionObserver\(/);
  assert.match(canvasFunction('contextChanged'), /themeColorCache\.clear\(\)/);
  assert.match(canvasFunction('resize'), /measureInterestCanvasSize\(\)/);
  assert.doesNotMatch(canvasSource, /\b(?:requestAnimationFrame|setInterval)\s*\(/, 'the homepage must remain the owner of frame scheduling');
  for (const name of ['frame', 'drawInterestAnimation', 'drawHumanAiCollab']) {
    const body = canvasFunction(name);
    assert.doesNotMatch(body, /\bagentInteraction\s*\.\s*(?:selectedStage|completed)\s*(?:=(?!=)|\+=|-=|\+\+|--)|\bnextAgentStage\s*\(/, `${name} must not advance or reset the Agent workflow during rendering`);
    assert.doesNotMatch(body, /getBoundingClientRect|resizeDrawingCanvas/, `${name} must avoid per-frame layout measurements`);
  }
});

test('robot teacher, student, and board stay separated on short canvases', () => {
  const layoutFor = vm.runInNewContext(`${canvasFunction('robotTeacherLayout')}\nrobotTeacherLayout;`);
  for (const width of [252, 320, 600, 960]) {
    for (const height of [220, 360]) {
      const { robot, student, board } = layoutFor(width, height);
      assert.ok(robot.y - robot.h * 0.65 > 4, 'teacher antenna must remain inside the canvas');
      assert.ok(robot.y + robot.h * 0.5 + 4 < student.y - student.h * 0.6, 'teacher and student must not overlap');
      assert.ok(student.y + student.h * 0.5 < height, 'student must remain inside the canvas');
      assert.ok(robot.x + robot.w * 0.58 + 6 < board.x, 'teacher hand must not overlap the board');
    }
  }
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

function createCanvasHarness({ type = 'agent', lang = 'en', reducedMotion = false, width = 960, height = 360, observers = false } = {}) {
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
  const status = add('p', 'interestCanvasStatus', research);
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
    AGENT_TASKS, EDUCATION_EXERCISES, localize, nextAgentStage, evaluateAnswer,
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
    api, canvas, controls, context, document, research, previous, action, reset, status, picker, radios,
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

function assertAgentState(h, taskIndex, stage, lang = h.context.lang) {
  const task = AGENT_TASKS[taskIndex];
  const root = h.byClass('research-demo-content');
  const agent = h.byClass('research-demo-agent');
  const excerpts = h.byClass('research-demo-excerpts');
  const result = h.byClass('research-demo-result');
  assert.equal(root.dataset.stage, stage);
  assert.equal(h.picker.value, String(taskIndex));
  assert.ok(agent.visible);
  assert.ok(h.visibleText.includes(task.request[lang]));
  assert.equal(excerpts.visible, stage !== 'request');
  assert.equal(result.visible, stage === 'deliver');
  assert.equal(result.textContent, stage === 'deliver' ? task.result[lang] : '');
  for (const snippet of task.snippets) {
    assert.equal(excerpts.textContent.includes(snippet.text[lang]), stage !== 'request');
  }
  assert.ok(h.status.textContent.includes(task.title[lang]));
  if (stage !== 'deliver') assert.equal(h.status.textContent.includes(task.result[lang]), false);
  const stageText = lang === 'en'
    ? { request: 'Waiting', work: 'Processing', deliver: 'Complete' }
    : { request: '\u7b49\u5f85', work: '\u5904\u7406\u4e2d', deliver: '\u5df2\u5b8c\u6210' };
  assert.ok(h.canvasText.includes(stageText[stage]), 'canvas must show the actual workflow stage');
}

function assertUnanswered(h, exerciseId) {
  const exercise = EDUCATION_EXERCISES.find(({ id }) => id === exerciseId);
  assert.equal(h.picker.value, exerciseId);
  assert.deepEqual(h.selectedAnswers, []);
  assert.equal(h.byClass('research-demo-exercise').getAttribute('aria-invalid'), 'false');
  assert.equal(h.byClass('research-demo-hint-text').visible, false);
  assert.equal(h.byClass('research-demo-hint-text').textContent, '');
  assert.equal(h.byClass('research-demo-hint').getAttribute('aria-expanded'), 'false');
  assert.ok(h.visibleText.includes(exercise.question[h.context.lang]));
  assert.match(h.status.textContent, /Awaiting an answer/);
  assert.doesNotMatch(h.canvasText, /\bCorrect\b|Try again/);
}

const untranslatedWords = /\b(?:Human|Query|Learner|Correct|Waiting|Processing|Complete|Pending|Result|Hint|Your turn|Try again|Synthetic|Unlabeled|Labeled|Best match|Day|Night|Shift|Gate|Quad|Bridge|Road|Corner|Hall|Research|Choose|Awaiting|Exercise|Submit|Previous|Reset)\b/i;

function assertChinese(h) {
  assert.doesNotMatch(h.visibleText, untranslatedWords, 'visible DOM or accessible names retained ordinary English');
  assert.doesNotMatch(h.canvasText, untranslatedWords, 'canvas retained ordinary English');
  assert.match(h.visibleText, /\p{Script=Han}/u);
  if (h.canvasText) assert.match(h.canvasText, /\p{Script=Han}/u);
  assert.equal(h.byClass('research-demo-content').lang, 'zh-CN');
}

test('real Agent controls retrieve before delivering and extra frames never change any task stage', async (t) => {
  for (const [index, task] of AGENT_TASKS.entries()) {
    await t.test(task.id, () => {
      const h = createCanvasHarness();
      h.pick(index);
      let timestamp = 0;
      for (const stage of ['request', 'work', 'deliver']) {
        assertAgentState(h, index, stage);
        const before = h.visibleText;
        const measured = h.measurements;
        for (let frame = 0; frame < 24; frame += 1) {
          timestamp += 250;
          assert.equal(h.api.frame(timestamp), true);
          assertAgentState(h, index, stage);
        }
        assert.equal(h.measurements, measured, 'frames must not measure layout');
        h.api.render();
        assert.equal(h.visibleText, before, 'rendering must not change the semantic demo state');
        assertAgentState(h, index, stage);
        if (stage !== 'deliver') h.action.click();
      }
      assert.equal(h.action.textContent, 'Next task');
    });
  }
});

test('Agent next, previous, reset, picker and bound items clear retrieval and delivery state', () => {
  const h = createCanvasHarness();
  const deliver = () => { h.action.click(); h.action.click(); };
  for (let index = 0; index < AGENT_TASKS.length; index += 1) {
    deliver();
    assertAgentState(h, index, 'deliver');
    h.action.click();
    assertAgentState(h, (index + 1) % AGENT_TASKS.length, 'request');
  }
  deliver();
  h.previous.click();
  assertAgentState(h, AGENT_TASKS.length - 1, 'request');
  deliver();
  h.reset.click();
  assertAgentState(h, 0, 'request');
  h.action.click();
  h.pick(1);
  assertAgentState(h, 1, 'request');
  deliver();
  h.pick(1);
  assertAgentState(h, 1, 'request');
  deliver();
  h.api.bindItem({ title: 'README', interests: ['agent'] }, 'paper');
  h.api.render();
  assertAgentState(h, 1, 'request');
});

test('Agent results scroll the inner reading panel only when the workflow stage changes', () => {
  const h = createCanvasHarness();
  const panel = h.byClass('research-demo-content');
  const agent = h.byClass('research-demo-agent');
  panel.rect = { top: 100 };
  agent.children[2].rect = { top: 300 };
  agent.children[4].rect = { top: 450 };
  h.action.click();
  assert.equal(panel.scrollTop, 192);
  h.action.click();
  assert.equal(panel.scrollTop, 534);
  panel.scrollTop = 123;
  h.api.render();
  assert.equal(panel.scrollTop, 123, 'repainting must not override manual scrolling');
  h.reset.click();
  assert.equal(panel.scrollTop, 0);
});

test('real education controls require answers, grade every choice, preserve hints and clear the next exercise', async (t) => {
  for (const [index, exercise] of EDUCATION_EXERCISES.entries()) {
    await t.test(exercise.id, () => {
      const h = createCanvasHarness({ type: 'education' });
      h.pick(exercise.id);
      assertUnanswered(h, exercise.id);
      h.action.click();
      assert.match(h.status.textContent, /Choose an answer before submitting/);
      assert.deepEqual(h.selectedAnswers, []);
      assert.equal(h.byClass('research-demo-exercise').getAttribute('aria-invalid'), 'true');
      h.byClass('research-demo-hint').click();
      h.action.click();
      assert.match(h.status.textContent, /Choose an answer before submitting/, 'hints must not manufacture an answer');
      for (const choice of exercise.choices.filter(({ id }) => id !== exercise.answer)) {
        h.answer(choice.id);
        h.action.click();
        assert.match(h.status.textContent, /Not quite/);
        assert.ok(h.status.textContent.includes(exercise.hint.en));
        assert.equal(h.byClass('research-demo-exercise').getAttribute('aria-invalid'), 'true');
        assert.match(h.canvasText, /Try again/);
        const feedback = h.status.textContent;
        h.byClass('research-demo-hint').click();
        assert.equal(h.status.textContent, feedback, 'a hint must not change an incorrect verdict');
        assert.deepEqual(h.selectedAnswers, [choice.id]);
        assert.equal(h.byClass('research-demo-hint-text').visible, true);
        assert.equal(h.byClass('research-demo-hint-text').textContent, exercise.hint.en);
        assert.equal(h.byClass('research-demo-hint').getAttribute('aria-expanded'), 'true');
      }
      h.answer(exercise.answer);
      assert.match(h.status.textContent, /Awaiting an answer/, 'selecting a choice must not submit it');
      h.action.click();
      assert.match(h.status.textContent, /Correct\./);
      assert.ok(h.status.textContent.includes(exercise.explanation.en));
      assert.match(h.canvasText, /\bCorrect\b/);
      assert.equal(h.byClass('research-demo-exercise').getAttribute('aria-invalid'), 'false');
      assert.equal(h.action.textContent, 'Next exercise');
      assert.deepEqual(h.selectedAnswers, [exercise.answer]);
      const answered = h.visibleText;
      assert.equal(h.api.frame(1000), true);
      h.api.render();
      assert.equal(h.visibleText, answered, 'frames must not grade or advance the exercise');
      h.action.click();
      assertUnanswered(h, EDUCATION_EXERCISES[(index + 1) % EDUCATION_EXERCISES.length].id);
    });
  }
});

test('education reset, previous, picker and binding clear answers, verdicts and hints; Enter submits', () => {
  const h = createCanvasHarness({ type: 'education' });
  const exercise = EDUCATION_EXERCISES.find(({ id }) => id === 'geometry');
  const dirty = () => {
    h.pick(exercise.id);
    const input = h.answer(exercise.answer);
    const event = input.dispatch('keydown', { key: 'Enter' });
    assert.equal(event.defaultPrevented, true);
    assert.match(h.status.textContent, /Correct\./);
    h.byClass('research-demo-hint').click();
  };
  dirty();
  h.reset.click();
  assertUnanswered(h, 'functions');
  dirty();
  h.previous.click();
  assertUnanswered(h, 'functions');
  dirty();
  h.pick('proof');
  assertUnanswered(h, 'proof');
  dirty();
  h.pick('geometry');
  assertUnanswered(h, 'geometry');
  dirty();
  h.api.bindItem({ name: 'tetrahedron', interests: ['ai4edu'] }, 'repo');
  h.api.render();
  assertUnanswered(h, 'geometry');
});

test('contextChanged translates every Agent stage without losing task progress or result', () => {
  const h = createCanvasHarness();
  for (const [index, task] of AGENT_TASKS.entries()) {
    h.pick(index);
    for (const stage of ['request', 'work', 'deliver']) {
      h.setLanguage('zh');
      assertAgentState(h, index, stage, 'zh');
      assert.equal(h.picker.options[index].textContent, task.title.zh);
      assertChinese(h);
      h.setLanguage('en');
      assertAgentState(h, index, stage, 'en');
      if (stage !== 'deliver') h.action.click();
    }
  }
});

test('contextChanged preserves selected answers, grading and hints while translating education DOM and canvas', async (t) => {
  for (const exercise of EDUCATION_EXERCISES) {
    await t.test(exercise.id, () => {
      const h = createCanvasHarness({ type: 'education' });
      h.pick(exercise.id);
      const wrong = exercise.choices.find(({ id }) => id !== exercise.answer).id;
      for (const phase of ['selected', 'incorrect', 'correct']) {
        h.answer(phase === 'correct' ? exercise.answer : wrong);
        if (phase !== 'selected') h.action.click();
        h.byClass('research-demo-hint').click();
        const selected = h.selectedAnswers;
        const invalid = h.byClass('research-demo-exercise').getAttribute('aria-invalid');
        const englishStatus = h.status.textContent;
        h.setLanguage('zh');
        assert.deepEqual(h.selectedAnswers, selected);
        assert.equal(h.picker.value, exercise.id);
        assert.equal(h.byClass('research-demo-exercise').getAttribute('aria-invalid'), invalid);
        assert.equal(h.byClass('research-demo-hint-text').textContent, exercise.hint.zh);
        assert.equal(h.byClass('research-demo-hint-text').visible, true);
        assert.ok(h.visibleText.includes(exercise.question.zh));
        for (const choice of exercise.choices) assert.ok(h.visibleText.includes(choice.text.zh));
        if (phase === 'correct') assert.ok(h.status.textContent.includes(exercise.explanation.zh));
        assertChinese(h);
        h.setLanguage('en');
        assert.equal(h.status.textContent, englishStatus);
        assert.deepEqual(h.selectedAnswers, selected);
      }
    });
  }
});

test('Chinese rendering removes ordinary English labels from every supported scene at desktop and compact sizes', async (t) => {
  for (const width of [960, 360]) {
    for (const type of ['point-cloud', 'vpr', 'medical-image', 'agent', 'education']) {
      await t.test(`${type}/${width}`, () => {
        const h = createCanvasHarness({ type, width });
        assert.ok(h.paint.length > 0, 'the rendering path must actually execute');
        h.setLanguage('zh');
        assertChinese(h);
        h.action.click();
        assertChinese(h);
      });
    }
  }
});

test('reduced motion blocks frames but allows real Agent and education controls to complete', () => {
  for (const type of ['agent', 'education']) {
    const h = createCanvasHarness({ type, reducedMotion: true });
    const frameDoesNothing = () => {
      const before = JSON.stringify(h.paint);
      assert.equal(h.api.frame(10000), false);
      assert.equal(JSON.stringify(h.paint), before);
    };
    frameDoesNothing();
    if (type === 'agent') {
      h.action.click();
      assertAgentState(h, 0, 'work');
      frameDoesNothing();
      h.action.click();
      assertAgentState(h, 0, 'deliver');
    } else {
      h.action.click();
      assert.match(h.status.textContent, /Choose an answer/);
      const exercise = EDUCATION_EXERCISES.find(({ id }) => id === h.picker.value);
      h.answer(exercise.answer);
      h.action.click();
      assert.match(h.status.textContent, /Correct\./);
      assert.match(h.canvasText, /\bCorrect\b/);
    }
    frameDoesNothing();
    assert.ok(h.motionRequests.length > 0, 'clicks must still notify the caller to refresh');
    h.api.scrollIntoView();
    assert.equal(h.scrolls.at(-1).behavior, 'auto');
  }
});

test('none clears a previous scene and never falls back to drawing point clouds', () => {
  const h = createCanvasHarness({ type: 'point-cloud' });
  assert.ok(h.paint.some(([method]) => method === 'arc'), 'positive control must really draw point-cloud points');
  for (const type of ['none', 'unknown-scene', undefined]) {
    h.setType(type);
    assert.ok(h.paint.some(([method]) => method === 'clearRect'), 'the previous point cloud must be cleared');
    assert.equal(h.paint.some(([method]) => method === 'arc'), false);
    assert.equal(h.canvasText, '');
    assert.equal(h.status.textContent, '');
    assert.equal(h.byClass('research-demo-content').visible, false);
    assert.ok([h.previous, h.action, h.reset].every((button) => !button.visible));
    h.api.frame(1000);
    assert.equal(h.paint.some(([method]) => method === 'arc'), false);
  }
});

test('real factory isolates instances across VMs and preserves visibility, resize and frame cadence', () => {
  const h = createCanvasHarness({ observers: true });
  assert.equal(h.sameInstance(), h.api);
  assert.equal(h.byClass('research-demo-content').parentElement, h.controls);
  assert.equal(h.controls.children.filter((node) => node.classList.contains('research-demo-content')).length, 1);
  h.action.click();
  assertAgentState(h, 0, 'work');
  const other = createCanvasHarness();
  assert.notEqual(other.api, h.api);
  assertAgentState(other, 0, 'request');
  assert.equal(h.api.frame(1000), true);
  assert.equal(h.api.frame(1001), false);
  h.document.visibilityState = 'hidden';
  assert.equal(h.api.frame(2000), false);
  h.document.visibilityState = 'visible';
  h.research.classList.remove('active');
  assert.equal(h.api.frame(2000), false);
  h.research.classList.add('active');
  h.observerInstances.IntersectionObserver.notify({ isIntersecting: false });
  assert.equal(h.api.isVisible(), false);
  assert.equal(h.api.frame(2000), false);
  h.observerInstances.IntersectionObserver.notify({ isIntersecting: true });
  assert.equal(h.api.isVisible(), true);
  h.observerInstances.ResizeObserver.notify({ contentRect: { width: 480, height: 300 } });
  assert.equal(h.canvas.width, 480);
  assert.equal(h.canvas.height, 300);
  h.api.resize();
  assert.equal(h.canvas.width, 960);
  assert.equal(h.api.frame(3000), true);
  assertAgentState(h, 0, 'work');
});

test('the actual content initialization inherits the canvas release version without changing the synchronous factory', async () => {
  const factoryStart = canvasSource.indexOf('let researchCanvasInstance');
  assert.ok(factoryStart > 0);
  const header = canvasSource.slice(0, factoryStart);
  assert.match(header, /new URL\(['"]\.\/research-demo-content\.js['"],\s*import\.meta\.url\)/);
  assert.match(header, /await import\(demoContentUrl\.href\)/);
  assert.doesNotMatch(canvasSource, /export\s+async\s+function\s+createResearchCanvas/);
  const exports = { AGENT_TASKS, EDUCATION_EXERCISES, localize, nextAgentStage, evaluateAnswer };
  for (const query of ['', '?v=abc123def456', '?v=release%2Bzh%2F2&retry=3', '?retry=2', '?v=']) {
    const moduleUrl = `https://example.test/site/research-canvas.js${query}`;
    const imports = [];
    const executable = header.replaceAll('import.meta.url', 'moduleUrl').replace(/\bimport\s*\(/g, 'captureImport(');
    const loaded = await vm.runInNewContext(`(async () => { ${executable}\nreturn { AGENT_TASKS, EDUCATION_EXERCISES, localize, nextAgentStage, evaluateAnswer }; })()`, {
      URL, moduleUrl,
      captureImport: async (url) => { imports.push(url); return exports; }
    }, { filename: 'research-canvas.version.vm.js', timeout: 1000 });
    assert.equal(imports.length, 1, `canvas initialization must import content exactly once: ${query}`);
    const actual = new URL(imports[0]);
    const expected = new URL('./research-demo-content.js', moduleUrl);
    const version = new URL(moduleUrl).searchParams.get('v');
    if (version) expected.searchParams.set('v', version);
    assert.equal(actual.href, expected.href, 'content must inherit only the release version, with URL encoding preserved');
    for (const [name, value] of Object.entries(exports)) assert.equal(loaded[name], value);
  }
  const h = createCanvasHarness();
  assert.equal(typeof h.api.then, 'undefined', 'createResearchCanvas must return its instance synchronously');
});

test('IntersectionObserver repaints newly visible scenes under reduced motion without enabling animation', async (t) => {
  for (const type of ['agent', 'education', 'point-cloud', 'vpr', 'medical-image']) {
    await t.test(type, () => {
      const h = createCanvasHarness({ type: 'none', reducedMotion: true, observers: true });
      const observer = h.observerInstances.IntersectionObserver;
      assert.equal(h.canvasText, '');
      observer.notify({ isIntersecting: false });
      assert.equal(h.api.isVisible(), false);
      h.paint.length = 0;
      h.setType(type);
      assert.equal(h.paint.length, 0, 'context changes while outside the viewport must not draw');
      observer.notify({ isIntersecting: true });
      assert.equal(h.api.isVisible(), true);
      assert.ok(h.paint.some(([method]) => method === 'clearRect'), 'visibility must trigger a static render even with reduced motion');
      assert.ok(h.paint.some(([method]) => method === 'arc'), 'visibility must draw the actual scene, not just refresh the DOM');
      if (type === 'agent') assertAgentState(h, 0, 'request');
      if (type === 'education') assertUnanswered(h, 'functions');
      const rendered = JSON.stringify(h.paint);
      assert.equal(h.api.frame(1000), false);
      assert.equal(h.api.frame(2000), false);
      assert.equal(JSON.stringify(h.paint), rendered, 'a static visibility refresh must not restart continuous animation');
      observer.notify({ isIntersecting: false });
      h.paint.length = 0;
      observer.notify({ isIntersecting: true });
      assert.ok(h.paint.some(([method]) => method === 'clearRect'), 'returning to the viewport must repaint again');
      assert.equal(h.api.frame(3000), false);
    });
  }
});

test('scrollable demo content and status remain keyboard reachable after interaction and language changes', () => {
  for (const type of ['agent', 'education']) {
    const h = createCanvasHarness({ type });
    for (const lang of ['en', 'zh']) {
      h.setLanguage(lang);
      h.action.click();
      assert.equal(h.byClass('research-demo-content').tabIndex, 0, 'the scrollable content must accept keyboard focus');
      assert.equal(h.status.tabIndex, 0, 'the scrollable status must accept keyboard focus');
      assert.equal(h.canvas.tabIndex, -1, 'semantic controls, not decorative canvas, must remain the keyboard entry point');
    }
  }
});

async function readStyleRules() {
  // The local integration fragment can disappear once its rules land in styles.css.
  const fragment = await read('output/demo-styles.css').catch((error) => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  const source = `${await read('styles.css')}\n${fragment}`.replace(/\/\*[\s\S]*?\*\//g, '');
  // Focused static guards over declaration blocks, including rules inside media queries.
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
    selectors: selectors.trim().split(/\s*,\s*/),
    body
  }));
}

function styleDeclarations(rules, selector) {
  const matched = rules.filter((rule) => rule.selectors.some((item) => item === selector || item.endsWith(` ${selector}`)));
  assert.ok(matched.length, `missing CSS rule for ${selector}`);
  return matched.map(({ body }) => body).join('\n');
}

test('research workbench keeps bounded height at every breakpoint without height:auto overrides', async () => {
  const rules = await readStyleRules();
  const workbench = rules.filter(({ selectors }) => selectors.some((selector) => /\.research-workbench\b/.test(selector)));
  assert.ok(workbench.length > 0, 'the workbench height guard must inspect real rules');
  assert.match(styleDeclarations(rules, '.research-workbench'), /(?:^|;)\s*height\s*:\s*clamp\(/);
  for (const { selectors, body } of workbench) {
    assert.doesNotMatch(body, /(?:^|;)\s*(?:height|block-size)\s*:\s*auto\s*(?:!important\s*)?(?:;|$)/, `${selectors.join(', ')} must not expand the fixed workbench to fit demo content`);
  }
});

test('demo CSS reserves the canvas and action row while content and status scroll internally', async () => {
  const rules = await readStyleRules();
  const demo = styleDeclarations(rules, '.interest-demo:has(.research-demo-controls)');
  assert.match(demo, /grid-template-rows\s*:\s*220px\s+minmax\(0,\s*1fr\)/, 'canvas must keep a stable 220px grid track');
  const controls = styleDeclarations(rules, '.research-demo-controls');
  assert.match(controls, /grid-template-rows\s*:\s*minmax\(0,\s*1fr\)\s+52px/, 'controls must separate scrollable content from the stable 52px action row');
  assert.match(controls, /min-height\s*:\s*0\s*;/);
  const buttons = rules.filter(({ selectors }) => selectors.some((selector) => /\.research-demo-controls\s*>\s*\.btn\b/.test(selector)));
  assert.ok(buttons.length > 0, 'action buttons need a direct-child grid rule');
  assert.match(buttons.map(({ body }) => body).join('\n'), /grid-row\s*:\s*2\s*;/, 'action buttons must stay in row 2 outside the scrolling content');
  for (const selector of ['.research-demo-content', '.interest-canvas-status']) {
    const body = styleDeclarations(rules, selector);
    assert.match(body, /min-height\s*:\s*0\s*;/, `${selector} must shrink inside the fixed grid`);
    assert.match(body, /overflow-y\s*:\s*auto\s*;/, `${selector} must scroll internally`);
  }
  assert.match(demo, /grid-template-rows\s*:\s*220px\s+minmax\(0,\s*1fr\)\s+72px\s*;/, 'the parent grid must bound the status to 72px');
});

test('demo fields and internal scrollbars use the active theme tokens', async () => {
  const rules = await readStyleRules();
  const fields = rules.filter(({ selectors }) => selectors.some((selector) => /\.research-demo-[\w-]+/.test(selector)));
  assert.ok(fields.length > 0, 'demo field rules must exist');
  assert.match(fields.map(({ body }) => body).join('\n'), /background(?:-color)?\s*:\s*var\(--field-bg\)/, 'demo fields must use --field-bg instead of hard-coded theme colors');
  for (const selector of ['.research-demo-content', '.interest-canvas-status']) {
    assert.match(styleDeclarations(rules, selector), /scrollbar-color\s*:[^;]*var\(--scroll-track\)/, `${selector} must use the theme scroll-track token`);
  }
});
