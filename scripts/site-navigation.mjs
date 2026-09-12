const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export const navigationItems = [
  { path: 'research', section: 'research', homeKey: 'btn_research', key: 'nav_research', en: 'Research', zh: '研究' },
  { path: 'projects', section: 'projects', homeKey: 'btn_projects', key: 'nav_projects', en: 'Projects', zh: '项目' },
  { path: 'publications', section: 'publications', homeKey: 'btn_publications', key: 'nav_publications', en: 'Publications', zh: '论文' },
  { path: 'blog', section: 'writing', homeKey: 'btn_blog', key: 'nav_blog', en: 'Blog', zh: '博客' },
  { path: 'resume', section: 'profile', homeKey: 'btn_profile', key: 'nav_profile', en: 'Resume', zh: '履历' }
];

export function renderSiteHeader({ link, language = 'en', homepage = false, fixedLanguage = true, languageControl, current = () => '' }) {
  const zh = language === 'zh';
  const prefix = zh ? 'zh/' : '';
  const translated = (homeKey, blogKey, suffix = '') => homepage
    ? ` data-i18n${suffix}="${homeKey}"`
    : fixedLanguage ? '' : ` data-blog-i18n${suffix}="${blogKey}"`;
  const routes = (en, zhPath) => !homepage && !fixedLanguage
    ? ` data-blog-nav-en="${escapeHtml(link(en))}" data-blog-nav-zh="${escapeHtml(link(zhPath))}"` : '';
  const links = navigationItems.map(item => {
    const enPath = `${item.path}/index.html`;
    const zhPath = item.path === 'blog' ? enPath : `zh/${enPath}`;
    return `<a class="site-nav-link" data-site-section="${item.section}" href="${escapeHtml(link(zh ? zhPath : enPath))}"${routes(enPath, zhPath)}${current(item.section)}${translated(item.homeKey, item.key)}>${item[language]}</a>`;
  }).join('\n        ');
  const navId = homepage ? 'utilityMenuPanel' : 'blogSiteNav';
  const themeId = homepage ? 'themeSelect' : 'blogThemeSelect';
  const themeOptions = [['neon', 'theme_neon', 'theme_default', 'Default', '默认'], ['warm', 'theme_warm', 'theme_warm', 'Warm', '暖色'], ['mono', 'theme_mono', 'theme_mono', 'Black & White', '黑白极简']]
    .map(([value, homeKey, key, en, cn]) => `<option value="${value}"${translated(homeKey, key)}>${escapeHtml(zh ? cn : en)}</option>`).join('');
  return `<header class="${homepage ? 'topbar' : 'blog-topbar'} site-header">
    <a class="${homepage ? 'brand' : 'blog-brand'}" href="${escapeHtml(link(`${prefix}index.html`))}"${routes('index.html', 'zh/index.html')} aria-label="${zh ? '首页' : 'Home'}"${translated('aria_home', 'nav_home', '-aria')}>wcx12</a>
    <details class="site-menu ${homepage ? 'utility-menu' : 'blog-menu'}" open>
      <summary class="site-menu-toggle ${homepage ? 'utility-menu-toggle' : 'blog-menu-toggle'}" aria-controls="${navId}"${translated('btn_settings', 'nav_menu')}>${zh ? '菜单' : 'Menu'}</summary>
      <nav id="${navId}" class="site-navigation ${homepage ? 'top-actions-nav' : 'blog-nav'}" aria-label="${zh ? '主导航' : 'Primary navigation'}"${translated('aria_primary_navigation', 'nav_landmark', '-aria')}>
        ${links}
        <select id="${themeId}" class="site-theme" aria-label="${zh ? '页面色调' : 'Color theme'}"${translated('aria_theme', 'theme_title', '-aria')}>${themeOptions}</select>
        ${languageControl}
      </nav>
    </details>
  </header>`;
}
