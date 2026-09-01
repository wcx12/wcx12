const OWNER_TOOLS_KEY = 'wcx12-owner-tools';
const LANG_KEY = 'wcx12-lang';
const languages = ['en', 'zh'];
const categories = [
  'Computer Vision',
  'Point Cloud',
  'Large Models',
  'AI for Education',
  'Engineering',
  'Research Notes'
];

const categoryLabels = {
  en: {
    'Computer Vision': 'Computer Vision',
    'Point Cloud': 'Point Cloud',
    'Large Models': 'Large Models',
    'AI for Education': 'AI for Education',
    Engineering: 'Engineering',
    'Research Notes': 'Research Notes'
  },
  zh: {
    'Computer Vision': '计算机视觉',
    'Point Cloud': '点云',
    'Large Models': '大模型',
    'AI for Education': 'AI4Edu',
    Engineering: '工程',
    'Research Notes': '研究笔记'
  }
};

const glossaryTerms = {
  ann: {
    en: 'Approximate Nearest Neighbor: a fast search method that looks for vectors close enough to the query in a large vector database, instead of exhaustively checking every item.',
    zh: '近似最近邻搜索：在大规模向量库中用更低成本找到足够接近查询向量的候选，而不是逐个精确比较所有物品。'
  },
  mips: {
    en: 'Maximum Inner Product Search: ranks candidates by the inner product between the query vector and item vectors; it is a common retrieval objective in recommendation systems.',
    zh: '最大内积搜索：按照查询向量与物品向量的内积大小排序，用来从向量库中找最匹配的候选。'
  }
};

