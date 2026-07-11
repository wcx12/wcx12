import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { localRepos, staticPublications } from '../site-data.js';
import { SITE, loadPosts } from './blog-content.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const researchConfig = JSON.parse(await fs.readFile(path.join(rootDir, 'research-config.json'), 'utf8'));
const researchChildren = researchConfig.interests.flatMap((interest) => interest.children);

function researchRoute(language, suffix = '') {
  return `${language === 'zh' ? 'zh/' : ''}research/${suffix}`;
}

function publicationsRoute(language) {
  return `${language === 'zh' ? 'zh/' : ''}publications/`;
}

const staticRoutes = ['en', 'zh'].flatMap((language) => [
  researchRoute(language),
  ...researchChildren.map((child) => researchRoute(language, `${child.id}/`)),
  publicationsRoute(language)
]);

const staticRouteFiles = staticRoutes.map((route) => path.join(rootDir, route, 'index.html'));

async function walk(dir, predicate) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute, predicate));
    else if (entry.isFile() && predicate(absolute)) files.push(absolute);
  }
  return files;
}

function matches(source, pattern) {
  return [...source.matchAll(pattern)];
}

function jsonLdFor(source) {
  const match = source.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(match, 'missing JSON-LD script');
  return JSON.parse(match[1]);
}

function graphNode(metadata, type) {
  const nodes = metadata['@graph'] || [metadata];
  return nodes.find((node) => node['@type'] === type);
}

function linkHref(source, relation, hreflang = '') {
  const tags = matches(source, /<link\b[^>]*>/gi).map(([tag]) => tag);
  const tag = tags.find((value) => new RegExp(`rel="${relation}"`, 'i').test(value)
    && (!hreflang || new RegExp(`hreflang="${hreflang}"`, 'i').test(value)));
  return tag?.match(/href="([^"]+)"/i)?.[1] || '';
}

function evidenceKeyFromSchema(item) {
  if (item['@type'] === 'SoftwareSourceCode') return `repo:${item.name}`;
  if (item['@type'] === 'ScholarlyArticle') return `paper:${item.identifier?.value}`;
  if (item['@type'] === 'BlogPosting') {
    const slug = new URL(item.url).pathname.split('/').filter(Boolean).at(-1);
    return `post:${slug}`;
  }
  return '';
}

async function expectedAssetVersion() {
  const { posts } = await loadPosts(rootDir);
  const files = [
    'styles.css',
    'script.js',
    'site-data.js',
    'research-canvas.js',
    'repo-map.js',
    'blog/assets/blog.css',
    'blog/assets/blog.js',
    'blog/assets/katex.min.css',
    'research-config.json',
    'resume.md',
    'scripts/blog-content.mjs',
    'scripts/build-blog.mjs',
    ...posts.map((post) => path.relative(rootDir, post.sourcePath).replace(/\\/g, '/'))
  ].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
  const hash = createHash('sha256');
  for (const relativePath of files) {
    hash.update(relativePath);
    hash.update('\0');
    const content = await fs.readFile(path.join(rootDir, relativePath), 'utf8');
    hash.update(content.replace(/\r\n?/g, '\n'));
    hash.update('\0');
  }
  return hash.digest('hex').slice(0, 12);
}

