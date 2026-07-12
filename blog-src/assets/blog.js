const THEME_KEY = 'wcx12-theme';
const LANG_KEY = 'wcx12-lang';
const themes = ['neon', 'warm', 'mono'];
const languages = ['en', 'zh'];
const themeSelect = document.getElementById('blogThemeSelect');
const langToggle = document.getElementById('blogLangToggle');
const blogMenu = document.querySelector('.blog-menu');
const blogMenuToggle = document.querySelector('.blog-menu-toggle');

const blogI18n = {
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
    nav_menu: 'Menu',
    nav_menu_title: 'Open site navigation',
    nav_landmark: 'Site navigation',
    profile_links: 'Profile links',
    orcid_title: 'View ORCID record 0009-0005-6139-4327',
    lang_button: '中文',
    lang_title: 'Switch interface language',
    theme_title: 'Switch color theme',
    theme_default: 'Default',
    theme_warm: 'Warm',
    theme_mono: 'Black & White',
    page_title: 'Research Fieldnotes | wcx12',
    hero_kicker: 'Research · Engineering · Reflection',
    hero_title: 'Research Fieldnotes',
    hero_desc: 'Notes on research tooling, reproducible workflows, technical writing, and the systems behind this site.',
    hero_read_latest: 'Read latest',
    hero_browse_archive: 'Browse archive',
    stat_published: 'Published',
    stat_topics: 'Topics',
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
    nav_menu: '菜单',
    nav_menu_title: '打开站点导航',
    nav_landmark: '站点导航',
    profile_links: '个人资料链接',
    orcid_title: '查看 ORCID 记录 0009-0005-6139-4327',
    lang_button: 'EN',
    lang_title: '切换界面语言',
    theme_title: '切换页面色调',
    theme_default: '默认',
    theme_warm: '暖色',
    theme_mono: '黑白',
    page_title: '知研札记 | wcx12',
    hero_kicker: '研究 · 工程 · 思考',
    hero_title: '知研札记',
    hero_desc: '记录研究工具、可复现工作流、技术写作与本网站背后的系统。当前文章以英文发布。',
    hero_read_latest: '阅读最新',
    hero_browse_archive: '浏览归档',
    stat_published: '已发布',
    stat_topics: '主题',
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
    hint_hero: '这里说明博客区的用途，并提供进入最新文章或归档页的快捷入口。',
    hint_search: '用来按标题、摘要、分类、标签或正文内容搜索文章。',
    hint_featured: '这里展示推荐优先阅读，或当前最重要的文章。',
    hint_topics: '标签把文章按常见主题分组，访客不需要知道标题也能浏览。',
    hint_recent: '这里展示最新发布的文章，并提供进入完整归档的入口。',
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

function normalizeLang(lang) {
  return languages.includes(lang) ? lang : 'en';
}

const fixedLanguage = document.documentElement.dataset.fixedLanguage;
let currentLang = normalizeLang(fixedLanguage || localStorage.getItem(LANG_KEY) || 'en');
if (fixedLanguage) localStorage.setItem(LANG_KEY, currentLang);

function t(key) {
  return blogI18n[currentLang]?.[key] || blogI18n.en[key] || '';
}

function applyTheme(theme) {
  const next = themes.includes(theme) ? theme : 'neon';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  if (themeSelect) themeSelect.value = next;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', {
    neon: '#070914',
    warm: '#160d08',
    mono: '#050505'
  }[next]);
}

applyTheme(localStorage.getItem(THEME_KEY) || 'neon');

themeSelect?.addEventListener('change', () => applyTheme(themeSelect.value));

function setBlogMenuOpen(open) {
  if (!blogMenu || !blogMenuToggle) return;
  blogMenu.classList.toggle('open', open);
  document.body.classList.toggle('blog-menu-open', open);
  blogMenuToggle.setAttribute('aria-expanded', String(open));
}

blogMenuToggle?.addEventListener('click', () => {
  setBlogMenuOpen(!blogMenu.classList.contains('open'));
});

blogMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setBlogMenuOpen(false));
});

blogMenu?.addEventListener('focusout', (event) => {
  if (blogMenu.classList.contains('open') && !blogMenu.contains(event.relatedTarget)) {
    setBlogMenuOpen(false);
  }
});

document.addEventListener('pointerdown', (event) => {
  if (blogMenu?.classList.contains('open') && !blogMenu.contains(event.target)) setBlogMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !blogMenu?.classList.contains('open')) return;
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
  if (!fixedLanguage) localStorage.setItem(LANG_KEY, currentLang);
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
  document.querySelectorAll('[data-blog-i18n-ph]').forEach((node) => {
    const value = t(node.dataset.blogI18nPh);
    if (value) node.setAttribute('placeholder', value);
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

  if (searchInput) renderSearch(searchInput.value);
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

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();

document.querySelectorAll('.code-copy').forEach((button) => {
  button.addEventListener('click', async () => {
    const frame = button.closest('.code-frame');
    const code = frame?.querySelector('code')?.innerText || '';
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = t('code_copied');
      window.setTimeout(() => {
        button.textContent = t('code_copy');
      }, 1400);
    } catch {
      button.textContent = t('code_select');
    }
  });
});

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

function resultTemplate(item) {
  const tags = item.tags?.length ? ` - ${item.tags.slice(0, 3).map(escapeHtml).join(', ')}` : '';
  return `
    <a class="blog-search-result" href="${safeHref(item.url)}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.description)}${tags}</span>
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
  const scored = searchItems
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
      if (item.section === section) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  };

  for (const item of items) item.link.addEventListener('click', () => activate(item.section));
  activate(items[0].section);
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

applyLanguage(currentLang);
