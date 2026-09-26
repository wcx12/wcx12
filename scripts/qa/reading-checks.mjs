import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const base = process.argv[2] || 'http://127.0.0.1:4283/wcx12/';
const output = path.resolve('output/site-quality-20260926/final/reading');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const report = { date: new Date().toISOString(), base, engine: browser.version(), checks: [], contrast: [] };
const routes = ['', 'zh/', 'publications/tf-vpr/', 'blog/posts/tiger-generative-retrieval-reading/', 'resume/'];
try {
  for (const [scenario, width, height, fontSize] of [['text-200', 1280, 900, '200%'], ['reflow-320', 320, 800, '100%'], ['landscape', 844, 390, '100%']]) {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
      await page.evaluate(size => { document.documentElement.style.fontSize = size; }, fontSize);
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, heading: document.querySelector('h1').getBoundingClientRect().toJSON() }));
      const name = `${scenario}-${route.replaceAll('/', '-') || 'home'}`;
      report.checks.push({ name, route, ...dimensions, passed: dimensions.width <= width });
      await page.screenshot({ path: path.join(output, `${name}.png`) });
      await page.close();
    }
  }
  for (const theme of ['neon', 'warm', 'mono']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await page.addInitScript(value => localStorage.setItem('wcx12-theme', value), theme);
    for (const route of ['', 'publications/tf-vpr/', 'blog/posts/tiger-generative-retrieval-reading/']) {
      await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
      const values = await page.evaluate(() => {
        const rgba = value => (value.match(/[\d.]+/g) || []).map(Number);
        const over = (top, bottom) => { const alpha = top[3] ?? 1; return top.slice(0, 3).map((v, i) => v * alpha + bottom[i] * (1 - alpha)); };
        const luminance = rgb => rgb.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
        const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
        return [...document.querySelectorAll('h1, .hero-subtitle, .hero-lead, .selected-work p, .selected-work a, .site-navigation a, .blog-content > p, .blog-hero p, .btn-primary')].filter(node => node.getBoundingClientRect().height > 0).slice(0, 35).map(node => {
          const chain = []; for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) chain.unshift(ancestor);
          let background = [255, 255, 255]; let image = false;
          for (const ancestor of chain) { const style = getComputedStyle(ancestor); background = over(rgba(style.backgroundColor), background); image ||= style.backgroundImage !== 'none'; }
          const style = getComputedStyle(node);
          const threshold = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5;
          const contrast = ratio(over(rgba(style.color), background), background);
          return { text: node.textContent.trim().slice(0, 80), color: style.color, background, contrast, threshold, measured: !image, passed: !image ? contrast >= threshold : null };
        });
      });
      report.contrast.push({ route, theme, values });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(output, `home-${theme}-390.png`) });
    await page.close();
  }
  const recovery = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await recovery.route('**/research-canvas.js?*', route => route.abort());
  await recovery.goto(base);
  await recovery.locator('.command-row [data-view="research"]').click();
  await recovery.locator('#interestFeatureRetry').waitFor({ state: 'visible' });
  await recovery.waitForLoadState('networkidle');
  await recovery.unroute('**/research-canvas.js?*');
  await recovery.locator('#interestFeatureRetry').click();
  await recovery.locator('#interestDemoAction:not([disabled])').waitFor({ state: 'visible' });
  report.optionalModuleRecovery = true;
  await recovery.goto(new URL('blog/posts/tiger-generative-retrieval-reading/#fig-tiger-semantic-id-flow', base).href);
  await recovery.waitForFunction(() => document.getElementById('fig-tiger-semantic-id-flow').getBoundingClientRect().top < innerHeight);
  report.anchor = await recovery.evaluate(() => ({ top: document.getElementById('fig-tiger-semantic-id-flow').getBoundingClientRect().top, headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom }));
  await recovery.screenshot({ path: path.join(output, 'article-figure-anchor.png') });
  await recovery.close();
  const print = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
  await print.goto(new URL('resume/', base).href, { waitUntil: 'networkidle' });
  await print.emulateMedia({ media: 'print' });
  await print.screenshot({ path: path.join(output, 'resume-print.png'), fullPage: true });
  await print.pdf({ path: path.join(output, 'resume-print.pdf'), format: 'A4', printBackground: false });
  await print.close();
} catch (error) {
  report.runtimeError = error.stack;
  process.exitCode = 1;
} finally { await browser.close(); }
report.notes = ['text-200 increases the root font size to 200%; it is not an OS text-scaling test.', '320 CSS px exercises reflow equivalent to a 1280px layout at 400% zoom; physical browser zoom and real mobile devices are not tested.', 'Contrast composites computed foreground and ancestor solid backgrounds. Image backgrounds are explicitly unmeasured; diagrams, focus and all state combinations need separate inspection.'];
await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ runtimeError: report.runtimeError, layoutFailures: report.checks.filter(row => !row.passed), contrastFailures: report.contrast.flatMap(row => row.values.filter(value => value.passed === false).map(value => ({ route: row.route, theme: row.theme, ...value }))), output }, null, 2));
if (report.checks.some(row => !row.passed) || report.contrast.some(row => row.values.some(value => value.passed === false))) process.exitCode = 1;
