const THEME_KEY = 'wcx12-theme';
const LANG_KEY = 'wcx12-lang';
const OWNER_TOOLS_KEY = 'wcx12-owner-tools';
const themes = ['neon', 'warm', 'mono'];
const languages = ['en', 'zh'];
const themeSelect = document.getElementById('blogThemeSelect');
const langToggle = document.getElementById('blogLangToggle');
const draftStudioLink = document.getElementById('blogDraftStudioLink');
const blogMenu = document.querySelector('.blog-menu');
const blogMenuToggle = document.querySelector('.blog-menu-toggle');
const desktopNavigation = window.matchMedia('(min-width: 1024px)');

const blogI18n = {
  en: {
    skip_main: 'Skip to main content',
    nav_home: 'Home',
    nav_home_title: 'Back to the interactive homepage',
    nav_profile: 'Resume',
    nav_profile_title: 'Open the research profile',
    nav_research: 'Research',
    nav_research_title: 'Browse research topics and evidence',
    nav_projects: 'Projects',
    nav_projects_title: 'Projects and source code',
    nav_publications: 'Publications',
    nav_publications_title: 'Browse publisher-linked publications',
    nav_blog: 'Blog',
    nav_demos: 'Demos',
    nav_demos_title: 'Interactive concept demos',
    original_zh: 'Chinese original',
    original_en: 'English original',
    nav_blog_title: 'Open Research Fieldnotes',
    nav_archive: 'Archive',
    nav_archive_title: 'Browse all posts by date',
    nav_menu: 'Menu',
    nav_menu_title: 'Open site navigation',
    nav_landmark: 'Site navigation',
    profile_links: 'Profile links',
    orcid_title: 'View ORCID record 0009-0005-6139-4327',
    lang_button: '中文',
    lang_title: 'Switch interface language',
    lang_target_aria: '切换到中文界面',
    theme_title: 'Switch color theme',
    theme_default: 'Default',
    theme_warm: 'Warm',
    theme_mono: 'Black & White',
    page_title: 'Research Fieldnotes',
    hero_kicker: 'Research · Engineering · Reflection',
    hero_title: 'Research Fieldnotes',
    hero_desc: 'Research notes, experiments, and engineering practice.',
    hero_byline: 'By',
    hero_role: 'Machine Learning Researcher',
    hero_read_latest: 'Read latest',
    hero_browse_archive: 'Browse archive',
    stat_published: 'Published',
    stat_topics: 'Browseable tags',
    stat_search: 'Search',
    stat_ready: 'Ready',
    stat_language: 'Interface',
    stat_bilingual: 'EN / 中文',
    profile_kicker: 'Research Profile',
    profile_desc: 'A concise, verifiable snapshot of education, research, publications, projects, and technical skills.',
    profile_print: 'Print / Save as PDF',
    profile_contact: 'Contact',
    section_search_label: 'Search',
    section_search_title: 'Find notes by topic, tag, or summary',
    section_featured_label: 'Featured',
    section_featured_title: 'Start here',
    section_topics_label: 'Topics',
    section_topics_title: 'Browse by tag',
    section_recent_label: 'Recent',
    section_recent_title: 'Latest writing',
    empty_label: 'Notebook',
    empty_title: 'The first fieldnote is being prepared.',
    empty_desc: 'Published writing will appear here as soon as it is ready.',
    section_related_label: 'Related',
    section_related_title: 'Related writing',
    search_placeholder: 'Search writing...',
    search_label: 'Search writing',
    search_no_results: 'No matching notes yet.',
    topics_empty: 'No tags yet.',
    archive_kicker: 'Archive',
    archive_title: 'All writing',
    archive_desc: 'A chronological index of technical notes and research logs.',
    tag_kicker: 'Tag',
    tag_in_topic: 'in this topic.',
    tag_results_label: 'Results',
    tag_results_title: 'Writing tagged',
    back_to_writing: 'Back to writing',
    toc_title: 'Contents',
    toc_empty: 'No sections.',
    toc_disabled: 'Contents disabled.',
    post_updated: 'Updated',
    nav_newer: 'Newer',
    nav_older: 'Older',
    code_copy: 'Copy',
    code_copied: 'Copied',
    code_select: 'Select',
    hint_summary: 'About this area',
    hint_hero: 'This introduction explains the purpose and authorship of the writing space.',
    hint_search: 'Use this search to find posts by title, summary, category, tag, or article text.',
    hint_featured: 'Featured posts are the recommended starting points or currently important writing pieces.',
    hint_topics: 'Tags group writing by recurring themes so visitors can browse without knowing exact article titles.',
    hint_recent: 'Recent writing lists the newest published posts in one place.',
    hint_archive: 'The archive keeps all published writing in chronological order.',
    hint_archive_year: 'This year group lists posts published in the selected year.',
    hint_tag: 'This page collects all posts that share the selected tag.',
    hint_tag_results: 'These cards are the posts currently associated with this tag.',
    hint_post: 'This article page contains the full post, metadata, tags, and any code or math examples.',
    hint_toc: 'The contents panel links to major headings in the current article.',
    hint_related: 'Related writing appears here when another post shares tags or research areas.',
    hint_prev_next: 'Use these links to move between newer and older posts.'
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
    nav_projects_title: '项目与源码',
    nav_publications: '论文',
    nav_publications_title: '浏览含出版方链接的论文',
    nav_blog: '博客',
    nav_demos: '演示',
    nav_demos_title: '交互式概念演示',
    original_zh: '中文原文',
    original_en: '英文原文',
    nav_blog_title: '打开博客',
    nav_archive: '归档',
    nav_archive_title: '按日期浏览所有文章',
    nav_menu: '菜单',
    nav_menu_title: '打开站点导航',
    nav_landmark: '站点导航',
    profile_links: '个人资料链接',
    orcid_title: '查看 ORCID 记录 0009-0005-6139-4327',
    lang_button: 'EN',
    lang_title: '切换界面语言',
    lang_target_aria: 'Switch to the English interface',
    theme_title: '切换页面色调',
    theme_default: '默认',
    theme_warm: '暖色',
    theme_mono: '黑白极简',
    page_title: '知研札记',
    hero_kicker: '研究 · 工程 · 思考',
    hero_title: '知研札记',
    hero_desc: '研究笔记、实验记录与工程实践。',
    hero_byline: '作者',
    hero_role: '机器学习研究者',
    hero_read_latest: '阅读最新',
    hero_browse_archive: '浏览归档',
    stat_published: '已发布',
    stat_topics: '可浏览标签',
    stat_search: '搜索',
    stat_ready: '可用',
    stat_language: '界面',
    stat_bilingual: '中文 / EN',
    profile_kicker: '研究履历',
    profile_desc: '集中展示教育背景、研究方向、论文、项目与技术能力的可核验摘要。',
    profile_print: '打印 / 保存为 PDF',
    profile_contact: '联系我',
    section_search_label: '搜索',
    section_search_title: '按主题、标签或摘要查找笔记',
    section_featured_label: '精选',
    section_featured_title: '从这里开始',
    section_topics_label: '主题',
    section_topics_title: '按标签浏览',
    section_recent_label: '最近',
    section_recent_title: '最新文章',
    empty_label: '札记',
    empty_title: '第一篇札记正在准备中。',
    empty_desc: '文章发布后会在这里出现。',
    section_related_label: '相关',
    section_related_title: '相关文章',
    search_placeholder: '搜索文章...',
    search_label: '搜索文章',
    search_no_results: '暂时没有匹配的笔记。',
    topics_empty: '还没有标签。',
    archive_kicker: '归档',
    archive_title: '全部文章',
    archive_desc: '按时间顺序整理技术笔记和研究日志。',
    tag_kicker: '标签',
    tag_in_topic: '属于这个主题。',
    tag_results_label: '结果',
    tag_results_title: '标签文章',
    back_to_writing: '返回博客',
    toc_title: '目录',
    toc_empty: '暂无小节。',
    toc_disabled: '目录已关闭。',
    post_updated: '更新于',
    nav_newer: '更新文章',
    nav_older: '更早文章',
    code_copy: '复制',
    code_copied: '已复制',
    code_select: '请选择',
    hint_summary: '区域说明',
    hint_hero: '这里说明博客区的用途与作者信息。',
    hint_search: '用来按标题、摘要、分类、标签或正文内容搜索文章。',
    hint_featured: '这里展示推荐优先阅读，或当前最重要的文章。',
    hint_topics: '标签把文章按常见主题分组，访客不需要知道标题也能浏览。',
    hint_recent: '这里集中展示最新发布的文章。',
    hint_archive: '归档页按时间顺序保存所有已发布文章。',
    hint_archive_year: '这个年份分组列出该年份发布的文章。',
    hint_tag: '这个页面汇总拥有同一标签的文章。',
    hint_tag_results: '这些卡片是当前标签下关联的文章。',
    hint_post: '这里是完整文章页，包含正文、元信息、标签以及代码或数学内容。',
    hint_toc: '目录面板链接到当前文章的主要小节。',
    hint_related: '如果其他文章共享标签或研究方向，相关内容会出现在这里。',
    hint_prev_next: '用这些链接在更新和更早的文章之间切换。'
  }
};

