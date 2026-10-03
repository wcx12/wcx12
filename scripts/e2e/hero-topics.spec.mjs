import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

const topics = [
  ['vpr', 'vpr', '同一地标'],
  ['medical-image-analysis', 'medical', '标注'],
  ['agent', 'agent', '任务'],
  ['ai4edu', 'education', '几何问题']
];
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

test('every non-point topic has a distinct subject preview even with motion disabled', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto('zh/');
  const hashes = new Set();
  for (const [id, , caption] of topics) {
    await page.locator(`[data-scene-interest="${id}"]`).click();
    await expect(page.locator('.hero-topic-caption')).toContainText(caption);
    await expect(page.locator('#heroPreviewCanvas')).toHaveAttribute('data-topic-art', id);
    hashes.add(hash(await page.locator('#heroPreviewCanvas').screenshot({ path: info.outputPath(`static-${id}.png`) })));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(hashes.size).toBe(4);
  expect(requests.some(url => url.includes('/assets/vendor/three/'))).toBe(false);
  await page.goto('./');
  await page.locator('[data-scene-interest="agent"]').click();
  await expect(page.locator('.hero-topic-caption')).toHaveText('Task: organize three research notes into a summary for review.');
  expect(errors).toEqual([]);
});

test('story controls change pixels, retain per-topic progress, support keyboard and reset', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('zh/');
  const fallback = page.locator('#heroPreviewCanvas');
  for (const [id] of topics) {
    await page.locator(`[data-scene-interest="${id}"]`).click();
    const states = new Set();
    const heights = [];
    for (let stage = 0; stage < 3; stage++) {
      const step = page.locator(`[data-hero-stage="${stage}"]`);
      await step.focus();
      await step.press('Enter');
      await expect(step).toBeFocused();
      await expect(step).toHaveAttribute('aria-pressed', 'true');
      await expect(fallback).toHaveAttribute('data-topic-stage', String(stage));
      states.add(await fallback.evaluate(canvas => canvas.toDataURL()));
      heights.push(await page.evaluate(() => document.documentElement.scrollHeight));
      await page.locator('.hero-preview-panel').screenshot({ path: info.outputPath(`${id}-${stage}.png`) });
    }
    expect(states.size, id).toBe(3);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
    await expect(page.locator('.hero-story-next')).toHaveAccessibleName('回到起点');
  }
  await page.locator('[data-scene-interest="agent"]').click();
  await expect(page.locator('[data-hero-stage="2"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.hero-story-next').click();
  await expect(fallback).toHaveAttribute('data-topic-stage', '0');
  await expect(page.locator('.hero-topic-caption')).toContainText('任务：');
});

test('3D stages stay in sync through motion preferences and context-loss fallback', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Actual WebGL state and context loss are exercised in Chromium.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('zh/');
  await page.locator('[data-scene-interest="ai4edu"]').click();
  await page.locator('[data-hero-stage="1"]').click();
  await page.locator('.hero-scene-launch').click();
  const scene = page.locator('.hero-scene-canvas');
  await expect(scene).toBeVisible({ timeout: 20000 });
  await expect(scene).toHaveAccessibleName(/提示：/);
  await page.waitForTimeout(1400);
  const before = hash(await scene.screenshot());
  await page.locator('[data-hero-stage="2"]').click();
  await expect(scene).toHaveAccessibleName(/恰好拼成/);
  await page.waitForTimeout(1400);
  expect(hash(await scene.screenshot())).not.toBe(before);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-hero-stage="0"]').click();
  await expect(scene).toHaveAccessibleName(/几何问题：/);
  await scene.focus();
  await scene.evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('#heroPreviewCanvas')).toBeVisible();
  await expect(page.locator('[data-hero-stage="0"]')).toBeFocused();
  await expect(page.locator('#heroPreviewCanvas')).toHaveAttribute('data-topic-stage', '0');
  const initial = await page.locator('#heroPreviewCanvas').evaluate(canvas => canvas.toDataURL());
  await page.locator('[data-hero-stage="2"]').click();
  expect(await page.locator('#heroPreviewCanvas').evaluate(canvas => canvas.toDataURL())).not.toBe(initial);
});

test('late research metadata preserves hero stage, results and focused control nodes', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('https://pub.orcid.org/**', async route => {
    await gate;
    await route.fulfill({ json: { group: [] } });
  });
  await page.goto('zh/');
  await page.locator('.command-row [data-view="research"]').click();
  await expect(page.locator('#interestDemoAction')).toBeEnabled();
  await page.locator('[data-scene-interest="agent"]').click();
  const step = page.locator('[data-hero-stage="1"]');
  await step.click();
  const node = await step.elementHandle();
  const response = page.waitForResponse('https://pub.orcid.org/**');
  release();
  await (await response).finished();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await node.evaluate(element => element.isConnected)).toBe(true);
  await expect(step).toBeFocused();
  await expect(step).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.hero-topic-caption')).toContainText('读取资料');
});