const copy = {
  en: {
    kicker: 'Owner Tools',
    title: 'Draft Studio',
    description: 'Edit unpublished Markdown with a live reading preview, then prepare a GitHub Actions payload that commits the change without exposing a repository token in the browser.',
    locked_label: 'Private entry',
    locked_title: 'Owner tools are hidden.',
    locked_desc: 'Open this page with owner tools enabled to load draft editing controls. Saving still requires permission to run the repository workflow.',
    enable: 'Enable owner tools',
    select_label: 'Draft',
    field_title: 'Title',
    field_description: 'Description',
    field_category: 'Category',
    field_tags: 'Tags',
    field_date: 'Date',
    field_updated: 'Updated',
    field_publish: 'Mark as ready to publish',
    markdown_title: 'Markdown',
    preview_title: 'Reading Preview',
    save_local: 'Save locally',
    restore: 'Restore repo copy',
    submit_label: 'Repository update',
    submit_title: 'Commit through GitHub Actions',
    prepare: 'Prepare payload',
    copy: 'Copy payload',
    open_actions: 'Open GitHub Actions',
    submit_hint: 'Paste this payload into the workflow input. If the remote file changed after this page loaded, the workflow will stop instead of overwriting it.',
    loading: 'Loading unpublished drafts...',
    no_drafts: 'No unpublished drafts were found.',
    load_failed: 'Could not load draft metadata. Rebuild or redeploy the site, then try again.',
    loaded_repo: 'Loaded the repository copy.',
    loaded_local: 'Loaded the browser-saved copy.',
    edited: 'Edited in browser. Prepare a payload when you are ready to commit.',
    local_saved: 'Saved in this browser.',
    restored: 'Restored the repository copy.',
    payload_ready_draft: 'Payload ready. This keeps the article unpublished.',
    payload_ready_publish: 'Payload ready. This will make the article public after the workflow deploys.',
    payload_too_large: 'Payload is too large for one workflow input. Commit this draft from GitHub instead.',
    copied: 'Payload copied.',
    copy_failed: 'Clipboard was blocked. Select and copy the payload manually.',
    repo_copy: 'Repository copy',
    browser_copy: 'Browser copy',
    draft_state: 'Draft',
    publish_state: 'Ready to publish',
    scheduled_state: 'Scheduled',
    preview_empty: 'Start writing in the Markdown pane to preview the article here.'
  },
  zh: {
    kicker: '站主管理',
    title: '草稿工作台',
    description: '在页面里修改未发布文章，并实时查看阅读预览；准备好的 payload 会交给 GitHub Actions 写回仓库，浏览器里不暴露仓库 token。',
    locked_label: '隐藏入口',
    locked_title: '站主工具默认隐藏。',
    locked_desc: '用 owner tools 打开后才会加载草稿编辑控件。真正写回仓库仍然需要你有权限运行对应的 GitHub Actions。',
    enable: '开启站主工具',
    select_label: '草稿',
    field_title: '标题',
    field_description: '摘要',
    field_category: '分类',
    field_tags: '标签',
    field_date: '发布日期',
    field_updated: '更新日期',
    field_publish: '标记为可发布',
    markdown_title: 'Markdown 正文',
    preview_title: '阅读预览',
    save_local: '暂存到浏览器',
    restore: '恢复仓库版本',
    submit_label: '写回仓库',
    submit_title: '通过 GitHub Actions 提交',
    prepare: '生成提交内容',
    copy: '复制提交内容',
    open_actions: '打开 GitHub Actions',
    submit_hint: '把生成的内容粘贴到 workflow 输入框里运行。如果远程文件在你打开页面后发生变化，workflow 会停止，避免覆盖新内容。',
    loading: '正在加载未发布草稿...',
    no_drafts: '没有找到未发布草稿。',
    load_failed: '草稿数据加载失败。请重新构建或部署网站后再试。',
    loaded_repo: '已加载仓库版本。',
    loaded_local: '已加载浏览器暂存版本。',
    edited: '已在浏览器中修改。确认后可以生成提交内容。',
    local_saved: '已暂存在当前浏览器。',
    restored: '已恢复为仓库版本。',
    payload_ready_draft: '提交内容已生成。这次会继续保持草稿状态。',
    payload_ready_publish: '提交内容已生成。workflow 部署后文章会公开。',
    payload_too_large: '内容超过单个 workflow 输入限制，请改用 GitHub 页面直接提交。',
    copied: '提交内容已复制。',
    copy_failed: '浏览器阻止了剪贴板访问，请手动选中并复制提交内容。',
    repo_copy: '仓库版本',
    browser_copy: '浏览器暂存',
    draft_state: '草稿',
    publish_state: '准备发布',
    scheduled_state: '定时发布',
    preview_empty: '在左侧 Markdown 区写内容，这里会显示阅读预览。'
  }
};

const elements = {
  locked: document.querySelector('[data-draft-locked]'),
  studio: document.querySelector('[data-draft-studio]'),
  select: document.querySelector('[data-draft-select]'),
  status: document.querySelector('[data-draft-status]'),
  title: document.querySelector('[data-draft-title]'),
  description: document.querySelector('[data-draft-description]'),
  category: document.querySelector('[data-draft-category]'),
  tags: document.querySelector('[data-draft-tags]'),
  date: document.querySelector('[data-draft-date]'),
  updated: document.querySelector('[data-draft-updated]'),
  published: document.querySelector('[data-draft-published]'),
  editor: document.querySelector('[data-draft-editor]'),
  saveLocal: document.querySelector('[data-draft-save-local]'),
  restore: document.querySelector('[data-draft-restore]'),
  previewMeta: document.querySelector('[data-draft-preview-meta]'),
  previewCategory: document.querySelector('[data-draft-preview-category]'),
  previewTitle: document.querySelector('[data-draft-preview-title]'),
  previewDescription: document.querySelector('[data-draft-preview-description]'),
  preview: document.querySelector('[data-draft-preview]'),
  prepare: document.querySelector('[data-draft-prepare]'),
  copy: document.querySelector('[data-draft-copy]'),
  payload: document.querySelector('[data-draft-payload]'),
  workflowLink: document.querySelector('[data-draft-workflow-link]')
};