test('public HTML has stable document structure and valid JSON-LD', async () => {
  const pages = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, '404.html'),
    path.join(rootDir, 'resume', 'index.html'),
    ...staticRouteFiles,
    ...await walk(path.join(rootDir, 'blog'), (file) => file.endsWith('.html'))
  ];

  assert.ok(pages.length >= 4, 'expected homepage, 404, resume, and blog pages');
  for (const file of pages) {
    const source = await fs.readFile(file, 'utf8');
    const relative = path.relative(rootDir, file).replace(/\\/g, '/');
    assert.match(source, /<html\s+[^>]*lang="(?:en|zh-CN)"/i, `${relative}: missing valid document language`);
    assert.equal(matches(source, /<h1\b/gi).length, 1, `${relative}: expected exactly one h1`);
    assert.match(source, /http-equiv="Content-Security-Policy"/i, `${relative}: missing CSP`);

    if (relative !== '404.html') {
      assert.match(source, /<link\s+rel="canonical"/i, `${relative}: missing canonical URL`);
      assert.match(source, /class="skip-link"[^>]+href="#main-content"/i, `${relative}: missing skip link`);
      assert.match(source, /<main\s+[^>]*id="main-content"/i, `${relative}: missing main target`);
      assert.doesNotMatch(source, /fonts\.(?:googleapis|gstatic)\.com/i, `${relative}: external font dependency returned`);
      assert.match(source, /space-grotesk-latin\.woff2/i, `${relative}: missing self-hosted primary font preload`);
      assert.doesNotMatch(source, /script-src[^;"]*'unsafe-inline'/i, `${relative}: executable inline scripts must stay disabled`);
    } else {
      assert.match(source, /name="robots"\s+content="noindex,follow"/i, '404 must not be indexed');
    }

    for (const [, json] of matches(source, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      assert.doesNotThrow(() => JSON.parse(json), `${relative}: invalid JSON-LD`);
    }
  }
});

test('all executable and stylesheet assets share the current release version', async () => {
  const version = await expectedAssetVersion();
  const pages = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, 'resume', 'index.html'),
    ...staticRouteFiles,
    ...await walk(path.join(rootDir, 'blog'), (file) => file.endsWith('.html'))
  ];

  for (const file of pages) {
    const source = await fs.readFile(file, 'utf8');
    const relative = path.relative(rootDir, file).replace(/\\/g, '/');
    const localAssets = [
      ...matches(source, /<link\b[^>]+href="([^"]+\.(?:css))(?:\?([^"]*))?"[^>]*>/gi),
      ...matches(source, /<script\b[^>]+src="([^"]+\.(?:js))(?:\?([^"]*))?"[^>]*><\/script>/gi)
    ];
    assert.ok(localAssets.length >= 2, `${relative}: expected versioned local assets`);
    for (const [, assetPath, query = ''] of localAssets) {
      if (/^(?:https?:)?\/\//i.test(assetPath)) continue;
      const parameters = new URLSearchParams(query);
      assert.equal(parameters.get('v'), version, `${relative}: ${assetPath} has a stale or missing release version`);
    }
  }
});

test('single-post blog avoids duplicate discovery sections', async () => {
  const posts = JSON.parse(await fs.readFile(path.join(rootDir, 'blog', 'posts.json'), 'utf8'));
  if (posts.length !== 1) return;
  const source = await fs.readFile(path.join(rootDir, 'blog', 'index.html'), 'utf8');
  assert.doesNotMatch(source, /section_featured_title/, 'one post should not be repeated in a featured section');
  assert.doesNotMatch(source, /id="blogSearch"/, 'search should wait until there is useful content breadth');
  assert.doesNotMatch(source, /data-blog-i18n="stat_search"/, 'hidden search must not be advertised as ready');
  assert.match(source, /data-blog-i18n="stat_language"/, 'single-post blog should advertise its bilingual interface');
});

test('blog presents the agreed fieldnotes identity', async () => {
  const indexSource = await fs.readFile(path.join(rootDir, 'blog', 'index.html'), 'utf8');
  const clientSource = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.js'), 'utf8');
  const styleSource = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.css'), 'utf8');
  assert.match(indexSource, />Research Fieldnotes<\/h1>/);
  assert.match(clientSource, /hero_title:\s*'知研札记'/);
  assert.match(clientSource, /hero_kicker:\s*'wcx12 的研究手记'/);
  assert.match(clientSource, /document\.documentElement\.lang\s*=\s*uiLang/);
  assert.match(styleSource, /\.blog-content a\s*\{[^}]*overflow-wrap:\s*anywhere/s, 'long DOI links must wrap on mobile');
  assert.match(clientSource, /new URL\('\.\.\/search\.json', import\.meta\.url\)/, 'blog search must resolve from blog/assets/ to blog/search.json');
  assert.match(clientSource, /searchUrl\.searchParams\.set\('v', assetVersion\)/, 'blog search must inherit the release version');
});

test('portfolio routes use the researcher identity while blog routes retain their own brand', async () => {
  const researchSource = await fs.readFile(path.join(rootDir, 'research', 'index.html'), 'utf8');
  const publicationsSource = await fs.readFile(path.join(rootDir, 'publications', 'index.html'), 'utf8');
  const blogSource = await fs.readFile(path.join(rootDir, 'blog', 'index.html'), 'utf8');
  assert.match(researchSource, /<title>Research \| Chenxu Wang \(wcx12\)<\/title>/);
  assert.match(publicationsSource, /<title>Publications \| Chenxu Wang \(wcx12\)<\/title>/);
  assert.match(blogSource, /<title>Research Fieldnotes<\/title>/);
});

test('generated code blocks and article contents remain keyboard reachable', async () => {
  const articleFiles = await walk(path.join(rootDir, 'blog', 'posts'), (file) => file.endsWith('index.html'));
  for (const file of articleFiles) {
    const source = await fs.readFile(file, 'utf8');
    assert.match(source, /<article\s+class="blog-post-card"\s+lang="[a-z-]+"/i, `${path.relative(rootDir, file)}: article language must remain explicit`);
    for (const [, pre] of matches(source, /(<pre\b[^>]*>)/gi)) {
      assert.match(pre, /tabindex="0"/i, `${path.relative(rootDir, file)}: scrollable pre must be focusable`);
    }
    assert.match(source, /blog-toc-mobile/, `${path.relative(rootDir, file)}: missing mobile contents navigation`);
  }
});

test('bundled post media is copied, fingerprinted, and rendered accessibly', async () => {
  const sourcePath = path.join(rootDir, 'content', 'posts', '2026-07-10-building-a-research-writing-system', 'media', 'publishing-flow.svg');
  const publicPath = path.join(rootDir, 'blog', 'posts', 'building-a-research-writing-system', 'media', 'publishing-flow.svg');
  const articlePath = path.join(rootDir, 'blog', 'posts', 'building-a-research-writing-system', 'index.html');
  const [source, published, article] = await Promise.all([
    fs.readFile(sourcePath),
    fs.readFile(publicPath),
    fs.readFile(articlePath, 'utf8')
  ]);
  assert.deepEqual(published, source, 'published media bytes differ from the validated source');
  const version = createHash('sha256').update(source).digest('hex').slice(0, 12);
  assert.match(article, new RegExp(`src="media/publishing-flow\\.svg\\?v=${version}"`));
  assert.match(article, /publishing-flow\.svg[^>]+alt="[^"]+"[^>]+loading="lazy"[^>]+decoding="async"/);
});

test('all configured research and publication routes exist without stale generated HTML', async () => {
  assert.equal(staticRoutes.length, 14, 'five topics plus two index routes must have English and Chinese pages');
  const generated = [
    ...await walk(path.join(rootDir, 'research'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'publications'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'zh'), (file) => file.endsWith('.html'))
  ].map((file) => path.relative(rootDir, file).replace(/\\/g, '/')).sort();
  const expected = staticRouteFiles.map((file) => path.relative(rootDir, file).replace(/\\/g, '/')).sort();
  assert.deepEqual(generated, expected, 'generated static route set must follow research-config.json exactly');
});

test('fixed-language routes have unique metadata and reciprocal language links', async () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const route of staticRoutes) {
    const source = await fs.readFile(path.join(rootDir, route, 'index.html'), 'utf8');
    const isZh = route.startsWith('zh/');
    const alternateRoute = isZh ? route.slice(3) : `zh/${route}`;
    const canonical = `${SITE.url}/${route}`;
    const alternate = `${SITE.url}/${alternateRoute}`;
    const title = source.match(/<title>([^<]+)<\/title>/i)?.[1];
    const description = source.match(/<meta name="description" content="([^"]+)"/i)?.[1];

    assert.ok(title, `${route}: missing title`);
    assert.ok(description, `${route}: missing description`);
    assert.ok(!titles.has(title), `${route}: title must be unique`);
    assert.ok(!descriptions.has(description), `${route}: description must be unique`);
    titles.add(title);
    descriptions.add(description);

    assert.equal(linkHref(source, 'canonical'), canonical, `${route}: canonical must be self-referencing`);
    assert.match(source, new RegExp(`<meta property="og:url" content="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${route}: og:url must match canonical`);
    assert.equal(linkHref(source, 'alternate', 'en'), isZh ? alternate : canonical, `${route}: incorrect English alternate`);
    assert.equal(linkHref(source, 'alternate', 'zh-CN'), isZh ? canonical : alternate, `${route}: incorrect Chinese alternate`);
    assert.equal(linkHref(source, 'alternate', 'x-default'), isZh ? alternate : canonical, `${route}: x-default must select English`);
    assert.match(source, new RegExp(`data-fixed-language="${isZh ? 'zh' : 'en'}"`), `${route}: missing fixed route language`);
    assert.match(source, new RegExp(`<html[^>]+lang="${isZh ? 'zh-CN' : 'en'}"`), `${route}: document language does not match route`);
    assert.doesNotMatch(source, /id="blogLangToggle"/, `${route}: fixed routes must not use the localStorage language button`);
    const switchHref = source.match(/<a id="blogLangLink"[^>]+href="([^"]+)"/i)?.[1];
    assert.ok(switchHref, `${route}: missing ordinary language link`);
    assert.equal(new URL(switchHref, canonical).href, alternate, `${route}: language link must target its mirror`);
  }
});

