import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const phase = process.argv[2] || 'baseline';
const base = process.argv[3] || 'http://127.0.0.1:4282/wcx12/';
if (!/^[a-z0-9-]+$/.test(phase)) throw new Error('Invalid phase');
const output = path.resolve('output/site-quality-20260926', phase, 'browser');
await fs.mkdir(output, { recursive: true });
const routes = ['', 'zh/', 'research/', 'research/vpr/', 'projects/', 'publications/', 'publications/tf-vpr/', 'blog/', 'blog/posts/tiger-generative-retrieval-reading/', 'resume/', 'blog/drafts/', 'not-a-page/'];
const report = { date: new Date().toISOString(), base, phase, node: process.version, checks: [] };
const browser = await chromium.launch();
report.chromium = browser.version();
async function inspect(route, width, theme = 'neon', options = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 1000 }, reducedMotion: 'reduce', ...options });
  await context.addInitScript(value => { try { localStorage.setItem('wcx12-theme', value); } catch {} }, theme);
  const page = await context.newPage();
  const errors = [], failures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400 && !response.url().includes('not-a-page')) failures.push({ url: response.url(), status: response.status() }); });
  const name = `${route.replaceAll('/', '-') || 'home'}-${width}-${theme}${options.javaScriptEnabled === false ? '-nojs' : ''}`;
  const check = { name, route, width, theme, errors, failures };
  try {
    check.status = (await page.goto(new URL(route, base).href, { waitUntil: 'networkidle', timeout: 30000 })).status();
    await page.waitForTimeout(350);
    check.layout = await page.evaluate(() => ({
      pageWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
      lang: document.documentElement.lang, title: document.title,
      overflows: [...document.querySelectorAll('body *')].filter(element => {
        const box = element.getBoundingClientRect();
        return box.width && (box.right > innerWidth + 1 || box.left < -1) && getComputedStyle(element).position !== 'fixed'
          && !element.closest('.katex-html, [hidden]');
      }).slice(0, 15).map(element => ({ tag: element.tagName, id: element.id, class: element.className?.baseVal ?? element.className, text: element.textContent.slice(0, 80) })),
      h1: [...document.querySelectorAll('h1')].map(element => element.textContent),
      links: [...document.querySelectorAll('header a')].map(element => ({ text: element.textContent.trim(), href: element.getAttribute('href') }))
    }));
    if (options.javaScriptEnabled !== false) {
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      check.violations = axe.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
      check.incomplete = axe.incomplete.map(({ id, nodes }) => ({ id, count: nodes.length }));
    }
    await page.screenshot({ path: path.join(output, `${name}.png`), animations: 'disabled' });
    if (route.includes('tiger-generative')) {
      for (const [part, position] of [['middle', 0.4], ['bottom', 1]]) {
        await page.evaluate(value => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * value), position);
        await page.screenshot({ path: path.join(output, `${name}-${part}.png`), animations: 'disabled' });
      }
    }
  } catch (error) { check.error = error.message; }
  report.checks.push(check);
  await context.close();
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(name, check.error || `HTTP ${check.status}; overflow ${check.layout.scrollWidth - check.layout.pageWidth}; axe ${check.violations?.length ?? 'not run'}; errors ${errors.length}`);
}
try {
  for (const route of routes) for (const width of [1440, 390]) await inspect(route, width);
  for (const width of [320, 360, 768, 1024, 1920]) for (const route of ['', 'blog/posts/tiger-generative-retrieval-reading/']) await inspect(route, width);
  for (const theme of ['warm', 'mono']) for (const route of ['', 'publications/tf-vpr/', 'blog/posts/tiger-generative-retrieval-reading/']) await inspect(route, 390, theme);
  for (const route of ['', 'research/', 'publications/tf-vpr/', 'blog/posts/tiger-generative-retrieval-reading/', 'resume/']) await inspect(route, 390, 'mono', { javaScriptEnabled: false });
} finally { await browser.close(); }
report.engines = [];
for (const [name, engine] of Object.entries({ firefox, webkit })) {
  let instance;
  try {
    instance = await engine.launch();
    const page = await instance.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    for (const route of ['', 'publications/tf-vpr/', 'blog/posts/tiger-generative-retrieval-reading/']) {
      await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      await page.screenshot({ path: path.join(output, `${name}-${route.replaceAll('/', '-') || 'home'}.png`) });
      report.engines.push({ name, version: instance.version(), route, overflow });
    }
  } catch (error) { report.engines.push({ name, error: error.message }); }
  finally { await instance?.close(); }
}
await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
