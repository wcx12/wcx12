import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { localRepos, staticPublications } from '../site-data.js';
import { homepageSeo } from '../homepage-i18n.js';
import { SITE, loadPosts, slugify } from './blog-content.mjs';
import {
  PUBLICATION_STATUS_LABELS,
  REPOSITORY_STAGE_LABELS,
  assignedResearchIds,
  classifyResearchTopic,
  compareRepositoriesByRelevance,
  compareResearchTopics,
  publicationStatusKey,
  publicationStatusLabel,
  repositoryStageKey,
  repositoryStageLabel
} from './portfolio-ranking.js';

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

function publicationRoute(language, publication) {
  return `${publicationsRoute(language)}${publication.slug}/`;
}

function projectsRoute(language) {
  return `${language === 'zh' ? 'zh/' : ''}projects/`;
}

const staticRoutes = ['en', 'zh'].flatMap((language) => [
  resumeRoute(language),
  researchRoute(language),
  ...researchChildren.map((child) => researchRoute(language, `${child.id}/`)),
  projectsRoute(language),
  publicationsRoute(language),
  ...staticPublications.map((publication) => publicationRoute(language, publication))
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
  const stageKey = repositoryStageKey(repo);
  if (stageKey === 'teaching_materials' || stageKey === 'coursework') return 'LearningResource';
  if (stageKey === 'planning') return 'CreativeWork';
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
    'content.css',
    'styles.css',
    'theme-init.js',
    'homepage-bootstrap.js',
    'script.js',
    'homepage-i18n.js',
    'site-data.js',
    'research-canvas.js',
    'repo-map.js',
    'blog-src/assets/blog.css',
    'blog-src/assets/blog.js',
    'node_modules/katex/dist/katex.min.css',
    'research-config.json',
    'resume.md',
    'resume.zh.md',
    'scripts/blog-content.mjs',
    'scripts/blog-discovery.mjs',
    'scripts/portfolio-ranking.js',
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

test('site build protects generated output with rollback before destructive work', async () => {
  const source = await fs.readFile(path.join(rootDir, 'scripts', 'build-blog.mjs'), 'utf8');
  const mainSource = source.slice(source.indexOf('async function main()'));
  const backupIndex = mainSource.indexOf('await createGeneratedSiteBackup()');
  const clearIndex = mainSource.indexOf('await clearGeneratedDirectories()');
  assert.ok(backupIndex >= 0, 'build must create a generated-site backup');
  assert.ok(clearIndex > backupIndex, 'backup must complete before generated directories are cleared');
  assert.match(mainSource, /catch \(buildError\)[\s\S]*?await restoreGeneratedSite\(backup\)/);
  assert.match(source, /const generatedDirectories = \['blog', 'projects', 'resume', 'research', 'publications', 'zh'\]/);
  assert.match(source, /'blog-src\/assets\/blog\.css'[\s\S]*?'node_modules\/katex\/dist\/katex\.min\.css'/);
});

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
    assert.match(source, /<meta\s+name="referrer"\s+content="strict-origin-when-cross-origin"\s*\/>/i, `${relative}: missing referrer policy`);

    if (relative !== '404.html') {
      assert.match(source, /<link\s+rel="canonical"/i, `${relative}: missing canonical URL`);
      assert.match(source, /class="skip-link"[^>]+href="#main-content"/i, `${relative}: missing skip link`);
      assert.match(source, /<main\s+[^>]*id="main-content"/i, `${relative}: missing main target`);
      assert.doesNotMatch(source, /fonts\.(?:googleapis|gstatic)\.com/i, `${relative}: external font dependency returned`);
      const fontPreloads = matches(source, /<link\b[^>]*rel="preload"[^>]*as="font"[^>]*>/gi);
      assert.equal(fontPreloads.length, 1, `${relative}: only the primary UI font should be preloaded`);
      assert.match(fontPreloads[0][0], /space-grotesk-latin\.woff2[^>]*type="font\/woff2"[^>]*crossorigin/i, `${relative}: primary font preload is incomplete`);
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
    assert.match(source, /<details class="blog-menu" open>[\s\S]*?<summary class="blog-menu-toggle"[^>]+>[^<]+<\/summary>/);
    assert.doesNotMatch(source.match(/<summary class="blog-menu-toggle"[\s\S]*?<\/summary>/)?.[0] || '', /aria-label=/);
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
  assert.doesNotMatch(source, /class="blog-hero-actions"|href="archive\//, 'single-post mode must not duplicate its only discovery route');
  assert.equal((source.match(/class="blog-card"/g) || []).length, 1, 'the only article must appear exactly once');
  const articleSource = await fs.readFile(path.join(rootDir, 'blog', 'posts', posts[0].slug, 'index.html'), 'utf8');
  assert.doesNotMatch(articleSource, /href="\.\.\/\.\.\/tags\//, 'single-use tags should not lead to thin collection pages');
  assert.match(articleSource, /<span class="blog-tag">personal-site<\/span>/);
  assert.doesNotMatch(articleSource, /class="blog-prev-next"/, 'an only article must not end with an empty post-navigation control');
  assert.doesNotMatch(articleSource, /Homepage Lab/, 'a single article must not imply a nonexistent series');
  const sitemapSource = await fs.readFile(path.join(rootDir, 'sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemapSource, /\/blog\/(?:archive|tags)\//, 'thin discovery pages must stay out of the sitemap');
});

test('generated content routes load the compact shared stylesheet', async () => {
  const pages = [
    ...staticRouteFiles,
    ...await walk(path.join(rootDir, 'blog'), (file) => file.endsWith('.html'))
  ];
  for (const file of pages) {
    const source = await fs.readFile(file, 'utf8');
    const relative = path.relative(rootDir, file).replace(/\\/g, '/');
    assert.match(source, /href="(?:\.\.\/)*content\.css\?v=[a-f0-9]{12}"/, `${relative}: compact shared stylesheet is missing`);
    assert.doesNotMatch(source, /href="(?:\.\.\/)*styles\.css\?v=/, `${relative}: homepage stylesheet must not leak into content routes`);
    assert.match(source, /<details class="blog-menu" open>/, `${relative}: desktop navigation must remain available without JavaScript`);
  }
});

test('compact content styles keep homepage themes and fonts in sync', async () => {
  const [homepageStyles, contentStyles] = await Promise.all([
    fs.readFile(path.join(rootDir, 'styles.css'), 'utf8'),
    fs.readFile(path.join(rootDir, 'content.css'), 'utf8')
  ]);
  const normalize = (value) => value.replace(/\s+/g, ' ').trim();
  const ruleBody = (source, selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] || '';
  };
  for (const selector of [':root', ':root[data-theme="warm"]', ':root[data-theme="mono"]']) {
    assert.equal(normalize(ruleBody(contentStyles, selector)), normalize(ruleBody(homepageStyles, selector)), `${selector} tokens drifted`);
  }
  const fontFaces = (source) => matches(source, /@font-face\s*\{([^}]*)\}/g).map(([, body]) => normalize(body));
  assert.deepEqual(fontFaces(contentStyles), fontFaces(homepageStyles));
});

test('blog presents the agreed fieldnotes identity', async () => {
  const indexSource = await fs.readFile(path.join(rootDir, 'blog', 'index.html'), 'utf8');
  const clientSource = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.js'), 'utf8');
  const styleSource = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.css'), 'utf8');
  assert.match(indexSource, />Research Fieldnotes<\/h1>/);
  assert.match(indexSource, /class="blog-hero-author"[\s\S]*?href="\.\.\/resume\/"[^>]*rel="author"[^>]*>Chenxu Wang<\/a>/);
  assert.match(indexSource, /data-blog-nav-en="\.\.\/research\/" data-blog-nav-zh="\.\.\/zh\/research\/"/);
  assert.match(indexSource, /data-blog-nav-en="\.\.\/resume\/" data-blog-nav-zh="\.\.\/zh\/resume\/"/);
  assert.match(clientSource, /hero_title:\s*'知研札记'/);
  assert.match(clientSource, /page_title:\s*'知研札记'/);
  assert.match(clientSource, /hero_kicker:\s*'研究 · 工程 · 思考'/);
  assert.match(
    clientSource,
    /hero_desc:\s*'记录研究工具、可复现工作流、技术写作与本网站背后的系统。当前文章以英文发布。'/,
  );
  assert.match(indexSource, /Notes on research tooling, reproducible workflows, technical writing, and the systems behind this site\./);
  assert.match(indexSource, /id="blogLangToggle"[^>]+lang="zh-CN"[^>]+aria-label="切换到中文界面"/);
  assert.match(clientSource, /document\.title\s*=\s*t\('page_title'\)/);
  assert.match(clientSource, /document\.documentElement\.lang\s*=\s*uiLang/);
  assert.match(clientSource, /querySelectorAll\('\[data-blog-nav-en\]\[data-blog-nav-zh\]'\)[\s\S]*?node\.dataset\.blogNavZh[\s\S]*?node\.setAttribute\('href', href\)/);
  assert.match(styleSource, /html\[data-ui-lang="zh"\] \.blog-hero h1/);
  assert.match(indexSource, /<summary[^>]*data-blog-i18n-aria="hint_summary"[^>]*>[\s\S]*?class="blog-hint-label"/);
  assert.match(styleSource, /\.blog-hero\s*\{[^}]*border-top:\s*3px solid var\(--cyan\)[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
  assert.match(styleSource, /\.blog-post-card\s*\{[^}]*border:\s*0[^}]*border-radius:\s*0[^}]*background:\s*transparent/s);
  assert.doesNotMatch(styleSource, /\.blog-body::before\s*\{[^}]*radial-gradient/s);
  assert.match(styleSource, /\.blog-content a\s*\{[^}]*overflow-wrap:\s*anywhere/s, 'long DOI links must wrap on mobile');
  assert.match(styleSource, /@media \(max-width: 560px\)[\s\S]*?\.blog-post-title\s*\{[^}]*font-size:\s*clamp\(1\.9rem, 8vw, 2\.55rem\)/s);
  assert.match(styleSource, /:root\[data-theme="mono"\] \.blog-card-meta,[\s\S]*?:root\[data-theme="mono"\] \.blog-content a,[\s\S]*?color:\s*var\(--text\)/s);
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
  const clientSource = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.js'), 'utf8');
  const articleFiles = await walk(path.join(rootDir, 'blog', 'posts'), (file) => file.endsWith('index.html'));
  for (const file of articleFiles) {
    const source = await fs.readFile(file, 'utf8');
    assert.match(source, /<article\s+class="blog-post-card"\s+lang="[a-z-]+"/i, `${path.relative(rootDir, file)}: article language must remain explicit`);
    for (const [, pre] of matches(source, /(<pre\b[^>]*>)/gi)) {
      assert.match(pre, /tabindex="0"/i, `${path.relative(rootDir, file)}: scrollable pre must be focusable`);
    }
    assert.match(source, /<details class="blog-toc blog-toc-mobile">[\s\S]*?<summary[^>]*data-blog-i18n="toc_title"/, `${path.relative(rootDir, file)}: missing collapsible mobile contents navigation`);
    assert.doesNotMatch(source, /class="code-copy"/, `${path.relative(rootDir, file)}: script-only copy controls must not exist before enhancement`);
    if (file.includes('building-a-research-writing-system')) {
      assert.match(source, /href="https:\/\/github\.com\/wcx12\/wcx12\/blob\/main\/scripts\/blog-content\.mjs"/);
      assert.match(source, /href="https:\/\/github\.com\/wcx12\/wcx12\/blob\/main\/\.github\/workflows\/blog-build\.yml"/);
      assert.match(source, /href="https:\/\/wcx12\.github\.io\/wcx12\/research\/"/);
    }
  }
  assert.match(clientSource, /document\.createElement\('button'\)[\s\S]*?button\.className = 'code-copy'/);
  assert.match(clientSource, /button\.setAttribute\('aria-live', 'polite'\)/);
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
  assert.match(article, /publishing-flow\.png[^>]+alt="[^"]+"[^>]+width="1200"[^>]+height="460"[^>]+loading="lazy"[^>]+decoding="async"[^>]+referrerpolicy="no-referrer"/);
  assert.match(article, /href="\.\.\/\.\.\/"[^>]*aria-current="location"[^>]*>Writing<\/a>/);
  assert.match(article, /Content-Security-Policy[^>]+img-src 'self' data:; connect-src 'self'/);
  assert.doesNotMatch(article, /Content-Security-Policy[^>]+img-src[^>]+https:/);
  assert.match(article, /<meta property="article:author" content="https:\/\/wcx12\.github\.io\/wcx12\/" \/>/);
  assert.match(article, /<meta property="article:section" content="Engineering" \/>/);
  for (const tag of ['personal-site', 'static-site', 'research-workflow']) {
    assert.match(article, new RegExp(`<meta property="article:tag" content="${tag}" \\/>`));
  }
});

test('all configured fixed-language portfolio routes exist without stale generated HTML', async () => {
  assert.equal(staticRoutes.length, 2 * (researchChildren.length + staticPublications.length + 4), 'fixed routes must follow the current research and publication configuration');
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
    assert.equal(metaContent(source, 'og:site_name'), homepageSeo[isZh ? 'zh' : 'en'].siteName, `${route}: portfolio site name drifted`);
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

test('machine stage and publication status keys match canonical bilingual labels', () => {
  for (const repo of localRepos) {
    const stageKey = repositoryStageKey(repo);
    assert.notEqual(stageKey, 'unknown', `${repo.name}: unknown stage key`);
    assert.deepEqual(repo.stage, REPOSITORY_STAGE_LABELS[stageKey], `${repo.name}: stage labels drifted from stage_key`);
  }
  for (const publication of staticPublications) {
    const statusKey = publicationStatusKey(publication);
    assert.notEqual(statusKey, 'unknown', `${publication.title}: unknown publication status key`);
    assert.equal(publication.status, publicationStatusLabel(publication, 'en'));
    assert.equal(publication.statusZh, publicationStatusLabel(publication, 'zh'));
    assert.equal(publicationStatusLabel(publication, 'en'), PUBLICATION_STATUS_LABELS[statusKey].en);
  }
});

test('research JSON-LD follows configured topics and visible evidence exactly', async () => {
  const posts = JSON.parse(await fs.readFile(path.join(rootDir, 'blog', 'posts.json'), 'utf8'));
  const evidenceFor = (child) => [
    ...localRepos
      .filter((repo) => assignedResearchIds(repo, researchConfig.repoAssignments, researchChildren.map((item) => item.id)).includes(child.id))
      .map((repo) => ({ type: 'SoftwareSourceCode', key: `repo:${repo.name}`, value: repo })),
    ...staticPublications
      .filter((publication) => new Set([...(publication.interests || []), ...(researchConfig.paperAssignments[publication.title] || [])]).has(child.id))
      .map((publication) => ({ type: 'ScholarlyArticle', key: `paper:${publication.doi}`, value: publication })),
    ...posts
      .filter((post) => post.research.includes(child.id))
      .map((post) => ({ type: 'BlogPosting', key: `post:${post.slug}`, value: post }))
  ];
  const rankedTopics = researchChildren.map((child, configIndex) => {
    const evidence = evidenceFor(child);
    return {
      child,
      evidence,
      configIndex,
      classification: classifyResearchTopic(child, evidence, { profileAuthor: SITE.author })
    };
  }).sort(compareResearchTopics);
  assert.deepEqual(
    rankedTopics.map(({ child }) => child.id),
    ['vpr', 'medical-image-analysis', 'point-cloud-registration', 'agent', 'ai4edu']
  );
  for (const language of ['en', 'zh']) {
    const indexRoute = researchRoute(language);
    const indexSource = await fs.readFile(path.join(rootDir, indexRoute, 'index.html'), 'utf8');
    const indexMetadata = jsonLdFor(indexSource);
    const collection = graphNode(indexMetadata, 'CollectionPage');
    const topics = graphNode(indexMetadata, 'ItemList');
    assert.ok(collection, `${indexRoute}: missing CollectionPage`);
    assert.ok(topics, `${indexRoute}: missing ItemList`);
    assert.equal(topics.numberOfItems, researchChildren.length);
    assert.deepEqual(topics.itemListElement.map((entry) => entry.item.termCode), rankedTopics.map(({ child }) => child.id));
    assert.ok(topics.itemListElement.every((entry) => entry.item['@type'] === 'DefinedTerm'));
    assert.match(indexSource, new RegExp(language === 'zh' ? '已有公开证据' : 'Evidence-backed research'));
    assert.match(indexSource, new RegExp(language === 'zh' ? '探索中' : '>Exploring<'));
    for (const { child, classification } of rankedTopics) {
      const title = (child.title[language] || child.title.en).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.match(
        indexSource,
        new RegExp(`<a class="research-topic-link" data-topic-tier="${classification.tier}"[^>]*>(?:(?!<\\/a>)[\\s\\S])*?<strong>${title}<\\/strong>`),
        `${indexRoute}: ${child.id} is shown in the wrong evidence tier`
      );
    }
    assert.match(indexSource, new RegExp(language === 'zh' ? '1 篇已发表论文' : '1 published paper'));
    assert.match(indexSource, new RegExp(language === 'zh' ? '暂无公开证据' : 'No public evidence yet'));

    for (const child of researchChildren) {
      const route = researchRoute(language, `${child.id}/`);
      const source = await fs.readFile(path.join(rootDir, route, 'index.html'), 'utf8');
      const metadata = jsonLdFor(source);
      const page = graphNode(metadata, 'CollectionPage');
      const list = graphNode(metadata, 'ItemList');
      const expectedKeys = evidenceFor(child).map((item) => item.key).sort();
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
        `${SITE.url}/${language === 'zh' ? 'zh/' : ''}#research/${child.id}/demo`,
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
        assert.equal(item.creativeWorkStatus, repositoryStageLabel(repo, language), `${route}: repository stage is missing from JSON-LD`);
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
  const [english, chinese, chineseHome, profileStyles, profileClient] = await Promise.all([
    fs.readFile(path.join(rootDir, 'resume', 'index.html'), 'utf8'),
    fs.readFile(path.join(rootDir, 'zh', 'resume', 'index.html'), 'utf8'),
    fs.readFile(path.join(rootDir, 'zh', 'index.html'), 'utf8'),
    fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.css'), 'utf8'),
    fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.js'), 'utf8')
  ]);
  assert.match(english, /<title>Academic Profile \| Chenxu Wang \(wcx12\)<\/title>/);
  assert.match(chinese, /<title>学术履历 \| Chenxu Wang \(wcx12\)<\/title>/);
  assert.match(english, /<h2 id="profile-research-interests-title">Research Interests<\/h2>/);
  assert.match(chinese, /<h2 id="profile-研究兴趣-title">研究兴趣<\/h2>/);
  assert.match(chinese, /本科阶段，2022\.09-2026\.06/);
  assert.match(chinese, /创业者，2026\.3-至今/);
  assert.match(chinese, /创业实践中 · 深圳后浪澎湃/);
  assert.match(chinese, /深圳市后浪澎湃科技有限责任公司/);
  assert.match(english, /1 published · 1 in press/);
  assert.match(chinese, /1 篇已发表 · 1 篇待刊/);
  assert.doesNotMatch(chinese, />Research Interests</);
  assert.doesNotMatch(chinese, />Current Goal</);
  assert.doesNotMatch(english, /class="blog-post-card research-profile"/);
  for (const source of [english, chinese]) {
    assert.match(source, /<header class="profile-masthead">/);
    assert.match(source, /<p class="profile-identity"><span class="profile-handle">@wcx12<\/span>/);
    assert.match(source, /<div class="profile-command">[\s\S]*?<p class="profile-status">/);
    assert.match(source, /<dl class="profile-facts">/);
    assert.match(source, /<details class="profile-directory" open>[\s\S]*?<summary class="profile-directory-toggle">/);
    assert.match(source, /<strong data-profile-current>/);
    assert.doesNotMatch(source, /class="profile-rail"/);
    assert.doesNotMatch(source, /<header class="profile-section-head">\s*<span/);
    assert.doesNotMatch(source, /<span aria-hidden="true">P\d{2}<\/span>/);
    assert.equal(matches(source, /data-profile-section="[^"]+"/g).length, 6);
    for (const kind of ['education', 'experience', 'publications', 'interests', 'projects', 'skills']) {
      assert.match(source, new RegExp(`data-profile-kind="${kind}"`));
    }
    assert.ok(source.indexOf('data-profile-kind="publications"') < source.indexOf('data-profile-kind="interests"'));
    assert.equal(matches(source, /class="resume-publication-entry"/g).length, staticPublications.length);
    assert.equal(matches(source, /class="resume-publication-index"/g).length, staticPublications.length);
    assert.equal(matches(source, /class="resume-author-self"/g).length, staticPublications.length);
    const profileNavigation = matches(source, /class="profile-section-nav"[\s\S]*?<\/nav>/g)[0][0];
    assert.equal(profileNavigation.match(/<a href=/g)?.length, 6);
    assert.equal(profileNavigation.match(/<a [^>]*aria-label=/g)?.length, 6);
    assert.equal(profileNavigation.match(/data-mobile-label=/g)?.length, 6);
    assert.equal(metaContent(source, 'og:type'), 'profile');
    assert.equal(metaContent(source, 'profile:first_name'), 'Chenxu');
    assert.equal(metaContent(source, 'profile:last_name'), 'Wang');
    assert.equal(metaContent(source, 'profile:username'), 'wcx12');
  }
  assert.match(chinese, /<h3 lang="en"><a href="\.\.\/publications\/tf-vpr\/">TF-VPR/);
  for (const publication of staticPublications) {
    assert.match(english, new RegExp(publication.doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(chinese, new RegExp(publication.doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(english, new RegExp(`href="\\.\\.\\/publications\\/${publication.slug}\\/"`));
    assert.match(chinese, new RegExp(`href="\\.\\.\\/publications\\/${publication.slug}\\/"`));
  }
  assert.match(profileStyles, /\.profile-layout\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(150px, 176px\) minmax\(0, 1fr\)/s);
  assert.match(profileStyles, /\.profile-directory\s*\{[^}]*position:\s*sticky/s);
  assert.match(profileStyles, /\.profile-section\s*\{[^}]*display:\s*block/s);
  assert.match(profileStyles, /\.profile-section\[data-profile-kind="projects"\] \.profile-section-body > ul\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(profileStyles, /\.resume-publication-entry\s*\{[^}]*border-radius:\s*0[^}]*background:\s*transparent/s);
  assert.equal(matches(profileStyles, /Present the profile as an academic dossier instead of a dashboard/g).length, 1);
  assert.doesNotMatch(profileStyles, /\.resume-publication-entry\s*\{[^}]*border-radius:\s*8px/s);
  assert.match(profileStyles, /\.research-profile\[lang="zh-CN"\] :is\(\.profile-heading h1, \[lang="en"\]\)/s);
  assert.doesNotMatch(profileStyles, /\.profile-heading h1\s*\{[^}]*clamp\([^}]*vw/s);
  assert.match(profileStyles, /@media \(max-width: 560px\)[\s\S]*?\.profile-directory-toggle\s*\{[^}]*display:\s*grid[^}]*min-height:\s*48px/s);
  assert.match(profileStyles, /@media \(max-width: 560px\)[\s\S]*?\.profile-section-nav\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)[^}]*overflow:\s*visible/s);
  assert.match(profileStyles, /@media \(max-width: 880px\)[\s\S]*?\.profile-directory\s*\{[^}]*position:\s*static/s);
  assert.match(profileStyles, /@media \(max-width: 880px\)[\s\S]*?\.profile-section\s*\{[^}]*scroll-margin-top:\s*94px/s);
  assert.match(profileClient, /matchMedia\('\(max-width: 560px\)'\)/);
  assert.match(profileClient, /directory\.removeAttribute\('open'\)/);
  assert.match(profileClient, /directoryCurrent\.textContent/);
  assert.match(profileStyles, /@page\s*\{[^}]*size:\s*A4/s);
  assert.match(profileStyles, /@page\s*\{[^}]*margin:\s*0/s);
  assert.match(profileStyles, /@media print[\s\S]*?:root\[data-theme="warm"\],[\s\S]*?:root\[data-theme="mono"\]\s*\{/s);
  assert.match(profileStyles, /@media print[\s\S]*?html,[\s\S]*?\.blog-body\s*\{[^}]*background:\s*#ffffff !important/s);
  assert.match(profileStyles, /@media print[\s\S]*?\.blog-shell\s*\{[^}]*padding:\s*8mm 12mm/s);
  assert.match(profileStyles, /@media print[\s\S]*?\.profile-directory,[\s\S]*?display:\s*none !important/s);
  assert.match(profileStyles, /@media print[\s\S]*?\.resume-publication-index\s*\{[^}]*display:\s*block/s);
  assert.doesNotMatch(profileStyles, /counter-reset:\s*profile-project/);
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
  const rankingOptions = {
    repoAssignments: researchConfig.repoAssignments,
    validTopicIds: researchChildren.map((child) => child.id)
  };
  const expectedOrder = [...localRepos]
    .sort((left, right) => compareRepositoriesByRelevance(left, right, rankingOptions))
    .map((repo) => repo.name);
  const expectedResearch = expectedOrder.filter((name) => assignedResearchIds(
    localRepos.find((repo) => repo.name === name),
    rankingOptions.repoAssignments,
    rankingOptions.validTopicIds
  ).length);
  const expectedOther = expectedOrder.filter((name) => !expectedResearch.includes(name));
  for (const language of ['en', 'zh']) {
    const route = projectsRoute(language);
    const source = await fs.readFile(path.join(rootDir, route, 'index.html'), 'utf8');
    const metadata = jsonLdFor(source);
    const page = graphNode(metadata, 'CollectionPage');
    const list = graphNode(metadata, 'ItemList');
    assert.ok(page, `${route}: missing CollectionPage`);
    assert.equal(page.mainEntity['@id'], `${SITE.url}/${route}#projects`);
    assert.equal(list.numberOfItems, localRepos.length);
    assert.deepEqual(list.itemListElement.map((item) => item.name), expectedOrder, `${route}: JSON-LD must lead with research-relevant work`);
    assert.deepEqual(list.itemListElement.map((item) => item.name).sort(), expectedNames);
    const visibleOrder = matches(source, /data-evidence-key="repo:([^"]+)"/g).map(([, name]) => name);
    assert.deepEqual(visibleOrder, expectedOrder, `${route}: visible order must follow research relevance`);
    const researchGroup = source.match(/<section class="research-section project-evidence-group" data-project-tier="research-linked"[\s\S]*?<\/section>/)?.[0] || '';
    const otherGroup = source.match(/<section class="research-section project-evidence-group" data-project-tier="other-public-work"[\s\S]*?<\/section>/)?.[0] || '';
    assert.deepEqual(matches(researchGroup, /data-evidence-key="repo:([^"]+)"/g).map(([, name]) => name), expectedResearch);
    assert.deepEqual(matches(otherGroup, /data-evidence-key="repo:([^"]+)"/g).map(([, name]) => name), expectedOther);
    assert.match(researchGroup, new RegExp(language === 'zh' ? '研究相关仓库' : 'Research-linked repositories'));
    assert.match(otherGroup, new RegExp(language === 'zh' ? '其它公开工作' : 'Other public work'));
    for (const item of list.itemListElement) {
      const repo = localRepos.find((entry) => entry.name === item.name);
      const expectedDescription = language === 'zh' ? repo.descriptionZh : repo.description;
      assert.equal(item['@type'], expectedRepositorySchemaType(repo), `${route}: wrong schema type for ${repo.name}`);
      assert.equal(item.description, expectedDescription, `${route}: localized description drifted for ${repo.name}`);
      assert.equal(item.creativeWorkStatus, repositoryStageLabel(repo, language));
      if (repo.fork) {
        assert.equal(item.author, undefined, `${route}: fork must not claim the profile owner as author`);
        assert.equal(item.isBasedOn?.url, repo.source.html_url, `${route}: fork is missing upstream attribution`);
        assert.equal(item.isBasedOn?.codeRepository, repo.source.html_url, `${route}: fork upstream repository is incomplete`);
        const escapedName = repo.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const record = source.match(new RegExp(`<article class="research-evidence"[^>]+data-evidence-key="repo:${escapedName}"[\\s\\S]*?<\\/article>`))?.[0] || '';
        assert.match(record, new RegExp(`href="${repo.source.html_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${route}: fork needs a visible upstream link`);
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
      assert.equal(list.itemListElement[index].creativeWorkStatus, publicationStatusLabel(publication, 'en'), `${route}: publication status is missing from JSON-LD`);

      const record = matches(source, /(<article class="research-evidence"[\s\S]*?<\/article>)/g)[index]?.[1] || '';
      const detailRoute = publicationRoute(language, publication);
      const detailUrl = `${SITE.url}/${detailRoute}`;
      const detailHref = record.match(/<h3 class="research-evidence-title"[^>]*><a href="([^"]+)"/i)?.[1];
      assert.ok(detailHref, `${route}: publication ${publication.doi} is missing its local record link`);
      assert.equal(new URL(detailHref, `${SITE.url}/${route}`).href, detailUrl, `${route}: publication record link targets the wrong page`);
      const topicHref = record.match(/<a class="publication-topic-link" href="([^"]+)"/i)?.[1];
      assert.ok(topicHref, `${route}: publication ${publication.doi} is missing its visible topic link`);
      assert.equal(new URL(topicHref, `${SITE.url}/${route}`).href, expectedTopicUrl, `${route}: visible and JSON-LD topic URLs differ`);
      assert.match(record, new RegExp(publication.code_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(record, new RegExp(language === 'zh' ? '本主页 GitHub 账号之外' : 'outside this profile[^<]+GitHub account', 'i'));
      assert.match(record, new RegExp(`${publication.venue} ${publication.volume} \\(${publication.year}\\), ${publication.article_number}`));
      if (publication.status === 'Published') {
        const publishedLabel = publication.publishedLabel?.[language] || publication.publishedLabel?.en || '';
        assert.match(record, new RegExp(publishedLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.doesNotMatch(record, language === 'zh' ? /已发表\s*&middot;/ : /Published\s*&middot;\s*Published/);
      }

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
      if (publicationStatusKey(publication) === 'in_press') {
        assert.match(bibtex, /note = \{In press\}/);
        assert.match(ris, /N1  - In press/);
      } else {
        assert.doesNotMatch(bibtex, /note = \{In press\}/);
        assert.doesNotMatch(ris, /N1  - In press/);
      }

      const detailSource = await fs.readFile(path.join(rootDir, detailRoute, 'index.html'), 'utf8');
      const detailMetadata = jsonLdFor(detailSource);
      const detailPage = graphNode(detailMetadata, 'WebPage');
      const detailArticle = graphNode(detailMetadata, 'ScholarlyArticle');
      assert.ok(detailPage, `${detailRoute}: missing page-level JSON-LD`);
      assert.ok(detailArticle, `${detailRoute}: JSON-LD must describe one paper`);
      assert.equal(detailPage.inLanguage, language === 'zh' ? 'zh-CN' : 'en');
      assert.equal(detailPage.mainEntity?.['@id'], detailArticle['@id']);
      assert.equal(detailArticle.inLanguage, 'en');
      assert.equal(detailArticle.url, detailUrl, `${detailRoute}: article URL must use the local permanent record`);
      assert.equal(detailArticle.sameAs, publication.link, `${detailRoute}: publisher DOI must remain the authoritative external record`);
      assert.equal(detailArticle.mainEntityOfPage?.['@id'], detailUrl, `${detailRoute}: mainEntityOfPage is missing`);
      assert.equal(detailArticle.identifier?.value, publication.doi, `${detailRoute}: DOI identifier changed`);
      assert.equal(detailArticle.creativeWorkStatus, publicationStatusLabel(publication, 'en'));
      assert.deepEqual(detailArticle.author.map((author) => author.name), publication.authors.split(';').map((author) => author.trim()));
      assert.match(detailSource, new RegExp(`<h1 lang="en">${publication.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/h1>`));
      assert.match(detailSource, new RegExp((language === 'zh' ? publication.summaryZh : publication.summary).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.equal(metaContent(detailSource, 'citation_title'), publication.title);
      assert.deepEqual(
        matches(detailSource, /<meta name="citation_author" content="([^"]+)" \/>/g).map(([, author]) => author),
        publication.authors.split(';').map((author) => author.trim()),
        `${detailRoute}: Highwire author order changed`
      );
      assert.equal(metaContent(detailSource, 'citation_publication_date'), publication.citation_date);
      assert.equal(metaContent(detailSource, 'citation_journal_title'), publication.venue);
      assert.equal(metaContent(detailSource, 'citation_volume'), publication.volume);
      assert.equal(metaContent(detailSource, 'citation_firstpage'), publication.article_number);
      assert.equal(metaContent(detailSource, 'citation_doi'), publication.doi);
      assert.equal(metaContent(detailSource, 'citation_abstract_html_url'), detailUrl);
      assert.equal(metaContent(detailSource, 'article:published_time'), publication.published_date);
      assert.match(detailSource, new RegExp(`href="[^"]*citations/${citationStem}\\.bib" download`));
      assert.match(detailSource, new RegExp(`href="[^"]*citations/${citationStem}\\.ris" download`));
    }
    const visibleDois = matches(source, /data-evidence-key="paper:([^"]+)"/g).map(([, doi]) => doi);
    assert.deepEqual(visibleDois, expectedDois, `${route}: visible DOI records differ from JSON-LD`);
    assert.doesNotMatch(source, /DOI-verified/i);
  }
});

test('citation export links keep touch-sized download targets', async () => {
  const styleSource = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.css'), 'utf8');
  assert.match(
    styleSource,
    /\.research-meta a\[download\]\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s
  );
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
  const topicIsIndexable = (child) => child.indexable === true
    ? topicEvidenceCount(child.id) > 0
    : child.indexable === false
      ? false
      : topicEvidenceScore(child.id) >= 2;
  const indexableRoutes = ['en', 'zh'].flatMap((language) => [
    resumeRoute(language),
    researchRoute(language),
    ...researchChildren.filter(topicIsIndexable).map((child) => researchRoute(language, `${child.id}/`)),
    projectsRoute(language),
    publicationsRoute(language),
    ...staticPublications.map((publication) => publicationRoute(language, publication))
  ]);
  for (const route of indexableRoutes) {
    assert.match(sitemap, new RegExp(`<loc>${`${SITE.url}/${route}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`), `${route}: missing from sitemap`);
  }
  for (const child of researchChildren) {
    for (const language of ['en', 'zh']) {
      const route = researchRoute(language, `${child.id}/`);
      const locationPattern = new RegExp(`<loc>${`${SITE.url}/${route}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`);
      const source = await fs.readFile(path.join(rootDir, route, 'index.html'), 'utf8');
      if (topicIsIndexable(child)) {
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
  for (const publication of staticPublications) {
    assert.equal(lastmodByUrl.get(`${SITE.url}/${publicationRoute('en', publication)}`), publication.updated_at);
    assert.equal(lastmodByUrl.get(`${SITE.url}/${publicationRoute('zh', publication)}`), publication.updated_at);
  }
  for (const child of researchChildren.filter((item) => !topicIsIndexable(item))) {
    assert.equal(lastmodByUrl.get(`${SITE.url}/research/${child.id}/`), undefined, 'thin research topics must stay out of the sitemap');
  }
  const latestProfileDate = [latestProjectDate, ...staticPublications.map((publication) => publication.updated_at)]
    .filter(Boolean)
    .sort()
    .at(-1);
  assert.equal(lastmodByUrl.get(`${SITE.url}/resume/`), latestProfileDate);
  assert.equal(lastmodByUrl.get(`${SITE.url}/zh/resume/`), latestProfileDate);
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
  assert.match(source, /function readStorage\(key, fallback = ''\)[\s\S]*?try[\s\S]*?localStorage\.getItem\(key\)[\s\S]*?catch/);
  assert.match(source, /function writeStorage\(key, value\)[\s\S]*?try[\s\S]*?localStorage\.setItem\(key, value\)[\s\S]*?catch/);
  assert.match(source, /normalizeLang\(fixedLanguage \|\| readStorage\(LANG_KEY, 'en'\)\)/);
  assert.match(source, /if \(fixedLanguage\) writeStorage\(LANG_KEY, currentLang\)/);
  assert.match(source, /if \(!fixedLanguage\) writeStorage\(LANG_KEY, currentLang\)/);
  assert.match(source, /applyTheme\(readStorage\(THEME_KEY, 'neon'\)\)/);
  assert.match(source, /langToggle\.lang = currentLang === 'zh' \? 'en' : 'zh-CN'/);
  assert.match(source, /lang_target_aria: '切换到中文界面'/);
  assert.match(source, /lang_target_aria: 'Switch to the English interface'/);
  assert.match(source, /blogMenu\?\.addEventListener\('focusout',[\s\S]*?!blogMenu\.contains\(event\.relatedTarget\)[\s\S]*?setBlogMenuOpen\(false\)/);
  assert.match(source, /window\.matchMedia\('\(min-width: 1024px\)'\)/);
  assert.match(styles, /@media \(max-width: 1023px\)\s*\{[\s\S]*?\.blog-menu:not\(\[open\]\) > \.blog-nav\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /@media \(min-width: 1024px\)\s*\{[\s\S]*?\.blog-menu:not\(\[open\]\) > \.blog-nav\s*\{[^}]*display:\s*flex/s);
  assert.match(styles, /\.blog-menu:not\(\[open\]\) > \.blog-nav\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /\.blog-hint summary:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--pink\);[^}]*outline-offset:\s*3px;/s);
  assert.doesNotMatch(styles, /\.blog-hint summary:focus-visible\s*\{[^}]*outline:\s*none/s);
  assert.doesNotMatch(styles, /\.code-copy:focus-visible\s*\{[^}]*outline:\s*none/s);
  assert.doesNotMatch(styles, /\.research-topic-link:focus-visible\s*\{[^}]*outline:\s*none/s);
  assert.doesNotMatch(styles, /\.code-copy:hover,\s*\.code-copy:focus-visible\s*\{[^}]*outline:\s*none/s);
  assert.doesNotMatch(styles, /\.research-topic-link:hover,\s*\.research-topic-link:focus-visible\s*\{[^}]*outline:\s*none/s);
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
