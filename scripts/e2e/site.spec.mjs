import { test, expect } from '@playwright/test';

const article = 'blog/posts/tiger-generative-retrieval-reading/';
async function home(page) {
  await page.goto('./');
  await expect(page.locator('#openCommand')).toBeVisible();
}
async function menu(page) {
  const toggle = page.locator('.site-menu-toggle');
  if (await toggle.isVisible() && !(await page.locator('.site-menu').getAttribute('open'))) await toggle.click();
}
test('paper, code, language context, contact and browser back', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await home(page);
  await expect(page.locator('.hero-actions a[href^="mailto:"]')).toHaveAttribute('href', /c2675668@gmail.com/);
  await page.locator('.selected-work a[href*="publications/tf-vpr"]').click();
  await expect(page.locator('h1')).toContainText('TF-VPR');
  await expect(page.locator('.blog-hero-actions a').filter({ hasText: 'Official code' })).toHaveAttribute('href', 'https://github.com/ddfs430/TF-VPR');
  await page.locator('#blogLangLink').click();
  await expect(page).toHaveURL(/zh\/publications\/tf-vpr\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.reload();
  await expect(page.locator('h1')).toContainText('TF-VPR');
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'BibTeX', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/133399\.bib$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/publications\/tf-vpr\/$/);
  expect(errors).toEqual([]);
});

