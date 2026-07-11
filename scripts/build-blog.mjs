import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItKatexModule from 'markdown-it-katex';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import powershell from 'highlight.js/lib/languages/powershell';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import { localRepos, staticPublications } from '../site-data.js';
import {
  SITE,
  excerptText,
  formatDate,
  loadPosts,
  slugify,
  summarizeDiagnostics
} from './blog-content.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, 'blog');
const sourceAssetsDir = path.join(rootDir, 'blog-src', 'assets');
const outputAssetsDir = path.join(outputDir, 'assets');
const researchConfig = JSON.parse(await fs.readFile(path.join(rootDir, 'research-config.json'), 'utf8'));
const researchChildren = researchConfig.interests.flatMap((interest) => interest.children);
const PORTFOLIO_TITLE = 'Chenxu Wang (wcx12)';
let assetVersion = '';
const markdownItKatex = typeof markdownItKatexModule === 'function'
  ? markdownItKatexModule
  : markdownItKatexModule.default;
if (typeof markdownItKatex !== 'function') throw new TypeError('markdown-it-katex did not expose a plugin function');

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseFenceInfo(info = '') {
  const raw = String(info || '').trim();
  if (!raw) return { lang: 'text', label: 'text' };
  const [first] = raw.split(/\s+/);
  const lang = first || 'text';
  const titleMatch = raw.match(/(?:title|file|filename)=["']([^"']+)["']/);
  return {
    lang,
    label: titleMatch?.[1] || lang
  };
}

function renderCodeFence(code, info) {
  const { lang, label } = parseFenceInfo(info);
  const normalizedLang = hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = normalizedLang === 'plaintext'
    ? escapeHtml(code)
    : hljs.highlight(code, { language: normalizedLang, ignoreIllegals: true }).value;
  return `<div class="code-frame"><div class="code-head"><span>${escapeHtml(label)}</span><button class="code-copy" type="button" data-blog-i18n="code_copy">Copy</button></div><pre tabindex="0"><code class="hljs language-${escapeHtml(normalizedLang)}">${highlighted}</code></pre></div>`;
}

function postUrl(post) {
  return `blog/posts/${post.slug}/`;
}

function absoluteUrl(relativePath = '') {
  return `${SITE.url}/${relativePath.replace(/^\/+/, '')}`;
}

function canonicalUrlForFile(filePath) {
  let relative = path.relative(rootDir, filePath).replace(/\\/g, '/');
  relative = relative.replace(/index\.html$/, '');
  return absoluteUrl(relative);
}

function createPageContext(filePath, siteRoot = rootDir) {
  const pageDir = path.dirname(filePath);
  return {
    link(target) {
      const absoluteTarget = path.join(siteRoot, target);
      let relative = path.relative(pageDir, absoluteTarget).replace(/\\/g, '/');
      if (!relative) return './';
      relative = relative.replace(/\/index\.html$/, '/');
      if (relative === 'index.html') return './';
      return relative;
    }
  };
}

function tagHref(ctx, tag) {
  return ctx.link(`blog/tags/${slugify(tag)}/index.html`);
}

function postHref(ctx, post) {
  return ctx.link(`${postUrl(post)}index.html`);
}

const blogText = {
  hint_summary: 'About this area',
  hint_hero: 'This introduction explains what the writing space is for and gives quick routes into the latest notes or the archive.',
  hint_search: 'Use this search to find posts by title, summary, category, tag, or article text.',
  hint_featured: 'Featured posts are the recommended starting points or currently important writing pieces.',
  hint_topics: 'Tags group writing by recurring themes so visitors can browse without knowing exact article titles.',
  hint_recent: 'Recent writing shows the newest published posts, with a link to the full archive.',
  hint_archive: 'The archive keeps all published writing in chronological order.',
  hint_archive_year: 'This year group lists posts published in the selected year.',
  hint_tag: 'This page collects all posts that share the selected tag.',
  hint_tag_results: 'These cards are the posts currently associated with this tag.',
  hint_post: 'This article page contains the full post, metadata, tags, and any code or math examples.',
  hint_toc: 'The contents panel links to major headings in the current article.',
  hint_related: 'Related writing appears here when another post shares tags or research areas.',
  hint_prev_next: 'Use these links to move between newer and older posts.'
};

const shellText = {
  en: {
    skip_main: 'Skip to main content',
    nav_home: 'Home',
    nav_home_title: 'Back to the interactive homepage',
    nav_profile: 'Profile',
    nav_profile_title: 'Open the research profile',
    nav_research: 'Research',
    nav_research_title: 'Browse research topics and evidence',
    nav_blog: 'Blog',
    nav_blog_title: 'Open the blog index',
    nav_archive: 'Archive',
    nav_archive_title: 'Browse all posts by date',
    lang_label: '中文',
    lang_title: '查看中文页面',
    theme_title: 'Switch color theme',
    theme_default: 'Default',
    theme_warm: 'Warm',
    theme_mono: 'Black & White'
  },
  zh: {
    skip_main: '跳到主要内容',
    nav_home: '主页',
    nav_home_title: '返回互动主页',
    nav_profile: '履历',
    nav_profile_title: '打开研究履历',
    nav_research: '研究',
    nav_research_title: '浏览研究主题与成果',
    nav_blog: '博客',
    nav_blog_title: '打开博客首页',
    nav_archive: '归档',
    nav_archive_title: '按日期浏览所有文章',
    lang_label: 'EN',
    lang_title: 'View this page in English',
    theme_title: '切换页面色调',
    theme_default: '默认',
    theme_warm: '暖色',
    theme_mono: '黑白'
  }
};

function hintHtml(key) {
  return `<details class="blog-hint"><summary data-blog-i18n="hint_summary">${escapeHtml(blogText.hint_summary)}</summary><p data-blog-i18n="${key}">${escapeHtml(blogText[key])}</p></details>`;
}

function cardHtml(ctx, post) {
  const tags = post.tags.slice(0, 4).map((tag) => `<span class="blog-tag">${escapeHtml(tag)}</span>`).join('');
  return `
    <a class="blog-card" href="${postHref(ctx, post)}" lang="${escapeHtml(post.lang || SITE.lang)}">
      <div class="blog-card-meta">
        <span data-blog-date="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</span>
        <span>${escapeHtml(post.category)}</span>
        <span data-blog-minutes="${post.readingMinutes}">${post.readingMinutes} min</span>
      </div>
      <h3>${escapeHtml(post.title)}</h3>
      <p>${escapeHtml(post.description)}</p>
      <div class="blog-tag-row">${tags}</div>
    </a>
  `;
}

