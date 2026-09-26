import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const [base = 'http://127.0.0.1:4286/wcx12/', phase = 'final'] = process.argv.slice(2);
const folder = `output/playwright/topics/${phase}`;
await fs.mkdir(folder, { recursive: true });
const report = { time: new Date().toISOString(), base, states: [], errors: [], failedRequests: [] };
const browser = await chromium.launch();
const topics = [['vpr', 'vpr'], ['medical-image-analysis', 'medical-image'], ['agent', 'agent'], ['ai4edu', 'education']];
try {
  for (const language of ['en', 'zh']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    await page.goto(language === 'zh' ? new URL('zh/', base).href : base);
    await page.locator('.command-row [data-view="research"]').click();
    await expect(page.locator('#interestDemoAction')).toBeEnabled();
    for (const theme of ['neon', 'warm', 'mono']) {
      const menu = page.locator('.site-menu-toggle');
      if (await menu.isVisible() && !(await page.locator('.site-menu').getAttribute('open'))) await menu.click();
      await page.locator('#themeSelect').selectOption(theme);
      if (await menu.isVisible()) await page.keyboard.press('Escape');
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const [id, type] of topics) {
          await page.locator(`#interestRail [data-interest="${id}"]`).click();
          const scene = page.locator(`.topic-experiences [data-topic="${type}"]`);
          await expect(scene.locator('canvas, svg, .tw-timeline').first()).toBeVisible();
          const name = `${language}-${theme}-${id}-${width}`;
          await page.locator('.interest-detail').screenshot({ path: `${folder}/${name}.png` });
          const measurements = await page.evaluate(() => {
            const scroller = document.querySelector('.topic-experiences');
            return { pageOverflow: document.documentElement.scrollWidth > innerWidth,
              innerOverflow: scroller.scrollWidth > scroller.clientWidth + 1,
              viewport: scroller.clientHeight, content: scroller.scrollHeight };
          });
          const axe = await new AxeBuilder({ page }).include('.interest-detail')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
          report.states.push({ name, ...measurements, violations: axe.violations, incomplete: axe.incomplete.map(item => item.id) });
          if (language === 'zh' && theme === 'mono') {
            if (id === 'vpr') await scene.locator('[data-control="choose-B"]').click();
            if (id === 'medical-image-analysis') {
              if (await scene.locator('[data-control="label-lobed"]').isDisabled()) await scene.locator('[data-control="undo"]').click();
              await scene.locator('[data-control="label-lobed"]').click();
            }
            if (id === 'agent') await scene.locator('[type="submit"]').click();
            if (id === 'ai4edu') {
              await scene.locator('[data-field="width"]').focus();
              await page.keyboard.press('Home');
              for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
              await scene.locator('[data-field="height"]').focus();
              await page.keyboard.press('Home');
              for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
              await expect(scene.locator('.topic-education')).toHaveAttribute('data-solved', 'true');
            }
            await page.locator('.interest-detail').screenshot({ path: `${folder}/${name}-outcome.png` });
          }
        }
      }
    }
    await context.close();
  }
} catch (error) { report.errors.push(error.message); }
finally { await browser.close(); }
await fs.writeFile(`${folder}/audit.json`, JSON.stringify(report, null, 2));
const issues = report.states.filter(item => item.pageOverflow || item.innerOverflow || item.violations.length);
console.log(JSON.stringify({ states: report.states.length, issues: issues.map(item => ({name:item.name,overflow:item.pageOverflow||item.innerOverflow,violations:item.violations.map(v=>v.id)})), errors: report.errors, failedRequests: report.failedRequests }, null, 2));
if (issues.length || report.errors.length || report.failedRequests.length) process.exitCode = 1;
