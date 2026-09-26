const version = new URL(import.meta.url).search;
const { PrivateNotesClient, toPublicMarkdown } = await import(`./private-notes-api.js${version}`);
const { renderNoteDiagram } = await import(`./draft-studio.js${version}`);

const translations = {
  en: {
    kicker: 'Owner workspace', title: 'Private notes', subtitle: 'Private by default. Publish a separate public version when ready.',
    connectTitle: 'Connect private repository', token: 'GitHub fine-grained token', connect: 'Connect', connected: 'Connected as wcx12',
    lock: 'Lock workspace', accessHelp: 'Access and privacy',
    tokenHelp: 'Select wcx12-private-notes with Contents: Read and write. Also select wcx12 to publish or withdraw public articles. The token stays in memory until this page closes or locks.',
    privateHelp: 'Saving writes only to the private repository. A draft is a writing status, not a visibility setting. GitHub and anyone you grant repository access to can read these notes.',
    historyHelp: 'Withdrawing removes the article from the website after deployment, not from Git history, cached pages or copies. Existing public attachments remain public.',
    createToken: 'Create a token on GitHub', locked: 'Locked. No private content has been loaded.',
    note: 'Private note', new: 'New note', reload: 'Reload', save: 'Save privately', importTitle: 'Manage an existing public article',
    import: 'Load private working copy', importHint: 'Importing does not hide the public article. Save the working copy, then use Withdraw to remove the public page. Language versions are managed separately.',
    viewPublic: 'View public page', fieldTitle: 'Title', description: 'Description', slug: 'Public URL slug', language: 'Article language',
    writingStatus: 'Writing status', draft: 'Draft', complete: 'Complete', category: 'Category', date: 'Article date',
    tags: 'Tags (comma-separated)', preview: 'Preview', publish: 'Publish public version', withdraw: 'Withdraw public version',
    deployment: 'Deployment status', empty: 'No private notes yet.', understand: 'I understand and confirm this action.',
    cancel: 'Cancel', confirm: 'Confirm', busy: 'Working...', saved: 'Saved to the private repository. The public website was not changed.',
    unsaved: 'Unsaved changes', clean: 'Private copy saved', private: 'Only in private repository',
    public: 'Private working copy + public version', withdrawn: 'Withdrawn; previous public copies may remain', unknown: 'Public version not checked',
    newTitle: 'Untitled note', discard: 'Discard unsaved changes?', imported: 'Working copy loaded. Save privately before withdrawing the public page.',
    published: 'Public version committed. Deployment is pending; check deployment status.',
    publishedUnlinked: 'The article is now in the public repository, but its private publication record could not be saved. Save privately again before leaving. Check deployment status separately.',
    removed: 'Withdrawal committed. The page disappears after a successful deployment. Git history and public attachments remain.',
    publishTitle: 'Publish this version publicly?',
    publishMessage: 'This sends the title, metadata and the entire article below to the PUBLIC wcx12 repository. Anyone can read or copy it, and Git history can retain it permanently. Your unpublished edits stay private until you publish again.',
    withdrawTitle: 'Withdraw the public page?',
    withdrawMessage: 'A private working copy will be saved first. The public Markdown is then removed from the current branch. Deployment removes the page, but history, existing attachments, search caches and copies are not erased. Other language versions remain public unless separately withdrawn.',
    collision: 'This URL already belongs to a public article. Import that article or choose a different slug.',
    saveFirst: 'The current version must be saved privately before publishing.', noSource: 'The public source could not be located.',
    unavailable: 'Could not complete the request. Your text remains in this page; retry or copy it before closing.',
    conflict: 'The remote version has changed. Nothing was overwritten. Copy your edits before reloading.',
    access: 'GitHub access denied. Check token expiry, selected repositories and Contents: Read and write.',
    privacy: 'Access stopped because the notes repository is not private or the account is not wcx12.',
    validation: 'Check the title, slug, dates and comma-separated lowercase tags. Public articles also need a description and body.',
    blockedImage: 'Image not loaded in private preview',
    noPublic: 'No public articles', lockWarning: 'Lock and discard unsaved changes?',
    publicError: 'Private workspace connected; public article management is unavailable with this token.',
    frame: 'Open this workspace directly in a browser tab.', markdownError: 'Preview unavailable for this Markdown.',
    idle: 'Workspace locked after inactivity.',
    idleUnsaved: 'Unsaved changes remain in memory. Save or lock the workspace before leaving.',
    attachments: 'New public versions cannot include unpublished local attachments yet. Remove the image reference or publish the attachment separately after reviewing its visibility.'
  },
  zh: {
    kicker: '站主工作区', title: '私密笔记', subtitle: '默认仅自己可见，准备好后再发布独立的公开版本。',
    connectTitle: '连接私有仓库', token: 'GitHub fine-grained token', connect: '连接', connected: '已连接：wcx12',
    lock: '锁定工作区', accessHelp: '授权与隐私',
    tokenHelp: '令牌选择 wcx12-private-notes 仓库，Contents 权限设为 Read and write。需要发布或撤下文章时，再选择 wcx12 仓库。令牌只保留在当前页面内存中，关闭或锁定后清除。',
    privateHelp: '保存只写入私有仓库。草稿是写作进度，不是公开权限。GitHub 以及你授权访问私有仓库的人仍可以读取这些笔记。',
    historyHelp: '撤下会在部署后移除网页，不会抹除 Git 历史、缓存或他人的副本。已有的公开附件仍然公开。',
    createToken: '在 GitHub 创建令牌', locked: '工作区已锁定，未加载任何私密内容。',
    note: '私密笔记', new: '新建笔记', reload: '重新加载', save: '保存至私有仓库', importTitle: '管理已有的公开文章',
    import: '载入私密工作副本', importHint: '载入副本不会隐藏公开文章。先保存私密副本，再使用“撤下公开版本”移除网页。中英文版本分别管理。',
    viewPublic: '查看公开页面', fieldTitle: '标题', description: '摘要', slug: '公开链接标识', language: '文章语言',
    writingStatus: '写作进度', draft: '草稿', complete: '已完成', category: '分类', date: '文章日期',
    tags: '标签（英文逗号分隔）', preview: '阅读预览', publish: '发布公开版本', withdraw: '撤下公开版本',
    deployment: '部署状态', empty: '还没有私密笔记。', understand: '我理解以上影响，并确认此操作。',
    cancel: '取消', confirm: '确认', busy: '正在处理…', saved: '已保存到私有仓库，公开网站没有改变。',
    unsaved: '有未保存的修改', clean: '私密副本已保存', private: '仅存于私有仓库',
    public: '私密工作副本 + 已有公开版本', withdrawn: '已撤下，历史公开副本仍可能存在', unknown: '尚未确认公开版本状态',
    newTitle: '未命名笔记', discard: '放弃尚未保存的修改吗？', imported: '已载入工作副本。撤下公开文章前，请先保存私密副本。',
    published: '公开版本已提交，正在等待部署。请查看部署状态。',
    publishedUnlinked: '文章已写入公开仓库，但私密副本中的发布记录未能保存。离开前请重试“保存至私有仓库”，并单独检查部署状态。',
    removed: '撤下操作已提交。部署成功后网页会移除，Git 历史及已有公开附件仍保留。',
    publishTitle: '确认公开这个版本？',
    publishMessage: '文章标题、元数据和当前正文将写入公开的 wcx12 仓库，任何人都可以阅读和复制，Git 历史可能永久保留。之后对私密副本的修改不会自动同步公开，需再次发布。',
    withdrawTitle: '撤下公开页面？',
    withdrawMessage: '先保存私密工作副本，再删除公开仓库当前分支中的正文。部署完成后网页移除，但历史记录、已有附件、搜索缓存及他人副本不会消失。其它语言版本仍保持公开，需要分别撤下。',
    collision: '这个链接标识已被公开文章使用。请载入那篇文章，或更换标识。',
    saveFirst: '请先将当前版本保存到私有仓库，再发布。', noSource: '未能找到对应的公开源文件。',
    unavailable: '操作未完成，正文仍在当前页面中。请重试，或在关闭前自行备份。',
    conflict: '远程版本已有修改，本次没有覆盖。请先备份当前编辑内容，再重新加载。',
    access: 'GitHub 拒绝访问。请检查令牌有效期、所选仓库及 Contents: Read and write 权限。',
    privacy: '私有仓库状态或账号身份不符合要求，已停止访问。',
    validation: '请检查标题、链接标识、日期和英文小写标签。公开文章还需要摘要和正文。',
    blockedImage: '私密预览未加载此图片',
    noPublic: '没有公开文章', lockWarning: '锁定工作区并放弃未保存的修改吗？',
    publicError: '私密工作区已连接，但当前令牌无法管理公开文章。',
    frame: '请在浏览器独立标签页直接打开工作区。', markdownError: '暂时无法预览这段 Markdown。',
    idle: '工作区因长时间无操作已锁定。',
    idleUnsaved: '尚有未保存的内容，已暂缓自动锁定以免丢失。离开前请保存或手动锁定。',
    attachments: '新文章暂不支持发布未上传的本地附件。请先移除图片引用，或确认附件可公开后单独上传。'
  }
};
const $ = id => document.getElementById(id);
const fields = { title: $('noteTitle'), description: $('noteDescription'), slug: $('noteSlug'), lang: $('noteLang'),
  status: $('noteWritingStatus'), category: $('noteCategory'), date: $('noteDate'), tags: $('noteTags'), body: $('noteBody') };