let manifest = null;
let drafts = [];
let activeDraft = null;
let syncingFields = false;
let previewTimer = 0;
let termCounter = 0;

function normalizeLang(value) {
  return languages.includes(value) ? value : 'en';
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
    // Browser storage can be disabled by policy or private mode.
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Browser storage can be disabled by policy or private mode.
  }
}

function currentLang() {
  return normalizeLang(document.documentElement.dataset.uiLang || readStorage(LANG_KEY, 'en'));
}

function text(key) {
  const lang = currentLang();
  return copy[lang]?.[key] || copy.en[key] || '';
}

function setStatus(keyOrMessage) {
  if (!elements.status) return;
  const knownKey = Object.prototype.hasOwnProperty.call(copy.en, keyOrMessage)
    || Object.prototype.hasOwnProperty.call(copy.zh, keyOrMessage);
  elements.status.textContent = knownKey ? text(keyOrMessage) : keyOrMessage;
}

function applyDraftText() {
  const lang = currentLang();
  document.querySelectorAll('[data-draft-i18n]').forEach((node) => {
    const value = copy[lang]?.[node.dataset.draftI18n] || copy.en[node.dataset.draftI18n];
    if (value) node.textContent = value;
  });
  fillCategoryOptions(elements.category?.value || parseFrontMatter(elements.editor?.value || '').data.category);
  if (activeDraft) renderPreview();
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

function normalizeLf(value) {
  return String(value || '').replace(/\r\n?/g, '\n');
}

function fromBase64Utf8(value) {
  const binary = atob(String(value || ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function toBase64Utf8(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function frontMatterBounds(source) {
  const normalized = normalizeLf(source);
  if (!normalized.startsWith('---\n')) return null;
  const closing = normalized.indexOf('\n---\n', 4);
  if (closing !== -1) return { closing, bodyStart: closing + 5 };
  if (normalized.endsWith('\n---')) return { closing: normalized.length - 4, bodyStart: normalized.length };
  return null;
}

function parseYamlScalar(value) {
  const raw = String(value || '').trim();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      return JSON.parse(raw.replace(/'/g, '"'));
    } catch {
      return raw.slice(1, -1).split(',').map((item) => parseYamlScalar(item)).filter(Boolean);
    }
  }
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    try {
      return raw.startsWith('"') ? JSON.parse(raw) : raw.slice(1, -1).replace(/''/g, "'");
    } catch {
      return raw.slice(1, -1);
    }
  }
  return raw;
}

function parseFrontMatter(source) {
  const normalized = normalizeLf(source);
  const bounds = frontMatterBounds(normalized);
  if (!bounds) return { data: {}, body: normalized };
  const front = normalized.slice(4, bounds.closing);
  const data = {};
  front.split('\n').forEach((line) => {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (match) data[match[1]] = parseYamlScalar(match[2]);
  });
  return { data, body: normalized.slice(bounds.bodyStart) };
}

function yamlValue(value) {
  if (Array.isArray(value)) return `[${value.map((item) => JSON.stringify(String(item))).join(', ')}]`;
  if (typeof value === 'boolean') return String(value);
  return JSON.stringify(String(value ?? ''));
}

function replaceFrontMatterValue(source, key, value) {
  const normalized = normalizeLf(source);
  const bounds = frontMatterBounds(normalized);
  if (!bounds) {
    return `---\n${key}: ${yamlValue(value)}\n---\n\n${normalized}`;
  }
  const front = normalized.slice(4, bounds.closing);
  const body = normalized.slice(bounds.bodyStart);
  const lines = front.split('\n');
  const pattern = new RegExp(`^${key}:\\s*`);
  let replaced = false;
  const nextLines = lines.map((line) => {
    if (!pattern.test(line)) return line;
    replaced = true;
    return `${key}: ${yamlValue(value)}`;
  });
  if (!replaced) nextLines.push(`${key}: ${yamlValue(value)}`);
  return `---\n${nextLines.join('\n')}\n---\n${body}`;
}

function fillCategoryOptions(selected = '') {
  if (!elements.category) return;
  const lang = currentLang();
  const current = selected || elements.category.value || 'Research Notes';
  elements.category.innerHTML = categories.map((category) => (
    `<option value="${escapeAttribute(category)}">${escapeHtml(categoryLabels[lang]?.[category] || category)}</option>`
  )).join('');
  elements.category.value = categories.includes(current) ? current : 'Research Notes';
}

function normalizeDateField(value) {
  const textValue = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(textValue) ? textValue : '';
}

function localDraftKey(draft) {
  return `wcx12-draft-studio:${draft.path}`;
}

function draftSource(draft) {
  return normalizeLf(fromBase64Utf8(draft.contentBase64));
}

function invalidatePayload() {
  if (elements.payload) elements.payload.value = '';
  if (elements.copy) elements.copy.disabled = true;
}

function syncFieldsFromSource(source) {
  const { data } = parseFrontMatter(source);
  syncingFields = true;
  if (elements.title) elements.title.value = String(data.title || activeDraft?.title || '');
  if (elements.description) elements.description.value = String(data.description || '');
  fillCategoryOptions(String(data.category || activeDraft?.category || 'Research Notes'));
  if (elements.tags) {
    elements.tags.value = Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags || '');
  }
  if (elements.date) elements.date.value = normalizeDateField(data.date || activeDraft?.date || '');
  if (elements.updated) elements.updated.value = normalizeDateField(data.updated || activeDraft?.updated || data.date || '');
  if (elements.published) elements.published.checked = data.draft === false;
  syncingFields = false;
}

function applyFieldChange() {
  if (syncingFields || !elements.editor) return;
  let source = normalizeLf(elements.editor.value);
  source = replaceFrontMatterValue(source, 'title', elements.title?.value || '');
  source = replaceFrontMatterValue(source, 'description', elements.description?.value || '');
  source = replaceFrontMatterValue(source, 'category', elements.category?.value || 'Research Notes');
  source = replaceFrontMatterValue(source, 'tags', String(elements.tags?.value || '').split(',').map((tag) => tag.trim()).filter(Boolean));
  source = replaceFrontMatterValue(source, 'date', elements.date?.value || '');
  source = replaceFrontMatterValue(source, 'updated', elements.updated?.value || elements.date?.value || '');
  source = replaceFrontMatterValue(source, 'draft', !elements.published?.checked);
  elements.editor.value = source;
  invalidatePayload();
  schedulePreview();
  setStatus('edited');
}

function resolvePreviewUrl(url, draft) {
  const raw = String(url || '').trim();
  if (!raw || /^(?:javascript|vbscript):/i.test(raw)) return '#';
  if (/^(?:https?:|mailto:|tel:|#|\/)/i.test(raw)) return raw;
  const pathPart = raw.split(/[?#]/, 1)[0].replace(/^\.\//, '');
  return draft?.media?.[pathPart] || raw;
}

function termFromUrl(url, draft) {
  const match = /^term:([a-z0-9-]+)$/i.exec(String(url || '').trim());
  if (!match) return null;
  const id = match[1].toLowerCase();
  const term = glossaryTerms[id];
  if (!term) return null;
  const lang = normalizeLang(draft?.lang || currentLang());
  return { id, definition: term[lang] || term.en || '' };
}

function termChipHtml(label, term) {
  termCounter += 1;
  const tooltipId = `draft-term-${term.id}-${termCounter}`;
  return `<span class="term-chip-wrap"><button class="term-chip" type="button" aria-expanded="false" aria-describedby="${escapeAttribute(tooltipId)}" data-term-chip><span class="term-chip-label">${escapeHtml(label)}</span></button><span class="term-chip-card" id="${escapeAttribute(tooltipId)}" role="tooltip">${escapeHtml(term.definition)}</span></span>`;
}

function inlineMarkdown(value, draft) {
  const placeholders = [];
  const stash = (html) => {
    placeholders.push(html);
    return `\u0000${placeholders.length - 1}\u0000`;
  };
  let source = String(value || '')
    .replace(/`([^`]+)`/g, (_, code) => stash(`<code>${escapeHtml(code)}</code>`))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      const term = termFromUrl(url, draft);
      if (term) return stash(termChipHtml(label, term));
      const href = resolvePreviewUrl(url, draft);
      return stash(`<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`);
    });
  source = escapeHtml(source)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return source.replace(/\u0000(\d+)\u0000/g, (_, index) => placeholders[Number(index)] || '');
}

function isMarkdownBlockStart(line) {
  return /^```/.test(line)
    || /^#{1,6}\s+/.test(line)
    || /^>\s?/.test(line)
    || /^\s*[-*]\s+/.test(line)
    || /^\s*\d+\.\s+/.test(line)
    || /^!\[[^\]]*]\([^)]+\)/.test(line);
}

function renderMarkdown(markdown, draft) {
  const lines = normalizeLf(markdown).split('\n');
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = /^```([A-Za-z0-9_-]+)?/.exec(line);
    if (fence) {
      const language = fence[1] || 'text';
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      html.push(`<div class="code-frame"><div class="code-head"><span>${escapeHtml(language)}</span></div><pre><code>${escapeHtml(code.join('\n'))}</code></pre></div>`);
      continue;
    }

    const image = /^!\[([^\]]*)]\(([^)]+)\)/.exec(line.trim());
    if (image) {
      const src = resolvePreviewUrl(image[2], draft);
      html.push(`<p><img src="${escapeAttribute(src)}" alt="${escapeAttribute(image[1])}" loading="lazy"></p>`);
      index += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = Math.min(4, Math.max(2, heading[1].length));
      html.push(`<h${level}>${inlineMarkdown(heading[2], draft)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }
      html.push(`<blockquote><p>${inlineMarkdown(quote.join(' '), draft)}</p></blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ''));
        index += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${inlineMarkdown(item, draft)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${inlineMarkdown(item, draft)}</li>`).join('')}</ol>`);
      continue;
    }

    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !isMarkdownBlockStart(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${inlineMarkdown(paragraph.join(' '), draft)}</p>`);
  }

  return html.join('\n') || `<p>${escapeHtml(text('preview_empty'))}</p>`;
}

function previewState(data) {
  if (data.draft === false) {
    const today = manifest?.generatedAt || new Date().toISOString().slice(0, 10);
    return String(data.date || '') > today ? text('scheduled_state') : text('publish_state');
  }
  return text('draft_state');
}

function renderPreview() {
  if (!activeDraft || !elements.editor) return;
  termCounter = 0;
  const source = normalizeLf(elements.editor.value);
  const { data, body } = parseFrontMatter(source);
  const title = String(data.title || activeDraft.title || '');
  const description = String(data.description || '');
  const category = String(data.category || activeDraft.category || 'Research Notes');
  const tags = Array.isArray(data.tags) ? data.tags : [];
  if (elements.previewTitle) elements.previewTitle.textContent = title;
  if (elements.previewDescription) elements.previewDescription.textContent = description;
  if (elements.previewCategory) {
    elements.previewCategory.textContent = [
      categoryLabels[currentLang()]?.[category] || category,
      tags.slice(0, 3).join(' / ')
    ].filter(Boolean).join(' · ');
  }
  if (elements.previewMeta) elements.previewMeta.textContent = previewState(data);
  if (elements.preview) elements.preview.innerHTML = renderMarkdown(body, activeDraft);
}

function schedulePreview() {
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(renderPreview, 90);
}

function loadDraft(draft) {
  activeDraft = draft;
  if (elements.workflowLink && draft.workflowUrl) elements.workflowLink.href = draft.workflowUrl;
  const repositorySource = draftSource(draft);
  const localSource = readStorage(localDraftKey(draft), '');
  const source = localSource || repositorySource;
  if (elements.editor) elements.editor.value = source;
  syncFieldsFromSource(source);
  invalidatePayload();
  renderPreview();
  setStatus(localSource && localSource !== repositorySource ? 'loaded_local' : 'loaded_repo');
}

function populateDrafts() {
  if (!elements.select) return;
  elements.select.innerHTML = drafts.map((draft) => (
    `<option value="${escapeAttribute(draft.slug)}">${escapeHtml(draft.title)} · ${escapeHtml(draft.state)}</option>`
  )).join('');
  if (drafts[0]) loadDraft(drafts[0]);
}

async function loadManifest() {
  setStatus('loading');
  const response = await fetch(`drafts.json?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Draft manifest returned ${response.status}`);
  manifest = await response.json();
  drafts = Array.isArray(manifest.drafts) ? manifest.drafts : [];
  if (!drafts.length) {
    setStatus('no_drafts');
    if (elements.studio) elements.studio.hidden = false;
    return;
  }
  populateDrafts();
}

function saveLocalCopy() {
  if (!activeDraft || !elements.editor) return;
  writeStorage(localDraftKey(activeDraft), normalizeLf(elements.editor.value));
  setStatus('local_saved');
}

function restoreRepositoryCopy() {
  if (!activeDraft || !elements.editor) return;
  removeStorage(localDraftKey(activeDraft));
  elements.editor.value = draftSource(activeDraft);
  syncFieldsFromSource(elements.editor.value);
  invalidatePayload();
  renderPreview();
  setStatus('restored');
}

function preparePayload() {
  if (!activeDraft || !elements.editor || !elements.payload) return;
  const source = normalizeLf(elements.editor.value);
  const { data } = parseFrontMatter(source);
  const payload = {
    version: 1,
    path: activeDraft.path,
    expected_sha256: activeDraft.contentHash,
    content_base64: toBase64Utf8(source)
  };
  const encoded = toBase64Utf8(`${JSON.stringify(payload)}\n`);
  elements.payload.value = encoded;
  const tooLarge = encoded.length > 60000;
  if (elements.copy) elements.copy.disabled = tooLarge;
  if (tooLarge) {
    setStatus('payload_too_large');
    return;
  }
  setStatus(data.draft === false ? 'payload_ready_publish' : 'payload_ready_draft');
}

async function copyPayload() {
  const value = elements.payload?.value || '';
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    setStatus('copied');
  } catch {
    elements.payload.focus();
    elements.payload.select();
    setStatus('copy_failed');
  }
}

