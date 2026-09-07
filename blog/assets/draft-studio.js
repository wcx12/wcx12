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
  index: {
    en: 'Index: the mechanism that maps a query to candidate result addresses without scanning every item. It can be an explicit structure such as a vector index, or a learned query-to-ID mapping, but the learned version is not a table you can directly browse or edit.',
    zh: '索引：把查询快速指向候选结果地址的机制，目的是不用逐个扫描所有物品。它可以是显式数据结构，比如向量索引；也可以是模型学到的“查询 -> 目标 ID”映射，但后者不是一张能直接浏览或增删改查的表。'
  },
  ann: {
    en: 'Approximate Nearest Neighbor: a fast search method that looks for vectors close enough to the query in a large vector database, instead of exhaustively checking every item.',
    zh: '近似最近邻搜索：在大规模向量库中用更低成本找到足够接近查询向量的候选，而不是逐个精确比较所有物品。'
  },
  mips: {
    en: 'Maximum Inner Product Search: ranks candidates by the inner product between the query vector and item vectors; it is a common retrieval objective in recommendation systems.',
    zh: '最大内积搜索：按照查询向量与物品向量的内积大小排序，用来从向量库中找最匹配的候选。'
  },
  'beam-search': {
    en: 'Beam search: an autoregressive decoding strategy that keeps the best B partial sequences at each step, expands them, and repeats until complete candidates are formed. It is broader than greedy decoding, but still biased toward high-probability sequences.',
    zh: '束搜索：一种自回归解码策略。每一步先保留得分最高的 B 条候选前缀，再分别扩展它们，循环直到得到完整序列。它比贪心解码覆盖更多候选，但仍偏向高概率路径。'
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

function slugify(value) {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'untitled';
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

const tigerPipelineCopy = {
  en: {
    figure: 'Figure 1',
    title: 'TIGER turns item content into a generative vocabulary',
    aria: 'A five step TIGER flow from item text to content embedding, residual quantization, Semantic ID, and Transformer generation.',
    steps: [
      ['source', 'Input', 'Item text', 'title / category / brand', 'Product metadata is first written as text so a language encoder can place items in a shared content space.'],
      ['embedding', 'Representation', 'Content vector', 'Sentence-T5, 768d', 'The text encoder produces a continuous embedding that still behaves like a conventional retrieval vector.'],
      ['quantize', 'Discretization', 'RQ-VAE', 'coarse-to-fine residuals', 'Residual quantization maps the continuous vector to several codebook choices, one layer at a time.'],
      ['semantic', 'Vocabulary', 'Semantic ID', '(12, 24, 52)', 'The selected codewords become a compact token sequence that similar items can partially share.'],
      ['generate', 'Generation', 'Transformer', 'next item tokens', 'Recommendation becomes sequence generation: the model predicts a valid item ID token by token.']
    ],
    legend: [
      ['Content signal', 'raw item information and encoder output'],
      ['Quantization', 'continuous-to-discrete conversion'],
      ['Semantic token', 'shared codeword identity'],
      ['Generative step', 'autoregressive candidate production']
    ],
    caption: 'Figure 1. The key shift is not only replacing the retrieval model, but converting item content into a finite token vocabulary before generation.'
  },
  zh: {
    figure: '图 1',
    title: 'TIGER 把物品内容变成可生成的词表',
    aria: 'TIGER 从商品文本到内容向量、残差量化、Semantic ID 与 Transformer 生成的五步流程图。',
    steps: [
      ['source', '输入', '商品文本', '标题 / 类别 / 品牌', '先把商品元信息写成文本，让语言编码器把物品放进一个共享的内容空间。'],
      ['embedding', '表示', '内容向量', 'Sentence-T5, 768 维', '文本编码器输出连续 embedding；到这里为止，它仍然像传统向量检索里的物品表示。'],
      ['quantize', '离散化', 'RQ-VAE', '逐层修正残差', '残差量化逐层选择码本，把连续向量压成多个离散 codeword。'],
      ['semantic', '词表', 'Semantic ID', '(12, 24, 52)', '被选中的 codeword 组成物品 ID；相似物品可以共享其中一部分 token。'],
      ['generate', '生成', 'Transformer', '逐 token 预测候选', '推荐任务被改写为序列生成：模型按顺序生成可映射回物品库的 ID。']
    ],
    legend: [
      ['内容信号', '原始物品信息与编码器输出'],
      ['量化步骤', '从连续空间转为离散码本'],
      ['语义 token', '可共享的 codeword 编号'],
      ['生成步骤', '自回归地产生候选物品']
    ],
    caption: '图 1. TIGER 的关键变化不是单纯更换检索模型，而是先把物品内容转成有限、可共享、可生成的 token 词表。'
  }
};

const tigerWorkflowCopy = {
  en: {
    figure: 'Figure 1',
    title: 'Generative recommendation has an item-index path and a user-generation path',
    aria: 'A two-lane TIGER workflow. Item text is embedded and quantized into Semantic IDs, while the user interaction sequence is fed to a generator that predicts the next semantic item.',
    lanes: [
      {
        tone: 'item',
        badge: 'Item side',
        title: 'Build the semantic item vocabulary',
        subtitle: 'offline item indexing',
        steps: [
          ['source', 'Content', 'Item text', 'title / category / brand', 'Each item starts from textual metadata rather than an anonymous item ID.'],
          ['embedding', 'Encoder', 'Embedding model', 'Sentence-T5', 'The text encoder maps item content into a continuous embedding space.'],
          ['embedding', 'Vector', 'Item embedding', '768d content vector', 'This vector still behaves like a conventional retrieval representation.'],
          ['quantize', 'Quantizer', 'RQ-VAE', 'residual quantization', 'The quantization model compresses the continuous vector into several discrete codebook choices.'],
          ['semantic', 'Vocabulary', 'Semantic ID', '(12, 24, 52) -> item', 'The resulting token tuple becomes the semantic item identity used by the generator.']
        ]
      },
      {
        tone: 'user',
        badge: 'User side',
        title: 'Generate the next semantic item',
        subtitle: 'online recommendation',
        steps: [
          ['source', 'History', 'User interactions', 'item A -> item B -> item C', 'The user sequence provides the behavioral context for generation.'],
          ['semantic', 'Tokenization', 'Semantic ID sequence', '(12,24,52) -> ...', 'Historical items are rewritten into the same Semantic ID vocabulary built on the item side.'],
          ['generate', 'Generator', 'Generative model', 'Transformer', 'The model predicts the next item as a sequence of semantic tokens.'],
          ['generate', 'Prediction', 'Generated semantic item', 'next Semantic ID', 'The output is not raw text; it is a generated Semantic ID tuple.'],
          ['semantic', 'Lookup', 'Resolve to item', 'Semantic ID -> candidate', 'The predicted Semantic ID is mapped back to a real item or candidate set.']
        ]
      }
    ],
    bridge: ['The shared contract', 'The item side defines the finite Semantic ID vocabulary and the ID-to-item mapping. The user side generates inside that vocabulary, then resolves the generated ID back to actual items.'],
    tokens: ['item text', 'embedding', 'RQ-VAE', 'Semantic ID vocabulary', 'history', 'Transformer', 'semantic item'],
    legend: [
      ['Item indexing', 'content -> embedding -> RQ-VAE -> Semantic ID'],
      ['Shared vocabulary', 'the generator can only produce valid semantic item tokens'],
      ['User generation', 'interaction history -> Transformer -> next Semantic ID'],
      ['Item lookup', 'generated Semantic ID resolves back to recommendable items']
    ],
    caption: 'Figure 1. The overall generative recommendation workflow has two connected paths: the item side turns item text into a Semantic ID vocabulary, and the user side feeds interaction sequences to a generator that predicts the next semantic item.'
  },
  zh: {
    figure: '图 1',
    title: '生成式推荐由“物品侧索引”和“用户侧生成”两条链路组成',
    aria: 'TIGER 的双分支流程图。物品文本先经过嵌入模型和 RQ-VAE 量化得到 Semantic ID；用户交互序列再输入生成器，由生成模型预测下一个语义物品。',
    lanes: [
      {
        tone: 'item',
        badge: '物品侧',
        title: '建立语义物品词表',
        subtitle: '离线索引',
        steps: [
          ['source', '内容', 'Item 文本信息', '标题 / 类别 / 品牌', '每个物品先从文本元信息出发，而不是直接使用互不相关的原子 ID。'],
          ['embedding', '编码器', '嵌入模型', 'Sentence-T5', '文本编码器把 item 内容映射到连续的 embedding 空间。'],
          ['embedding', '向量', 'Item embedding', '768 维内容向量', '到这一步为止，它仍然更像传统向量检索中的物品表示。'],
          ['quantize', '量化器', 'RQ-VAE', '残差量化', '量化模型把连续向量压缩成多个离散 codeword。'],
          ['semantic', '词表', 'Semantic ID', '(12, 24, 52) -> item', '这个 token 组合成为生成器可以使用的语义物品身份。']
        ]
      },
      {
        tone: 'user',
        badge: '用户侧',
        title: '生成下一个语义物品',
        subtitle: '在线推荐',
        steps: [
          ['source', '历史', '用户交互序列', 'item A -> item B -> item C', '用户历史提供生成推荐所需的行为上下文。'],
          ['semantic', '转写', 'Semantic ID 序列', '(12,24,52) -> ...', '历史中的物品会被转写成物品侧建立好的同一套 Semantic ID 词表。'],
          ['generate', '生成器', '生成模型', 'Transformer', '模型根据用户历史，按 token 顺序预测下一个语义物品。'],
          ['generate', '预测', '生成的语义 item', 'next Semantic ID', '模型输出的不是普通文本，而是一个可以映射回物品库的 Semantic ID。'],
          ['semantic', '映射', '回到真实物品', 'Semantic ID -> 候选物品', '最后再把生成出的 Semantic ID 解析为真实 item 或候选 item 集合。']
        ]
      }
    ],
    bridge: ['两条链路的连接点', '物品侧提供有限的 Semantic ID 词表和 ID 到 item 的映射；用户侧只是在这套词表里生成，再把生成出的 ID 解析回真实物品。'],
    tokens: ['item 文本', 'embedding', 'RQ-VAE', 'Semantic ID 词表', '用户历史', 'Transformer', '语义 item'],
    legend: [
      ['物品侧索引', '内容 -> embedding -> RQ-VAE -> Semantic ID'],
      ['共享词表', '生成器只能生成可解析的语义物品 token'],
      ['用户侧生成', '交互历史 -> Transformer -> 下一个 Semantic ID'],
      ['映射回物品', '生成出的 Semantic ID 需要解析成真实候选物品']
    ],
    caption: '图 1. 生成式推荐的整体流程包含两条相互连接的链路：物品侧先把 item 文本编码并量化为 Semantic ID 词表，用户侧再把交互序列输入生成器，预测下一个语义 item。'
  }
};

const tigerFlowFigureCopy = {
  en: {
    figure: 'Figure 1',
    title: 'TIGER turns recommendation into next-token prediction over Semantic IDs',
    aria: 'A conceptual TIGER workflow with two lanes: item content is compressed into a Semantic ID vocabulary, and user history is used to generate the next semantic item.',
    lanes: [
      {
        tone: 'item',
        badge: '01 Item language',
        title: 'Item content becomes a Semantic ID vocabulary',
        subtitle: 'Text metadata is encoded, then RQ-VAE discretizes the embedding into tokens the generator can produce.',
        direction: 'content -> vocabulary',
        steps: [
          ['source', 'item', 'Item content', 'title / category / brand', 'The item first appears as ordinary text metadata, not as an isolated atomic ID.'],
          ['model', 'model', 'Encoder + RQ-VAE', 'embedding -> quantization', 'A text encoder produces the item embedding; RQ-VAE then compresses it into discrete residual codewords.'],
          ['semantic featured', 'semantic', 'Semantic ID vocabulary', '(12, 24, 52) -> item', 'This vocabulary is the key interface: items become token sequences that can be generated and resolved back to real products.']
        ]
      },
      {
        tone: 'user',
        badge: '02 Next-token prediction',
        title: 'User history asks the model for the next semantic item',
        subtitle: 'The interaction sequence is rewritten as Semantic IDs, then a Transformer predicts the next ID.',
        direction: 'history -> item',
        steps: [
          ['history', 'history', 'User history', 'item A -> item B -> item C', 'The recommendation context starts from the user interaction sequence.'],
          ['generate', 'generator', 'Generative model', 'Transformer over ID tokens', 'The model treats recommendation as sequence generation over the Semantic ID vocabulary.'],
          ['output featured', 'output', 'Recommended item', 'next Semantic ID -> candidate', 'The generated Semantic ID is mapped back to a concrete item or candidate set.']
        ]
      }
    ],
    note: 'Recommendation = next-token prediction over a vocabulary whose tokens are Semantic IDs, not ordinary words.',
    caption: 'Figure 1. TIGER first builds a Semantic ID vocabulary from item content, then uses user interaction history to generate the next semantic item.'
  },
  zh: {
    figure: '图 1',
    title: 'TIGER：把推荐变成 Semantic ID 的下一词预测',
    aria: 'TIGER 的概念流程图，包含两条链路：物品内容被压缩成 Semantic ID 词表，用户历史再驱动模型生成下一个语义物品。',
    lanes: [
      {
        tone: 'item',
        badge: '01 物品语言',
        title: 'Item 内容变成 Semantic ID 词表',
        subtitle: '文本信息先被编码成 embedding，再由 RQ-VAE 离散化为生成器可以输出的 token。',
        direction: 'content -> vocabulary',
        steps: [
          ['source', 'item', 'Item 文本信息', '标题 / 类别 / 品牌', '物品先以普通文本元信息出现，而不是一个彼此孤立的原子 ID。'],
          ['model', 'model', 'Encoder + RQ-VAE', 'embedding -> 量化', '文本编码器先得到 item embedding；RQ-VAE 再把它压缩成多层离散 codeword。'],
          ['semantic featured', 'semantic', 'Semantic ID 词表', '(12, 24, 52) -> item', '这是 TIGER 的关键接口：物品变成可生成的 token 序列，同时仍能映射回真实 item。']
        ]
      },
      {
        tone: 'user',
        badge: '02 下一词预测',
        title: '用户历史驱动模型生成下一个语义 item',
        subtitle: '交互序列被转写成 Semantic ID 序列，Transformer 再预测下一个 ID。',
        direction: 'history -> item',
        steps: [
          ['history', 'history', '用户交互历史', 'item A -> item B -> item C', '推荐上下文来自用户已经点击、购买或浏览过的物品序列。'],
          ['generate', 'generator', '生成模型', 'Transformer over ID tokens', '模型把推荐任务视为在 Semantic ID 词表上的序列生成。'],
          ['output featured', 'output', '推荐结果', 'next Semantic ID -> 候选物品', '生成出的 Semantic ID 最后会被解析成真实 item 或候选 item 集合。']
        ]
      }
    ],
    note: 'Recommendation = 在 Semantic ID 词表上的下一词预测，而不是在自然语言词表里造句。',
    caption: '图 1. TIGER 先从 item 内容建立 Semantic ID 词表，再用用户交互历史生成下一个语义 item。'
  }
};

const tigerRqvaeTrainingCopy = {
  en: {
    figure: 'Figure 2',
    title: 'Semantic ID tokenizer training',
    aria: 'A diagram of TIGER RQ-VAE training, from a 768-dimensional item embedding through a DNN encoder, residual quantizer, DNN decoder, and reconstruction loss.',
    input: 'item content embedding',
    inputDetail: 'Sentence-T5, 768d',
    encoder: 'DNN encoder',
    encoderNote: 'ReLU on hidden layers',
    encoderLayers: [['$x$', '768'], ['$h_1$', '512'], ['$h_2$', '256'], ['$h_3$', '128'], ['$z$', '32']],
    quantizer: 'Residual quantizer',
    quantizerNote: '3 levels, each codebook has 256 vectors of 32d',
    levels: [['C0', 'choose nearest code for $r_0 = z$'], ['C1', 'quantize $r_1 = r_0 - e_{c_0}$'], ['C2', 'quantize $r_2 = r_1 - e_{c_1}$']],
    decoder: 'DNN decoder',
    decoderNote: 'decodes $\\hat{z}$ back to the embedding space',
    output: 'reconstructed embedding',
    outputDetail: '$\\hat{x}$, 768d target space',
    loss: 'Training signal',
    lossItems: ['$L_{\\mathrm{recon}} = \\lVert x - \\hat{x}\\rVert_2^2$', '$L_{\\mathrm{rqvae}}$ aligns residuals and codewords', 'updates encoder, decoder and codebooks'],
    caption: 'Figure 2. RQ-VAE is trained as an autoencoder around residual quantization: encode the item embedding, quantize the latent vector, decode it back, and optimize reconstruction plus quantization losses.'
  },
  zh: {
    figure: '图 2',
    title: 'Semantic ID 分词训练阶段',
    aria: 'TIGER RQ-VAE 训练示意图：768 维 item embedding 经过 DNN encoder、残差量化器、DNN decoder 和重构损失。',
    input: 'item 内容 embedding',
    inputDetail: 'Sentence-T5，768 维',
    encoder: 'DNN encoder',
    encoderNote: '中间层使用 ReLU',
    encoderLayers: [['$x$', '768'], ['$h_1$', '512'], ['$h_2$', '256'], ['$h_3$', '128'], ['$z$', '32']],
    quantizer: 'Residual quantizer',
    quantizerNote: '3 层；每层码本 256 个 32 维 codeword',
    levels: [['C0', '对 $r_0 = z$ 选最近 code'], ['C1', '量化 $r_1 = r_0 - e_{c_0}$'], ['C2', '量化 $r_2 = r_1 - e_{c_1}$']],
    decoder: 'DNN decoder',
    decoderNote: '把 $\\hat{z}$ 解码回 embedding 空间',
    output: '重构 embedding',
    outputDetail: '$\\hat{x}$，目标空间 768 维',
    loss: '训练信号',
    lossItems: ['$L_{\\mathrm{recon}} = \\lVert x - \\hat{x}\\rVert_2^2$', '$L_{\\mathrm{rqvae}}$ 对齐 residual 与 codeword', '联合更新 encoder、decoder 和码本'],
    caption: '图 2. RQ-VAE 的训练不是只做最近邻查找，而是围绕残差量化建立 autoencoder：编码 item embedding，量化潜在向量，再解码重构，并同时优化重构损失与量化损失。'
  }
};

const tigerQuantizerAtlasCopy = {
  en: {
    figure: 'Figure 5',
    title: 'Different ID builders preserve different structure',
    aria: 'A visual comparison of six ways to turn item embeddings into discrete identifiers.',
    methods: [
      ['random', 'Random ID', 'control baseline', 'item -> sampled tokens', 'The item receives random codewords, so the ID has capacity but carries no content similarity.', 'Tests whether content-aware identifiers help.', ['no content', 'random', 'baseline']],
      ['lsh', 'LSH / SimHash', 'random projections', 'embedding -> hyperplane signs -> hash code', 'Random hyperplanes split the embedding space; nearby vectors are more likely to share bits, but the split is not learned for the data distribution.', 'Fast and content based, but not optimized for reconstruction.', ['content', 'fixed split', 'hash tokens']],
      ['pq', 'Product Quantization', 'subspace codes', 'vector slices -> separate codebooks', 'The vector dimensions are partitioned into subspaces, and each subspace is quantized independently.', 'Strong for compression and vector search, less natural for coarse-to-fine residual IDs.', ['content', 'sub-codebooks', 'compression']],
      ['tree', 'Hierarchical k-means', 'tree path', 'root cluster -> child cluster -> leaf', 'The ID is a path in a clustering tree; early branch decisions constrain every later decision.', 'Readable hierarchy, but early hard boundaries cannot be repaired downstream.', ['content', 'clusters', 'path ID']],
      ['vq', 'VQ-VAE', 'per-position quantization', 'encoder latent -> nearest codeword -> decoder', 'One latent position selects a learned codeword for reconstruction. Multiple positions can yield multiple tokens.', 'Quantizes each position once, rather than refining its residual across levels.', ['content', 'learned', 'per position']],
      ['rq', 'RQ-VAE', 'residual correction', 'latent -> code + residual -> next code', 'Each layer quantizes what the previous layer did not explain, so the final ID is a sequence of residual codewords.', 'This is the method TIGER uses for its Semantic ID.', ['content', 'learned', 'residual tokens']]
    ],
    legend: [
      ['Content aware', 'uses item embedding rather than only random assignment'],
      ['Learned', 'code boundaries are trained from data'],
      ['Sequential ID', 'produces several tokens that can be generated autoregressively']
    ],
    caption: 'Figure 5. Six ways to construct discrete IDs: random assignment, random projection, subspace quantization, clustering-tree paths, vector quantization, and residual quantization. They differ in their use of content, partitioning, and code structure.'
  },
  zh: {
    figure: '图 5',
    title: '不同 ID 构造方式保留的是不同结构',
    aria: '六种方式将 item embedding 变成离散标识的可视化对比。',
    methods: [
      ['random', 'Random ID', '随机基线', 'item -> 随机抽 token', '不看内容，直接给 item 分配随机 codeword。ID 有组合容量，但相似物品不一定共享任何 token。', '用于检验内容相关编号是否有帮助。', ['无内容', '随机', '基线']],
      ['lsh', 'LSH / SimHash', '随机投影', 'embedding -> 超平面正负号 -> hash code', '用随机超平面切分 embedding 空间；近邻向量更可能有相同 bit，但切分方式不是为当前数据分布学出来的。', '快、基于内容，但不优化重构。', ['内容', '固定切分', 'hash token']],
      ['pq', 'Product Quantization', '子空间码', '向量切片 -> 各子空间单独量化', '先把向量维度切成几段，每段进入自己的码本，最后把几个子空间编号拼成一个 ID。', '适合压缩和向量检索，不天然表达从粗到细的残差修正。', ['内容', '子码本', '偏压缩']],
      ['tree', 'Hierarchical k-means', '树路径', '根簇 -> 子簇 -> 叶子簇', 'ID 是聚类树上的一条路径。第一层选错父簇后，后面只能在这个子树里继续细分。', '层次直观，但早期硬边界很难被下层修正。', ['内容', '聚类', '路径 ID']],
      ['vq', 'VQ-VAE', '逐位置量化', 'encoder latent -> 最近 codeword -> decoder', '图中示意一个潜在位置：向量选最近码字，再参与重构。多个位置可分别量化，输出多个 token。', '每个位置量化一次，不沿残差逐层细化。', ['内容', '学习码本', '逐位置']],
      ['rq', 'RQ-VAE', '残差修正', 'latent -> code + residual -> 下一层 code', '第一层先解释主要部分，第二层解释剩余残差，第三层继续修正，最终 ID 是多层 codeword 序列。', '这是 TIGER 用来生成 Semantic ID 的方法。', ['内容', '学习码本', '残差 token']]
    ],
    legend: [
      ['是否看内容', '是否使用 item embedding，而不是只随机编号'],
      ['是否学习边界', '码本或划分是否由数据训练得到'],
      ['是否天然多 token', '是否容易作为自回归生成目标']
    ],
    caption: '图 5. 六种离散 ID 构造方式：随机赋码、随机投影、子空间量化、聚类树路径、向量量化与残差量化。它们在内容利用、划分方式和编码结构上各有差异。'
  }
};

const tigerIndexMapCopy = {
  en: {
    figure: 'Figure 6',
    title: 'An index is a route from query to candidate address',
    aria: 'A comparison of how traditional vector retrieval and TIGER both map a user context to candidate item addresses.',
    rows: [
      ['external', 'Traditional vector retrieval', 'user history', 'query embedding', 'external ANN / MIPS index', 'Top-K item IDs', 'candidate list', 'The index is a visible search structure: it stores item vectors and returns nearby item addresses.'],
      ['tiger', 'TIGER generative retrieval', 'history as Semantic IDs', 'decoder prefixes', 'Transformer parameters', 'Semantic ID -> Item ID', 'mapping table', 'The model learns the route from history to Semantic ID; the mapping table resolves that generated address.']
    ],
    bridge: 'Same job, different mechanism: search a stored vector structure, or decode a likely Semantic ID.',
    caption: 'Figure 6. TIGER calls Transformer parameters an index because they generate candidate addresses, not because they replace every lookup table.'
  },
  zh: {
    figure: '图 6',
    title: '索引：从查询到候选地址的路径',
    aria: '传统向量检索和 TIGER 都把用户上下文映射到候选物品地址，但实现机制不同的双行对比图。',
    rows: [
      ['external', '传统向量检索', '用户历史', 'query embedding', '外部 ANN / MIPS 索引', 'Top-K Item ID', 'candidate list', '索引是看得见的搜索结构：保存 item embedding，查询时返回相近 item 的地址。'],
      ['tiger', 'TIGER 生成式检索', 'Semantic ID 历史', 'decoder 前缀', 'Transformer 参数', 'Semantic ID -> Item ID', 'mapping table', '模型学会从历史生成 Semantic ID；映射表仍然负责把这个生成地址解析回真实物品。']
    ],
    bridge: '两条路径做同一件事：把用户上下文变成候选地址；区别是查外部结构，还是解码一个语义 ID。',
    caption: '图 6. TIGER 把 Transformer 参数称为索引，是因为它生成候选地址；这不代表所有映射表都消失了。'
  }
};

const tigerInferenceLoopCopy = {
  en: {
    figure: 'Figure 4',
    title: 'Inference loop: probabilities become real items',
    aria: 'A five-step diagram showing decoder token probabilities becoming beam prefixes, complete Semantic IDs, table lookups, and Top-K item results.',
    stages: [
      ['prob', 'decoder', 'token distributions', 'Each step scores the next Semantic ID token.', [['d1=12', 0.42], ['d1=87', 0.25], ['d1=04', 0.18]]],
      ['beam', 'search', 'keep prefixes', 'High-score prefixes survive and expand.', [['12'], ['12', '24'], ['12', '24', '52']]],
      ['sid', 'address', 'complete Semantic IDs', 'A full token sequence becomes a candidate address.', [['12', '24', '52', '0'], ['12', '24', '61', '0']]],
      ['lookup', 'mapping', 'resolve address', 'The mapping table returns real item IDs.', [['SID A', 'item 831'], ['SID B', 'item 1620']]],
      ['topk', 'result', 'Top-K items', 'The page or service finally shows items, not tokens.', ['#1 item 831', '#2 item 1620', '#3 item 447']]
    ],
    note: 'The generator does not directly display token probabilities. It searches likely Semantic ID sequences first, then resolves those addresses back to item IDs.',
    caption: 'Figure 4. At serving time, TIGER decodes Semantic ID candidates and uses the Semantic ID to Item ID mapping to produce Top-K recommendations.'
  },
  zh: {
    figure: '图 4',
    title: '推理闭环：概率最终要变回真实物品',
    aria: '五步示意图，展示 decoder token 概率如何变成候选前缀、完整 Semantic ID、映射表查询和 Top-K 物品结果。',
    stages: [
      ['prob', 'decoder', 'token 概率分布', '每一步都在预测下一位 Semantic ID token。', [['d1=12', 0.42], ['d1=87', 0.25], ['d1=04', 0.18]]],
      ['beam', 'search', '保留高分前缀', '高概率前缀被保留，并继续向后扩展。', [['12'], ['12', '24'], ['12', '24', '52']]],
      ['sid', 'address', '完整 Semantic ID', '完整 token 序列先形成候选地址。', [['12', '24', '52', '0'], ['12', '24', '61', '0']]],
      ['lookup', 'mapping', '映射回物品', '映射表把语义地址解析成真实 Item ID。', [['SID A', 'item 831'], ['SID B', 'item 1620']]],
      ['topk', 'result', 'Top-K 物品', '最后展示给用户的是物品，而不是 token。', ['#1 item 831', '#2 item 1620', '#3 item 447']]
    ],
    note: '生成器不会把 token 概率直接展示给用户；它先搜索可能的 Semantic ID 序列，再把这些语义地址还原成真实物品。',
    caption: '图 4. 服务阶段中，TIGER 先解码 Semantic ID 候选，再通过 Semantic ID 到 Item ID 的映射表得到 Top-K 推荐结果。'
  }
};


function tigerFlowGlyphHtml(name = 'item') {
  const safeName = escapeAttribute(name);
  if (name === 'semantic') {
    return `<span class="tiger-flow-glyph tiger-flow-glyph-semantic" aria-hidden="true"><b>12</b><b>24</b><b>52</b></span>`;
  }
  if (name === 'history') {
    return `<span class="tiger-flow-glyph tiger-flow-glyph-history" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
  }
  if (name === 'generator') {
    return `<span class="tiger-flow-glyph tiger-flow-glyph-generator" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
  }
  if (name === 'output') {
    return `<span class="tiger-flow-glyph tiger-flow-glyph-output" aria-hidden="true"><b>ID</b><i></i></span>`;
  }
  if (name === 'model') {
    return `<span class="tiger-flow-glyph tiger-flow-glyph-model" aria-hidden="true"><i></i><i></i><i></i></span>`;
  }
  return `<span class="tiger-flow-glyph tiger-flow-glyph-${safeName}" aria-hidden="true"><i></i><i></i><i></i></span>`;
}

function tigerRqvaeTextHtml(text) {
  return text.split(/(\$[^$]+\$)/g).map((part) => {
    if (!part.startsWith('$')) return escapeHtml(part);
    return window.katex ? window.katex.renderToString(part.slice(1, -1), { throwOnError: false, trust: false }) : escapeHtml(part);
  }).join('');
}

function tigerRqvaeArrowHtml() {
  return '<i class="tiger-rqvae-arrow" aria-hidden="true"></i>';
}

function tigerRqvaeFunnelHtml(layers, mode = 'encoder') {
  return layers.map(([name, dim], index) => {
    const scale = mode === 'encoder'
      ? 1 - (index * 0.13)
      : 0.48 + (index * 0.13);
    return `<li class="${index === layers.length - 1 && mode === 'encoder' ? 'is-latent' : ''}" style="--layer-scale:${scale.toFixed(2)}"><b>${tigerRqvaeTextHtml(name)}</b><span>${escapeHtml(dim)}</span></li>`;
  }).join('');
}

function tigerRqvaeCodebookHtml(name, selected, detail, index) {
  const slots = Array.from({ length: 8 }, (_, slot) => `<i class="${slot === selected ? 'is-selected' : ''}">${slot}</i>`).join('');
  return `<li class="tiger-rqvae-codebook tiger-rqvae-codebook-${index}"><strong>${tigerRqvaeTextHtml(name)}</strong><span class="tiger-rqvae-slots">${slots}</span><em>${tigerRqvaeTextHtml(detail)}</em></li>`;
}

function tigerRqvaeTrainingFigureHtml(lang = 'en') {
  const copy = tigerRqvaeTrainingCopy[lang === 'zh' ? 'zh' : 'en'];
  const encoderLayers = tigerRqvaeFunnelHtml(copy.encoderLayers, 'encoder');
  const decoderLayers = tigerRqvaeFunnelHtml([['$\\hat{z}$', '32'], ['DNN', ''], ['DNN', ''], ['$\\hat{x}$', '768']], 'decoder');
  const codebooks = [
    tigerRqvaeCodebookHtml('$C_0$', 7, copy.levels[0][1], 0),
    tigerRqvaeCodebookHtml('$C_1$', 1, copy.levels[1][1], 1),
    tigerRqvaeCodebookHtml('$C_2$', 4, copy.levels[2][1], 2)
  ].join('');
  const losses = copy.lossItems.map((item) => `<li>${tigerRqvaeTextHtml(item)}</li>`).join('');
  return `<figure id="fig-tiger-rqvae-training" class="tiger-pipeline-figure tiger-rqvae-figure"><div class="tiger-pipeline-surface tiger-rqvae-surface" role="group" aria-label="${escapeAttribute(copy.aria)}"><div class="tiger-pipeline-heading"><span>${escapeHtml(copy.figure)}</span><strong>${escapeHtml(copy.title)}</strong></div><div class="tiger-rqvae-architecture"><section class="tiger-rqvae-vector tiger-rqvae-source"><span>${escapeHtml(copy.input)}</span><strong>${tigerRqvaeTextHtml('$x$')}</strong><em>${tigerRqvaeTextHtml(copy.inputDetail)}</em><i aria-hidden="true"></i></section>${tigerRqvaeArrowHtml()}<section class="tiger-rqvae-module tiger-rqvae-encoder"><span>${escapeHtml(copy.encoder)}</span><ol class="tiger-rqvae-funnel">${encoderLayers}</ol><em>${tigerRqvaeTextHtml(copy.encoderNote)}</em></section>${tigerRqvaeArrowHtml()}<section class="tiger-rqvae-module tiger-rqvae-quantizer"><span>${escapeHtml(copy.quantizer)}</span><div class="tiger-rqvae-residual-rail" aria-hidden="true"><b class="rail-z">${tigerRqvaeTextHtml('$z$')}</b><b class="rail-r1">${tigerRqvaeTextHtml('$r_1$')}</b><b class="rail-r2">${tigerRqvaeTextHtml('$r_2$')}</b><b class="rail-r3">${tigerRqvaeTextHtml('$r_3$')}</b></div><ol class="tiger-rqvae-codebooks">${codebooks}</ol><div class="tiger-rqvae-semantic-id" aria-hidden="true"><span>7</span><span>1</span><span>4</span></div><em>${tigerRqvaeTextHtml(copy.quantizerNote)}</em></section>${tigerRqvaeArrowHtml()}<section class="tiger-rqvae-module tiger-rqvae-decoder"><span>${escapeHtml(copy.decoder)}</span><ol class="tiger-rqvae-funnel tiger-rqvae-funnel-decoder">${decoderLayers}</ol><em>${tigerRqvaeTextHtml(copy.decoderNote)}</em></section>${tigerRqvaeArrowHtml()}<section class="tiger-rqvae-vector tiger-rqvae-recon"><span>${escapeHtml(copy.output)}</span><strong>${tigerRqvaeTextHtml('$\\hat{x}$')}</strong><em>${tigerRqvaeTextHtml(copy.outputDetail)}</em><i aria-hidden="true"></i></section></div><div class="tiger-rqvae-loss-loop"><span>${escapeHtml(copy.loss)}</span><ol>${losses}</ol></div></div><figcaption>${escapeHtml(copy.caption)}</figcaption></figure>`;
}

function tigerQuantizerSvgHtml(id, body) {
  return `<div class="tiger-quantizer-visual tiger-quantizer-visual-${escapeAttribute(id)}" aria-hidden="true"><svg class="tiger-q-svg tiger-q-svg-${escapeAttribute(id)}" viewBox="0 0 280 156" focusable="false"><defs><marker id="tiger-q-arrow-${escapeAttribute(id)}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="tiger-q-marker" d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>${body}</svg></div>`;
}

function tigerQuantizerVisualHtml(id) {
  if (id === 'random') return tigerQuantizerSvgHtml(id, `<rect class="tiger-q-box" x="16" y="28" width="60" height="44" rx="10"></rect><text class="tiger-q-label" x="46" y="55">item</text><path class="tiger-q-arrow" d="M 82 50 H 110" marker-end="url(#tiger-q-arrow-random)"></path><rect class="tiger-q-box tiger-q-active-fill" x="116" y="18" width="58" height="64" rx="12"></rect><circle class="tiger-q-dot" cx="133" cy="37" r="3"></circle><circle class="tiger-q-dot" cx="156" cy="37" r="3"></circle><circle class="tiger-q-dot" cx="145" cy="51" r="3"></circle><circle class="tiger-q-dot" cx="133" cy="65" r="3"></circle><circle class="tiger-q-dot" cx="156" cy="65" r="3"></circle><text class="tiger-q-caption" x="145" y="101">ignore content</text><path class="tiger-q-arrow" d="M 180 50 H 206" marker-end="url(#tiger-q-arrow-random)"></path><g class="tiger-q-token-row"><rect x="210" y="25" width="28" height="26" rx="7"></rect><rect x="242" y="25" width="28" height="26" rx="7"></rect><rect x="210" y="57" width="28" height="26" rx="7"></rect><rect x="242" y="57" width="28" height="26" rx="7"></rect><text x="224" y="42">07</text><text x="256" y="42">188</text><text x="224" y="74">42</text><text x="256" y="74">251</text></g><text class="tiger-q-caption" x="240" y="123">sampled ID</text>`);
  if (id === 'lsh') return tigerQuantizerSvgHtml(id, `<rect class="tiger-q-plot" x="18" y="18" width="122" height="96" rx="12"></rect><path class="tiger-q-line" d="M 34 92 L 126 30"></path><path class="tiger-q-line" d="M 32 38 L 128 96"></path><path class="tiger-q-line tiger-q-muted-stroke" d="M 74 22 L 96 110"></path><circle class="tiger-q-point" cx="84" cy="68" r="6"></circle><text class="tiger-q-caption" x="79" y="132">hyperplane signs</text><path class="tiger-q-arrow" d="M 148 66 H 176" marker-end="url(#tiger-q-arrow-lsh)"></path><g class="tiger-q-token-row tiger-q-bit-row"><rect x="182" y="34" width="26" height="28" rx="7"></rect><rect x="214" y="34" width="26" height="28" rx="7"></rect><rect x="246" y="34" width="26" height="28" rx="7"></rect><rect x="198" y="72" width="26" height="28" rx="7"></rect><text x="195" y="52">1</text><text x="227" y="52">0</text><text x="259" y="52">1</text><text x="211" y="90">1</text></g><text class="tiger-q-caption" x="226" y="123">hash code</text>`);
  if (id === 'pq') return tigerQuantizerSvgHtml(id, `<text class="tiger-q-caption" x="140" y="16">split embedding dimensions</text><g class="tiger-q-vector-bar"><rect x="24" y="28" width="232" height="28" rx="8"></rect><path d="M 101 28 V 56"></path><path d="M 179 28 V 56"></path><text x="63" y="47">z1</text><text x="140" y="47">z2</text><text x="218" y="47">z3</text></g><path class="tiger-q-arrow" d="M 63 62 V 78" marker-end="url(#tiger-q-arrow-pq)"></path><path class="tiger-q-arrow" d="M 140 62 V 78" marker-end="url(#tiger-q-arrow-pq)"></path><path class="tiger-q-arrow" d="M 218 62 V 78" marker-end="url(#tiger-q-arrow-pq)"></path><g class="tiger-q-codebooks"><rect x="37" y="84" width="52" height="34" rx="8"></rect><rect x="114" y="84" width="52" height="34" rx="8"></rect><rect x="192" y="84" width="52" height="34" rx="8"></rect><text x="63" y="105">C1</text><text x="140" y="105">C2</text><text x="218" y="105">C3</text></g><g class="tiger-q-token-row tiger-q-output-row"><rect x="45" y="128" width="36" height="22" rx="6"></rect><rect x="122" y="128" width="36" height="22" rx="6"></rect><rect x="200" y="128" width="36" height="22" rx="6"></rect><text x="63" y="143">A7</text><text x="140" y="143">B3</text><text x="218" y="143">C9</text></g>`);
  if (id === 'tree') return tigerQuantizerSvgHtml(id, `<rect class="tiger-q-box tiger-q-active-fill" x="106" y="12" width="68" height="30" rx="8"></rect><text class="tiger-q-label" x="140" y="32">root</text><path class="tiger-q-arrow tiger-q-active-stroke" d="M 128 44 L 76 66" marker-end="url(#tiger-q-arrow-tree)"></path><path class="tiger-q-line" d="M 152 44 L 204 66"></path><rect class="tiger-q-box tiger-q-active-fill" x="48" y="70" width="56" height="30" rx="8"></rect><rect class="tiger-q-box" x="176" y="70" width="56" height="30" rx="8"></rect><text class="tiger-q-label" x="76" y="90">A</text><text class="tiger-q-label" x="204" y="90">B</text><path class="tiger-q-arrow tiger-q-active-stroke" d="M 68 102 L 47 122" marker-end="url(#tiger-q-arrow-tree)"></path><path class="tiger-q-line" d="M 86 102 L 109 122"></path><rect class="tiger-q-box tiger-q-active-fill" x="22" y="124" width="48" height="26" rx="7"></rect><rect class="tiger-q-box" x="88" y="124" width="48" height="26" rx="7"></rect><rect class="tiger-q-box" x="176" y="124" width="48" height="26" rx="7"></rect><text class="tiger-q-label" x="46" y="141">A2</text><text class="tiger-q-label" x="112" y="141">A5</text><text class="tiger-q-label" x="200" y="141">B4</text>`);
  if (id === 'vq') return tigerQuantizerSvgHtml(id, `<rect class="tiger-q-box" x="16" y="26" width="38" height="32" rx="8"></rect><text class="tiger-q-label" x="35" y="47">x</text><path class="tiger-q-arrow" d="M 60 42 H 78" marker-end="url(#tiger-q-arrow-vq)"></path><rect class="tiger-q-box" x="84" y="26" width="38" height="32" rx="8"></rect><text class="tiger-q-label" x="103" y="47">E</text><path class="tiger-q-arrow" d="M 128 42 H 146" marker-end="url(#tiger-q-arrow-vq)"></path><rect class="tiger-q-box tiger-q-active-fill" x="152" y="26" width="38" height="32" rx="8"></rect><text class="tiger-q-label" x="171" y="47">z</text><path class="tiger-q-arrow" d="M 196 42 H 210" marker-end="url(#tiger-q-arrow-vq)"></path><rect class="tiger-q-plot" x="216" y="16" width="50" height="54" rx="12"></rect><circle class="tiger-q-code-dot" cx="229" cy="35" r="4.5"></circle><circle class="tiger-q-code-dot tiger-q-active-dot" cx="242" cy="51" r="5.5"></circle><circle class="tiger-q-code-dot" cx="253" cy="31" r="4.5"></circle><text class="tiger-q-caption" x="241" y="83">nearest</text><path class="tiger-q-arrow" d="M 242 74 V 98" marker-end="url(#tiger-q-arrow-vq)"></path><g class="tiger-q-token-row"><rect x="178" y="106" width="58" height="28" rx="7"></rect><text x="207" y="124">code 18</text></g><path class="tiger-q-arrow" d="M 240 120 H 252" marker-end="url(#tiger-q-arrow-vq)"></path><rect class="tiger-q-box" x="258" y="104" width="22" height="32" rx="8"></rect><text class="tiger-q-label" x="269" y="125">D</text>`);
  return tigerQuantizerSvgHtml(id, `<text class="tiger-q-caption" x="142" y="18">quantize the remaining residual</text><rect class="tiger-q-residual-bar tiger-q-residual-bar-1" x="32" y="32" width="150" height="18" rx="9"></rect><text class="tiger-q-label" x="20" y="47">z</text><rect class="tiger-q-code-chip" x="202" y="26" width="42" height="28" rx="8"></rect><text class="tiger-q-label" x="223" y="45">c1</text><path class="tiger-q-arrow" d="M 184 41 H 196" marker-end="url(#tiger-q-arrow-rq)"></path><path class="tiger-q-arrow tiger-q-muted-stroke" d="M 108 55 V 70" marker-end="url(#tiger-q-arrow-rq)"></path><rect class="tiger-q-residual-bar tiger-q-residual-bar-2" x="54" y="76" width="112" height="18" rx="9"></rect><text class="tiger-q-label" x="36" y="91">r1</text><rect class="tiger-q-code-chip" x="186" y="70" width="42" height="28" rx="8"></rect><text class="tiger-q-label" x="207" y="89">c2</text><path class="tiger-q-arrow" d="M 168 85 H 180" marker-end="url(#tiger-q-arrow-rq)"></path><path class="tiger-q-arrow tiger-q-muted-stroke" d="M 110 99 V 114" marker-end="url(#tiger-q-arrow-rq)"></path><rect class="tiger-q-residual-bar tiger-q-residual-bar-3" x="74" y="120" width="76" height="18" rx="9"></rect><text class="tiger-q-label" x="56" y="135">r2</text><rect class="tiger-q-code-chip" x="166" y="114" width="42" height="28" rx="8"></rect><text class="tiger-q-label" x="187" y="133">c3</text><g class="tiger-q-token-row tiger-q-rq-output"><rect x="218" y="116" width="18" height="22" rx="5"></rect><rect x="240" y="116" width="18" height="22" rx="5"></rect><rect x="262" y="116" width="18" height="22" rx="5"></rect><text x="227" y="131">12</text><text x="249" y="131">24</text><text x="271" y="131">52</text></g>`);
}

function tigerQuantizerAtlasFigureHtml(lang = 'en') {
  const copy = tigerQuantizerAtlasCopy[lang === 'zh' ? 'zh' : 'en'];
  const methods = copy.methods.map(([id, name, label, route, point, takeaway, traits]) => {
    const traitItems = traits.map((trait) => `<li>${escapeHtml(trait)}</li>`).join('');
    return `
        <section class="tiger-quantizer-method tiger-quantizer-${escapeAttribute(id)}">
          ${tigerQuantizerVisualHtml(id)}
          <div class="tiger-quantizer-copy">
            <span>${escapeHtml(label)}</span>
            <h3>${escapeHtml(name)}</h3>
            <em>${escapeHtml(route)}</em>
            <p>${escapeHtml(point)}</p>
            <ul class="tiger-quantizer-traits">${traitItems}</ul>
            <strong>${escapeHtml(takeaway)}</strong>
          </div>
        </section>`;
  }).join('');
  const axes = copy.legend.map(([label, detail]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(detail)}</dd></div>`).join('');
  return `<figure id="fig-tiger-quantizer-atlas" class="tiger-pipeline-figure tiger-quantizer-figure"><div class="tiger-pipeline-surface tiger-quantizer-surface" role="group" aria-label="${escapeAttribute(copy.aria)}"><div class="tiger-pipeline-heading"><span>${escapeHtml(copy.figure)}</span><strong>${escapeHtml(copy.title)}</strong></div><dl class="tiger-quantizer-axis">${axes}</dl><div class="tiger-quantizer-grid">${methods}</div></div><figcaption>${escapeHtml(copy.caption)}</figcaption></figure>`;
}

function tigerInferenceTokenSequenceHtml(tokens) {
  return `<span class="tiger-inference-token-sequence">${tokens.map((token) => `<i>${escapeHtml(token)}</i>`).join('')}</span>`;
}

function tigerInferenceBarsHtml(bars = []) {
  return `<ol class="tiger-inference-bars">${bars.map(([label, value]) => {
    const percent = Math.max(0, Math.min(100, Number(value) * 100));
    return `<li><span>${escapeHtml(label)}</span><b>${escapeHtml(value.toFixed(2))}</b><i style="--bar:${percent.toFixed(0)}%"></i></li>`;
  }).join('')}</ol>`;
}

function tigerInferenceStageVisualHtml(kind, payload) {
  if (kind === 'prob') return tigerInferenceBarsHtml(payload);
  if (kind === 'beam') return `<ol class="tiger-inference-prefixes">${payload.map((tokens, index) => `<li><b>${index + 1}</b>${tigerInferenceTokenSequenceHtml(tokens)}</li>`).join('')}</ol>`;
  if (kind === 'sid') return `<ol class="tiger-inference-ids">${payload.map((tokens) => `<li>${tigerInferenceTokenSequenceHtml(tokens)}</li>`).join('')}</ol>`;
  if (kind === 'lookup') return `<ol class="tiger-inference-lookup-list">${payload.map(([sid, item]) => `<li><span>${escapeHtml(sid)}</span><b>${escapeHtml(item)}</b></li>`).join('')}</ol>`;
  return `<ol class="tiger-inference-topk-list">${payload.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`;
}

function tigerInferenceLoopFigureHtml(lang = 'en') {
  const copy = tigerInferenceLoopCopy[lang === 'zh' ? 'zh' : 'en'];
  const stages = copy.stages.map(([kind, label, title, detail, payload]) => `<section class="tiger-inference-stage tiger-inference-${escapeAttribute(kind)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(title)}</strong>${tigerInferenceStageVisualHtml(kind, payload)}<em>${escapeHtml(detail)}</em></section>`).join('');
  return `<figure id="fig-tiger-inference-loop" class="tiger-pipeline-figure tiger-inference-figure"><div class="tiger-pipeline-surface tiger-inference-surface" role="group" aria-label="${escapeAttribute(copy.aria)}"><div class="tiger-pipeline-heading"><span>${escapeHtml(copy.figure)}</span><strong>${escapeHtml(copy.title)}</strong></div><div class="tiger-inference-board">${stages}</div><p class="tiger-flow-note">${escapeHtml(copy.note)}</p></div><figcaption>${escapeHtml(copy.caption)}</figcaption></figure>`;
}

function tigerIndexGlyphHtml(id) {
  if (id === 'external') return `<span class="tiger-index-glyph tiger-index-glyph-external" aria-hidden="true"><i></i><i></i><i></i><b></b></span>`;
  return `<span class="tiger-index-glyph tiger-index-glyph-tiger" aria-hidden="true"><i></i><i></i><i></i><b>12</b><b>24</b><b>52</b></span>`;
}

function tigerIndexMapFigureHtml(lang = 'en') {
  const copy = tigerIndexMapCopy[lang === 'zh' ? 'zh' : 'en'];
  const rows = copy.rows.map(([id, badge, input, representation, engine, output, target, note]) => `
        <section class="tiger-index-lane tiger-index-${escapeAttribute(id)}">
          <div class="tiger-index-lane-head"><span>${escapeHtml(badge)}</span><p>${escapeHtml(note)}</p></div>
          <div class="tiger-index-route">
            <div class="tiger-index-stage"><span>${escapeHtml(input)}</span><strong>${escapeHtml(representation)}</strong></div>
            <div class="tiger-index-engine">${tigerIndexGlyphHtml(id)}<strong>${escapeHtml(engine)}</strong></div>
            <div class="tiger-index-stage"><span>${escapeHtml(output)}</span><strong>${escapeHtml(target)}</strong></div>
          </div>
        </section>`).join('');
  return `<figure id="fig-tiger-index-map" class="tiger-pipeline-figure tiger-index-figure"><div class="tiger-pipeline-surface tiger-index-surface" role="group" aria-label="${escapeAttribute(copy.aria)}"><div class="tiger-pipeline-heading"><span>${escapeHtml(copy.figure)}</span><strong>${escapeHtml(copy.title)}</strong></div><div class="tiger-index-map">${rows}</div><p class="tiger-flow-note">${escapeHtml(copy.bridge)}</p></div><figcaption>${escapeHtml(copy.caption)}</figcaption></figure>`;
}

function tigerGeneratorInputFigureHtml(lang = 'en') {
  const zh = lang === 'zh';
  const t = (cn, en) => escapeHtml(zh ? cn : en);
  const token = (value, kind = '') => '<span class="tg3-token' + (kind ? ' tg3-' + kind : '') + '">' + escapeHtml(value) + '</span>';
  const seq = (values) => values.map(value => token(value, /4$/.test(value) ? 'collision' : value.startsWith('<') ? 'control' : '')).join('');
  const down = (label = '') => '<div class="tg3-down"><span aria-hidden="true">↓</span>' + label + '</div>';
  const matrix = (masked) => '<span class="tg3-mask" aria-hidden="true">' + Array.from({ length: 16 }, (_, i) => '<i class="' + (!masked || i % 4 <= Math.floor(i / 4) ? 'is-visible' : '') + '"></i>').join('') + '</span>';
  const op = (name, description, detail, visual = '') => '<div class="tg3-op">' + visual + '<strong>' + name + '</strong><span>' + description + '</span><small>' + detail + '</small></div>';
  const history = ['A', 'B', 'C'].map((item, i) => '<div class="tg3-item"><b>Item ' + item + '</b><span class="tg3-lookup">↓ ' + t('查 Semantic ID', 'Look up Semantic ID') + '</span><div class="tg3-item-tokens">' + seq([1, 2, 3, 4].map(n => item.toLowerCase() + n)) + '</div></div>').join('<span class="tg3-time" aria-label="' + t('之后', 'then') + '">→</span>');
  const labels = ['d1', 'd2', 'd3', 'd4', '<EOS>'];
  const positions = labels.map((_, i) => '<span>' + t('位置 ', 'Position ') + (i + 1) + '</span>').join('');
  const predictions = labels.map((value) => '<span class="tg3-prob">p(' + escapeHtml(value) + ')</span>').join('');
  return '<figure id="fig-tiger-generator-input" class="tiger-pipeline-figure tiger-generator-figure">' +
    '<div class="tiger-pipeline-surface tg3-surface" role="group" aria-label="' + t('TIGER 生成器训练：历史输入、右移目标和逐位置监督', 'TIGER generator training: history, shifted targets and position-wise supervision') + '">' +
      '<div class="tiger-pipeline-heading"><span>' + t('图 3', 'Figure 3') + '</span><strong>' + t('用一段交互历史，学习下一个物品', 'Learn the next item from interaction history') + '</strong></div>' +
      '<section class="tg3-stage"><h4><span>01</span>' + t('把历史物品展开为输入序列', 'Turn history items into an input sequence') + '</h4>' +
        '<div class="tg3-history">' + history + '</div>' +
        '<p class="tg3-legend">' + t('按交互时间排列。实线：前三位量化 token；虚线：第四位碰撞 token。', 'Items are in chronological order. Solid: three quantization tokens. Dashed: the fourth collision token.') + '</p>' +
        '<div class="tg3-flatten"><span class="tg3-user">' + token('user_5', 'control') + '<small>' + t('用户 ID 哈希桶', 'User ID hash bucket') + '</small></span><b aria-hidden="true">+</b><span class="tg3-flat-history">' + seq(['a1','a2','a3','a4','b1','b2','b3','b4','c1','c2','c3','c4']) + '</span></div>' +
        down('Token embedding · 128 ' + t('维', 'dimensions')) +
        '<div class="tg3-stack"><header><b>Transformer Encoder</b><span>× 4 ' + t('层', 'layers') + '</span></header><div class="tg3-ops tg3-encoder">' +
          op('Self-attention', t('每个位置读取整段历史', 'Each position reads the full history'), '6 heads × 64', matrix(false)) +
          '<span class="tg3-op-arrow" aria-hidden="true">→</span>' +
          op('FFN', t('逐位置变换表示', 'Transform each position'), 'MLP 1024 · ReLU') +
        '</div></div>' +
        down() +
        '<div class="tg3-context"><b>H</b><span>' + t('历史各位置的上下文表示', 'Context representations at all history positions') + '</span><small>' + t('供 decoder 每层的 cross-attention 读取', 'Read by cross-attention in every decoder layer') + '</small></div>' +
      '</section>' +
      '<section class="tg3-stage"><h4><span>02</span>' + t('提供正确前缀，预测后一个 token', 'Provide the correct prefix; predict the next token') + '</h4>' +
        '<div class="tg3-answer"><span>' + t('真实的下一个物品', 'Actual next item') + '</span><b>Item D</b><span aria-hidden="true">→</span>' + seq(['d1','d2','d3','d4']) + '</div>' +
        '<p class="tg3-legend">' + t('训练时右移答案作为 decoder 输入（teacher forcing）。同一列的输入用于预测下方标签。', 'During training, shift the answer right for decoder input (teacher forcing). Each column predicts its label below.') + '</p>' +
        '<div class="tg3-aligned" role="group" aria-label="' + t('对齐的 decoder 输入、预测分布和目标标签', 'Aligned decoder inputs, predictions and target labels') + '">' +
          '<div class="tg3-five tg3-positions">' + positions + '</div>' +
          '<b class="tg3-row-label">Decoder ' + t('输入 · 正确答案的前缀', 'input · ground-truth prefixes') + '</b>' +
          '<div class="tg3-five tg3-decoder-input">' + seq(['<BOS>','d1','d2','d3','d4']) + '</div>' +
          down('Token embedding · 128 ' + t('维', 'dimensions')) +
          '<div class="tg3-stack"><header><b>Transformer Decoder</b><span>× 4 ' + t('层', 'layers') + '</span></header><div class="tg3-ops tg3-decoder">' +
            op('Masked self-attention', t('只能读取当前位置及之前的输入', 'Read only the current and earlier inputs'), '6 heads × 64', matrix(true)) +
            '<span class="tg3-op-arrow" aria-hidden="true">→</span>' +
            op('Cross-attention', t('用当前表示查询历史 H', 'Query history H with the current representation'), 'Q: decoder · K / V: H', '<span class="tg3-context-port">H ↓</span>') +
            '<span class="tg3-op-arrow" aria-hidden="true">→</span>' +
            op('FFN', t('融合后逐位置变换', 'Transform each fused position'), 'MLP 1024 · ReLU') +
          '</div></div>' +
          down(t('词表投影 + Softmax', 'Vocabulary projection + Softmax')) +
          '<b class="tg3-row-label">' + t('真实 token 在各位置词表分布中的概率', 'Probability of the true token in each vocabulary distribution') + '</b>' +
          '<div class="tg3-five tg3-predictions">' + predictions + '</div>' +
          '<div class="tg3-five tg3-compare" aria-hidden="true">' + '<span>↕</span>'.repeat(5) + '</div>' +
          '<div class="tg3-five tg3-target">' + seq(labels) + '</div>' +
          '<b class="tg3-row-label">' + t('真实标签 · 比 decoder 输入左移一位', 'Target labels · one position ahead of the input') + '</b>' +
        '</div>' +
        down(t('逐位置比较预测与标签', 'Compare predictions with target labels')) +
        '<div class="tg3-loss"><b>' + t('交叉熵损失', 'Cross-entropy loss') + '</b><span>' + t('提高真实 token 的概率，反向更新生成器参数', 'Increase the probability of true tokens; backpropagate into the generator') + '</span></div>' +
      '</section>' +
      '<p class="tg3-footnote">' + t('每个位置都经过完整的 4 层 decoder；4 层不对应 4 个 token。矩阵亮格表示可见位置，行为查询、列为被读取的位置。图中省略残差连接、归一化与位置机制；dropout 为 0.1。', 'Every position passes through all 4 decoder layers; layers are not token steps. Lit matrix cells mark visible positions: rows are queries, columns are attended positions. Residual connections, normalization and position mechanisms are omitted; dropout is 0.1.') + '</p>' +
    '</div><figcaption>' + t('图 3. TIGER 生成器的训练数据流。先编码用户 token 与历史 Semantic ID，再用右移的正确答案监督下一个物品的 token 预测。p(dᵢ) 表示模型分配给该位置真实 token 的概率，完整分布覆盖词表；起止符号为序列对齐示意。RQ-VAE 已在上一阶段训练完成，推理时的自回归反馈见图 4。', 'Figure 3. TIGER generator training. Encode the user token and history Semantic IDs, then supervise next-item prediction using shifted ground-truth tokens. p(dᵢ) denotes the probability assigned to the true token within the vocabulary distribution. Start/end symbols illustrate alignment. RQ-VAE is already trained; Figure 4 shows autoregressive inference.') + '</figcaption></figure>';
}

function tigerPipelineFigureHtml(lang = 'en') {
  const copy = tigerFlowFigureCopy[lang === 'zh' ? 'zh' : 'en'];
  const lanes = copy.lanes.map((lane) => {
    const steps = lane.steps.map(([tone, visual, title, sample, detail]) => `
          <li class="tiger-flow-step tiger-flow-${escapeAttribute(tone)}">
            <details class="tiger-flow-card">
              <summary>
                ${tigerFlowGlyphHtml(visual)}
                <span class="tiger-flow-copy">
                  <strong>${escapeHtml(title)}</strong>
                  <em>${escapeHtml(sample)}</em>
                </span>
              </summary>
              <p>${escapeHtml(detail)}</p>
            </details>
          </li>`).join('');
    return `
        <section class="tiger-flow-lane tiger-flow-lane-${escapeAttribute(lane.tone)}" aria-label="${escapeAttribute(lane.title)}">
          <div class="tiger-flow-lane-head">
            <div>
              <span>${escapeHtml(lane.badge)}</span>
              <strong class="tiger-flow-lane-title">${escapeHtml(lane.title)}</strong>
              <p>${escapeHtml(lane.subtitle)}</p>
            </div>
            <strong>${escapeHtml(lane.direction)}</strong>
          </div>
          <ol class="tiger-flow-track">
${steps}
          </ol>
        </section>`;
  }).join('');
  return `<figure id="fig-tiger-semantic-id-flow" class="tiger-pipeline-figure">
    <div class="tiger-pipeline-surface" role="group" aria-label="${escapeAttribute(copy.aria)}">
      <div class="tiger-pipeline-heading">
        <span>${escapeHtml(copy.figure)}</span>
        <strong>${escapeHtml(copy.title)}</strong>
      </div>
      <div class="tiger-flow-map">
${lanes}
      </div>
      <p class="tiger-flow-note">${escapeHtml(copy.note)}</p>
    </div>
    <figcaption>${escapeHtml(copy.caption)}</figcaption>
  </figure>`;
}

function tigerPipelineFigureHtmlLegacy(lang = 'en') {
  const copy = tigerPipelineCopy[lang === 'zh' ? 'zh' : 'en'];
  const steps = copy.steps.map(([tone, role, title, sample, detail], index) => `
        <li class="tiger-pipeline-node tiger-pipeline-${escapeAttribute(tone)}">
          <details>
            <summary>
              <span class="tiger-pipeline-index">${String(index + 1).padStart(2, '0')}</span>
              <span class="tiger-pipeline-main">
                <span class="tiger-pipeline-role">${escapeHtml(role)}</span>
                <strong>${escapeHtml(title)}</strong>
                <em>${escapeHtml(sample)}</em>
              </span>
            </summary>
            <p>${escapeHtml(detail)}</p>
          </details>
        </li>`).join('');
  const legend = copy.legend.map(([label, detail], index) => `
        <div class="tiger-pipeline-legend-item tiger-pipeline-legend-${index + 1}">
          <dt><span aria-hidden="true"></span>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(detail)}</dd>
        </div>`).join('');
  return `<figure id="fig-tiger-semantic-id-flow" class="tiger-pipeline-figure">
    <div class="tiger-pipeline-surface" role="img" aria-label="${escapeAttribute(copy.aria)}">
      <div class="tiger-pipeline-heading">
        <span>${escapeHtml(copy.figure)}</span>
        <strong>${escapeHtml(copy.title)}</strong>
      </div>
      <ol class="tiger-pipeline-track">
${steps}
      </ol>
      <div class="tiger-pipeline-token-row" aria-hidden="true">
        <span class="tiger-token tiger-token-source">text</span>
        <span class="tiger-token-arrow">→</span>
        <span class="tiger-token tiger-token-vector">768d</span>
        <span class="tiger-token-arrow">→</span>
        <span class="tiger-token tiger-token-code">12</span>
        <span class="tiger-token tiger-token-code">24</span>
        <span class="tiger-token tiger-token-code">52</span>
        <span class="tiger-token-arrow">→</span>
        <span class="tiger-token tiger-token-output">item</span>
      </div>
      <dl class="tiger-pipeline-legend">
${legend}
      </dl>
    </div>
    <figcaption>${escapeHtml(copy.caption)}</figcaption>
  </figure>`;
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
      const externalAttrs = href.startsWith('#') ? '' : ' target="_blank" rel="noreferrer"';
      return stash(`<a href="${escapeAttribute(href)}"${externalAttrs}>${escapeHtml(label)}</a>`);
    });
  source = escapeHtml(source)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return source.replace(/\u0000(\d+)\u0000/g, (_, index) => placeholders[Number(index)] || '');
}

function isMarkdownBlockStart(line) {
  return /^```/.test(line)
    || /^::tiger-pipeline\s*$/.test(line.trim())
    || /^::tiger-rqvae-training\s*$/.test(line.trim())
    || /^::tiger-quantizers\s*$/.test(line.trim())
    || /^::tiger-generator-input\s*$/.test(line.trim())
    || /^::tiger-inference-loop\s*$/.test(line.trim())
    || /^::tiger-index-map\s*$/.test(line.trim())
    || /^::disclosure\[[^\]]+]\s*$/.test(line.trim())
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

    if (line.trim() === '::tiger-pipeline') {
      html.push(tigerPipelineFigureHtml(normalizeLang(draft?.lang || currentLang())));
      index += 1;
      continue;
    }

    if (line.trim() === '::tiger-rqvae-training') {
      html.push(tigerRqvaeTrainingFigureHtml(normalizeLang(draft?.lang || currentLang())));
      index += 1;
      continue;
    }

    if (line.trim() === '::tiger-quantizers') {
      html.push(tigerQuantizerAtlasFigureHtml(normalizeLang(draft?.lang || currentLang())));
      index += 1;
      continue;
    }

    if (line.trim() === '::tiger-generator-input') {
      html.push(tigerGeneratorInputFigureHtml(normalizeLang(draft?.lang || currentLang())));
      index += 1;
      continue;
    }

    if (line.trim() === '::tiger-inference-loop') {
      html.push(tigerInferenceLoopFigureHtml(normalizeLang(draft?.lang || currentLang())));
      index += 1;
      continue;
    }

    if (line.trim() === '::tiger-index-map') {
      html.push(tigerIndexMapFigureHtml(normalizeLang(draft?.lang || currentLang())));
      index += 1;
      continue;
    }

    const disclosure = /^::disclosure\[([^\]]+)]\s*$/.exec(line.trim());
    if (disclosure) {
      const body = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== '::') {
        body.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      html.push(`<details class="blog-disclosure" id="${escapeAttribute(slugify(disclosure[1]))}"><summary>${inlineMarkdown(disclosure[1], draft)}</summary><div class="blog-disclosure-body">${renderMarkdown(body.join('\n'), draft)}</div></details>`);
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

function renderPreviewMath() {
  if (!elements.preview || typeof window.renderMathInElement !== 'function') return;
  try {
    window.renderMathInElement(elements.preview, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      throwOnError: false,
      errorCallback: () => {}
    });
  } catch {
    // Keep the editor responsive even if an unfinished formula is temporarily invalid.
  }
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
  if (elements.preview) {
    const previewDraft = { ...activeDraft, lang: normalizeLang(data.lang || activeDraft.lang || currentLang()) };
    elements.preview.innerHTML = renderMarkdown(body, previewDraft);
    renderPreviewMath();
  }
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
