import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { expect } from '@playwright/test';

const [phase = 'before', base = 'https://wcx12.github.io/wcx12/'] = process.argv.slice(2);
const folder = `output/playwright/topics/${phase}`;
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(base);
  await page.locator('.command-row [data-view="research"]').click();
  await expect(page.locator('#interestDemoAction')).toBeEnabled({ timeout: 45000 });
  await page.locator('#themeSelect').selectOption('mono');
  for (const topic of ['point-cloud-registration', 'vpr', 'medical-image-analysis', 'agent', 'ai4edu']) {
    await page.locator(`#interestRail [data-interest="${topic}"]`).click();
    if (phase !== 'before' && topic !== 'point-cloud-registration') {
      await expect(page.locator('.topic-experiences section[data-topic]:visible button').first()).toBeVisible();
      await expect(page.locator('.topic-experiences section[data-topic]:visible > p')).toHaveCount(0);
    }
    await page.locator('.interest-detail').scrollIntoViewIfNeeded();
    await page.locator('.research-workbench').screenshot({ path: `${folder}/${topic}-1440.png` });
  }
  await fs.writeFile(`${folder}/review.json`, JSON.stringify({ url: base, time: new Date().toISOString(), errors }, null, 2));
} finally {
  await browser.close();
}
if (errors.length) process.exitCode = 1;
