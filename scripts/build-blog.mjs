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
import { homepageI18n, homepageSeo } from '../homepage-i18n.js';
import { localRepos, ORCID_ID, staticPublications } from '../site-data.js';
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
const CONFIG_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
for (const [kind, id] of [
  ...researchConfig.interests.map((interest) => ['domain', interest.id]),
  ...researchChildren.map((interest) => ['interest', interest.id])
]) {
  if (typeof id !== 'string' || !CONFIG_ID_PATTERN.test(id)) {
    throw new Error(`Invalid research ${kind} id: ${JSON.stringify(id)}`);
  }
}
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setHtmlAttribute(tag, attribute, value) {
  const encoded = escapeHtml(value);
  const pattern = new RegExp(`\\s${escapeRegExp(attribute)}="[^"]*"`, 'i');
  if (pattern.test(tag)) return tag.replace(pattern, ` ${attribute}="${encoded}"`);
  return tag.replace(/(\s*\/?>)$/, ` ${attribute}="${encoded}"$1`);
}

function translateHomepageMarkup(source, language) {
  const translations = homepageI18n[language];
  if (!translations) throw new Error(`Unsupported homepage language: ${language}`);
  let output = source;
  const rawHtmlKeys = new Set(['hero_subtitle_html']);
  const textKeys = [...new Set([...source.matchAll(/\bdata-i18n="([^"]+)"/g)].map((match) => match[1]))];

  for (const key of textKeys) {
    const value = translations[key];
    if (typeof value !== 'string') throw new Error(`Homepage translation ${language}.${key} must be a string`);
    const pattern = new RegExp(`(<([a-z][\\w:-]*)\\b(?=[^>]*\\bdata-i18n="${escapeRegExp(key)}")[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'gi');
    let replacements = 0;
    output = output.replace(pattern, (match, opening, tagName, body, closing) => {
      replacements += 1;
      return `${opening}${rawHtmlKeys.has(key) ? value : escapeHtml(value)}${closing}`;
    });
    if (!replacements) throw new Error(`Unable to render homepage translation ${language}.${key}`);
  }

  for (const [dataAttribute, targetAttribute] of [
    ['data-i18n-ph', 'placeholder'],
    ['data-i18n-aria', 'aria-label'],
    ['data-i18n-title', 'title']
  ]) {
    const keys = [...new Set([...source.matchAll(new RegExp(`\\b${dataAttribute}="([^"]+)"`, 'g'))].map((match) => match[1]))];
    for (const key of keys) {
      const value = translations[key];
      if (typeof value !== 'string') throw new Error(`Homepage translation ${language}.${key} must be a string`);
      const pattern = new RegExp(`<([a-z][\\w:-]*)\\b(?=[^>]*\\b${dataAttribute}="${escapeRegExp(key)}")[^>]*>`, 'gi');
      let replacements = 0;
      output = output.replace(pattern, (tag) => {
        replacements += 1;
        return setHtmlAttribute(tag, targetAttribute, value);
      });
      if (!replacements) throw new Error(`Unable to render homepage attribute ${language}.${key}`);
    }
  }

  return output;
}

function personReference() {
  return {
    '@type': 'Person',
    '@id': absoluteUrl('#person'),
    name: SITE.author,
    url: absoluteUrl()
  };
}

function personEntity() {
  return {
    ...personReference(),
    alternateName: 'wcx12',
    email: 'mailto:c2675668@gmail.com',
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'ORCID',
      value: ORCID_ID,
      url: `https://orcid.org/${ORCID_ID}`
    },
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: 'Beijing Institute of Technology'
    },
    sameAs: [
      'https://github.com/wcx12',
      `https://orcid.org/${ORCID_ID}`
    ]
  };
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
    nav_projects: 'Projects',
    nav_projects_title: 'Browse public repositories with maturity and evidence notes',
    nav_publications: 'Publications',
    nav_publications_title: 'Browse publisher-linked publications',
    nav_blog: 'Writing',
    nav_blog_title: 'Open Research Fieldnotes',
    nav_archive: 'Archive',
    nav_archive_title: 'Browse all posts by date',
    nav_landmark: 'Site navigation',
    profile_links: 'Profile links',
    orcid_title: `View ORCID record ${ORCID_ID}`,
    nav_menu: 'Menu',
    nav_menu_title: 'Open site navigation',
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
    nav_projects: '项目',
    nav_projects_title: '浏览含阶段与公开证据说明的项目',
    nav_publications: '论文',
    nav_publications_title: '浏览含出版方链接的论文',
    nav_blog: '英文博客',
    nav_blog_title: '打开知研札记',
    nav_archive: '归档',
    nav_archive_title: '按日期浏览所有文章',
    nav_landmark: '站点导航',
    profile_links: '个人资料链接',
    orcid_title: `查看 ORCID 记录 ${ORCID_ID}`,
    nav_menu: '菜单',
    nav_menu_title: '打开站点导航',
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

function resolveSocialImage(value) {
  const image = String(value || 'assets/og-home.png').trim();
  return /^https?:\/\//i.test(image) ? image : absoluteUrl(image);
}