blogI18n.en.draft_studio = 'Draft Studio';
blogI18n.en.draft_studio_title = 'Open the owner draft editor';
blogI18n.zh.draft_studio = '草稿工作台';
blogI18n.zh.draft_studio_title = '打开站主草稿编辑器';

function normalizeLang(lang) {
  const normalized = String(lang || '').toLowerCase().split(/[-_]/)[0];
  return languages.includes(normalized) ? normalized : 'en';
}

function readStorage(key, fallback = '') {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private or policy-restricted contexts.
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private or policy-restricted contexts.
  }
}

function detectOwnerTools() {
  if (window.top !== window.self) {
    removeStorage(OWNER_TOOLS_KEY);
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('ownerTools') === '1') writeStorage(OWNER_TOOLS_KEY, 'enabled');
  if (params.get('ownerTools') === '0') removeStorage(OWNER_TOOLS_KEY);
  return readStorage(OWNER_TOOLS_KEY) === 'enabled';
}

const ownerToolsEnabled = detectOwnerTools();
if (draftStudioLink) draftStudioLink.hidden = !ownerToolsEnabled;

const fixedLanguage = document.documentElement.dataset.fixedLanguage;
const systemLanguage = navigator.languages?.[0] || navigator.language || 'en';
let currentLang = normalizeLang(fixedLanguage || readStorage(LANG_KEY) || systemLanguage);
if (fixedLanguage) writeStorage(LANG_KEY, currentLang);

function t(key) {
  return blogI18n[currentLang]?.[key] || blogI18n.en[key] || '';
}

function applyTheme(theme) {
  const next = themes.includes(theme) ? theme : 'neon';
  document.documentElement.dataset.theme = next;
  writeStorage(THEME_KEY, next);
  if (themeSelect) themeSelect.value = next;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', {
    neon: '#101416',
    warm: '#191819',
    mono: '#101010'
  }[next]);
}

applyTheme(readStorage(THEME_KEY, 'neon'));

themeSelect?.addEventListener('change', () => {
  const theme = themeSelect.value;
  if (window.SiteMotion?.transitionTheme) window.SiteMotion.transitionTheme(() => applyTheme(theme), themeSelect);
  else applyTheme(theme);
});