function topicCounts(posts, key) {
  const counts = new Map();
  posts.forEach((post) => {
    const values = key === 'tags' ? post.tags : [post.category];
    values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function renderTags(ctx, tags) {
  return tags.map((tag) => `<a class="blog-tag" href="${tagHref(ctx, tag)}">${escapeHtml(tag)}</a>`).join('');
}

function renderShell({
  filePath,
  title,
  description,
  body,
  extraHead = '',
  jsonLd = '',
  pageType = 'website',
  schemaType = 'WebPage',
  publishedTime = '',
  modifiedTime = '',
  contentLang = SITE.lang,
  fixedLanguage = '',
  alternateUrl = '',
  canonicalUrlOverride = '',
  robots = 'index,follow,max-image-preview:large',
  blogPage = null,
  siteRoot = rootDir
}) {
  const ctx = createPageContext(filePath, siteRoot);
  const relativeFilePath = path.relative(siteRoot, filePath).replace(/\\/g, '/');
  const isBlogPage = blogPage ?? relativeFilePath.startsWith('blog/');
  const titleSuffix = isBlogPage ? SITE.title : PORTFOLIO_TITLE;
  const pageTitle = title === SITE.title ? title : `${title} | ${titleSuffix}`;
  const siteName = isBlogPage ? SITE.title : 'wcx12 Research Portfolio';
  const pageDescription = description || SITE.description;
  const canonicalUrl = canonicalUrlOverride || canonicalUrlForFile(filePath);
  const socialImage = absoluteUrl('assets/og-home.png');
  const routeLanguage = fixedLanguage === 'zh' ? 'zh' : 'en';
  const documentLanguage = contentLang === 'zh' ? 'zh-CN' : contentLang;
  const text = shellText[routeLanguage];
  const researchPath = fixedLanguage === 'zh' ? 'zh/research/index.html' : 'research/index.html';
  const alternateLanguage = routeLanguage === 'zh' ? 'en' : 'zh-CN';
  const alternateHref = alternateUrl ? absoluteUrl(alternateUrl) : '';
  const englishHref = routeLanguage === 'en' ? canonicalUrl : alternateHref;
  const chineseHref = routeLanguage === 'zh' ? canonicalUrl : alternateHref;
  const languageAlternates = fixedLanguage && alternateHref ? `
  <link rel="alternate" hreflang="en" href="${escapeHtml(englishHref)}" />
  <link rel="alternate" hreflang="zh-CN" href="${escapeHtml(chineseHref)}" />
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(englishHref)}" />` : '';
  const i18n = (key, attribute = '') => fixedLanguage
    ? ''
    : ` data-blog-i18n${attribute ? `-${attribute}` : ''}="${key}"`;
  const languageControl = fixedLanguage
    ? `<a id="blogLangLink" class="blog-nav-button" href="${ctx.link(`${alternateUrl}index.html`)}" hreflang="${alternateLanguage}" lang="${alternateLanguage}" title="${escapeHtml(text.lang_title)}" aria-label="${escapeHtml(text.lang_title)}">${escapeHtml(text.lang_label)}</a>`
    : `<button id="blogLangToggle" class="blog-nav-button" type="button" title="Switch interface language" aria-label="Switch interface language" data-blog-i18n="lang_button" data-blog-i18n-title="lang_title" data-blog-i18n-aria="lang_title">中文</button>`;
  const metadata = jsonLd || JSON.stringify({
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    inLanguage: documentLanguage,
    author: {
      '@type': 'Person',
      '@id': absoluteUrl('#person'),
      name: SITE.author,
      url: absoluteUrl()
    }
  });
  const safeMetadata = String(metadata).replace(/</g, '\\u003c');
  const articleMetadata = [
    publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />` : '',
    modifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(modifiedTime)}" />` : ''
  ].filter(Boolean).map((tag) => `  ${tag}`).join('\n');
  return `<!doctype html>
<html lang="${escapeHtml(documentLanguage)}" data-content-lang="${escapeHtml(documentLanguage)}" data-ui-lang="${routeLanguage}"${fixedLanguage ? ` data-fixed-language="${routeLanguage}"` : ''}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self'" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDescription)}" />
  <meta name="author" content="${escapeHtml(SITE.author)}" />
  <meta name="robots" content="${escapeHtml(robots)}" />
  <meta name="theme-color" content="#070914" />
  <meta name="color-scheme" content="dark" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
${languageAlternates}
  <link rel="icon" type="image/svg+xml" href="${ctx.link('favicon.svg')}" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(pageDescription)}" />
  <meta property="og:type" content="${escapeHtml(pageType)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="${escapeHtml(siteName)}" />
  <meta property="og:locale" content="${routeLanguage === 'zh' ? 'zh_CN' : 'en_US'}" />
  <meta property="og:image" content="${escapeHtml(socialImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="wcx12 research portfolio and fieldnotes" />
${articleMetadata ? `${articleMetadata}\n` : ''}  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(pageDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(socialImage)}" />
  <meta name="twitter:image:alt" content="wcx12 research portfolio and fieldnotes" />
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(SITE.title)}" href="${escapeHtml(absoluteUrl('rss.xml'))}" />
  <link rel="sitemap" type="application/xml" href="${escapeHtml(absoluteUrl('sitemap.xml'))}" />
  <link rel="preload" href="${ctx.link('assets/fonts/space-grotesk-latin.woff2')}" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="${versionedAssetLink(ctx, 'styles.css')}" />
  <link rel="stylesheet" href="${versionedAssetLink(ctx, 'blog/assets/blog.css')}" />
${extraHead.trim()}
  <script type="application/ld+json">${safeMetadata}</script>
</head>
<body class="blog-body">
  <a class="skip-link" href="#main-content"${i18n('skip_main')}>${escapeHtml(text.skip_main)}</a>
  <div id="blogProgress" class="blog-progress" aria-hidden="true"></div>
  <header class="blog-topbar">
    <a class="blog-brand" href="${ctx.link('index.html')}">wcx12</a>
    <nav class="blog-nav" aria-label="${routeLanguage === 'zh' ? '站点导航' : 'Site navigation'}">
      <a href="${ctx.link('index.html')}" title="${escapeHtml(text.nav_home_title)}" aria-label="${escapeHtml(text.nav_home_title)}"${i18n('nav_home')}${i18n('nav_home_title', 'title')}${i18n('nav_home_title', 'aria')}>${escapeHtml(text.nav_home)}</a>
      <a href="${ctx.link('resume/index.html')}" title="${escapeHtml(text.nav_profile_title)}" aria-label="${escapeHtml(text.nav_profile_title)}"${i18n('nav_profile')}${i18n('nav_profile_title', 'title')}${i18n('nav_profile_title', 'aria')}>${escapeHtml(text.nav_profile)}</a>
      <a href="${ctx.link(researchPath)}" title="${escapeHtml(text.nav_research_title)}" aria-label="${escapeHtml(text.nav_research_title)}"${i18n('nav_research')}${i18n('nav_research_title', 'title')}${i18n('nav_research_title', 'aria')}>${escapeHtml(text.nav_research)}</a>
      <a href="${ctx.link('blog/index.html')}" title="${escapeHtml(text.nav_blog_title)}" aria-label="${escapeHtml(text.nav_blog_title)}"${i18n('nav_blog')}${i18n('nav_blog_title', 'title')}${i18n('nav_blog_title', 'aria')}>${escapeHtml(text.nav_blog)}</a>
      <a href="${ctx.link('blog/archive/index.html')}" title="${escapeHtml(text.nav_archive_title)}" aria-label="${escapeHtml(text.nav_archive_title)}"${i18n('nav_archive')}${i18n('nav_archive_title', 'title')}${i18n('nav_archive_title', 'aria')}>${escapeHtml(text.nav_archive)}</a>
      ${languageControl}
      <select id="blogThemeSelect" aria-label="${escapeHtml(text.theme_title)}" title="${escapeHtml(text.theme_title)}"${i18n('theme_title', 'title')}${i18n('theme_title', 'aria')}>
        <option value="neon"${i18n('theme_default')}>${escapeHtml(text.theme_default)}</option>
        <option value="warm"${i18n('theme_warm')}>${escapeHtml(text.theme_warm)}</option>
        <option value="mono"${i18n('theme_mono')}>${escapeHtml(text.theme_mono)}</option>
      </select>
    </nav>
  </header>
  <main id="main-content" class="blog-shell">
${body.trim()}
  </main>
  <footer class="blog-footer">
    <span>&copy; ${SITE.copyrightYear} wcx12</span>
    <nav aria-label="Profile links">
      <a href="${ctx.link('index.html')}"${i18n('nav_home')}>${escapeHtml(text.nav_home)}</a>
      <a href="https://github.com/wcx12" target="_blank" rel="me noreferrer">GitHub</a>
      <a href="https://orcid.org/0009-0005-6139-4327" target="_blank" rel="me noreferrer" aria-label="View ORCID record 0009-0005-6139-4327">ORCID</a>
    </nav>
  </footer>
  <script type="module" src="${versionedAssetLink(ctx, 'blog/assets/blog.js')}"></script>
</body>
</html>
`;
}

function createMarkdownRenderer() {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true
  })
    .use(markdownItFootnote)
    .use(markdownItKatex, { throwOnError: false, errorColor: '#ff6f59' });

  md.renderer.rules.fence = (tokens, idx) => renderCodeFence(tokens[idx].content, tokens[idx].info);
  md.renderer.rules.code_block = (tokens, idx) => renderCodeFence(tokens[idx].content, 'text');

  const versionPostMedia = (value, post) => {
    if (!post?.mediaFiles?.length) return value;
    const raw = String(value || '');
    const fragmentIndex = raw.indexOf('#');
    const fragment = fragmentIndex >= 0 ? raw.slice(fragmentIndex) : '';
    const withoutFragment = fragmentIndex >= 0 ? raw.slice(0, fragmentIndex) : raw;
    const pathPart = withoutFragment.split('?', 1)[0];
    let normalized;
    try {
      normalized = decodeURIComponent(pathPart).replace(/^\.\//, '');
    } catch {
      return value;
    }
    const media = post.mediaFiles.find((item) => item.publicPath === normalized);
    return media ? `${media.publicPath}?v=${media.version}${fragment}` : value;
  };

  const defaultImage = md.renderer.rules.image || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const source = tokens[idx].attrGet('src') || '';
    tokens[idx].attrSet('src', versionPostMedia(source, env.post));
    tokens[idx].attrSet('loading', 'lazy');
    tokens[idx].attrSet('decoding', 'async');
    return defaultImage(tokens, idx, options, env, self);
  };

  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = versionPostMedia(tokens[idx].attrGet('href') || '', env.post);
    tokens[idx].attrSet('href', href);
    if (/^https?:\/\//i.test(href)) {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noreferrer');
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  const defaultHeadingOpen = md.renderer.rules.heading_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const level = Number(tokens[idx].tag.slice(1));
    const title = tokens[idx + 1]?.content || '';
    const baseSlug = slugify(title);
    const count = env.headingCounts.get(baseSlug) || 0;
    env.headingCounts.set(baseSlug, count + 1);
    const id = count ? `${baseSlug}-${count + 1}` : baseSlug;
    tokens[idx].attrSet('id', id);
    if (level >= 2 && level <= 3) env.toc.push({ level, id, title });
    return defaultHeadingOpen(tokens, idx, options, env, self);
  };

  return {
    render(markdown, post = null) {
      const env = { toc: [], headingCounts: new Map(), post };
      const html = md.render(markdown, env);
      return { html, toc: env.toc };
    }
  };
}

function tocHtml(toc) {
  if (!toc.length) return '<p class="muted" data-blog-i18n="toc_empty">No sections.</p>';
  return `<ol>${toc.map((item) => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.title)}</a></li>`).join('')}</ol>`;
}

function postJsonLd(post) {
  const url = absoluteUrl(postUrl(post));
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    inLanguage: post.lang,
    url,
    image: absoluteUrl('assets/og-home.png'),
    author: { '@type': 'Person', '@id': absoluteUrl('#person'), name: SITE.author, url: absoluteUrl() },
    mainEntityOfPage: url,
    keywords: post.tags
  });
}

async function writePage(relativeFile, html, siteRoot = rootDir) {
  const filePath = path.join(siteRoot, relativeFile);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, html);
}

function referencedKatexFonts(css, katexDistDir) {
  const fontsDir = path.join(katexDistDir, 'fonts');
  const fontPaths = new Set();

  for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^'")]*))\s*\)/g)) {
    const url = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (!url || /^(?:data:|https?:|\/\/|#)/i.test(url)) continue;

    const sourcePath = path.resolve(katexDistDir, url.replace(/[?#].*$/, ''));
    const relativePath = path.relative(fontsDir, sourcePath);
    if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) continue;
    fontPaths.add(relativePath);
  }

  return [...fontPaths].sort((a, b) => a.localeCompare(b));
}

async function copyAssets() {
  await fs.mkdir(outputAssetsDir, { recursive: true });
  const entries = await fs.readdir(sourceAssetsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      await fs.copyFile(path.join(sourceAssetsDir, entry.name), path.join(outputAssetsDir, entry.name));
    }
  }

  const katexDistDir = path.join(rootDir, 'node_modules', 'katex', 'dist');
  const katexCssPath = path.join(katexDistDir, 'katex.min.css');
  const katexCss = await fs.readFile(katexCssPath, 'utf8');
  const fontPaths = referencedKatexFonts(katexCss, katexDistDir);
  if (!fontPaths.length) throw new Error('KaTeX CSS does not reference any files under dist/fonts.');

  await fs.copyFile(katexCssPath, path.join(outputAssetsDir, 'katex.min.css'));
  for (const fontPath of fontPaths) {
    const outputFontPath = path.join(outputAssetsDir, 'fonts', fontPath);
    await fs.mkdir(path.dirname(outputFontPath), { recursive: true });
    await fs.copyFile(path.join(katexDistDir, 'fonts', fontPath), outputFontPath);
  }
}

async function copyPostMedia(post, articleDirectory) {
  for (const media of post.mediaFiles || []) {
    const destination = path.join(articleDirectory, media.publicPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(media.sourcePath, destination);
  }
}

function versionedAssetLink(ctx, relativePath) {
  if (!assetVersion) throw new Error('Asset version must be computed before rendering pages.');
  return `${ctx.link(relativePath)}?v=${assetVersion}`;
}

async function computeAssetVersion(posts) {
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

async function stampHomepageAssets() {
  const filePath = path.join(rootDir, 'index.html');
  const source = await fs.readFile(filePath, 'utf8');
  const replacements = [
    {
      pattern: /(<link\s+rel="stylesheet"\s+href="styles\.css)(?:\?v=[a-f0-9]{12})?("\s*\/?>)/,
      replacement: `$1?v=${assetVersion}$2`
    },
    {
      pattern: /(<script\s+type="module"\s+src="script\.js)(?:\?v=[a-f0-9]{12})?("\s*><\/script>)/,
      replacement: `$1?v=${assetVersion}$2`
    }
  ];
  let stamped = source;
  for (const { pattern, replacement } of replacements) {
    if (!pattern.test(stamped)) throw new Error(`Unable to stamp homepage asset using ${pattern}.`);
    stamped = stamped.replace(pattern, replacement);
  }
  if (stamped !== source) await fs.writeFile(filePath, stamped);
}

async function renderIndex(posts) {
  const filePath = path.join(outputDir, 'index.html');
  const ctx = createPageContext(filePath);
  const featured = posts.filter((post) => post.featured).slice(0, 3);
  const recent = posts.slice(0, 6);
  const showSearch = posts.length >= 3;
  const showFeatured = posts.length > 1 && featured.length > 0;
  const latestHref = posts.length === 1 ? postHref(ctx, posts[0]) : '#recent-writing';
  const tagLinks = topicCounts(posts, 'tags')
    .slice(0, 14)
    .map(([tag, count]) => `<a class="blog-tag" href="${tagHref(ctx, tag)}">${escapeHtml(tag)} (${count})</a>`)
    .join('');

  const body = `
    <section class="blog-hero">
      <p class="blog-kicker" data-blog-i18n="hero_kicker">A notebook by wcx12</p>
      <h1 data-blog-i18n="hero_title">Research Fieldnotes</h1>
      <p data-blog-i18n="hero_desc">A growing notebook for reproducible research workflows, experiment logs, paper reading, and engineering reflections.</p>
      ${hintHtml('hint_hero')}
      <div class="blog-hero-actions">
        <a class="btn btn-primary" href="${latestHref}" data-blog-i18n="hero_read_latest">Read latest</a>
        <a class="btn btn-outline" href="${ctx.link('blog/archive/index.html')}" data-blog-i18n="hero_browse_archive">Browse archive</a>
      </div>
      <div class="blog-stat-grid">
        <article class="blog-stat"><span data-blog-i18n="stat_published">Published</span><strong>${posts.length}</strong></article>
        <article class="blog-stat"><span data-blog-i18n="stat_topics">Topics</span><strong>${topicCounts(posts, 'tags').length}</strong></article>
        ${showSearch
          ? '<article class="blog-stat"><span data-blog-i18n="stat_search">Search</span><strong data-blog-i18n="stat_ready">Ready</strong></article>'
          : '<article class="blog-stat"><span data-blog-i18n="stat_language">Languages</span><strong data-blog-i18n="stat_bilingual">EN / 中文</strong></article>'}
      </div>
    </section>