function socialImageMimeType(value) {
  const pathname = String(value || '').split(/[?#]/, 1)[0].toLowerCase();
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.avif')) return 'image/avif';
  if (pathname.endsWith('.gif')) return 'image/gif';
  return 'image/png';
}

function metadataWithSocialImage(jsonLd, fallback, image) {
  const metadata = jsonLd ? JSON.parse(jsonLd) : fallback;
  const nodes = metadata['@graph'] || [metadata];
  const typeList = (node) => Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']].filter(Boolean);
  const page = nodes.find((node) => typeList(node).some((type) => ['WebPage', 'ProfilePage', 'CollectionPage'].includes(type)));
  const article = nodes.find((node) => typeList(node).includes('BlogPosting'));
  const blog = nodes.find((node) => typeList(node).includes('Blog'));
  if (page && !page.primaryImageOfPage) page.primaryImageOfPage = image;
  if (article && !article.image) article.image = image;
  if (blog && !blog.image) blog.image = image;
  return metadata;
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
  articleAuthorUrl = '',
  articleSection = '',
  articleTags = [],
  contentLang = SITE.lang,
  fixedLanguage = '',
  alternateUrl = '',
  canonicalUrlOverride = '',
  socialImagePath = 'assets/og-home.png',
  socialImageAlt = 'wcx12 research portfolio and fieldnotes',
  socialImageWidth = 1200,
  socialImageHeight = 630,
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
  const socialImage = resolveSocialImage(socialImagePath);
  const socialImageType = socialImageMimeType(socialImage);
  const imageEntity = {
    '@type': 'ImageObject',
    url: socialImage,
    width: socialImageWidth,
    height: socialImageHeight,
    caption: socialImageAlt
  };
  const routeLanguage = fixedLanguage === 'zh' ? 'zh' : 'en';
  const documentLanguage = contentLang === 'zh' ? 'zh-CN' : contentLang;
  const text = shellText[routeLanguage];
  const homePath = fixedLanguage === 'zh' ? 'zh/index.html' : 'index.html';
  const resumePath = fixedLanguage === 'zh' ? 'zh/resume/index.html' : 'resume/index.html';
  const researchPath = fixedLanguage === 'zh' ? 'zh/research/index.html' : 'research/index.html';
  const projectsPath = fixedLanguage === 'zh' ? 'zh/projects/index.html' : 'projects/index.html';
  const publicationsPath = fixedLanguage === 'zh' ? 'zh/publications/index.html' : 'publications/index.html';
  const currentSection = /^(?:zh\/)?resume\//.test(relativeFilePath)
    ? 'profile'
    : /^(?:zh\/)?projects\//.test(relativeFilePath)
      ? 'projects'
    : /^(?:zh\/)?research\//.test(relativeFilePath)
      ? 'research'
      : /^(?:zh\/)?publications\//.test(relativeFilePath)
        ? 'publications'
        : (isBlogPage ? 'writing' : 'home');
  const current = (section) => currentSection === section ? ' aria-current="page"' : '';
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
  const metadata = metadataWithSocialImage(jsonLd, {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    inLanguage: documentLanguage,
    author: personReference()
  }, imageEntity);
  const safeMetadata = JSON.stringify(metadata).replace(/</g, '\\u003c');
  const articleMetadata = [
    publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />` : '',
    modifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(modifiedTime)}" />` : '',
    articleAuthorUrl ? `<meta property="article:author" content="${escapeHtml(articleAuthorUrl)}" />` : '',
    articleSection ? `<meta property="article:section" content="${escapeHtml(articleSection)}" />` : '',
    ...articleTags.map((tag) => `<meta property="article:tag" content="${escapeHtml(tag)}" />`)
  ].filter(Boolean).map((tag) => `  ${tag}`).join('\n');
  return `<!doctype html>
<html lang="${escapeHtml(documentLanguage)}" data-content-lang="${escapeHtml(documentLanguage)}" data-ui-lang="${routeLanguage}"${fixedLanguage ? ` data-fixed-language="${routeLanguage}"` : ''}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'" />
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
${fixedLanguage && alternateHref ? `  <meta property="og:locale:alternate" content="${routeLanguage === 'zh' ? 'en_US' : 'zh_CN'}" />\n` : ''}  <meta property="og:image" content="${escapeHtml(socialImage)}" />
  <meta property="og:image:type" content="${escapeHtml(socialImageType)}" />
  <meta property="og:image:width" content="${escapeHtml(socialImageWidth)}" />
  <meta property="og:image:height" content="${escapeHtml(socialImageHeight)}" />
  <meta property="og:image:alt" content="${escapeHtml(socialImageAlt)}" />
${articleMetadata ? `${articleMetadata}\n` : ''}  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(pageDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(socialImage)}" />
  <meta name="twitter:image:alt" content="${escapeHtml(socialImageAlt)}" />
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(SITE.title)}" href="${escapeHtml(absoluteUrl('rss.xml'))}" />
  <link rel="sitemap" type="application/xml" href="${escapeHtml(absoluteUrl('sitemap.xml'))}" />
  <link rel="stylesheet" href="${versionedAssetLink(ctx, 'styles.css')}" />
  <link rel="stylesheet" href="${versionedAssetLink(ctx, 'blog/assets/blog.css')}" />
${extraHead.trim()}
  <script type="application/ld+json">${safeMetadata}</script>
</head>
<body class="blog-body">
  <a class="skip-link" href="#main-content"${i18n('skip_main')}>${escapeHtml(text.skip_main)}</a>
  <div id="blogProgress" class="blog-progress" aria-hidden="true"></div>
  <header class="blog-topbar">
    <a class="blog-brand" href="${ctx.link(homePath)}">wcx12</a>
    <div class="blog-menu">
      <button class="blog-menu-toggle" type="button" aria-expanded="false" aria-controls="blogSiteNav" title="${escapeHtml(text.nav_menu_title)}" aria-label="${escapeHtml(text.nav_menu_title)}"${i18n('nav_menu')}${i18n('nav_menu_title', 'title')}${i18n('nav_menu_title', 'aria')}>${escapeHtml(text.nav_menu)}</button>
      <nav id="blogSiteNav" class="blog-nav" aria-label="${escapeHtml(text.nav_landmark)}"${i18n('nav_landmark', 'aria')}>
        <a href="${ctx.link(homePath)}"${current('home')} title="${escapeHtml(text.nav_home_title)}" aria-label="${escapeHtml(text.nav_home_title)}"${i18n('nav_home')}${i18n('nav_home_title', 'title')}${i18n('nav_home_title', 'aria')}>${escapeHtml(text.nav_home)}</a>
        <a href="${ctx.link(resumePath)}"${current('profile')} title="${escapeHtml(text.nav_profile_title)}" aria-label="${escapeHtml(text.nav_profile_title)}"${i18n('nav_profile')}${i18n('nav_profile_title', 'title')}${i18n('nav_profile_title', 'aria')}>${escapeHtml(text.nav_profile)}</a>
        <a href="${ctx.link(researchPath)}"${current('research')} title="${escapeHtml(text.nav_research_title)}" aria-label="${escapeHtml(text.nav_research_title)}"${i18n('nav_research')}${i18n('nav_research_title', 'title')}${i18n('nav_research_title', 'aria')}>${escapeHtml(text.nav_research)}</a>
        <a href="${ctx.link(projectsPath)}"${current('projects')} title="${escapeHtml(text.nav_projects_title)}" aria-label="${escapeHtml(text.nav_projects_title)}"${i18n('nav_projects')}${i18n('nav_projects_title', 'title')}${i18n('nav_projects_title', 'aria')}>${escapeHtml(text.nav_projects)}</a>
        <a href="${ctx.link(publicationsPath)}"${current('publications')} title="${escapeHtml(text.nav_publications_title)}" aria-label="${escapeHtml(text.nav_publications_title)}"${i18n('nav_publications')}${i18n('nav_publications_title', 'title')}${i18n('nav_publications_title', 'aria')}>${escapeHtml(text.nav_publications)}</a>
        <a href="${ctx.link('blog/index.html')}"${current('writing')} title="${escapeHtml(text.nav_blog_title)}" aria-label="${escapeHtml(text.nav_blog_title)}"${i18n('nav_blog')}${i18n('nav_blog_title', 'title')}${i18n('nav_blog_title', 'aria')}>${escapeHtml(text.nav_blog)}</a>
        ${languageControl}
        <select id="blogThemeSelect" aria-label="${escapeHtml(text.theme_title)}" title="${escapeHtml(text.theme_title)}"${i18n('theme_title', 'title')}${i18n('theme_title', 'aria')}>
          <option value="neon"${i18n('theme_default')}>${escapeHtml(text.theme_default)}</option>
          <option value="warm"${i18n('theme_warm')}>${escapeHtml(text.theme_warm)}</option>
          <option value="mono"${i18n('theme_mono')}>${escapeHtml(text.theme_mono)}</option>
        </select>
      </nav>
    </div>
  </header>
  <main id="main-content" class="blog-shell">
${body.trim()}
  </main>
  <footer class="blog-footer">
    <span>&copy; ${SITE.copyrightYear} wcx12</span>
    <nav aria-label="${escapeHtml(text.profile_links)}"${i18n('profile_links', 'aria')}>
      <a href="${ctx.link(homePath)}"${i18n('nav_home')}>${escapeHtml(text.nav_home)}</a>
      <a href="https://github.com/wcx12" target="_blank" rel="me noreferrer">GitHub</a>
      <a href="https://orcid.org/${ORCID_ID}" target="_blank" rel="me noreferrer" aria-label="${escapeHtml(text.orcid_title)}"${i18n('orcid_title', 'aria')}>ORCID</a>
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
    tokens[idx].attrSet('referrerpolicy', 'no-referrer');
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
    },
    renderSections(markdown, post = null) {
      const env = { toc: [], headingCounts: new Map(), post };
      const tokens = md.parse(markdown, env);
      const sections = [];
      let current = null;

      for (let index = 0; index < tokens.length;) {
        const token = tokens[index];
        if (token.type === 'heading_open' && token.tag === 'h2') {
          if (current) sections.push(current);
          const title = tokens[index + 1]?.content?.trim();
          if (!title || tokens[index + 2]?.type !== 'heading_close') {
            throw new Error('Resume level-two headings must contain plain text titles.');
          }
          current = { title, tokens: [] };
          index += 3;
          continue;
        }
        if (!current) throw new Error('Resume content must begin with a level-two heading.');
        current.tokens.push(token);
        index += 1;
      }
      if (current) sections.push(current);
      if (!sections.length) throw new Error('Resume must contain at least one level-two section.');

      const idCounts = new Map();
      return sections.map((section) => {
        const baseId = `profile-${slugify(section.title)}`;
        const count = idCounts.get(baseId) || 0;
        idCounts.set(baseId, count + 1);
        return {
          id: count ? `${baseId}-${count + 1}` : baseId,
          title: section.title,
          html: md.renderer.render(section.tokens, md.options, env)
        };
      });
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
    author: personReference(),
    mainEntityOfPage: url,
    keywords: post.tags
  });
}

function postSocialImage(post) {
  const configured = String(post.socialImage || '').trim();
  if (!configured) {
    return {
      path: 'assets/og-blog.png',
      alt: `${post.title} on ${SITE.title}`
    };
  }
  if (/^https?:\/\//i.test(configured)) {
    return { path: configured, alt: post.socialImageAlt };
  }
  const normalized = configured.replace(/^\.\//, '');
  const media = post.mediaFiles.find((item) => item.publicPath === normalized);
  const suffix = media ? `?v=${media.version}` : '';
  return {
    path: absoluteUrl(`${postUrl(post)}${normalized}${suffix}`),
    alt: post.socialImageAlt
  };
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
    },
    ...[
      './site-data.js',
      './homepage-i18n.js',
      './scripts/research-config-schema.js'
    ].map((assetPath) => ({
      pattern: new RegExp(`(<link\\s+rel="modulepreload"\\s+href="${escapeRegExp(assetPath)})(?:\\?v=[a-f0-9]{12})?("\\s*\\/?>)`),
      replacement: `$1?v=${assetVersion}$2`
    }))
  ];
  let stamped = source;
  for (const { pattern, replacement } of replacements) {
    if (!pattern.test(stamped)) throw new Error(`Unable to stamp homepage asset using ${pattern}.`);
    stamped = stamped.replace(pattern, replacement);
  }
  stamped = replaceRequired(stamped, /<noscript>[\s\S]*?<\/noscript>/, renderHomepageNoscript('en'), 'English no-script navigation');
  stamped = translateHomepageMarkup(stamped, 'en');
  stamped = localizeHomepageMetadata(stamped, 'en');
  stamped = localizeHomepageStructuredData(stamped, 'en');
  stamped = stamped.replace(/\r\n?/g, '\n');
  if (stamped !== source) await fs.writeFile(filePath, stamped);
}

function replaceHomepageMeta(source, attribute, key, content) {
  const pattern = new RegExp(`(<meta\\s+${escapeRegExp(attribute)}="${escapeRegExp(key)}"\\s+content=")[^"]*("\\s*\\/?>)`);
  if (!pattern.test(source)) throw new Error(`Unable to localize homepage metadata ${attribute}=${key}`);
  return source.replace(pattern, `$1${escapeHtml(content)}$2`);
}

function replaceRequired(source, pattern, replacement, label) {
  const found = pattern instanceof RegExp ? pattern.test(source) : source.includes(pattern);
  if (!found) throw new Error(`Unable to render homepage ${label}`);
  return source.replace(pattern, replacement);
}

function replaceAllRequired(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Unable to render homepage ${label}`);
  return source.replaceAll(search, replacement);
}

function renderHomepageNoscript(language) {
  const copy = homepageSeo[language]?.noscript;
  if (!copy) throw new Error(`Missing homepage noscript copy for ${language}`);
  const links = copy.links.map(([href, label, linkLanguage = '']) => {
    const languageAttributes = linkLanguage
      ? ` hreflang="${escapeHtml(linkLanguage)}" lang="${escapeHtml(linkLanguage)}"`
      : '';
    return `          <a href="${escapeHtml(href)}"${languageAttributes}>${escapeHtml(label)}</a>`;
  }).join('\n');
  return `<noscript>
      <section class="noscript-notice" aria-labelledby="noscriptTitle">
        <p class="panel-eyebrow">${escapeHtml(copy.label)}</p>
        <h2 id="noscriptTitle">${escapeHtml(copy.title)}</h2>
        <p>${escapeHtml(copy.description)}</p>
        <nav aria-label="${escapeHtml(copy.navigationLabel)}">
${links}
        </nav>
      </section>
    </noscript>`;
}

function localizeHomepageMetadata(source, language) {
  const seo = homepageSeo[language];
  if (!seo) throw new Error(`Missing homepage SEO metadata for ${language}`);
  const pageUrl = absoluteUrl(language === 'zh' ? 'zh/' : '');
  const imageUrl = absoluteUrl(seo.imagePath);
  let localized = replaceRequired(source, /<title>[^<]*<\/title>/, `<title>${escapeHtml(seo.title)}</title>`, `${language} title`);
  localized = replaceRequired(localized, /(<link\s+rel="canonical"\s+href=")[^"]*("\s*\/?>)/, `$1${pageUrl}$2`, `${language} canonical`);
  localized = replaceHomepageMeta(localized, 'name', 'description', seo.description);
  localized = replaceHomepageMeta(localized, 'property', 'og:title', seo.title);
  localized = replaceHomepageMeta(localized, 'property', 'og:description', seo.description);
  localized = replaceHomepageMeta(localized, 'property', 'og:url', pageUrl);
  localized = replaceHomepageMeta(localized, 'property', 'og:site_name', seo.siteName);
  localized = replaceHomepageMeta(localized, 'property', 'og:locale', seo.locale);
  localized = replaceHomepageMeta(localized, 'property', 'og:locale:alternate', seo.alternateLocale);
  localized = replaceHomepageMeta(localized, 'property', 'og:image', imageUrl);
  localized = replaceHomepageMeta(localized, 'property', 'og:image:alt', seo.imageAlt);
  localized = replaceHomepageMeta(localized, 'name', 'twitter:title', seo.title);
  localized = replaceHomepageMeta(localized, 'name', 'twitter:description', seo.description);
  localized = replaceHomepageMeta(localized, 'name', 'twitter:image', imageUrl);
  localized = replaceHomepageMeta(localized, 'name', 'twitter:image:alt', seo.imageAlt);
  return localized;
}

function localizeHomepageStructuredData(source, language) {
  const seo = homepageSeo[language];
  const pageUrl = absoluteUrl(language === 'zh' ? 'zh/' : '');
  const imageUrl = absoluteUrl(seo.imagePath);
  let profilePages = 0;
  const localized = source.replace(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g, (match, json) => {
    const metadata = JSON.parse(json);
    if (metadata['@type'] === 'ProfilePage') {
      profilePages += 1;
      metadata['@id'] = `${pageUrl}#profile`;
      metadata.url = pageUrl;
      metadata.name = seo.profileName;
      metadata.description = seo.description;
      metadata.inLanguage = language === 'zh' ? 'zh-CN' : 'en';
      metadata.primaryImageOfPage = {
        '@type': 'ImageObject',
        url: imageUrl,
        width: 1200,
        height: 630,
        caption: seo.imageAlt
      };
      metadata.mainEntity.knowsAbout = seo.knowsAbout;
    } else if (metadata['@type'] === 'WebSite') {
      metadata.alternateName = seo.websiteName;
      metadata.inLanguage = ['en', 'zh-CN'];
    }
    const safeJson = JSON.stringify(metadata, null, 2).replace(/</g, '\\u003c');
    return `<script type="application/ld+json">\n${safeJson}\n  </script>`;
  });
  if (profilePages !== 1) throw new Error(`Expected one homepage ProfilePage, found ${profilePages}`);
  return localized;
}