function setBlogMenuOpen(open) {
  if (!blogMenu) return;
  blogMenu.open = desktopNavigation.matches || Boolean(open);
  document.body.classList.toggle('blog-menu-open', blogMenu.open);
}

function syncBlogMenuToViewport() {
  setBlogMenuOpen(desktopNavigation.matches);
}

syncBlogMenuToViewport();
desktopNavigation.addEventListener('change', syncBlogMenuToViewport);

blogMenu?.addEventListener('toggle', () => {
  document.body.classList.toggle('blog-menu-open', blogMenu.open);
});

blogMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setBlogMenuOpen(false));
});

blogMenu?.addEventListener('focusout', (event) => {
  if (blogMenu.open && event.relatedTarget && !blogMenu.contains(event.relatedTarget)) {
    setBlogMenuOpen(false);
  }
});

document.addEventListener('pointerdown', (event) => {
  if (blogMenu?.open && !blogMenu.contains(event.target)) setBlogMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !blogMenu?.open) return;
  setBlogMenuOpen(false);
  blogMenuToggle?.focus();
});

function formatBlogDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function minuteLabel(minutes, long = false) {
  const count = Number(minutes) || 1;
  if (currentLang === 'zh') return long ? `约 ${count} 分钟阅读` : `${count} 分钟`;
  return long ? `${count} min read` : `${count} min`;
}

function applyLanguage(lang = currentLang) {
  currentLang = normalizeLang(fixedLanguage || lang);
  if (!fixedLanguage) writeStorage(LANG_KEY, currentLang);
  const uiLang = currentLang === 'zh' ? 'zh-CN' : 'en';
  document.documentElement.dataset.uiLang = currentLang;
  document.documentElement.lang = uiLang;

  if (document.querySelector('[data-blog-i18n="hero_title"]')) {
    document.title = t('page_title');
  }

  document.querySelectorAll('[data-blog-i18n]').forEach((node) => {
    const value = t(node.dataset.blogI18n);
    if (value) {
      node.textContent = value;
      node.setAttribute('lang', uiLang);
    }
  });
  document.querySelectorAll('[data-blog-i18n-title]').forEach((node) => {
    const value = t(node.dataset.blogI18nTitle);
    if (value) node.setAttribute('title', value);
  });
  document.querySelectorAll('[data-blog-i18n-aria]').forEach((node) => {
    const value = t(node.dataset.blogI18nAria);
    if (value) node.setAttribute('aria-label', value);
  });
  if (langToggle) langToggle.lang = currentLang === 'zh' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-blog-i18n-ph]').forEach((node) => {
    const value = t(node.dataset.blogI18nPh);
    if (value) node.setAttribute('placeholder', value);
  });
  document.querySelectorAll('[data-blog-nav-en][data-blog-nav-zh]').forEach((node) => {
    const href = currentLang === 'zh' ? node.dataset.blogNavZh : node.dataset.blogNavEn;
    if (href) node.setAttribute('href', href);
  });
  document.querySelectorAll('[data-blog-date]').forEach((node) => {
    node.textContent = formatBlogDate(node.dataset.blogDate);
    node.setAttribute('lang', uiLang);
  });
  document.querySelectorAll('[data-blog-updated]').forEach((node) => {
    node.textContent = `${t('post_updated')} ${formatBlogDate(node.dataset.blogUpdated)}`;
    node.setAttribute('lang', uiLang);
  });
  document.querySelectorAll('[data-blog-minutes]').forEach((node) => {
    node.textContent = minuteLabel(node.dataset.blogMinutes);
    node.setAttribute('lang', uiLang);
  });
  document.querySelectorAll('[data-blog-minutes-long]').forEach((node) => {
    node.textContent = minuteLabel(node.dataset.blogMinutesLong, true);
    node.setAttribute('lang', uiLang);
  });
  document.querySelectorAll('[data-blog-count-label]').forEach((node) => {
    const count = Number(node.dataset.blogCountLabel) || 0;
    node.textContent = currentLang === 'zh' ? '篇文章' : (count === 1 ? 'post' : 'posts');
    node.setAttribute('lang', uiLang);
  });
  document.querySelectorAll('[data-blog-note-label]').forEach((node) => {
    const count = Number(node.dataset.blogNoteLabel) || 0;
    node.textContent = currentLang === 'zh' ? '篇相关文章' : (count === 1 ? 'related note' : 'related notes');
    node.setAttribute('lang', uiLang);
  });
  document.querySelectorAll('.code-copy').forEach((button) => {
    if (![t('code_copied'), t('code_select')].includes(button.textContent)) {
      button.textContent = t('code_copy');
    }
  });

  syncPostLanguageVisibility();
  if (searchInput) renderSearch(searchInput.value);
  window.dispatchEvent(new CustomEvent('blog-language-change', { detail: { language: currentLang } }));
}

langToggle?.addEventListener('click', () => {
  applyLanguage(currentLang === 'en' ? 'zh' : 'en');
});

const progress = document.getElementById('blogProgress');
function updateProgress() {
  if (!progress) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
  progress.style.setProperty('--read-progress', `${value}%`);
}

let progressFrame = 0;
function scheduleProgress() {
  if (progressFrame) return;
  progressFrame = requestAnimationFrame(() => {
    progressFrame = 0;
    updateProgress();
  });
}
window.addEventListener('scroll', scheduleProgress, { passive: true });
window.addEventListener('resize', scheduleProgress);
document.addEventListener('toggle', scheduleProgress, true);