let client = null, records = [], active = null, publicState, publicPosts = [], publicSources = [];
let busy = false, dirty = false, epoch = 0, idleTimer, previewTimer, confirmedAction = null;
const lang = () => document.documentElement.dataset.uiLang === 'zh' || document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
const t = key => translations[lang()][key] || translations.en[key] || key;
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function status(message, error = false) {
  $('notesStatus').textContent = translations.en[message] ? t(message) : message;
  $('notesStatus').dataset.error = String(error);
}
function setBusy(value) {
  busy = value;
  for (const node of document.querySelectorAll('#notesWorkspace button, #notesConnect, #notesConfirmAction')) node.disabled = value;
  $('notesFields').inert = value;
  $('noteBody').readOnly = value;
  $('notesList').disabled = value;
  $('notesSave').disabled = value || !active;
  $('notesPublish').disabled = value || !active;
  $('notesWithdraw').disabled = value || !publicState;
  $('notesConfirmAction').disabled = value || !$('notesConfirmCheck').checked;
  if (value) status('busy');
}
function failure(error) {
  const code = String(error?.code || error?.status || '');
  if (/IMAGES_UNSUPPORTED/.test(code)) { status('attachments', true); return; }
  if (/PUBLIC_CONTENT_REQUIRED|HEADING|TOO_LARGE/.test(code)) { status('validation', true); return; }
  if (/409|422|conflict/i.test(code)) status('conflict', true);
  else if (/401|403|auth|forbidden|denied|permission/i.test(code)) status('access', true);
  else if (/private|owner|identity|privacy/i.test(code)) status('privacy', true);
  else if (/valid|size|confirm/i.test(code)) status('validation', true);
  else status('unavailable', true);
}
async function run(action) {
  if (busy) return;
  const runEpoch = epoch;
  setBusy(true);
  try { await action(runEpoch); } catch (error) { if (runEpoch === epoch) failure(error); }
  finally { if (runEpoch === epoch) setBusy(false); }
}
function discard() { return !dirty || window.confirm(t('discard')); }
function currentNote() {
  if (!active) return null;
  const note = { ...active.note };
  for (const [key, input] of Object.entries(fields)) note[key] = key === 'tags' ? input.value.split(',').map(s => s.trim()).filter(Boolean) : input.value;
  return note;
}
function visibility() {
  if (!active) return;
  $('notesVisibility').textContent = publicState === undefined ? t('unknown') : publicState ? t('public') : active.note.publicPath ? t('withdrawn') : t('private');
  $('notesSaved').textContent = dirty || !active.sha ? t('unsaved') : t('clean');
  $('notesSave').disabled = busy;
  $('notesPublish').disabled = busy;
  $('notesWithdraw').disabled = busy || !publicState;
  $('notesPublicLink').hidden = !publicState;
  $('notesPublicLink').href = `../posts/${encodeURIComponent(active.note.slug)}/`;
  fields.slug.readOnly = Boolean(active.sha || active.note.publicPath);
}
function preview() {
  if (!active) return;
  try {
    const note = currentNote();
    const md = window.markdownit({ html: false, linkify: false, typographer: false });
    md.renderer.rules.image = tokens => `<span class="muted">${escapeHtml(t('blockedImage'))}: ${escapeHtml(tokens[0]?.content || '')}</span>`;
    const linkOpen = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      tokens[idx].attrSet('rel', 'noreferrer noopener');
      tokens[idx].attrSet('target', '_blank');
      return linkOpen(tokens, idx, options, env, self);
    };
    md.block.ruler.before('paragraph', 'research_diagram', (state, start, end, silent) => {
      const line = state.src.slice(state.bMarks[start] + state.tShift[start], state.eMarks[start]).trim();
      if (!/^::tiger-[a-z-]+$/.test(line)) return false;
      const html = renderNoteDiagram(line, note.lang);
      if (!html) return false;
      if (!silent) { const token = state.push('research_diagram', '', 0); token.content = html; }
      state.line = start + 1;
      return true;
    });
    md.renderer.rules.research_diagram = (tokens, index) => tokens[index].content;
    $('notesPreview').innerHTML = md.render(note.body);
    window.renderMathInElement?.($('notesPreview'), {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      throwOnError: false, trust: false, strict: 'ignore', maxExpand: 200
    });
  } catch { $('notesPreview').textContent = t('markdownError'); }
}
function options() {
  $('notesList').replaceChildren(...records.map(record => {
    const option = document.createElement('option'); option.value = record.note.id; option.textContent = record.note.title || t('newTitle'); return option;
  }));
  if (active) $('notesList').value = active.note.id;
}
function show(record) {
  active = record;
  publicState = undefined;
  dirty = false;
  for (const [key, input] of Object.entries(fields)) input.value = key === 'tags' ? record.note.tags.join(', ') : record.note[key];
  $('notesEditorArea').hidden = false;
  $('notesEmpty').hidden = true;
  $('notesList').value = record.note.id;
  visibility(); preview();
}
async function refreshPublic(runEpoch) {
  try {
    const state = await client.getPublicState(active.note);
    if (runEpoch === epoch) publicState = state;
  } catch { if (runEpoch === epoch) publicState = undefined; }
  if (runEpoch === epoch) visibility();
}
async function loadRecords(runEpoch) {
  const entries = await client.listNotes();
  const loaded = [];
  for (const entry of entries) {
    const id = typeof entry === 'string' ? entry.replace(/\.json$/, '') : entry.id || entry.name.replace(/\.json$/, '');
    loaded.push(await client.getNote(id));
    if (runEpoch !== epoch) return;
  }
  records = loaded.sort((a, b) => b.note.updated.localeCompare(a.note.updated));
  active = null; dirty = false; options();
  $('notesEditorArea').hidden = true;
  $('notesEmpty').hidden = records.length > 0;
  if (records[0]) { show(records[0]); await refreshPublic(runEpoch); }
}
async function loadPublicList(runEpoch) {
  const response = await fetch('../posts.json', { cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error('Catalog unavailable');
  const posts = await response.json();
  const sources = await client.listPublicSources();
  if (runEpoch !== epoch) return;
  publicPosts = posts;
  publicSources = sources;
  $('notesPublicList').replaceChildren(...publicPosts.map(post => {
    const option = document.createElement('option'); option.value = post.slug; option.textContent = `[${post.lang}] ${post.title}`; return option;
  }));
}
function lock(message = 'locked') {
  epoch += 1;
  client?.dispose(); client = null;
  clearTimeout(idleTimer); clearTimeout(previewTimer);
  records = []; active = null; publicState = undefined; publicPosts = []; publicSources = []; dirty = false;
  for (const input of Object.values(fields)) input.value = '';
  $('notesToken').value = '';
  $('notesPreview').replaceChildren(); $('notesList').replaceChildren(); $('notesPublicList').replaceChildren();
  $('notesVisibility').textContent = ''; $('notesSaved').textContent = '';
  $('notesPublicLink').removeAttribute('href'); $('notesPublicLink').hidden = true;
  $('notesWorkspace').hidden = true; $('notesConnected').hidden = true; $('notesConnectForm').hidden = false;
  confirmedAction = null; $('notesConfirm').close(); setBusy(false); status(message);
}
function armLock() {
  if (!client) return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (dirty || busy) { status('idleUnsaved'); armLock(); }
    else lock('idle');
  }, 15 * 60 * 1000);
}
async function save(runEpoch) {
  const note = { ...currentNote(), updated: today() };
  const result = await client.saveNote(note, active.sha || undefined);
  if (runEpoch !== epoch) return;
  active = result; dirty = false;
  const index = records.findIndex(record => record.note.id === note.id);
  if (index < 0) records.unshift(result); else records[index] = result;
  options(); visibility(); status('saved');
}
function confirmAction(title, message, action) {
  $('notesConfirmTitle').textContent = t(title); $('notesConfirmMessage').textContent = t(message);
  $('notesConfirmCheck').checked = false; $('notesConfirmAction').disabled = true;
  confirmedAction = action;
  $('notesConfirm').showModal(); $('notesCancel').focus();
}
function parseSource(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source);
  if (!match) throw new Error('Invalid article');
  return { data: window.jsyaml.load(match[1], { schema: window.jsyaml.JSON_SCHEMA }), body: match[2] };
}
function applyLanguage() {
  for (const node of document.querySelectorAll('[data-notes-text]')) node.textContent = t(node.dataset.notesText);
  $('notesPublicList').setAttribute('aria-label', t('importTitle'));
  if (active) { visibility(); preview(); } else if (!client) status('locked');
}

