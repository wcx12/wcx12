import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { localRepos, staticPublications } from '../site-data.js';
import { SITE, loadPosts, slugify } from './blog-content.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const researchConfig = JSON.parse(await fs.readFile(path.join(rootDir, 'research-config.json'), 'utf8'));
const researchChildren = researchConfig.interests.flatMap((interest) => interest.children);

function researchRoute(language, suffix = '') {
  return `${language === 'zh' ? 'zh/' : ''}research/${suffix}`;
}

function resumeRoute(language) {
  return `${language === 'zh' ? 'zh/' : ''}resume/`;
}

function publicationsRoute(language) {
  return `${language === 'zh' ? 'zh/' : ''}publications/`;
}

function projectsRoute(language) {
  return `${language === 'zh' ? 'zh/' : ''}projects/`;
}

const staticRoutes = ['en', 'zh'].flatMap((language) => [
  resumeRoute(language),
  researchRoute(language),
  ...researchChildren.map((child) => researchRoute(language, `${child.id}/`)),
  projectsRoute(language),
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
  if (['SoftwareSourceCode', 'LearningResource', 'CreativeWork'].includes(item['@type'])) return `repo:${item.name}`;
  if (item['@type'] === 'ScholarlyArticle') return `paper:${item.identifier?.value}`;
  if (item['@type'] === 'BlogPosting') {
    const slug = new URL(item.url).pathname.split('/').filter(Boolean).at(-1);
    return `post:${slug}`;
  }
  return '';
}

function expectedRepositorySchemaType(repo) {
  if (['Teaching materials', 'Coursework'].includes(repo.stage?.en)) return 'LearningResource';
  if (repo.stage?.en === 'Planning') return 'CreativeWork';
  return 'SoftwareSourceCode';
}

function metaContent(source, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(`<meta\\s+(?:property|name)="${escaped}"\\s+content="([^"]*)"`, 'i'))?.[1] || '';
}

function structuredImageUrl(metadata) {
  const nodes = metadata['@graph'] || [metadata];
  for (const node of nodes) {
    const image = node.primaryImageOfPage || node.image;
    if (typeof image === 'string') return image;
    if (image?.url) return image.url;
  }
  return '';
}