async function renderChineseHomepage() {
  const rootSource = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  let localized = replaceRequired(
    rootSource,
    '<html lang="en" data-fixed-language="en">',
    '<html lang="zh-CN" data-fixed-language="zh">',
    'Chinese document language'
  );
  for (const [search, replacement, label] of [
    ['href="./favicon.svg"', 'href="../favicon.svg"', 'Chinese favicon path'],
    ['href="./sitemap.xml"', 'href="../sitemap.xml"', 'Chinese sitemap path'],
    ['href="./rss.xml"', 'href="../rss.xml"', 'Chinese RSS path'],
    ['href="styles.css', 'href="../styles.css', 'Chinese stylesheet path'],
    ['src="script.js', 'src="../script.js', 'Chinese script path'],
    ['href="./site-data.js', 'href="../site-data.js', 'Chinese site data preload path'],
    ['href="./homepage-i18n.js', 'href="../homepage-i18n.js', 'Chinese translations preload path'],
    ['href="./scripts/research-config-schema.js', 'href="../scripts/research-config-schema.js', 'Chinese research schema preload path']
  ]) {
    localized = replaceRequired(localized, search, replacement, label);
  }
  localized = replaceAllRequired(localized, 'href="./blog/"', 'href="../blog/"', 'Chinese blog paths');
  localized = replaceRequired(
    localized,
    /<a id="langToggle"[^>]*>/,
    `<a id="langToggle" class="ghost-btn" href="../" hreflang="en" lang="en" title="${escapeHtml(homepageI18n.zh.lang_link_aria)}" aria-label="${escapeHtml(homepageI18n.zh.lang_link_aria)}" data-i18n="lang_btn" data-i18n-title="lang_link_aria" data-i18n-aria="lang_link_aria">`,
    'Chinese language link'
  );
  localized = replaceRequired(localized, /<noscript>[\s\S]*?<\/noscript>/, renderHomepageNoscript('zh'), 'Chinese no-script navigation');
  localized = translateHomepageMarkup(localized, 'zh');
  localized = localizeHomepageMetadata(localized, 'zh');
  localized = localizeHomepageStructuredData(localized, 'zh');
  await writePage('zh/index.html', localized);
}

