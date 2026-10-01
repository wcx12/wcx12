import { test, expect } from '@playwright/test';

const tiger = 'blog/posts/tiger-generative-retrieval-reading/';
const writing = 'blog/posts/building-a-research-writing-system/';
const flow = '#fig-tiger-semantic-id-flow';

async function canvasColors(canvas) {
  return canvas.evaluate(node => {
    const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
    return new Set(new Uint32Array(pixels.buffer)).size;
  });
}

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const theme of ['neon', 'warm', 'mono']) {
  for (const language of ['en', 'zh']) {
    test(`blog covers: ${theme}, ${language}, desktop and mobile`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(({ theme, language }) => {
        localStorage.setItem('wcx12-theme', theme);
        localStorage.setItem('wcx12-lang', language);
      }, { theme, language });
      await page.goto('blog/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('[data-post-card]:visible')).toHaveCount(3);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 960 });
        const covers = page.locator('[data-post-card]:visible .blog-cover');
        await expect(covers).toHaveCount(3);
        for (const cover of await covers.all()) {
          await expect.poll(() => canvasColors(cover.locator('canvas'))).toBeGreaterThan(15);
          await expect(cover.locator('button')).toHaveAccessibleName(language === 'zh' ? '重播封面' : 'Replay cover');
          await expect(cover.locator('button svg.lucide')).toHaveAttribute('aria-hidden', 'true');
          expect(await cover.locator('button').evaluate(node => Boolean(node.closest('a')))).toBe(false);
        }
        await noOverflow(page);
        await page.screenshot({ path: testInfo.outputPath(`blog-${theme}-${language}-${width}.png`), fullPage: true });
      }
      const card = page.locator('[data-post-card]:visible').filter({ has: page.locator('[data-cover-kind="writing"]') });
      const title = card.locator('h3 a');
      await expect(title).toHaveAttribute('href', /building-a-research-writing-system/);
      await title.click();
      await expect(page.locator('.blog-post-title')).toBeVisible();
      await expect(page.locator('.blog-post-header > .blog-cover')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}

for (const [route, selector] of [
  ['blog/', '[data-post-card]:visible > :is(.blog-cover-slot, .blog-cover)'],
  [writing, '.blog-post-header > :is(.blog-cover-slot, .blog-cover)']
]) {
  test(`cover enhancement preserves server-rendered geometry: ${route}`, async ({ page }) => {
    // An inert module delays enhancement without holding Firefox's document/font loading open.
    const pattern = '**/blog/assets/blog.js?*';
    await page.route(pattern, request => request.fulfill({ contentType: 'text/javascript', body: '' }));
    try {
      await page.goto(route);
      const covers = page.locator(selector);
      await expect(covers.first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready.then(() => {}));
      await expect(covers.locator('canvas')).toHaveCount(0);
      const bounds = () => covers.evaluateAll(nodes => nodes.map(node => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      }));
      const before = await bounds();
      await expect(covers.first()).toHaveAttribute('aria-hidden', 'true');
      await page.unroute(pattern);
      await page.evaluate(async () => {
        const source = [...document.scripts].find(script => script.src && new URL(script.src).pathname.endsWith('/blog/assets/blog.js')).src;
        await import(source + '&cover-hydration-test=1');
      });
      await expect(covers.locator('canvas')).toHaveCount(before.length);
      await expect(covers.first()).not.toHaveAttribute('aria-hidden');
      await expect(page.locator('.blog-card .blog-cover-slot, .blog-post-header > .blog-cover-slot')).toHaveCount(0);
      const after = await bounds();
      for (let index = 0; index < before.length; index++) {
        for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(after[index][key] - before[index][key])).toBeLessThan(1);
      }
    } finally {
      await page.unroute(pattern);
    }
  });
}

test('article language change redraws its cover without synchronous layout reads', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(tiger);
  const canvas = page.locator('.blog-post-header > .blog-cover canvas');
  await expect.poll(() => canvasColors(canvas)).toBeGreaterThan(15);
  const before = await canvas.evaluate(node => node.toDataURL());
  const reads = await page.evaluate(() => {
    const original = Element.prototype.getBoundingClientRect;
    let synchronousReads = 0;
    Element.prototype.getBoundingClientRect = function () {
      if (this.matches('.blog-cover canvas')) synchronousReads++;
      return original.call(this);
    };
    try { document.getElementById('blogLangToggle').click(); }
    finally { Element.prototype.getBoundingClientRect = original; }
    return synchronousReads;
  });
  expect(reads).toBe(0);
  await expect(page.locator('.blog-post-header > .blog-cover .blog-cover-replay')).toHaveAccessibleName('重播封面');
  await expect.poll(() => canvas.evaluate(node => node.toDataURL())).not.toBe(before);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator(flow).scrollIntoViewIfNeeded();
    await expect(page.locator(flow)).toBeVisible();
    await noOverflow(page);
    await expect(page.locator('.blog-content .katex').first()).toBeVisible();
  }
});

