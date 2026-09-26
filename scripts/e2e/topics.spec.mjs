import { test, expect } from '@playwright/test';

const topics = [
  ['vpr', 'vpr'], ['medical-image-analysis', 'medical-image'], ['agent', 'agent'], ['ai4edu', 'education']
];
async function explorer(page, path = './') {
  await page.goto(path);
  await page.locator('.command-row [data-view="research"]').click();
  await expect(page.locator('#interestDemoAction')).toBeEnabled();
}
async function selectTopic(page, id, type) {
  await page.locator(`#interestRail [data-interest="${id}"]`).click();
  const scene = page.locator(`.topic-experiences [data-topic="${type}"]`);
  await expect(scene.locator('canvas, svg, .tw-timeline').first()).toBeVisible();
  return scene;
}

test('distinct topic surfaces remain readable in three themes and four widths', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await explorer(page);
  for (const theme of ['neon', 'warm', 'mono']) {
    await page.locator('#themeSelect').selectOption(theme);
    for (const [id, type] of topics) {
      const scene = await selectTopic(page, id, type);
      await expect(page.locator('#interestCanvas')).toBeHidden();
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect.poll(() => scene.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      }
      const canvases = scene.locator('canvas');
      for (let i = 0; i < await canvases.count(); i++) {
        await expect.poll(() => canvases.nth(i).evaluate(node => {
          const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
          return new Set(new Uint32Array(pixels.buffer)).size;
        })).toBeGreaterThan(10);
      }
    }
  }
  expect(errors).toEqual([]);
});

test('topic selection keeps the document and workbench heights stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await explorer(page);
  const before = await page.locator('.research-workbench').boundingBox();
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (const [id, type] of topics) {
    await selectTopic(page, id, type);
    expect((await page.locator('.research-workbench').boundingBox()).height).toBe(before.height);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(height);
  }
});

test('a failed topic module can retry without blocking registration or evidence', async ({ page }) => {
  await page.route('**/topic-perception.js*', route => route.abort());
  await explorer(page);
  await page.locator('#interestRail [data-interest="vpr"]').click();
  const scene = page.locator('.topic-experiences [data-topic="vpr"]');
  await expect(scene).toContainText('could not load');
  await page.locator('#interestTabPapers').click();
  await expect(page.locator('#interestPapers')).toContainText('TF-VPR');
  await page.locator('#interestTabAnimation').click();
  await page.unroute('**/topic-perception.js*');
  await scene.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(scene.locator('canvas').first()).toBeVisible();
  await page.locator('#interestRail [data-interest="point-cloud-registration"]').click();
  await page.locator('#interestDemoAction').click();
  await expect(page.locator('#interestCanvasStatus')).toContainText('complete');
});