document.querySelectorAll('.code-frame').forEach((frame) => {
  const head = frame.querySelector('.code-head');
  if (!head) return;
  const button = document.createElement('button');
  button.className = 'code-copy';
  button.type = 'button';
  button.dataset.blogI18n = 'code_copy';
  button.setAttribute('aria-live', 'polite');
  button.textContent = t('code_copy');
  head.append(button);
  let resetCopyTimer;
  button.addEventListener('click', async () => {
    const code = frame?.querySelector('code')?.innerText || '';
    try {
      await navigator.clipboard.writeText(code);
      window.clearTimeout(resetCopyTimer);
      button.textContent = t('code_copied');
      button.dataset.copyState = 'success';
      animateBlog(button, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 260 });
      resetCopyTimer = window.setTimeout(() => {
        button.textContent = t('code_copy');
        delete button.dataset.copyState;
      }, 1400);
    } catch {
      button.textContent = t('code_select');
    }
  });
});

function positionTermCard(chip) {
  const card = chip.nextElementSibling;
  if (!card?.matches('.term-chip-card')) return;
  card.style.setProperty('--term-card-offset', '0px');
  const rect = card.getBoundingClientRect();
  if (!rect.width) return;
  const margin = 18;
  const offset = Math.max(margin - rect.left, Math.min(0, document.documentElement.clientWidth - margin - rect.right));
  card.style.setProperty('--term-card-offset', `${offset}px`);
}

window.addEventListener('resize', () => {
  document.querySelectorAll('[data-term-chip][aria-expanded="true"]').forEach(positionTermCard);
});

function closeTermChips(except = null) {
  document.querySelectorAll('[data-term-chip][aria-expanded="true"]').forEach((chip) => {
    if (chip !== except) chip.setAttribute('aria-expanded', 'false');
  });
}

document.addEventListener('click', (event) => {
  const chip = event.target.closest?.('[data-term-chip]');
  if (!chip) {
    closeTermChips();
    return;
  }
  event.preventDefault();
  const expanded = chip.getAttribute('aria-expanded') === 'true';
  closeTermChips(chip);
  chip.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (!expanded) positionTermCard(chip);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeTermChips();
});

function decodedHashId() {
  const raw = window.location.hash.slice(1);
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function openHashDisclosure() {
  const target = document.getElementById(decodedHashId());
  const disclosure = target?.matches?.('details.blog-disclosure')
    ? target
    : target?.closest?.('details.blog-disclosure');
  if (disclosure) disclosure.open = true;
}

openHashDisclosure();
window.addEventListener('hashchange', openHashDisclosure);

const searchInput = document.getElementById('blogSearch');
const searchResults = document.getElementById('blogSearchResults');
let searchItems = [];

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFKD');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(value) {
  const href = String(value || '').trim();
  if (/^(javascript|data):/i.test(href)) return '#';
  return escapeHtml(href || '#');
}

function postGroupKey(item) {
  return item?.translationKey || item?.slug || item?.url || item?.title || '';
}