${showSearch ? `<section class="blog-section blog-search" aria-label="Search writing">
      <div class="blog-section-head">
        <div>
          <p class="blog-section-label" data-blog-i18n="section_search_label">Search</p>
          <h2 data-blog-i18n="section_search_title">Find notes by topic, tag, or summary</h2>
        </div>
        ${hintHtml('hint_search')}
      </div>
      <input id="blogSearch" type="search" aria-label="Search writing" placeholder="Search writing..." autocomplete="off" data-blog-i18n-ph="search_placeholder" data-blog-i18n-aria="search_label" />
      <div id="blogSearchResults" class="blog-search-results" aria-live="polite"></div>
    </section>` : ''}

${showFeatured ? `<section class="blog-section">
      <div class="blog-section-head">
        <div>
          <p class="blog-section-label" data-blog-i18n="section_featured_label">Featured</p>
          <h2 data-blog-i18n="section_featured_title">Start here</h2>
        </div>
        ${hintHtml('hint_featured')}
      </div>
      <div class="blog-grid">${featured.map((post) => cardHtml(ctx, post)).join('')}</div>
    </section>` : ''}

    <section class="blog-section">
      <div class="blog-section-head">
        <div>
          <p class="blog-section-label" data-blog-i18n="section_topics_label">Topics</p>
          <h2 data-blog-i18n="section_topics_title">Browse by tag</h2>
        </div>
        ${hintHtml('hint_topics')}
      </div>
      <div class="blog-topic-grid">${tagLinks || '<p class="muted" data-blog-i18n="topics_empty">No tags yet.</p>'}</div>
    </section>

    <section id="recent-writing" class="blog-section">
      <div class="blog-section-head">
        <div>
          <p class="blog-section-label" data-blog-i18n="section_recent_label">Recent</p>
          <h2 data-blog-i18n="section_recent_title">Latest writing</h2>
        </div>
        <div class="blog-section-tools">
          ${hintHtml('hint_recent')}
          <a class="blog-tag" href="${ctx.link('blog/archive/index.html')}" data-blog-i18n="nav_archive">Archive</a>
        </div>
      </div>
      <div class="blog-grid">${recent.map((post) => cardHtml(ctx, post)).join('')}</div>
    </section>
  `;

  await writePage('blog/index.html', renderShell({
    filePath,
    title: SITE.title,
    description: SITE.description,
    body,
    schemaType: 'Blog'
  }));
}

function relatedPostsFor(post, posts) {
  const tagSet = new Set(post.tags);
  const researchSet = new Set(post.research);
  return posts
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      const tagScore = candidate.tags.filter((tag) => tagSet.has(tag)).length;
      const researchScore = candidate.research.filter((id) => researchSet.has(id)).length * 2;
      return { candidate, score: tagScore + researchScore };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.date.localeCompare(a.candidate.date))
    .slice(0, 3)
    .map((item) => item.candidate);
}

async function renderPost(post, posts, renderer, options = {}) {
  const preview = options.preview === true;
  const siteRoot = preview ? path.join(rootDir, 'output', 'preview') : rootDir;
  const relativeFile = `blog/posts/${post.slug}/index.html`;
  const filePath = path.join(siteRoot, relativeFile);
  const ctx = createPageContext(filePath, siteRoot);
  const { html, toc } = renderer.render(post.content, post);
  const index = posts.findIndex((item) => item.slug === post.slug);
  const newer = !preview && index > 0 ? posts[index - 1] : null;
  const older = !preview && index < posts.length - 1 ? posts[index + 1] : null;
  const related = preview ? [] : relatedPostsFor(post, posts);
  const tagRow = renderTags(ctx, post.tags);
  const mathCss = post.math ? `<link rel="stylesheet" href="${versionedAssetLink(ctx, 'blog/assets/katex.min.css')}" />` : '';
  const renderedToc = post.toc ? tocHtml(toc) : '<p class="muted" data-blog-i18n="toc_disabled">Contents disabled.</p>';

  const body = `
    <div class="blog-post-layout">
      <article class="blog-post-card" lang="${escapeHtml(post.lang || SITE.lang)}">