async function expectedAssetVersion() {
  const { posts } = await loadPosts(rootDir);
  const files = [
    'styles.css',
    'script.js',
    'homepage-i18n.js',
    'site-data.js',
    'research-canvas.js',
    'repo-map.js',
    'blog/assets/blog.css',
    'blog/assets/blog.js',
    'blog/assets/katex.min.css',
    'research-config.json',
    'resume.md',
    'resume.zh.md',
    'scripts/blog-content.mjs',
  'scripts/research-config-schema.js',
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
    path.join(rootDir, 'zh', 'index.html'),
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
      assert.doesNotMatch(source, /<link\b[^>]*rel="preload"[^>]*as="font"/i, `${relative}: optional fonts must not compete with first paint`);
      assert.doesNotMatch(source, /script-src[^;"]*'unsafe-inline'/i, `${relative}: executable inline scripts must stay disabled`);
    } else {
      assert.match(source, /name="robots"\s+content="noindex,follow"/i, '404 must not be indexed');
    }

    for (const [, json] of matches(source, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      assert.doesNotThrow(() => JSON.parse(json), `${relative}: invalid JSON-LD`);
    }
  }
});

test('shared content navigation keeps visible labels in accessible names', async () => {
  for (const relativePath of ['blog/index.html', 'research/index.html', 'resume/index.html', 'zh/research/index.html']) {
    const source = await fs.readFile(path.join(rootDir, relativePath), 'utf8');
    assert.match(source, /class="blog-menu-toggle"[^>]+>[^<]+<\/button>/);
    assert.doesNotMatch(source.match(/<button class="blog-menu-toggle"[\s\S]*?<\/button>/)?.[0] || '', /aria-label=/);
    const siteNav = source.match(/<nav id="blogSiteNav"[\s\S]*?<\/nav>/)?.[0] || '';
    assert.ok(siteNav, `${relativePath}: missing shared navigation`);
    assert.doesNotMatch(siteNav, /<a\b[^>]*aria-label=/, `${relativePath}: visible nav links must name themselves`);
    assert.doesNotMatch(siteNav.match(/<a id="blogLangLink"[\s\S]*?<\/a>/)?.[0] || '', /aria-label=/);
  }
});

test('content pages restore visible focus in forced-color mode', async () => {
  const source = await fs.readFile(path.join(rootDir, 'blog', 'assets', 'blog.css'), 'utf8');
  assert.match(source, /@media \(forced-colors: active\)[\s\S]*?:where\(a, button, input, select, textarea, summary, \[tabindex\]\):focus-visible[\s\S]*?outline:\s*3px solid Highlight !important/);
});

test('404 is a bilingual, script-free recovery page', async () => {
  const source = await fs.readFile(path.join(rootDir, '404.html'), 'utf8');
  assert.match(source, /<span lang="zh-CN">页面未找到。<\/span>/);
  assert.match(source, /<p class="zh-copy" lang="zh-CN">/);
  for (const href of ['/wcx12/', '/wcx12/research/', '/wcx12/projects/', '/wcx12/blog/']) {
    assert.ok(source.includes(`href="${href}"`), `404 is missing ${href}`);
  }
  assert.match(source, /nav a \{[^}]*min-height:\s*44px/s);
  assert.match(source, /img-src 'self'/);
  assert.match(source, /@media \(forced-colors: active\)[\s\S]*?a:focus-visible \{[^}]*outline:\s*3px solid Highlight/);
  assert.doesNotMatch(source, /<script\b/i);
  assert.doesNotMatch(source, /font-size:\s*clamp\([^)]*vw/i);
});

test('all generated local links and assets resolve inside the published tree', async () => {
  const pages = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, '404.html'),
    path.join(rootDir, 'resume', 'index.html'),
    ...await walk(path.join(rootDir, 'research'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'projects'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'publications'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'zh'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'blog'), (file) => file.endsWith('.html'))
  ];

  for (const file of pages) {
    const source = await fs.readFile(file, 'utf8');
    const relative = path.relative(rootDir, file).replace(/\\/g, '/');
    for (const [, attribute, rawValue] of matches(source, /\b(href|src)="([^"]+)"/gi)) {
      if (/^(?:https?:|mailto:|tel:|data:|#|\/\/)/i.test(rawValue)) continue;
      const cleanValue = decodeURIComponent(rawValue.split(/[?#]/, 1)[0]);
      if (!cleanValue) continue;
      let target = cleanValue.startsWith('/wcx12/')
        ? path.resolve(rootDir, cleanValue.slice('/wcx12/'.length))
        : path.resolve(path.dirname(file), cleanValue);
      if (cleanValue.startsWith('/') && !cleanValue.startsWith('/wcx12/')) {
        assert.fail(`${relative}: unsupported root-absolute ${attribute} target ${rawValue}`);
      }
      if (/[\\/]$/.test(cleanValue)) target = path.join(target, 'index.html');
      const withinRoot = path.relative(rootDir, target);
      assert.ok(withinRoot && !withinRoot.startsWith('..') && !path.isAbsolute(withinRoot), `${relative}: ${attribute} escapes the published tree: ${rawValue}`);
      const exists = await fs.stat(target).then(() => true, () => false);
      assert.ok(exists, `${relative}: missing local ${attribute} target ${rawValue}`);
    }
  }
});

test('major pages use representative social cards in metadata and structured data', async () => {
  const cases = [
    ['index.html', '/assets/og-home.png'],
    ['zh/index.html', '/assets/og-home-zh.png'],
    ['blog/index.html', '/assets/og-blog.png'],
    ['resume/index.html', '/assets/og-profile.png'],
    ['zh/resume/index.html', '/assets/og-profile-zh.png'],
    ['research/index.html', '/assets/og-research.png'],
    ['zh/research/index.html', '/assets/og-research-zh.png'],
    ['projects/index.html', '/assets/og-projects.png'],
    ['zh/projects/index.html', '/assets/og-projects-zh.png'],
    ['publications/index.html', '/assets/og-publications.png'],
    ['zh/publications/index.html', '/assets/og-publications-zh.png'],
    ['blog/posts/building-a-research-writing-system/index.html', '/blog/posts/building-a-research-writing-system/media/social-card.png']
  ];
  const socialImages = new Set();

  for (const [relative, expectedSuffix] of cases) {
    const source = await fs.readFile(path.join(rootDir, relative), 'utf8');
    const socialImage = metaContent(source, 'og:image');
    const twitterImage = metaContent(source, 'twitter:image');
    const socialAlt = metaContent(source, 'og:image:alt');
    assert.ok(socialImage.endsWith(expectedSuffix) || new URL(socialImage).pathname.endsWith(expectedSuffix), `${relative}: wrong social card`);
    assert.equal(twitterImage, socialImage, `${relative}: Open Graph and Twitter cards differ`);
    assert.ok(socialAlt.trim(), `${relative}: social card needs alternative text`);
    assert.equal(metaContent(source, 'twitter:image:alt'), socialAlt, `${relative}: social card alt text differs`);
    assert.equal(structuredImageUrl(jsonLdFor(source)), socialImage, `${relative}: structured image differs from visible metadata`);
    socialImages.add(new URL(socialImage).pathname);

    const imageUrl = new URL(socialImage);
    const relativeImage = decodeURIComponent(imageUrl.pathname.replace(/^\/wcx12\//, ''));
    const image = await fs.readFile(path.join(rootDir, relativeImage));
    assert.equal(image.subarray(1, 4).toString('ascii'), 'PNG', `${relative}: social card is not a PNG`);
    assert.equal(image.readUInt32BE(16), 1200, `${relative}: social card width must be 1200`);
    assert.equal(image.readUInt32BE(20), 630, `${relative}: social card height must be 630`);
  }

  assert.equal(socialImages.size, cases.length, 'major page types must not reuse one generic social card');
});

test('all executable and stylesheet assets share the current release version', async () => {
  const version = await expectedAssetVersion();
  const pages = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, 'zh', 'index.html'),
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
  assert.doesNotMatch(source, /class="blog-stat-grid"/, 'single-post blog should lead directly into its only article');
  assert.match(source, /class="blog-section blog-latest-section"/, 'the only article should remain immediately discoverable');
});

test('blog presents the agreed fieldnotes identity', async () => {
  const indexSource = await fs.readFile(path.join(rootDir, 'blog', 'index.html'), 'utf8');
  const clientSource = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.js'), 'utf8');
  const styleSource = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.css'), 'utf8');
  assert.match(indexSource, />Research Fieldnotes<\/h1>/);
  assert.match(clientSource, /hero_title:\s*'知研札记'/);
  assert.match(clientSource, /page_title:\s*'知研札记 \| wcx12'/);
  assert.match(clientSource, /hero_kicker:\s*'研究 · 工程 · 思考'/);
  assert.match(
    clientSource,
    /hero_desc:\s*'记录研究问题如何被拆解、实验如何被验证，以及代码如何成为可复现的答案。当前文章以英文发布。'/,
  );
  assert.match(clientSource, /document\.title\s*=\s*t\('page_title'\)/);
  assert.match(clientSource, /document\.documentElement\.lang\s*=\s*uiLang/);
  assert.match(styleSource, /html\[data-ui-lang="zh"\] \.blog-hero h1/);
  assert.match(styleSource, /\.blog-content a\s*\{[^}]*overflow-wrap:\s*anywhere/s, 'long DOI links must wrap on mobile');
  assert.match(clientSource, /new URL\('\.\.\/search\.json', import\.meta\.url\)/, 'blog search must resolve from blog/assets/ to blog/search.json');
  assert.match(clientSource, /searchUrl\.searchParams\.set\('v', assetVersion\)/, 'blog search must inherit the release version');
});

test('portfolio routes use the researcher identity while blog routes retain their own brand', async () => {
  const researchSource = await fs.readFile(path.join(rootDir, 'research', 'index.html'), 'utf8');
  const publicationsSource = await fs.readFile(path.join(rootDir, 'publications', 'index.html'), 'utf8');
  const blogSource = await fs.readFile(path.join(rootDir, 'blog', 'index.html'), 'utf8');
  const resumeSource = await fs.readFile(path.join(rootDir, 'resume', 'index.html'), 'utf8');
  assert.match(researchSource, /<title>Research \| Chenxu Wang \(wcx12\)<\/title>/);
  assert.match(publicationsSource, /<title>Publications \| Chenxu Wang \(wcx12\)<\/title>/);
  assert.match(blogSource, /<title>Research Fieldnotes<\/title>/);
  const profile = jsonLdFor(resumeSource);
  assert.equal(profile.mainEntity['@id'], `${SITE.url}/#person`);
  assert.equal(profile.mainEntity.identifier.propertyID, 'ORCID');
  assert.equal(profile.mainEntity.identifier.value, '0009-0005-6139-4327');
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
    if (file.includes('building-a-research-writing-system')) {
      assert.match(source, /href="https:\/\/github\.com\/wcx12\/wcx12\/blob\/main\/scripts\/blog-content\.mjs"/);
      assert.match(source, /href="https:\/\/github\.com\/wcx12\/wcx12\/blob\/main\/\.github\/workflows\/blog-build\.yml"/);
      assert.match(source, /href="https:\/\/wcx12\.github\.io\/wcx12\/research\/"/);
    }
  }
});

test('bundled post media is copied, fingerprinted, and rendered accessibly', async () => {
  const sourcePath = path.join(rootDir, 'content', 'posts', '2026-07-10-building-a-research-writing-system', 'media', 'publishing-flow.png');
  const publicPath = path.join(rootDir, 'blog', 'posts', 'building-a-research-writing-system', 'media', 'publishing-flow.png');
  const articlePath = path.join(rootDir, 'blog', 'posts', 'building-a-research-writing-system', 'index.html');
  const [source, published, article] = await Promise.all([
    fs.readFile(sourcePath),
    fs.readFile(publicPath),
    fs.readFile(articlePath, 'utf8')
  ]);
  assert.deepEqual(published, source, 'published media bytes differ from the validated source');
  const version = createHash('sha256').update(source).digest('hex').slice(0, 12);
  assert.match(article, new RegExp(`src="media/publishing-flow\\.png\\?v=${version}"`));
  assert.match(article, /publishing-flow\.png[^>]+alt="[^"]+"[^>]+loading="lazy"[^>]+decoding="async"[^>]+referrerpolicy="no-referrer"/);
  assert.match(article, /Content-Security-Policy[^>]+img-src 'self' data:; connect-src 'self'/);
  assert.doesNotMatch(article, /Content-Security-Policy[^>]+img-src[^>]+https:/);
  assert.match(article, /<meta property="article:author" content="https:\/\/wcx12\.github\.io\/wcx12\/" \/>/);
  assert.match(article, /<meta property="article:section" content="Engineering" \/>/);
  for (const tag of ['personal-site', 'static-site', 'research-workflow']) {
    assert.match(article, new RegExp(`<meta property="article:tag" content="${tag}" \\/>`));
  }
});

test('all configured fixed-language portfolio routes exist without stale generated HTML', async () => {
  assert.equal(staticRoutes.length, 2 * (researchChildren.length + 4), 'fixed routes must follow the current research configuration');
  const generated = [
    ...await walk(path.join(rootDir, 'resume'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'research'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'projects'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'publications'), (file) => file.endsWith('.html')),
    ...await walk(path.join(rootDir, 'zh'), (file) => file.endsWith('.html'))
  ].map((file) => path.relative(rootDir, file).replace(/\\/g, '/')).sort();
  const expected = [
    'zh/index.html',
    ...staticRouteFiles.map((file) => path.relative(rootDir, file).replace(/\\/g, '/'))
  ].sort();
  assert.deepEqual(generated, expected, 'generated static route set must include the Chinese homepage and follow research-config.json exactly');
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
    assert.equal(metaContent(source, 'og:locale:alternate'), isZh ? 'en_US' : 'zh_CN', `${route}: missing alternate Open Graph locale`);
    const expectedHome = `${SITE.url}/${isZh ? 'zh/' : ''}`;
    const brandHome = source.match(/<a class="blog-brand" href="([^"]+)">wcx12<\/a>/i)?.[1];
    const footerHome = source.match(/<footer class="blog-footer">[\s\S]*?<a href="([^"]+)"/i)?.[1];
    assert.equal(new URL(brandHome, canonical).href, expectedHome, `${route}: brand must return to the matching language homepage`);
    assert.equal(new URL(footerHome, canonical).href, expectedHome, `${route}: footer must return to the matching language homepage`);
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
      assert.equal(
        new URL(demoLink[1], `${SITE.url}/${route}`).href,
        `${SITE.url}/${language === 'zh' ? 'zh/' : ''}#research/${child.id}`,
        `${route}: interactive demo link targets the wrong homepage state`
      );
      assert.deepEqual(visibleKeys, expectedKeys, `${route}: visible evidence differs from configured sources`);
      assert.deepEqual(schemaKeys, visibleKeys, `${route}: JSON-LD evidence differs from visible evidence`);
      assert.deepEqual([...evidenceTypes].filter((type) => !['SoftwareSourceCode', 'LearningResource', 'CreativeWork', 'ScholarlyArticle', 'BlogPosting'].includes(type)), [], `${route}: unsupported evidence type`);
      assert.equal(list.numberOfItems, visibleEvidence.length, `${route}: evidence count mismatch`);
      for (const item of list.itemListElement.filter((entry) => ['SoftwareSourceCode', 'LearningResource', 'CreativeWork'].includes(entry['@type']))) {
        const repo = localRepos.find((entry) => entry.name === item.name);
        if (!repo) continue;
        assert.equal(item['@type'], expectedRepositorySchemaType(repo), `${route}: repository schema type is inaccurate`);
        assert.equal(item.creativeWorkStatus, repo.stage[language], `${route}: repository stage is missing from JSON-LD`);
      }
      for (const [, type] of visibleEvidence) assert.ok(['SoftwareSourceCode', 'ScholarlyArticle', 'BlogPosting'].includes(type));
      for (const [, article] of matches(source, /(<article class="research-evidence"[\s\S]*?<\/article>)/g)) {
        assert.match(article, /<a\s+[^>]*href="[^"]+"/i, `${route}: visible evidence needs a crawlable link`);
        if (/data-evidence-type="SoftwareSourceCode"/.test(article)) {
          assert.match(article, new RegExp(`<dt>${language === 'zh' ? '阶段' : 'Stage'}<\\/dt>`), `${route}: visible project stage is missing`);
          assert.match(article, new RegExp(`<dt>${language === 'zh' ? '公开证据' : 'Public evidence'}<\\/dt>`), `${route}: visible project evidence is missing`);
          assert.match(article, new RegExp(`<dt>${language === 'zh' ? '许可证' : 'License'}<\\/dt>`), `${route}: visible project license status is missing`);
        }
      }
    }
  }
});

