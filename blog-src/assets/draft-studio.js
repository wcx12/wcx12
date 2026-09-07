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
          ['semantic', 'Tokenization', 'Semantic ID sequence', '(12,24,52) -> ...', 'Historical items are rewritten as coding-token sequences using the item-to-Semantic-ID mapping.'],
          ['generate', 'Generator', 'Generative model', 'Transformer', 'The model predicts the next item as a sequence of semantic tokens.'],
          ['generate', 'Prediction', 'Generated semantic item', 'next Semantic ID', 'The output is not raw text; it is a generated Semantic ID tuple.'],
          ['semantic', 'Lookup', 'Resolve to item', 'Semantic ID -> candidate', 'The predicted Semantic ID is mapped back to a real item or candidate set.']
        ]
      }
    ],
    bridge: ['The shared contract', 'The item side supplies code indices and an ID-to-item mapping. The generator predicts individual coding tokens and resolves each completed sequence to an item.'],
    tokens: ['item text', 'embedding', 'RQ-VAE', 'Coding tokens + item mapping', 'history', 'Transformer', 'semantic item'],
    legend: [
      ['Item indexing', 'content -> embedding -> RQ-VAE -> Semantic ID'],
      ['Shared vocabulary', 'the generator can only produce valid semantic item tokens'],
      ['User generation', 'interaction history -> Transformer -> next Semantic ID'],
      ['Item lookup', 'generated Semantic ID resolves back to recommendable items']
    ],
    caption: 'Figure 1. Item text is converted into code-index sequences; user history conditions the generator, which predicts a complete Semantic ID token by token and resolves it to an item.'
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
          ['semantic', '转写', 'Semantic ID 序列', '(12,24,52) -> ...', '历史物品通过 Item ID 与 Semantic ID 的映射，转写成编码 token 序列。'],
          ['generate', '生成器', '生成模型', 'Transformer', '模型根据用户历史，按 token 顺序预测下一个语义物品。'],
          ['generate', '预测', '生成的语义 item', 'next Semantic ID', '模型输出的不是普通文本，而是一个可以映射回物品库的 Semantic ID。'],
          ['semantic', '映射', '回到真实物品', 'Semantic ID -> 候选物品', '最后再把生成出的 Semantic ID 解析为真实 item 或候选 item 集合。']
        ]
      }
    ],
    bridge: ['两条链路的连接点', '物品侧提供码字编号和 ID 到物品的映射；生成器逐个预测编码 token，再把完整编号序列解析回真实物品。'],
    tokens: ['item 文本', 'embedding', 'RQ-VAE', '编码 token 与物品映射', '用户历史', 'Transformer', '语义 item'],
    legend: [
      ['物品侧索引', '内容 -> embedding -> RQ-VAE -> Semantic ID'],
      ['共享词表', '生成器只能生成可解析的语义物品 token'],
      ['用户侧生成', '交互历史 -> Transformer -> 下一个 Semantic ID'],
      ['映射回物品', '生成出的 Semantic ID 需要解析成真实候选物品']
    ],
    caption: '图 1. 物品侧将文本编码为码字编号序列；生成器读取已编码的用户历史，逐个预测下一物品的 token，再通过完整 Semantic ID 映射回物品。'
  }
};