${preview ? `        <div class="blog-preview-banner" role="status">${post.publicationState === 'scheduled' ? `Scheduled for ${escapeHtml(post.date)}` : 'Draft preview'} - not part of the public site</div>\n` : ''}
        <header class="blog-post-header">
          <p class="blog-kicker">${escapeHtml(post.category)}</p>
          <h1 class="blog-post-title">${escapeHtml(post.title)}</h1>
          <div class="blog-meta">
            <a class="blog-author" href="${ctx.link('resume/index.html')}" rel="author">${escapeHtml(SITE.author)}</a>
            <span data-blog-date="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</span>
            <span data-blog-updated="${escapeHtml(post.updated)}">Updated ${escapeHtml(formatDate(post.updated))}</span>
            <span data-blog-minutes-long="${post.readingMinutes}">${post.readingMinutes} min read</span>
            ${post.series ? `<span>${escapeHtml(post.series)}</span>` : ''}
          </div>
          <p class="blog-post-subtitle">${escapeHtml(post.description)}</p>
          ${hintHtml('hint_post')}
          <div class="blog-tag-row">${tagRow}</div>
        </header>
        <aside class="blog-toc blog-toc-mobile" aria-label="Article contents">
          <h2 data-blog-i18n="toc_title">Contents</h2>
          ${hintHtml('hint_toc')}
          ${renderedToc}
        </aside>
        <div class="blog-content">
