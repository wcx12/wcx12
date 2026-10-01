import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const source = {};
for (const module of ['topic-perception', 'topic-workbench']) {
  source[module] = {
    js: await fs.readFile(new URL(`../../${module}.js`, import.meta.url), 'utf8'),
    css: await fs.readFile(new URL(`../../${module}.css`, import.meta.url), 'utf8')
  };
}

// Isolated source mounts do not rebuild or mutate the parent's frozen artifact.
async function mount(page, kind, { lang = 'en', theme = 'neon', staticMode = false } = {}) {
  const module = source[['Vpr', 'Medical'].includes(kind) ? 'topic-perception' : 'topic-workbench'];
  await page.setContent(`<html lang="${lang}" data-theme="${theme}"><head></head><body><main class="topic-experiences"><div id="mount"></div></main></body></html>`);
  await page.addStyleTag({ content: `
    :root { --text:#eef3f3; --muted:#b4c1c7; --cyan:#75dcc8; --pink:#f2b8bf; --field-bg:#121a1e; --soft-bg:#202b30; --line:#607078; }
    :root[data-theme="warm"] { --text:#252820; --muted:#525b50; --cyan:#246c52; --pink:#9c405d; --field-bg:#fbfcf7; --soft-bg:#e9eee4; --line:#a8b2a2; }
    :root[data-theme="mono"] { --text:#f2f2f2; --muted:#bdbdbd; --cyan:#eee; --pink:#bdbdbd; --field-bg:#171717; --soft-bg:#292929; --line:#747474; }
    * { box-sizing:border-box; } body { margin:0; background:var(--field-bg); }
    .topic-experiences { max-width:760px; height:900px; overflow:auto; padding:16px; margin:auto; }
    ${module.css}
  ` });
  await page.evaluate(async ({ code, kind, lang, staticMode }) => {
    window.motionLog = [];
    window.staticMode = staticMode;
    window.SiteMotion = { enabled: () => !window.staticMode };
    window.nativeAnimate ||= Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      window.motionLog.push({ className: this.getAttribute('class'), frames, options });
      return window.nativeAnimate.call(this, frames, options);
    };
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    const module = await import(url);
    URL.revokeObjectURL(url);
    window.topicApi = module[`mount${kind}`](document.querySelector('#mount'), { lang });
  }, { code: module.js, kind, lang, staticMode });
  await expect(page.locator('#mount > section')).toBeVisible();
}

async function staticPreference(page) {
  await page.evaluate(() => {
    window.staticMode = true;
    window.dispatchEvent(new CustomEvent('site:motion-change'));
  });
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
}

test.use({ reducedMotion: 'no-preference' });

test('VPR observation changes preserve identity, paint every canvas and cancel rapid wipes', async ({ page }, testInfo) => {
  await mount(page, 'Vpr');
  await page.locator('[data-control="choose-B"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-result]')).toHaveAttribute('data-result', 'same');
  const night = await page.locator('[data-street="comparison"]').evaluate(canvas => canvas.toDataURL());
  await page.locator('[data-control="time-day"]').click();
  const day = await page.locator('[data-street="comparison"]').evaluate(canvas => canvas.toDataURL());
  expect(day).not.toBe(night);
  await page.locator('[data-control="viewpoint"]').selectOption('right');
  await expect(page.locator('[data-result]')).toHaveAttribute('data-result', 'same');
  await expect(page.locator('.vp-region[data-match="true"]')).toHaveCount(6);
  expect(await page.evaluate(() => window.motionLog.some(item => item.className === 'vp-wipe'))).toBe(true);
  await page.evaluate(() => {
    for (let index = 0; index < 10; index++) document.querySelector(`[data-control="time-${index % 2 ? 'day' : 'night'}"]`).click();
  });
  expect(await page.locator('.vp-wipe').count()).toBeLessThanOrEqual(1);
  await staticPreference(page);
  await expect(page.locator('.vp-wipe')).toHaveCount(0);
  await page.locator('[data-control="choose-A"]').click();
  await expect(page.locator('[data-result]')).toHaveAttribute('data-result', 'different');
  await expect(page.locator('.vp-region[data-match="false"]')).toHaveCount(2);
  await page.evaluate(() => window.topicApi.setLanguage('zh'));
  await expect(page.locator('[data-control="time-day"]')).toHaveText('\u767d\u5929');
  await page.screenshot({ path: testInfo.outputPath('vpr-observation.png') });
});