function localizedItems(items) {
  const groups = new Map();
  (items || []).forEach((item, index) => {
    const key = postGroupKey(item) || `item-${index}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.values()].map((group) => (
    group.find((item) => String(item.lang || '').slice(0, 2) === currentLang)
      || group.find((item) => String(item.lang || '').slice(0, 2) === 'en')
      || group[0]
  )).filter(Boolean);
}

function syncPostLanguageVisibility() {
  const groups = new Map();
  document.querySelectorAll('[data-post-group][data-post-lang]').forEach((node) => {
    const key = node.dataset.postGroup || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(node);
  });
  groups.forEach((group) => {
    const selected = group.find((node) => node.dataset.postLang === currentLang)
      || group.find((node) => node.dataset.postLang === 'en')
      || group[0];
    group.forEach((node) => {
      node.hidden = node !== selected;
    });
  });
}

function resultTemplate(item) {
  const tags = item.tags?.length ? ` - ${item.tags.slice(0, 3).map(escapeHtml).join(', ')}` : '';
  const original = normalizeLang(item.lang) !== currentLang
    ? `<span lang="${currentLang}">${t(normalizeLang(item.lang) === 'zh' ? 'original_zh' : 'original_en')}</span>` : '';
  return `
    <a class="blog-search-result" href="${safeHref(item.url)}" lang="${escapeHtml(item.lang || 'en')}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.description)}${tags}</span>
      ${original}
    </a>
  `;
}

function renderSearch(query) {
  if (!searchResults) return;
  const text = normalize(query).trim();
  if (!text) {
    searchResults.innerHTML = '';
    return;
  }
  const terms = text.split(/\s+/).filter(Boolean);
  const scored = localizedItems(searchItems)
    .map((item) => {
      const haystack = normalize(`${item.title} ${item.description} ${item.category} ${(item.tags || []).join(' ')} ${item.text || ''}`);
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item }) => resultTemplate(item))
    .join('');

  searchResults.innerHTML = scored || `<p class="muted">${escapeHtml(t('search_no_results'))}</p>`;
}

if (searchInput && searchResults) {
  const searchUrl = new URL('../search.json', import.meta.url);
  const assetVersion = new URL(import.meta.url).searchParams.get('v');
  if (assetVersion) searchUrl.searchParams.set('v', assetVersion);
  fetch(searchUrl, { cache: 'default' })
    .then((response) => response.ok ? response.json() : [])
    .then((items) => {
      searchItems = Array.isArray(items) ? items : [];
    })
    .catch(() => {
      searchItems = [];
    });

  searchInput.addEventListener('input', () => renderSearch(searchInput.value));
}

function initProfileNavigation() {
  const directory = document.querySelector('details.profile-directory');
  const directoryCurrent = directory?.querySelector('[data-profile-current]');
  const compactDirectory = window.matchMedia('(max-width: 560px)');
  const links = [...document.querySelectorAll('.profile-section-nav a[href^="#"]')];
  const items = links.map((link) => {
    try {
      return { link, section: document.getElementById(decodeURIComponent(link.hash.slice(1))) };
    } catch {
      return { link, section: null };
    }
  }).filter((item) => item.section);
  if (!items.length) return;

  const activate = (section) => {
    for (const item of items) {
      if (item.section === section) {
        item.link.setAttribute('aria-current', 'location');
        if (directoryCurrent) directoryCurrent.textContent = item.link.querySelector('strong')?.textContent?.trim() || item.link.textContent.trim();
      } else item.link.removeAttribute('aria-current');
    }
  };

  const syncDirectory = () => {
    if (!directory) return;
    if (compactDirectory.matches) directory.removeAttribute('open');
    else directory.setAttribute('open', '');
  };

  for (const item of items) item.link.addEventListener('click', () => {
    activate(item.section);
    if (compactDirectory.matches) directory?.removeAttribute('open');
  });
  const initialItem = items.find((item) => item.link.hash === window.location.hash) || items[0];
  activate(initialItem.section);
  syncDirectory();
  compactDirectory.addEventListener?.('change', syncDirectory);
  if (!('IntersectionObserver' in window)) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((left, right) => Math.abs(left.boundingClientRect.top) - Math.abs(right.boundingClientRect.top));
    if (visible[0]) activate(visible[0].target);
  }, { rootMargin: '-18% 0px -62% 0px', threshold: 0 });
  for (const item of items) observer.observe(item.section);
}

document.getElementById('printProfile')?.addEventListener('click', () => window.print());
initProfileNavigation();

Object.assign(blogI18n.en, {
  cover_replay: 'Replay cover', zoom_open: 'Enlarge figure', zoom_title: 'Figure detail',
  zoom_close: 'Close figure', zoom_actual: 'Actual size', zoom_fit: 'Fit to view',
  stage_previous: 'Previous stage', stage_next: 'Next stage', stage_play: 'Play stages',
  stage_pause: 'Pause stages', stage_group: 'Architecture stages'
});
Object.assign(blogI18n.zh, {
  cover_replay: '重播封面', zoom_open: '放大图示', zoom_title: '图示详情',
  zoom_close: '关闭图示', zoom_actual: '原始大小', zoom_fit: '适应窗口',
  stage_previous: '上一步', stage_next: '下一步', stage_play: '播放步骤',
  stage_pause: '暂停步骤', stage_group: '架构步骤'
});

const blogReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const blogAnimations = new Set();
const blogMotionStops = new Set();
function blogMotionEnabled() {
  return !blogReducedMotion.matches && (window.SiteMotion?.enabled?.() ?? document.documentElement.dataset.motion !== 'off');
}

function animateBlog(node, keyframes, options = {}) {
  if (!blogMotionEnabled() || !node.animate) return null;
  const animation = node.animate(keyframes, { easing: 'cubic-bezier(.2,.75,.25,1)', ...options });
  blogAnimations.add(animation);
  animation.finished.catch(() => {}).finally(() => blogAnimations.delete(animation));
  return animation;
}

function syncBlogMotion() {
  const enabled = blogMotionEnabled();
  const state = enabled ? 'on' : 'off';
  if (document.documentElement.dataset.blogMotion !== state) document.documentElement.dataset.blogMotion = state;
  if (!enabled || document.hidden) {
    blogAnimations.forEach((animation) => animation.cancel());
    blogMotionStops.forEach((stop) => stop());
  }
}
window.addEventListener('site:motion-change', syncBlogMotion);
blogReducedMotion.addEventListener('change', syncBlogMotion);
document.addEventListener('visibilitychange', syncBlogMotion);
window.addEventListener('pagehide', () => blogMotionStops.forEach((stop) => stop()));
syncBlogMotion();

/*
 * Lucide 0.468.0: https://github.com/lucide-icons/lucide/tree/0.468.0/icons
 * ISC License
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as
 * part of Feather (MIT). All other copyright (c) for Lucide are held by
 * Lucide Contributors 2022.
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
const BLOG_LUCIDE_ICONS = Object.freeze({
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  'zoom-in': '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>',
  'zoom-out': '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'maximize-2': '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>'
});

function setBlogIcon(button, name) {
  if (button.dataset.icon === name) return;
  button.dataset.icon = name;
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="lucide" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${BLOG_LUCIDE_ICONS[name]}</svg>`;
}

function blogIconButton(key, icon) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'blog-motion-button';
  setBlogIcon(button, icon);
  labelBlogButton(button, key);
  return button;
}

function labelBlogButton(button, key) {
  button.dataset.blogI18nAria = key;
  button.dataset.blogI18nTitle = key;
  button.setAttribute('aria-label', t(key));
  button.title = t(key);
}

function blogCoverKindForUrl(href) {
  const slug = new URL(href, document.baseURI).pathname.replace(/\/index\.html$/, '/').split('/').filter(Boolean).pop();
  return {
    'tiger-generative-retrieval-reading': 'semantic',
    'tiger-semantic-id-codebook-capacity': 'semantic',
    'tiger-semantic-id-codebook-capacity-en': 'semantic',
    'building-a-research-writing-system': 'writing',
    'building-a-research-writing-system-zh': 'writing'
  }[slug] || '';
}

function enhanceBlogCover(slot) {
  const kind = slot.dataset.coverKind;
  if (!slot.matches('.blog-cover-slot') || !['semantic', 'writing'].includes(kind)) return null;
  const cover = document.createElement('div');
  cover.className = 'blog-cover';
  cover.dataset.coverKind = kind;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return null;
  const replay = blogIconButton('cover_replay', 'rotate-ccw');
  replay.classList.add('blog-cover-replay');
  cover.append(canvas, replay);
  slot.replaceWith(cover);
  let frame = 0;
  let palette;
  let width = 0;
  let height = 0;
  let entered = false;
  let focused = false;

  const draw = (phase = -1) => {
    if (!width || !height) return;
    const ctx = context;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.scale(width / 640, height / 264);
    ctx.lineWidth = 1.5;
    const line = (x, y, endX, endY, color = palette.rule) => {
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();
    };
    const page = (x, y, w, h, accent) => {
      ctx.fillStyle = palette.surface;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = accent;
      ctx.strokeRect(x, y, w, h);
      line(x + 15, y + 26, x + w - 15, y + 26, accent);
      [46, 59, 72, 85].forEach((offset, index) => line(x + 15, y + offset, x + w - 15 - (index % 2) * 17, y + offset));
    };
    const emphasis = (index) => phase < 0 ? 0 : Math.max(0, 1 - Math.abs(phase * 3.8 - index - .6) * 2);
    const rise = (index) => -emphasis(index) * 8;
    const zh = currentLang === 'zh';
    // Decorative source-to-result motifs use symbols, never synthetic research measurements.
    if (kind === 'semantic') {
      page(38, 61 + rise(0), 108, 127, palette.ink);
      ctx.fillStyle = palette.ink;
      ctx.font = '16px monospace';
      ctx.fillText('item', 53, 166 + rise(0));
      line(159, 126, 205, 126, palette.primary);
      [0, 1, 2].forEach((layer) => {
        const x = 222 + layer * 18;
        const y = 73 + layer * 14 + rise(1);
        ctx.fillStyle = palette.surface; ctx.fillRect(x, y, 81, 92);
        ctx.strokeStyle = layer === 2 ? palette.primary : palette.rule; ctx.strokeRect(x, y, 81, 92);
        for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
          ctx.fillStyle = row === layer && col === 1 ? palette.primary : palette.rule;
          ctx.fillRect(x + 13 + col * 20, y + 17 + row * 21, 11, 11);
        }
      });
      line(350, 126, 389, 126, palette.secondary);
      ['a', 'b', 'c'].forEach((token, index) => {
        const x = 405 + index * 59;
        const y = 97 + rise(2 + index * .15);
        ctx.fillStyle = palette.surface; ctx.fillRect(x, y, 48, 58);
        ctx.strokeStyle = index % 2 ? palette.secondary : palette.primary; ctx.strokeRect(x, y, 48, 58);
        ctx.fillStyle = palette.ink; ctx.font = '23px monospace'; ctx.fillText(token, x + 17, y + 36);
      });
      ctx.fillStyle = palette.muted; ctx.font = '14px sans-serif';
      ctx.fillText(zh ? '物品文本' : 'Item text', 39, 225);
      ctx.fillText('RQ-VAE', 238, 225);
      ctx.fillText(zh ? '语义编码' : 'Semantic codes', 405, 225);
    } else {
      page(48, 52 + rise(0), 138, 155, palette.primary);
      ctx.fillStyle = palette.primary; ctx.font = '18px monospace';
      ctx.fillText('# .md', 64, 181 + rise(0));
      line(201, 131, 268, 131, palette.primary);
      const y = 100 + rise(1);
      ctx.strokeStyle = palette.secondary; ctx.strokeRect(281, y, 58, 62);
      line(296, y + 30, 307, y + 41, palette.secondary);
      line(307, y + 41, 325, y + 20, palette.secondary);
      line(352, 131, 419, 131, palette.secondary);
      page(454, 49 + rise(2), 126, 154, palette.rule);
      page(438, 64 + rise(2), 126, 154, palette.ink);
      ctx.fillStyle = palette.secondary; ctx.fillRect(453, 170 + rise(2), 37, 28);
      line(500, 176 + rise(2), 546, 176 + rise(2));
      line(500, 190 + rise(2), 535, 190 + rise(2));
      ctx.fillStyle = palette.muted; ctx.font = '14px sans-serif';
      ctx.fillText(zh ? '源文件' : 'Source', 48, 243);
      ctx.fillText(zh ? '校验' : 'Validate', 282, 243);
      ctx.fillText(zh ? '文章' : 'Article', 438, 243);
    }
    if (phase >= 0) {
      ctx.fillStyle = palette.primary;
      ctx.fillRect(32 + 570 * phase, 28, 6, 3);
    }
    ctx.restore();
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    cover.dataset.playing = 'false';
    draw();
  };
  const resize = (rect = canvas.getBoundingClientRect()) => {
    if (!rect.width) { stop(); return; }
    width = rect.width; height = rect.height;
    const style = getComputedStyle(cover);
    palette = Object.fromEntries(Object.entries({ background: '--bg', surface: '--panel', ink: '--text', muted: '--muted', rule: '--line', primary: '--cyan', secondary: '--pink' }).map(([key, value]) => [key, style.getPropertyValue(value).trim()]));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    stop();
  };
  let resizeFrame = 0;
  // Read after language/theme writes have painted, not inside their mutation task.
  const scheduleResize = () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; resize(); });
    });
  };
  const isVisible = () => {
    const rect = cover.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  };
  const play = () => {
    if (frame || !blogMotionEnabled() || document.hidden || !isVisible()) return;
    resize();
    cover.dataset.playing = 'true';
    const start = performance.now();
    const tick = (now) => {
      const phase = Math.min(1, (now - start) / 1200);
      draw(phase);
      if (phase < 1 && blogMotionEnabled()) frame = requestAnimationFrame(tick);
      else stop();
    };
    frame = requestAnimationFrame(tick);
  };
  cover.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch' && !entered) { entered = true; play(); }
  });
  cover.addEventListener('pointerleave', () => { entered = false; });
  cover.addEventListener('focusin', () => { if (!focused) { focused = true; play(); } });
  cover.addEventListener('focusout', (event) => { if (!cover.contains(event.relatedTarget)) focused = false; });
  replay.addEventListener('click', play);
  cover.addEventListener('blog:replay-cover', play);
  blogMotionStops.add(stop);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) { stop(); entered = false; }
    }).observe(cover);
  } else {
    window.addEventListener('scroll', () => { if (frame && !isVisible()) stop(); }, { passive: true });
  }
  if ('ResizeObserver' in window) new ResizeObserver(([entry]) => resize(entry.contentRect)).observe(canvas);
  else { scheduleResize(); window.addEventListener('resize', scheduleResize); }
  new MutationObserver(scheduleResize).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('blog-language-change', scheduleResize);
  return cover;
}