${html}
        </div>
        <footer class="blog-post-footer">
          ${related.length ? `<section aria-labelledby="related-writing-title">
            <div class="blog-section-head">
              <div>
                <p class="blog-section-label" data-blog-i18n="section_related_label">Related</p>
                <h2 id="related-writing-title" data-blog-i18n="section_related_title">Related writing</h2>
              </div>
              ${hintHtml('hint_related')}
            </div>
            <div class="blog-grid">${related.map((item) => cardHtml(ctx, item)).join('')}</div>
          </section>` : ''}
          <nav class="blog-prev-next" aria-label="Post navigation">
            ${hintHtml('hint_prev_next')}
            ${newer ? `<a href="${postHref(ctx, newer)}"><span data-blog-i18n="nav_newer">Newer</span>${escapeHtml(newer.title)}</a>` : '<span></span>'}
            ${older ? `<a href="${postHref(ctx, older)}"><span data-blog-i18n="nav_older">Older</span>${escapeHtml(older.title)}</a>` : '<span></span>'}
          </nav>
        </footer>
      </article>
      <aside class="blog-toc blog-toc-desktop" aria-label="Article contents">
        <h2 data-blog-i18n="toc_title">Contents</h2>
        ${hintHtml('hint_toc')}
        ${renderedToc}
      </aside>
    </div>
  `;

  await writePage(relativeFile, renderShell({
    filePath,
    title: post.title,
    description: post.description,
    body,
    extraHead: mathCss,
    jsonLd: postJsonLd(post),
    pageType: 'article',
    publishedTime: post.date,
    modifiedTime: post.updated,
    contentLang: post.lang,
    canonicalUrlOverride: preview ? absoluteUrl(postUrl(post)) : '',
    robots: preview ? 'noindex,nofollow' : 'index,follow,max-image-preview:large',
    blogPage: preview ? true : null,
    siteRoot
  }), siteRoot);
  await copyPostMedia(post, path.dirname(filePath));

  post.renderedText = stripHtml(html);
  post.renderedHtml = html;
}

async function renderDraftPreviews(posts, renderer) {
  const previewRoot = path.join(rootDir, 'output', 'preview');
  await fs.rm(previewRoot, { recursive: true, force: true });
  await fs.mkdir(previewRoot, { recursive: true });
  const scaffold = [
    '404.html',
    'styles.css',
    'script.js',
    'site-data.js',
    'research-canvas.js',
    'repo-map.js',
    'research-config.json',
    'favicon.svg',
    'rss.xml',
    'sitemap.xml',
    'assets',
    'blog',
    'resume',
    'research',
    'publications',
    'zh'
  ];
  for (const relativePath of scaffold) {
    await fs.cp(path.join(rootDir, relativePath), path.join(previewRoot, relativePath), { recursive: true });
  }
  for (const post of posts) await renderPost(post, posts, renderer, { preview: true });

  const filePath = path.join(previewRoot, 'index.html');
  const items = posts.map((post) => `
    <a class="blog-card" href="blog/posts/${encodeURIComponent(post.slug)}/">
      <div class="blog-card-meta"><span>${post.publicationState === 'scheduled' ? `Scheduled ${escapeHtml(post.date)}` : 'Draft'}</span><span>${escapeHtml(post.category)}</span></div>
      <h2>${escapeHtml(post.title)}</h2>
      <p>${escapeHtml(post.description)}</p>
    </a>`).join('');
  const body = `
    <section class="blog-hero">
      <p class="blog-kicker">Local author preview</p>
      <h1>Drafts and scheduled writing</h1>
      <p>This private build includes unpublished articles for visual review. Nothing under <code>output/</code> is deployed.</p>
    </section>
    <section class="blog-section" aria-labelledby="preview-list-title">
      <div class="blog-section-head"><h2 id="preview-list-title">Unpublished articles</h2><span>${posts.length}</span></div>
      <div class="blog-grid">${items || '<p class="muted">No drafts or scheduled posts.</p>'}</div>
    </section>`;
  await writePage('index.html', renderShell({
    filePath,
    title: 'Writing Preview',
    description: 'Local preview of draft and scheduled writing.',
    body,
    canonicalUrlOverride: absoluteUrl('blog/'),
    robots: 'noindex,nofollow',
    blogPage: true,
    siteRoot: previewRoot
  }), previewRoot);
}

async function renderArchive(posts) {
  const filePath = path.join(outputDir, 'archive', 'index.html');
  const ctx = createPageContext(filePath);
  const years = new Map();
  posts.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!years.has(year)) years.set(year, []);
    years.get(year).push(post);
  });

  const body = `
    <section class="blog-hero">
      <p class="blog-kicker" data-blog-i18n="archive_kicker">Archive</p>
      <h1 data-blog-i18n="archive_title">All writing</h1>
      <p data-blog-i18n="archive_desc">A chronological index of technical notes and research logs.</p>
      ${hintHtml('hint_archive')}
    </section>
    ${[...years.entries()].map(([year, items]) => `
      <section class="blog-section">
        <div class="blog-section-head">
          <div>
            <p class="blog-section-label">${year}</p>
            <h2><span>${items.length}</span> <span data-blog-count-label="${items.length}">${items.length > 1 ? 'posts' : 'post'}</span></h2>
          </div>
          ${hintHtml('hint_archive_year')}
        </div>
        <ul class="blog-archive-list">
          ${items.map((post) => `<li lang="${escapeHtml(post.lang || SITE.lang)}"><a href="${postHref(ctx, post)}">${escapeHtml(post.title)}</a> <span class="muted">- <span data-blog-date="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</span> - ${escapeHtml(post.category)}</span></li>`).join('')}
        </ul>
      </section>
    `).join('')}
  `;

  await writePage('blog/archive/index.html', renderShell({
    filePath,
    title: 'Writing Archive',
    description: 'All technical writing by wcx12.',
    body,
    schemaType: 'CollectionPage'
  }));
}

async function renderTagPages(posts) {
  const tags = topicCounts(posts, 'tags').map(([tag]) => tag);
  for (const tag of tags) {
    const filePath = path.join(outputDir, 'tags', slugify(tag), 'index.html');
    const ctx = createPageContext(filePath);
    const tagged = posts.filter((post) => post.tags.includes(tag));
    const body = `
      <section class="blog-hero">
        <p class="blog-kicker" data-blog-i18n="tag_kicker">Tag</p>
        <h1>${escapeHtml(tag)}</h1>
        <p><span>${tagged.length}</span> <span data-blog-note-label="${tagged.length}">${tagged.length > 1 ? 'related notes' : 'related note'}</span> <span data-blog-i18n="tag_in_topic">in this topic.</span></p>
        ${hintHtml('hint_tag')}
        <div class="blog-hero-actions"><a class="btn btn-outline" href="${ctx.link('blog/index.html')}" data-blog-i18n="back_to_writing">Back to writing</a></div>
      </section>
      <section class="blog-section" aria-labelledby="tag-results-title">
        <div class="blog-section-head">
          <div>
            <p class="blog-section-label" data-blog-i18n="tag_results_label">Results</p>
            <h2 id="tag-results-title"><span data-blog-i18n="tag_results_title">Writing tagged</span> ${escapeHtml(tag)}</h2>
          </div>
          ${hintHtml('hint_tag_results')}
        </div>
        <div class="blog-grid">${tagged.map((post) => cardHtml(ctx, post)).join('')}</div>
      </section>
    `;
    await writePage(`blog/tags/${slugify(tag)}/index.html`, renderShell({
      filePath,
      title: `Tag: ${tag}`,
      description: `Writing tagged ${tag}.`,
      body,
      schemaType: 'CollectionPage'
    }));
  }
}

async function renderResume(renderer) {
  const source = await fs.readFile(path.join(rootDir, 'resume.md'), 'utf8');
  const publicationList = staticPublications.map((publication, index) => {
    const status = publication.status === 'In press' ? 'in press, ' : '';
    return `${index + 1}. ${readableAuthors(publication)}. "${publication.title}." ${publication.venue}, ${status}${publication.year}. ${publication.link}`;
  }).join('\n');
  if (!source.includes('{{PUBLICATIONS}}')) throw new Error('resume.md must contain {{PUBLICATIONS}}');
  const hydratedSource = source.replace('{{PUBLICATIONS}}', publicationList);
  const withoutDocumentTitle = hydratedSource.replace(/^#\s+[^\r\n]+\r?\n+/, '');
  const { html } = renderer.render(withoutDocumentTitle);
  const filePath = path.join(rootDir, 'resume', 'index.html');
  const body = `
    <article class="blog-post-card research-profile" lang="en">
      <header class="blog-post-header">
        <p class="blog-kicker" data-blog-i18n="profile_kicker">Research Profile</p>
        <h1 class="blog-post-title">Chenxu Wang <span class="profile-handle">(wcx12)</span></h1>
        <p class="blog-post-subtitle" data-blog-i18n="profile_desc">A concise, verifiable snapshot of education, research, publications, projects, and technical skills.</p>
        <div class="blog-hero-actions profile-actions">
          <button id="printProfile" class="btn btn-primary" type="button" data-blog-i18n="profile_print">Print / Save as PDF</button>
          <a class="btn btn-outline" href="mailto:c2675668@gmail.com" data-blog-i18n="profile_contact">Contact</a>
        </div>
      </header>
      <div class="blog-content">
${html}
      </div>
    </article>
  `;
  const metadata = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: 'Chenxu Wang (wcx12) Research Profile',
    description: 'Research profile for Chenxu Wang (wcx12), including education, publications, projects, and technical skills.',
    url: absoluteUrl('resume/'),
    mainEntity: {
      '@type': 'Person',
      name: 'Chenxu Wang',
      alternateName: 'wcx12',
      url: absoluteUrl(),
      email: 'mailto:c2675668@gmail.com',
      affiliation: {
        '@type': 'CollegeOrUniversity',
        name: 'Beijing Institute of Technology'
      },
      sameAs: [
        'https://github.com/wcx12',
        'https://orcid.org/0009-0005-6139-4327'
      ]
    }
  });

  await writePage('resume/index.html', renderShell({
    filePath,
    title: 'Research Profile',
    description: 'Research profile for Chenxu Wang (wcx12), including education, publications, projects, and technical skills.',
    body,
    jsonLd: metadata,
    schemaType: 'ProfilePage'
  }));
}

