import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

const topics = [
  ['vpr', 'vpr', '同一地标'],
  ['medical-image-analysis', 'medical', '标注'],
  ['agent', 'agent', '交付结果'],
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
  await expect(page.locator('.hero-topic-caption')).toHaveText('A task, tools, and a delivered result');
  expect(errors).toEqual([]);
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