test('research JSON-LD follows configured topics and visible evidence exactly', async () => {
  const posts = JSON.parse(await fs.readFile(path.join(rootDir, 'blog', 'posts.json'), 'utf8'));
  for (const language of ['en', 'zh']) {
    const indexRoute = researchRoute(language);
    const indexSource = await fs.readFile(path.join(rootDir, indexRoute, 'index.html'), 'utf8');
    const indexMetadata = jsonLdFor(indexSource);
    const collection = graphNode(indexMetadata, 'CollectionPage');
    const topics = graphNode(indexMetadata, 'ItemList');
    assert.ok(collection, `${indexRoute}: missing CollectionPage`);
    assert.ok(topics, `${indexRoute}: missing ItemList`);
    assert.equal(topics.numberOfItems, researchChildren.length);
    assert.deepEqual(topics.itemListElement.map((entry) => entry.item.termCode), researchChildren.map((child) => child.id));
    assert.ok(topics.itemListElement.every((entry) => entry.item['@type'] === 'DefinedTerm'));

    for (const child of researchChildren) {
      const route = researchRoute(language, `${child.id}/`);
      const source = await fs.readFile(path.join(rootDir, route, 'index.html'), 'utf8');
      const metadata = jsonLdFor(source);
      const page = graphNode(metadata, 'CollectionPage');
      const list = graphNode(metadata, 'ItemList');
      const knownRepoNames = new Set(localRepos.map((repo) => repo.name));
      const expectedKeys = [
        ...localRepos.filter((repo) => new Set([...(repo.interests || []), ...(researchConfig.repoAssignments[repo.name] || [])]).has(child.id)).map((repo) => `repo:${repo.name}`),
        ...Object.entries(researchConfig.repoAssignments)
          .filter(([name, interestIds]) => !knownRepoNames.has(name) && Array.isArray(interestIds) && interestIds.includes(child.id))
          .map(([name]) => `repo:${name}`),
        ...staticPublications.filter((publication) => new Set([...(publication.interests || []), ...(researchConfig.paperAssignments[publication.title] || [])]).has(child.id)).map((publication) => `paper:${publication.doi}`),
        ...posts.filter((post) => post.research.includes(child.id)).map((post) => `post:${post.slug}`)
      ].sort();
      const visibleEvidence = matches(source, /data-evidence-type="([^"]+)" data-evidence-key="([^"]+)"/g);
      const visibleKeys = visibleEvidence.map(([, , key]) => key).sort();
      const schemaKeys = list.itemListElement.map(evidenceKeyFromSchema).sort();
      const evidenceTypes = new Set(list.itemListElement.map((item) => item['@type']));
      const demoLink = source.match(/<a class="btn btn-outline research-demo-link" href="([^"]+)">([^<]+)<\/a>/i);

      assert.equal(page.about['@type'], 'DefinedTerm', `${route}: topic must be about a DefinedTerm`);
      assert.equal(page.about.termCode, child.id, `${route}: incorrect DefinedTerm`);
      assert.ok(demoLink, `${route}: missing interactive demo link`);
      assert.equal(demoLink[2], language === 'zh' ? '打开概念演示' : 'Open concept demo');
      assert.equal(new URL(demoLink[1], `${SITE.url}/${route}`).href, `${SITE.url}/#research/${child.id}`, `${route}: interactive demo link targets the wrong homepage state`);
      assert.deepEqual(visibleKeys, expectedKeys, `${route}: visible evidence differs from configured sources`);
      assert.deepEqual(schemaKeys, visibleKeys, `${route}: JSON-LD evidence differs from visible evidence`);
      assert.deepEqual([...evidenceTypes].filter((type) => !['SoftwareSourceCode', 'ScholarlyArticle', 'BlogPosting'].includes(type)), [], `${route}: unsupported evidence type`);
      assert.equal(list.numberOfItems, visibleEvidence.length, `${route}: evidence count mismatch`);
      for (const [, type] of visibleEvidence) assert.ok(['SoftwareSourceCode', 'ScholarlyArticle', 'BlogPosting'].includes(type));
      for (const [, article] of matches(source, /(<article class="research-evidence"[\s\S]*?<\/article>)/g)) {
        assert.match(article, /<a\s+[^>]*href="[^"]+"/i, `${route}: visible evidence needs a crawlable link`);
      }
    }
  }
});