function localized(value, language) {
  return value?.[language] || value?.en || '';
}

function authorsFor(publication) {
  return publication.authors.split(';').map((author) => author.trim()).filter(Boolean);
}

function readableAuthors(publication) {
  const authors = authorsFor(publication);
  if (authors.length < 2) return authors[0] || '';
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(', ')}, and ${authors.at(-1)}`;
}

function publicationTopic(publication) {
  const topicIds = researchConfig.paperAssignments[publication.title] || publication.interests || [];
  return researchChildren.find((child) => topicIds.includes(child.id));
}

function publicationSchema(publication, language = 'en') {
  const topic = publicationTopic(publication);
  return {
    '@type': 'ScholarlyArticle',
    '@id': `${publication.link}#article`,
    headline: publication.title,
    name: publication.title,
    url: publication.link,
    datePublished: publication.year,
    author: authorsFor(publication).map((name) => ({ '@type': 'Person', name })),
    isPartOf: { '@type': 'Periodical', name: publication.venue },
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'DOI',
      value: publication.doi,
      url: publication.link
    },
    ...(topic ? {
      about: {
        '@type': 'DefinedTerm',
        termCode: topic.id,
        name: localized(topic.title, language),
        url: absoluteUrl(researchRoute(language, `${topic.id}/`))
      }
    } : {})
  };
}

function evidenceForTopic(topicId, posts) {
  const repos = localRepos.filter((repo) => new Set([
    ...(repo.interests || []),
    ...(researchConfig.repoAssignments[repo.name] || [])
  ]).has(topicId));
  const knownRepoNames = new Set(localRepos.map((repo) => repo.name));
  const configuredOnlyRepos = Object.entries(researchConfig.repoAssignments)
    .filter(([name, interestIds]) => !knownRepoNames.has(name) && Array.isArray(interestIds) && interestIds.includes(topicId))
    .map(([name]) => ({
      name,
      description: 'Repository mapped to this research area in the site configuration.',
      descriptionZh: '网站配置中映射到该研究方向的公开仓库。',
      html_url: `https://github.com/wcx12/${encodeURIComponent(name)}`,
      language: null,
      updated_at: null
    }));
  const publications = staticPublications.filter((publication) => new Set([
    ...(publication.interests || []),
    ...(researchConfig.paperAssignments[publication.title] || [])
  ]).has(topicId));
  const writing = posts.filter((post) => post.research.includes(topicId));
  return [
    ...[...repos, ...configuredOnlyRepos].map((repo) => ({ type: 'SoftwareSourceCode', key: `repo:${repo.name}`, value: repo })),
    ...publications.map((publication) => ({ type: 'ScholarlyArticle', key: `paper:${publication.doi}`, value: publication })),
    ...writing.map((post) => ({ type: 'BlogPosting', key: `post:${post.slug}`, value: post }))
  ];
}

function evidenceSchema(evidence, language = 'en') {
  if (evidence.type === 'SoftwareSourceCode') {
    const repo = evidence.value;
    return {
      '@type': 'SoftwareSourceCode',
      '@id': `${repo.html_url}#software`,
      name: repo.name,
      description: language === 'zh' ? (repo.descriptionZh || repo.description) : repo.description,
      url: repo.html_url,
      codeRepository: repo.html_url,
      ...(repo.language ? { programmingLanguage: repo.language } : {}),
      ...(repo.updated_at ? { dateModified: repo.updated_at } : {}),
      author: { '@type': 'Person', '@id': absoluteUrl('#person'), name: SITE.author }
    };
  }
  if (evidence.type === 'ScholarlyArticle') return publicationSchema(evidence.value, language);
  const post = evidence.value;
  return {
    '@type': 'BlogPosting',
    '@id': `${absoluteUrl(postUrl(post))}#article`,
    headline: post.title,
    description: post.description,
    url: absoluteUrl(postUrl(post)),
    datePublished: post.date,
    dateModified: post.updated,
    inLanguage: post.lang,
    author: { '@type': 'Person', '@id': absoluteUrl('#person'), name: SITE.author }
  };
}

function evidenceHtml(ctx, evidence, language) {
  const isZh = language === 'zh';
  if (evidence.type === 'SoftwareSourceCode') {
    const repo = evidence.value;
    return `<article class="research-evidence" data-evidence-type="SoftwareSourceCode" data-evidence-key="${escapeHtml(evidence.key)}">
      <h3 class="research-evidence-title"><a href="${escapeHtml(repo.html_url)}" rel="noreferrer">${escapeHtml(repo.name)}</a></h3>
      <p${language === 'zh' && repo.descriptionZh ? '' : ' lang="en"'}>${escapeHtml(language === 'zh' ? (repo.descriptionZh || repo.description) : repo.description)}</p>
      <dl class="research-meta">
${repo.language ? `        <div><dt>${isZh ? '语言' : 'Language'}</dt><dd>${escapeHtml(repo.language)}</dd></div>` : ''}
        <div><dt>${isZh ? '代码' : 'Code'}</dt><dd><a href="${escapeHtml(repo.html_url)}" rel="noreferrer">GitHub</a></dd></div>
      </dl>
    </article>`;
  }
  if (evidence.type === 'ScholarlyArticle') {
    const publication = evidence.value;
    const topic = publicationTopic(publication);
    return `<article class="research-evidence" data-evidence-type="ScholarlyArticle" data-evidence-key="${escapeHtml(evidence.key)}">
      <h3 class="research-evidence-title" lang="en"><a href="${escapeHtml(publication.link)}" rel="noreferrer">${escapeHtml(publication.title)}</a></h3>
      <p class="research-authors">${escapeHtml(authorsFor(publication).join(', '))}</p>
      <dl class="research-meta">
        <div><dt>${isZh ? '期刊' : 'Journal'}</dt><dd>${escapeHtml(publication.venue)}</dd></div>
        <div><dt>${isZh ? '状态' : 'Status'}</dt><dd>${escapeHtml(isZh ? publication.statusZh : publication.status)}, ${escapeHtml(publication.year)}</dd></div>
        <div><dt>DOI</dt><dd><a href="${escapeHtml(publication.link)}" rel="noreferrer">${escapeHtml(publication.doi)}</a></dd></div>
        ${topic ? `<div><dt>${isZh ? '研究方向' : 'Research topic'}</dt><dd><a class="publication-topic-link" href="${ctx.link(`${researchRoute(language, `${topic.id}/`)}index.html`)}">${escapeHtml(localized(topic.title, language))}</a></dd></div>` : ''}
      </dl>
    </article>`;
  }
  const post = evidence.value;
  return `<article class="research-evidence" data-evidence-type="BlogPosting" data-evidence-key="${escapeHtml(evidence.key)}" lang="${escapeHtml(post.lang)}">
    <h3 class="research-evidence-title"><a href="${postHref(ctx, post)}">${escapeHtml(post.title)}</a></h3>
    <p>${escapeHtml(post.description)}</p>
    <dl class="research-meta">
      <div><dt>${isZh ? '发布于' : 'Published'}</dt><dd>${escapeHtml(post.date)}</dd></div>
      <div><dt>${isZh ? '类别' : 'Category'}</dt><dd>${escapeHtml(post.category)}</dd></div>
    </dl>
  </article>`;
}

