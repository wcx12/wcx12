import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// The scanner uses canonical public records; optional ORCID enrichment is tested
// separately with rate-limit and storage-failure fixtures in site.spec.mjs.
test.beforeEach(async ({page}) => {
 await page.route('https://pub.orcid.org/**', route=>route.fulfill({headers:{'access-control-allow-origin':'*'},json:{group:[]}}));
});
test('scanner, simplified entry and legacy routes stay usable',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const prefix of ['','zh/']){
 await page.goto(prefix||'./');await expect(page.locator('.scanner-stage')).toBeVisible();
 await expect(page.locator('#researchLab')).not.toHaveAttribute('open','');
 await expect(page.locator('.hero-preview-panel')).not.toBeVisible();
 for(const label of ['TF-VPR','major-intel','TIGER']){
 await page.locator('.scanner-tabs button').filter({hasText:label}).click();
 await expect(page.locator('.scanner-code pre')).toContainText(label);
 await page.locator('.scanner-controls input').fill('100');
 await expect(page.locator('.scanner-stage')).toHaveCSS('--cut','100%');
 await page.locator('.scanner-controls input').press('Home');
 await expect(page.locator('.scanner-stage')).toHaveCSS('--cut','0%');
 }
 for(const theme of ['neon','warm','mono']){
 await page.locator('#themeSelect').selectOption(theme);
 for(const width of [390,1440]){
 await page.setViewportSize({width,height:1000});
 await page.locator('#researchScanner').scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath(`${prefix?'zh':'en'}-${theme}-${width}.png`)});
 }
 }
 await page.locator('.scanner-link').click();await expect(page).toHaveURL(/research\/generative-retrieval\/$/);
 await page.goto(prefix+'#research/agent');await expect(page.locator('#researchLab')).toHaveAttribute('open','');
 await expect(page.locator('#interestTitle')).toContainText('Agent');
 await page.waitForLoadState('networkidle');
 }
 expect(errors).toEqual([]);
});

test('structured records remain keyboard-readable and scanner accessibility checks pass',async({page})=>{
 await page.goto('zh/');
 await page.locator('.scanner-tabs button').filter({hasText:'major-intel'}).click();
 await page.locator('.scanner-controls input').fill('100');
 const code=page.locator('.scanner-code pre');await code.focus();await expect(code).toBeFocused();
 await code.press('Control+End');
 await expect(code).toContainText('private');
 await expect.poll(()=>code.evaluate(e=>e.scrollTop+e.clientHeight>=e.scrollHeight-2)).toBe(true);
 await page.locator('.scanner-controls input').fill('0');
 await expect(code).toHaveAttribute('tabindex','-1');
 await page.locator('.scanner-controls input').fill('40');
 await code.focus();await expect(page.locator('.scanner-controls input')).toHaveValue('100');
 for(const theme of ['neon','warm','mono']){
 await page.locator('#themeSelect').selectOption(theme);
 const result=await new AxeBuilder({page}).include('#researchScanner').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(result.violations).toEqual([]);
 }
});

test('scanner plays only on request and stops for reduced motion', async ({page}, info) => {
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('zh/');
 const stage=page.locator('.scanner-stage'), range=page.locator('.scanner-controls input');
 await expect(stage).toBeVisible();
 await page.locator('#researchScanner').screenshot({path:info.outputPath('comparison-initial.png')});
 const before=await range.inputValue();
 await page.waitForTimeout(300);
 expect(await range.inputValue()).toBe(before);
 await page.locator('.scanner-play').click();
 await expect.poll(()=>range.inputValue()).not.toBe(before);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.scanner-play')).toHaveAttribute('aria-pressed','false');
 const paused=await range.inputValue();await page.waitForTimeout(200);
 expect(await range.inputValue()).toBe(paused);
 const box=await stage.boundingBox();
 await page.mouse.move(box.x+box.width*.8,box.y+box.height*.5);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.2,box.y+box.height*.5,{steps:5});await page.mouse.up();
 expect(Number(await range.inputValue())).toBeLessThan(25);
 expect(await stage.locator('canvas').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0))).toBe(true);
});