function initBlogCovers() {
  document.querySelectorAll('.blog-card[data-post-card]').forEach((source) => {
    const slot = source.querySelector(':scope > .blog-cover-slot[data-cover-kind]');
    const title = source.querySelector('h3');
    const href = source.getAttribute('href') || title?.querySelector('a')?.getAttribute('href');
    if (!slot || !title || !href || blogCoverKindForUrl(href) !== slot.dataset.coverKind) return;
    const cover = enhanceBlogCover(slot);
    if (!cover) return;
    // Native title navigation and replay are siblings, never nested interactive targets.
    let card = source;
    let titleLink = title.querySelector('a');
    if (source.matches('a')) {
      card = document.createElement('article');
      for (const attribute of source.attributes) if (attribute.name !== 'href') card.setAttribute(attribute.name, attribute.value);
      titleLink = document.createElement('a');
      titleLink.href = source.href;
      titleLink.className = 'blog-card-title-link';
      titleLink.append(...title.childNodes);
      title.append(titleLink);
      card.append(...source.childNodes);
      source.replaceWith(card);
    }
    card.classList.add('blog-illustrated-card');
    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') cover.dispatchEvent(new Event('blog:replay-cover'));
    });
    titleLink?.addEventListener('focus', () => cover.dispatchEvent(new Event('blog:replay-cover')));
  });
  document.querySelectorAll('.blog-post-layout > .blog-post-card > .blog-post-header > .blog-cover-slot[data-cover-kind]').forEach((slot) => {
    if (blogCoverKindForUrl(location.href) === slot.dataset.coverKind) enhanceBlogCover(slot);
  });
}