function evidenceSections(ctx, evidence, language) {
  const isZh = language === 'zh';
  const sections = [
    ['SoftwareSourceCode', isZh ? '项目' : 'Projects'],
    ['ScholarlyArticle', isZh ? '论文' : 'Papers'],
    ['BlogPosting', isZh ? '写作' : 'Writing']
  ];
  return sections.map(([type, title]) => {
    const items = evidence.filter((item) => item.type === type);
    if (!items.length) return '';
    return `<section class="research-section" aria-labelledby="evidence-${type}">
      <div class="research-section-head"><h2 id="evidence-${type}">${title}</h2><span>${items.length}</span></div>
      <div class="research-evidence-list">${items.map((item) => evidenceHtml(ctx, item, language)).join('')}</div>
    </section>`;
  }).join('');
}

function researchRoute(language, suffix = '') {
  return `${language === 'zh' ? 'zh/' : ''}research/${suffix}`;
}

function publicationsRoute(language) {
  return `${language === 'zh' ? 'zh/' : ''}publications/`;
}

async function renderResearchIndex(posts, language) {
  const isZh = language === 'zh';
  const relativeRoute = researchRoute(language);
  const alternateRoute = researchRoute(isZh ? 'en' : 'zh');
  const filePath = path.join(rootDir, relativeRoute, 'index.html');
  const ctx = createPageContext(filePath);
  const topics = researchChildren.map((child) => ({ child, evidence: evidenceForTopic(child.id, posts) }));
  const body = `
    <header class="research-header">
      <p class="blog-kicker">${isZh ? '可核验的研究索引' : 'Verifiable research index'}</p>
      <h1>${isZh ? '研究方向' : 'Research'}</h1>
      <p>${isZh ? '按主题浏览公开项目、论文与研究写作。每个条目均链接到可访问的来源。' : 'Browse public projects, papers, and research writing by topic. Every item links to an accessible source.'}</p>
      <a class="btn btn-outline" href="${ctx.link(`${publicationsRoute(language)}index.html`)}">${isZh ? '查看全部论文' : 'View all publications'}</a>
    </header>
    <section class="research-section" aria-labelledby="research-topics-title">
      <div class="research-section-head"><h2 id="research-topics-title">${isZh ? '主题' : 'Topics'}</h2><span>${topics.length}</span></div>
      <div class="research-topic-list">
        ${topics.map(({ child, evidence }) => `<a class="research-topic-link" href="${ctx.link(`${researchRoute(language, `${child.id}/`)}index.html`)}">
          <span class="research-topic-copy"><strong>${escapeHtml(localized(child.title, language))}</strong><span>${escapeHtml(localized(child.description, language))}</span></span>
          <span class="research-topic-count">${evidence.length} ${isZh ? '项成果' : evidence.length === 1 ? 'item' : 'items'}</span>
        </a>`).join('')}
      </div>
    </section>`;
  const canonicalUrl = absoluteUrl(relativeRoute);
  const metadata = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#page`,
        name: isZh ? 'wcx12 研究方向' : 'wcx12 Research',
        description: isZh ? 'wcx12 的公开研究方向与可核验成果索引。' : 'An index of wcx12 research topics and verifiable public evidence.',
        url: canonicalUrl,
        inLanguage: isZh ? 'zh-CN' : 'en',
        mainEntity: { '@id': `${canonicalUrl}#topics` }
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#topics`,
        numberOfItems: topics.length,
        itemListElement: topics.map(({ child }, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'DefinedTerm',
            termCode: child.id,
            name: localized(child.title, language),
            description: localized(child.description, language),
            url: absoluteUrl(researchRoute(language, `${child.id}/`))
          }
        }))
      }
    ]
  });
  await writePage(`${relativeRoute}index.html`, renderShell({
    filePath,
    title: isZh ? '研究方向' : 'Research',
    description: isZh ? 'wcx12 的公开研究方向、项目、论文与研究写作索引。' : 'Public research topics, projects, papers, and research writing by wcx12.',
    body,
    jsonLd: metadata,
    schemaType: 'CollectionPage',
    contentLang: isZh ? 'zh-CN' : 'en',
    fixedLanguage: language,
    alternateUrl: alternateRoute
  }));
}

async function renderResearchTopic(posts, child, language) {
  const isZh = language === 'zh';
  const relativeRoute = researchRoute(language, `${child.id}/`);
  const alternateRoute = researchRoute(isZh ? 'en' : 'zh', `${child.id}/`);
  const filePath = path.join(rootDir, relativeRoute, 'index.html');
  const ctx = createPageContext(filePath);
  const evidence = evidenceForTopic(child.id, posts);
  const title = localized(child.title, language);
  const description = localized(child.description, language);
  const body = `
    <header class="research-header">
      <p class="blog-kicker">${escapeHtml(localized(child.label, language))}</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <div class="blog-hero-actions">
        <a class="btn btn-outline" href="${ctx.link(`${researchRoute(language)}index.html`)}">${isZh ? '全部研究方向' : 'All research topics'}</a>
        <a class="btn btn-outline" href="${ctx.link(`${publicationsRoute(language)}index.html`)}">${isZh ? '论文列表' : 'Publications'}</a>
        <a class="btn btn-outline research-demo-link" href="${ctx.link('index.html')}#research/${escapeHtml(child.id)}">${isZh ? '打开概念演示' : 'Open concept demo'}</a>
      </div>
    </header>
    ${evidenceSections(ctx, evidence, language)}`;
  const canonicalUrl = absoluteUrl(relativeRoute);
  const metadata = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#page`,
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: isZh ? 'zh-CN' : 'en',
        about: {
          '@type': 'DefinedTerm',
          termCode: child.id,
          name: title,
          description
        },
        mainEntity: { '@id': `${canonicalUrl}#evidence` }
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#evidence`,
        numberOfItems: evidence.length,
        itemListElement: evidence.map((item) => evidenceSchema(item, language))
      }
    ]
  });
  await writePage(`${relativeRoute}index.html`, renderShell({
    filePath,
    title: isZh ? `${title}研究` : `${title} Research`,
    description,
    body,
    jsonLd: metadata,
    schemaType: 'CollectionPage',
    contentLang: isZh ? 'zh-CN' : 'en',
    fixedLanguage: language,
    alternateUrl: alternateRoute
  }));
}

async function renderPublications(language) {
  const isZh = language === 'zh';
  const relativeRoute = publicationsRoute(language);
  const alternateRoute = publicationsRoute(isZh ? 'en' : 'zh');
  const filePath = path.join(rootDir, relativeRoute, 'index.html');
  const ctx = createPageContext(filePath);
  const evidence = staticPublications.map((publication) => ({
    type: 'ScholarlyArticle',
    key: `paper:${publication.doi}`,
    value: publication
  }));
  const body = `
    <header class="research-header">
      <p class="blog-kicker">${isZh ? '经 DOI 核验' : 'DOI-verified record'}</p>
      <h1>${isZh ? '论文' : 'Publications'}</h1>
      <p>${isZh ? 'Chenxu Wang（wcx12）署名的已发表与录用待刊论文。作者顺序与状态按公开记录展示。' : 'Published and in-press papers authored by Chenxu Wang (wcx12), with author order and status shown as verified.'}</p>
      <a class="btn btn-outline" href="${ctx.link(`${researchRoute(language)}index.html`)}">${isZh ? '浏览研究方向' : 'Browse research topics'}</a>
    </header>
    <section class="research-section" aria-labelledby="publication-list-title">
      <div class="research-section-head"><h2 id="publication-list-title">${isZh ? '论文记录' : 'Paper records'}</h2><span>${evidence.length}</span></div>
      <div class="research-evidence-list">${evidence.map((item) => evidenceHtml(ctx, item, language)).join('')}</div>
    </section>`;
  const canonicalUrl = absoluteUrl(relativeRoute);
  const metadata = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#page`,
        name: isZh ? 'wcx12 论文' : 'wcx12 Publications',
        description: isZh ? 'Chenxu Wang（wcx12）的 DOI 核验论文列表。' : 'DOI-verified publications authored by Chenxu Wang (wcx12).',
        url: canonicalUrl,
        inLanguage: isZh ? 'zh-CN' : 'en',
        mainEntity: { '@id': `${canonicalUrl}#publications` }
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#publications`,
        numberOfItems: evidence.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: staticPublications.map((publication) => publicationSchema(publication, language))
      }
    ]
  });
  await writePage(`${relativeRoute}index.html`, renderShell({
    filePath,
    title: isZh ? '论文' : 'Publications',
    description: isZh ? 'Chenxu Wang（wcx12）的 DOI 核验论文列表。' : 'DOI-verified publications authored by Chenxu Wang (wcx12).',
    body,
    jsonLd: metadata,
    schemaType: 'CollectionPage',
    contentLang: isZh ? 'zh-CN' : 'en',
    fixedLanguage: language,
    alternateUrl: alternateRoute
  }));
}