const tigerFlowFigureCopy = {
  en: {
    figure: 'Figure 1',
    title: 'TIGER: encode items, then generate their identifiers',
    aria: 'Two connected routes: item content becomes a sequence of code indices; the generator predicts those tokens from user history and resolves the full identifier to an item.',
    lanes: [
      {
        tone: 'item',
        badge: '01 Item language',
        title: 'Item content becomes a sequence of code indices',
        subtitle: 'Text metadata is encoded, then RQ-VAE discretizes the embedding into tokens the generator can produce.',
        direction: 'content -> codes',
        steps: [
          {
            tone: 'source',
            visual: 'item',
            title: 'Item content',
            sample: 'title / category / brand',
            detail: 'The item first appears as ordinary text metadata, not as an isolated atomic ID.'
          },
          {
            tone: 'model',
            visual: 'model',
            title: 'Encoder + RQ-VAE',
            sample: 'embedding -> quantization',
            detail: 'A text encoder produces the item embedding; RQ-VAE then compresses it into discrete residual codewords.'
          },
          {
            tone: 'semantic featured',
            visual: 'semantic',
            title: 'Code indices + item mapping',
            sample: '(12, 24, 52, 0) <-> item',
            detail: 'Each position is a separate coding token. Three quantization indices plus a collision suffix form a complete Semantic ID; the mapping resolves that sequence, not an individual token, to an item.'
          }
        ]
      },
      {
        tone: 'user',
        badge: '02 Next-token prediction',
        title: 'User history asks the model for the next semantic item',
        subtitle: 'The interaction sequence is rewritten as Semantic IDs, then a Transformer predicts the next ID.',
        direction: 'history -> item',
        steps: [
          {
            tone: 'history',
            visual: 'history',
            title: 'User history',
            sample: 'item A -> item B -> item C',
            detail: 'The recommendation context starts from the user interaction sequence.'
          },
          {
            tone: 'generate',
            visual: 'generator',
            title: 'Generative model',
            sample: 'Transformer over ID tokens',
            detail: 'The generator predicts one coding token at a time from its token vocabulary. A complete sequence identifies an item; a whole Semantic ID is not one token.'
          },
          {
            tone: 'output featured',
            visual: 'output',
            title: 'Recommended item',
            sample: 'next Semantic ID -> candidate',
            detail: 'The generated Semantic ID is mapped back to a concrete item or candidate set.'
          }
        ]
      }
    ],
    note: 'Coding token ≠ complete Semantic ID. RQ-VAE code vectors are 32d; the generator learns separate 128d token embeddings, with distinct tokens for different codebook levels.',
    caption: 'Figure 1. Item content supplies discrete code indices and the Semantic ID–item mapping. The generator reads encoded history, predicts the next item’s coding tokens, and resolves the completed ID to an item.'
  },
  zh: {
    figure: '图 1',
    title: 'TIGER：先为物品编码，再生成物品编号',
    aria: '两条相连的链路：物品内容变成码字编号序列；生成器根据用户历史逐个预测编码 token，完整编号再映射回物品。',
    lanes: [
      {
        tone: 'item',
        badge: '01 物品语言',
        title: '物品内容变成码字编号序列',
        subtitle: '文本信息先被编码成 embedding，再由 RQ-VAE 离散化为生成器可以输出的 token。',
        direction: 'content -> codes',
        steps: [
          {
            tone: 'source',
            visual: 'item',
            title: 'Item 文本信息',
            sample: '标题 / 类别 / 品牌',
            detail: '物品先以普通文本元信息出现，而不是一个彼此孤立的原子 ID。'
          },
          {
            tone: 'model',
            visual: 'model',
            title: 'Encoder + RQ-VAE',
            sample: 'embedding -> 量化',
            detail: '文本编码器得到内容向量；RQ-VAE 逐层选择码向量，其编号组成 Semantic ID。'
          },
          {
            tone: 'semantic featured',
            visual: 'semantic',
            title: '码字编号 + 物品映射',
            sample: '(12, 24, 52, 0) <-> item',
            detail: '每一位对应一个编码 token。三个量化编号加碰撞后缀组成完整 Semantic ID；映射表把这段序列而不是单个 token 对应到物品。'
          }
        ]
      },
      {
        tone: 'user',
        badge: '02 下一词预测',
        title: '用户历史驱动模型生成下一个语义 item',
        subtitle: '交互序列被转写成 Semantic ID 序列，Transformer 再预测下一个 ID。',
        direction: 'history -> item',
        steps: [
          {
            tone: 'history',
            visual: 'history',
            title: '用户交互历史',
            sample: 'item A -> item B -> item C',
            detail: '推荐上下文来自用户已经点击、购买或浏览过的物品序列。'
          },
          {
            tone: 'generate',
            visual: 'generator',
            title: '生成模型',
            sample: 'Transformer over ID tokens',
            detail: '模型从编码 token 词表中逐个预测下一位，拼成一个物品的完整 Semantic ID；不是一次生成一个代表整个物品的 token。'
          },
          {
            tone: 'output featured',
            visual: 'output',
            title: '推荐结果',
            sample: 'next Semantic ID -> 候选物品',
            detail: '生成出的 Semantic ID 最后会被解析成真实 item 或候选 item 集合。'
          }
        ]
      }
    ],
    note: '编码 token ≠ 完整 Semantic ID。RQ-VAE 的码向量是 32 维；生成器另行学习 128 维 token embedding，不同码本层的同号 token 彼此区分。',
    caption: '图 1. 物品侧建立码字编号及 Semantic ID 与物品的映射；生成器读取已编码的交互历史，逐个预测下一物品的编码 token，再将完整 ID 解析回物品。'
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
    encoderLayers: [
      ['$x$', '768'],
      ['$h_1$', '512'],
      ['$h_2$', '256'],
      ['$h_3$', '128'],
      ['$z$', '32']
    ],
    quantizer: 'Residual quantizer',
    quantizerNote: '3 codebooks × 256 vectors × 32 dimensions. Each row shows only slots 0–7 out of 256.',
    levels: [
      ['C0', 'choose nearest code for $r_0 = z$'],
      ['C1', 'quantize $r_1 = r_0 - e_{c_0}$'],
      ['C2', 'quantize $r_2 = r_1 - e_{c_1}$']
    ],
    decoder: 'DNN decoder',
    decoderNote: 'decodes $\\hat{z}$ back to the embedding space',
    output: 'reconstructed embedding',
    outputDetail: '$\\hat{x}$, 768d target space',
    loss: 'Training signal',
    lossItems: ['$L_{\\mathrm{recon}} = \\lVert x - \\hat{x}\\rVert_2^2$', '$L_{\\mathrm{rqvae}}$ aligns residuals and codewords', 'updates encoder, decoder and codebooks'],
    caption: 'Figure 2. The encoder maps a 768d item embedding to a 32d latent vector. Quantization produces two distinct outputs: code indices form the Semantic ID, while selected 32d vectors are summed and decoded for reconstruction. The backward strip illustrates straight-through estimation, not a derivative through discrete index selection.'
  },
  zh: {
    figure: '图 2',
    title: 'Semantic ID 分词训练阶段',
    aria: 'TIGER RQ-VAE 训练示意图：768 维 item embedding 经过 DNN encoder、残差量化器、DNN decoder 和重构损失。',
    input: 'item 内容 embedding',
    inputDetail: 'Sentence-T5，768 维',
    encoder: 'DNN encoder',
    encoderNote: '中间层使用 ReLU',
    encoderLayers: [
      ['$x$', '768'],
      ['$h_1$', '512'],
      ['$h_2$', '256'],
      ['$h_3$', '128'],
      ['$z$', '32']
    ],
    quantizer: 'Residual quantizer',
    quantizerNote: '3 层码本，每层 256 个 32 维码向量。每行 8 格仅示意编号 0–7，其余 248 格省略。',
    levels: [
      ['C0', '对 $r_0 = z$ 选最近 code'],
      ['C1', '量化 $r_1 = r_0 - e_{c_0}$'],
      ['C2', '量化 $r_2 = r_1 - e_{c_1}$']
    ],
    decoder: 'DNN decoder',
    decoderNote: '把 $\\hat{z}$ 解码回 embedding 空间',
    output: '重构 embedding',
    outputDetail: '$\\hat{x}$，目标空间 768 维',
    loss: '训练信号',
    lossItems: ['$L_{\\mathrm{recon}} = \\lVert x - \\hat{x}\\rVert_2^2$', '$L_{\\mathrm{rqvae}}$ 对齐 residual 与 codeword', '联合更新 encoder、decoder 和码本'],
    caption: '图 2. 编码器将 768 维物品表示映射到 32 维潜在向量。量化后分为两路：码字编号组成 Semantic ID，选中的 32 维码向量相加后送入解码器重构。底部展示直通估计的反向示意，不对离散的选码编号求导。'
  }
};