test('VPR distinguishes a lookalike from a same-place view and reveals landmark evidence', async ({ page }) => {
  await explorer(page);
  const scene = await selectTopic(page, 'vpr', 'vpr');
  await scene.locator('[data-control="choose-A"]').click();
  await expect(scene.locator('[data-result]')).toHaveAttribute('data-result', 'different');
  await scene.locator('[data-control="choose-B"]').focus();
  await page.keyboard.press('Enter');
  await expect(scene.locator('[data-result]')).toHaveAttribute('data-result', 'same');
  await expect(scene.locator('[data-street="comparison"]')).toBeVisible();
  await scene.locator('[data-control="landmark-clock"]').click();
  await expect(scene.locator('[data-control="landmark-clock"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#interestRail [data-interest="point-cloud-registration"]').click();
  await selectTopic(page, 'vpr', 'vpr');
  await expect(scene.locator('[data-result]')).toHaveAttribute('data-result', 'same');
  await scene.locator('[data-control="reset"]').click();
  await expect(scene.locator('[data-result]')).toHaveAttribute('data-result', 'pending');
});

test('annotation choices spend a finite budget, persist across topics and can be undone', async ({ page }) => {
  await explorer(page);
  const scene = await selectTopic(page, 'medical-image-analysis', 'medical-image');
  for (const id of ['S01', 'S02', 'S03']) {
    await scene.locator(`[data-control="sample-${id}"]`).click();
    await scene.locator('[data-control="label-single"]').focus();
    await page.keyboard.press('Enter');
    await expect(scene.locator('[data-annotation]')).toHaveAttribute('data-annotation', 'single');
    await expect(scene.locator('[data-control="undo"]')).toBeFocused();
  }
  await expect(scene.locator('[data-budget]')).toContainText('0 / 3');
  await scene.locator('[data-control="sample-S04"]').click();
  await expect(scene.locator('[data-control="label-single"]')).toBeDisabled();
  await page.locator('#interestRail [data-interest="vpr"]').click();
  await selectTopic(page, 'medical-image-analysis', 'medical-image');
  await expect(scene.locator('[data-budget]')).toContainText('0 / 3');
  await scene.locator('[data-control="sample-S03"]').click();
  await scene.locator('[data-control="undo"]').click();
  await expect(scene.locator('[data-budget]')).toContainText('1 / 3');
  await scene.locator('[data-control="reset"]').click();
  await expect(scene.locator('[data-budget]')).toContainText('3 / 3');
  await scene.locator('[data-control="sample-S01"]').click();
  await scene.locator('[data-control="query"]').click();
  await expect(scene.locator('[data-control="sample-S03"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(scene.locator('[data-budget]')).toContainText('3 / 3');
});

test('Agent shows a proposal without changing the calendar, then applies only an approved plan', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await explorer(page);
  const scene = await selectTopic(page, 'agent', 'agent');
  const saved = scene.locator('[data-lane="saved"] .tw-event');
  await expect(saved).toHaveCount(4);
  await expect(scene.locator('[data-action="approve"]')).toBeDisabled();
  await scene.locator('[type="submit"]').click();
  await expect(scene.locator('.topic-agent')).toHaveAttribute('data-status', 'pending');
  await expect(saved).toHaveCount(4);
  await expect(scene.locator('[data-lane="preview"] [data-state="pending"]')).toHaveCount(1);
  await scene.locator('[data-action="decline"]').click();
  await expect(saved).toHaveCount(4);
  await expect(scene.locator('[data-lane="preview"] .tw-event')).toHaveCount(0);
  await scene.locator('[type="submit"]').click();
  await scene.locator('[data-action="approve"]').focus();
  await page.keyboard.press('Enter');
  await expect(saved).toHaveCount(5);
  await expect(scene.locator('[data-lane="saved"] [data-kind="focus"]')).toContainText('13:00');
  await page.locator('#interestRail [data-interest="ai4edu"]').click();
  await selectTopic(page, 'agent', 'agent');
  await expect(saved).toHaveCount(5);
  await scene.locator('.tw-settings > summary').click();
  await scene.locator('[data-action="reset"]').click();
  await expect(saved).toHaveCount(4);
});

test('education gives state-dependent hints and a correct geometric outcome using the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await explorer(page);
  const scene = await selectTopic(page, 'ai4edu', 'education');
  await scene.locator('[data-action="hint"]').click();
  await expect(scene.locator('[data-action="hint"]')).toHaveAttribute('aria-expanded', 'true');
  await scene.locator('[data-field="width"]').focus();
  await page.keyboard.press('ArrowRight');
  await scene.locator('[data-field="height"]').focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  await expect(scene.locator('.topic-education')).toHaveAttribute('data-solved', 'true');
  await expect(scene.locator('[data-measure="area"] [data-value]')).toHaveText('24');
  await expect(scene.locator('[data-measure="perimeter"] [data-value]')).toHaveText('20');
  await page.locator('#interestRail [data-interest="agent"]').click();
  await selectTopic(page, 'ai4edu', 'education');
  await expect(scene.locator('.topic-education')).toHaveAttribute('data-solved', 'true');
  await scene.locator('[data-action="reset"]').click();
  await expect(scene.locator('.topic-education')).toHaveAttribute('data-solved', 'false');
  const handle = scene.locator('[data-handle]');
  await handle.scrollIntoViewIfNeeded();
  const start = await handle.boundingBox();
  const target = await handle.evaluate(element => {
    const svg = element.ownerSVGElement;
    const point = svg.createSVGPoint();
    point.x = 28 + 4 * 26;
    point.y = 12 + 6 * 26;
    const screen = point.matrixTransform(svg.getScreenCTM());
    return { x: screen.x, y: screen.y };
  });
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 8 });
  await page.mouse.up();
  await expect(scene.locator('.topic-education')).toHaveAttribute('data-solved', 'true');
  await expect(scene.locator('[data-measure="area"] [data-value]')).toHaveText('24');
});
