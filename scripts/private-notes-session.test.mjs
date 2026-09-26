import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import MarkdownIt from 'markdown-it';
import { notesStudioBody } from './notes-studio-shell.mjs';

const source = await fs.readFile(new URL('../blog-src/assets/private-notes.js', import.meta.url), 'utf8');
const IDLE_MS = 15 * 60 * 1000;
const FIELD_IDS = ['noteTitle', 'noteDescription', 'noteSlug', 'noteLang', 'noteWritingStatus', 'noteCategory', 'noteDate', 'noteTags', 'noteBody'];
const settle = () => new Promise(resolve => setImmediate(resolve));

function deferred() {
  let resolve, reject;
  const promise = new Promise((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

class FakeElement {
  value = '';
  textContent = '';
  innerHTML = '';
  children = [];
  dataset = {};
  hidden = false;
  disabled = false;
  checked = false;
  open = false;
  listeners = new Map();
  attributes = new Map();

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  dispatch(type) {
    const event = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    for (const listener of this.listeners.get(type) || []) listener(event);
    return event;
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); if (name === 'href') this.href = ''; }
  replaceChildren(...children) { this.children = children; this.innerHTML = ''; this.textContent = ''; }
  focus() {}
  showModal() { this.open = true; }
  close() { if (this.open) { this.open = false; this.dispatch('close'); } }
}

function fakeClock() {
  let now = 0, nextId = 0;
  const timers = new Map();
  return {
    timers,
    setTimeout(callback, delay) {
      const id = ++nextId;
      timers.set(id, { callback, delay, due: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    async advance(milliseconds) {
      const target = now + milliseconds;
      for (;;) {
        const next = [...timers].filter(([, timer]) => timer.due <= target)
          .sort((left, right) => left[1].due - right[1].due)[0];
        if (!next) break;
        const [id, timer] = next;
        now = timer.due;
        timers.delete(id);
        timer.callback();
        await settle();
      }
      now = target;
    }
  };
}

function fixtureRecord(index = 1) {
  return {
    sha: String(index).repeat(40),
    note: {
      version: 1, id: `00000000-0000-4000-8000-00000000000${index}`,
      slug: `synthetic-note-${index}`, title: `Synthetic note ${index}`, description: 'Synthetic session fixture.',
      lang: 'en', category: 'Research Notes', tags: ['fixture'], research: [], status: 'draft',
      date: '2026-09-01', updated: `2026-09-0${index}`, body: `## Synthetic body ${index}`
    }
  };
}

async function createHarness(overrides = {}) {
  const nodes = new Map();
  for (const [, attributes, id] of notesStudioBody().matchAll(/<\w+\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
    const element = new FakeElement();
    element.hidden = /\shidden(?:\s|$)/.test(attributes);
    element.disabled = /\sdisabled(?:\s|$)/.test(attributes);
    nodes.set(id, element);
  }
  const node = id => { assert.ok(nodes.has(id), `missing shell element ${id}`); return nodes.get(id); };
  const clock = fakeClock();
  const calls = [], clients = [], imports = [], fetches = [];
  const catalog = [fixtureRecord(1), fixtureRecord(2)];
  const defaults = {
    connect: async () => ({ login: 'wcx12', defaultBranch: 'main' }),
    listNotes: async () => catalog.map(({ note }) => ({ id: note.id })),
    getNote: async id => structuredClone(catalog.find(record => record.note.id === id)),
    getPublicState: async () => ({ sha: 'a'.repeat(40), source: 'Synthetic public version.' }),
    listPublicSources: async () => [{ name: 'synthetic-public', path: 'content/posts/synthetic-public/index.md' }]
  };
  class InjectedClient {
    disposed = false;
    disposeCalls = 0;
    constructor(token) {
      assert.equal(token, 'SYNTHETIC_SESSION_TOKEN');
      clients.push(this);
      for (const method of Object.keys(defaults)) {
        this[method] = (...args) => {
          calls.push([method, ...args]);
          return (overrides[method] || defaults[method])(...args);
        };
      }
    }
    dispose() { this.disposed = true; this.disposeCalls++; }
  }
  const document = Object.assign(new FakeElement(), {
    documentElement: { dataset: {}, lang: 'en' },
    getElementById: node,
    createElement: () => new FakeElement(),
    querySelectorAll(selector) {
      if (selector === '[data-notes-text]') return [];
      assert.equal(selector, '#notesWorkspace button, #notesConnect, #notesConfirmAction');
      return ['notesNew', 'notesReload', 'notesSave', 'notesImport', 'notesPublish', 'notesWithdraw', 'notesConnect', 'notesConfirmAction'].map(node);
    }
  });
  const window = Object.assign(new FakeElement(), { markdownit: MarkdownIt, confirm: () => true });
  window.self = window; window.top = window;
  const dependencies = {
    './private-notes-api.js?v=session-test': {
      PrivateNotesClient: InjectedClient,
      toPublicMarkdown() { assert.fail('session tests must not publish'); }
    },
    './draft-studio.js?v=session-test': { renderNoteDiagram: () => '' }
  };
  // Keep the entire editor runtime; replace only module loading with isolated dependencies.
  const executable = source.replaceAll('import.meta.url', 'moduleUrl').replace(/\bimport\s*\(/g, 'importModule(');
  await vm.runInNewContext(`(async () => { ${executable}\n })()`, {
    document, window, URL, structuredClone,
    moduleUrl: 'https://session-test.invalid/blog/assets/private-notes.js?v=session-test',
    async importModule(specifier) {
      assert.ok(Object.hasOwn(dependencies, specifier), `unexpected module ${specifier}`);
      imports.push(specifier);
      return dependencies[specifier];
    },
    async fetch(url, options) {
      fetches.push({ url, options });
      assert.equal(url, '../posts.json');
      assert.equal(options?.method || 'GET', 'GET');
      return { ok: true, json: async () => [{ slug: 'synthetic-public', lang: 'en', title: 'Synthetic public article' }] };
    },
    setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout
  }, { filename: 'private-notes.session.vm.js', timeout: 1000 });
  assert.deepEqual(imports, Object.keys(dependencies));
  assert.equal(node('notesConnect').disabled, false);
  return {
    node, clock, clients, calls, document, window, fetches, catalog,
    async connect() {
      document.dispatch('pointerdown');
      node('notesToken').value = 'SYNTHETIC_SESSION_TOKEN';
      assert.equal(node('notesConnectForm').dispatch('submit').defaultPrevented, true);
      await settle();
    }
  };
}

function assertIdleTimer(h) {
  assert.equal([...h.clock.timers.values()].filter(timer => timer.delay === IDLE_MS).length, 1);
}

function assertLocked(h, message = 'Workspace locked after inactivity.') {
  assert.equal(h.clients[0].disposed, true);
  assert.equal(h.node('notesWorkspace').hidden, true);
  assert.equal(h.node('notesConnected').hidden, true);
  assert.equal(h.node('notesConnectForm').hidden, false);
  assert.equal(h.node('notesConnect').disabled, false);
  assert.equal(h.node('notesStatus').textContent, message);
  assert.equal(h.node('notesStatus').dataset.error, 'false');
  for (const id of [...FIELD_IDS, 'notesToken']) assert.equal(h.node(id).value, '', `${id} must be cleared`);
  for (const id of ['notesPreview', 'notesList', 'notesPublicList']) {
    assert.equal(h.node(id).children.length, 0, `${id} must be cleared`);
    assert.equal(h.node(id).innerHTML, '', `${id} must contain no preview HTML`);
    assert.equal(h.node(id).textContent, '', `${id} must contain no note text`);
  }
  assert.equal(h.node('notesVisibility').textContent, '');
  assert.equal(h.node('notesSaved').textContent, '');
  assert.equal(h.node('notesPublicLink').hidden, true);
  assert.equal(h.node('notesPublicLink').href, '');
  assert.equal(h.node('notesConfirm').open, false);
  assert.equal(h.clock.timers.size, 0);
  h.document.dispatch('pointerdown');
  h.document.dispatch('keydown');
  assert.equal(h.clock.timers.size, 0, 'a locked client must not rearm on activity');
}

for (const method of ['listNotes', 'getNote']) {
  test(`initial ${method} failure retains an idle timer and expires without further input`, async () => {
    const gate = deferred();
    const h = await createHarness({ [method]: () => gate.promise });
    await h.connect();
    assert.ok(h.calls.some(([called]) => called === method));
    assertIdleTimer(h);
    gate.reject(Object.assign(new Error('Synthetic catalog failure'), { code: method === 'getNote' ? 'INVALID_NOTE' : 'NETWORK' }));
    await settle();
    assert.equal(h.node('notesStatus').dataset.error, 'true');
    assert.equal(h.node('notesConnect').disabled, false, 'failed loading must release busy state');
    assert.equal(h.node('notesWorkspace').hidden, false);
    assert.equal(h.clients[0].disposed, false);
    assert.equal(h.fetches.length, 0, 'failed private loading must not start public loading');
    assertIdleTimer(h);
    await h.clock.advance(IDLE_MS - 1);
    assert.equal(h.clients[0].disposed, false);
    await h.clock.advance(1);
    assertLocked(h);
    assert.equal(h.clients[0].disposeCalls, 1);
  });
}

test('normal catalog loading renders notes and idle expiry clears all loaded state', async () => {
  const h = await createHarness();
  await h.connect();
  assert.equal(h.node('notesStatus').textContent, 'Private copy saved');
  assert.equal(h.node('notesStatus').dataset.error, 'false');
  assert.equal(h.node('notesConnectForm').hidden, true);
  assert.equal(h.node('notesWorkspace').hidden, false);
  assert.equal(h.node('notesEditorArea').hidden, false);
  assert.equal(h.node('notesSave').disabled, false);
  assert.equal(h.node('noteTitle').value, h.catalog[1].note.title);
  assert.match(h.node('notesPreview').innerHTML, /Synthetic body 2/);
  assert.equal(h.node('notesList').children.length, 2);
  assert.equal(h.node('notesPublicList').children.length, 1);
  assert.equal(h.node('notesPublicLink').hidden, false);
  assert.equal(h.fetches.length, 1);
  assertIdleTimer(h);
  h.node('notesWithdraw').dispatch('click');
  assert.equal(h.node('notesConfirm').open, true);
  const callsBeforeLock = h.calls.length;
  await h.clock.advance(IDLE_MS);
  assertLocked(h);
  assert.equal(h.clients[0].disposeCalls, 1);
  h.node('notesConfirmCheck').checked = true;
  h.node('notesConfirmAction').dispatch('click');
  await settle();
  assert.equal(h.calls.length, callsBeforeLock, 'lock must discard pending confirmation');
  assertLocked(h);
});

test('an empty private catalog stays usable and still expires', async () => {
  const h = await createHarness({ listNotes: async () => [] });
  await h.connect();
  assert.equal(h.node('notesStatus').textContent, 'No private notes yet.');
  assert.equal(h.node('notesEmpty').hidden, false);
  assert.equal(h.node('notesEditorArea').hidden, true);
  assert.equal(h.node('notesNew').disabled, false);
  assertIdleTimer(h);
  await h.clock.advance(IDLE_MS);
  assertLocked(h);
});

test('a connection completing after pagehide lock cannot reopen or rearm the workspace', async () => {
  const gate = deferred();
  const h = await createHarness({ connect: () => gate.promise });
  await h.connect();
  assert.equal(h.clock.timers.size, 0);
  h.window.dispatch('pagehide');
  assertLocked(h, 'Locked. No private content has been loaded.');
  gate.resolve({ login: 'wcx12', defaultBranch: 'main' });
  await settle();
  assert.deepEqual(h.calls.map(([method]) => method), ['connect']);
  assert.equal(h.fetches.length, 0);
  assertLocked(h, 'Locked. No private content has been loaded.');
  assert.equal(h.clients[0].disposeCalls, 1);
});

test('idle expiry defers during catalog loading, then locks after loading completes', async () => {
  const gate = deferred();
  const h = await createHarness({ listNotes: () => gate.promise });
  await h.connect();
  assertIdleTimer(h);
  await h.clock.advance(IDLE_MS);
  assert.equal(h.clients[0].disposed, false);
  assertIdleTimer(h);
  gate.resolve([]);
  await settle();
  assert.equal(h.node('notesStatus').textContent, 'No private notes yet.');
  await h.clock.advance(IDLE_MS);
  assertLocked(h);
});

test('idle expiry preserves unsaved edits and rearms instead of discarding them', async () => {
  const h = await createHarness();
  await h.connect();
  h.node('noteBody').value = 'Synthetic unsaved edit';
  h.node('noteBody').dispatch('input');
  await h.clock.advance(IDLE_MS);
  assert.equal(h.clients[0].disposed, false);
  assert.equal(h.node('notesWorkspace').hidden, false);
  assert.equal(h.node('noteBody').value, 'Synthetic unsaved edit');
  assert.equal(h.node('notesStatus').textContent, 'Unsaved changes remain in memory. Save or lock the workspace before leaving.');
  assertIdleTimer(h);
});