const tigerQuantizerAtlasCopy = {
  en: {
    figure: 'Figure 3',
    title: 'Different ID builders preserve different structure',
    aria: 'A visual comparison of Random ID, LSH, Product Quantization, Hierarchical k-means, VQ-VAE, and RQ-VAE for turning item embeddings into discrete identifiers.',
    methods: [
      {
        id: 'random',
        name: 'Random ID',
        label: 'control baseline',
        route: 'item -> sampled tokens',
        point: 'The item receives random codewords, so the ID has capacity but carries no content similarity.',
        takeaway: 'Tests whether content-aware identifiers help.',
        traits: ['no content', 'not learned', 'random tuple']
      },
      {
        id: 'lsh',
        name: 'LSH / SimHash',
        label: 'random projections',
        route: 'embedding -> hyperplane signs -> hash code',
        point: 'Random hyperplanes split the embedding space; nearby vectors are more likely to share bits, but the split is not learned for the data distribution.',
        takeaway: 'Fast and content based, but not optimized for reconstruction.',
        traits: ['content', 'fixed split', 'hash bits']
      },
      {
        id: 'pq',
        name: 'Product Quantization',
        label: 'subspace codes',
        route: 'vector slices -> separate codebooks',
        point: 'The vector dimensions are partitioned into subspaces, and each subspace is quantized independently.',
        takeaway: 'The subspace indices can also be generated as tokens; their structure is parallel, not residual.',
        traits: ['content', 'learned', 'subspace tuple']
      },
      {
        id: 'tree',
        name: 'Hierarchical k-means',
        label: 'tree path',
        route: 'root cluster -> child cluster -> leaf',
        point: 'The ID is a path in a clustering tree; early branch decisions constrain every later decision.',
        takeaway: 'Readable hierarchy, but early hard boundaries cannot be repaired downstream.',
        traits: ['content', 'clusters', 'path ID']
      },
      {
        id: 'vq',
        name: 'VQ-VAE',
        label: 'per-position quantization',
        route: 'encoder latent -> nearest codeword -> decoder',
        point: 'One latent position selects a learned codeword for reconstruction (e18 is a vector, not the integer 18). Multiple positions can yield multiple tokens.',
        takeaway: 'Quantizes each position once, rather than refining its residual across levels.',
        traits: ['content', 'learned', 'per position']
      },
      {
        id: 'rq',
        name: 'RQ-VAE',
        label: 'residual correction',
        route: 'latent -> code + residual -> next code',
        point: 'Each layer quantizes what the previous layer did not explain, so the final ID is a sequence of residual codewords.',
        takeaway: 'This is the method TIGER uses for its Semantic ID.',
        traits: ['content', 'learned', 'residual levels']
      }
    ],
    legend: [
      ['Content aware', 'uses item embedding rather than only random assignment'],
      ['Learned', 'code boundaries are trained from data'],
      ['Code structure', 'random tuple, hash bits, subspace tuple, tree path, positions, or residual levels']
    ],
    caption: 'Figure 3. Six ways to construct discrete IDs: random assignment, random projection, subspace quantization, clustering-tree paths, vector quantization, and residual quantization. They differ in their use of content, partitioning, and code structure.'
  },
  zh: {
    figure: '图 3',
    title: '不同 ID 构造方式保留的是不同结构',
    aria: 'Random ID、LSH、Product Quantization、Hierarchical k-means、VQ-VAE 和 RQ-VAE 将 item embedding 变成离散标识的可视化对比。',
    methods: [
      {
        id: 'random',
        name: 'Random ID',
        label: '随机基线',
        route: 'item -> 随机抽 token',
        point: '不看内容，直接给 item 分配随机编号。ID 有组合容量，但相似物品不一定共享任何 token。',
        takeaway: '用于检验内容相关编号是否有帮助。',
        traits: ['无内容', '不训练', '随机组合']
      },
      {
        id: 'lsh',
        name: 'LSH / SimHash',
        label: '随机投影',
        route: 'embedding -> 超平面正负号 -> hash code',
        point: '用随机超平面切分 embedding 空间；近邻向量更可能有相同 bit，但切分方式不是为当前数据分布学出来的。',
        takeaway: '快、基于内容，但不优化重构。',
        traits: ['内容', '固定切分', '哈希位']
      },
      {
        id: 'pq',
        name: 'Product Quantization',
        label: '子空间码',
        route: '向量切片 -> 各子空间单独量化',
        point: '先把向量维度切成几段，每段进入自己的码本，最后把几个子空间编号拼成一个 ID。',
        takeaway: '子空间编号同样可以作为生成 token；它们是并列分量，而不是逐层残差修正。',
        traits: ['内容', '学习码本', '子空间组合']
      },
      {
        id: 'tree',
        name: 'Hierarchical k-means',
        label: '树路径',
        route: '根簇 -> 子簇 -> 叶子簇',
        point: 'ID 是聚类树上的一条路径。第一层选错父簇后，后面只能在这个子树里继续细分。',
        takeaway: '层次直观，但早期硬边界很难被下层修正。',
        traits: ['内容', '聚类', '路径 ID']
      },
      {
        id: 'vq',
        name: 'VQ-VAE',
        label: '逐位置量化',
        route: 'encoder latent -> 最近 codeword -> decoder',
        point: '一个潜在位置选最近码向量参与重构；e18 是向量，不是整数编号 18。多个位置可分别量化，输出多个 token。',
        takeaway: '每个位置量化一次，不沿残差逐层细化。',
        traits: ['内容', '学习码本', '逐位置']
      },
      {
        id: 'rq',
        name: 'RQ-VAE',
        label: '残差修正',
        route: 'latent -> code + residual -> 下一层 code',
        point: '第一层近似潜在向量，后续层继续量化残差；各层选中码向量的编号组成 ID。',
        takeaway: '这是 TIGER 用来生成 Semantic ID 的方法。',
        traits: ['内容', '学习码本', '残差层']
      }
    ],
    legend: [
      ['是否看内容', '是否使用 item embedding，而不是只随机编号'],
      ['是否学习边界', '码本或划分是否由数据训练得到'],
      ['编码结构', '随机组合、哈希位、子空间组合、树路径、潜在位置或残差层']
    ],
    caption: '图 3. 六种离散 ID 构造方式：随机赋码、随机投影、子空间量化、聚类树路径、向量量化与残差量化。它们在内容利用、划分方式和编码结构上各有差异。'
  }
};