function initTigerWalkthrough(figure) {
  const stages = [...figure.querySelectorAll('.tiger-flow-step')];
  if (!stages.length || figure.querySelector('.blog-stage-controls')) return;
  const controls = document.createElement('div');
  controls.className = 'blog-stage-controls';
  controls.setAttribute('role', 'group');
  controls.dataset.blogI18nAria = 'stage_group';
  const previous = blogIconButton('stage_previous', 'arrow-left');
  const play = blogIconButton('stage_play', 'play');
  const next = blogIconButton('stage_next', 'arrow-right');
  const status = document.createElement('span');
  status.className = 'blog-stage-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  controls.append(previous, play, next, status);
  figure.querySelector('.tiger-pipeline-heading').after(controls);
  let index = -1;
  let timer = 0;
  const update = () => {
    previous.disabled = index <= 0;
    next.disabled = index >= stages.length - 1;
    play.disabled = !blogMotionEnabled();
    play.setAttribute('aria-pressed', String(Boolean(timer)));
    setBlogIcon(play, timer ? 'pause' : 'play');
    labelBlogButton(play, timer ? 'stage_pause' : 'stage_play');
    status.textContent = index < 0 ? '' : `${index + 1} / ${stages.length} · ${stages[index].querySelector('.tiger-flow-copy strong').textContent}`;
  };
  const pause = () => { window.clearTimeout(timer); timer = 0; update(); };
  const select = (value) => {
    index = Math.max(0, Math.min(stages.length - 1, value));
    stages.forEach((stage, position) => {
      stage.classList.toggle('blog-stage-active', position === index);
      if (position === index) stage.setAttribute('aria-current', 'step');
      else stage.removeAttribute('aria-current');
    });
    update();
  };
  previous.addEventListener('click', () => { pause(); select(index - 1); });
  next.addEventListener('click', () => { pause(); select(index + 1); });
  const advance = () => {
    select(index + 1);
    if (index === stages.length - 1) pause();
    else { timer = window.setTimeout(advance, 1600); update(); }
  };
  play.addEventListener('click', () => {
    if (timer) { pause(); return; }
    if (index === stages.length - 1) index = -1;
    if (!blogMotionEnabled()) return;
    advance();
  });
  stages.forEach((stage, position) => stage.querySelector('summary')?.addEventListener('click', () => { pause(); select(position); }));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { if (!entries[0].isIntersecting) pause(); }).observe(figure);
  }
  blogMotionStops.add(pause);
  window.addEventListener('site:motion-change', update);
  blogReducedMotion.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('blog-language-change', update);
  update();
}

