const version = new URL(import.meta.url).searchParams.get('v');
const scenes = {
  vpr: ['topic-perception', 'mountVpr'],
  'medical-image': ['topic-perception', 'mountMedical'],
  agent: ['topic-workbench', 'mountAgent'],
  education: ['topic-workbench', 'mountEducation']
};
const styles = new Map();

function withTimeout(promise) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Topic load timed out')), 12000); })
  ]).finally(() => clearTimeout(timer));
}

function asset(name, attempt = 0) {
  const url = new URL(name, import.meta.url);
  if (version) url.searchParams.set('v', version);
  if (attempt) url.searchParams.set('retry', String(attempt));
  return url.href;
}

function loadStyle(name) {
  if (styles.has(name)) return styles.get(name);
  const link = document.createElement('link');
  const promise = withTimeout(new Promise((resolve, reject) => {
    link.rel = 'stylesheet';
    link.href = asset(`${name}.css`);
    link.onload = resolve;
    link.onerror = () => reject(new Error('Topic stylesheet unavailable'));
    document.head.append(link);
  })).catch(error => { link.remove(); styles.delete(name); throw error; });
  styles.set(name, promise);
  return promise;
}

// Each topic owns its DOM and state. Switching topics never restarts a completed interaction.
export function createTopicExperiences({ panel, getContext }) {
  const element = document.createElement('div');
  element.className = 'topic-experiences';
  element.hidden = true;
  element.tabIndex = 0;
  panel.append(element);
  const mounted = new Map();
  let active = null;
  const contextKey = () => `${getContext().lang}:${document.documentElement.dataset.theme}`;

  function message(record) {
    const zh = getContext().lang === 'zh';
    record.notice.textContent = record.failed
      ? (zh ? '暂时无法加载这个交互。论文和项目仍可正常阅读。' : 'This interaction could not load. Papers and projects remain available.')
      : (zh ? '正在加载交互…' : 'Loading interaction…');
    record.retry.textContent = zh ? '重新加载' : 'Retry';
    record.retry.hidden = !record.failed;
  }

  async function load(type, record) {
    const [name, method] = scenes[type];
    record.failed = false;
    message(record);
    try {
      const module = await withTimeout(import(asset(`${name}.js`, record.attempt++)));
      await loadStyle(name);
      record.content = document.createElement('div');
      record.element.append(record.content);
      record.api = module[method](record.content, { lang: getContext().lang });
      record.context = contextKey();
      record.notice.remove();
      record.retry.remove();
    } catch {
      record.content?.remove();
      record.api?.destroy();
      record.api = null;
      record.failed = true;
      message(record);
    }
  }

  function show(type) {
    const previous = active;
    active = scenes[type] ? type : null;
    if (previous !== active) element.scrollTop = 0;
    element.hidden = !active;
    element.lang = getContext().lang === 'zh' ? 'zh-CN' : 'en';
    element.setAttribute('aria-label', getContext().lang === 'zh' ? '主题交互' : 'Topic interaction');
    for (const [key, record] of mounted) record.element.hidden = key !== active;
    if (!active) return;
    let record = mounted.get(active);
    if (!record) {
      const host = document.createElement('section');
      host.dataset.topic = active;
      const notice = document.createElement('p');
      notice.setAttribute('role', 'status');
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'btn btn-outline';
      host.append(notice, retry);
      element.append(host);
      record = { element: host, notice, retry, attempt: 0, api: null, failed: false };
      mounted.set(active, record);
      const id = active;
      retry.addEventListener('click', () => { void load(id, record); });
      void load(id, record);
    } else if (record.api && record.context !== contextKey()) {
      record.api.setLanguage(getContext().lang);
      record.context = contextKey();
    }
    else if (!record.api) message(record);
  }
  return { element, show };
}