$('notesConnectForm').addEventListener('submit', event => {
  event.preventDefault();
  if (window.top !== window.self) { status('frame', true); return; }
  const token = $('notesToken').value.trim();
  $('notesToken').value = '';
  if (!token) return;
  run(async runEpoch => {
    const pending = new PrivateNotesClient(token);
    client = pending;
    try { await pending.connect(); } catch (error) { pending.dispose(); if (client === pending) client = null; throw error; }
    if (runEpoch !== epoch) return;
    armLock();
    $('notesConnectForm').hidden = true; $('notesConnected').hidden = false; $('notesWorkspace').hidden = false;
    await loadRecords(runEpoch);
    if (runEpoch !== epoch) return;
    try { await loadPublicList(runEpoch); status(records.length ? 'clean' : 'empty'); }
    catch { status('publicError', true); }
  });
});
$('notesLock').addEventListener('click', () => { if (!dirty || window.confirm(t('lockWarning'))) lock(); });
$('notesNew').addEventListener('click', () => {
  if (!discard() || busy) return;
  const id = crypto.randomUUID();
  const note = { version: 1, id, slug: `note-${today()}-${id.slice(0, 8)}`, title: t('newTitle'), description: '', lang: lang(),
    category: 'Research Notes', tags: ['notes'], research: [], date: today(), updated: today(), status: 'draft', body: '' };
  const record = { note, sha: null };
  records.unshift(record); options(); show(record); publicState = null; dirty = true; visibility(); fields.title.focus();
});
$('notesList').addEventListener('change', () => {
  const record = records.find(item => item.note.id === $('notesList').value);
  if (!record || !discard()) { $('notesList').value = active?.note.id || ''; return; }
  run(async runEpoch => { show(record); await refreshPublic(runEpoch); status(record.sha ? 'clean' : 'unsaved'); });
});
$('notesReload').addEventListener('click', () => { if (discard()) run(async runEpoch => { await loadRecords(runEpoch); status(records.length ? 'clean' : 'empty'); }); });
$('notesSave').addEventListener('click', () => run(save));
$('notesFields').addEventListener('submit', event => event.preventDefault());
for (const input of Object.values(fields)) input.addEventListener('input', () => {
  if (!active || busy) return;
  dirty = true; visibility(); clearTimeout(previewTimer); previewTimer = setTimeout(preview, 160);
});
$('notesImport').addEventListener('click', () => {
  if (!discard()) return;
  run(async runEpoch => {
    const post = publicPosts.find(item => item.slug === $('notesPublicList').value);
    if (!post) { status('noSource', true); return; }
    const existing = records.find(record => record.note.slug === post.slug);
    if (existing) { show(existing); await refreshPublic(runEpoch); return; }
    const entry = publicSources.find(source => source.name === post.slug || source.name === `${post.date}-${post.slug}`);
    if (!entry) { status('noSource', true); return; }
    const path = entry.path;
    const source = await client.readPublicSource(path);
    if (runEpoch !== epoch) return;
    const { data, body } = parseSource(source.source);
    const publicMeta = {};
    for (const key of ['translationKey', 'translations', 'series', 'featured', 'math', 'toc', 'socialImage', 'socialImageAlt']) {
      if (data[key] !== undefined) publicMeta[key] = data[key];
    }
    const note = { version: 1, id: crypto.randomUUID(), slug: post.slug, title: data.title, description: data.description || '',
      lang: data.lang || post.lang, category: data.category || 'Research Notes', tags: data.tags || ['notes'], research: data.research || [],
      date: String(data.date), updated: today(), status: 'complete', body, publicPath: path, publicMeta };
    const record = { note, sha: null }; records.unshift(record); options(); show(record);
    dirty = true; publicState = source; visibility(); status('imported');
  });
});
$('notesPublish').addEventListener('click', () => run(async runEpoch => {
  if (!active || dirty || !active.sha) { status('saveFirst', true); return; }
  const note = structuredClone(active.note);
  if (!note.publicPath && /!\[[^\]]*\]\(/.test(note.body)) { status('attachments', true); return; }
  toPublicMarkdown(note);
  const state = await client.getPublicState(note);
  if (runEpoch !== epoch) return;
  if (state && !note.publicPath) { status('collision', true); return; }
  confirmAction('publishTitle', 'publishMessage', async actionEpoch => {
    await client.publishNote(note, state?.sha || null, true);
    if (actionEpoch !== epoch) return;
    active.note.publicPath ||= `content/posts/${note.slug}/index.md`;
    let linked = true;
    try { await save(actionEpoch); } catch { dirty = true; linked = false; }
    await refreshPublic(actionEpoch);
    if (actionEpoch === epoch) status(linked ? 'published' : 'publishedUnlinked', !linked);
  });
}));
$('notesWithdraw').addEventListener('click', () => {
  if (!active || !publicState || busy) return;
  const sha = publicState.sha;
  confirmAction('withdrawTitle', 'withdrawMessage', async runEpoch => {
    await save(runEpoch);
    if (runEpoch !== epoch) return;
    await client.withdrawNote(active.note, sha, true);
    if (runEpoch !== epoch) return;
    publicState = null; visibility(); status('removed');
  });
});
$('notesConfirmCheck').addEventListener('change', () => { $('notesConfirmAction').disabled = !$('notesConfirmCheck').checked || busy; });
$('notesCancel').addEventListener('click', () => $('notesConfirm').close());
$('notesConfirmAction').addEventListener('click', () => {
  if (!$('notesConfirmCheck').checked || !confirmedAction) return;
  const action = confirmedAction; confirmedAction = null; $('notesConfirm').close(); run(action);
});
$('notesConfirm').addEventListener('close', () => { confirmedAction = null; });
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('pagehide', () => lock());
window.addEventListener('blog-language-change', applyLanguage);
document.addEventListener('pointerdown', armLock, { passive: true });
document.addEventListener('keydown', armLock);
applyLanguage();
setBusy(false);
