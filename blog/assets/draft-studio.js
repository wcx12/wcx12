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