test('publication pages expose every canonical DOI record with ordered authors', async () => {
  const expectedDois = staticPublications.map((publication) => publication.doi);
  for (const language of ['en', 'zh']) {
    const route = publicationsRoute(language);
    const source = await fs.readFile(path.join(rootDir, route, 'index.html'), 'utf8');
    const metadata = jsonLdFor(source);
    const page = graphNode(metadata, 'CollectionPage');
    const list = graphNode(metadata, 'ItemList');
    assert.ok(page, `${route}: missing CollectionPage`);
    assert.equal(list.numberOfItems, staticPublications.length, `${route}: publication count must follow canonical data`);
    assert.equal(list.itemListElement.length, staticPublications.length, `${route}: publication ItemList must follow canonical data`);
    assert.ok(list.itemListElement.every((item) => item['@type'] === 'ScholarlyArticle'));
    assert.deepEqual(list.itemListElement.map((item) => item.identifier.value), expectedDois);
    staticPublications.forEach((publication, index) => {
      const topicIds = researchConfig.paperAssignments[publication.title] || publication.interests || [];
      const topic = researchChildren.find((child) => topicIds.includes(child.id));
      const expectedTopicUrl = `${SITE.url}/${researchRoute(language, `${topic.id}/`)}`;
      assert.deepEqual(
        list.itemListElement[index].author.map((author) => author.name),
        publication.authors.split(';').map((author) => author.trim()),
        `${route}: author order changed for ${publication.doi}`
      );
      assert.equal(list.itemListElement[index].about['@type'], 'DefinedTerm', `${route}: missing publication topic term`);
      assert.equal(list.itemListElement[index].about.termCode, topic.id, `${route}: publication topic mapping changed`);
      assert.equal(list.itemListElement[index].about.url, expectedTopicUrl, `${route}: JSON-LD topic URL is incorrect`);

      const record = matches(source, /(<article class="research-evidence"[\s\S]*?<\/article>)/g)[index]?.[1] || '';
      const topicHref = record.match(/<a class="publication-topic-link" href="([^"]+)"/i)?.[1];
      assert.ok(topicHref, `${route}: publication ${publication.doi} is missing its visible topic link`);
      assert.equal(new URL(topicHref, `${SITE.url}/${route}`).href, expectedTopicUrl, `${route}: visible and JSON-LD topic URLs differ`);
    });
    const visibleDois = matches(source, /data-evidence-key="paper:([^"]+)"/g).map(([, doi]) => doi);
    assert.deepEqual(visibleDois, expectedDois, `${route}: visible DOI records differ from JSON-LD`);
  }
});