test('magnification preserves the observed specimen and annotation transfers spend exactly once', async ({ page }, testInfo) => {
  await mount(page, 'Medical');
  const initial = await page.locator('[data-specimen="detail"]').evaluate(canvas => canvas.toDataURL());
  await page.locator('[data-control="magnify"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.med-lens')).toBeVisible();
  expect(await page.locator('[data-specimen="detail"]').evaluate(canvas => canvas.toDataURL())).toBe(initial);
  const lens = await page.locator('.med-lens').evaluate(canvas => canvas.toDataURL());
  await page.locator('.med-lightbox').dispatchEvent('pointermove', { clientX: 125, clientY: 260, pointerType: 'mouse' });
  expect(await page.locator('.med-lens').evaluate(canvas => canvas.toDataURL())).not.toBe(lens);
  await page.screenshot({ path: testInfo.outputPath('medical-magnifier.png') });
  for (let used = 1; used <= 3; used++) {
    await page.locator('[data-control="query"]').click();
    await page.locator('[data-control="label-lobed"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-budget]')).toContainText(`${3 - used} / 3`);
    await expect(page.locator('[data-pool="labeled"] .med-sample')).toHaveCount(used);
    await expect(page.locator('[data-control="undo"]')).toBeFocused();
  }
  expect(await page.evaluate(() => window.motionLog.some(item => item.className === 'med-sample-image'))).toBe(true);
  await expect(page.locator('[data-control="query"]')).toBeDisabled();
  await staticPreference(page);
  await page.locator('[data-control="undo"]').click();
  await expect(page.locator('[data-budget]')).toContainText('1 / 3');
  await expect(page.locator('[data-control="label-single"]')).toBeFocused();
});

test('proposals float, reject retracts, and approval transfers without delaying calendar state', async ({ page }, testInfo) => {
  await mount(page, 'Agent');
  const saved = page.locator('[data-lane="saved"] .tw-event');
  const outcomes = await page.evaluate(() => {
    const submit = () => document.querySelector('form').requestSubmit();
    submit();
    const pending = document.querySelectorAll('[data-lane="saved"] .tw-event').length;
    document.querySelector('[data-action="decline"]').click();
    const rejected = document.querySelectorAll('[data-lane="preview"] .tw-event').length;
    const retracting = document.querySelectorAll('.tw-event-flight').length;
    submit();
    document.querySelector('[data-action="approve"]').click();
    return { pending, rejected, retracting, saved: document.querySelectorAll('[data-lane="saved"] .tw-event').length };
  });
  expect(outcomes).toEqual({ pending: 4, rejected: 0, retracting: 1, saved: 5 });
  await expect(saved).toHaveCount(5);
  await expect(page.locator('[data-lane="saved"] [data-kind="focus"]')).toHaveAttribute('data-start', '780');
  await expect(page.locator('.tw-event-flight')).toHaveCount(0);
  await expect(page.locator('[type="submit"]')).toBeFocused();
  await staticPreference(page);
  await page.screenshot({ path: testInfo.outputPath('agent-approved.png') });
});

test('geometry assembles the exact grid via keyboard and cancels effects on destroy', async ({ page }, testInfo) => {
  await mount(page, 'Education');
  await page.locator('[data-field="width"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.locator('[data-field="height"]').focus();
  for (let index = 0; index < 4; index++) await page.keyboard.press('ArrowRight');
  await expect(page.locator('.topic-education')).toHaveAttribute('data-solved', 'true');
  await expect(page.locator('.tw-unit-blocks rect:not([hidden])')).toHaveCount(24);
  await expect(page.locator('[data-measure="perimeter"] [data-value]')).toHaveText('20');
  expect(await page.evaluate(() => window.motionLog.some(item => item.className === 'tw-shape-outline'))).toBe(true);
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('education-solved.png') });
  await page.evaluate(() => {
    document.querySelector('[data-axis="width"][data-step="1"]').click();
    window.topicApi.destroy();
  });
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(page.locator('#mount')).toBeEmpty();
});

for (const theme of ['neon', 'warm', 'mono']) for (const lang of ['en', 'zh']) {
  test(`static motion retains all four responsive interactions: ${theme}/${lang}`, async ({ page }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 800]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const kind of ['Vpr', 'Medical', 'Agent', 'Education']) {
        await mount(page, kind, { theme, lang });
        const action = { Vpr: '[data-control="choose-B"]', Medical: '[data-control="magnify"]', Agent: '[type="submit"]', Education: '[data-axis="width"][data-step="1"]' }[kind];
        await page.locator(action).click();
        expect(await page.evaluate(() => window.motionLog.length)).toBe(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.locator('.topic-experiences').evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
        const pixels = await page.locator('canvas').evaluateAll(canvases => canvases.map(node =>
          new Set(new Uint32Array(node.getContext('2d').getImageData(0, 0, node.width, node.height).data.buffer)).size));
        expect(pixels.every(count => count > 10)).toBe(true);
        await page.evaluate(() => window.topicApi.destroy());
      }
    }
  });
}