const tigerIndexMapCopy = {
  en: {
    figure: 'Figure 8',
    title: 'An index is a route from query to candidate address',
    aria: 'A comparison of how traditional vector retrieval and TIGER both map a user context to candidate item addresses.',
    rows: [
      ['external', 'Traditional vector retrieval', 'user history', 'query embedding', 'external ANN / MIPS index', 'Top-K item IDs', 'candidate list', 'The index is a visible search structure: it stores item vectors and returns nearby item addresses.'],
      ['tiger', 'TIGER generative retrieval', 'history as Semantic IDs', 'decoder prefixes', 'Transformer parameters', 'Semantic ID -> Item ID', 'mapping table', 'The model learns the route from history to Semantic ID; the mapping table resolves that generated address.']
    ],
    bridge: 'Same job, different mechanism: search a stored vector structure, or decode a likely Semantic ID.',
    caption: 'Figure 8. TIGER calls Transformer parameters an index because they generate candidate addresses, not because they replace every lookup table.'
  },
  zh: {
    figure: '图 8',
    title: '索引：从查询到候选地址的路径',
    aria: '传统向量检索和 TIGER 都把用户上下文映射到候选物品地址，但实现机制不同的双行对比图。',
    rows: [
      ['external', '传统向量检索', '用户历史', 'query embedding', '外部 ANN / MIPS 索引', 'Top-K Item ID', 'candidate list', '索引是看得见的搜索结构：保存 item embedding，查询时返回相近 item 的地址。'],
      ['tiger', 'TIGER 生成式检索', 'Semantic ID 历史', 'decoder 前缀', 'Transformer 参数', 'Semantic ID -> Item ID', 'mapping table', '模型学会从历史生成 Semantic ID；映射表仍然负责把这个生成地址解析回真实物品。']
    ],
    bridge: '两条路径做同一件事：把用户上下文变成候选地址；区别是查外部结构，还是解码一个语义 ID。',
    caption: '图 8. TIGER 把 Transformer 参数称为索引，是因为它生成候选地址；这不代表所有映射表都消失了。'
  }
};

const tigerInferenceBeamSteps = [
  [
    [['12'], 1, 0.60, true],
    [['87'], 1, 0.30, true],
    [['04'], 1, 0.10, false]
  ],
  [
    [['12', '24'], 0.60, 0.50, true],
    [['87', '08'], 0.30, 0.80, true],
    [['12', '09'], 0.60, 0.30, false],
    [['87', '03'], 0.30, 0.10, false]
  ],
  [
    [['12', '24', '52'], 0.30, 0.60, true],
    [['87', '08', '06'], 0.24, 0.50, true],
    [['87', '08', '19'], 0.24, 0.30, false],
    [['12', '24', '61'], 0.30, 0.20, false]
  ],
  [
    [['12', '24', '52', '0'], 0.18, 0.70, true],
    [['87', '08', '06', '0'], 0.12, 0.80, true],
    [['12', '24', '52', '1'], 0.18, 0.20, false],
    [['87', '08', '06', '1'], 0.12, 0.10, false]
  ]
];


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
  const t = (cn, en) => escapeHtml(lang === 'zh' ? cn : en);
  const encoderLayers = tigerRqvaeFunnelHtml(copy.encoderLayers, 'encoder');
  const codebooks = [
    tigerRqvaeCodebookHtml('$C_0$', 7, copy.levels[0][1], 0),
    tigerRqvaeCodebookHtml('$C_1$', 1, copy.levels[1][1], 1),
    tigerRqvaeCodebookHtml('$C_2$', 4, copy.levels[2][1], 2)
  ].join('');
  const losses = copy.lossItems.map((item) => `<li>${tigerRqvaeTextHtml(item)}</li>`).join('');
  return `<figure id="fig-tiger-rqvae-training" class="tiger-pipeline-figure tiger-rqvae-figure">
    <div class="tiger-pipeline-surface tiger-rqvae-surface" role="group" aria-label="${escapeHtml(copy.aria)}">
      <div class="tiger-pipeline-heading">
        <span>${escapeHtml(copy.figure)}</span>
        <strong>${escapeHtml(copy.title)}</strong>
      </div>
      <div class="tiger-rqvae-architecture tiger-rqvae-two-route">
        <div class="tiger-rqvae-encode-route">
        <section class="tiger-rqvae-vector tiger-rqvae-source">
          <span>${escapeHtml(copy.input)}</span>
          <strong>${tigerRqvaeTextHtml('$x$')}</strong>
          <em>${tigerRqvaeTextHtml(copy.inputDetail)}</em>
          <i aria-hidden="true"></i>
        </section>
        ${tigerRqvaeArrowHtml()}
        <section class="tiger-rqvae-module tiger-rqvae-encoder">
          <span>${escapeHtml(copy.encoder)}</span>
          <ol class="tiger-rqvae-funnel">
${encoderLayers}
          </ol>
          <em>${tigerRqvaeTextHtml(copy.encoderNote)}</em>
        </section>
        </div>
        ${tigerRqvaeArrowHtml()}
        <section class="tiger-rqvae-module tiger-rqvae-quantizer">
          <span>${escapeHtml(copy.quantizer)}</span>
          <ol class="tiger-rqvae-codebooks">
${codebooks}
          </ol>
          <em>${tigerRqvaeTextHtml(copy.quantizerNote)}</em>
        </section>
        <section class="tiger-rqvae-outputs" aria-label="${t('量化的两种输出', 'Two outputs from quantization')}">
          <div class="tiger-rqvae-id-route">
            <h4>${t('出口 A · 取编号，构成物品编码', 'Route A · indices form an identifier')}</h4>
            <div class="tiger-rqvae-semantic-id"><span>7</span><span>1</span><span>4</span></div>
            <p>${t('三个编号依次组成 Semantic ID 的前三位。碰撞后缀在后续补齐；整数编号不送进 DNN decoder。', 'The three indices form the quantized part of a Semantic ID. A collision suffix is added later; these integers are not the DNN decoder input.')}</p>
          </div>
          <div class="tiger-rqvae-vector-route">
            <h4>${t('出口 B · 取向量，相加后重构', 'Route B · sum selected vectors to reconstruct')}</h4>
            <div class="tiger-rqvae-sum">
              ${[0, 1, 2].map((level, i) => `<span class="tiger-rqvae-summand"><b>${tigerRqvaeTextHtml('$e_{c_' + level + '}$')}</b><small>${t('码本 ' + level + ' · 编号 ' + [7, 1, 4][i], 'Codebook ' + level + ' · slot ' + [7, 1, 4][i])}</small><i aria-hidden="true"></i><em>32d</em></span>`).join('<b class="tiger-rqvae-plus" aria-hidden="true">+</b>')}
              <b class="tiger-rqvae-plus" aria-hidden="true">=</b>
              <span class="tiger-rqvae-summand is-sum"><b>${tigerRqvaeTextHtml('$\\hat{z}$')}</b><small>${t('量化向量', 'Quantized vector')}</small><i aria-hidden="true"></i><em>32d</em></span>
            </div>
            <div class="tiger-rqvae-decode-route">
              <span>${tigerRqvaeTextHtml('$\\hat{z}$')} · 32d</span>
              <b aria-hidden="true">→</b>
              <div class="tiger-rqvae-decoder"><strong>${escapeHtml(copy.decoder)}</strong><small>${t('连续向量变换', 'Continuous vector transform')}</small></div>
              <b aria-hidden="true">→</b>
              <span>${tigerRqvaeTextHtml('$\\hat{x}$')} · 768d</span>
            </div>
          </div>
        </section>
      </div>
      <div class="tiger-rqvae-loss-loop">
        <span>${escapeHtml(copy.loss)}</span>
        <ol>
${losses}
        </ol>
      </div>
      <div class="tiger-rqvae-backward">
        <strong>${t('重构梯度 · 直通估计示意', 'Reconstruction gradient · straight-through illustration')}</strong>
        <div class="tiger-rqvae-gradient-route">${['$L_{\\mathrm{recon}}$', 'decoder', '$\\hat{z}$', 'STE', '$z$', 'encoder'].map(label => `<span>${tigerRqvaeTextHtml(label)}</span>`).join('<b aria-hidden="true">→</b>')}</div>
        <p>${t('前向仍使用选中码向量的和；反向把量化输出对 z 的局部导数近似为恒等映射，让重构梯度传回编码器，而不是对 argmin 求导。码本另有量化损失的训练信号。', 'The forward value is still the sum of selected code vectors. Backward, approximate the local derivative to z by the identity so reconstruction gradients reach the encoder; this does not differentiate argmin. Quantization losses provide additional codebook training signals.')}</p>
      </div>
    </div>
    <figcaption>${escapeHtml(copy.caption)}</figcaption>
  </figure>`;
}