function initBlogFigureZoom(content) {
  if (!window.HTMLDialogElement || document.querySelector('.blog-figure-dialog')) return;
  const dialog = document.createElement('dialog');
  dialog.id = 'blogFigureDialog';
  dialog.className = 'blog-figure-dialog';
  dialog.setAttribute('aria-labelledby', 'blogFigureDialogTitle');
  const toolbar = document.createElement('div');
  toolbar.className = 'blog-figure-dialog-toolbar';
  const title = document.createElement('h2');
  title.id = 'blogFigureDialogTitle';
  title.dataset.blogI18n = 'zoom_title';
  const size = blogIconButton('zoom_actual', 'zoom-in');
  const close = blogIconButton('zoom_close', 'x');
  close.autofocus = true;
  toolbar.append(title, size, close);
  const viewport = document.createElement('div');
  viewport.className = 'blog-figure-dialog-viewport';
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'region');
  viewport.dataset.blogI18nAria = 'zoom_title';
  const caption = document.createElement('p');
  caption.className = 'blog-figure-dialog-caption';
  dialog.append(toolbar, viewport, caption);
  document.body.append(dialog);
  let source;
  let opener;
  let savedScroll;
  let savedOverflow;
  let inertStates = [];
  let closing = false;

  const originFrames = () => {
    const from = source.getBoundingClientRect();
    const to = viewport.firstElementChild.getBoundingClientRect();
    return [{ transformOrigin: '0 0', transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${Math.max(.02, from.width / to.width)}, ${Math.max(.02, from.height / to.height)})`, opacity: .65 }, { transformOrigin: '0 0', transform: 'none', opacity: 1 }];
  };
  const restore = () => {
    if (!savedScroll) return;
    inertStates.forEach(([element, inert]) => { element.inert = inert; });
    document.documentElement.style.overflow = savedOverflow;
    opener?.focus({ preventScroll: true });
    window.scrollTo({ left: savedScroll.x, top: savedScroll.y, behavior: 'instant' });
    savedScroll = null;
    viewport.replaceChildren();
    closing = false;
  };
  const dismiss = async () => {
    if (!dialog.open || closing) return;
    closing = true;
    const animation = animateBlog(viewport.firstElementChild, originFrames().reverse(), { duration: 190 });
    if (animation) await animation.finished.catch(() => {});
    dialog.close();
    restore();
  };
  close.addEventListener('click', dismiss);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); dismiss(); });
  dialog.addEventListener('close', restore);
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || !dialog.open) return;
    const focusable = [...dialog.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]')]
      .filter((node) => node.tabIndex >= 0 && !node.matches(':disabled') && !node.closest('[inert]')
        && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
    const first = focusable[0] || close;
    const last = focusable.at(-1) || close;
    const active = document.activeElement;
    // Native modal inertness does not prevent Tab from advancing to browser chrome.
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (active === last || active === dialog)) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss();
  });
  size.addEventListener('click', () => {
    const actual = dialog.dataset.size !== 'actual';
    dialog.dataset.size = actual ? 'actual' : 'fit';
    size.setAttribute('aria-pressed', String(actual));
    labelBlogButton(size, actual ? 'zoom_fit' : 'zoom_actual');
    setBlogIcon(size, actual ? 'zoom-out' : 'zoom-in');
  });
  window.addEventListener('pagehide', () => { if (dialog.open) { dialog.close(); restore(); } });

  const addZoom = (target, container) => {
    if (target.closest('[data-no-zoom], .draft-preview, .private-notes')) return;
    const button = blogIconButton('zoom_open', 'maximize-2');
    button.classList.add('blog-figure-zoom');
    button.dataset.figureZoom = '';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', dialog.id);
    container.append(button);
    button.addEventListener('click', () => {
      if (dialog.open) return;
      blogMotionStops.forEach((stop) => stop());
      source = target; opener = button;
      const clone = target.cloneNode(true);
      clone.querySelectorAll('.blog-stage-controls, .blog-figure-actions, .blog-image-actions, .blog-figure-zoom').forEach((node) => node.remove());
      // Keep ID/ARIA references valid without duplicating article fragment targets.
      const idMap = new Map();
      [clone, ...clone.querySelectorAll('[id]')].forEach((node) => {
        if (node.id) { idMap.set(node.id, `zoom-${node.id}`); node.id = `zoom-${node.id}`; }
      });
      [clone, ...clone.querySelectorAll('*')].forEach((node) => {
        for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'for']) {
          if (node.hasAttribute(attribute)) node.setAttribute(attribute, node.getAttribute(attribute).split(' ').map((id) => idMap.get(id) || id).join(' '));
        }
        if (node.matches('a[href^="#"]')) {
          const id = node.getAttribute('href').slice(1);
          if (idMap.has(id)) node.setAttribute('href', `#${idMap.get(id)}`);
        }
      });
      clone.classList.add('blog-zoom-content');
      if (clone.matches('img')) { clone.loading = 'eager'; clone.removeAttribute('width'); clone.removeAttribute('height'); }
      viewport.replaceChildren(clone);
      caption.textContent = target.matches('img') ? target.alt : '';
      caption.hidden = !caption.textContent;
      dialog.dataset.size = 'fit';
      labelBlogButton(size, 'zoom_actual'); setBlogIcon(size, 'zoom-in');
      size.setAttribute('aria-pressed', 'false');
      savedScroll = { x: window.scrollX, y: window.scrollY };
      savedOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      inertStates = [...document.body.children].filter((node) => node !== dialog).map((node) => [node, node.inert]);
      inertStates.forEach(([node]) => { node.inert = true; });
      dialog.showModal();
      viewport.scrollTo(0, 0);
      close.focus({ preventScroll: true });
      animateBlog(clone, originFrames(), { duration: 280 });
    });
  };
  content.querySelectorAll('figure').forEach((figure) => {
    const actions = document.createElement('div');
    actions.className = 'blog-figure-actions';
    figure.insertBefore(actions, figure.firstChild);
    addZoom(figure, actions);
  });
  content.querySelectorAll('img').forEach((img) => {
    const actions = document.createElement('span');
    actions.className = 'blog-image-actions';
    const anchor = img.closest('a');
    (anchor || img).after(actions);
    addZoom(img, actions);
  });
}

// Only published article roots participate; private-editor previews stay untouched.
initBlogCovers();
const publicBlogContent = document.querySelector('.blog-post-layout > .blog-post-card > .blog-content');
if (publicBlogContent) {
  publicBlogContent.querySelectorAll('#fig-tiger-semantic-id-flow').forEach(initTigerWalkthrough);
  initBlogFigureZoom(publicBlogContent);
}

applyLanguage(currentLang);
// Measure after initial language/menu/copy-button writes, avoiding a second full article layout.
scheduleProgress();