function publicationArea(publication) {
  const child = researchChildren.find((item) => publication.interests.includes(item.id));
  if (!child) return '';
  if (child.title.en === 'VPR') return child.label.en;
  return `${child.title.en} / ${child.label.en.replace(/\b\w/g, (letter) => letter.toUpperCase())}`;
}

async function renderPublicationsMarkdown() {
  const sections = staticPublications.map((publication) => {
    const statusLine = publication.status === 'In press'
      ? '- Status: Journal pre-proof; issue publication scheduled for 2026'
      : `- Year: ${publication.year}`;
    const heading = publication.status === 'In press' ? 'In Press' : publication.status;
    return `## ${heading}\n\n### ${publication.title}\n\n- Authors: ${readableAuthors(publication)}\n- Journal: ${publication.venue}\n${statusLine}\n- DOI: ${publication.link}\n- Research area: ${publicationArea(publication)}`;
  });
  const markdown = `# Publications\n\n${sections.join('\n\n')}\n\nOnly publications authored by Chenxu Wang (wcx12) are listed here. The interactive publication view on the homepage also links each entry to its DOI record.\n`;
  await fs.writeFile(path.join(rootDir, 'publications.md'), markdown);
}

async function renderResearchPages(posts) {
  for (const language of ['en', 'zh']) {
    await renderResearchIndex(posts, language);
    for (const child of researchChildren) await renderResearchTopic(posts, child, language);
    await renderPublications(language);
  }
  await renderPublicationsMarkdown();
}

async function renderJsonFeeds(posts) {
  const publicPosts = posts.map((post) => ({
    title: post.title,
    slug: post.slug,
    description: post.description,
    date: post.date,
    updated: post.updated,
    category: post.category,
    tags: post.tags,
    research: post.research,
    series: post.series,
    lang: post.lang,
    featured: post.featured,
    readingMinutes: post.readingMinutes,
    url: postUrl(post)
  }));
  const searchIndex = posts.map((post) => ({
    title: post.title,
    description: post.description,
    date: post.date,
    category: post.category,
    tags: post.tags,
    research: post.research,
    lang: post.lang,
    url: `./posts/${post.slug}/`,
    text: excerptText(post.renderedText || post.content, 420)
  }));

  await writePage('blog/posts.json', `${JSON.stringify(publicPosts, null, 2)}\n`);
  await writePage('blog/search.json', `${JSON.stringify(searchIndex, null, 2)}\n`);
}

async function renderRss(posts) {
  const latestPostDate = posts
    .map((post) => post.updated || post.date)
    .sort()
    .at(-1);
  const lastBuildDate = latestPostDate
    ? new Date(`${latestPostDate}T00:00:00Z`).toUTCString()
    : new Date(0).toUTCString();
  const items = posts.slice(0, 20).map((post) => {
    const categories = [post.category, ...post.tags]
      .map((category) => `      <category>${escapeXml(category)}</category>`)
      .join('\n');
    const itemUrl = absoluteUrl(postUrl(post));
    const content = String(post.renderedHtml || '')
      .replace(/\b(href|src)="([^"]+)"/g, (match, attribute, value) => {
        if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(value)) return match;
        return `${attribute}="${escapeHtml(new URL(value, itemUrl).href)}"`;
      })
      .replace(/]]>/g, ']]]]><![CDATA[>');
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(itemUrl)}</link>
      <guid>${escapeXml(itemUrl)}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
${categories}
      <content:encoded><![CDATA[${content}]]></content:encoded>
    </item>
  `;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <link>${escapeXml(absoluteUrl('blog/'))}</link>
    <atom:link href="${escapeXml(absoluteUrl('rss.xml'))}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE.description)}</description>
    <language>${escapeXml(SITE.lang)}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  await fs.writeFile(path.join(rootDir, 'rss.xml'), rss);
}

async function renderSitemap(posts) {
  const researchRoutes = ['en', 'zh'].flatMap((language) => [
    researchRoute(language),
    ...researchChildren.map((child) => researchRoute(language, `${child.id}/`)),
    publicationsRoute(language)
  ]);
  const latestPostDate = posts.map((post) => post.updated || post.date).sort().at(-1) || '2026-01-01';
  const latestEvidenceDate = [
    latestPostDate,
    ...localRepos.map((repo) => String(repo.updated_at || repo.pushed_at || '').slice(0, 10))
  ].filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort().at(-1) || latestPostDate;
  const urls = [
    { route: '', lastmod: latestEvidenceDate },
    { route: 'resume/', lastmod: latestEvidenceDate },
    { route: 'blog/', lastmod: latestPostDate },
    { route: 'blog/archive/', lastmod: latestPostDate },
    ...researchRoutes.map((route) => ({ route, lastmod: latestEvidenceDate })),
    ...posts.map((post) => ({ route: postUrl(post), lastmod: post.updated || post.date })),
    ...topicCounts(posts, 'tags').map(([tag]) => ({
      route: `blog/tags/${slugify(tag)}/`,
      lastmod: posts.filter((post) => post.tags.includes(tag)).map((post) => post.updated || post.date).sort().at(-1)
    }))
  ];
  const body = urls.map(({ route, lastmod }) => `  <url><loc>${escapeXml(absoluteUrl(route))}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`).join('\n');
  await fs.writeFile(path.join(rootDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`);
}

async function main() {
  const { posts, diagnostics, publicationCounts, today } = await loadPosts(rootDir);
  const { errors, warnings } = summarizeDiagnostics(diagnostics);
  warnings.forEach((warning) => console.warn(`warning: ${warning}`));
  if (errors.length) {
    errors.forEach((error) => console.error(`error: ${error}`));
    process.exit(1);
  }

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.rm(path.join(rootDir, 'resume'), { recursive: true, force: true });
  await fs.rm(path.join(rootDir, 'research'), { recursive: true, force: true });
  await fs.rm(path.join(rootDir, 'publications'), { recursive: true, force: true });
  await fs.rm(path.join(rootDir, 'zh'), { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await copyAssets();
  assetVersion = await computeAssetVersion(posts);
  await stampHomepageAssets();

  const renderer = createMarkdownRenderer();
  for (const post of posts) {
    await renderPost(post, posts, renderer);
  }
  await renderResume(renderer);
  await renderResearchPages(posts);
  await renderIndex(posts);
  await renderArchive(posts);
  await renderTagPages(posts);
  await renderJsonFeeds(posts);
  await renderRss(posts);
  await renderSitemap(posts);

  if (process.argv.includes('--preview-drafts')) {
    const previewResult = await loadPosts(rootDir, { includeDrafts: true, includeFuture: true, today });
    const unpublished = previewResult.posts.filter((post) => post.publicationState !== 'published');
    await renderDraftPreviews(unpublished, renderer);
    console.log(`Built local preview with ${unpublished.length} unpublished post(s).`);
  }

  console.log(`Built ${posts.length} public blog post(s) for ${today}; ${publicationCounts.scheduled} scheduled, ${publicationCounts.draft} draft.`);
}

await main();