test('cover replay cancels offscreen and does not resume automatically', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(writing);
  const cover = page.locator('.blog-post-header > .blog-cover');
  await cover.scrollIntoViewIfNeeded();
  await cover.dispatchEvent('pointerenter', { pointerType: 'mouse' });
  await expect(cover).toHaveAttribute('data-playing', 'true');
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect(cover).toHaveAttribute('data-playing', 'false', { timeout: 900 });
  await cover.dispatchEvent('blog:replay-cover');
  await expect(cover).toHaveAttribute('data-playing', 'false');
  await cover.scrollIntoViewIfNeeded();
  await expect(cover).toHaveAttribute('data-playing', 'false');
});

test('cover hover and keyboard replay end once; global and OS motion changes cancel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(writing);
  const cover = page.locator('.blog-post-header > .blog-cover');
  const button = cover.locator('button');
  await cover.dispatchEvent('pointerenter', { pointerType: 'mouse' });
  await expect(cover).toHaveAttribute('data-playing', 'true');
  await expect(cover).toHaveAttribute('data-playing', 'false', { timeout: 2500 });
  const resting = await cover.locator('canvas').evaluate(node => node.toDataURL());
  await page.waitForTimeout(1300);
  expect(await cover.locator('canvas').evaluate(node => node.toDataURL())).toBe(resting);
  await button.focus();
  await expect(cover).toHaveAttribute('data-playing', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(cover).toHaveAttribute('data-playing', 'false');
  await button.press('Enter');
  await expect(cover).toHaveAttribute('data-playing', 'false');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await button.press('Enter');
  await expect(cover).toHaveAttribute('data-playing', 'true');
  await page.evaluate(() => {
    window.SiteMotion = { enabled: () => false };
    window.dispatchEvent(new Event('site:motion-change'));
  });
  await expect(cover).toHaveAttribute('data-playing', 'false');
  await button.press('Enter');
  await expect(cover).toHaveAttribute('data-playing', 'false');
});

test('image zoom traps focus, restores scroll/inert state, and provides actual size', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(writing);
  const image = page.locator('.blog-content img').first();
  const trigger = page.locator('.blog-image-actions .blog-figure-zoom').first();
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => { document.querySelector('.blog-footer').inert = true; });
  const scroll = await page.evaluate(() => scrollY);
  const alt = await image.getAttribute('alt');
  await trigger.click();
  const dialog = page.locator('.blog-figure-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close figure' })).toBeFocused();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await expect(dialog.locator('img')).toHaveAttribute('alt', alt);
  const firstControl = dialog.getByRole('button', { name: 'Actual size' });
  const lastControl = dialog.getByRole('region', { name: 'Figure detail' });
  await firstControl.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(lastControl).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstControl).toBeFocused();
  for (let index = 0; index < 7; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelector('.blog-figure-dialog').contains(document.activeElement))).toBe(true);
  }
  await dialog.getByRole('button', { name: 'Actual size' }).click();
  await expect(dialog).toHaveAttribute('data-size', 'actual');
  await dialog.getByRole('button', { name: 'Fit to view' }).click();
  await expect(dialog).toHaveAttribute('data-size', 'fit');
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('blog-image-zoom-mobile.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  await expect(page.locator('.blog-footer')).toHaveAttribute('inert', '');
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0);
});

test('HTML figure zoom preserves research text and avoids duplicate IDs', async ({ page }, testInfo) => {
  await page.goto(tiger);
  const figure = page.locator(flow);
  const original = await figure.locator('.tiger-flow-map').innerText();
  await figure.locator(':scope > .blog-figure-actions button').click();
  const dialog = page.locator('.blog-figure-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.tiger-flow-map')).toHaveText(original.replace(/\s+/g, ' ').trim(), { useInnerText: true });
  await expect(dialog.locator('.blog-stage-controls')).toHaveCount(0);
  expect(await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
    return ids.length === new Set(ids).size;
  })).toBe(true);
  await dialog.locator('.tiger-flow-card summary').first().click();
  await expect(dialog.locator('.tiger-flow-card').first()).toHaveAttribute('open', '');
  await expect(figure.locator('.tiger-flow-card').first()).not.toHaveAttribute('open');
  await page.screenshot({ path: testInfo.outputPath('blog-html-figure-zoom.png') });
  await page.keyboard.press('Escape');
  expect(await figure.locator('.tiger-flow-map').innerText()).toBe(original);
});