function bindEvents() {
  elements.select?.addEventListener('change', () => {
    const selected = drafts.find((draft) => draft.slug === elements.select.value);
    if (selected) loadDraft(selected);
  });

  [elements.title, elements.description, elements.category, elements.tags, elements.date, elements.updated, elements.published]
    .filter(Boolean)
    .forEach((field) => {
      field.addEventListener('input', applyFieldChange);
      field.addEventListener('change', applyFieldChange);
    });

  elements.editor?.addEventListener('input', () => {
    invalidatePayload();
    syncFieldsFromSource(elements.editor.value);
    schedulePreview();
    setStatus('edited');
  });

  elements.saveLocal?.addEventListener('click', saveLocalCopy);
  elements.restore?.addEventListener('click', restoreRepositoryCopy);
  elements.prepare?.addEventListener('click', preparePayload);
  elements.copy?.addEventListener('click', copyPayload);
}

async function init() {
  applyDraftText();
  bindEvents();
  const ownerTools = detectOwnerTools();
  if (elements.locked) elements.locked.hidden = ownerTools;
  if (elements.studio) elements.studio.hidden = !ownerTools;
  if (!ownerTools) return;
  try {
    await loadManifest();
  } catch {
    setStatus('load_failed');
  }
}

window.addEventListener('blog-language-change', applyDraftText);
init();
