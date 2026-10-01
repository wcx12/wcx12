import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { paintPlacePreview, VPR_ROUNDS } from '../topic-perception.js';

class Signals {
  listeners = new Map();
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(callback);
  }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
  emit(name) { this.listeners.get(name)?.forEach(callback => callback()); }
  get listenerCount() { return [...this.listeners.values()].reduce((sum, list) => sum + list.size, 0); }
}

function harness(createMotion) {
  const media = new Signals();
  media.matches = false;
  const view = new Signals();
  view.innerWidth = 1000;
  view.innerHeight = 800;
  view.matchMedia = () => media;
  let observer;
  view.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
    notify(isIntersecting) { this.callback([{ isIntersecting }]); }
  };
  const doc = new Signals();
  doc.hidden = false;
  doc.defaultView = view;
  const animations = [];
  const surface = {
    ownerDocument: doc, isConnected: true, hidden: false,
    box: { left: 20, right: 420, top: 20, bottom: 420, width: 400, height: 400 },
    closest(selector) { return selector === '[hidden]' && this.hidden ? this : null; },
    getBoundingClientRect() { return this.box; },
    animate(frames, options) {
      const animation = { frames, options, playState: 'running', cancel() {
        this.playState = 'idle';
        this.oncancel?.();
      } };
      animations.push(animation);
      return animation;
    }
  };
  const motion = createMotion(surface);
  return { surface, motion, doc, view, media, observer, animations };
}

for (const filename of ['topic-perception.js', 'topic-workbench.js']) {
  const source = await fs.readFile(new URL(`../${filename}`, import.meta.url), 'utf8');
  const createMotion = vm.runInNewContext(`${source.replace(/^export /gm, '')}\ncreateTopicMotion;`);

  test(`${filename}: motion is finite, event-triggered and cleans up after completion`, () => {
    const h = harness(createMotion);
    assert.equal(h.animations.length, 0);
    let cleanups = 0;
    const animation = h.motion.play(h.surface, [{ opacity: 0 }, { opacity: 1 }], { iterations: Infinity }, () => cleanups++);
    assert.equal(animation.options.iterations, 1);
    animation.onfinish();
    h.motion.cancel();
    assert.equal(animation.playState, 'idle');
    assert.equal(cleanups, 1);
    assert.doesNotMatch(source, /requestAnimationFrame\(|setInterval\(|fetch\(/);
  });

  test(`${filename}: system and local static preferences suppress and cancel motion`, () => {
    const h = harness(createMotion);
    h.media.matches = true;
    assert.equal(h.motion.play(h.surface, []), null);
    h.media.matches = false;
    h.view.SiteMotion = { enabled: () => false };
    assert.equal(h.motion.play(h.surface, []), null);
    h.view.SiteMotion.enabled = () => true;
    const animation = h.motion.play(h.surface, []);
    h.view.SiteMotion.enabled = () => false;
    h.view.emit('site:motion-change');
    assert.equal(animation.playState, 'idle');
    h.view.SiteMotion.enabled = () => true;
    const second = h.motion.play(h.surface, []);
    h.media.matches = true;
    h.media.emit('change');
    assert.equal(second.playState, 'idle');
    assert.equal(h.motion.allowed(), false);
  });

  test(`${filename}: rapid input, offscreen, background and destroy release every effect`, () => {
    const h = harness(createMotion);
    let cleanups = 0;
    const play = () => h.motion.play(h.surface, [], {}, () => cleanups++);
    play();
    h.motion.cancel();
    play();
    h.observer.notify(false);
    assert.equal(h.motion.allowed(), false);
    h.observer.notify(true);
    play();
    h.doc.hidden = true;
    h.doc.emit('visibilitychange');
    assert.equal(h.motion.allowed(), false);
    h.doc.hidden = false;
    play();
    h.doc.emit('scroll');
    play();
    h.motion.destroy();
    assert.equal(cleanups, 5);
    assert.ok(h.animations.every(animation => animation.playState === 'idle'));
    assert.equal(h.motion.allowed(), false);
    assert.equal(h.observer.disconnected, true);
    assert.equal(h.doc.listenerCount + h.view.listenerCount + h.media.listenerCount, 0);
    assert.equal(play(), null);
    assert.equal(cleanups, 6);
  });

  test(`${filename}: hidden and clipped elements never start or replay animations`, () => {
    const h = harness(createMotion);
    h.surface.hidden = true;
    assert.equal(h.motion.play(h.surface, []), null);
    h.surface.hidden = false;
    h.surface.box.top = 900;
    h.surface.box.bottom = 1300;
    assert.equal(h.motion.play(h.surface, []), null);
    h.surface.box.top = 20;
    h.surface.box.bottom = 420;
    h.observer.notify(true);
    assert.equal(h.animations.length, 0);
    delete h.surface.animate;
    assert.equal(h.motion.play(h.surface, []), null);
  });
}

test('decorative place preview reuses the synthetic scene at any canvas size', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(target, key) { return target[key] ?? ((...args) => calls.push([key, ...args])); },
    set(target, key, value) { target[key] = value; calls.push([key, value]); return true; }
  });
  const canvas = { width: 400, height: 230, getContext: () => ctx };
  const initial = JSON.stringify(VPR_ROUNDS);
  paintPlacePreview(canvas);
  assert.deepEqual(calls[0], ['save']);
  assert.deepEqual(calls[1], ['scale', 0.5, 0.5]);
  assert.equal(calls.at(-1)[0], 'restore');
  assert.ok(calls.some(call => call[0] === 'fillStyle' && call[1] === '#b4d8de'));
  assert.equal(calls.filter(call => call[0] === 'strokeRect').length, 0);
  calls.length = 0;
  paintPlacePreview(canvas, { night: true, highlight: true });
  assert.ok(calls.some(call => call[0] === 'fillStyle' && call[1] === '#223a50'));
  assert.equal(calls.filter(call => call[0] === 'strokeRect').length, 6);
  assert.equal(JSON.stringify(VPR_ROUNDS), initial);
  assert.equal(canvas.width, 400);
  assert.equal(canvas.height, 230);
  assert.doesNotThrow(() => paintPlacePreview({ getContext: () => null }));
});