function tigerQuantizerSvgHtml(id, body) {
  return `<div class="tiger-quantizer-visual tiger-quantizer-visual-${escapeAttribute(id)}" aria-hidden="true"><svg class="tiger-q-svg tiger-q-svg-${escapeAttribute(id)}" viewBox="0 0 280 156" focusable="false"><defs><marker id="tiger-q-arrow-${escapeAttribute(id)}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="tiger-q-marker" d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>${body}</svg></div>`;
}

function tigerQuantizerVisualHtml(id) {
  if (id === 'random') {
    return tigerQuantizerSvgHtml(id, `
        <rect class="tiger-q-box" x="16" y="28" width="60" height="44" rx="10"></rect>
        <text class="tiger-q-label" x="46" y="55">item</text>
        <path class="tiger-q-arrow" d="M 82 50 H 110" marker-end="url(#tiger-q-arrow-random)"></path>
        <rect class="tiger-q-box tiger-q-active-fill" x="116" y="18" width="58" height="64" rx="12"></rect>
        <circle class="tiger-q-dot" cx="133" cy="37" r="3"></circle>
        <circle class="tiger-q-dot" cx="156" cy="37" r="3"></circle>
        <circle class="tiger-q-dot" cx="145" cy="51" r="3"></circle>
        <circle class="tiger-q-dot" cx="133" cy="65" r="3"></circle>
        <circle class="tiger-q-dot" cx="156" cy="65" r="3"></circle>
        <text class="tiger-q-caption" x="145" y="101">ignore content</text>
        <path class="tiger-q-arrow" d="M 180 50 H 206" marker-end="url(#tiger-q-arrow-random)"></path>
        <g class="tiger-q-token-row">
          <rect x="210" y="25" width="28" height="26" rx="7"></rect>
          <rect x="242" y="25" width="28" height="26" rx="7"></rect>
          <rect x="210" y="57" width="28" height="26" rx="7"></rect>
          <rect x="242" y="57" width="28" height="26" rx="7"></rect>
          <text x="224" y="42">07</text>
          <text x="256" y="42">188</text>
          <text x="224" y="74">42</text>
          <text x="256" y="74">251</text>
        </g>
        <text class="tiger-q-caption" x="240" y="123">sampled ID</text>`);
  }
  if (id === 'lsh') {
    return tigerQuantizerSvgHtml(id, `
        <rect class="tiger-q-plot" x="18" y="18" width="122" height="96" rx="12"></rect>
        <path class="tiger-q-line" d="M 34 92 L 126 30"></path>
        <path class="tiger-q-line" d="M 32 38 L 128 96"></path>
        <path class="tiger-q-line tiger-q-muted-stroke" d="M 74 22 L 96 110"></path>
        <circle class="tiger-q-point" cx="84" cy="68" r="6"></circle>
        <text class="tiger-q-caption" x="79" y="132">hyperplane signs</text>
        <path class="tiger-q-arrow" d="M 148 66 H 176" marker-end="url(#tiger-q-arrow-lsh)"></path>
        <g class="tiger-q-token-row tiger-q-bit-row">
          <rect x="182" y="34" width="26" height="28" rx="7"></rect>
          <rect x="214" y="34" width="26" height="28" rx="7"></rect>
          <rect x="246" y="34" width="26" height="28" rx="7"></rect>
          <rect x="198" y="72" width="26" height="28" rx="7"></rect>
          <text x="195" y="52">1</text>
          <text x="227" y="52">0</text>
          <text x="259" y="52">1</text>
          <text x="211" y="90">1</text>
        </g>
        <text class="tiger-q-caption" x="226" y="123">hash code</text>`);
  }
  if (id === 'pq') {
    return tigerQuantizerSvgHtml(id, `
        <text class="tiger-q-caption" x="140" y="16">split embedding dimensions</text>
        <g class="tiger-q-vector-bar">
          <rect x="24" y="28" width="232" height="28" rx="8"></rect>
          <path d="M 101 28 V 56"></path>
          <path d="M 179 28 V 56"></path>
          <text x="63" y="47">z1</text>
          <text x="140" y="47">z2</text>
          <text x="218" y="47">z3</text>
        </g>
        <path class="tiger-q-arrow" d="M 63 62 V 78" marker-end="url(#tiger-q-arrow-pq)"></path>
        <path class="tiger-q-arrow" d="M 140 62 V 78" marker-end="url(#tiger-q-arrow-pq)"></path>
        <path class="tiger-q-arrow" d="M 218 62 V 78" marker-end="url(#tiger-q-arrow-pq)"></path>
        <g class="tiger-q-codebooks">
          <rect x="37" y="84" width="52" height="34" rx="8"></rect>
          <rect x="114" y="84" width="52" height="34" rx="8"></rect>
          <rect x="192" y="84" width="52" height="34" rx="8"></rect>
          <text x="63" y="105">C1</text>
          <text x="140" y="105">C2</text>
          <text x="218" y="105">C3</text>
        </g>
        <g class="tiger-q-token-row tiger-q-output-row">
          <rect x="45" y="128" width="36" height="22" rx="6"></rect>
          <rect x="122" y="128" width="36" height="22" rx="6"></rect>
          <rect x="200" y="128" width="36" height="22" rx="6"></rect>
          <text x="63" y="143">A7</text>
          <text x="140" y="143">B3</text>
          <text x="218" y="143">C9</text>
        </g>`);
  }
  if (id === 'tree') {
    return tigerQuantizerSvgHtml(id, `
        <rect class="tiger-q-box tiger-q-active-fill" x="106" y="12" width="68" height="30" rx="8"></rect>
        <text class="tiger-q-label" x="140" y="32">root</text>
        <path class="tiger-q-arrow tiger-q-active-stroke" d="M 128 44 L 76 66" marker-end="url(#tiger-q-arrow-tree)"></path>
        <path class="tiger-q-line" d="M 152 44 L 204 66"></path>
        <rect class="tiger-q-box tiger-q-active-fill" x="48" y="70" width="56" height="30" rx="8"></rect>
        <rect class="tiger-q-box" x="176" y="70" width="56" height="30" rx="8"></rect>
        <text class="tiger-q-label" x="76" y="90">A</text>
        <text class="tiger-q-label" x="204" y="90">B</text>
        <path class="tiger-q-arrow tiger-q-active-stroke" d="M 68 102 L 47 122" marker-end="url(#tiger-q-arrow-tree)"></path>
        <path class="tiger-q-line" d="M 86 102 L 109 122"></path>
        <rect class="tiger-q-box tiger-q-active-fill" x="22" y="124" width="48" height="26" rx="7"></rect>
        <rect class="tiger-q-box" x="88" y="124" width="48" height="26" rx="7"></rect>
        <rect class="tiger-q-box" x="176" y="124" width="48" height="26" rx="7"></rect>
        <text class="tiger-q-label" x="46" y="141">A2</text>
        <text class="tiger-q-label" x="112" y="141">A5</text>
        <text class="tiger-q-label" x="200" y="141">B4</text>`);
  }
  if (id === 'vq') {
    return tigerQuantizerSvgHtml(id, `
        <rect class="tiger-q-box" x="16" y="26" width="38" height="32" rx="8"></rect>
        <text class="tiger-q-label" x="35" y="47">x</text>
        <path class="tiger-q-arrow" d="M 60 42 H 78" marker-end="url(#tiger-q-arrow-vq)"></path>
        <rect class="tiger-q-box" x="84" y="26" width="38" height="32" rx="8"></rect>
        <text class="tiger-q-label" x="103" y="47">E</text>
        <path class="tiger-q-arrow" d="M 128 42 H 146" marker-end="url(#tiger-q-arrow-vq)"></path>
        <rect class="tiger-q-box tiger-q-active-fill" x="152" y="26" width="38" height="32" rx="8"></rect>
        <text class="tiger-q-label" x="171" y="47">z</text>
        <path class="tiger-q-arrow" d="M 196 42 H 210" marker-end="url(#tiger-q-arrow-vq)"></path>
        <rect class="tiger-q-plot" x="216" y="16" width="50" height="54" rx="12"></rect>
        <circle class="tiger-q-code-dot" cx="229" cy="35" r="4.5"></circle>
        <circle class="tiger-q-code-dot tiger-q-active-dot" cx="242" cy="51" r="5.5"></circle>
        <circle class="tiger-q-code-dot" cx="253" cy="31" r="4.5"></circle>
        <text class="tiger-q-caption" x="241" y="83">nearest</text>
        <path class="tiger-q-arrow" d="M 242 74 V 98" marker-end="url(#tiger-q-arrow-vq)"></path>
        <g class="tiger-q-token-row">
          <rect x="178" y="106" width="58" height="28" rx="7"></rect>
          <text x="207" y="124">e18</text>
        </g>
        <path class="tiger-q-arrow" d="M 240 120 H 252" marker-end="url(#tiger-q-arrow-vq)"></path>
        <rect class="tiger-q-box" x="258" y="104" width="22" height="32" rx="8"></rect>
        <text class="tiger-q-label" x="269" y="125">D</text>`);
  }
  return tigerQuantizerSvgHtml(id, `
        <text class="tiger-q-caption" x="142" y="18">quantize the remaining residual</text>
        <rect class="tiger-q-residual-bar tiger-q-residual-bar-1" x="32" y="32" width="150" height="18" rx="9"></rect>
        <text class="tiger-q-label" x="20" y="47">z</text>
        <rect class="tiger-q-code-chip" x="202" y="26" width="42" height="28" rx="8"></rect>
        <text class="tiger-q-label" x="223" y="45">c0</text>
        <path class="tiger-q-arrow" d="M 184 41 H 196" marker-end="url(#tiger-q-arrow-rq)"></path>
        <path class="tiger-q-arrow tiger-q-muted-stroke" d="M 108 55 V 70" marker-end="url(#tiger-q-arrow-rq)"></path>
        <rect class="tiger-q-residual-bar tiger-q-residual-bar-2" x="54" y="76" width="112" height="18" rx="9"></rect>
        <text class="tiger-q-label" x="36" y="91">r1</text>
        <rect class="tiger-q-code-chip" x="186" y="70" width="42" height="28" rx="8"></rect>
        <text class="tiger-q-label" x="207" y="89">c1</text>
        <path class="tiger-q-arrow" d="M 168 85 H 180" marker-end="url(#tiger-q-arrow-rq)"></path>
        <path class="tiger-q-arrow tiger-q-muted-stroke" d="M 110 99 V 114" marker-end="url(#tiger-q-arrow-rq)"></path>
        <rect class="tiger-q-residual-bar tiger-q-residual-bar-3" x="74" y="120" width="76" height="18" rx="9"></rect>
        <text class="tiger-q-label" x="56" y="135">r2</text>
        <rect class="tiger-q-code-chip" x="166" y="114" width="42" height="28" rx="8"></rect>
        <text class="tiger-q-label" x="187" y="133">c2</text>
        <g class="tiger-q-token-row tiger-q-rq-output">
          <rect x="218" y="116" width="18" height="22" rx="5"></rect>
          <rect x="240" y="116" width="18" height="22" rx="5"></rect>
          <rect x="262" y="116" width="18" height="22" rx="5"></rect>
          <text x="227" y="131">12</text>
          <text x="249" y="131">24</text>
          <text x="271" y="131">52</text>
        </g>`);
}