test('sitemap covers every configured fixed-language route', async () => {
  const sitemap = await fs.readFile(path.join(rootDir, 'sitemap.xml'), 'utf8');
  for (const route of staticRoutes) {
    assert.match(sitemap, new RegExp(`<loc>${`${SITE.url}/${route}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`), `${route}: missing from sitemap`);
  }

  const entries = matches(sitemap, /<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g);
  assert.equal(entries.length, matches(sitemap, /<url>/g).length, 'every sitemap URL needs a lastmod value');
  for (const [, location, lastmod] of entries) {
    assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, `${location}: invalid lastmod`);
    assert.ok(Number.isFinite(Date.parse(`${lastmod}T00:00:00Z`)), `${location}: unparseable lastmod`);
  }
  assert.match(
    sitemap,
    /<loc>https:\/\/wcx12\.github\.io\/wcx12\/blog\/posts\/building-a-research-writing-system\/<\/loc><lastmod>2026-07-11<\/lastmod>/
  );
});

test('RSS declares itself and preserves post taxonomy', async () => {
  const rss = await fs.readFile(path.join(rootDir, 'rss.xml'), 'utf8');
  assert.match(rss, /xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom"/);
  assert.match(rss, /xmlns:content="http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/"/);
  assert.match(rss, /<atom:link href="https:\/\/wcx12\.github\.io\/wcx12\/rss\.xml" rel="self" type="application\/rss\+xml" \/>/);
  assert.match(rss, /<category>Engineering<\/category>/);
  assert.match(rss, /<category>research-workflow<\/category>/);
  assert.match(rss, /<content:encoded><!\[CDATA\[[\s\S]+?<\/content:encoded>/);
  assert.match(
    rss,
    /src="https:\/\/wcx12\.github\.io\/wcx12\/blog\/posts\/building-a-research-writing-system\/media\/publishing-flow\.svg\?v=[a-f0-9]{12}"/
  );
});

test('fixed routes ignore stored language while preserving theme selection', async () => {
  const source = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.js'), 'utf8');
  assert.match(source, /const fixedLanguage = document\.documentElement\.dataset\.fixedLanguage/);
  assert.match(source, /normalizeLang\(fixedLanguage \|\| localStorage\.getItem\(LANG_KEY\)/);
  assert.match(source, /if \(!fixedLanguage\) localStorage\.setItem\(LANG_KEY, currentLang\)/);
  assert.match(source, /applyTheme\(localStorage\.getItem\(THEME_KEY\) \|\| 'neon'\)/);
});

test('GitHub Actions are pinned and do not expose a long-lived metrics token', async () => {
  const workflowDir = path.join(rootDir, '.github', 'workflows');
  const workflows = await walk(workflowDir, (file) => /\.ya?ml$/i.test(file));
  assert.ok(workflows.length > 0, 'expected workflow files');
  for (const file of workflows) {
    const source = await fs.readFile(file, 'utf8');
    for (const line of source.split(/\r?\n/).filter((value) => /^\s*-?\s*uses:/.test(value))) {
      assert.match(line, /@[a-f0-9]{40}(?:\s|$)/i, `${path.basename(file)}: action must use a full commit SHA`);
    }
    assert.doesNotMatch(source, /METRICS_TOKEN/, `${path.basename(file)}: metrics must use the job-scoped token`);
  }
});

test('scheduled publishing builds before validating generated output', async () => {
  const source = await fs.readFile(path.join(rootDir, '.github', 'workflows', 'blog-build.yml'), 'utf8');
  assert.match(source, /schedule:\s*\n\s*- cron: "17 16 \* \* \*"/);
  assert.match(source, /SITE_TIME_ZONE: Asia\/Shanghai/);
  assert.match(source, /actions\/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10/);
  assert.match(source, /actions\/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e/);
  const sourceValidation = source.indexOf('- name: Validate source content');
  const build = source.indexOf('- name: Build site');
  const generatedValidation = source.indexOf('- name: Validate generated site');
  const commit = source.indexOf('- name: Commit generated site');
  assert.ok(sourceValidation < build && build < generatedValidation && generatedValidation < commit, 'scheduled publishing steps are in an unsafe order');
});

test('public publication source and generated profile contain every canonical DOI', async () => {
  const source = await fs.readFile(path.join(rootDir, 'publications.md'), 'utf8');
  const profile = await fs.readFile(path.join(rootDir, 'resume', 'index.html'), 'utf8');
  for (const publication of staticPublications) {
    const escapedDoi = publication.doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(source, new RegExp(escapedDoi), `publications.md is missing ${publication.doi}`);
    assert.match(profile, new RegExp(escapedDoi), `generated profile is missing ${publication.doi}`);
  }
  assert.doesNotMatch(source, /coming soon|work in progress/i);
});