async function renderIndex(posts) {
  const filePath = path.join(outputDir, 'index.html');
  const ctx = createPageContext(filePath);
  const featured = posts.filter((post) => post.featured).slice(0, 3);
  const recent = posts.slice(0, 6);
  const showSearch = posts.length >= 3;
  const showFeatured = posts.length >= 3 && featured.length > 0;
  const showArchive = posts.length > 1;
  const showStats = posts.length >= 3;
  const latestHref = posts.length === 1 ? postHref(ctx, posts[0]) : '#recent-writing';
  const tagLinks = topicCounts(posts, 'tags')
    .filter(([, count]) => count >= 2)
    .slice(0, 14)
    .map(([tag, count]) => `<a class="blog-tag" href="${tagHref(ctx, tag)}">${escapeHtml(tag)} (${count})</a>`)
    .join('');

  const recentSection = `
    <section id="recent-writing" class="blog-section blog-latest-section">
      <div class="blog-section-head">
        <div>
          <p class="blog-section-label" data-blog-i18n="section_recent_label">Recent</p>
          <h2 data-blog-i18n="section_recent_title">Latest writing</h2>
        </div>
        <div class="blog-section-tools">
          ${hintHtml('hint_recent')}${showArchive ? `
          <a class="blog-tag" href="${ctx.link('blog/archive/index.html')}" data-blog-i18n="nav_archive">Archive</a>` : ''}
        </div>
      </div>
      <div class="blog-grid">${recent.map((post) => cardHtml(ctx, post)).join('')}</div>
    </section>`;

  const body = `
    <section class="blog-hero${showStats ? '' : ' blog-hero-compact'}">
      <p class="blog-kicker" data-blog-i18n="hero_kicker">Research · Engineering · Reflection</p>
      <h1 data-blog-i18n="hero_title">Research Fieldnotes</h1>
      <p data-blog-i18n="hero_desc">Tracing how research questions are broken down, experiments are verified, and code becomes a reproducible answer.</p>
      ${hintHtml('hint_hero')}
      <div class="blog-hero-actions">
        <a class="btn btn-primary" href="${latestHref}" data-blog-i18n="hero_read_latest">Read latest</a>${showArchive ? `
        <a class="btn btn-outline" href="${ctx.link('blog/archive/index.html')}" data-blog-i18n="hero_browse_archive">Browse archive</a>` : ''}
      </div>${showStats ? `
      <div class="blog-stat-grid">
        <article class="blog-stat"><span data-blog-i18n="stat_published">Published</span><strong>${posts.length}</strong></article>
        <article class="blog-stat"><span data-blog-i18n="stat_topics">Topics</span><strong>${topicCounts(posts, 'tags').length}</strong></article>
        ${showSearch
          ? '<article class="blog-stat"><span data-blog-i18n="stat_search">Search</span><strong data-blog-i18n="stat_ready">Ready</strong></article>'
          : '<article class="blog-stat"><span data-blog-i18n="stat_language">Languages</span><strong data-blog-i18n="stat_bilingual">EN / 中文</strong></article>'}
      </div>` : ''}
    </section>

${recentSection}

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

${tagLinks ? `    <section class="blog-section">
      <div class="blog-section-head">
        <div>
          <p class="blog-section-label" data-blog-i18n="section_topics_label">Topics</p>
          <h2 data-blog-i18n="section_topics_title">Browse by tag</h2>
        </div>
        ${hintHtml('hint_topics')}
      </div>
      <div class="blog-topic-grid">${tagLinks}</div>
    </section>` : ''}
  `;

  await writePage('blog/index.html', renderShell({
    filePath,
    title: SITE.title,
    description: SITE.description,
    body,
    schemaType: 'Blog',
    socialImagePath: 'assets/og-blog.png',
    socialImageAlt: 'Research Fieldnotes writing index by Chenxu Wang'
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
  const socialImage = postSocialImage(post);

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
    articleAuthorUrl: absoluteUrl(''),
    articleSection: post.category,
    articleTags: post.tags,
    socialImagePath: socialImage.path,
    socialImageAlt: socialImage.alt,
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
    'homepage-i18n.js',
    'site-data.js',
    'research-canvas.js',
    'repo-map.js',
    'research-config.json',
    'favicon.svg',
    'rss.xml',
    'sitemap.xml',
    'assets',
    'blog',
    'projects',
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
    schemaType: 'CollectionPage',
    socialImagePath: 'assets/og-blog.png',
    socialImageAlt: 'Research Fieldnotes chronological writing archive',
    robots: posts.length > 1 ? 'index,follow,max-image-preview:large' : 'noindex,follow'
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
      schemaType: 'CollectionPage',
      socialImagePath: 'assets/og-blog.png',
      socialImageAlt: `Research Fieldnotes tagged ${tag}`,
      robots: tagged.length >= 2 ? 'index,follow,max-image-preview:large' : 'noindex,follow'
    }));
  }
}