function tigerQuantizerAtlasFigureHtml(lang = 'en') {
  const copy = tigerQuantizerAtlasCopy[lang === 'zh' ? 'zh' : 'en'];
  const methods = copy.methods.map((method) => {
    const traits = method.traits.map((trait) => `<li>${escapeHtml(trait)}</li>`).join('');
    return `
        <section class="tiger-quantizer-method tiger-quantizer-${escapeHtml(method.id)}">
          ${tigerQuantizerVisualHtml(method.id)}
          <div class="tiger-quantizer-copy">
            <h3>${escapeHtml(method.name)}</h3>
            <p>${escapeHtml(method.point)}</p>
            <ul class="tiger-quantizer-traits">${traits}</ul>
            <strong>${escapeHtml(method.takeaway)}</strong>
          </div>
        </section>`;
  }).join('');
  const axes = copy.legend.map(([label, detail]) => `
        <div>
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(detail)}</dd>
        </div>`).join('');
  return `<figure id="fig-tiger-quantizer-atlas" class="tiger-pipeline-figure tiger-quantizer-figure">
    <div class="tiger-pipeline-surface tiger-quantizer-surface" role="group" aria-label="${escapeHtml(copy.aria)}">
      <div class="tiger-pipeline-heading">
        <span>${escapeHtml(copy.figure)}</span>
        <strong>${escapeHtml(copy.title)}</strong>
      </div>
      <dl class="tiger-quantizer-axis">
${axes}
      </dl>
      <div class="tiger-quantizer-grid">
${methods}
      </div>
    </div>
    <figcaption>${escapeHtml(copy.caption)}</figcaption>
  </figure>`;
}