test('architecture stages are opt-in, pausable and bounded, with manual reduced-motion navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(tiger);
  const figure = page.locator(flow);
  const controls = figure.locator('.blog-stage-controls');
  await controls.scrollIntoViewIfNeeded();
  await expect(figure.locator('[aria-current="step"]')).toHaveCount(0);
  await controls.locator('[data-blog-i18n-aria="stage_next"]').click();
  await expect(figure.locator('.tiger-flow-step').first()).toHaveAttribute('aria-current', 'step');
  await controls.locator('[data-blog-i18n-aria="stage_play"]').click();
  await expect(controls.locator('[data-blog-i18n-aria="stage_pause"]')).toHaveAttribute('aria-pressed', 'true');
  await controls.locator('[data-blog-i18n-aria="stage_pause"]').click();
  const paused = await controls.getByRole('status').innerText();
  await page.waitForTimeout(1750);
  expect(await controls.getByRole('status').innerText()).toBe(paused);
  await controls.locator('[data-blog-i18n-aria="stage_play"]').click();
  await expect(controls.getByRole('status')).toContainText('6 / 6', { timeout: 10000 });
  await expect(controls.locator('[data-blog-i18n-aria="stage_play"]')).toHaveAttribute('aria-pressed', 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(controls.locator('[data-blog-i18n-aria="stage_play"]')).toBeDisabled();
  await controls.locator('[data-blog-i18n-aria="stage_previous"]').click();
  await expect(controls.getByRole('status')).toContainText('5 / 6');
  await expect(figure.locator('.tiger-flow-card[open]')).toHaveCount(0);
});

test('theme changes use shared transition hook; copy confirmation is bounded', async ({ page }) => {
  await page.goto(writing);
  await page.evaluate(() => {
    window.SiteMotion = {
      enabled: () => false,
      transitionTheme(update, source) { document.documentElement.dataset.themeSource = source.id; update(); }
    };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedCode = text; } } });
  });
  await page.locator('#blogThemeSelect').selectOption('mono');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
  await expect(page.locator('html')).toHaveAttribute('data-theme-source', 'blogThemeSelect');
  const copy = page.locator('.code-copy').first();
  await copy.click();
  await expect(copy).toHaveAttribute('data-copy-state', 'success');
  await expect(copy).toHaveText('Copied');
  expect(await page.evaluate(() => window.copiedCode)).toContain('npm run new:post');
  await expect(copy).not.toHaveAttribute('data-copy-state', 'success', { timeout: 2500 });
});

test('no JavaScript retains complete article and native list links', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(new URL('blog/', baseURL).href);
  await expect(page.locator('a.blog-card:visible')).toHaveCount(3);
  await expect(page.locator('[data-post-card]:visible > .blog-cover-slot')).toHaveCount(3);
  await expect(page.locator('.blog-cover canvas, .blog-cover button')).toHaveCount(0);
  await page.goto(new URL(tiger, baseURL).href);
  await expect(page.locator('.blog-post-title')).toBeVisible();
  await expect(page.locator(`${flow} .tiger-flow-step`)).toHaveCount(6);
  await expect(page.locator('.blog-figure-zoom, .blog-stage-controls')).toHaveCount(0);
  await page.locator(`${flow} summary`).first().click();
  await expect(page.locator(`${flow} details`).first()).toHaveAttribute('open', '');
  await noOverflow(page);
  await context.close();
});

test('private note workspace does not receive article enhancements', async ({ page }) => {
  await page.goto('blog/drafts/');
  await expect(page.locator('.blog-cover, .blog-stage-controls, .blog-figure-dialog, .blog-figure-zoom')).toHaveCount(0);
});

test('walkthrough controls recover after motion is re-enabled without autoplay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(tiger);
  const play = page.locator(flow + ' .blog-stage-controls [data-icon="play"]');
  await expect(play).toBeEnabled();
  await page.locator('[data-motion-setting]').uncheck();
  await expect(play).toBeDisabled();
  await page.locator('[data-motion-setting]').check();
  await expect(play).toBeEnabled();
  await expect(play).toHaveAttribute('aria-pressed', 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(play).toBeDisabled();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(play).toBeEnabled();
  await expect(play).toHaveAttribute('aria-pressed', 'false');
});
