import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import { heroTopicKey, heroTopicDescription, heroTopicStages, normalizeHeroStage, createTopicArt, paintHeroTopic } from '../hero-topic-art.js';

const config = JSON.parse(await fs.readFile(new URL('../research-config.json', import.meta.url), 'utf8'));
const topics = config.interests.flatMap(domain => domain.children).filter(topic => topic.animation !== 'none');
test('each configured hero topic has an explicit subject; unknown interests do not become point clouds', () => {
  assert.equal(heroTopicKey('point-cloud-registration'), 'arch');
  assert.equal(heroTopicKey('new-topic'), 'generic');
  assert.equal(heroTopicKey('__proto__'), 'generic');
  for (const topic of topics) {
    assert.notEqual(heroTopicKey(topic.id), 'generic', topic.id);
    assert.notEqual(heroTopicDescription(topic.id, 'zh'), heroTopicDescription(topic.id, 'en'));
    assert.ok(heroTopicDescription(topic.id, 'en').length > 15);
  }
});

test('subject geometry stays deterministic, bounded and finite in both rendering paths', () => {
  for (const key of ['vpr', 'medical', 'agent', 'education']) {
    const art = createTopicArt(key);
    assert.deepEqual(art, createTopicArt(key));
    assert.ok(art.length >= 15 && art.length < 100);
    assert.ok(art.some(shape => shape.role === 'result'));
    for (const shape of art) for (const point of shape.points) {
      assert.equal(point.length, 3);
      assert.ok(point.every(Number.isFinite));
      assert.ok(Math.abs(point[0]) < 2.55 && Math.abs(point[1]) < 1.55 && Math.abs(point[2]) < .5);
    }
  }
  assert.deepEqual(createTopicArt('generic'), []);
});

test('the education example preserves triangle lengths and areas when forming the square', () => {
  const triangles = [0, 1, 2].flatMap(stage => createTopicArt('education', stage).filter(shape => shape.role.startsWith('triangle-')));
  const partition = createTopicArt('education').find(shape => shape.role === 'partition');
  assert.equal(partition.stroke, 'screen', 'the assembled square needs a dark seam, not a color-only distinction');
  assert.deepEqual(partition.points.map(p => p.slice(0, 2)), [[-.7, .8], [.7, -.6]]);
  assert.equal(triangles.length, 6, 'two rigid pieces in every stage, without duplicating the result');
  const lengths = triangles.map(({ points }) => points.slice(0, 3).map((p, i) => {
    const q = points[(i + 1) % 3];
    return Math.hypot(p[0] - q[0], p[1] - q[1]);
  }).sort((a, b) => a - b));
  for (const sides of lengths) for (let i = 0; i < sides.length; i++) {
    assert.ok(Math.abs(sides[i] - lengths[0][i]) < 1e-10);
  }
});

test('static previews draw actual subject shapes but leave registration to its existing renderer', () => {
  const calls = [];
  const ctx = new Proxy({}, { get: (_, key) => (...args) => calls.push([key, ...args]), set: () => true });
  for (const id of ['vpr', 'medical-image-analysis', 'agent', 'ai4edu']) {
    calls.length = 0;
    assert.equal(paintHeroTopic(ctx, 360, 170, id, {}), true);
    assert.ok(calls.some(([key]) => key === 'fill'));
    assert.ok(calls.some(([key]) => key === 'stroke'));
  }
  assert.equal(paintHeroTopic(ctx, 360, 170, 'point-cloud-registration', {}), false);
});

test('each story has three distinct, bounded visual states and localized results', () => {
  for (const id of ['vpr', 'medical-image-analysis', 'agent', 'ai4edu']) {
    const zh = heroTopicStages(id, 'zh');
    const en = heroTopicStages(id, 'en');
    assert.equal(zh.length, 3);
    assert.equal(en.length, 3);
    assert.notDeepEqual(zh, en);
    const states = [0, 1, 2].map(stage => createTopicArt(heroTopicKey(id), stage));
    assert.equal(new Set(states.map(s => JSON.stringify(s))).size, 3, id);
    for (const art of states) for (const shape of art) for (const p of shape.points) {
      assert.ok(p.every(Number.isFinite));
      assert.ok(Math.abs(p[0]) < 2.55 && Math.abs(p[1]) < 1.55 && p[2] < .5);
    }
  }
  assert.deepEqual(heroTopicStages('point-cloud-registration'), []);
  assert.deepEqual(heroTopicStages('__proto__'), []);
  assert.equal(normalizeHeroStage(NaN), 0);
  assert.equal(normalizeHeroStage(-1), 0);
  assert.equal(normalizeHeroStage(8), 2);
});
