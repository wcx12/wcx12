const THEME_KEY = 'wcx12-theme';
const themes = ['neon', 'warm', 'mono'];
const themeSelect = document.getElementById('blogThemeSelect');

function applyTheme(theme) {
  const next = themes.includes(theme) ? theme : 'neon';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  if (themeSelect) themeSelect.value = next;
}

applyTheme(localStorage.getItem(THEME_KEY) || 'neon');

themeSelect?.addEventListener('change', () => applyTheme(themeSelect.value));

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
      button.textContent = 'Copied';
      window.setTimeout(() => {
        button.textContent = 'Copy';
      }, 1400);
    } catch {
      button.textContent = 'Select';
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

  searchResults.innerHTML = scored || '<p class="muted">No matching notes yet.</p>';
}

if (searchInput && searchResults) {
  fetch('./search.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : [])
    .then((items) => {
      searchItems = Array.isArray(items) ? items : [];
    })
    .catch(() => {
      searchItems = [];
    });

  searchInput.addEventListener('input', () => renderSearch(searchInput.value));
}
