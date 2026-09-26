import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import matter from 'gray-matter';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const slash = value => value.replaceAll('\\', '/');
const hash = value => createHash('sha256').update(value).digest('hex');
const { values: args } = parseArgs({ options: {
  root: { type: 'string', default: 'output/pages' }, prefix: { type: 'string', default: '/wcx12/' },
  origin: { type: 'string', default: 'https://wcx12.github.io' },
  baseline: { type: 'string', default: 'output/site-quality-20260926/baseline/inventory.json' },
  report: { type: 'string', default: 'output/site-quality-20260926/fragment-check.json' },
  'no-baseline': { type: 'boolean' }, help: { type: 'boolean' }
} });
const inside = (base, file) => {
  const relative = path.relative(base, file);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};
async function read(base, relative) {
  const target = path.resolve(base, relative);
  if (!inside(base, target) || !inside(repo, target)) throw Error(`Out-of-scope read: ${relative}`);
  let current = repo;
  for (const part of path.relative(repo, target).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if ((await fs.lstat(current)).isSymbolicLink()) throw Error(`Refusing symlink: ${relative}`);
  }
  return fs.readFile(target, 'utf8');
}
async function inventory(root, directory = root, files = new Set()) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name), relative = slash(path.relative(root, file));
    if (entry.isSymbolicLink()) throw Error(`Artifact symlink: ${relative}`);
    if (relative.startsWith('blog/drafts/') && relative !== 'blog/drafts/index.html') throw Error('Unexpected draft artifact; not inspected');
    if (entry.isDirectory()) await inventory(root, file, files);
    else if (entry.isFile()) files.add(relative);
  }
  return files;
}
async function parseDocuments(items) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ offline: true, serviceWorkers: 'block' });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    // Only inert, detached documents: no navigation, site scripts, or resource loading.
    const records = await page.evaluate(items => {
      const shape = node => node.nodeType === 1
        ? [node.namespaceURI, node.localName, [...node.attributes].filter(a => a.name !== 'tabindex')
          .map(a => [a.name, a.value]).sort(), [...node.childNodes].map(shape)]
        : [node.nodeType, node.nodeValue];
      const selector = node => {
        const parts = [];
        for (let el = node; el; el = el.parentElement) {
          const siblings = [...(el.parentElement?.children || [el])].filter(s => s.tagName === el.tagName);
          parts.unshift(`${CSS.escape(el.localName)}:nth-of-type(${siblings.indexOf(el) + 1})`);
        }
        return parts.join(' > ');
      };
      return items.map(item => {
        const doc = new DOMParser().parseFromString(item.content, item.svg ? 'image/svg+xml' : 'text/html');
        if (item.svg && doc.querySelector('parsererror')) throw Error(`Invalid SVG: ${item.path}`);
        const body = doc.querySelector('.blog-content');
        return { path: item.path, svg: item.svg, base: doc.querySelector('base[href]')?.getAttribute('href'),
          canonical: doc.querySelector('link[rel~="canonical"]')?.getAttribute('href') || '',
          anchors: [...doc.querySelectorAll('[id], a[name]')].flatMap(el => [el.id, el.localName === 'a' && el.getAttribute('name')]).filter(Boolean),
          body: body ? JSON.stringify(shape(body)) : null,
          refs: [...doc.querySelectorAll('*')].filter(el => el.localName !== 'base').flatMap(el =>
            [...el.attributes].filter(a => a.localName === 'href').map(a => ({ selector: selector(el), attribute: a.name, url: a.value }))) };
      });
    }, items);
    return new Map(records.map(({ body, ...record }) => [record.path, { ...record, bodyHash: body ? hash(body) : null }]));
  } finally { await browser.close(); }
}
const homepages = ['index.html', 'zh/index.html'];
const views = ['about', 'research', 'projects', 'publications', 'writing', 'profile', 'timeline', 'skills', 'resources', 'contact'];
function homepageRoute(target, fragment, topics) {
  const parts = fragment.replace(/^\//, '').split('/');
  return homepages.includes(target) && (parts.length === 1 ? views.includes(parts[0])
    : parts[0] === 'research' && topics.has(parts[1]) && (parts.length === 2 || (parts.length === 3 && parts[2] === 'demo')));
}
function check(record, ref, base, files, docs, topics) {
  const result = { source: record.path, ...ref };
  const finish = (status, kind) => ({ ...result, status, kind });
  let url;
  try {
    const documentUrl = new URL(record.path, base);
    url = new URL(ref.url, record.base === undefined ? documentUrl : new URL(record.base, documentUrl));
  } catch { return finish('broken', 'invalid-url'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base.origin) return finish('skipped', 'external-or-non-http');
  if (!url.pathname.startsWith(base.pathname) && url.pathname !== base.pathname.slice(0, -1))
    return finish(/^(?:https?:)?\/\//i.test(ref.url) ? 'skipped' : 'broken', 'outside-project-prefix');
  result.resolved = url.href;
  let target;
  try { target = decodeURIComponent(url.pathname.slice(base.pathname.length)) || 'index.html'; }
  catch { return finish('broken', 'invalid-path-encoding'); }
  if (target.endsWith('/')) target += 'index.html';
  else if (!files.has(target) && files.has(`${target}/index.html`)) target += '/index.html';
  result.target = target;
  if (!files.has(target)) return finish('broken', 'missing-target');
  if (!url.hash) return finish('ok', 'target');
  let fragment = url.hash.slice(1).split(':~:')[0];
  try { fragment = decodeURIComponent(fragment); } catch { /* Literal malformed escapes can be IDs. */ }
  result.fragment = fragment;
  const doc = docs.get(target);
  if (!fragment) return finish('unchecked', 'text-fragment');
  if (doc?.anchors.includes(fragment)) return finish('ok', 'anchor');
  if (doc && !doc.svg && fragment.toLowerCase() === 'top') return finish('ok', 'document-top');
  if (homepageRoute(target, fragment, topics)) return finish('ok', 'homepage-route');
  if (doc?.svg && /^svgView\(.+\)$/.test(fragment)) return finish('unchecked', 'svg-view');
  return finish(doc ? 'broken' : 'unchecked', doc ? 'missing-fragment' : 'non-html-svg-fragment');
}
async function main() {
  if (args.help) return console.log('node scripts/qa/check-links.mjs [--root output/pages] [--prefix /wcx12/] [--origin https://wcx12.github.io]\n  [--baseline output/site-quality-20260926/baseline/inventory.json] [--no-baseline]\n  [--report output/site-quality-20260926/fragment-check.json]\nUses installed @playwright/test Chromium only as DOMParser, offline. No build or site script execution.');
  if (!/^\/(?:[^?#\\]+\/)?$/.test(args.prefix) || args.prefix.includes('..')) throw Error('Prefix must be an absolute URL directory ending in /');
  const output = path.join(repo, 'output'), root = path.resolve(repo, args.root), reportFile = path.resolve(repo, args.report);
  if (!inside(output, root) || !inside(output, reportFile) || inside(root, reportFile)) throw Error('Use output/ paths; report must be outside artifact');
  const base = new URL(args.prefix, args.origin);
  if (!['http:', 'https:'].includes(base.protocol)) throw Error('Origin must use HTTP(S)');
  const config = JSON.parse(await read(root, 'research-config.json'));
  const topics = new Set(config.interests.flatMap(group => group.children || []).map(child => child.id));
  const files = await inventory(root), items = [], errors = [];
  for (const file of [...files].sort()) {
    if (/\.(html|svg)$/.test(file)) items.push({ path: file, svg: file.endsWith('.svg'), content: await read(root, file) });
  }
  let baseline, baselineFile;
  if (!args['no-baseline']) {
    baselineFile = path.resolve(repo, args.baseline);
    if (!inside(output, baselineFile)) throw Error('Baseline must be inside output/');
    baseline = JSON.parse(await read(output, path.relative(output, baselineFile)));
    for (const article of baseline.articles) {
      if (!/^[a-z0-9-]+$/.test(article.slug)) throw Error('Invalid baseline public slug');
      const route = `blog/posts/${article.slug}/index.html`;
      try { items.push({ path: `baseline:${route}`, content: await read(path.join(path.dirname(baselineFile), 'artifact'), route) }); }
      catch (error) { errors.push({ source: route, kind: 'baseline-unavailable', detail: error.message }); }
    }
  }
  const all = await parseDocuments(items), docs = new Map([...all].filter(([key]) => !key.startsWith('baseline:')));
  const checks = [...docs.values()].flatMap(doc => doc.refs.map(ref => check(doc, ref, base, files, docs, topics)));
  const htmlRoutes = [...docs.values()].filter(doc => !doc.svg).map(doc => doc.path);
  let preservation = null;
  if (baseline) {
    const oldRoutes = new Set(baseline.pages.map(page => page.path));
    const missingRoutes = [...oldRoutes].filter(route => !files.has(route));
    const addedRoutes = htmlRoutes.filter(route => !oldRoutes.has(route));
    const changedCanonicals = baseline.pages.filter(page => files.has(page.path) && (page.canonical || '') !== docs.get(page.path)?.canonical)
      .map(page => ({ route: page.path, before: page.canonical || '', after: docs.get(page.path)?.canonical }));
    const articles = [];
    for (const article of baseline.articles) {
      const route = `blog/posts/${article.slug}/index.html`, entry = { source: article.source, route, expectedSourceBodyHash: article.bodyHash };
      try {
        if (!files.has(route) || !/^content\/posts\/[^/]+\/index\.md$/.test(article.source)) throw Error('Not an explicitly listed public source');
        const parsed = matter(await read(repo, article.source));
        entry.sourceBodyHash = hash(parsed.content);
        entry.sourceBodyUnchanged = entry.sourceBodyHash === article.bodyHash;
        entry.metadataUnchanged = ['title', 'lang'].every(key => parsed.data[key] === article[key]) && (!parsed.data.slug || parsed.data.slug === article.slug);
        entry.baselineRenderedBodyHash = all.get(`baseline:${route}`)?.bodyHash || null;
        entry.renderedBodyHash = docs.get(route)?.bodyHash || null;
        entry.renderedBodyUnchanged = Boolean(entry.renderedBodyHash) && entry.renderedBodyHash === entry.baselineRenderedBodyHash;
        entry.ok = entry.sourceBodyUnchanged && entry.metadataUnchanged && entry.renderedBodyUnchanged;
      } catch (error) { entry.ok = false; entry.error = error.message; }
      articles.push(entry);
    }
    preservation = { baseline: slash(path.relative(repo, baselineFile)), commit: baseline.commit, missingRoutes, addedRoutes, changedCanonicals, articles,
      ok: !missingRoutes.length && !changedCanonicals.length && articles.every(article => article.ok) };
  }
  const broken = checks.filter(item => item.status === 'broken');
  const report = { checkedAt: new Date().toISOString(), parser: '@playwright/test Chromium DOMParser (offline)',
    artifact: slash(path.relative(repo, root)), baseUrl: base.href, ok: !broken.length && !errors.length && preservation?.ok !== false,
    coverage: { html: htmlRoutes.length, svg: docs.size - htmlRoutes.length, hrefs: checks.length,
      anchors: checks.filter(item => item.kind === 'anchor').length, dynamicRoutes: checks.filter(item => item.kind === 'homepage-route').length },
    htmlRoutes, errors, broken, acceptedDynamicRoutes: checks.filter(item => item.kind === 'homepage-route'),
    unchecked: checks.filter(item => item.status === 'unchecked'), skipped: checks.filter(item => item.status === 'skipped'),
    dynamicRoutePolicy: { homepages, views, topics: [...topics], forms: ['#view', '#research/topic', '#research/topic/demo', 'optional leading /'] },
    contentPreservation: preservation, limits: ['No network or site JavaScript; runtime-created links/IDs are not inspected.',
      'All DOM href attributes including SVG xlink:href; src/srcset/CSS are outside this supplemental check.',
      'Article DOM hashes ignore only tabindex and attribute order; exact source bodies hashed separately.',
      'Only baseline-listed public sources are read. Text/media fragments and SVG view specifications are not validated.'] };
  await fs.mkdir(path.dirname(reportFile), { recursive: true });
  if (!inside(await fs.realpath(output), await fs.realpath(path.dirname(reportFile)))) throw Error('Report resolves outside output/');
  const prior = await fs.lstat(reportFile).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  if (prior?.isSymbolicLink()) throw Error('Report must not be a symlink');
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ok: report.ok, ...report.coverage, broken, errors, contentPreservation: preservation, report: reportFile }, null, 2));
  if (!report.ok) process.exitCode = 1;
}
await main().catch(error => { console.error(error.message); process.exitCode = 1; });
