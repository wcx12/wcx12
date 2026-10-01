import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

async function pixelStats(page, png) {
  return page.evaluate(async data => {
    const image = new Image();
    image.src = data;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let bright = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 300) bright++;
    return { colors: new Set(new Uint32Array(pixels.buffer)).size, bright };
  }, 'data:image/png;base64,' + png.toString('base64'));
}
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

test('mobile topic resize preserves a visitor focusing a different interest', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('zh/');
  await page.locator('.command-row [data-view="research"]').click();
  await expect(page.locator('#interestDemoAction')).toBeEnabled();
  const target = page.locator('#interestRail [data-interest="agent"]');
  await target.focus();
  await page.setViewportSize({ width: 400, height: 844 });
  await expect(target).toBeFocused();
  await expect.poll(async () => {
    const box = await target.boundingBox();
    const rail = await page.locator('#interestRail').boundingBox();
    return box.x >= rail.x - 1 && box.x + box.width <= rail.x + rail.width + 1;
  }).toBe(true);
  await target.press('Enter');
  await expect(page.locator('.topic-experiences [data-topic="agent"] .tw-timeline')).toBeVisible();
});

test('fresh mobile keeps the lightweight preview until 3D is explicitly activated', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'Chromium exercises WebGL activation; all engines test fallback and main paths.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const requests = [], errors = [];
  page.on('request', request => requests.push(request.url()));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('zh/');
  const launch = page.getByRole('button', { name: '开启三维交互' });
  await launch.scrollIntoViewIfNeeded();
  await expect(launch).toBeVisible();
  await page.waitForTimeout(800);
  expect(requests.some(url => url.includes('/assets/vendor/three/'))).toBe(false);
  await expect(page.locator('#heroPreviewCanvas')).toBeVisible();
  await page.screenshot({ path: info.outputPath('mobile-before-3d.png') });
  await launch.focus();
  await launch.press('Enter');
  const scene = page.locator('.hero-scene-canvas');
  await expect(scene).toBeVisible({ timeout: 20000 });
  await expect(scene).toBeFocused();
  await expect(launch).toBeHidden();
  await page.waitForTimeout(1800);
  const pixels = await scene.screenshot({ path: info.outputPath('mobile-active-3d.png') });
  expect((await pixelStats(page, pixels)).bright).toBeGreaterThan(80);
  await scene.focus();
  await scene.press('ArrowRight');
  await page.waitForTimeout(1400);
  expect(hash(await scene.screenshot())).not.toBe(hash(pixels));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('failed 3D load retains content and a working retry command', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Actual WebGL recovery is tested in Chromium.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/assets/vendor/three/**', route => route.abort());
  await page.goto('zh/');
  await page.getByRole('button', { name: '开启三维交互' }).click();
  await expect(page.getByRole('button', { name: '重试三维交互' })).toBeVisible();
  await expect(page.locator('#heroPreviewCanvas')).toBeVisible();
  await page.unroute('**/assets/vendor/three/**');
  await page.getByRole('button', { name: '重试三维交互' }).click();
  await expect(page.locator('.hero-scene-canvas')).toBeVisible({ timeout: 20000 });
  expect(errors).toEqual([]);
});

test('spatial hero is nonblank, responds to pointer and topic input, then settles', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'WebGL is visually verified in Chromium; other engines exercise the static fallback and content paths.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto('zh/');
  await expect(page.getByRole('button', { name: '开启三维交互' })).toBeVisible();
  await page.waitForTimeout(3500);
  expect(requests.some(url => url.includes('/assets/vendor/three/'))).toBe(false);
  const fallback = page.locator('#heroPreviewCanvas');
  const still = hash(await fallback.screenshot());
  await page.waitForTimeout(400);
  expect(hash(await fallback.screenshot())).toBe(still);
  await page.locator('#heroPreviewCanvas').hover();
  const scene = page.locator('.hero-scene-canvas');
  await expect(scene).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(1800);
  const screenshot = await scene.screenshot({ path: info.outputPath('hero-arch.png') });
  const stats = await pixelStats(page, screenshot);
  expect(stats.colors).toBeGreaterThan(30);
  expect(stats.bright).toBeGreaterThan(100);
  const height = (await page.locator('.hero').boundingBox()).height;
  await page.locator('[data-scene-interest="vpr"]').click();
  await expect(page.locator('[data-scene-interest="vpr"]')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(1600);
  expect(hash(await scene.screenshot({ path: info.outputPath('hero-city.png') }))).not.toBe(hash(screenshot));
  expect((await page.locator('.hero').boundingBox()).height).toBe(height);
  await scene.focus();
  const before = hash(await scene.screenshot());
  await scene.press('ArrowRight');
  await page.waitForTimeout(1400);
  expect(hash(await scene.screenshot())).not.toBe(before);
  await scene.press('Home');
  await page.mouse.move(20, 20);
  await page.waitForTimeout(1800);
  const resting = hash(await scene.screenshot());
  await page.waitForTimeout(700);
  expect(hash(await scene.screenshot())).toBe(resting);
  await page.setViewportSize({ width: 390, height: 844 });
  await scene.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const mobile = await scene.screenshot({ path: info.outputPath('hero-mobile.png') });
  expect((await pixelStats(page, mobile)).bright).toBeGreaterThan(80);
  const box = await scene.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(await scene.evaluate(node => getComputedStyle(node).touchAction)).toContain('pan-y');
  expect(errors).toEqual([]);
});

test('homepage themes, widths and replay controls retain visible content', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('zh/');
  await expect(page.locator('[data-work-poster]')).toHaveCount(3);
  for (const theme of ['neon', 'warm', 'mono']) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#themeSelect').selectOption(theme);
    await page.screenshot({ path: info.outputPath('home-' + theme + '-1440.png'), fullPage: true });
    for (const width of [320, 360, 390, 768, 1024, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('.hero-actions a').first()).toBeVisible();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: info.outputPath('home-' + theme + '-390.png'), fullPage: true });
  }
  const replay = page.locator('[data-work-poster="tokens"] button');
  await replay.click();
  await expect(replay).toHaveAccessibleName('重播预览');
  await page.locator('.selected-work h3 a').first().click();
  await expect(page.locator('h1')).toContainText('TF-VPR');
  expect(errors).toEqual([]);
});

test('global motion preference survives navigation and yields to the system preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('zh/');
  const setting = page.locator('[data-motion-setting]');
  await setting.uncheck();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.goto('blog/');
  await expect(page.locator('[data-motion-setting]')).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.goto('blog/posts/tiger-generative-retrieval-reading/');
  await expect(page.locator('.blog-footer [data-motion-setting]')).toBeVisible();
  await expect(page.locator('.blog-post-footer [data-motion-setting]')).toHaveCount(0);
  await page.locator('[data-motion-setting]').check();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-motion-setting]')).toBeDisabled();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
});

test('reduced motion does not download WebGL and unavailable 3D leaves the homepage usable', async ({ page }) => {
  const assets = [];
  page.on('request', request => assets.push(request.url()));
  await page.goto('./');
  await expect(page.locator('[data-scene-interest="vpr"]')).toBeVisible();
  await page.waitForTimeout(2000);
  expect(assets.some(url => url.includes('/assets/vendor/three/'))).toBe(false);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/assets/vendor/three/**', route => route.abort());
  await page.reload();
  await expect(page.locator('#heroPreviewCanvas')).toBeVisible();
  await page.locator('[data-scene-interest="agent"]').click();
  await expect(page.locator('.hero-preview-title strong')).toContainText('Agent');
  await page.locator('.hero-actions a').first().click();
  await expect(page.locator('h1')).toContainText('Publications');
});

test('article table of contents follows the actual heading while figures remain readable', async ({ page }) => {
  await page.goto('blog/posts/tiger-generative-retrieval-reading/');
  const heading = page.locator('.blog-content h2[id]').nth(2);
  const id = await heading.getAttribute('id');
  await heading.evaluate(node => scrollTo(0, node.getBoundingClientRect().top + scrollY - 110));
  await expect.poll(async () => decodeURIComponent(await page.locator('.blog-toc-desktop [aria-current="location"]').getAttribute('href'))).toBe('#' + id);
  await expect(page.locator('.katex').first()).toBeAttached();
});

test('animated theme changes settle on the latest choice and native navigation still works', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('zh/');
  await expect(page.locator('[data-scene-interest="vpr"]')).toBeVisible();
  await page.locator('#themeSelect').selectOption('warm');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'warm');
  await expect(page.locator('html')).not.toHaveAttribute('data-transition', 'theme');
  await page.evaluate(() => {
    const select = document.getElementById('themeSelect');
    for (const value of ['neon', 'mono']) {
      select.value = value;
      select.dispatchEvent(new Event('change'));
    }
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
  await expect(page.locator('html')).not.toHaveAttribute('data-transition', 'theme');
  await page.locator('[data-site-section="research"]').click();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
  await page.goBack();
  await expect(page.locator('.hero h1')).toBeVisible();
  expect(errors).toEqual([]);
});

test('hero topic selection preserves the page height in both languages', async ({ page }) => {
  for (const route of ['./', 'zh/']) {
    await page.goto(route);
    await expect(page.locator('[data-scene-interest="vpr"]')).toBeVisible();
    const topics = await page.locator('[data-scene-interest]').evaluateAll(nodes => nodes.map(node => node.dataset.sceneInterest));
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const heights = [];
      for (const id of topics) {
        const button = page.locator(`[data-scene-interest="${id}"]`);
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        heights.push(await page.evaluate(() => document.documentElement.scrollHeight));
      }
      expect(Math.max(...heights) - Math.min(...heights), route + width).toBeLessThanOrEqual(1);
    }
  }
});

test('work navigation clears shared names on Back and saved motion-off stops smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.locator('.selected-work h3 a').first().click();
  await expect(page.locator('h1')).toContainText('TF-VPR');
  await page.goBack();
  await page.locator('.selected-work h3 a').nth(1).click();
  await expect(page).toHaveURL(/projects\/#project-major-intel$/);
  await page.goBack();
  expect(await page.locator('.selected-work h3').evaluateAll(nodes => nodes.filter(node => node.style.viewTransitionName === 'work-heading').length)).toBeLessThanOrEqual(1);
  await page.locator('[data-motion-setting]').uncheck();
  await page.evaluate(() => {
    window.scrollOptions = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function(options) { window.scrollOptions.push(options); return original.call(this, options); };
  });
  await page.locator('.command-row [data-view="research"]').click();
  await expect(page.locator('#research h2')).toBeVisible();
  expect(await page.evaluate(() => window.scrollOptions.some(options => options?.behavior === 'smooth'))).toBe(false);
  expect(errors).toEqual([]);
});