async function renderResume(renderer, language) {
  const isZh = language === 'zh';
  const relativeRoute = resumeRoute(language);
  const alternateRoute = resumeRoute(isZh ? 'en' : 'zh');
  const sourceFile = isZh ? 'resume.zh.md' : 'resume.md';
  const source = await fs.readFile(path.join(rootDir, sourceFile), 'utf8');
  const text = isZh ? {
    kicker: '学术履历',
    role: '机器学习研究者',
    location: '中国北京',
    summary: '研究不完整观测与有限标注条件下的可靠视觉智能，并将方法落实为可复现的研究工程。',
    statusLabel: '当前状态',
    status: '正在申请硕士与博士项目',
    print: '打印 / 保存 PDF',
    contact: '邮件联系',
    sections: '履历目录',
    direction: '研究主线',
    directionText: '三维几何、视觉定位、医学影像与证据驱动的智能体系统。',
    affiliation: '学校',
    graduation: '预计毕业',
    publications: '论文',
    researchAreas: '研究方向',
    emailLabel: '发送邮件给 Chenxu Wang',
    githubLabel: '在新标签页打开 GitHub 主页',
    orcidLabel: `在新标签页打开 ORCID 记录 ${ORCID_ID}`,
    doiLabel: (title) => `在新标签页打开论文 ${title} 的 DOI`
  } : {
    kicker: 'Academic profile',
    role: 'Machine Learning Researcher',
    location: 'Beijing, China',
    summary: 'I study reliable visual intelligence under incomplete observations and limited labels, then turn the methods into reproducible research software.',
    statusLabel: 'Current status',
    status: "Applying for Master's and PhD opportunities",
    print: 'Print / Save PDF',
    contact: 'Email me',
    sections: 'Profile sections',
    direction: 'Research direction',
    directionText: '3D geometry, visual localization, medical imaging, and evidence-grounded agent systems.',
    affiliation: 'Affiliation',
    graduation: 'Expected graduation',
    publications: 'Publications',
    researchAreas: 'Research areas',
    emailLabel: 'Email Chenxu Wang',
    githubLabel: 'Open the GitHub profile in a new tab',
    orcidLabel: `Open ORCID record ${ORCID_ID} in a new tab`,
    doiLabel: (title) => `Open the DOI for ${title} in a new tab`
  };
  const publicationMarker = 'RESUME_PUBLICATIONS_PLACEHOLDER';
  const publicationList = `<ol class="resume-publications">${staticPublications.map((publication) => {
    const status = isZh ? publication.statusZh : publication.status;
    const topic = publicationTopic(publication);
    return `<li>
      <article class="resume-publication-entry">
        <h3 lang="en">${escapeHtml(publication.title)}</h3>
        <p class="resume-publication-authors" lang="en">${escapeHtml(readableAuthors(publication))}</p>
        <p class="resume-publication-meta">
          <cite>${escapeHtml(publication.venue)}</cite>
          <span>${escapeHtml(status)}</span>
          <time datetime="${escapeHtml(String(publication.year))}">${escapeHtml(String(publication.year))}</time>
          ${topic ? `<span class="resume-publication-topic">${escapeHtml(localized(topic.title, language))}</span>` : ''}
          <a href="${escapeHtml(publication.link)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(text.doiLabel(publication.title))}">DOI</a>
        </p>
      </article>
    </li>`;
  }).join('')}</ol>`;
  if (!source.includes('{{PUBLICATIONS}}')) throw new Error(`${sourceFile} must contain {{PUBLICATIONS}}`);
  const hydratedSource = source.replace('{{PUBLICATIONS}}', publicationMarker);
  const withoutDocumentTitle = hydratedSource.replace(/^#\s+[^\r\n]+\r?\n+/, '');
  const markerMarkup = `<p>${publicationMarker}</p>`;
  let publicationMarkers = 0;
  const sections = renderer.renderSections(withoutDocumentTitle);
  const sectionHtml = sections.map((section, index) => {
    const content = section.html.replace(markerMarkup, () => {
      publicationMarkers += 1;
      return publicationList;
    });
    const sectionNumber = String(index + 1).padStart(2, '0');
    return `<section id="${escapeHtml(section.id)}" class="profile-section" data-profile-section="${escapeHtml(section.id)}" aria-labelledby="${escapeHtml(section.id)}-title">
      <header class="profile-section-head">
        <span aria-hidden="true">${sectionNumber}</span>
        <h2 id="${escapeHtml(section.id)}-title">${escapeHtml(section.title)}</h2>
      </header>
      <div class="profile-section-body">${content}</div>
    </section>`;
  }).join('');
  if (publicationMarkers !== 1) throw new Error(`${sourceFile} publication placeholder did not render predictably`);
  const sectionNavigation = sections.map((section, index) => `<a href="#${escapeHtml(section.id)}"><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>${escapeHtml(section.title)}</a>`).join('');
  const filePath = path.join(rootDir, relativeRoute, 'index.html');
  const body = `
    <article class="research-profile" lang="${isZh ? 'zh-CN' : 'en'}">
      <header class="profile-masthead">
        <div class="profile-heading">
          <p class="blog-kicker">${text.kicker}</p>
          <h1>Chenxu Wang <span class="profile-handle">wcx12</span></h1>
          <p class="profile-role">${text.role}<span aria-hidden="true">/</span>${text.location}</p>
          <p class="profile-summary">${text.summary}</p>
        </div>
        <div class="profile-command">
          <p class="profile-status"><span>${text.statusLabel}</span><strong>${text.status}</strong></p>
          <div class="profile-actions">
            <button id="printProfile" class="btn btn-primary" type="button">${text.print}</button>
            <a class="btn btn-outline" href="mailto:c2675668@gmail.com" aria-label="${text.emailLabel}">${text.contact}</a>
          </div>
          <nav class="profile-contact-links" aria-label="${isZh ? '联系方式' : 'Contact links'}">
            <a href="mailto:c2675668@gmail.com" aria-label="${text.emailLabel}">Email</a>
            <a href="https://github.com/wcx12" target="_blank" rel="me noreferrer" aria-label="${text.githubLabel}">GitHub</a>
            <a href="https://orcid.org/${ORCID_ID}" target="_blank" rel="me noreferrer" aria-label="${text.orcidLabel}">ORCID</a>
          </nav>
        </div>
        <dl class="profile-facts">
          <div><dt>${text.affiliation}</dt><dd>${isZh ? '北京理工大学' : 'Beijing Institute of Technology'}</dd></div>
          <div><dt>${text.graduation}</dt><dd>2026</dd></div>
          <div><dt>${text.publications}</dt><dd>${staticPublications.length}</dd></div>
          <div><dt>${text.researchAreas}</dt><dd>${researchChildren.length}</dd></div>
        </dl>
      </header>
      <div class="profile-layout">
        <aside class="profile-rail">
          <p class="profile-rail-label">${text.sections}</p>
          <nav class="profile-section-nav" aria-label="${text.sections}">${sectionNavigation}</nav>
          <div class="profile-rail-note">
            <span>${text.direction}</span>
            <p>${text.directionText}</p>
          </div>
        </aside>
        <div class="profile-sections">
${sectionHtml}
        </div>
      </div>
    </article>
  `;
  const metadata = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: isZh ? 'Chenxu Wang（wcx12）学术履历' : 'Chenxu Wang (wcx12) Academic Profile',
    description: isZh ? 'Chenxu Wang（wcx12）的研究履历，涵盖教育背景、研究方向、论文、项目与技术能力。' : 'Research profile for Chenxu Wang (wcx12), including education, publications, projects, and technical skills.',
    url: absoluteUrl(relativeRoute),
    inLanguage: isZh ? 'zh-CN' : 'en',
    mainEntity: personEntity()
  });

  await writePage(`${relativeRoute}index.html`, renderShell({
    filePath,
    title: isZh ? '学术履历' : 'Academic Profile',
    description: isZh ? 'Chenxu Wang（wcx12）的研究履历，涵盖教育背景、研究方向、论文、项目与技术能力。' : 'Research profile for Chenxu Wang (wcx12), including education, publications, projects, and technical skills.',
    body,
    jsonLd: metadata,
    schemaType: 'ProfilePage',
    socialImagePath: isZh ? 'assets/og-profile-zh.png' : 'assets/og-profile.png',
    socialImageAlt: isZh ? 'Chenxu Wang 研究履历与论文记录' : 'Chenxu Wang research profile and publication record',
    contentLang: isZh ? 'zh-CN' : 'en',
    fixedLanguage: language,
    alternateUrl: alternateRoute
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
    author: authorsFor(publication).map((name) => name.toLowerCase() === SITE.author.toLowerCase()
      ? { ...personEntity(), name }
      : { '@type': 'Person', name }),
    isPartOf: { '@type': 'Periodical', name: publication.venue },
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'DOI',
      value: publication.doi,
      url: publication.link
    },
    ...(publication.code_url ? {
      subjectOf: {
        '@type': 'SoftwareSourceCode',
        name: `${publication.title} official implementation`,
        url: publication.code_url,
        codeRepository: publication.code_url
      }
    } : {}),
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
      ...(repo.demo_url ? { sameAs: repo.demo_url } : {}),
      ...(repo.language ? { programmingLanguage: repo.language } : {}),
      ...(repo.stage ? { creativeWorkStatus: localized(repo.stage, language) } : {}),
      ...(repo.updated_at ? { dateModified: repo.updated_at } : {}),
      author: personReference()
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
    author: personReference()
  };
}