function tigerInferenceTokenSequenceHtml(tokens) {
  return `<span class="tiger-inference-token-sequence">${tokens.map((token) => `<i>${escapeHtml(token)}</i>`).join('')}</span>`;
}





function tigerInferenceLoopFigureHtml(lang = 'en') {
  const zh = lang === 'zh';
  const t = (cn, en) => escapeHtml(zh ? cn : en);
  const score = value => value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  const rounds = tigerInferenceBeamSteps.map((rows, step) => {
    const candidates = rows.map(([prefix, parent, probability, retained]) =>
      '<li class="tiger-beam-candidate ' + (retained ? 'is-kept' : 'is-pruned') + '">' +
        tigerInferenceTokenSequenceHtml(prefix) +
        '<span class="tiger-beam-equation">' + score(parent) + ' × ' + score(probability) + ' = <b>' + score(parent * probability) + '</b></span>' +
        '<span class="tiger-beam-status">' + t(retained ? '保留' : '淘汰', retained ? 'Keep' : 'Prune') + '</span>' +
      '</li>'
    ).join('');
    const survivorNames = rows.filter(row => row[3]).map(row => '(' + row[0].join(', ') + ')').join(' / ');
    return '<section class="tiger-beam-round"><header><b>' + t('第 ' + (step + 1) + ' 轮', 'Step ' + (step + 1)) +
      '</b><span>' + t(step === 3 ? '生成碰撞后缀' : '生成第 ' + (step + 1) + ' 位量化 token', step === 3 ? 'Generate collision suffix' : 'Generate quantization token ' + (step + 1)) +
      '</span></header><ol>' + candidates + '</ol>' +
      (step < 3 ? '<p class="tiger-beam-feedback"><span aria-hidden="true">↳</span><b>Decoder</b><span>' +
        t('保留的两个前缀分别反馈，重新预测下一位：', 'Feed back both retained prefixes separately and predict the next token: ') +
        '<code>' + escapeHtml(survivorNames) + '</code></span></p>' : '') + '</section>';
  }).join('');
  const items = tigerInferenceBeamSteps[3].filter(row => row[3]).map(([prefix, parent, probability], rank) =>
    '<li><b>#' + (rank + 1) + '</b>' + tigerInferenceTokenSequenceHtml(prefix) +
      '<span class="tiger-beam-item-score">P = ' + score(parent * probability) + '</span><span aria-hidden="true">→</span>' +
      '<strong>Item ' + [831, 1620][rank] + '</strong></li>'
  ).join('');
  return '<figure id="fig-tiger-inference-loop" class="tiger-pipeline-figure tiger-inference-figure">' +
    '<div class="tiger-pipeline-surface tiger-beam-surface" role="group" aria-label="' +
      t('Beam search 宽度为 2 的四轮教学示例，包含累计概率、候选淘汰、前缀反馈与物品映射', 'Four-step beam search with width 2: cumulative probabilities, pruning, prefix feedback and item lookup') + '">' +
      '<div class="tiger-pipeline-heading"><span>' + t('图 5', 'Figure 5') + '</span><strong>' +
        t('Beam search：两条候选如何走到两个物品', 'Beam search: two competing paths become two items') + '</strong></div>' +
      '<p class="tiger-beam-scope">' + t('教学示例，非原文实验结果。B = 2，最终取 K = 2；仅展示部分候选，省略起止符。未显示的单条扩展均低于当轮保留阈值。', 'Teaching example, not paper results. B = 2 and K = 2. Only some candidates are shown; start/end symbols are omitted. Each omitted expansion scores below that round’s retention threshold.') + '</p>' +
      '<div class="tiger-beam-start"><span>' + t('用户 token + 历史 Semantic ID', 'User token + history Semantic IDs') +
        '</span><b aria-hidden="true">→</b><strong>Encoder · H</strong><b aria-hidden="true">→</b><strong>Decoder</strong></div>' +
      '<p class="tiger-beam-rule">' + t('每轮：前缀累计概率 × 下一 token 的条件概率 → 合并所有扩展 → 只保留最高的 2 条。每次 decoder 都读取同一个历史上下文 H。', 'Each round: prefix probability × next-token conditional probability → pool all extensions → keep the best 2. Every decoder call reads the same history context H.') + '</p>' +
      '<div class="tiger-beam-rounds">' + rounds + '</div>' +
      '<section class="tiger-beam-results"><h4>' + t('查映射表：完整的四位 ID → 真实物品', 'Lookup: complete four-token ID → real item') +
        '</h4><ol>' + items + '</ol></section>' +
      '<p class="tiger-flow-note">' + t('评分比较的是整条路径，不是最后一个 token：第二轮 0.6 × 0.5 = 0.3，仍高于 0.3 × 0.8 = 0.24。本例等长候选直接比较概率乘积；实际计算通常累加对数概率。', 'Compare whole paths, not the last token: in step 2, 0.6 × 0.5 = 0.3 still exceeds 0.3 × 0.8 = 0.24. Equal-length candidates use probability products here; implementations usually sum log probabilities.') + '</p>' +
    '</div><figcaption>' + t('图 5. 固定历史上下文后，两条候选前缀并行扩展、竞争和反馈；四轮后留下两个完整 Semantic ID，分别映射到 Item 831 和 Item 1620。编号与概率均为教学示例，末位为碰撞后缀。', 'Figure 5. With history fixed, two prefixes expand, compete and feed back into the decoder. After four rounds, two complete Semantic IDs resolve to Item 831 and Item 1620. IDs and probabilities are illustrative; the final token is the collision suffix.') + '</figcaption></figure>';
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
      '<div class="tiger-pipeline-heading"><span>' + t('图 4', 'Figure 4') + '</span><strong>' + t('用一段交互历史，学习下一个物品', 'Learn the next item from interaction history') + '</strong></div>' +
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
    '</div><figcaption>' + t('图 4. TIGER 生成器的训练数据流。先编码用户 token 与历史 Semantic ID，再用右移的正确答案监督下一个物品的 token 预测。p(dᵢ) 表示模型分配给该位置真实 token 的概率，完整分布覆盖词表；起止符号为序列对齐示意。RQ-VAE 已在上一阶段训练完成，推理时的自回归反馈见图 5。', 'Figure 4. TIGER generator training. Encode the user token and history Semantic IDs, then supervise next-item prediction using shifted ground-truth tokens. p(dᵢ) denotes the probability assigned to the true token within the vocabulary distribution. Start/end symbols illustrate alignment. RQ-VAE is already trained; Figure 5 shows autoregressive inference.') + '</figcaption></figure>';
}

