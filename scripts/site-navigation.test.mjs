import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { renderSiteHeader, navigationItems } from './site-navigation.mjs';

const read = file => fs.readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('all navigation variants have identical primary order, control order, and native menu structure', () => {
  for (const language of ['en', 'zh']) for (const homepage of [true, false]) for (const fixedLanguage of [true, false]) {
    const html = renderSiteHeader({ language, homepage, fixedLanguage, link: route => `/${route}`, languageControl: '<a id="testLanguage" href="/zh/">中文</a>' });
    const links = [...html.matchAll(/class="site-nav-link"[^>]*>([^<]+)<\/a>/g)].map(match => match[1]);
    assert.deepEqual(links, navigationItems.map(item => item[language]));
    assert.equal((html.match(/<nav /g) || []).length, 1);
    assert.match(html, /<details class="site-menu [^"]+" open>/);
    assert.match(html, /<summary class="site-menu-toggle /);
    assert.ok(html.indexOf('<select') < html.indexOf('id="testLanguage"'));
    assert.doesNotMatch(html, /undefined|openCommand|blogDraftStudioLink/);
    if (language === 'zh') assert.match(html, /href="\/blog\/index.html"/);
  }
});

test('the active page is a semantic attribute and never changes link text', () => {
  const html = renderSiteHeader({ link: route => route, languageControl: '', current: section => section === 'projects' ? ' aria-current="page"' : '' });
  assert.equal((html.match(/aria-current=/g) || []).length, 1);
  assert.match(html, /href="projects\/index.html" aria-current="page">Projects<\/a>/);
});

test('every generated surface loads the same navigation stylesheet after page styles', async () => {
  const files = ['index.html', 'zh/index.html', 'research/index.html', 'projects/index.html', 'publications/index.html', 'resume/index.html',
    'zh/research/index.html', 'zh/projects/index.html', 'zh/publications/index.html', 'zh/resume/index.html',
    'blog/index.html', 'blog/archive/index.html', 'blog/drafts/index.html', 'blog/posts/tiger-generative-retrieval-reading/index.html'];
  for (const file of files) {
    const html = await read(file);
    assert.equal((html.match(/<header class="[^"]*site-header"/g) || []).length, 1, file);
    const sheets = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match => match[1]);
    const navIndex = sheets.findIndex(sheet => /site-nav\.css\?v=[a-f0-9]{12}$/.test(sheet));
    assert.ok(navIndex >= 0, file);
    for (const [index, sheet] of sheets.entries()) {
      if (/(?:styles|content|blog)\.css\?/.test(sheet)) assert.ok(index < navIndex, file);
    }
    const header = html.match(/<header class="[^"]*site-header">[\s\S]*?<\/header>/)?.[0];
    assert.equal((header.match(/class="site-nav-link"/g) || []).length, 5, file);
    assert.doesNotMatch(header, /openCommand|blogDraftStudioLink/, file);
  }
});

test('homepage commands remain available outside the global navigation', async () => {
  const html = await read('index.html');
  assert.equal((html.match(/id="openCommand"/g) || []).length, 1);
  assert.match(html, /<nav class="command-row"[\s\S]*?id="openCommand"[\s\S]*?<\/nav>/);
});

test('both navigation controllers use the same responsive breakpoint and close on focus departure', async () => {
  for (const file of ['script.js', 'blog-src/assets/blog.js']) {
    const source = await read(file);
    assert.match(source, /matchMedia\('\(min-width: 1024px\)'\)/);
    assert.match(source, /addEventListener\('focusout'/);
  }
  const css = await read('site-nav.css');
  assert.match(css, /max-width: 1023px/);
  assert.match(css, /scrollbar-gutter: stable/);
  assert.match(css, /flex-direction: row/);
  assert.match(css, /flex-wrap: nowrap/);
  assert.match(css, /grid-template-columns: repeat\(5, 114px\) 156px 64px/);
  assert.match(css, /\[hidden\].*display: none !important/);
});

test('interactive view activation updates the corresponding global navigation item', async () => {
  const source = await read('script.js');
  const activation = source.slice(source.indexOf('function activateView('), source.indexOf('function activateView(') + 1000);
  assert.match(activation, /site-nav-link\[data-site-section\]/);
  assert.match(activation, /link\.dataset\.siteSection === resolvedViewId/);
  assert.match(activation, /setAttribute\('aria-current', 'location'\)/);
  assert.match(activation, /removeAttribute\('aria-current'\)/);
});