function evidenceHtml(ctx, evidence, language) {
  const isZh = language === 'zh';
  if (evidence.type === 'SoftwareSourceCode') {
    const repo = evidence.value;
    const stage = localized(repo.stage, language);
    const publicEvidence = localized(repo.evidence, language);
    return `<article class="research-evidence" data-evidence-type="SoftwareSourceCode" data-evidence-key="${escapeHtml(evidence.key)}">
      <h3 class="research-evidence-title"><a href="${escapeHtml(repo.html_url)}" rel="noreferrer">${escapeHtml(repo.name)}</a></h3>
      <p${language === 'zh' && repo.descriptionZh ? '' : ' lang="en"'}>${escapeHtml(language === 'zh' ? (repo.descriptionZh || repo.description) : repo.description)}</p>
      <dl class="research-meta">
${repo.language ? `        <div><dt>${isZh ? '语言' : 'Language'}</dt><dd>${escapeHtml(repo.language)}</dd></div>` : ''}
${stage ? `        <div><dt>${isZh ? '阶段' : 'Stage'}</dt><dd>${escapeHtml(stage)}</dd></div>` : ''}
${publicEvidence ? `        <div><dt>${isZh ? '公开证据' : 'Public evidence'}</dt><dd>${escapeHtml(publicEvidence)}</dd></div>` : ''}
        <div><dt>${isZh ? '代码' : 'Code'}</dt><dd><a href="${escapeHtml(repo.html_url)}" rel="noreferrer">GitHub</a></dd></div>
${repo.demo_url ? `        <div><dt>${isZh ? '演示' : 'Demo'}</dt><dd><a href="${escapeHtml(repo.demo_url)}" rel="noreferrer">${isZh ? '打开在线演示' : 'Open live demo'}</a></dd></div>` : ''}
      </dl>
    </article>`;
  }
  if (evidence.type === 'ScholarlyArticle') {
    const publication = evidence.value;
    const topic = publicationTopic(publication);
    const codeNote = localized(publication.code_note, language);
    return `<article class="research-evidence" data-evidence-type="ScholarlyArticle" data-evidence-key="${escapeHtml(evidence.key)}">
      <h3 class="research-evidence-title" lang="en"><a href="${escapeHtml(publication.link)}" rel="noreferrer">${escapeHtml(publication.title)}</a></h3>
      <p class="research-authors">${escapeHtml(authorsFor(publication).join(', '))}</p>
      <dl class="research-meta">
        <div><dt>${isZh ? '期刊' : 'Journal'}</dt><dd>${escapeHtml(publication.venue)}</dd></div>
        <div><dt>${isZh ? '状态' : 'Status'}</dt><dd>${escapeHtml(isZh ? publication.statusZh : publication.status)}, ${escapeHtml(publication.year)}</dd></div>
        <div><dt>DOI</dt><dd><a href="${escapeHtml(publication.link)}" rel="noreferrer">${escapeHtml(publication.doi)}</a></dd></div>
        ${publication.code_url ? `<div><dt>${isZh ? '官方实现' : 'Official implementation'}</dt><dd><a href="${escapeHtml(publication.code_url)}" rel="noreferrer">GitHub</a></dd></div>` : ''}
        ${codeNote ? `<div><dt>${isZh ? '托管说明' : 'Hosting note'}</dt><dd>${escapeHtml(codeNote)}</dd></div>` : ''}
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

const MIN_INDEXABLE_TOPIC_EVIDENCE = 2;

function shouldIndexResearchTopic(evidence) {
  return evidence.length >= MIN_INDEXABLE_TOPIC_EVIDENCE;
}

function emptyEvidenceSection(language) {
  const isZh = language === 'zh';
  return `<section class="research-section" aria-labelledby="evidence-status-title">
    <div class="research-section-head"><h2 id="evidence-status-title">${isZh ? '当前状态' : 'Current status'}</h2><span>0</span></div>
    <p class="muted">${isZh
      ? '这是正在探索的研究方向，目前尚未关联可公开核验的项目、论文或文章。后续成果会在完成公开整理后显示在这里。'
      : 'This is an exploratory direction with no publicly verifiable project, paper, or article mapped yet. Evidence will appear here after it is ready for public review.'}</p>
  </section>`;
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

async function renderProjects(language) {
  const isZh = language === 'zh';
  const relativeRoute = projectsRoute(language);
  const alternateRoute = projectsRoute(isZh ? 'en' : 'zh');
  const filePath = path.join(rootDir, relativeRoute, 'index.html');
  const ctx = createPageContext(filePath);
  const repos = [...localRepos].sort((left, right) => String(right.updated_at || '').localeCompare(String(left.updated_at || '')));
  const evidence = repos.map((repo) => ({
    type: 'SoftwareSourceCode',
    key: `repo:${repo.name}`,
    value: repo
  }));
  const body = `
    <header class="research-header">
      <p class="blog-kicker">${isZh ? '公开软件与资料索引' : 'Public software and materials index'}</p>
      <h1>${isZh ? '项目' : 'Projects'}</h1>
      <p>${isZh ? '浏览全部公开仓库。阶段与公开证据说明会区分研究仓库、可运行原型、教学资料、课程作业、规划文档与上游分叉。' : 'Browse every public repository. Maturity and evidence notes distinguish research repositories, working prototypes, teaching materials, coursework, planning documents, and upstream forks.'}</p>
      <a class="btn btn-outline" href="${ctx.link(`${researchRoute(language)}index.html`)}">${isZh ? '浏览研究方向' : 'Browse research topics'}</a>
    </header>
    <section class="research-section" aria-labelledby="project-list-title">
      <div class="research-section-head"><h2 id="project-list-title">${isZh ? '仓库记录' : 'Repository records'}</h2><span>${evidence.length}</span></div>
      <div class="research-evidence-list">${evidence.map((item) => evidenceHtml(ctx, item, language)).join('')}</div>
    </section>`;
  const canonicalUrl = absoluteUrl(relativeRoute);
  const metadata = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#page`,
        name: isZh ? 'wcx12 项目' : 'wcx12 Projects',
        description: isZh ? 'wcx12 的公开项目、阶段与公开证据索引。' : 'An index of wcx12 public projects with maturity and public-evidence notes.',
        url: canonicalUrl,
        inLanguage: isZh ? 'zh-CN' : 'en',
        mainEntity: { '@id': `${canonicalUrl}#projects` }
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#projects`,
        numberOfItems: evidence.length,
        itemListElement: evidence.map((item) => evidenceSchema(item, language))
      }
    ]
  });
  await writePage(`${relativeRoute}index.html`, renderShell({
    filePath,
    title: isZh ? '项目' : 'Projects',
    description: isZh ? 'wcx12 的公开项目、阶段与公开证据索引。' : 'Public projects by wcx12, with maturity, evidence, demos, and source links.',
    body,
    jsonLd: metadata,
    schemaType: 'CollectionPage',
    socialImagePath: isZh ? 'assets/og-projects-zh.png' : 'assets/og-projects.png',
    socialImageAlt: isZh ? 'wcx12 项目与公开仓库索引' : 'wcx12 projects and public repository index',
    contentLang: isZh ? 'zh-CN' : 'en',
    fixedLanguage: language,
    alternateUrl: alternateRoute
  }));
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
    socialImagePath: isZh ? 'assets/og-research-zh.png' : 'assets/og-research.png',
    socialImageAlt: isZh ? 'wcx12 研究方向与公开成果索引' : 'wcx12 research topics and public evidence index',
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
        <a class="btn btn-outline research-demo-link" href="${ctx.link(`${isZh ? 'zh/' : ''}index.html`)}#research/${escapeHtml(child.id)}">${isZh ? '打开概念演示' : 'Open concept demo'}</a>
      </div>
    </header>
    ${evidence.length ? evidenceSections(ctx, evidence, language) : emptyEvidenceSection(language)}`;
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
    socialImagePath: isZh ? 'assets/og-research-zh.png' : 'assets/og-research.png',
    socialImageAlt: isZh ? 'wcx12 研究方向与公开成果索引页面' : 'wcx12 research topics and public evidence index page',
    contentLang: isZh ? 'zh-CN' : 'en',
    fixedLanguage: language,
    alternateUrl: alternateRoute,
    robots: shouldIndexResearchTopic(evidence) ? 'index,follow,max-image-preview:large' : 'noindex,follow'
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
      <p class="blog-kicker">${isZh ? '出版方链接记录' : 'Publisher-linked records'}</p>
      <h1>${isZh ? '论文' : 'Publications'}</h1>
      <p>${isZh ? 'Chenxu Wang（wcx12）署名的已发表与录用待刊论文。作者顺序、状态、DOI 与官方实现均链接到公开来源。' : 'Published and in-press papers authored by Chenxu Wang (wcx12), with author order, status, DOI, and official implementations linked to public sources.'}</p>
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
        description: isZh ? 'Chenxu Wang（wcx12）的公开论文与 DOI 链接列表。' : 'Publications authored by Chenxu Wang (wcx12), with DOI links to publisher records.',
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
    description: isZh ? 'Chenxu Wang（wcx12）的公开论文与 DOI 链接列表。' : 'Publications authored by Chenxu Wang (wcx12), with DOI links to publisher records.',
    body,
    jsonLd: metadata,
    schemaType: 'CollectionPage',
    socialImagePath: isZh ? 'assets/og-publications-zh.png' : 'assets/og-publications.png',
    socialImageAlt: isZh ? 'Chenxu Wang 论文与出版记录' : 'Chenxu Wang publications and publisher-linked records',
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
    const codeLines = publication.code_url
      ? `\n- Official implementation: ${publication.code_url}\n- Hosting note: ${localized(publication.code_note, 'en')}`
      : '';
    return `## ${heading}\n\n### ${publication.title}\n\n- Authors: ${readableAuthors(publication)}\n- Journal: ${publication.venue}\n${statusLine}\n- DOI: ${publication.link}${codeLines}\n- Research area: ${publicationArea(publication)}`;
  });
  const markdown = `# Publications\n\n${sections.join('\n\n')}\n\nOnly publications authored by Chenxu Wang (wcx12) are listed here. The interactive publication view on the homepage also links each entry to its DOI record.\n`;
  await fs.writeFile(path.join(rootDir, 'publications.md'), markdown);
}

