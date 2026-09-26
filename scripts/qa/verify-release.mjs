import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium, expect } from '@playwright/test';

const base = new URL(process.argv[2] || 'https://wcx12.github.io/wcx12/');
const phase = process.argv[3] || 'online';
assert.match(phase, /^[a-z0-9-]+$/);
const output = path.resolve('output/site-quality-20260926', phase);
await fs.mkdir(output, { recursive: true });
const artifact = path.resolve('output/pages');
const hash = value => createHash('sha256').update(value).digest('hex');
const normalized = value => value.replace(/\r\n?/g, '\n');
const report = { at: new Date().toISOString(), base: base.href,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  files: [], pages: [], errors: [] };
const routes = ['', 'zh/', 'research/vpr/', 'publications/tf-vpr/',
  'blog/posts/tiger-generative-retrieval-reading/', 'resume/'];
const browser = await chromium.launch();
report.engine = browser.version();
try {
  const home = await fs.readFile(path.join(artifact, 'index.html'), 'utf8');
  report.expectedFingerprint = home.match(/[?&]v=([a-f0-9]+)/)?.[1];
  assert.ok(report.expectedFingerprint);
  const resources = ['site-tokens.css', 'styles.css', 'site-nav.css', 'homepage-bootstrap.js',
    'script.js', 'site-data.js', 'blog/assets/blog.js', 'blog/assets/blog.css', '404.html'];
  for (const file of [...routes.map(route => `${route}index.html`), ...resources]) {
    const url = new URL(file, base);
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
    const actual = await response.text();
    const expected = await fs.readFile(path.join(artifact, file), 'utf8');
    const row = { file, status: response.status, actualHash: hash(actual), expectedHash: hash(expected),
      byteMatch: actual === expected, normalizedMatch: normalized(actual) === normalized(expected) };
    report.files.push(row);
    assert.equal(response.status, 200, file);
    assert.ok(row.normalizedMatch, `Hosted content differs: ${file}`);
  }
  for (const route of [...routes, 'missing-release-check/']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const row = { route, consoleErrors: [], pageErrors: [], requests: [] };
    report.pages.push(row);
    page.on('pageerror', error => row.pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') row.consoleErrors.push(message.text()); });
    page.on('requestfailed', request => row.requests.push({ url: request.url(), failed: request.failure()?.errorText }));
    page.on('response', response => { if (response.status() >= 400) row.requests.push({ url: response.url(), status: response.status() }); });
    const response = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle', timeout: 45000 });
    row.status = response.status();
    assert.equal(row.status, route === 'missing-release-check/' ? 404 : 200);
    await expect(page.locator('h1')).toBeVisible();
    if (!route) {
      await expect(page.locator('#openCommand')).toBeVisible();
      await expect(page.locator('.selected-work a[href*="publications/tf-vpr"]')).toBeVisible();
    }
    if (route.includes('tiger-generative')) await expect(page.locator('.katex').first()).toBeVisible();
    if (route === 'missing-release-check/') {
      await page.locator('a[href="/wcx12/"]').first().click();
      await expect(page.locator('#openCommand')).toBeVisible();
    }
    row.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(row.overflow, false, route);
    await page.screenshot({ path: path.join(output, `${route.replaceAll('/', '-') || 'home'}-390.png`) });
    if (!route) {
      await page.locator('.site-menu-toggle').click();
      await page.locator('#themeSelect').selectOption('mono');
      await page.locator('[data-site-section="research"]').click();
      await expect(page.locator('h1')).toHaveText('Research');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
      await page.locator('.site-menu-toggle').click();
      await page.locator('#blogLangLink').click();
      await expect(page).toHaveURL(/\/zh\/research\/$/);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
      row.mobilePathPassed = true;
    }
    assert.deepEqual(row.pageErrors, [], route);
    const internalFailures = row.requests.filter(request => new URL(request.url).origin === base.origin
      && !new URL(request.url).pathname.endsWith('/missing-release-check/'));
    assert.deepEqual(internalFailures, [], route);
    row.unexpectedConsoleErrors = row.consoleErrors.filter(message =>
      !(route === 'missing-release-check/' && message.includes('404')));
    assert.deepEqual(row.unexpectedConsoleErrors, [], route);
    await context.close();
  }
} catch (error) {
  report.errors.push(error.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
  report.finished = new Date().toISOString();
  await fs.writeFile(path.join(output, 'release-verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