test('mobile navigation, persistent theme and page reflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await home(page);
  await menu(page);
  await page.locator('#themeSelect').selectOption('mono');
  await page.locator('.site-navigation a[data-site-section="research"]').click();
  await expect(page.locator('h1')).toHaveText('Research');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
  await menu(page);
  await page.locator('#blogLangLink').click();
  await expect(page).toHaveURL(/zh\/research\/$/);
  await menu(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.site-menu')).not.toHaveAttribute('open', '');
  await expect(page.locator('.site-menu-toggle')).toBeFocused();
  for (const width of [320, 360, 768, 1024, 1920]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('command input preserves IME and keyboard selection remains visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 650 });
  await home(page);
  await page.locator('#openCommand').click();
  const input = page.locator('#commandInput');
  await expect(input).toBeFocused();
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229 });
  await expect(page.locator('#commandPalette')).toHaveAttribute('aria-hidden', 'false');
  await expect(input).toBeFocused();
  const before = await page.evaluate(() => scrollY);
  for (let index = 0; index < 11; index++) await input.press('ArrowDown');
  const visible = await page.evaluate(() => {
    const input = document.getElementById('commandInput');
    const option = document.getElementById(input.getAttribute('aria-activedescendant'));
    const row = option.getBoundingClientRect();
    const list = document.getElementById('commandList').getBoundingClientRect();
    return row.top >= list.top - 1 && row.bottom <= list.bottom + 1;
  });
  expect(visible).toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.keyboard.press('Escape');
  await expect(page.locator('#openCommand')).toBeFocused();
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  await page.locator('#openCommand').click();
  await input.fill('publications');
  await input.press('Enter');
  await expect(page.locator('#commandPalette')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#publications')).toBeVisible();
  for (const [route, queries] of [['./', [['Blog', 'writing'], ['Resume', 'profile']]], ['zh/', [['博客', 'writing'], ['履历', 'profile'], ['论文', 'publications']]]]) {
    await page.goto(route);
    for (const [query, view] of queries) {
      await page.locator('#openCommand').click();
      await input.fill(query);
      await input.press('Enter');
      await expect(page.locator(`#${view}`)).toBeVisible();
    }
  }
});

for (const dependency of ['script.js', 'site-data.js', 'homepage-i18n.js', 'scripts/portfolio-ranking.js', 'scripts/research-config-schema.js']) {
  test(`failed ${dependency} keeps static paths and recovery available`, async ({ page }) => {
    await page.route(`**/wcx12/${dependency}?*`, route => route.abort());
    await page.goto('zh/');
    await expect(page.locator('.enhancement-error')).toBeVisible();
    await expect(page.locator('#openCommand')).not.toBeVisible();
    await page.locator('.enhancement-fallback a[href*="publications"]').click();
    await expect(page).toHaveURL(/zh\/publications\/$/);
    await expect(page.locator('main')).toContainText('TF-VPR');
  });
}

test('blocked local storage and missing optional APIs do not lose publications', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.route('https://pub.orcid.org/**', route => route.fulfill({ status: 429, body: 'limited' }));
  await home(page);
  await page.locator('.command-row [data-view="publications"]').click();
  await expect(page.locator('#pubList')).toContainText('TF-VPR');
  await expect(page.locator('#pubList')).toContainText('Issue scheduled');
  await expect(page.locator('#pubList')).not.toContainText('In press');
  await page.locator('.pub-detail').first().click();
  await expect(page.getByRole('dialog').filter({ hasText: 'TF-VPR' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.pub-detail').first()).toBeFocused();
});

test('article terms, disclosures, keyboard scrolling, deep links and return', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto(article);
  const term = page.locator('[data-term-chip]').filter({ hasText: 'MIPS' }).first();
  await term.click();
  await expect(term).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.term-chip-card:visible')).toContainText(/Maximum|最大/);
  await page.keyboard.press('Escape');
  await expect(term).toHaveAttribute('aria-expanded', 'false');
  const summary = page.locator('.blog-disclosure summary').filter({ hasText: /损失函数/ }).first();
  await summary.click();
  await expect(summary.locator('..')).toHaveAttribute('open', '');
  const scroller = page.locator('.blog-content > table').filter({ hasText: 'P5' }).first();
  await scroller.focus();
  await expect(scroller).toBeFocused();
  const before = await scroller.evaluate(node => node.scrollLeft);
  await scroller.press('ArrowRight');
  await expect.poll(() => scroller.evaluate(node => node.scrollLeft)).toBeGreaterThan(before);
  await page.goto(`${article}#fig-tiger-semantic-id-flow`);
  await page.reload();
  await expect(page.locator('#fig-tiger-semantic-id-flow')).toBeInViewport();
  await page.locator('.site-header .brand, .site-header .blog-brand').click();
  await page.goBack();
  await expect(page).toHaveURL(/#fig-tiger-semantic-id-flow$/);
  await expect(page.locator('#fig-tiger-semantic-id-flow')).toBeInViewport();
});

test('small blog lists one result per article and language switches to its translation', async ({ page }) => {
  await page.goto('blog/');
  const english = page.locator('[data-post-card]:visible');
  expect(await english.count()).toBe(3);
  await page.locator('#blogLangToggle').click();
  expect(await english.count()).toBe(3);
  await expect(page.locator('#blogSearch')).toHaveCount(0);
  await page.locator('[data-post-card]:visible').filter({ hasText: '写作系统' }).click();
  await expect(page).toHaveURL(/building-a-research-writing-system-zh/);
  await menu(page);
  await page.locator('#blogLangLink').click();
  await expect(page).toHaveURL(/building-a-research-writing-system\/$/);
});

test('no JavaScript keeps papers, writing, contact and wide tables usable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('.hero-actions a[href^="mailto:"]')).toBeVisible();
  await page.locator('.selected-work a[href*="tf-vpr"]').click();
  await expect(page.locator('h1')).toContainText('TF-VPR');
  await page.goto(new URL(article, baseURL).href);
  const table = page.locator('.blog-content > table').filter({ hasText: 'P5' }).first();
  await table.focus();
  await expect(table).toBeFocused();
  await table.press('ArrowRight');
  await expect.poll(() => table.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('resume printing retains identity and hides navigation; unknown route recovers', async ({ page }) => {
  await page.goto('resume/');
  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printCalled = 'yes'; }; });
  await page.locator('#printProfile').click();
  await expect(page.locator('html')).toHaveAttribute('data-print-called', 'yes');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.site-header')).not.toBeVisible();
  await expect(page.locator('.profile-email-address')).toBeVisible();
  await expect(page.locator('.profile-email-address')).toHaveText('c2675668@gmail.com');
  await expect(page.locator('.profile-actions a')).toHaveCSS('color', 'rgb(17, 17, 17)');
  await expect(page.locator('.profile-actions a')).toHaveCSS('border-top-width', '0px');
  await expect(page.locator('[data-profile-kind="skills"]')).toHaveCSS('break-inside', 'avoid');
  await expect(page.locator('#printProfile')).not.toBeVisible();
  await expect(page.locator('h1')).toContainText('Chenxu Wang');
  await page.emulateMedia({ media: 'screen' });
  expect((await page.goto('missing-qa-route/')).status()).toBe(404);
  await page.locator('a[href="/wcx12/"]').first().click();
  await expect(page.locator('h1')).toContainText('Chenxu Wang');
});

test('repository search, README rendering, failure and dialog focus', async ({ page }) => {
  await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({
    contentType: 'text/plain', body: '# Synthetic README\n\n**Rendered content**\n\n[Unsafe](javascript:alert(1))'
  }));
  await home(page);
  await page.locator('.command-row [data-view="projects"]').click();
  await page.locator('#repoSearch').fill('no-such-project-12345');
  await expect(page.locator('#repoGrid .repo-card')).toHaveCount(0);
  await expect(page.locator('#repoGrid')).not.toBeEmpty();
  await page.locator('#repoSearch').fill('major-intel');
  await expect(page.locator('#repoMapRetry')).not.toBeVisible();
  const trigger = page.locator('.repo-detail[data-repo="major-intel"]');
  await trigger.click();
  await expect(page.locator('#readmeDrawerBody').getByRole('heading', { name: 'Synthetic README' })).toBeVisible();
  await expect(page.locator('#readmeDrawerBody strong').filter({ hasText: 'Rendered content' })).toBeVisible();
  await expect(page.locator('#readmeDrawerBody a[href^="javascript:"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.unroute('https://raw.githubusercontent.com/**');
  await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await trigger.click();
  await expect(page.locator('#readmeDrawerBody')).toContainText(/unavailable|unable|could not/i);
  await expect(page.locator('#readmeDrawerLink')).toHaveAttribute('href', 'https://github.com/wcx12/major-intel');
  await page.keyboard.press('Escape');
});

test('research demos have visible outcomes and nonblank canvases under reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await home(page);
  await page.locator('.command-row [data-view="research"]').click();
  const canvas = page.locator('#interestCanvas');
  for (const interest of ['point-cloud-registration', 'vpr', 'medical-image-analysis', 'agent', 'ai4edu']) {
    await page.locator(`#interestRail [data-interest="${interest}"]`).click();
    await expect(page.locator('#interestDemoAction')).toBeEnabled();
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(() => canvas.evaluate(node => {
      const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
      return new Set(new Uint32Array(pixels.buffer)).size;
    })).toBeGreaterThan(20);
    const before = await page.locator('#interestCanvasStatus').textContent();
    await page.locator('#interestDemoAction').click();
    await expect(page.locator('#interestCanvasStatus')).not.toHaveText(before);
    if (interest === 'agent') {
      await page.locator('#interestDemoAction').click();
      await expect(page.locator('.research-demo-result')).toContainText('14:35');
    }
    if (interest === 'ai4edu') {
      await page.locator('[data-demo-hint]').click();
      await expect(page.locator('.research-demo-hint-text')).toBeVisible();
    }
    await page.locator('#interestDemoReset').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('copy code provides clipboard content and confirmation', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Clipboard permission automation is covered in Chromium only.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(article);
  await page.locator('.code-copy').first().click();
  await expect(page.locator('.code-copy').first()).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('用户历史');
});