function tigerPipelineFigureHtml(lang = 'en') {
  const copy = tigerFlowFigureCopy[lang === 'zh' ? 'zh' : 'en'];
  const lanes = copy.lanes.map((lane) => {
    const steps = lane.steps.map((step) => `
          <li class="tiger-flow-step tiger-flow-${escapeHtml(step.tone)}">
            <details class="tiger-flow-card">
              <summary>
                ${tigerFlowGlyphHtml(step.visual)}
                <span class="tiger-flow-copy">
                  <strong>${escapeHtml(step.title)}</strong>
                  <em>${escapeHtml(step.sample)}</em>
                </span>
              </summary>
              <p>${escapeHtml(step.detail)}</p>
            </details>
          </li>`).join('');
    return `
        <section class="tiger-flow-lane tiger-flow-lane-${escapeHtml(lane.tone)}" aria-label="${escapeHtml(lane.title)}">
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
    <div class="tiger-pipeline-surface" role="group" aria-label="${escapeHtml(copy.aria)}">
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
    || /^::figure\[fig-[a-z0-9-]+]\[[^\]]+]\s*$/.test(line.trim())
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

    const figure = /^::figure\[(fig-[a-z0-9-]+)]\[([^\]]+)]\s*$/.exec(line.trim());
    if (figure) {
      const end = lines.findIndex((value, at) => at > index && value.trim() === '::');
      if (end !== -1) {
        const body = lines.slice(index + 1, end).join('\n');
        const panels = body.split(/\n---\n/).map(panel => `<div class="blog-paper-panel">${renderMarkdown(panel, draft)}</div>`).join('');
        html.push(`<figure id="${escapeAttribute(figure[1])}" class="blog-paper-figure"><div class="blog-paper-figure-body">${panels}</div><figcaption>${escapeHtml(figure[2])}</figcaption></figure>`);
        index = end + 1;
        continue;
      }
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