test('delayed 3D startup respects a changed motion preference and latest story state', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium exercises the actual WebGL startup race.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.route('**/hero-scene.js?*', async route => { await gate; await route.continue(); });
  await page.goto('zh/');
  const requested = page.waitForRequest('**/hero-scene.js?*');
  await page.locator('.hero-scene-launch').click();
  await requested;
  await page.locator('[data-scene-interest="agent"]').click();
  await page.locator('[data-hero-stage="2"]').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  release();
  await expect(page.locator('.hero-scene-launch')).not.toHaveAttribute('aria-busy', 'true');
  expect(requests.some(url => url.includes('/assets/vendor/three/'))).toBe(false);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.hero-scene-canvas')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.hero-scene-canvas')).toHaveAccessibleName(/摘要草稿已交付/);
});

test('subject reliefs follow the selected topic, render visibly and retain direct rotation', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'Chromium checks WebGL pixels; every engine checks the matching 2D subject.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('zh/');
  await page.locator('.hero-scene-launch').click();
  const scene = page.locator('.hero-scene-canvas');
  await expect(scene).toBeVisible({ timeout: 20000 });
  for (const [id, key, caption] of topics) {
    await page.locator(`[data-scene-interest="${id}"]`).click();
    await expect(page.locator('.hero-preview-panel')).toHaveAttribute('data-hero-scene-topic', key);
    await expect(page.locator('.hero-preview-panel')).toHaveAttribute('data-hero-scene-representation', 'subject-relief');
    await expect(scene).toHaveAccessibleName(new RegExp(caption));
    await page.mouse.move(5, 5);
    await page.waitForTimeout(1500);
    const still = await scene.screenshot({ path: info.outputPath(`subject-${id}.png`) });
    expect(still.length).toBeGreaterThan(4000);
    await scene.press('ArrowRight');
    await page.waitForTimeout(1200);
    expect(hash(await scene.screenshot())).not.toBe(hash(still));
  }
  await page.locator('[data-scene-interest="point-cloud-registration"]').click();
  await expect(page.locator('.hero-preview-panel')).toHaveAttribute('data-hero-scene-representation', 'point-cloud');
});

test('failed pending activation does not steal focus from a story control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/hero-scene.js?*', async route => { await gate; await route.abort(); });
  await page.goto('zh/');
  await page.locator('.hero-scene-launch').focus();
  await page.locator('.hero-scene-launch').press('Enter');
  await page.locator('[data-scene-interest="agent"]').click();
  const step = page.locator('[data-hero-stage="1"]');
  await step.focus();
  await step.press('Enter');
  release();
  await expect(page.getByRole('button', { name: '重试三维交互' })).toBeVisible();
  await expect(step).toBeFocused();
});

test('registration context loss returns focus to its topic when motion disables retry', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium exercises actual WebGL loss.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('zh/');
  await page.locator('.hero-scene-launch').click();
  const scene = page.locator('.hero-scene-canvas');
  await expect(scene).toBeVisible({ timeout: 20000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await scene.focus();
  await scene.evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('[data-scene-interest="point-cloud-registration"]')).toBeFocused();
  await expect(page.locator('#heroPreviewCanvas')).toBeVisible();
});

test('a delayed Three download defers context creation until motion is enabled again', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium exercises actual WebGL creation.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/three.module.min.js?*', async route => { await gate; await route.continue(); });
  await page.goto('zh/');
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    window.webglCreations = 0;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl2') window.webglCreations++;
      return original.call(this, type, ...args);
    };
  });
  const request = page.waitForRequest('**/three.module.min.js?*');
  await page.locator('.hero-scene-launch').click();
  await request;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const response = page.waitForResponse('**/three.module.min.js?*');
  release();
  await (await response).finished();
  await page.locator('[data-scene-interest="agent"]').click();
  await page.locator('[data-hero-stage="2"]').click();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.webglCreations)).toBe(0);
  await expect(page.locator('#heroPreviewCanvas')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.hero-scene-canvas')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.hero-scene-canvas')).toHaveAccessibleName(/摘要草稿已交付/);
});

test('context loss restores the current subject rather than stale point-cloud artwork', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium exercises actual WebGL context loss.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('zh/');
  await page.locator('[data-scene-interest="agent"]').click();
  const fallback = page.locator('#heroPreviewCanvas');
  await expect(fallback).toHaveAttribute('data-topic-art', 'agent');
  const before = await fallback.evaluate(canvas => canvas.toDataURL());
  await page.locator('.hero-scene-launch').click();
  const scene = page.locator('.hero-scene-canvas');
  await expect(scene).toBeVisible({ timeout: 20000 });
  await page.locator('[data-scene-interest="vpr"]').click();
  await page.locator('[data-scene-interest="agent"]').click();
  await scene.evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(fallback).toBeVisible();
  await expect(page.getByRole('button', { name: '重试三维交互' })).toBeVisible();
  expect(await fallback.evaluate(canvas => canvas.toDataURL())).toBe(before);
});