async function renderResearchPages(posts) {
  for (const language of ['en', 'zh']) {
    await renderResearchIndex(posts, language);
    await renderProjects(language);
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
  const dateOnly = (value) => {
    const date = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
  };
  const latestDate = (values) => values.map(dateOnly).filter(Boolean).sort().at(-1) || '';
  const evidenceDate = (item) => {
    if (item.type === 'SoftwareSourceCode') return dateOnly(item.value.updated_at || item.value.pushed_at);
    if (item.type === 'ScholarlyArticle') return dateOnly(item.value.updated_at);
    if (item.type === 'BlogPosting') return dateOnly(item.value.updated || item.value.date);
    return '';
  };
  const latestPostDate = latestDate(posts.map((post) => post.updated || post.date));
  const latestProjectDate = latestDate(localRepos.map((repo) => repo.updated_at || repo.pushed_at));
  const latestPublicationDate = latestDate(staticPublications.map((publication) => publication.updated_at));
  const topicDates = new Map(researchChildren.map((child) => [
    child.id,
    latestDate(evidenceForTopic(child.id, posts).map(evidenceDate))
  ]));
  const latestResearchDate = latestDate([...topicDates.values()]);
  const latestHomeDate = latestDate([latestPostDate, latestProjectDate, latestPublicationDate, latestResearchDate]);
  const researchRoutes = ['en', 'zh'].flatMap((language) => [
    { route: researchRoute(language), lastmod: latestResearchDate },
    ...researchChildren.filter((child) => shouldIndexResearchTopic(evidenceForTopic(child.id, posts))).map((child) => ({
      route: researchRoute(language, `${child.id}/`),
      lastmod: topicDates.get(child.id)
    })),
    { route: projectsRoute(language), lastmod: latestProjectDate },
    { route: publicationsRoute(language), lastmod: latestPublicationDate }
  ]);
  const urls = [
    { route: '', lastmod: latestHomeDate },
    { route: 'zh/', lastmod: latestHomeDate },
    ...['en', 'zh'].map((language) => ({ route: resumeRoute(language), lastmod: '' })),
    { route: 'blog/', lastmod: latestPostDate },
    ...(posts.length > 1 ? [{ route: 'blog/archive/', lastmod: latestPostDate }] : []),
    ...researchRoutes,
    ...posts.map((post) => ({ route: postUrl(post), lastmod: post.updated || post.date })),
    ...topicCounts(posts, 'tags').filter(([, count]) => count >= 2).map(([tag]) => ({
      route: `blog/tags/${slugify(tag)}/`,
      lastmod: posts.filter((post) => post.tags.includes(tag)).map((post) => post.updated || post.date).sort().at(-1)
    }))
  ];
  const body = urls.map(({ route, lastmod }) => `  <url><loc>${escapeXml(absoluteUrl(route))}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`).join('\n');
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
  await renderChineseHomepage();

  const renderer = createMarkdownRenderer();
  for (const post of posts) {
    await renderPost(post, posts, renderer);
  }
  for (const language of ['en', 'zh']) await renderResume(renderer, language);
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