test('research profile has complete English and Chinese fixed-language records', async () => {
  const [english, chinese, chineseHome, profileStyles] = await Promise.all([
    fs.readFile(path.join(rootDir, 'resume', 'index.html'), 'utf8'),
    fs.readFile(path.join(rootDir, 'zh', 'resume', 'index.html'), 'utf8'),
    fs.readFile(path.join(rootDir, 'zh', 'index.html'), 'utf8'),
    fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.css'), 'utf8')
  ]);
  assert.match(english, /<title>Academic Profile \| Chenxu Wang \(wcx12\)<\/title>/);
  assert.match(chinese, /<title>学术履历 \| Chenxu Wang \(wcx12\)<\/title>/);
  assert.match(english, /<h2 id="profile-research-interests-title">Research Interests<\/h2>/);
  assert.match(chinese, /<h2 id="profile-研究兴趣-title">研究兴趣<\/h2>/);
  assert.match(chinese, /预计毕业时间：2026 年/);
  assert.match(chinese, /正在申请硕士与博士项目/);
  assert.doesNotMatch(chinese, />Research Interests</);
  assert.doesNotMatch(chinese, />Current Goal</);
  assert.doesNotMatch(english, /class="blog-post-card research-profile"/);
  for (const source of [english, chinese]) {
    assert.match(source, /<header class="profile-masthead">/);
    assert.match(source, /<dl class="profile-facts">/);
    assert.doesNotMatch(source, /class="profile-rail"/);
    assert.equal(matches(source, /data-profile-section="[^"]+"/g).length, 5);
    for (const kind of ['education', 'publications', 'interests', 'projects', 'skills']) {
      assert.match(source, new RegExp(`data-profile-kind="${kind}"`));
    }
    assert.ok(source.indexOf('data-profile-kind="publications"') < source.indexOf('data-profile-kind="interests"'));
    assert.equal(matches(source, /class="resume-publication-entry"/g).length, staticPublications.length);
    assert.equal(matches(source, /class="resume-author-self"/g).length, staticPublications.length);
    assert.equal(matches(source, /class="profile-section-nav"[\s\S]*?<\/nav>/g)[0][0].match(/<a href=/g)?.length, 5);
  }
  assert.match(chinese, /<h3 lang="en">TF-VPR/);
  for (const publication of staticPublications) {
    assert.match(english, new RegExp(publication.doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(chinese, new RegExp(publication.doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(profileStyles, /\.profile-section-nav\s*\{[^}]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/s);
  assert.match(profileStyles, /\.profile-section\s*\{[^}]*grid-template-columns:\s*minmax\(130px, 165px\) minmax\(0, 1fr\)/s);
  assert.match(profileStyles, /@media \(max-width: 560px\)[\s\S]*?\.profile-section\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(profileStyles, /@page\s*\{[^}]*size:\s*A4/s);
  assert.match(profileStyles, /@page\s*\{[^}]*margin:\s*0/s);
  assert.match(profileStyles, /@media print[\s\S]*?html,[\s\S]*?\.blog-body\s*\{[^}]*background:\s*#ffffff !important/s);
  assert.match(profileStyles, /@media print[\s\S]*?\.blog-shell\s*\{[^}]*padding:\s*14mm 15mm/s);
  assert.match(profileStyles, /@media print[\s\S]*?\.profile-section-nav,[\s\S]*?display:\s*none !important/s);
  assert.equal(jsonLdFor(english).inLanguage, 'en');
  assert.equal(jsonLdFor(chinese).inLanguage, 'zh-CN');
  assert.match(chineseHome, /href="\.\/resume\/"/);
  assert.doesNotMatch(chineseHome, /href="\.\.\/resume\/"/);
});

test('homepage language mirrors are self-canonical and mutually discoverable', async () => {
  const english = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  const chinese = await fs.readFile(path.join(rootDir, 'zh', 'index.html'), 'utf8');
  const englishUrl = `${SITE.url}/`;
  const chineseUrl = `${SITE.url}/zh/`;

  assert.equal(linkHref(english, 'canonical'), englishUrl);
  assert.equal(linkHref(chinese, 'canonical'), chineseUrl);
  for (const source of [english, chinese]) {
    assert.equal(linkHref(source, 'alternate', 'en'), englishUrl);
    assert.equal(linkHref(source, 'alternate', 'zh-CN'), chineseUrl);
    assert.equal(linkHref(source, 'alternate', 'x-default'), englishUrl);
  }
  assert.match(english, /<a id="langToggle"[^>]+href="\.\/zh\/"[^>]+hreflang="zh-CN"/);
  assert.match(chinese, /<a id="langToggle"[^>]+href="\.\.\/"[^>]+hreflang="en"/);
  assert.match(chinese, /<meta property="og:url" content="https:\/\/wcx12\.github\.io\/wcx12\/zh\/"/);
  assert.match(chinese, /"@id": "https:\/\/wcx12\.github\.io\/wcx12\/zh\/#profile"/);
  assert.match(chinese, /"inLanguage": "zh-CN"/);
});

test('project indexes expose every repository with maturity and public evidence', async () => {
  const expectedNames = localRepos.map((repo) => repo.name).sort();
  for (const language of ['en', 'zh']) {
    const route = projectsRoute(language);
    const source = await fs.readFile(path.join(rootDir, route, 'index.html'), 'utf8');
    const metadata = jsonLdFor(source);
    const page = graphNode(metadata, 'CollectionPage');
    const list = graphNode(metadata, 'ItemList');
    assert.ok(page, `${route}: missing CollectionPage`);
    assert.equal(page.mainEntity['@id'], `${SITE.url}/${route}#projects`);
    assert.equal(list.numberOfItems, localRepos.length);
    assert.deepEqual(list.itemListElement.map((item) => item.name).sort(), expectedNames);
    assert.deepEqual(
      matches(source, /data-evidence-key="repo:([^"]+)"/g).map(([, name]) => name).sort(),
      expectedNames
    );
    for (const item of list.itemListElement) {
      const repo = localRepos.find((entry) => entry.name === item.name);
      const expectedDescription = language === 'zh' ? repo.descriptionZh : repo.description;
      assert.equal(item['@type'], expectedRepositorySchemaType(repo), `${route}: wrong schema type for ${repo.name}`);
      assert.equal(item.description, expectedDescription, `${route}: localized description drifted for ${repo.name}`);
      assert.equal(item.creativeWorkStatus, repo.stage[language]);
      if (repo.fork) {
        assert.equal(item.author, undefined, `${route}: fork must not claim the profile owner as author`);
        assert.equal(item.isBasedOn?.url, repo.source.html_url, `${route}: fork is missing upstream attribution`);
        assert.equal(item.isBasedOn?.codeRepository, repo.source.html_url, `${route}: fork upstream repository is incomplete`);
      } else {
        assert.equal(item.author?.name, SITE.author, `${route}: original work is missing its author`);
      }
      if (item['@type'] === 'LearningResource') assert.equal(item.educationalUse, 'instruction');
      const expectedLicense = repo.license_spdx ? `https://spdx.org/licenses/${encodeURIComponent(repo.license_spdx)}.html` : undefined;
      assert.equal(item.license, expectedLicense, `${route}: license metadata drifted for ${repo.name}`);
      assert.match(source, new RegExp((repo.license_spdx || (language === 'zh' ? '未声明仓库许可证' : 'No repository license declared')).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(source, new RegExp(repo.html_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(source, new RegExp(expectedDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
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
    for (const [index, publication] of staticPublications.entries()) {
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
      assert.equal(list.itemListElement[index].subjectOf?.codeRepository, publication.code_url, `${route}: official implementation is missing from JSON-LD`);
      assert.equal(list.itemListElement[index].datePublished, publication.published_date, `${route}: publication date is incomplete`);
      assert.equal(list.itemListElement[index].isPartOf?.volumeNumber, publication.volume, `${route}: volume is missing`);
      assert.equal(list.itemListElement[index].pagination, publication.article_number, `${route}: article number is missing`);
      assert.equal(list.itemListElement[index].isAccessibleForFree, publication.open_access, `${route}: open-access status is missing`);
      assert.equal(list.itemListElement[index].license, publication.license, `${route}: publication license is missing`);

      const record = matches(source, /(<article class="research-evidence"[\s\S]*?<\/article>)/g)[index]?.[1] || '';
      const topicHref = record.match(/<a class="publication-topic-link" href="([^"]+)"/i)?.[1];
      assert.ok(topicHref, `${route}: publication ${publication.doi} is missing its visible topic link`);
      assert.equal(new URL(topicHref, `${SITE.url}/${route}`).href, expectedTopicUrl, `${route}: visible and JSON-LD topic URLs differ`);
      assert.match(record, new RegExp(publication.code_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(record, new RegExp(language === 'zh' ? '本主页 GitHub 账号之外' : 'outside this profile[^<]+GitHub account', 'i'));
      assert.match(record, new RegExp(`${publication.venue} ${publication.volume} \\(${publication.year}\\), ${publication.article_number}`));

      const citationStem = slugify(publication.doi);
      const bibPath = path.join(rootDir, 'publications', 'citations', `${citationStem}.bib`);
      const risPath = path.join(rootDir, 'publications', 'citations', `${citationStem}.ris`);
      const [bibtex, ris] = await Promise.all([fs.readFile(bibPath, 'utf8'), fs.readFile(risPath, 'utf8')]);
      assert.match(record, new RegExp(`href="[^"]*citations/${citationStem}\\.bib" download`));
      assert.match(record, new RegExp(`href="[^"]*citations/${citationStem}\\.ris" download`));
      assert.match(bibtex, new RegExp(`@article\\{${publication.citation_key},`));
      assert.match(bibtex, new RegExp(`doi = \\{${publication.doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`));
      assert.match(ris, new RegExp(`DO  - ${publication.doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      assert.match(ris, new RegExp(`VL  - ${publication.volume}`));
    }
    const visibleDois = matches(source, /data-evidence-key="paper:([^"]+)"/g).map(([, doi]) => doi);
    assert.deepEqual(visibleDois, expectedDois, `${route}: visible DOI records differ from JSON-LD`);
    assert.doesNotMatch(source, /DOI-verified/i);
  }
});

test('sitemap covers every configured fixed-language route', async () => {
  const sitemap = await fs.readFile(path.join(rootDir, 'sitemap.xml'), 'utf8');
  const posts = JSON.parse(await fs.readFile(path.join(rootDir, 'blog', 'posts.json'), 'utf8'));
  const topicEvidenceParts = (topicId) => ({
    repositories: localRepos.filter((repo) => new Set([
      ...(repo.interests || []),
      ...(researchConfig.repoAssignments[repo.name] || [])
    ]).has(topicId)).length,
    publications: staticPublications.filter((publication) => new Set([
      ...(publication.interests || []),
      ...(researchConfig.paperAssignments[publication.title] || [])
    ]).has(topicId)).length,
    posts: posts.filter((post) => (post.research || []).includes(topicId)).length
  });
  const topicEvidenceCount = (topicId) => Object.values(topicEvidenceParts(topicId)).reduce((sum, count) => sum + count, 0);
  const topicEvidenceScore = (topicId) => {
    const evidence = topicEvidenceParts(topicId);
    return evidence.repositories + evidence.posts + (evidence.publications * 2);
  };
  const indexableRoutes = ['en', 'zh'].flatMap((language) => [
    resumeRoute(language),
    researchRoute(language),
    ...researchChildren.filter((child) => topicEvidenceScore(child.id) >= 2).map((child) => researchRoute(language, `${child.id}/`)),
    projectsRoute(language),
    publicationsRoute(language)
  ]);
  for (const route of indexableRoutes) {
    assert.match(sitemap, new RegExp(`<loc>${`${SITE.url}/${route}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`), `${route}: missing from sitemap`);
  }
  for (const child of researchChildren) {
    for (const language of ['en', 'zh']) {
      const route = researchRoute(language, `${child.id}/`);
      const locationPattern = new RegExp(`<loc>${`${SITE.url}/${route}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`);
      const source = await fs.readFile(path.join(rootDir, route, 'index.html'), 'utf8');
      if (topicEvidenceScore(child.id) >= 2) {
        assert.match(sitemap, locationPattern);
        assert.match(source, /<meta name="robots" content="index,follow,max-image-preview:large"/);
      } else {
        assert.doesNotMatch(sitemap, locationPattern);
        assert.match(source, /<meta name="robots" content="noindex,follow"/);
      }
      if (topicEvidenceCount(child.id) === 0) {
        assert.match(source, language === 'zh' ? /正在探索的研究方向/ : /exploratory direction/);
      }
    }
  }

  const entries = matches(sitemap, /<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g);
  assert.equal(entries.length, matches(sitemap, /<url>/g).length, 'every sitemap URL must be well formed');
  for (const [, location, lastmod] of entries) {
    if (!lastmod) continue;
    assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, `${location}: invalid lastmod`);
    assert.ok(Number.isFinite(Date.parse(`${lastmod}T00:00:00Z`)), `${location}: unparseable lastmod`);
  }
  const lastmodByUrl = new Map(entries.map(([, location, lastmod = '']) => [location, lastmod]));
  assert.equal(lastmodByUrl.get(`${SITE.url}/zh/`), lastmodByUrl.get(`${SITE.url}/`));
  const latestProjectDate = localRepos
    .map((repo) => repo.updated_at || repo.pushed_at)
    .filter(Boolean)
    .sort()
    .at(-1)
    .slice(0, 10);
  assert.equal(lastmodByUrl.get(`${SITE.url}/projects/`), latestProjectDate);
  assert.equal(lastmodByUrl.get(`${SITE.url}/publications/`), '2026-07-12');
  for (const child of researchChildren.filter((item) => topicEvidenceScore(item.id) < 2)) {
    assert.equal(lastmodByUrl.get(`${SITE.url}/research/${child.id}/`), undefined, 'thin research topics must stay out of the sitemap');
  }
  assert.equal(lastmodByUrl.get(`${SITE.url}/resume/`), '', 'profile lastmod must be omitted without a reliable source date');
  assert.equal(lastmodByUrl.get(`${SITE.url}/zh/resume/`), '', 'Chinese profile lastmod must be omitted without a reliable source date');
  assert.match(
    sitemap,
    /<loc>https:\/\/wcx12\.github\.io\/wcx12\/blog\/posts\/building-a-research-writing-system\/<\/loc><lastmod>2026-07-11<\/lastmod>/
  );
});

test('RSS declares itself and preserves post taxonomy', async () => {
  const rss = await fs.readFile(path.join(rootDir, 'rss.xml'), 'utf8');
  assert.match(rss, /xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom"/);
  assert.match(rss, /xmlns:content="http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/"/);
  assert.match(rss, /xmlns:dc="http:\/\/purl\.org\/dc\/elements\/1\.1\/"/);
  assert.match(rss, /<atom:link href="https:\/\/wcx12\.github\.io\/wcx12\/rss\.xml" rel="self" type="application\/rss\+xml" \/>/);
  assert.match(rss, /<category>Engineering<\/category>/);
  assert.match(rss, /<category>research-workflow<\/category>/);
  assert.match(rss, /<dc:creator>Chenxu Wang<\/dc:creator>/);
  assert.match(rss, /<content:encoded><!\[CDATA\[[\s\S]+?<\/content:encoded>/);
  assert.match(
    rss,
    /src="https:\/\/wcx12\.github\.io\/wcx12\/blog\/posts\/building-a-research-writing-system\/media\/publishing-flow\.png\?v=[a-f0-9]{12}"/
  );
});

test('fixed routes ignore stored language while preserving theme selection', async () => {
  const [source, styles] = await Promise.all([
    fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.js'), 'utf8'),
    fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.css'), 'utf8')
  ]);
  assert.match(source, /const fixedLanguage = document\.documentElement\.dataset\.fixedLanguage/);
  assert.match(source, /normalizeLang\(fixedLanguage \|\| localStorage\.getItem\(LANG_KEY\)/);
  assert.match(source, /if \(fixedLanguage\) localStorage\.setItem\(LANG_KEY, currentLang\)/);
  assert.match(source, /if \(!fixedLanguage\) localStorage\.setItem\(LANG_KEY, currentLang\)/);
  assert.match(source, /applyTheme\(localStorage\.getItem\(THEME_KEY\) \|\| 'neon'\)/);
  assert.match(source, /blogMenu\?\.addEventListener\('focusout',[\s\S]*?!blogMenu\.contains\(event\.relatedTarget\)[\s\S]*?setBlogMenuOpen\(false\)/);
  assert.match(styles, /\.blog-hint summary:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--pink\);[^}]*outline-offset:\s*3px;/s);
  assert.doesNotMatch(styles, /\.blog-hint summary:focus-visible\s*\{[^}]*outline:\s*none/s);
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
  const repositorySync = source.indexOf('- name: Synchronize public repository metadata');
  const sourceValidation = source.indexOf('- name: Validate source content');
  const build = source.indexOf('- name: Build site');
  const generatedValidation = source.indexOf('- name: Validate generated site');
  const packageArtifact = source.indexOf('- name: Package public Pages artifact');
  const validateArtifact = source.indexOf('- name: Validate public Pages artifact');
  const uploadArtifact = source.indexOf('- name: Upload GitHub Pages artifact');
  const commit = source.indexOf('- name: Commit generated site');
  assert.ok(repositorySync < sourceValidation
    && sourceValidation < build
    && build < generatedValidation
    && generatedValidation < packageArtifact
    && packageArtifact < validateArtifact
    && validateArtifact < uploadArtifact
    && uploadArtifact < commit, 'scheduled publishing steps are in an unsafe order');
  assert.match(source, /if: github\.event_name == 'schedule' \|\| github\.event_name == 'workflow_dispatch'/);
  assert.match(source, /id: repository_sync\s*\n\s*if:[^\n]+\n\s*continue-on-error: true/);
  assert.match(source, /run: node scripts\/sync-github-repos\.mjs/);
  assert.match(source, /if: steps\.repository_sync\.outcome == 'failure'/);
  assert.match(source, /building from the last committed snapshot/);
  assert.match(source, /git add site-data\.js index\.html blog research projects publications zh resume/);
  assert.match(source, /persist-credentials: false/);
  assert.match(source, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(source, /pages: write/);
  assert.match(source, /id-token: write/);
  assert.match(source, /github\.repository_owner == 'wcx12'/);
  assert.match(source, /github\.ref_name == github\.event\.repository\.default_branch/);
  assert.match(source, /concurrency:\s*\n\s*group: portfolio-publish-\$\{\{ github\.repository \}\}\s*\n\s*cancel-in-progress: false/);
  assert.doesNotMatch(source, /\n\s+paths:/, 'every default-branch push must be eligible to publish the explicit public artifact');
  assert.match(source, /actions\/configure-pages@[a-f0-9]{40}/);
  assert.match(source, /actions\/upload-pages-artifact@[a-f0-9]{40}/);
  assert.match(source, /actions\/deploy-pages@[a-f0-9]{40}/);
  assert.match(source, /path: output\/pages/);
  assert.match(source, /include-hidden-files: true/);
  const quality = await fs.readFile(path.join(rootDir, '.github', 'workflows', 'quality.yml'), 'utf8');
  assert.match(quality, /- name: Validate rebuilt site\s*\n\s*run: npm run validate/);
  assert.match(quality, /npm run package:pages && npm run test:pages/);
  assert.match(quality, /git diff --exit-code -- index\.html blog research projects publications zh resume/);
});

test('research mapping workflow validates, rebuilds, and commits to the protected default branch', async () => {
  const workflow = await fs.readFile(path.join(rootDir, '.github', 'workflows', 'research-config-update.yml'), 'utf8');
  const applyScript = await fs.readFile(path.join(rootDir, 'scripts', 'apply-research-config.mjs'), 'utf8');
  const schema = await fs.readFile(path.join(rootDir, 'scripts', 'research-config-schema.js'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /if: \$\{\{ github\.repository_owner == 'wcx12' && github\.ref_name == github\.event\.repository\.default_branch \}\}/);
  assert.match(workflow, /environment: github-pages/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /concurrency:\s*\n\s*group: portfolio-publish-\$\{\{ github\.repository \}\}\s*\n\s*cancel-in-progress: false/);
  assert.match(workflow, /RESEARCH_CONFIG_UPDATE_BASE64: \$\{\{ inputs\.update_payload_base64 \}\}/);
  const sync = workflow.indexOf('name: Synchronize target branch');
  const validate = workflow.indexOf('name: Validate submitted mapping');
  const build = workflow.indexOf('name: Build site');
  const generatedValidation = workflow.indexOf('name: Validate generated site');
  const packageArtifact = workflow.indexOf('name: Package public Pages artifact');
  const uploadArtifact = workflow.indexOf('name: Upload GitHub Pages artifact');
  const commit = workflow.indexOf('name: Commit mapping');
  const deployArtifact = workflow.indexOf('name: Deploy GitHub Pages artifact');
  assert.ok(sync < validate && validate < build && build < generatedValidation && generatedValidation < packageArtifact);
  assert.ok(packageArtifact < uploadArtifact && uploadArtifact < commit && commit < deployArtifact);
  assert.ok(validate < workflow.indexOf('GH_TOKEN: ${{ github.token }}'));
  assert.match(workflow, /git add research-config\.json index\.html blog research projects publications zh resume publications\.md rss\.xml sitemap\.xml package-lock\.json/);
  assert.match(workflow, /actions\/configure-pages@[a-f0-9]{40}/);
  assert.match(workflow, /actions\/upload-pages-artifact@[a-f0-9]{40}/);
  assert.match(workflow, /actions\/deploy-pages@[a-f0-9]{40}/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.doesNotMatch(workflow, /pages\/builds/);
  assert.match(applyScript, /normalizeResearchConfigUpdatePayload/);
  assert.match(schema, /payload\.version !== 1/);
  assert.match(schema, /payload\.expected_sha256/);
  assert.match(schema, /config: normalizeResearchConfigValue\(payload\.config\)/);
  assert.match(applyScript, /const configPath = path\.join\(rootDir, 'research-config\.json'\)/);
  assert.match(applyScript, /currentHash !== expectedHash/);
  assert.doesNotMatch(applyScript, /process\.env\.GH_TOKEN|github\.com/);
});

test('local draft preview rejects rebinding and symlink escapes', async () => {
  const source = await fs.readFile(path.join(rootDir, 'scripts', 'serve-preview.mjs'), 'utf8');
  const buildSource = await fs.readFile(path.join(rootDir, 'scripts', 'build-blog.mjs'), 'utf8');
  assert.match(source, /allowedHosts = new Set\(\[`\$\{host\}:\$\{port\}`, `localhost:\$\{port\}`\]\)/);
  assert.match(source, /const previewRootReal = await fs\.realpath\(previewRoot\)/);
  assert.match(source, /async function confinedRealPath\(target\)/);
  assert.match(source, /path\.relative\(previewRootReal, realTarget\)/);
  assert.match(source, /if \(!allowedHosts\.has\(requestHost\)\)/);
  assert.match(source, /'X-Frame-Options': 'DENY'/);
  assert.match(buildSource, /const scaffold = \[[\s\S]*?'script\.js',[\s\S]*?'homepage-i18n\.js',[\s\S]*?'site-data\.js'/, 'draft preview must include the homepage translation module');
  assert.match(buildSource, /const scaffold = \[[\s\S]*?'blog',[\s\S]*?'projects',[\s\S]*?'resume'/, 'draft preview navigation must include the public Projects route');
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
