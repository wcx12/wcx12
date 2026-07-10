import fs from 'node:fs/promises';
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
  return `<div class="code-frame"><div class="code-head"><span>${escapeHtml(label)}</span><button class="code-copy" type="button" data-blog-i18n="code_copy">Copy</button></div><pre><code class="hljs language-${escapeHtml(normalizedLang)}">${highlighted}</code></pre></div>`;
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

function createPageContext(filePath) {
  const pageDir = path.dirname(filePath);
  return {
    link(target) {
      const absoluteTarget = path.join(rootDir, target);
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

function hintHtml(key) {
  return `<details class="blog-hint"><summary data-blog-i18n="hint_summary">${escapeHtml(blogText.hint_summary)}</summary><p data-blog-i18n="${key}">${escapeHtml(blogText[key])}</p></details>`;
}

function cardHtml(ctx, post) {
  const tags = post.tags.slice(0, 4).map((tag) => `<span class="blog-tag">${escapeHtml(tag)}</span>`).join('');
  return `
    <a class="blog-card" href="${postHref(ctx, post)}">
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

function renderShell({ filePath, title, description, body, extraHead = '', jsonLd = '', pageType = 'website', schemaType = 'WebPage', publishedTime = '', modifiedTime = '', contentLang = SITE.lang }) {
  const ctx = createPageContext(filePath);
  const pageTitle = title === SITE.title ? title : `${title} | ${SITE.title}`;
  const pageDescription = description || SITE.description;
  const canonicalUrl = canonicalUrlForFile(filePath);
  const socialImage = absoluteUrl('assets/og-home.png');
  const metadata = jsonLd || JSON.stringify({
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    inLanguage: contentLang,
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
<html lang="${escapeHtml(contentLang)}" data-content-lang="${escapeHtml(contentLang)}" data-ui-lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDescription)}" />
  <meta name="author" content="${escapeHtml(SITE.author)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta name="theme-color" content="#070914" />
  <meta name="color-scheme" content="dark" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="icon" type="image/svg+xml" href="${ctx.link('favicon.svg')}" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(pageDescription)}" />
  <meta property="og:type" content="${escapeHtml(pageType)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="${escapeHtml(SITE.title)}" />
  <meta property="og:locale" content="${contentLang === 'zh' ? 'zh_CN' : 'en_US'}" />
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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${ctx.link('styles.css')}" />
  <link rel="stylesheet" href="${ctx.link('blog/assets/blog.css')}" />
  ${extraHead}
  <script type="application/ld+json">${safeMetadata}</script>
</head>
<body class="blog-body">
  <div id="blogProgress" class="blog-progress" aria-hidden="true"></div>
  <header class="blog-topbar">
    <a class="blog-brand" href="${ctx.link('index.html')}">wcx12</a>
    <nav class="blog-nav" aria-label="Blog navigation">
      <a href="${ctx.link('index.html')}" title="Back to the interactive homepage" aria-label="Back to the interactive homepage" data-blog-i18n="nav_home" data-blog-i18n-title="nav_home_title" data-blog-i18n-aria="nav_home_title">Home</a>
      <a href="${ctx.link('blog/index.html')}" title="Open the blog index" aria-label="Open the blog index" data-blog-i18n="nav_blog" data-blog-i18n-title="nav_blog_title" data-blog-i18n-aria="nav_blog_title">Blog</a>
      <a href="${ctx.link('blog/archive/index.html')}" title="Browse all posts by date" aria-label="Browse all posts by date" data-blog-i18n="nav_archive" data-blog-i18n-title="nav_archive_title" data-blog-i18n-aria="nav_archive_title">Archive</a>
      <button id="blogLangToggle" class="blog-nav-button" type="button" title="Switch language" aria-label="Switch language" data-blog-i18n="lang_button" data-blog-i18n-title="lang_title" data-blog-i18n-aria="lang_title">中文</button>
      <select id="blogThemeSelect" aria-label="Switch color theme" title="Switch color theme" data-blog-i18n-title="theme_title" data-blog-i18n-aria="theme_title">
        <option value="neon" data-blog-i18n="theme_default">Default</option>
        <option value="warm" data-blog-i18n="theme_warm">Warm</option>
        <option value="mono" data-blog-i18n="theme_mono">Black &amp; White</option>
      </select>
    </nav>
  </header>
  <main class="blog-shell">
${body}
  </main>
  <script type="module" src="${ctx.link('blog/assets/blog.js')}"></script>
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

  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet('href') || '';
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
    render(markdown) {
      const env = { toc: [], headingCounts: new Map() };
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

async function writePage(relativeFile, html) {
  const filePath = path.join(rootDir, relativeFile);
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

async function renderIndex(posts) {
  const filePath = path.join(outputDir, 'index.html');
  const ctx = createPageContext(filePath);
  const featured = posts.filter((post) => post.featured).slice(0, 3);
  const recent = posts.slice(0, 6);
  const tagLinks = topicCounts(posts, 'tags')
    .slice(0, 14)
    .map(([tag, count]) => `<a class="blog-tag" href="${tagHref(ctx, tag)}">${escapeHtml(tag)} (${count})</a>`)
    .join('');

  const body = `
    <section class="blog-hero">
      <p class="blog-kicker" data-blog-i18n="hero_kicker">wcx12 Writing</p>
      <h1 data-blog-i18n="hero_title">Research Fieldnotes</h1>
      <p data-blog-i18n="hero_desc">Notes from my work in visual perception, point-cloud registration, VPR, LLM agents, and AI for Education: paper reading, experiment logs, and engineering reflections.</p>
      ${hintHtml('hint_hero')}
      <div class="blog-hero-actions">
        <a class="btn btn-primary" href="#recent-writing" data-blog-i18n="hero_read_latest">Read latest</a>
        <a class="btn btn-outline" href="${ctx.link('blog/archive/index.html')}" data-blog-i18n="hero_browse_archive">Browse archive</a>
      </div>
      <div class="blog-stat-grid">
        <article class="blog-stat"><span data-blog-i18n="stat_published">Published</span><strong>${posts.length}</strong></article>
        <article class="blog-stat"><span data-blog-i18n="stat_topics">Topics</span><strong>${topicCounts(posts, 'tags').length}</strong></article>
        <article class="blog-stat"><span data-blog-i18n="stat_search">Search</span><strong data-blog-i18n="stat_ready">Ready</strong></article>
      </div>
    </section>

    <section class="blog-section blog-search" aria-label="Search writing">
      <div class="blog-section-head">
        <div>
          <p class="blog-section-label" data-blog-i18n="section_search_label">Search</p>
          <h2 data-blog-i18n="section_search_title">Find notes by topic, tag, or summary</h2>
        </div>
        ${hintHtml('hint_search')}
      </div>
      <input id="blogSearch" type="search" placeholder="Search writing..." autocomplete="off" data-blog-i18n-ph="search_placeholder" />
      <div id="blogSearchResults" class="blog-search-results" aria-live="polite"></div>
    </section>

    ${featured.length ? `<section class="blog-section">
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

async function renderPost(post, posts, renderer) {
  const relativeFile = `blog/posts/${post.slug}/index.html`;
  const filePath = path.join(rootDir, relativeFile);
  const ctx = createPageContext(filePath);
  const { html, toc } = renderer.render(post.content);
  const index = posts.findIndex((item) => item.slug === post.slug);
  const newer = index > 0 ? posts[index - 1] : null;
  const older = index < posts.length - 1 ? posts[index + 1] : null;
  const related = relatedPostsFor(post, posts);
  const tagRow = renderTags(ctx, post.tags);
  const mathCss = post.math ? `<link rel="stylesheet" href="${ctx.link('blog/assets/katex.min.css')}" />` : '';

  const body = `
    <div class="blog-post-layout">
      <article class="blog-post-card">
        <header class="blog-post-header">
          <p class="blog-kicker">${escapeHtml(post.category)}</p>
          <h1 class="blog-post-title">${escapeHtml(post.title)}</h1>
          <div class="blog-meta">
            <span data-blog-date="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</span>
            <span data-blog-updated="${escapeHtml(post.updated)}">Updated ${escapeHtml(formatDate(post.updated))}</span>
            <span data-blog-minutes-long="${post.readingMinutes}">${post.readingMinutes} min read</span>
            ${post.series ? `<span>${escapeHtml(post.series)}</span>` : ''}
          </div>
          <p class="blog-post-subtitle">${escapeHtml(post.description)}</p>
          ${hintHtml('hint_post')}
          <div class="blog-tag-row">${tagRow}</div>
        </header>
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
      <aside class="blog-toc">
        <h2 data-blog-i18n="toc_title">Contents</h2>
        ${hintHtml('hint_toc')}
        ${post.toc ? tocHtml(toc) : '<p class="muted" data-blog-i18n="toc_disabled">Contents disabled.</p>'}
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
    contentLang: post.lang
  }));

  post.renderedText = stripHtml(html);
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
          ${items.map((post) => `<li><a href="${postHref(ctx, post)}">${escapeHtml(post.title)}</a> <span class="muted">- <span data-blog-date="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</span> - ${escapeHtml(post.category)}</span></li>`).join('')}
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
  const items = posts.slice(0, 20).map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(absoluteUrl(postUrl(post)))}</link>
      <guid>${escapeXml(absoluteUrl(postUrl(post)))}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>
  `).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <link>${escapeXml(absoluteUrl('blog/'))}</link>
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
  const urls = [
    '',
    'blog/',
    'blog/archive/',
    ...posts.map((post) => postUrl(post)),
    ...topicCounts(posts, 'tags').map(([tag]) => `blog/tags/${slugify(tag)}/`)
  ];
  const body = urls.map((url) => `  <url><loc>${escapeXml(absoluteUrl(url))}</loc></url>`).join('\n');
  await fs.writeFile(path.join(rootDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`);
}

async function main() {
  const { posts, diagnostics } = await loadPosts(rootDir);
  const { errors, warnings } = summarizeDiagnostics(diagnostics);
  warnings.forEach((warning) => console.warn(`warning: ${warning}`));
  if (errors.length) {
    errors.forEach((error) => console.error(`error: ${error}`));
    process.exit(1);
  }

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await copyAssets();

  const renderer = createMarkdownRenderer();
  for (const post of posts) {
    await renderPost(post, posts, renderer);
  }
  await renderIndex(posts);
  await renderArchive(posts);
  await renderTagPages(posts);
  await renderJsonFeeds(posts);
  await renderRss(posts);
  await renderSitemap(posts);

  console.log(`Built ${posts.length} blog post(s).`);
}

await main();
