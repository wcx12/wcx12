const entryModuleUrl = new URL(import.meta.url);
const assetVersion = entryModuleUrl.searchParams.get('v') || '';

function versionedModuleUrl(relativePath, parameters = {}) {
  const url = new URL(relativePath, entryModuleUrl);
  if (assetVersion) url.searchParams.set('v', assetVersion);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.href;
}

const { ORCID_ID, localRepos, staticPublications } = await import(versionedModuleUrl('./site-data.js'));

const views = document.querySelectorAll('.view');
const commands = document.querySelectorAll('.cmd');
const chips = document.querySelectorAll('.chip');
const chipOutput = document.getElementById('chipOutput');
const typeTarget = document.getElementById('typeTarget');
const focusAreaCount = document.getElementById('focusAreaCount');
const heroPublicationCount = document.getElementById('heroPublicationCount');
const repoGrid = document.getElementById('repoGrid');
const repoSearch = document.getElementById('repoSearch');
const repoSort = document.getElementById('repoSort');
const repoMode = document.getElementById('repoMode');
const repoPageSize = document.getElementById('repoPageSize');
const repoCount = document.getElementById('repoCount');
const repoPager = document.getElementById('repoPager');
const repoPrev = document.getElementById('repoPrev');
const repoNext = document.getElementById('repoNext');
const repoPageInfo = document.getElementById('repoPageInfo');

const pubList = document.getElementById('pubList');
const pubMode = document.getElementById('pubMode');
const pubPageSize = document.getElementById('pubPageSize');
const pubCount = document.getElementById('pubCount');
const pubPager = document.getElementById('pubPager');
const pubPrev = document.getElementById('pubPrev');
const pubNext = document.getElementById('pubNext');
const pubPageInfo = document.getElementById('pubPageInfo');
const writingSearch = document.getElementById('writingSearch');
const writingCount = document.getElementById('writingCount');
const writingFeatured = document.getElementById('writingFeatured');
const writingList = document.getElementById('writingList');

const themeSelect = document.getElementById('themeSelect');
const langToggle = document.getElementById('langToggle');
const openCommand = document.getElementById('openCommand');
const openResearch = document.getElementById('openResearch');
const modal = document.getElementById('detailModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalLink = document.getElementById('modalLink');
const modalClose = document.getElementById('modalClose');
const manageResearch = document.getElementById('manageResearch');
const researchManager = document.getElementById('researchManager');
const managerClose = document.getElementById('managerClose');
const managerDomain = document.getElementById('managerDomain');
const managerInterest = document.getElementById('managerInterest');
const managerLabel = document.getElementById('managerLabel');
const managerAnimation = document.getElementById('managerAnimation');
const managerAdd = document.getElementById('managerAdd');
const managerSave = document.getElementById('managerSave');
const managerDelete = document.getElementById('managerDelete');
const managerGitHubToken = document.getElementById('managerGitHubToken');
const managerSaveRemote = document.getElementById('managerSaveRemote');
const managerRemoteStatus = document.getElementById('managerRemoteStatus');
const managerActive = document.getElementById('managerActive');
const managerProjects = document.getElementById('managerProjects');
const managerPapers = document.getElementById('managerPapers');
const commandPalette = document.getElementById('commandPalette');
const commandClose = document.getElementById('commandClose');
const commandInput = document.getElementById('commandInput');
const commandList = document.getElementById('commandList');
const commandPreview = document.getElementById('commandPreview');
const themeTransition = document.getElementById('themeTransition');
const readmeDrawer = document.getElementById('readmeDrawer');
const readmeDrawerTitle = document.getElementById('readmeDrawerTitle');
const readmeDrawerKicker = document.getElementById('readmeDrawerKicker');
const readmeDrawerBody = document.getElementById('readmeDrawerBody');
const readmeDrawerLink = document.getElementById('readmeDrawerLink');
const readmeDrawerClose = document.getElementById('readmeDrawerClose');
const heroPreviewCanvas = document.getElementById('heroPreviewCanvas');
const heroPreviewCtx = heroPreviewCanvas?.getContext('2d');
const heroPreviewStatus = document.getElementById('heroPreviewStatus');
const heroPreviewMeta = document.getElementById('heroPreviewMeta');
const researchShowcase = document.getElementById('researchShowcase');
const pageBackgroundElements = Array.from(document.querySelectorAll('header, main, footer'));
const activeOverlayElements = new Set();

const interestRail = document.getElementById('interestRail');
const interestPath = document.getElementById('interestPath');
const interestTitle = document.getElementById('interestTitle');
const interestTag = document.getElementById('interestTag');
const interestDescription = document.getElementById('interestDescription');
const interestDetail = document.querySelector('.interest-detail');
const interestSectionTabs = document.querySelectorAll('[data-interest-panel]');
const interestProjects = document.getElementById('interestProjects');
const interestPapers = document.getElementById('interestPapers');
const interestPosts = document.getElementById('interestPosts');
const customCursor = document.getElementById('customCursor');
const utilityMenu = document.querySelector('.utility-menu');
const utilityMenuToggle = document.querySelector('.utility-menu-toggle');

const LANG_KEY = 'wcx12-lang';

let currentLang = ['en', 'zh'].includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : 'en';
let currentTheme = localStorage.getItem('wcx12-theme') || 'neon';
let allRepos = [...localRepos];
let filteredRepos = [...localRepos];
let repoDataSource = 'snapshot';
let loadedPublications = [];
let publicationLoadFailed = false;
let blogPosts = [];
let filteredBlogPosts = [];
let reposLoadPromise = null;
let publicationsLoadPromise = null;
let blogPostsLoadPromise = null;
let researchConfigLoadPromise = null;
let commandCursor = 0;
let commandReturnFocus = null;
let modalReturnFocus = null;
let researchManagerReturnFocus = null;
let highlightedRepo = null;
let highlightedPaper = null;
let readmeReturnFocus = null;
let readmeReturnFocusRepoName = null;
let readmeRequestController = null;
let readmeRequestSequence = 0;
let githubSaveController = null;
let remoteResearchConfigHash = '';
let activeInterestPanel = 'animation';
const initializedViews = new Set();
const LAZY_VIEW_IDS = new Set(['research', 'projects', 'publications', 'writing']);
let activeInterestId = 'point-cloud-registration';
let previewInterestId = null;
let heroPreviewTick = 0;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactViewportQuery = window.matchMedia('(max-width: 720px)');
const MAX_CANVAS_DPR = 2;
const HERO_PREVIEW_FRAME_SKIP = 6;
const STARFIELD_FRAME_SKIP = 6;
let lastHeroPreviewFrame = 0;
let lastStarfieldFrame = 0;
let heroPreviewVisible = true;
let motionTimer = null;
let motionFrame = null;
const themeColorCache = new Map();
let activationGeneration = 0;
let researchCanvasImportPromise = null;
let researchCanvasImportAttempt = 0;
let researchCanvasFeature = null;
let repoMapImportPromise = null;
let repoMapImportAttempt = 0;
let repoMapFeature = null;
let pendingResearchBinding = null;

function initCustomCursor() {
  if (!customCursor || !window.matchMedia('(pointer: fine) and (min-width: 720px)').matches) return;

  const hoverSelector = 'a, button, select, input, textarea, [role="button"], .repo-card, .pub-card, #interestCanvas';
  const textSelector = 'input, textarea, [contenteditable="true"]';
  let clickTimer = null;

  document.body.classList.add('cursor-enabled');

  window.addEventListener('pointermove', (event) => {
    customCursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    document.body.classList.add('cursor-visible');
    document.body.classList.toggle('cursor-hover', Boolean(event.target.closest(hoverSelector)));
    document.body.classList.toggle('cursor-text', Boolean(event.target.closest(textSelector)));
  }, { passive: true });

  window.addEventListener('pointerdown', () => {
    document.body.classList.add('cursor-down', 'cursor-clicking');
    clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => document.body.classList.remove('cursor-clicking'), 430);
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    document.body.classList.remove('cursor-down');
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    document.body.classList.remove('cursor-visible', 'cursor-down', 'cursor-hover', 'cursor-text');
  });

  document.addEventListener('mouseenter', () => {
    document.body.classList.add('cursor-visible');
  });
}

let researchInterests = [
  {
    id: 'point-cloud',
    title: { en: 'Point Cloud', zh: '点云' },
    label: { en: '3D Geometry', zh: '三维几何' },
    children: [
      {
        id: 'point-cloud-registration',
        title: { en: 'Registration', zh: '配准' },
        label: { en: 'alignment', zh: '对齐' },
        animation: 'point-cloud',
        description: {
          en: 'Robust point set registration under noisy, partial, and imperfect observations.',
          zh: '研究噪声、缺失与不完美观测条件下的稳健点集配准。'
        }
      }
    ]
  },
  {
    id: 'computer-vision',
    title: { en: 'Computer Vision', zh: '计算机视觉' },
    label: { en: 'visual matching', zh: '视觉匹配' },
    children: [
      {
        id: 'vpr',
        title: { en: 'VPR', zh: 'VPR' },
        label: { en: 'Visual Place Recognition', zh: '视觉地点识别' },
        animation: 'vpr',
        description: {
          en: 'Visual place recognition, retrieval, and localization-oriented benchmark work.',
          zh: '围绕视觉地点识别、检索与定位基准展开的研究。'
        }
      },
      {
        id: 'medical-image-analysis',
        title: { en: 'Medical Image Analysis', zh: '医学影像分析' },
        label: { en: 'active learning', zh: '主动学习' },
        animation: 'medical-image',
        description: {
          en: 'Medical image classification, active learning, and sample-efficient visual model training.',
          zh: '围绕医学影像分类、主动学习与样本高效视觉模型训练展开的研究。'
        }
      }
    ]
  },
  {
    id: 'llm',
    title: { en: 'Large Models', zh: '大模型' },
    label: { en: 'LLM systems', zh: 'LLM 系统' },
    children: [
      {
        id: 'agent',
        title: { en: 'Agent', zh: 'Agent' },
        label: { en: 'Agentic Systems', zh: '智能体系统' },
        animation: 'agent',
        description: {
          en: 'Agentic workflows with planning, tool use, retrieval, and evaluation loops.',
          zh: '关注规划、工具调用、检索与评测闭环的大模型智能体工作流。'
        }
      }
    ]
  },
  {
    id: 'ai4edu',
    title: { en: 'AI for Education', zh: 'AI4教育' },
    label: { en: 'learning systems', zh: '学习系统' },
    children: [
      {
        id: 'ai4edu',
        title: { en: 'Learning Tools', zh: '学习工具' },
        label: { en: 'AI4Education', zh: 'AI4教育' },
        animation: 'education',
        description: {
          en: 'AI-assisted learning tools, practice generation, feedback, and knowledge tracing ideas.',
          zh: '面向学习工具、练习生成、反馈闭环与知识追踪的 AI4教育方向。'
        }
      }
    ]
  }
];

const CONFIG_KEY = 'wcx12-research-config';
const CONFIG_PATH = 'research-config.json';
const GITHUB_REPOSITORY = 'wcx12/wcx12';
const GITHUB_BRANCH = 'main';
const GITHUB_OWNER = 'wcx12';
const GITHUB_CONFIG_WORKFLOW = 'research-config-update.yml';
const GITHUB_RAW_CONFIG_URL = `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_BRANCH}/${CONFIG_PATH}`;
const OWNER_TOOLS_KEY = 'wcx12-owner-tools';
const LEGACY_GITHUB_TOKEN_KEY = 'wcx12-github-token';
const REQUEST_TIMEOUT_MS = Object.freeze({
  config: 8000,
  github: 10000,
  orcid: 10000,
  readme: 12000
});

function clearGitHubToken(options = {}) {
  const { abortRequest = false } = options;
  if (managerGitHubToken) managerGitHubToken.value = '';
  if (abortRequest && githubSaveController) {
    githubSaveController.abort();
    githubSaveController = null;
  }
  try {
    sessionStorage.removeItem(LEGACY_GITHUB_TOKEN_KEY);
  } catch {
    // Ignore storage restrictions while still clearing the in-memory input.
  }
}

function timeoutSignal(timeoutMs) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function requestSignal(timeoutMs, externalSignal) {
  const timedSignal = timeoutSignal(timeoutMs);
  if (!externalSignal) return timedSignal;
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([externalSignal, timedSignal]);
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (externalSignal.aborted || timedSignal.aborted) abort();
  else {
    externalSignal.addEventListener('abort', abort, { once: true });
    timedSignal.addEventListener('abort', abort, { once: true });
  }
  return controller.signal;
}

function fetchWithTimeout(resource, options = {}, timeoutMs = REQUEST_TIMEOUT_MS.github) {
  const { signal: externalSignal, ...fetchOptions } = options;
  return fetch(resource, {
    ...fetchOptions,
    signal: requestSignal(timeoutMs, externalSignal)
  });
}

function detectOwnerTools() {
  if (window.top !== window.self) {
    localStorage.removeItem(OWNER_TOOLS_KEY);
    clearGitHubToken({ abortRequest: true });
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('ownerTools') === '1') localStorage.setItem(OWNER_TOOLS_KEY, 'enabled');
  if (params.get('ownerTools') === '0') {
    localStorage.removeItem(OWNER_TOOLS_KEY);
    clearGitHubToken({ abortRequest: true });
  } else {
    clearGitHubToken();
  }
  return localStorage.getItem(OWNER_TOOLS_KEY) === 'enabled';
}

const ownerToolsEnabled = detectOwnerTools();
const RESEARCH_CONFIG_VERSION = 2;
const CONFIG_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONFIG_LIMITS = Object.freeze({
  domains: 64,
  childrenPerDomain: 64,
  assignments: 1000,
  idLength: 80,
  keyLength: 500,
  shortTextLength: 240,
  descriptionLength: 2000
});

const defaultResearchInterests = JSON.parse(JSON.stringify(researchInterests));
const ALLOWED_RESEARCH_ANIMATIONS = new Set(
  defaultResearchInterests.flatMap((domain) => domain.children.map((child) => child.animation))
);

function cloneConfigValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultAssignments(kind) {
  const source = kind === 'repo' ? localRepos : staticPublications;
  return Object.fromEntries(source.map((item) => [item.name || item.title, item.interests || []]));
}

function defaultResearchConfig() {
  return {
    version: RESEARCH_CONFIG_VERSION,
    interests: cloneConfigValue(defaultResearchInterests),
    repoAssignments: defaultAssignments('repo'),
    paperAssignments: defaultAssignments('paper')
  };
}

function mergeDefaultResearchInterests(incomingInterests, defaultInterests) {
  const merged = cloneConfigValue(Array.isArray(incomingInterests) && incomingInterests.length ? incomingInterests : defaultInterests);
  defaultInterests.forEach((defaultDomain) => {
    let domain = merged.find((item) => item.id === defaultDomain.id);
    if (!domain) {
      merged.push(cloneConfigValue(defaultDomain));
      return;
    }
    if (!Array.isArray(domain.children)) domain.children = [];
    defaultDomain.children.forEach((defaultChild) => {
      if (!domain.children.some((child) => child.id === defaultChild.id)) {
        domain.children.push(cloneConfigValue(defaultChild));
      }
    });
  });
  return merged;
}

function isPlainRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function configValidationError(path, message) {
  return new Error(`Invalid research config at ${path}: ${message}`);
}

function validateConfigId(value, path) {
  if (typeof value !== 'string'
    || value.length > CONFIG_LIMITS.idLength
    || !CONFIG_ID_PATTERN.test(value)) {
    throw configValidationError(path, 'expected a lowercase slug id');
  }
  return value;
}

function validateConfigText(value, path, maxLength, options = {}) {
  const { allowEmpty = false } = options;
  if (typeof value !== 'string'
    || value.length > maxLength
    || (!allowEmpty && !value.trim())
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    throw configValidationError(path, 'expected bounded plain text');
  }
  return value;
}

function validateLocalizedConfigText(value, path, maxLength) {
  if (!isPlainRecord(value)) throw configValidationError(path, 'expected localized text');
  return {
    en: validateConfigText(value.en, `${path}.en`, maxLength),
    zh: validateConfigText(value.zh, `${path}.zh`, maxLength)
  };
}

function validateResearchInterests(value) {
  if (!Array.isArray(value) || !value.length || value.length > CONFIG_LIMITS.domains) {
    throw configValidationError('interests', 'expected a non-empty domain list');
  }

  const domainIds = new Set();
  const childIds = new Set();
  const interests = value.map((domain, domainIndex) => {
    const domainPath = `interests[${domainIndex}]`;
    if (!isPlainRecord(domain)) throw configValidationError(domainPath, 'expected a domain object');
    const id = validateConfigId(domain.id, `${domainPath}.id`);
    if (domainIds.has(id)) throw configValidationError(`${domainPath}.id`, 'duplicate domain id');
    domainIds.add(id);
    if (!Array.isArray(domain.children)
      || !domain.children.length
      || domain.children.length > CONFIG_LIMITS.childrenPerDomain) {
      throw configValidationError(`${domainPath}.children`, 'expected a non-empty child list');
    }

    const children = domain.children.map((child, childIndex) => {
      const childPath = `${domainPath}.children[${childIndex}]`;
      if (!isPlainRecord(child)) throw configValidationError(childPath, 'expected a child object');
      const childId = validateConfigId(child.id, `${childPath}.id`);
      if (childIds.has(childId)) throw configValidationError(`${childPath}.id`, 'duplicate child id');
      childIds.add(childId);
      if (!ALLOWED_RESEARCH_ANIMATIONS.has(child.animation)) {
        throw configValidationError(`${childPath}.animation`, 'unsupported animation');
      }
      return {
        id: childId,
        title: validateLocalizedConfigText(child.title, `${childPath}.title`, CONFIG_LIMITS.shortTextLength),
        label: validateLocalizedConfigText(child.label, `${childPath}.label`, CONFIG_LIMITS.shortTextLength),
        animation: child.animation,
        description: validateLocalizedConfigText(child.description, `${childPath}.description`, CONFIG_LIMITS.descriptionLength)
      };
    });

    return {
      id,
      title: validateLocalizedConfigText(domain.title, `${domainPath}.title`, CONFIG_LIMITS.shortTextLength),
      label: validateLocalizedConfigText(domain.label, `${domainPath}.label`, CONFIG_LIMITS.shortTextLength),
      children
    };
  });

  return { interests, childIds };
}

function validateAssignments(value, path, childIds) {
  if (!isPlainRecord(value)) throw configValidationError(path, 'expected an assignment object');
  const entries = Object.entries(value);
  if (entries.length > CONFIG_LIMITS.assignments) {
    throw configValidationError(path, 'too many assignment entries');
  }

  const assignments = {};
  entries.forEach(([key, ids]) => {
    if (!key
      || key.length > CONFIG_LIMITS.keyLength
      || ['__proto__', 'prototype', 'constructor'].includes(key)
      || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(key)) {
      throw configValidationError(`${path}.${key}`, 'invalid assignment key');
    }
    if (!Array.isArray(ids) || ids.length > childIds.size) {
      throw configValidationError(`${path}.${key}`, 'expected an id list');
    }
    const uniqueIds = new Set();
    assignments[key] = ids.map((id, index) => {
      const validatedId = validateConfigId(id, `${path}.${key}[${index}]`);
      if (!childIds.has(validatedId)) {
        throw configValidationError(`${path}.${key}[${index}]`, 'unknown child id');
      }
      if (uniqueIds.has(validatedId)) {
        throw configValidationError(`${path}.${key}[${index}]`, 'duplicate child id');
      }
      uniqueIds.add(validatedId);
      return validatedId;
    });
  });
  return assignments;
}

function normalizeResearchConfig(config) {
  if (!isPlainRecord(config)) throw configValidationError('root', 'expected an object');
  const sourceVersion = config.version ?? 1;
  if (!Number.isInteger(sourceVersion) || sourceVersion < 1 || sourceVersion > RESEARCH_CONFIG_VERSION) {
    throw configValidationError('version', 'unsupported version');
  }

  const defaults = defaultResearchConfig();
  const validated = validateResearchInterests(config.interests);
  const shouldBackfillDefaults = sourceVersion < RESEARCH_CONFIG_VERSION;
  const interests = shouldBackfillDefaults
    ? mergeDefaultResearchInterests(validated.interests, defaults.interests)
    : validated.interests;
  const normalizedChildIds = new Set(interests.flatMap((domain) => domain.children.map((child) => child.id)));
  const repoAssignments = validateAssignments(config.repoAssignments, 'repoAssignments', normalizedChildIds);
  const paperAssignments = validateAssignments(config.paperAssignments, 'paperAssignments', normalizedChildIds);
  const keepKnownIds = (ids) => ids.filter((id) => normalizedChildIds.has(id));
  const defaultRepoAssignments = Object.fromEntries(
    Object.entries(defaults.repoAssignments).map(([key, ids]) => [key, keepKnownIds(ids)])
  );
  const defaultPaperAssignments = Object.fromEntries(
    Object.entries(defaults.paperAssignments).map(([key, ids]) => [key, keepKnownIds(ids)])
  );
  return {
    version: RESEARCH_CONFIG_VERSION,
    interests,
    repoAssignments: { ...defaultRepoAssignments, ...repoAssignments },
    paperAssignments: { ...defaultPaperAssignments, ...paperAssignments }
  };
}

function loadResearchConfig() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
    if (ownerToolsEnabled && parsed.interests) return normalizeResearchConfig(parsed);
  } catch {
    return defaultResearchConfig();
  }
  return defaultResearchConfig();
}

let researchConfig = loadResearchConfig();
researchInterests = researchConfig.interests;

function applyResearchConfig(nextConfig) {
  researchConfig = normalizeResearchConfig(nextConfig);
  researchInterests = researchConfig.interests;
  if (!activeInterestEntry()) activeInterestId = allInterestChildren()[0]?.child.id || '';
}

async function loadRemoteResearchConfig() {
  try {
    const configUrl = ownerToolsEnabled
      ? `${GITHUB_RAW_CONFIG_URL}?t=${Date.now()}`
      : versionedModuleUrl(CONFIG_PATH);
    const response = await fetchWithTimeout(
      configUrl,
      { cache: ownerToolsEnabled ? 'no-store' : 'default' },
      REQUEST_TIMEOUT_MS.config
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const source = await response.text();
    const remoteConfig = JSON.parse(source);
    applyResearchConfig(remoteConfig);
    if (ownerToolsEnabled) {
      remoteResearchConfigHash = await sha256Hex(source);
      localStorage.setItem(CONFIG_KEY, JSON.stringify(researchConfig));
    }
    updateHeroStats();
    renderHeroPreview();
    refreshInitializedView('research');
    refreshInitializedView('projects');
    refreshInitializedView('publications');
    refreshInitializedView('writing');
    if (ownerToolsEnabled && managerRemoteStatus) {
      managerRemoteStatus.textContent = i18n[currentLang].manager_remote_loaded;
    }
  } catch {
    if (ownerToolsEnabled && managerRemoteStatus) {
      managerRemoteStatus.textContent = i18n[currentLang].manager_remote_load_fail;
    }
  } finally {
    applyLocationRoute({ scroll: false, finalize: true });
  }
}

function saveResearchConfig() {
  if (!ownerToolsEnabled) return;
  researchConfig.interests = researchInterests;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(researchConfig));
}

const repoState = {
  mode: 'pagination',
  pageSize: compactViewportQuery.matches ? 6 : 12,
  page: 1,
  infiniteCount: compactViewportQuery.matches ? 6 : 12
};

repoPageSize.value = String(repoState.pageSize);

const pubState = {
  mode: 'pagination',
  pageSize: 6,
  page: 1,
  infiniteCount: 6
};

const fallbackPublications = {
  en: [],
  zh: []
};

const i18n = {
  en: {
    skip_main: 'Skip to main content',
    theme_neon: 'Default',
    theme_warm: 'Warm',
    theme_mono: 'Black & White',
    hero_kicker: 'Machine Learning Researcher',
    hero_affiliation: 'Beijing Institute of Technology',
    hero_status: 'Status',
    hero_subtitle_html: 'Reliable visual intelligence under imperfect observations and limited labels.<br />Research spanning 3D geometry, visual localization, medical imaging, and evidence-grounded AI systems.',
    hero_preview_label: 'Research Concept',
    hero_preview_live: 'concept',
    hero_preview_hint: 'Open this research area.',
    featured_research_label: 'Featured Research',
    featured_research_hint: 'Fast entry points into the concept gallery.',
    preview_projects: 'Projects',
    preview_papers: 'Papers',
    explore_research: 'Explore',
    repo_preview_title: 'Repository Preview',
    repo_preview_readme: 'Read README',
    btn_command: 'Command',
    btn_settings: 'Settings',
    btn_research: 'Research',
    btn_publications: 'Publications',
    btn_publications_hero: 'View Publications',
    btn_blog: 'Blog',
    btn_profile: 'Profile',
    btn_blog_hero: 'Read Blog',
    btn_research_hero: 'Explore Research',
    btn_contact: 'Contact Me',
    btn_repos: 'Explore My Repos',
    stat_focus: 'Research Domains',
    stat_grad: 'Graduation',
    stat_stack: 'Main Stack',
    stat_pubs: 'Publications',
    hints: 'Shortcut: Ctrl/⌘K command palette',
    hints_touch: 'Use Command in Settings to search and navigate.',
    tab_about: 'about',
    tab_research: 'research',
    tab_projects: 'projects',
    tab_publications: 'publications',
    tab_writing: 'writing',
    tab_timeline: 'timeline',
    tab_skills: 'skills',
    tab_resources: 'resources',
    tab_contact: 'contact',
    about_title: 'About',
    about_line1: 'I\'m Chenxu Wang (wcx12), studying at Beijing Institute of Technology and expecting to graduate in 2026.',
    about_line2: 'I enjoy combining geometric understanding with reliable engineering delivery.',
    research_title: 'Research Interests',
    research_static: 'Research Index',
    research_intro: 'Choose a sub-interest to see its concept demo, projects, and papers.',
    manage_research: 'Manage Mapping',
    view_details: 'View Details',
    related_projects: 'Related Projects',
    related_papers: 'Related Papers',
    related_writing: 'Related Writing',
    section_animation: 'Concept Demo',
    section_projects: 'Projects',
    section_papers: 'Papers',
    section_writing: 'Writing',
    show_in_projects: 'Show in Projects',
    show_in_research: 'Show in Research',
    no_related_projects: 'No mapped project yet.',
    no_related_papers: 'No mapped paper yet.',
    no_related_writing: 'No related note yet.',
    manager_title: 'Research Mapping',
    manager_add_title: 'Add Category',
    manager_domain: 'Domain',
    manager_interest: 'Sub-interest',
    manager_label: 'Label',
    manager_animation: 'Animation',
    manager_add: 'Add',
    manager_assign_title: 'Assign Current Category',
    manager_save: 'Apply Mapping',
    manager_token: 'GitHub token (Actions only)',
    manager_save_remote: 'Start GitHub update',
    manager_remote_hint: 'Use a single-repository token with Actions read/write only. It is cleared immediately after dispatch.',
    manager_remote_loaded: 'Remote config loaded.',
    manager_remote_load_fail: 'Using local defaults. Remote config was not loaded.',
    manager_remote_need_token: 'Paste a single-repository GitHub token with Actions read/write permission.',
    manager_remote_not_loaded: 'Remote config is not ready. Reload this owner page before saving.',
    manager_remote_saving: 'Checking the latest config and starting the update workflow...',
    manager_remote_saved: 'Update workflow started. GitHub Actions will validate, commit, and rebuild the site.',
    manager_remote_unchanged: 'GitHub config is already up to date.',
    manager_remote_conflict: 'GitHub config changed remotely. Reload the page before saving again.',
    manager_remote_failed: 'GitHub save failed. Check token permission and try again.',
    manager_delete: 'Delete Category',
    manager_projects: 'Projects',
    manager_papers: 'Papers',
    manager_saved: 'Saved.',
    readme_loading: 'Loading README...',
    readme_unavailable: 'README is unavailable right now.',
    open_external: 'Open Link',
    project_title: 'Repositories',
    project_desc: 'All public repositories are listed below with quick jump links.',
    repo_map_title: 'Research Field Map',
    repo_map_hint: 'Hover projects to inspect their research mapping.',
    repo_map_hint_touch: 'Tap a project to inspect its research mapping.',
    fallback_profile_title: 'Profile',
    fallback_profile_label: 'Homepage',
    fallback_general_title: 'General',
    fallback_general_label: 'Other projects',
    repo_fork_badge: 'Fork',
    repo_forked_from: 'Forked from',
    repo_search_ph: 'Search repositories...',
    repo_search_aria: 'Search repositories',
    sort_updated: 'Sort: Updated',
    sort_stars: 'Sort: Stars',
    sort_name: 'Sort: Name',
    mode_pagination: 'Mode: Pagination',
    mode_infinite: 'Mode: Infinite',
    page_prev: 'Prev',
    page_next: 'Next',
    page_info: 'Page {page}/{total}',
    repo_count: 'Showing {shown}/{total} repositories',
    repo_source_live: 'live GitHub data',
    repo_source_mixed: 'GitHub data with cached fallback',
    repo_source_snapshot: 'cached repository snapshot',
    pub_count: 'Showing {shown}/{total} publications',
    infinite_hint: 'Scroll down to auto-load more',
    timeline_title: 'Timeline',
    timeline_2024: 'Focused on strengthening ML engineering foundations and reproducible workflows.',
    timeline_2025: 'Deepening work on point-set registration, visual recognition, and sample-efficient learning.',
    timeline_2026: 'Graduation year and active applications for Master\'s / PhD opportunities.',
    skill_title: 'Skill Matrix',
    skill_hint: 'Click a skill chip to highlight what I use.',
    res_title: 'Resume & Files',
    pub_title: 'Publications',
    publication_static: 'Publication Index',
    pub_desc: 'Publication entries are shown below with status and links.',
    pub_loading: 'Loading publications from ORCID...',
    pub_load_fail: 'Unable to load from ORCID right now. Showing local fallback list.',
    pub_empty: 'No public publication records found yet.',
    pub_authors: 'Authors',
    pub_open: 'Open Publication Index',
    pub_open_article: 'Open Article',
    pub_file_title: 'Publication Index',
    pub_file_desc: 'Open the stable publication index with verified citations and DOI links.',
    writing_title: 'Writing',
    writing_desc: 'Technical notes and research logs generated from Markdown.',
    writing_open: 'Open Blog',
    writing_featured: 'Featured Notes',
    writing_hint: 'Full articles open as static blog pages.',
    writing_search_ph: 'Search writing...',
    writing_search_aria: 'Search writing',
    writing_count: 'Showing {shown}/{total} notes',
    writing_empty: 'No writing notes found yet.',
    writing_loading: 'Loading writing index...',
    writing_read: 'Read Note',
    writing_minutes: '{minutes} min read',
    cv_title: 'Resume',
    cv_desc: 'Open a printable research profile with education, publications, projects, and skills.',
    cv_download: 'View Research Profile',
    contact_title: 'Contact',
    contact_last: 'Open to research collaboration and open-source building.',
    footer: '© 2026 wcx12',
    command_placeholder: 'Type a command or repository...',
    command_search_aria: 'Search commands and repositories',
    command_empty: 'No matching command.',
    command_open: 'Open',
    command_jump: 'Jump',
    command_run: 'Run',
    command_search: 'Search',
    command_repo: 'Repository',
    command_palette: 'Command palette',
    command_toggle_lang: 'Toggle language',
    command_search_repos: 'Search repositories',
    command_search_research: 'Search research',
    command_search_papers: 'Search publications',
    command_search_writing: 'Search writing',
    command_theme: 'Cycle theme',
    command_alignment: 'Run point-set demo',
    command_github: 'Open GitHub profile',
    command_orcid: 'Open ORCID record',
    loading_repos: 'Loading repositories...',
    no_repos: 'No repositories found.',
    load_fail: 'Unable to load repositories right now.',
    no_desc: 'No description yet.',
    star: 'Stars',
    mixed: 'Mixed',
    open_repo: 'Open Repo',
    details_research_title: 'Research Details',
    details_research_body: 'Current work emphasizes robust geometric matching, visual perception, and reproducible AI systems.',
    details_project_link_text: 'Open Repository',
    project_overview: 'Project Overview',
    project_mapping: 'Research Mapping',
    project_updated: 'Updated',
    modal_close: 'x',
    lang_btn: '中文',
    chip_loaded: 'Loaded: {tag} -> actively used in my current workflow.',
    statuses: ['Applying for Master/PhD programs']
  },
  zh: {
    skip_main: '跳到主要内容',
    theme_neon: '默认风格',
    theme_warm: '暖色',
    theme_mono: '黑白极简',
    hero_kicker: '机器学习研究者',
    hero_affiliation: '北京理工大学',
    hero_status: '状态',
    hero_subtitle_html: '研究不完整观测与有限标注条件下的可靠视觉智能。<br />方向涵盖三维几何、视觉定位、医学影像与证据驱动的 AI 系统。',
    hero_preview_label: '研究概念',
    hero_preview_live: '概念',
    hero_preview_hint: '进入这个研究方向。',
    featured_research_label: '精选研究方向',
    featured_research_hint: '快速查看概念演示、项目与论文。',
    preview_projects: '项目',
    preview_papers: '论文',
    explore_research: '进入研究',
    repo_preview_title: '仓库预览',
    repo_preview_readme: '查看 README',
    btn_command: '命令',
    btn_settings: '设置',
    btn_research: '研究',
    btn_publications: '论文',
    btn_publications_hero: '查看论文',
    btn_blog: '博客',
    btn_profile: '履历',
    btn_blog_hero: '阅读博客',
    btn_research_hero: '探索研究',
    btn_contact: '联系我',
    btn_repos: '查看我的仓库',
    stat_focus: '研究方向',
    stat_grad: '毕业时间',
    stat_stack: '主要技术栈',
    stat_pubs: '论文',
    hints: '快捷键：Ctrl/⌘K 打开命令面板',
    hints_touch: '在设置中打开“命令”即可搜索和跳转。',
    tab_about: '关于',
    tab_research: '研究',
    tab_projects: '项目',
    tab_publications: '论文',
    tab_writing: '博客',
    tab_timeline: '时间线',
    tab_skills: '技能',
    tab_resources: '资源',
    tab_contact: '联系',
    about_title: '关于我',
    about_line1: '我是 Chenxu Wang（wcx12），目前就读于北京理工大学，预计于 2026 年毕业。',
    about_line2: '我喜欢把几何理解和可靠工程实现结合起来。',
    research_title: '研究兴趣',
    research_static: '研究索引',
    research_intro: '选择一个子兴趣，查看概念演示、关联项目和论文。',
    manage_research: '管理映射',
    view_details: '查看详情',
    related_projects: '相关项目',
    related_papers: '相关论文',
    related_writing: '相关文章',
    section_animation: '概念演示',
    section_projects: '项目',
    section_papers: '论文',
    section_writing: '文章',
    show_in_projects: '在项目中显示',
    show_in_research: '查看研究方向',
    no_related_projects: '暂未映射项目。',
    no_related_papers: '暂未映射论文。',
    no_related_writing: '暂未关联文章。',
    manager_title: '研究映射',
    manager_add_title: '添加分类',
    manager_domain: '一级领域',
    manager_interest: '子兴趣',
    manager_label: '标签',
    manager_animation: '动画',
    manager_add: '添加',
    manager_assign_title: '分配当前分类',
    manager_save: '应用映射',
    manager_token: 'GitHub token（仅 Actions 权限）',
    manager_save_remote: '启动 GitHub 更新',
    manager_remote_hint: '请使用仅限本仓库、只有 Actions 读写权限的 token；触发工作流后会立即清除。',
    manager_remote_loaded: '已加载远程配置。',
    manager_remote_load_fail: '未加载远程配置，正在使用本地默认值。',
    manager_remote_need_token: '请输入仅限本仓库、具有 Actions 读写权限的 GitHub token。',
    manager_remote_not_loaded: '远程配置尚未就绪，请重新加载管理页面后再保存。',
    manager_remote_saving: '正在核对最新配置并启动更新工作流...',
    manager_remote_saved: '更新工作流已启动，GitHub Actions 将验证、提交并重新构建站点。',
    manager_remote_unchanged: 'GitHub 配置已是最新。',
    manager_remote_conflict: 'GitHub 配置已在远程更新，请重新加载页面后再保存。',
    manager_remote_failed: '保存到 GitHub 失败，请检查 token 权限后重试。',
    manager_delete: '删除分类',
    manager_projects: '项目',
    manager_papers: '论文',
    manager_saved: '已保存。',
    readme_loading: '正在加载 README...',
    readme_unavailable: '当前无法加载 README。',
    open_external: '打开链接',
    project_title: '仓库列表',
    project_desc: '这里列出全部公开仓库，可直接跳转到对应项目。',
    repo_map_title: '研究领域地图',
    repo_map_hint: '悬停项目查看研究方向映射。',
    repo_map_hint_touch: '轻触项目查看研究方向映射。',
    fallback_profile_title: '主页',
    fallback_profile_label: '个人主页',
    fallback_general_title: '通用',
    fallback_general_label: '其它项目',
    repo_fork_badge: 'Fork',
    repo_forked_from: 'Fork 自',
    repo_search_ph: '搜索仓库...',
    repo_search_aria: '搜索仓库',
    sort_updated: '排序：最近更新',
    sort_stars: '排序：星标数',
    sort_name: '排序：名称',
    mode_pagination: '模式：分页',
    mode_infinite: '模式：无限加载',
    page_prev: '上一页',
    page_next: '下一页',
    page_info: '第 {page}/{total} 页',
    repo_count: '显示 {shown}/{total} 个仓库',
    repo_source_live: 'GitHub 实时数据',
    repo_source_mixed: 'GitHub 数据与本地快照',
    repo_source_snapshot: '本地仓库快照',
    pub_count: '显示 {shown}/{total} 篇论文',
    infinite_hint: '向下滚动自动加载更多',
    timeline_title: '时间线',
    timeline_2024: '强化机器学习工程基础与可复现实验流程。',
    timeline_2025: '深入开展点集配准、视觉识别与样本高效学习。',
    timeline_2026: '毕业年份，同时积极申请硕士/博士机会。',
    skill_title: '技能矩阵',
    skill_hint: '点击技能标签可查看当前使用说明。',
    res_title: '简历与文件',
    pub_title: '论文发表',
    publication_static: '论文索引',
    pub_desc: '论文条目直接展示在页面中，包含状态和跳转链接。',
    pub_loading: '正在从 ORCID 加载论文...',
    pub_load_fail: '当前无法从 ORCID 加载，已显示本地备用列表。',
    pub_empty: '暂未发现公开论文记录。',
    pub_authors: '作者',
    pub_open: '打开论文索引',
    pub_open_article: '打开论文',
    pub_file_title: '论文索引',
    pub_file_desc: '查看包含核验引用与 DOI 链接的稳定论文页面。',
    writing_title: '技术博客',
    writing_desc: '从 Markdown 自动生成的技术笔记和研究日志。',
    writing_open: '打开博客',
    writing_featured: '精选文章',
    writing_hint: '完整文章会打开静态博客页面。',
    writing_search_ph: '搜索文章...',
    writing_search_aria: '搜索文章',
    writing_count: '显示 {shown}/{total} 篇文章',
    writing_empty: '暂未找到文章。',
    writing_loading: '正在加载文章索引...',
    writing_read: '阅读文章',
    writing_minutes: '{minutes} 分钟阅读',
    cv_title: '简历',
    cv_desc: '查看可打印的研究履历，内容包括教育经历、论文、项目和技能。',
    cv_download: '查看研究履历',
    contact_title: '联系方式',
    contact_last: '欢迎研究合作与开源协作。',
    footer: '© 2026 wcx12',
    command_placeholder: '输入命令或仓库名称...',
    command_search_aria: '搜索命令和仓库',
    command_empty: '没有匹配的命令。',
    command_open: '打开',
    command_jump: '跳转',
    command_run: '运行',
    command_search: '搜索',
    command_repo: '仓库',
    command_palette: '命令面板',
    command_toggle_lang: '切换语言',
    command_search_repos: '搜索仓库',
    command_search_research: '搜索研究方向',
    command_search_papers: '搜索论文',
    command_search_writing: '搜索博客文章',
    command_theme: '切换主题',
    command_alignment: '运行点集配准演示',
    command_github: '打开 GitHub 主页',
    command_orcid: '打开 ORCID 记录',
    loading_repos: '正在加载仓库...',
    no_repos: '未找到仓库。',
    load_fail: '当前无法加载仓库，请稍后重试。',
    no_desc: '暂无描述。',
    star: '星标',
    mixed: '混合',
    open_repo: '打开仓库',
    details_research_title: '研究详情',
    details_research_body: '当前重点在稳健几何匹配、视觉感知与可复现 AI 系统。',
    details_project_link_text: '打开仓库',
    project_overview: '项目概览',
    project_mapping: '研究映射',
    project_updated: '更新时间',
    modal_close: 'x',
    lang_btn: 'EN',
    chip_loaded: '已加载: {tag} -> 已纳入当前工作流。',
    statuses: ['正在申请硕士/博士项目']
  }
};

const VALID_VIEW_IDS = new Set(Array.from(views, (view) => view.id));
let lastHandledRouteUrl = '';

function currentRouteUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function routeStateFromLocation() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { viewId: 'about', interestId: null, valid: true };
  const [rawView, rawInterest] = raw.split('/');
  let viewId = 'about';
  let interestId = null;
  let valid = true;
  try {
    const decodedView = decodeURIComponent(rawView || '');
    if (VALID_VIEW_IDS.has(decodedView)) viewId = decodedView;
    else valid = false;
    if (viewId === 'research' && rawInterest) interestId = decodeURIComponent(rawInterest);
  } catch {
    return { viewId: 'about', interestId: null, valid: false };
  }
  return { viewId, interestId, valid };
}

function routeUrl(viewId) {
  const url = new URL(window.location.href);
  url.hash = viewId === 'about'
    ? ''
    : viewId === 'research' && activeInterestId
      ? `research/${encodeURIComponent(activeInterestId)}`
      : encodeURIComponent(viewId);
  return `${url.pathname}${url.search}${url.hash}`;
}

function updateRoute(viewId, historyMode = 'push') {
  if (!['push', 'replace'].includes(historyMode)) return;
  const nextUrl = routeUrl(viewId);
  const currentUrl = currentRouteUrl();
  if (nextUrl === currentUrl) return;
  window.history[`${historyMode}State`]({ viewId, interestId: viewId === 'research' ? activeInterestId : null }, '', nextUrl);
  lastHandledRouteUrl = nextUrl;
}

function updateViewDocumentTitle(viewId) {
  if (viewId === 'about') {
    document.title = currentLang === 'zh'
      ? 'Chenxu Wang (wcx12) | 机器学习研究者'
      : 'Chenxu Wang (wcx12) | Machine Learning Researcher';
    return;
  }
  const label = i18n[currentLang][`tab_${viewId}`] || viewId;
  const interest = viewId === 'research' ? interestLabel(activeInterestId) : '';
  const sectionTitle = interest || label;
  const displayTitle = currentLang === 'en'
    ? `${sectionTitle.charAt(0).toUpperCase()}${sectionTitle.slice(1)}`
    : sectionTitle;
  document.title = `${displayTitle} | Chenxu Wang (wcx12)`;
}

function lazyFeatureStatus(viewId, message, state = 'loading') {
  const status = document.getElementById(viewId === 'research' ? 'interestCanvasStatus' : 'repoMapHint');
  const canvas = document.getElementById(viewId === 'research' ? 'interestCanvas' : 'repoMap');
  if (status && message) status.textContent = message;
  if (canvas) {
    canvas.dataset.featureState = state;
    canvas.setAttribute('aria-busy', String(state === 'loading'));
  }
}

function currentFeatureContext() {
  return {
    lang: currentLang,
    reducedMotion: reducedMotionQuery.matches,
    theme: currentTheme
  };
}

function researchCanvasModuleUrl() {
  const attempt = researchCanvasImportAttempt++;
  return versionedModuleUrl('./research-canvas.js', attempt ? { retry: attempt } : {});
}

function repoMapModuleUrl() {
  const attempt = repoMapImportAttempt++;
  return versionedModuleUrl('./repo-map.js', attempt ? { retry: attempt } : {});
}

function ensureResearchCanvasFeature() {
  if (!researchCanvasImportPromise) {
    researchCanvasImportPromise = import(researchCanvasModuleUrl())
      .then(({ createResearchCanvas }) => {
        researchCanvasFeature = createResearchCanvas({
          getActiveEntry: activeInterestEntry,
          getContext: currentFeatureContext,
          getPrimaryInterestId: primaryInterestId,
          requestMotionFrame: scheduleMotionLoop
        });
        if (pendingResearchBinding) {
          researchCanvasFeature.bindItem(...pendingResearchBinding);
          pendingResearchBinding = null;
        }
        return researchCanvasFeature;
      })
      .catch((error) => {
        researchCanvasImportPromise = null;
        throw error;
      });
  }
  return researchCanvasImportPromise;
}

function ensureRepoMapFeature() {
  if (!repoMapImportPromise) {
    repoMapImportPromise = import(repoMapModuleUrl())
      .then(({ createRepoMap }) => {
        repoMapFeature = createRepoMap({
          getContext: () => ({
            ...currentFeatureContext(),
            highlightedRepo,
            i18n,
            interests: researchInterests,
            repos: filteredRepos,
            sortedRepos
          }),
          getInterestEntries: repoInterestEntries,
          openRepo: openRepoDetail,
          openResearch: jumpToResearchInterest,
          requestMotionFrame: scheduleMotionLoop
        });
        return repoMapFeature;
      })
      .catch((error) => {
        repoMapImportPromise = null;
        throw error;
      });
  }
  return repoMapImportPromise;
}

function isCurrentActivation(viewId, generation) {
  return generation === activationGeneration && document.getElementById(viewId)?.classList.contains('active');
}

async function activateLazyFeature(viewId, generation, options = {}) {
  if (!['research', 'projects'].includes(viewId)) return;
  const loadingText = currentLang === 'zh' ? '正在加载交互视图…' : 'Loading interactive view...';
  const failureText = currentLang === 'zh'
    ? '交互视图加载失败；文本内容仍可使用。'
    : 'Interactive view unavailable; textual content remains available.';
  lazyFeatureStatus(viewId, loadingText);
  try {
    const feature = viewId === 'research'
      ? await ensureResearchCanvasFeature()
      : await ensureRepoMapFeature();
    if (!isCurrentActivation(viewId, generation)) return;
    feature.contextChanged();
    feature.render();
    lazyFeatureStatus(viewId, '', 'ready');
    scheduleMotionLoop({ immediate: true });
    if (options.scrollFeature) {
      requestAnimationFrame(() => {
        if (isCurrentActivation(viewId, generation)) feature.scrollIntoView();
      });
    }
  } catch (error) {
    console.error(`Unable to load ${viewId} interactive feature`, error);
    if (isCurrentActivation(viewId, generation)) lazyFeatureStatus(viewId, failureText, 'error');
  }
}

function renderLazyView(viewId) {
  if (viewId === 'projects') renderRepos(filteredRepos);
  else if (viewId === 'research') renderResearchInterest();
  else if (viewId === 'publications') renderPublications();
  else if (viewId === 'writing') renderWriting();
}

function refreshInitializedView(viewId) {
  if (initializedViews.has(viewId)) renderLazyView(viewId);
}

function ensureReposLoaded() {
  if (!reposLoadPromise) reposLoadPromise = loadRepos();
  return reposLoadPromise;
}

function ensurePublicationsLoaded() {
  if (!publicationsLoadPromise) publicationsLoadPromise = loadPublications();
  return publicationsLoadPromise;
}

function ensureBlogPostsLoaded() {
  if (!blogPostsLoadPromise) blogPostsLoadPromise = loadBlogPosts();
  return blogPostsLoadPromise;
}

function ensureResearchConfigLoaded() {
  if (!researchConfigLoadPromise) researchConfigLoadPromise = loadRemoteResearchConfig();
  return researchConfigLoadPromise;
}

function ensureViewData(viewId) {
  const tasks = [];
  if (['research', 'projects'].includes(viewId)) tasks.push(ensureReposLoaded());
  if (['research', 'publications'].includes(viewId)) tasks.push(ensurePublicationsLoaded());
  if (['research', 'writing'].includes(viewId)) tasks.push(ensureBlogPostsLoaded());
  if (LAZY_VIEW_IDS.has(viewId)) tasks.push(ensureResearchConfigLoaded());
  return Promise.allSettled(tasks);
}

function activateView(viewId, options = {}) {
  const { historyMode = 'push', scroll = true, scrollFeature = false } = options;
  const resolvedViewId = VALID_VIEW_IDS.has(viewId) ? viewId : 'about';
  const generation = ++activationGeneration;
  commands.forEach((command) => {
    const active = command.dataset.view === resolvedViewId;
    command.classList.toggle('active', active);
    if (active) command.setAttribute('aria-current', 'page');
    else command.removeAttribute('aria-current');
  });
  views.forEach((v) => v.classList.remove('active'));
  const targetView = document.getElementById(resolvedViewId);
  if (targetView) targetView.classList.add('active');
  if (LAZY_VIEW_IDS.has(resolvedViewId)) {
    initializedViews.add(resolvedViewId);
    void ensureViewData(resolvedViewId);
    requestAnimationFrame(() => {
      if (!isCurrentActivation(resolvedViewId, generation)) return;
      requestAnimationFrame(() => {
        if (!isCurrentActivation(resolvedViewId, generation)) return;
        renderLazyView(resolvedViewId);
        void activateLazyFeature(resolvedViewId, generation, { scrollFeature });
      });
    });
  }
  if (scroll && targetView && ['projects', 'research', 'publications', 'writing'].includes(resolvedViewId)) {
    requestAnimationFrame(() => {
      if (isCurrentActivation(resolvedViewId, generation)) {
        targetView.closest('.console')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  updateViewDocumentTitle(resolvedViewId);
  updateRoute(resolvedViewId, historyMode);
  scheduleMotionLoop({ immediate: true });
  return generation;
}

function applyLocationRoute(options = {}) {
  const { scroll = false, finalize = false } = options;
  const route = routeStateFromLocation();
  if (route.viewId === 'research' && route.interestId && interestEntryById(route.interestId)) {
    activeInterestId = route.interestId;
  }
  activateView(route.viewId, { historyMode: 'none', scroll });
  if (finalize) {
    if (!route.valid) updateRoute('about', 'replace');
    else if (route.viewId === 'research' && route.interestId && !interestEntryById(route.interestId)) {
      updateRoute('research', 'replace');
    }
  }
}

function handleLocationNavigation() {
  const routeUrlValue = currentRouteUrl();
  if (routeUrlValue === lastHandledRouteUrl) return;
  lastHandledRouteUrl = routeUrlValue;
  applyLocationRoute({ scroll: false, finalize: true });
}

commands.forEach((btn) => btn.addEventListener('click', () => activateView(btn.dataset.view)));
window.addEventListener('popstate', handleLocationNavigation);
window.addEventListener('hashchange', handleLocationNavigation);
openResearch.addEventListener('click', () => {
  activateView('research');
});

function commandItems() {
  const viewItems = Array.from(commands).map((btn) => ({
    title: btn.textContent,
    detail: i18n[currentLang].command_jump,
    type: i18n[currentLang].command_palette,
    kind: 'view',
    viewId: btn.dataset.view,
    action: () => activateView(btn.dataset.view)
  }));

  const utilityItems = [
    {
      title: i18n[currentLang].command_search_repos,
      detail: '/',
      type: i18n[currentLang].command_search,
      kind: 'utility',
      action: () => {
        activateView('projects');
        repoSearch.focus();
      }
    },
    {
      title: i18n[currentLang].command_search_research,
      detail: i18n[currentLang].featured_research_label,
      type: i18n[currentLang].command_search,
      kind: 'utility',
      action: () => activateView('research')
    },
    {
      title: i18n[currentLang].command_search_papers,
      detail: i18n[currentLang].tab_publications,
      type: i18n[currentLang].command_search,
      kind: 'utility',
      action: () => activateView('publications')
    },
    {
      title: i18n[currentLang].command_search_writing,
      detail: i18n[currentLang].tab_writing,
      type: i18n[currentLang].command_search,
      kind: 'utility',
      action: () => {
        activateView('writing');
        writingSearch?.focus();
      }
    },
    {
      title: i18n[currentLang].command_theme,
      detail: currentTheme,
      type: i18n[currentLang].command_run,
      kind: 'theme',
      action: () => {
        const order = ['neon', 'warm', 'mono'];
        applyTheme(order[(order.indexOf(currentTheme) + 1) % order.length]);
      }
    },
    {
      title: i18n[currentLang].command_toggle_lang,
      detail: i18n[currentLang].lang_btn,
      type: i18n[currentLang].command_run,
      kind: 'utility',
      action: () => langToggle.click()
    },
    {
      title: i18n[currentLang].command_github,
      detail: 'github.com/wcx12',
      type: i18n[currentLang].command_open,
      kind: 'external',
      action: () => window.open('https://github.com/wcx12', '_blank', 'noreferrer')
    },
    {
      title: i18n[currentLang].command_orcid,
      detail: ORCID_ID,
      type: i18n[currentLang].command_open,
      kind: 'external',
      action: () => window.open(`https://orcid.org/${ORCID_ID}`, '_blank', 'noreferrer')
    }
  ];

  const researchItems = allInterestChildren().map(({ domain, child }) => ({
    title: textFor(child.title),
    detail: `${textFor(domain.title)} / ${textFor(child.label)}`,
    type: i18n[currentLang].tab_research,
    kind: 'research',
    interestId: child.id,
    action: () => jumpToResearchInterest(child.id)
  }));

  const paperItems = currentPublications().map((paper) => ({
    title: paper.title,
    detail: `${paper.venue || ''} ${paper.year || ''}`.trim() || i18n[currentLang].tab_publications,
    type: i18n[currentLang].tab_publications,
    kind: 'paper',
    paperTitle: paper.title,
    action: () => openPaperDetail(paper.title)
  }));

  const postItems = blogPosts.map((post) => ({
    title: post.title,
    detail: `${post.category || ''} ${post.date || ''}`.trim() || i18n[currentLang].tab_writing,
    type: i18n[currentLang].tab_writing,
    kind: 'post',
    postSlug: post.slug,
    action: () => {
      window.location.href = postHref(post);
    }
  }));

  const repoItems = allRepos.map((repo) => ({
    title: repo.name,
    detail: repo.description || i18n[currentLang].no_desc,
    type: i18n[currentLang].command_repo,
    kind: 'repo',
    repoName: repo.name,
    action: () => openRepoDetail(repo.name)
  }));

  return [...utilityItems, ...viewItems, ...researchItems, ...paperItems, ...postItems, ...repoItems];
}

function filteredCommandItems() {
  const query = commandInput.value.trim().toLowerCase();
  const items = commandItems();
  if (!query) return items.slice(0, 12);
  return items
    .filter((item) => `${item.title} ${item.detail} ${item.type}`.toLowerCase().includes(query))
    .slice(0, 12);
}

function renderCommandPreview(item) {
  if (!commandPreview) return;
  if (!item) {
    commandPreview.innerHTML = `<p>${escapeHtml(i18n[currentLang].command_empty)}</p>`;
    return;
  }

  let title = item.title;
  let detail = item.detail;
  const tags = [item.type];
  if (item.kind === 'research') {
    const entry = interestEntryById(item.interestId);
    if (entry) {
      title = `${textFor(entry.domain.title)} / ${textFor(entry.child.title)}`;
      detail = textFor(entry.child.description);
      tags.push(textFor(entry.child.label));
      tags.push(`${interestMetrics(entry.child.id).projects} ${i18n[currentLang].preview_projects}`);
      tags.push(`${interestMetrics(entry.child.id).papers} ${i18n[currentLang].preview_papers}`);
      tags.push(`${interestMetrics(entry.child.id).posts} ${i18n[currentLang].tab_writing}`);
    }
  } else if (item.kind === 'repo') {
    const repo = allRepos.find((entry) => entry.name === item.repoName);
    if (repo) {
      detail = repo.description || i18n[currentLang].no_desc;
      tags.push(repoMappingLabel(repo));
      tags.push(repo.language || i18n[currentLang].mixed);
      tags.push(`${i18n[currentLang].star} ${repo.stargazers_count || 0}`);
    }
  } else if (item.kind === 'paper') {
    const paper = currentPublications().find((entry) => entry.title === item.paperTitle);
    if (paper) {
      detail = paper.summary || item.detail;
      tags.push(paper.venue || i18n[currentLang].tab_publications);
      tags.push(String(paper.year || ''));
      const paperInterest = primaryInterestId(paper, 'paper');
      if (paperInterest) tags.push(interestLabel(paperInterest));
    }
  } else if (item.kind === 'post') {
    const post = blogPosts.find((entry) => entry.slug === item.postSlug);
    if (post) {
      detail = post.description || item.detail;
      tags.push(post.category || i18n[currentLang].tab_writing);
      tags.push(postReadTime(post));
      (post.tags || []).slice(0, 2).forEach((tag) => tags.push(tag));
    }
  } else if (item.kind === 'theme') {
    tags.push(currentTheme);
    detail = currentLang === 'zh'
      ? '切换当前页面色调，并保留你的选择。'
      : 'Switch the page color tone and keep the selection.';
  }
  const detailHtml = item.kind === 'repo'
    ? languageAwareHtml(detail || '')
    : escapeHtml(detail || '');

  commandPreview.innerHTML = `
    <span class="panel-eyebrow">${escapeHtml(item.type)}</span>
    <h3>${escapeHtml(title)}</h3>
    <p>${detailHtml}</p>
    <div class="command-preview-tags">
      ${tags.filter(Boolean).slice(0, 5).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
    </div>
  `;
}

function renderCommandList() {
  const items = filteredCommandItems();
  commandCursor = Math.min(commandCursor, Math.max(items.length - 1, 0));
  if (!items.length) {
    commandList.innerHTML = `<p class="muted">${i18n[currentLang].command_empty}</p>`;
    renderCommandPreview(null);
    return;
  }

  commandList.innerHTML = items.map((item, index) => `
    <button class="command-item ${index === commandCursor ? 'active' : ''}" type="button" data-index="${index}">
      <span><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></span>
      <span class="command-shortcut">${escapeHtml(item.type)}</span>
    </button>
  `).join('');

  commandList.querySelectorAll('.command-item').forEach((button) => {
    button.addEventListener('mouseenter', () => {
      commandCursor = Number(button.dataset.index);
      renderCommandList();
    });
    button.addEventListener('click', () => {
      const item = filteredCommandItems()[Number(button.dataset.index)];
      if (item) {
        closeCommandPalette();
        item.action();
      }
    });
  });
  renderCommandPreview(items[commandCursor]);
}

const OVERLAY_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function setOverlayActive(overlay, active) {
  if (!overlay) return;
  if (active) activeOverlayElements.add(overlay);
  else activeOverlayElements.delete(overlay);
  const pageIsInert = activeOverlayElements.size > 0;
  pageBackgroundElements.forEach((element) => {
    element.inert = pageIsInert;
    element.toggleAttribute('inert', pageIsInert);
  });
}

function overlayFocusableElements(overlay) {
  return Array.from(overlay.querySelectorAll(OVERLAY_FOCUSABLE_SELECTOR))
    .filter((element) => element instanceof HTMLElement && element.offsetParent !== null);
}

function handleOverlayKeydown(event, overlay, closeOverlay) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeOverlay();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = overlayFocusableElements(overlay);
  if (!focusable.length) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!overlay.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function restoreOverlayFocus(element) {
  if (element?.isConnected) element.focus();
}

function openCommandPalette() {
  if (!commandPalette.classList.contains('open') && document.activeElement instanceof HTMLElement) {
    commandReturnFocus = document.activeElement;
  }
  commandPalette.classList.add('open');
  commandPalette.setAttribute('aria-hidden', 'false');
  setOverlayActive(commandPalette, true);
  commandInput.value = '';
  commandCursor = 0;
  renderCommandList();
  void ensureViewData('research').then(() => {
    if (commandPalette.classList.contains('open')) renderCommandList();
  });
  requestAnimationFrame(() => commandInput.focus());
}

function closeCommandPalette() {
  const wasOpen = commandPalette.classList.contains('open');
  commandPalette.classList.remove('open');
  commandPalette.setAttribute('aria-hidden', 'true');
  setOverlayActive(commandPalette, false);
  if (wasOpen) restoreOverlayFocus(commandReturnFocus);
  commandReturnFocus = null;
}

openCommand.addEventListener('click', openCommandPalette);
commandClose?.addEventListener('click', closeCommandPalette);
commandPalette.addEventListener('keydown', (event) => handleOverlayKeydown(event, commandPalette, closeCommandPalette));
commandPalette.addEventListener('click', (event) => {
  if (event.target === commandPalette) closeCommandPalette();
});
commandInput.addEventListener('input', () => {
  commandCursor = 0;
  renderCommandList();
});
commandInput.addEventListener('keydown', (event) => {
  const items = filteredCommandItems();
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    commandCursor = Math.min(commandCursor + 1, Math.max(items.length - 1, 0));
    renderCommandList();
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    commandCursor = Math.max(commandCursor - 1, 0);
    renderCommandList();
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    const item = items[commandCursor];
    if (item) {
      closeCommandPalette();
      item.action();
    }
  }
});

function textFor(value) {
  if (typeof value === 'string') return value;
  return value?.[currentLang] || value?.en || '';
}

function researchPageHref(interestId) {
  return `./research/${encodeURIComponent(interestId)}/`;
}

function useInteractiveResearchNavigation(event) {
  return event.button === 0
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey;
}

function allInterestChildren() {
  return researchInterests.flatMap((domain) => domain.children.map((child) => ({ domain, child })));
}

function updateHeroStats() {
  if (!focusAreaCount) return;
  const domainCount = researchInterests.filter((domain) => Array.isArray(domain.children) && domain.children.length).length;
  focusAreaCount.textContent = String(domainCount);
}

function activeInterestEntry() {
  return allInterestChildren().find((entry) => entry.child.id === activeInterestId) || allInterestChildren()[0];
}

function renderInterestRail() {
  interestRail.innerHTML = researchInterests.map((domain) => `
    <section class="interest-domain">
      <div class="interest-domain-head">
        <strong>${escapeHtml(textFor(domain.title))}</strong>
        <span>${escapeHtml(textFor(domain.label))}</span>
      </div>
      ${domain.children.map((child) => `
        <a class="interest-child ${child.id === activeInterestId ? 'active' : ''}" href="${researchPageHref(child.id)}" data-interest="${escapeHtml(child.id)}" ${child.id === activeInterestId ? 'aria-current="page"' : ''}>
          ${escapeHtml(textFor(child.title))}
          <small>${escapeHtml(textFor(child.label))}</small>
        </a>
      `).join('')}
    </section>
  `).join('');

  interestRail.querySelectorAll('.interest-child').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!useInteractiveResearchNavigation(event)) return;
      event.preventDefault();
      activeInterestId = link.dataset.interest;
      renderResearchInterest();
      updateViewDocumentTitle('research');
      updateRoute('research', 'push');
    });
  });
}

function inferInterestIds(item) {
  const hay = `${item.name || ''} ${item.title || ''} ${item.description || ''} ${item.summary || ''}`.toLowerCase();
  const matches = [];
  const hasMedicalImageContext = hay.includes('medical image')
    || hay.includes('medical imaging')
    || (hay.includes('medical') && (hay.includes('image') || hay.includes('classification') || hay.includes('segmentation')));
  const hasVisionActiveLearningTask = hay.includes('active learning')
    && (hay.includes('image') || hay.includes('classification') || hay.includes('vision'));
  const ai4eduSignals = [
    'education',
    'educational',
    'classroom',
    'course',
    'teaching',
    'teacher',
    'student',
    'learning tool',
    'learning tools',
    'learning/game',
    'practice generation',
    'knowledge tracing',
    'math',
    'mathematics',
    '数学'
  ];
  if (hay.includes('vpr') || hay.includes('visual place') || hay.includes('localization')) matches.push('vpr');
  if (hasMedicalImageContext || hasVisionActiveLearningTask) matches.push('medical-image-analysis');
  if (hay.includes('point') || hay.includes('cloud') || hay.includes('registration') || hay.includes('geometry')) matches.push('point-cloud-registration');
  if (hay.includes('agent') || hay.includes('llm') || hay.includes('codex') || hay.includes('rag')) matches.push('agent');
  if (ai4eduSignals.some((term) => hay.includes(term))) matches.push('ai4edu');
  return matches;
}

function itemKey(item) {
  return item.name || item.title;
}

function assignedInterestIds(item, kind) {
  if (kind === 'post') return Array.isArray(item.research) ? item.research : inferInterestIds(item);
  const map = kind === 'repo' ? researchConfig.repoAssignments : researchConfig.paperAssignments;
  const key = itemKey(item);
  if (Array.isArray(map[key])) return map[key];
  if (kind === 'repo') return [];
  if (Array.isArray(item.interests)) return item.interests;
  return inferInterestIds(item);
}

function interestEntryById(interestId) {
  return allInterestChildren().find((entry) => entry.child.id === interestId) || null;
}

function interestLabel(interestId) {
  const entry = interestEntryById(interestId);
  return entry ? textFor(entry.child.title) : interestId;
}

function primaryInterestId(item, kind) {
  return assignedInterestIds(item, kind).find((id) => interestEntryById(id)) || null;
}

function fallbackPublicCategory(item, kind) {
  const key = String(itemKey(item) || '').toLowerCase();
  const isProfile = kind === 'repo' && key === GITHUB_OWNER.toLowerCase();
  return isProfile
    ? {
      title: i18n[currentLang].fallback_profile_title,
      label: i18n[currentLang].fallback_profile_label,
      className: 'profile'
    }
    : {
      title: i18n[currentLang].fallback_general_title,
      label: i18n[currentLang].fallback_general_label,
      className: 'general'
    };
}

function researchBadgesHtml(item, kind) {
  const ids = assignedInterestIds(item, kind).filter((id) => interestEntryById(id));
  if (!ids.length) {
    const fallback = fallbackPublicCategory(item, kind);
    if (kind === 'repo' && fallback.className !== 'profile') return '';
    return `<span class="research-badge fallback ${escapeHtml(fallback.className)}">${escapeHtml(fallback.title)}</span>`;
  }
  const sourceKey = escapeHtml(itemKey(item));
  const sourceKind = escapeHtml(kind);
  return ids.map((id) => `
    <button class="research-badge" type="button" data-interest-jump="${escapeHtml(id)}" data-interest-source-kind="${sourceKind}" data-interest-source-key="${sourceKey}">
      ${escapeHtml(interestLabel(id))}
    </button>
  `).join('');
}

function attachInterestJumpHandlers(root = document) {
  root.querySelectorAll('[data-interest-jump]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const sourceKind = button.dataset.interestSourceKind;
      const sourceKey = button.dataset.interestSourceKey;
      const item = sourceKind === 'repo'
        ? allRepos.find((repo) => repo.name === sourceKey)
        : sourceKind === 'post'
          ? blogPosts.find((post) => post.title === sourceKey)
          : currentPublications().find((paper) => paper.title === sourceKey);
      if (item) bindItemToInterestAnimation(item, sourceKind, button.dataset.interestJump);
      jumpToResearchInterest(button.dataset.interestJump);
    });
  });
}

function setInterestPanel(panel) {
  activeInterestPanel = ['animation', 'projects', 'papers', 'writing'].includes(panel) ? panel : 'animation';
  if (interestDetail) interestDetail.dataset.panel = activeInterestPanel;
  interestSectionTabs.forEach((button) => {
    const active = button.dataset.interestPanel === activeInterestPanel;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

function bindItemToInterestAnimation(item, kind, interestId) {
  if (!item) return;
  const resolvedInterestId = interestId || primaryInterestId(item, kind);
  if (!resolvedInterestId) return;
  pendingResearchBinding = [item, kind, resolvedInterestId];
  if (researchCanvasFeature) {
    researchCanvasFeature.bindItem(...pendingResearchBinding);
    pendingResearchBinding = null;
  }
}

function bindRepoToInterestAnimation(repo, interestId) {
  bindItemToInterestAnimation(repo, 'repo', interestId);
}

function jumpToResearchInterest(interestId, repoName = null) {
  if (!interestEntryById(interestId)) return;
  activeInterestId = interestId;
  const repo = repoName ? allRepos.find((item) => item.name === repoName) : null;
  if (repo) bindRepoToInterestAnimation(repo, interestId);
  setInterestPanel('animation');
  activateView('research', { scrollFeature: true });
}

function focusRepoInProjects(repoName) {
  highlightedRepo = repoName;
  repoSearch.value = '';
  filteredRepos = [...allRepos];
  const repoIndex = sortedRepos(filteredRepos).findIndex((repo) => repo.name === repoName);
  repoState.page = repoIndex >= 0 ? Math.floor(repoIndex / repoState.pageSize) + 1 : 1;
  repoState.infiniteCount = repoIndex >= 0 ? Math.max(repoState.pageSize, repoIndex + 1) : repoState.pageSize;
  const generation = activateView('projects');
  renderRepos(filteredRepos);
  requestAnimationFrame(() => {
    if (!isCurrentActivation('projects', generation)) return;
    const card = Array.from(document.querySelectorAll('[data-repo]')).find((node) => node.dataset.repo === repoName);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    repoMapFeature?.scrollIntoView();
  });
}

function focusPaperInPublications(title) {
  highlightedPaper = title;
  const paperIndex = currentPublications().findIndex((paper) => paper.title === title);
  pubState.page = paperIndex >= 0 ? Math.floor(paperIndex / pubState.pageSize) + 1 : 1;
  pubState.infiniteCount = paperIndex >= 0 ? Math.max(pubState.pageSize, paperIndex + 1) : pubState.pageSize;
  activateView('publications');
  renderPublications();
  requestAnimationFrame(() => {
    const card = Array.from(document.querySelectorAll('[data-paper-card]')).find((node) => node.dataset.paperCard === title);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function relatedRepos() {
  return allRepos.filter((repo) => assignedInterestIds(repo, 'repo').includes(activeInterestId));
}

function relatedPapers() {
  return currentPublications().filter((paper) => assignedInterestIds(paper, 'paper').includes(activeInterestId));
}

function relatedPosts() {
  return blogPosts.filter((post) => assignedInterestIds(post, 'post').includes(activeInterestId));
}

function postHref(post) {
  const url = String(post.url || '').replace(/^\.?\//, '');
  return url ? `./${url}` : './blog/';
}

function postDate(post) {
  if (!post.date) return '';
  return new Date(`${post.date}T00:00:00`).toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function postReadTime(post) {
  return i18n[currentLang].writing_minutes.replace('{minutes}', String(post.readingMinutes || 1));
}

function renderWritingCard(post, compact = false) {
  const title = escapeHtml(post.title || i18n[currentLang].writing_title);
  const description = escapeHtml(post.description || '');
  const href = escapeHtml(postHref(post));
  const tags = (post.tags || []).slice(0, compact ? 2 : 4)
    .map((tag) => `<span class="research-badge">${escapeHtml(tag)}</span>`)
    .join('');
  return `
    <article class="writing-card interactive-card motion-card" data-motion-card data-motion-key="post-${escapeHtml(post.slug || title)}">
      <div class="writing-card-meta">
        <span>${escapeHtml(postDate(post))}</span>
        <span>${escapeHtml(post.category || '')}</span>
        <span>${escapeHtml(postReadTime(post))}</span>
      </div>
      <h3><a href="${href}">${title}</a></h3>
      <p class="muted">${description}</p>
      <div class="research-badges">${researchBadgesHtml(post, 'post')}${tags}</div>
      <div class="related-actions">
        <a class="mini-action" href="${href}">${i18n[currentLang].writing_read}</a>
      </div>
    </article>
  `;
}

function applyWritingFilter() {
  const query = (writingSearch?.value || '').trim().toLowerCase();
  filteredBlogPosts = blogPosts.filter((post) => {
    const haystack = `${post.title || ''} ${post.description || ''} ${post.category || ''} ${(post.tags || []).join(' ')} ${(post.research || []).join(' ')}`.toLowerCase();
    return haystack.includes(query);
  });
  renderWriting();
}

function renderWriting() {
  if (!writingList || !writingFeatured || !writingCount) return;
  const posts = filteredBlogPosts.length || (writingSearch?.value || '').trim() ? filteredBlogPosts : blogPosts;
  const featured = posts.filter((post) => post.featured).slice(0, 3);
  const featuredSlugs = new Set(featured.map((post) => post.slug));
  const listPosts = posts.filter((post) => !featuredSlugs.has(post.slug));
  writingCount.textContent = i18n[currentLang].writing_count
    .replace('{shown}', String(posts.length))
    .replace('{total}', String(blogPosts.length));

  writingFeatured.innerHTML = featured.length
    ? featured.map((post) => renderWritingCard(post, true)).join('')
    : `<p class="muted">${i18n[currentLang].writing_empty}</p>`;

  writingList.innerHTML = listPosts.map((post) => renderWritingCard(post)).join('');

  attachInterestJumpHandlers(writingList);
  attachInterestJumpHandlers(writingFeatured);
  attachInteractiveCards(writingList);
  attachInteractiveCards(writingFeatured);
}

function isResearchViewActive() {
  return document.getElementById('research')?.classList.contains('active');
}

function isProjectsViewActive() {
  return document.getElementById('projects')?.classList.contains('active');
}

function renderRelatedList(container, items, emptyText, kind) {
  if (!items.length) {
    container.innerHTML = `<p class="muted">${escapeHtml(emptyText)}</p>`;
    return;
  }

  container.innerHTML = items.slice(0, 4).map((item) => {
    const rawTitle = item.name || item.title || '';
    const title = escapeHtml(rawTitle);
    const rawDetail = item.description || item.summary || item.language || item.venue || '';
    const detail = kind === 'repo' ? languageAwareHtml(rawDetail) : escapeHtml(rawDetail);
    const rawMeta = kind === 'repo'
      ? `${item.language || i18n[currentLang].mixed} · ${i18n[currentLang].star} ${item.stargazers_count || 0}`
      : kind === 'post'
        ? `${item.category || i18n[currentLang].tab_writing} · ${postReadTime(item)}`
        : `${item.venue || ''} · ${item.year || ''}`;
    const meta = escapeHtml(rawMeta);
    const safeKind = escapeHtml(kind);
    const action = kind === 'repo'
      ? `<button class="mini-action" type="button" data-show-project="${title}">${i18n[currentLang].show_in_projects}</button>`
      : kind === 'post'
        ? `<a class="mini-action" href="${escapeHtml(postHref(item))}">${i18n[currentLang].writing_read}</a>`
        : `<button class="mini-action" type="button" data-show-paper="${title}">${i18n[currentLang].tab_publications}</button>`;
    return `
      <div class="related-item">
        <button class="related-link" type="button" data-kind="${safeKind}" data-key="${title}">${title}</button>
        <div class="research-badges">${researchBadgesHtml(item, kind)}</div>
        <p class="muted">${detail}</p>
        <p class="muted">${meta}</p>
        <div class="related-actions">${action}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.related-link').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.kind === 'repo') {
        const repo = allRepos.find((item) => item.name === button.dataset.key);
        bindRepoToInterestAnimation(repo, activeInterestId);
        openRepoReadme(button.dataset.key);
      }
      else if (button.dataset.kind === 'post') {
        const post = blogPosts.find((item) => item.title === button.dataset.key);
        if (post) window.location.href = postHref(post);
      }
      else {
        const paper = currentPublications().find((item) => item.title === button.dataset.key);
        bindItemToInterestAnimation(paper, 'paper', activeInterestId);
        openPaperDetail(button.dataset.key);
      }
    });
  });
  container.querySelectorAll('[data-show-project]').forEach((button) => {
    button.addEventListener('click', () => focusRepoInProjects(button.dataset.showProject));
  });
  container.querySelectorAll('[data-show-paper]').forEach((button) => {
    button.addEventListener('click', () => focusPaperInPublications(button.dataset.showPaper));
  });
  attachInterestJumpHandlers(container);
}

function interestMetrics(interestId) {
  return {
    projects: allRepos.filter((repo) => assignedInterestIds(repo, 'repo').includes(interestId)).length,
    papers: currentPublications().filter((paper) => assignedInterestIds(paper, 'paper').includes(interestId)).length,
    posts: blogPosts.filter((post) => assignedInterestIds(post, 'post').includes(interestId)).length
  };
}

function snapshotMotionCards(container) {
  if (!container) return new Map();
  return new Map(Array.from(container.querySelectorAll('[data-motion-card]')).map((node) => [
    node.dataset.motionKey || node.dataset.repo || node.dataset.paperCard || node.dataset.showcaseInterest || '',
    node.getBoundingClientRect()
  ]));
}

function animateGridTransition(container, previousCards = new Map()) {
  if (!container || reducedMotionQuery.matches || previousCards.size === 0) return;
  const cards = Array.from(container.querySelectorAll('[data-motion-card]'));
  cards.forEach((card, index) => {
    const key = card.dataset.motionKey || card.dataset.repo || card.dataset.paperCard || card.dataset.showcaseInterest || '';
    const next = card.getBoundingClientRect();
    const previous = previousCards.get(key);
    const dx = previous ? previous.left - next.left : 0;
    const dy = previous ? previous.top - next.top : 8;
    card.style.transition = 'none';
    card.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    card.style.opacity = previous ? '0.78' : '0';
    requestAnimationFrame(() => {
      card.style.transition = `transform 220ms ease ${Math.min(index, 8) * 18}ms, opacity 180ms ease ${Math.min(index, 8) * 18}ms`;
      card.style.transform = '';
      card.style.opacity = '';
    });
  });
}

function attachInteractiveCards(root = document) {
  root.querySelectorAll('.interactive-card').forEach((card) => {
    if (card.dataset.interactiveBound === 'true') return;
    card.dataset.interactiveBound = 'true';
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
      const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100;
      card.style.setProperty('--pointer-x', `${x.toFixed(1)}%`);
      card.style.setProperty('--pointer-y', `${y.toFixed(1)}%`);
    }, { passive: true });
    card.addEventListener('pointerdown', () => card.classList.add('is-pressed'));
    card.addEventListener('pointerup', () => card.classList.remove('is-pressed'));
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-pressed');
      card.style.setProperty('--pointer-x', '50%');
      card.style.setProperty('--pointer-y', '50%');
    });
  });
}

function heroPreviewEntry() {
  const entries = allInterestChildren();
  if (!entries.length) return null;
  return interestEntryById(previewInterestId || activeInterestId) || entries[Math.floor(heroPreviewTick / 420) % entries.length];
}

function renderResearchShowcase() {
  if (!researchShowcase) return;
  const entries = allInterestChildren();
  if (!entries.length) {
    researchShowcase.innerHTML = '';
    return;
  }

  researchShowcase.innerHTML = entries.map(({ domain, child }, index) => {
    const metrics = interestMetrics(child.id);
    const activeClass = child.id === activeInterestId ? 'active' : '';
    return `
      <a class="research-showcase-card interactive-card motion-card ${activeClass}" href="${researchPageHref(child.id)}" data-motion-card data-motion-key="research-${escapeHtml(child.id)}" data-showcase-interest="${escapeHtml(child.id)}" style="--delay:${index}">
        <span class="panel-eyebrow">${escapeHtml(textFor(domain.title))}</span>
        <strong>${escapeHtml(textFor(child.title))}</strong>
        <span class="showcase-label">${escapeHtml(textFor(child.label))}</span>
        <span class="showcase-desc">${escapeHtml(textFor(child.description))}</span>
        <span class="showcase-metrics">
          <span>${metrics.projects} ${i18n[currentLang].preview_projects}</span>
          <span>${metrics.papers} ${i18n[currentLang].preview_papers}</span>
        </span>
      </a>
    `;
  }).join('');

  researchShowcase.querySelectorAll('[data-showcase-interest]').forEach((button) => {
    button.addEventListener('mouseenter', () => {
      previewInterestId = button.dataset.showcaseInterest;
      renderHeroPreview();
    });
    button.addEventListener('focus', () => {
      previewInterestId = button.dataset.showcaseInterest;
      renderHeroPreview();
    });
    button.addEventListener('click', (event) => {
      if (!useInteractiveResearchNavigation(event)) return;
      event.preventDefault();
      previewInterestId = null;
      jumpToResearchInterest(button.dataset.showcaseInterest);
    });
  });
  researchShowcase.onmouseleave = () => {
    previewInterestId = null;
    renderHeroPreview();
  };
  attachInteractiveCards(researchShowcase);
  animateGridTransition(researchShowcase);
}

function renderHeroPreview() {
  const entry = heroPreviewEntry();
  if (!entry || !heroPreviewMeta) return;
  const metrics = interestMetrics(entry.child.id);
  if (heroPreviewStatus) heroPreviewStatus.textContent = i18n[currentLang].hero_preview_live;
  heroPreviewMeta.innerHTML = `
    <a class="hero-preview-title" href="${researchPageHref(entry.child.id)}" data-hero-interest="${escapeHtml(entry.child.id)}">
      <span>${escapeHtml(textFor(entry.domain.title))}</span>
      <strong>${escapeHtml(textFor(entry.child.title))}</strong>
    </a>
    <p>${escapeHtml(textFor(entry.child.description))}</p>
    <div class="hero-preview-pills">
      <span>${metrics.projects} ${i18n[currentLang].preview_projects}</span>
      <span>${metrics.papers} ${i18n[currentLang].preview_papers}</span>
      <span>${i18n[currentLang].hero_preview_hint}</span>
    </div>
  `;
  heroPreviewMeta.querySelector('[data-hero-interest]')?.addEventListener('click', (event) => {
    if (!useInteractiveResearchNavigation(event)) return;
    event.preventDefault();
    jumpToResearchInterest(entry.child.id);
  });
  drawHeroPreviewCanvas();
}

const heroPreviewScenes = {
  'point-cloud': {
    accent: 'geometry',
    lines: [[0.18, 0.62, 0.42, 0.46], [0.42, 0.46, 0.68, 0.54], [0.68, 0.54, 0.82, 0.34]],
    nodes: [[0.18, 0.62], [0.28, 0.46], [0.38, 0.64], [0.52, 0.42], [0.66, 0.58], [0.78, 0.4]],
    panels: [[0.12, 0.2, 0.26, 0.28], [0.58, 0.28, 0.28, 0.34]]
  },
  vpr: {
    accent: 'route',
    lines: [[0.12, 0.7, 0.28, 0.52], [0.28, 0.52, 0.48, 0.6], [0.48, 0.6, 0.68, 0.38], [0.68, 0.38, 0.86, 0.5]],
    nodes: [[0.12, 0.7], [0.28, 0.52], [0.48, 0.6], [0.68, 0.38], [0.86, 0.5]],
    panels: [[0.1, 0.22, 0.2, 0.24], [0.4, 0.18, 0.2, 0.24], [0.7, 0.24, 0.2, 0.24]]
  },
  agent: {
    accent: 'workflow',
    lines: [[0.2, 0.52, 0.42, 0.42], [0.42, 0.42, 0.62, 0.52], [0.62, 0.52, 0.8, 0.36]],
    nodes: [[0.2, 0.52], [0.42, 0.42], [0.62, 0.52], [0.8, 0.36]],
    panels: [[0.1, 0.34, 0.22, 0.32], [0.38, 0.24, 0.22, 0.28], [0.68, 0.18, 0.22, 0.32]]
  },
  education: {
    accent: 'teaching',
    lines: [[0.2, 0.62, 0.48, 0.34], [0.48, 0.34, 0.74, 0.5]],
    nodes: [[0.2, 0.62], [0.48, 0.34], [0.74, 0.5], [0.82, 0.66]],
    panels: [[0.1, 0.18, 0.38, 0.28], [0.62, 0.28, 0.26, 0.34]]
  },
  'medical-image': {
    accent: 'analysis',
    lines: [[0.2, 0.32, 0.42, 0.42], [0.42, 0.42, 0.62, 0.36], [0.62, 0.36, 0.78, 0.56]],
    nodes: [[0.2, 0.32], [0.42, 0.42], [0.62, 0.36], [0.78, 0.56]],
    panels: [[0.12, 0.22, 0.2, 0.24], [0.34, 0.46, 0.2, 0.24], [0.58, 0.22, 0.2, 0.24]]
  },
  generic: {
    accent: 'research',
    lines: [[0.14, 0.58, 0.34, 0.42], [0.34, 0.42, 0.58, 0.52], [0.58, 0.52, 0.84, 0.34]],
    nodes: [[0.14, 0.58], [0.34, 0.42], [0.58, 0.52], [0.84, 0.34]],
    panels: [[0.12, 0.24, 0.24, 0.28], [0.62, 0.26, 0.26, 0.3]]
  }
};

function heroThemeColors() {
  return {
    primary: themeColor('--cyan') || '#00f5ff',
    secondary: themeColor('--pink') || '#ff2e88',
    text: themeColor('--text') || '#f7fbff',
    muted: themeColor('--muted') || '#9ca9cf'
  };
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncatedCanvasText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let output = text;
  while (output.length > 3 && ctx.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
}

function fillTruncatedText(ctx, text, x, y, maxWidth) {
  ctx.fillText(truncatedCanvasText(ctx, text, maxWidth), x, y);
}

function drawHeroPreviewCanvas() {
  if (!heroPreviewCanvas || !heroPreviewCtx) return;
  const rect = heroPreviewCanvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  const entry = heroPreviewEntry();
  if (!entry) return;
  const { width, height } = resizeDrawingCanvas(heroPreviewCanvas, heroPreviewCtx);
  const ctx = heroPreviewCtx;
  const colors = heroThemeColors();
  const t = heroPreviewTick * 0.05;
  const scene = heroPreviewScenes[entry.child.animation] || heroPreviewScenes.generic;
  drawHeroScenePreview(ctx, width, height, t, scene, colors, entry);
}

function drawHeroScenePreview(ctx, width, height, t, scene, colors, entry) {
  const { primary, secondary, text, muted } = colors;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(5, 9, 22, 0.96)';
  ctx.fillRect(0, 0, width, height);

  const pad = Math.max(18, Math.min(width, height) * 0.08);
  drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 18);
  ctx.fillStyle = colorWithAlpha(primary, 0.055);
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(primary, 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();

  const innerX = pad + 14;
  const innerY = pad + 14;
  const innerW = width - (pad + 14) * 2;
  const innerH = height - (pad + 14) * 2;
  const tick = reducedMotionQuery.matches ? 0.5 : (0.5 + Math.sin(t) * 0.5);

  scene.panels.forEach((panel, index) => {
    const [px, py, pw, ph] = panel;
    const x = innerX + px * innerW;
    const y = innerY + py * innerH;
    const w = pw * innerW;
    const h = ph * innerH;
    drawRoundedRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = colorWithAlpha(index % 2 ? secondary : primary, 0.11);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(index % 2 ? secondary : primary, 0.34);
    ctx.stroke();
    ctx.fillStyle = colorWithAlpha(text, 0.18);
    ctx.fillRect(x + 12, y + 14, Math.max(16, w * 0.54), 3);
    ctx.fillRect(x + 12, y + 27, Math.max(12, w * 0.34), 3);
  });

  ctx.lineWidth = 2;
  scene.lines.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(innerX + x1 * innerW, innerY + y1 * innerH);
    ctx.lineTo(innerX + x2 * innerW, innerY + y2 * innerH);
    ctx.strokeStyle = colorWithAlpha(primary, 0.34);
    ctx.stroke();
  });

  scene.nodes.forEach(([nx, ny], index) => {
    const x = innerX + nx * innerW;
    const y = innerY + ny * innerH;
    const active = index === Math.floor(tick * Math.max(1, scene.nodes.length - 1));
    ctx.beginPath();
    ctx.arc(x, y, active ? 7 : 4.4, 0, Math.PI * 2);
    ctx.fillStyle = active ? secondary : primary;
    ctx.fill();
    ctx.strokeStyle = active ? colorWithAlpha(secondary, 0.36) : colorWithAlpha(primary, 0.24);
    ctx.lineWidth = active ? 8 : 4;
    ctx.stroke();
  });

  const progressIndex = Math.min(scene.lines.length - 1, Math.floor(tick * scene.lines.length));
  const progress = scene.lines[progressIndex] || scene.lines[0];
  if (progress) {
    const phase = (tick * scene.lines.length) % 1;
    const x = innerX + (progress[0] + (progress[2] - progress[0]) * phase) * innerW;
    const y = innerY + (progress[1] + (progress[3] - progress[1]) * phase) * innerH;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = colorWithAlpha(secondary, 0.86);
    ctx.fill();
  }

  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillStyle = colorWithAlpha(muted, 0.86);
  fillTruncatedText(ctx, scene.accent.toUpperCase(), innerX, height - pad - 14, innerW * 0.38);
  ctx.textAlign = 'right';
  ctx.fillStyle = colorWithAlpha(text, 0.9);
  fillTruncatedText(ctx, textFor(entry.child.title), innerX + innerW, height - pad - 14, innerW * 0.52);
  ctx.textAlign = 'left';
}

function renderResearchInterest() {
  updateHeroStats();
  const entry = activeInterestEntry();
  if (!entry) {
    interestRail.innerHTML = '';
    interestPath.textContent = '';
    interestTitle.textContent = '';
    interestTag.textContent = '';
    interestDescription.textContent = '';
    interestProjects.innerHTML = `<p class="muted">${i18n[currentLang].no_related_projects}</p>`;
    interestPapers.innerHTML = `<p class="muted">${i18n[currentLang].no_related_papers}</p>`;
    if (interestPosts) interestPosts.innerHTML = `<p class="muted">${i18n[currentLang].no_related_writing}</p>`;
    renderResearchShowcase();
    renderHeroPreview();
    return;
  }
  interestPath.textContent = `${textFor(entry.domain.title)} / ${textFor(entry.child.title)}`;
  interestTitle.textContent = textFor(entry.child.title);
  interestTag.textContent = textFor(entry.child.label);
  interestDescription.textContent = textFor(entry.child.description);
  setInterestPanel(activeInterestPanel);
  renderInterestRail();
  renderRelatedList(interestProjects, relatedRepos(), i18n[currentLang].no_related_projects, 'repo');
  renderRelatedList(interestPapers, relatedPapers(), i18n[currentLang].no_related_papers, 'paper');
  if (interestPosts) renderRelatedList(interestPosts, relatedPosts(), i18n[currentLang].no_related_writing, 'post');
  renderResearchShowcase();
  renderHeroPreview();
  if (isResearchViewActive()) researchCanvasFeature?.render();
}

function runThemeTransition(source = themeSelect) {
  if (!themeTransition || reducedMotionQuery.matches) return;
  const rect = source?.getBoundingClientRect?.();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : 24;
  themeTransition.style.setProperty('--theme-x', `${x}px`);
  themeTransition.style.setProperty('--theme-y', `${y}px`);
  themeTransition.classList.remove('run');
  void themeTransition.offsetWidth;
  themeTransition.classList.add('run');
}

function applyTheme(theme, options = {}) {
  const { animate = true, source = themeSelect } = options;
  currentTheme = ['neon', 'warm', 'mono'].includes(theme) ? theme : 'neon';
  document.documentElement.dataset.theme = currentTheme;
  themeColorCache.clear();
  themeSelect.value = currentTheme;
  localStorage.setItem('wcx12-theme', currentTheme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', {
    neon: '#070914',
    warm: '#160d08',
    mono: '#050505'
  }[currentTheme]);
  if (animate) runThemeTransition(source);
  if (initializedViews.has('projects')) {
    if (filteredRepos.length) renderRepos(filteredRepos, true);
    else if (isProjectsViewActive()) repoMapFeature?.render();
  }
  researchCanvasFeature?.contextChanged();
  repoMapFeature?.contextChanged();
  drawHeroPreviewCanvas();
}

themeSelect.addEventListener('change', () => applyTheme(themeSelect.value, { source: themeSelect }));
interestSectionTabs.forEach((button, index) => {
  button.addEventListener('click', () => setInterestPanel(button.dataset.interestPanel));
  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = interestSectionTabs.length - 1;
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? lastIndex
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + interestSectionTabs.length) % interestSectionTabs.length;
    const next = interestSectionTabs[nextIndex];
    setInterestPanel(next.dataset.interestPanel);
    next.focus();
  });
});

function openResearchManager() {
  if (!ownerToolsEnabled) return;
  if (!researchManager.classList.contains('open') && document.activeElement instanceof HTMLElement) {
    researchManagerReturnFocus = document.activeElement;
  }
  clearGitHubToken();
  renderResearchManager();
  researchManager.classList.add('open');
  researchManager.setAttribute('aria-hidden', 'false');
  setOverlayActive(researchManager, true);
  requestAnimationFrame(() => managerClose?.focus());
}

function closeResearchManager() {
  const wasOpen = researchManager.classList.contains('open');
  clearGitHubToken({ abortRequest: true });
  researchManager.classList.remove('open');
  researchManager.setAttribute('aria-hidden', 'true');
  setOverlayActive(researchManager, false);
  if (wasOpen) restoreOverlayFocus(researchManagerReturnFocus);
  researchManagerReturnFocus = null;
}

function slugify(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `interest-${Date.now()}`;
}

function renderResearchManager() {
  const entry = activeInterestEntry();
  if (!entry) return;
  managerActive.textContent = `${textFor(entry.domain.title)} / ${textFor(entry.child.title)}`;

  const projectIds = new Set(relatedRepos().map((item) => itemKey(item)));
  managerProjects.innerHTML = allRepos.map((repo) => `
    <label class="manager-check">
      <input type="checkbox" data-kind="repo" value="${escapeHtml(repo.name)}" ${projectIds.has(repo.name) ? 'checked' : ''} />
      <span>${escapeHtml(repo.name)}</span>
    </label>
  `).join('');

  const paperIds = new Set(relatedPapers().map((item) => itemKey(item)));
  managerPapers.innerHTML = currentPublications().map((paper) => `
    <label class="manager-check">
      <input type="checkbox" data-kind="paper" value="${escapeHtml(paper.title)}" ${paperIds.has(paper.title) ? 'checked' : ''} />
      <span>${escapeHtml(paper.title)}</span>
    </label>
  `).join('') || `<p class="muted">${i18n[currentLang].no_related_papers}</p>`;
}

function setAssignment(kind, key, interestId, checked) {
  const map = kind === 'repo' ? researchConfig.repoAssignments : researchConfig.paperAssignments;
  const current = new Set(map[key] || []);
  if (checked) current.add(interestId);
  else current.delete(interestId);
  map[key] = Array.from(current);
}

function collectManagerAssignments() {
  managerProjects.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    setAssignment('repo', input.value, activeInterestId, input.checked);
  });
  managerPapers.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    setAssignment('paper', input.value, activeInterestId, input.checked);
  });
  researchConfig.interests = researchInterests;
}

function saveManagerAssignments() {
  if (!ownerToolsEnabled) return;
  try {
    collectManagerAssignments();
    saveResearchConfig();
    renderResearchInterest();
    renderResearchManager();
    updateViewDocumentTitle('research');
    updateRoute('research', 'replace');
    managerActive.textContent = `${i18n[currentLang].manager_saved} ${managerActive.textContent}`;
  } finally {
    clearGitHubToken();
  }
}

function toBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

async function readGitHubError(response) {
  try {
    const payload = await response.json();
    return payload.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function fetchCurrentGitHubConfig(signal) {
  const response = await fetchWithTimeout(
    `${GITHUB_RAW_CONFIG_URL}?t=${Date.now()}`,
    { cache: 'no-store', signal },
    REQUEST_TIMEOUT_MS.github
  );
  if (!response.ok) throw new Error(`config ${response.status}: ${response.statusText}`);
  const source = await response.text();
  normalizeResearchConfig(JSON.parse(source));
  return { hash: await sha256Hex(source) };
}

async function dispatchResearchConfigUpdate(token, expectedHash, signal) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/workflows/${GITHUB_CONFIG_WORKFLOW}/dispatches`;
  const configToWrite = normalizeResearchConfig({
    ...researchConfig,
    interests: researchInterests
  });
  const response = await fetchWithTimeout(
    apiUrl,
    {
      method: 'POST',
      headers: {
        ...githubHeaders(token),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: GITHUB_BRANCH,
        inputs: {
          config_base64: toBase64Utf8(`${JSON.stringify(configToWrite, null, 2)}\n`),
          expected_sha256: expectedHash
        }
      }),
      signal
    },
    REQUEST_TIMEOUT_MS.github
  );

  if (!response.ok) {
    const detail = await readGitHubError(response);
    const error = new Error(`dispatch ${response.status}: ${detail}`);
    error.status = response.status;
    throw error;
  }
}

async function saveResearchConfigToGitHub() {
  if (!ownerToolsEnabled) return;
  let token = managerGitHubToken.value.trim();
  if (!token) {
    managerRemoteStatus.textContent = i18n[currentLang].manager_remote_need_token;
    clearGitHubToken();
    managerGitHubToken.focus();
    return;
  }
  if (!remoteResearchConfigHash) {
    managerRemoteStatus.textContent = i18n[currentLang].manager_remote_not_loaded;
    clearGitHubToken();
    return;
  }

  githubSaveController?.abort();
  const requestController = new AbortController();
  githubSaveController = requestController;
  managerRemoteStatus.textContent = i18n[currentLang].manager_remote_saving;
  managerSaveRemote.disabled = true;

  try {
    collectManagerAssignments();
    saveResearchConfig();
    const current = await fetchCurrentGitHubConfig(requestController.signal);
    if (current.hash !== remoteResearchConfigHash) {
      const conflict = new Error('Remote research config changed');
      conflict.status = 409;
      throw conflict;
    }
    await dispatchResearchConfigUpdate(token, remoteResearchConfigHash, requestController.signal);
    remoteResearchConfigHash = '';
    managerRemoteStatus.textContent = i18n[currentLang].manager_remote_saved;
  } catch (error) {
    if (!requestController.signal.aborted) {
      managerRemoteStatus.textContent = error.status === 409
        ? i18n[currentLang].manager_remote_conflict
        : `${i18n[currentLang].manager_remote_failed} (${error.message})`;
    }
  } finally {
    token = '';
    clearGitHubToken();
    if (githubSaveController === requestController) githubSaveController = null;
    managerSaveRemote.disabled = false;
  }
}

function addResearchCategory() {
  if (!ownerToolsEnabled) return;
  const domainTitle = managerDomain.value.trim();
  const interestTitleValue = managerInterest.value.trim();
  if (!domainTitle || !interestTitleValue) return;
  const label = managerLabel.value.trim() || interestTitleValue;
  const domainId = slugify(domainTitle);
  const childId = `${domainId}-${slugify(interestTitleValue)}`;
  let domain = researchInterests.find((item) => item.id === domainId || textFor(item.title).toLowerCase() === domainTitle.toLowerCase());
  if (!domain) {
    domain = {
      id: domainId,
      title: { en: domainTitle, zh: domainTitle },
      label: { en: 'custom', zh: '自定义' },
      children: []
    };
    researchInterests.push(domain);
  }
  domain.children.push({
    id: childId,
    title: { en: interestTitleValue, zh: interestTitleValue },
    label: { en: label, zh: label },
    animation: managerAnimation.value,
    description: {
      en: 'Custom research interest. Use the mapping panel to assign projects and papers.',
      zh: '自定义研究兴趣。你可以在映射面板中分配项目和论文。'
    }
  });
  activeInterestId = childId;
  managerDomain.value = '';
  managerInterest.value = '';
  managerLabel.value = '';
  saveResearchConfig();
  renderResearchInterest();
  renderResearchManager();
  updateViewDocumentTitle('research');
  updateRoute('research', 'replace');
}

function deleteActiveResearchCategory() {
  if (!ownerToolsEnabled) return;
  researchInterests.forEach((domain) => {
    domain.children = domain.children.filter((child) => child.id !== activeInterestId);
  });
  researchInterests = researchInterests.filter((domain) => domain.children.length);
  Object.values(researchConfig.repoAssignments).forEach((ids) => {
    const index = ids.indexOf(activeInterestId);
    if (index >= 0) ids.splice(index, 1);
  });
  Object.values(researchConfig.paperAssignments).forEach((ids) => {
    const index = ids.indexOf(activeInterestId);
    if (index >= 0) ids.splice(index, 1);
  });
  activeInterestId = allInterestChildren()[0]?.child.id || '';
  saveResearchConfig();
  renderResearchInterest();
  renderResearchManager();
  updateViewDocumentTitle('research');
  updateRoute('research', 'replace');
}

manageResearch.hidden = !ownerToolsEnabled;
manageResearch.addEventListener('click', openResearchManager);
managerClose.addEventListener('click', closeResearchManager);
researchManager.addEventListener('keydown', (event) => handleOverlayKeydown(event, researchManager, closeResearchManager));
researchManager.addEventListener('click', (event) => {
  if (event.target === researchManager) closeResearchManager();
});
managerSave.addEventListener('click', saveManagerAssignments);
managerSaveRemote.addEventListener('click', saveResearchConfigToGitHub);
managerAdd.addEventListener('click', addResearchCategory);
managerDelete.addEventListener('click', deleteActiveResearchCategory);

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => {
      const selected = c === chip;
      c.classList.toggle('active', selected);
      c.setAttribute('aria-pressed', String(selected));
    });
    chipOutput.textContent = i18n[currentLang].chip_loaded.replace('{tag}', chip.dataset.tag);
  });
});

function openModal(config) {
  if (!modal.classList.contains('open') && document.activeElement instanceof HTMLElement) {
    modalReturnFocus = document.activeElement;
  }
  modalTitle.textContent = config.title;
  if (config.html) modalBody.innerHTML = config.html;
  else modalBody.textContent = config.body || '';
  const externalLink = validatedExternalHttpUrl(config.link);
  if (externalLink) {
    modalLink.style.display = 'inline-flex';
    modalLink.textContent = config.linkText || i18n[currentLang].open_external;
    modalLink.href = externalLink;
  } else {
    modalLink.removeAttribute('href');
    modalLink.style.display = 'none';
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  setOverlayActive(modal, true);
  requestAnimationFrame(() => modalClose?.focus());
}

function closeModal() {
  const wasOpen = modal.classList.contains('open');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  setOverlayActive(modal, false);
  if (wasOpen) restoreOverlayFocus(modalReturnFocus);
  modalReturnFocus = null;
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('keydown', (event) => handleOverlayKeydown(event, modal, closeModal));
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

document.querySelectorAll('.detail-trigger').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.detail === 'research') {
      openModal({
        title: i18n[currentLang].details_research_title,
        body: i18n[currentLang].details_research_body,
        linkText: '',
        link: null
      });
    }
  });
});

function sortedRepos(repos) {
  const key = repoSort.value;
  const items = [...repos];
  if (key === 'stars') items.sort((a, b) => b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name));
  else if (key === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
  else items.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return items;
}

function applyRepoFilter() {
  const q = repoSearch.value.trim().toLowerCase();
  filteredRepos = allRepos.filter((repo) => {
    const hay = `${repo.name} ${repo.description || ''} ${repo.language || ''}`.toLowerCase();
    return hay.includes(q);
  });
  repoState.page = 1;
  repoState.infiniteCount = repoState.pageSize;
  renderRepos(filteredRepos);
}

function openRepoDetail(repoName) {
  const repo = allRepos.find((item) => item.name === repoName);
  if (!repo) return;
  openRepoReadme(repo.name);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function languageAwareHtml(value) {
  const cjkRun = /([\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]+)/gi;
  const cjkOnly = /^[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]+$/i;
  return String(value || '').split(cjkRun).map((segment) => (
    cjkOnly.test(segment)
      ? `<span lang="zh-CN">${escapeHtml(segment)}</span>`
      : escapeHtml(segment)
  )).join('');
}

function externalText(value, fallback = '', maxLength = 500) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function validatedExternalHttpUrl(candidate) {
  if (typeof candidate !== 'string' || !candidate.trim()) return '';
  try {
    const parsed = new URL(candidate.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function safeExternalHref(candidate) {
  return escapeHtml(validatedExternalHttpUrl(candidate) || '#');
}

function markdownUrlTarget(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (value.startsWith('<')) {
    const close = value.indexOf('>');
    if (close > 1) return value.slice(1, close);
  }
  const titled = value.match(/^(\S+?)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?$/);
  return titled?.[1] || value;
}

function validatedReadmeUrl(candidate, kind = 'link') {
  try {
    const parsed = new URL(candidate, window.location.href);
    const allowedProtocols = new Set(['http:', 'https:']);
    return allowedProtocols.has(parsed.protocol) ? parsed.href : '#';
  } catch {
    return '#';
  }
}

function resolveReadmeUrl(rawUrl, repo, kind = 'link') {
  const value = markdownUrlTarget(rawUrl);
  if (!value) return '#';
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return validatedReadmeUrl(value, kind);
  if (!repo) return validatedReadmeUrl(value, kind);

  const encodedRepoName = encodeURIComponent(String(repo.name || ''));
  const repositoryUrl = (validatedExternalHttpUrl(repo.html_url)
    || `https://github.com/${encodeURIComponent(GITHUB_OWNER)}/${encodedRepoName}`).replace(/\/$/, '');
  const branch = String(repo.default_branch || 'main').split('/').map(encodeURIComponent).join('/');
  if (value.startsWith('#')) return validatedReadmeUrl(`${repositoryUrl}/blob/${branch}/README.md${value}`, kind);
  const relativePath = value.replace(/^\.\//, '').replace(/^\//, '');
  const base = kind === 'image'
    ? `https://raw.githubusercontent.com/${encodeURIComponent(GITHUB_OWNER)}/${encodedRepoName}/${branch}/`
    : `${repositoryUrl}/blob/${branch}/`;
  try {
    return validatedReadmeUrl(new URL(relativePath, base).href, kind);
  } catch {
    return '#';
  }
}

function safeMarkdownUrl(url, repo, kind = 'link') {
  return escapeHtml(resolveReadmeUrl(url, repo, kind));
}

function imageLinkAriaLabel(href) {
  try {
    const parsed = new URL(href);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    const host = parsed.hostname.replace(/^www\./i, '').slice(0, 80);
    if (!host) return '';
    return currentLang === 'zh' ? `图片链接：${host}` : `Image link: ${host}`;
  } catch {
    return '';
  }
}

function sanitizeMarkdownHtml(rawHtml, repo) {
  const template = document.createElement('template');
  template.innerHTML = String(rawHtml || '');
  const allowedTags = new Set(['A', 'B', 'BR', 'CODE', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'I', 'IMG', 'P', 'SPAN', 'STRONG', 'SUB', 'SUP']);
  const allowedAttrs = new Set(['align', 'alt', 'height', 'href', 'src', 'target', 'title', 'width', 'rel', 'loading']);
  template.content.querySelectorAll('*').forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(document.createTextNode(node.textContent || ''));
      return;
    }
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || !allowedAttrs.has(name)) {
        node.removeAttribute(attr.name);
        return;
      }
      if (name === 'href' || name === 'src') {
        const resolved = resolveReadmeUrl(attr.value, repo, name === 'src' ? 'image' : 'link');
        if (resolved === '#') node.removeAttribute(attr.name);
        else node.setAttribute(attr.name, resolved);
      }
    });
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noreferrer');
    }
    if (node.tagName === 'IMG') {
      node.setAttribute('loading', 'lazy');
      if (!node.hasAttribute('alt')) node.setAttribute('alt', '');
    }
  });
  template.content.querySelectorAll('a').forEach((anchor) => {
    const images = Array.from(anchor.querySelectorAll('img'));
    if (!images.length || anchor.textContent.trim()) return;
    const imageAlt = images.map((img) => img.getAttribute('alt')?.trim()).find(Boolean);
    const label = imageAlt || imageLinkAriaLabel(anchor.getAttribute('href') || '');
    if (label) anchor.setAttribute('aria-label', label);
  });
  return template.innerHTML;
}

function isMarkdownHtmlLine(line) {
  return /^<\/?(a|b|br|code|em|h[1-6]|hr|i|img|p|span|strong|sub|sup)\b/i.test(line);
}

function renderInlineMarkdown(text, repo) {
  const tokens = [];
  const stash = (html) => {
    const index = tokens.push(html) - 1;
    return `\u0000${index}\u0000`;
  };
  const withLinks = String(text || '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => stash(`<img src="${safeMarkdownUrl(url, repo, 'image')}" alt="${escapeHtml(alt)}" loading="lazy" />`))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => stash(`<a href="${safeMarkdownUrl(url, repo)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`));
  return escapeHtml(withLinks)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)] || '');
}

function markdownTableCells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isMarkdownTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function renderMarkdownTable(rows, repo) {
  const [head, ...body] = rows;
  return `
    <table>
      <thead><tr>${head.map((cell) => `<th>${renderInlineMarkdown(cell, repo)}</th>`).join('')}</tr></thead>
      <tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell, repo)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;
}

function markdownToHtml(markdown, repo) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let listType = null;
  let codeFence = null;
  let codeLines = [];

  const closeParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${paragraph.map((line) => renderInlineMarkdown(line, repo)).join('<br />')}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (codeFence) {
      if (trimmed.startsWith('```')) {
        html.push(`<pre><code${codeFence === 'plain' ? '' : ` class="language-${escapeHtml(codeFence)}"`}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeFence = null;
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      return;
    }

    const fenceMatch = trimmed.match(/^```([A-Za-z0-9_-]*)/);
    if (fenceMatch) {
      closeParagraph();
      closeList();
      codeFence = fenceMatch[1] || 'plain';
      codeLines = [];
      return;
    }

    if (!trimmed) {
      closeParagraph();
      closeList();
      return;
    }

    if (isMarkdownHtmlLine(trimmed)) {
      closeParagraph();
      closeList();
      html.push(sanitizeMarkdownHtml(trimmed, repo));
      return;
    }

    if (line.includes('|') && isMarkdownTableSeparator(lines[index + 1] || '')) {
      closeParagraph();
      closeList();
      const rows = [markdownTableCells(line)];
      let cursor = index + 2;
      while (cursor < lines.length && lines[cursor].includes('|') && lines[cursor].trim()) {
        rows.push(markdownTableCells(lines[cursor]));
        lines[cursor] = '';
        cursor += 1;
      }
      html.push(renderMarkdownTable(rows, repo));
      return;
    }

    if (isMarkdownTableSeparator(line)) return;

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 6);
      html.push(`<h${level}>${renderInlineMarkdown(heading[2], repo)}</h${level}>`);
      return;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      closeParagraph();
      closeList();
      html.push('<hr />');
      return;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      closeParagraph();
      const nextType = ordered ? 'ol' : 'ul';
      if (listType !== nextType) {
        closeList();
        listType = nextType;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${renderInlineMarkdown((unordered || ordered)[1], repo)}</li>`);
      return;
    }

    if (trimmed.startsWith('>')) {
      closeParagraph();
      closeList();
      html.push(`<blockquote>${renderInlineMarkdown(trimmed.replace(/^>\s?/, ''), repo)}</blockquote>`);
      return;
    }

    closeList();
    paragraph.push(line);
  });

  if (codeFence) {
    html.push(`<pre><code${codeFence === 'plain' ? '' : ` class="language-${escapeHtml(codeFence)}"`}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }
  closeParagraph();
  closeList();

  return html.join('');
}

function repoForkAttributionHtml(repo) {
  if (!repo?.fork) return '';
  const sourceName = externalText(repo.source?.full_name, '', 200);
  const sourceUrl = validatedExternalHttpUrl(repo.source?.html_url);
  const sourceLink = sourceName && sourceUrl
    ? `<a class="mini-action" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(i18n[currentLang].repo_forked_from)} ${escapeHtml(sourceName)}</a>`
    : '';
  return `
    <div class="research-badges repo-fork-attribution">
      <span class="research-badge fallback fork">${escapeHtml(i18n[currentLang].repo_fork_badge)}</span>
      ${sourceLink}
    </div>
  `;
}

async function openRepoReadme(repoName) {
  const repo = allRepos.find((item) => item.name === repoName);
  if (!repo) return;
  const requestSequence = ++readmeRequestSequence;
  readmeRequestController?.abort();
  const requestController = new AbortController();
  readmeRequestController = requestController;
  const mappingLabel = repoMappingLabel(repo);
  const overview = () => `
    <div class="project-overview">
      <span class="panel-eyebrow">${i18n[currentLang].project_overview}</span>
      <p>${languageAwareHtml(repo.description || i18n[currentLang].no_desc)}</p>
      ${repoForkAttributionHtml(repo)}
      <div class="research-badges">${researchBadgesHtml(repo, 'repo')}</div>
      <div class="repo-meta">
        ${mappingLabel ? `<span>${i18n[currentLang].project_mapping}: ${escapeHtml(mappingLabel)}</span>` : ''}
        <span>${i18n[currentLang].project_updated}: ${escapeHtml((repo.updated_at || '').slice(0, 10) || '-')}</span>
      </div>
    </div>
  `;
  openReadmeDrawer(repo, `${overview()}<p class="muted">${i18n[currentLang].readme_loading}</p>`);
  attachInterestJumpHandlers(readmeDrawerBody);

  try {
    const readmeUrl = validatedExternalHttpUrl(repo.readme_url);
    if (!readmeUrl) throw new Error('Invalid README URL');
    const response = await fetchWithTimeout(
      readmeUrl,
      { signal: requestController.signal },
      REQUEST_TIMEOUT_MS.readme
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    if (requestSequence !== readmeRequestSequence) return;
    readmeDrawerBody.innerHTML = `${overview()}<div class="readme-box readme-content">${markdownToHtml(markdown, repo)}</div>`;
  } catch {
    if (requestSequence !== readmeRequestSequence) return;
    readmeDrawerBody.innerHTML = `${overview()}<div class="readme-box"><p>${i18n[currentLang].readme_unavailable}</p></div>`;
  } finally {
    if (readmeRequestController === requestController) readmeRequestController = null;
  }
  if (requestSequence !== readmeRequestSequence) return;
  attachInterestJumpHandlers(readmeDrawerBody);
  attachInteractiveCards(readmeDrawerBody);
}

function openReadmeDrawer(repo, html) {
  if (!readmeDrawer || !repo) return;
  if (!readmeDrawer.classList.contains('open') && document.activeElement instanceof HTMLElement) {
    readmeReturnFocus = document.activeElement;
  }
  readmeReturnFocusRepoName = repo.name;
  readmeDrawerKicker.textContent = i18n[currentLang].repo_preview_title;
  readmeDrawerTitle.textContent = repo.name;
  readmeDrawerBody.innerHTML = html || '';
  const repoUrl = validatedExternalHttpUrl(repo.html_url);
  if (repoUrl) {
    readmeDrawerLink.href = repoUrl;
    readmeDrawerLink.style.display = '';
  } else {
    readmeDrawerLink.removeAttribute('href');
    readmeDrawerLink.style.display = 'none';
  }
  readmeDrawerLink.textContent = i18n[currentLang].details_project_link_text;
  readmeDrawer.classList.add('open');
  readmeDrawer.setAttribute('aria-hidden', 'false');
  setOverlayActive(readmeDrawer, true);
  requestAnimationFrame(() => readmeDrawerClose?.focus());
}

function closeReadmeDrawer() {
  if (!readmeDrawer) return;
  readmeRequestSequence += 1;
  readmeRequestController?.abort();
  readmeRequestController = null;
  const wasOpen = readmeDrawer.classList.contains('open');
  readmeDrawer.classList.remove('open');
  readmeDrawer.setAttribute('aria-hidden', 'true');
  setOverlayActive(readmeDrawer, false);
  if (wasOpen) {
    const repoFallback = Array.from(document.querySelectorAll('.repo-detail'))
      .find((button) => button.dataset.repo === readmeReturnFocusRepoName);
    restoreOverlayFocus(readmeReturnFocus?.isConnected
      ? readmeReturnFocus
      : repoFallback || document.querySelector('.cmd.active'));
  }
  readmeReturnFocus = null;
  readmeReturnFocusRepoName = null;
}

readmeDrawerClose?.addEventListener('click', closeReadmeDrawer);
readmeDrawer?.addEventListener('click', (event) => {
  if (event.target === readmeDrawer) closeReadmeDrawer();
});
readmeDrawer?.addEventListener('keydown', (event) => handleOverlayKeydown(event, readmeDrawer, closeReadmeDrawer));

function openPaperDetail(title) {
  const paper = currentPublications().find((item) => item.title === title);
  if (!paper) return;
  const authors = paper.authors
    ? `<p class="muted"><strong>${i18n[currentLang].pub_authors}:</strong> ${escapeHtml(paper.authors)}</p>`
    : '';
  openModal({
    title: paper.title,
    html: `<div class="readme-box"><p class="muted">${escapeHtml(paper.venue || '')} · ${escapeHtml(paper.year || '')}</p>${authors}<div class="research-badges">${researchBadgesHtml(paper, 'paper')}</div><p>${escapeHtml(paper.summary || '')}</p></div>`,
    linkText: i18n[currentLang].pub_open_article,
    link: paper.link
  });
  attachInterestJumpHandlers(modalBody);
}

function repoUpdatedDate(repo) {
  if (!repo.updated_at) return '-';
  return new Date(repo.updated_at).toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function renderRepoPreviewCard(repo) {
  const repoInterestId = primaryInterestId(repo, 'repo');
  const mappingLabel = repoMappingLabel(repo);
  const accent = repoColor(repo.language);
  const safeName = escapeHtml(repo.name);
  const desc = languageAwareHtml(repo.description || i18n[currentLang].no_desc);
  const repoHref = safeExternalHref(repo.html_url);
  return `
    <article class="repo-card repo-preview-card interactive-card motion-card ${highlightedRepo === repo.name ? 'highlight' : ''}" data-motion-card data-motion-key="repo-${safeName}" data-repo="${safeName}" style="--repo-accent:${accent}">
      <div class="repo-preview-top">
        <div>
          <span class="panel-eyebrow">${i18n[currentLang].repo_preview_title}</span>
          <h3><a href="${repoHref}" target="_blank" rel="noreferrer">${safeName}</a></h3>
        </div>
        <div class="repo-preview-visual" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </div>
      <p class="muted repo-preview-desc">${desc}</p>
      ${repoForkAttributionHtml(repo)}
      <div class="research-badges">${researchBadgesHtml(repo, 'repo')}</div>
      <div class="repo-preview-facts">
        ${repoInterestId ? `
          <span>${i18n[currentLang].project_mapping}</span>
          <strong>${escapeHtml(mappingLabel)}</strong>
        ` : ''}
        <span>${i18n[currentLang].project_updated}</span>
        <strong>${escapeHtml(repoUpdatedDate(repo))}</strong>
      </div>
      <div class="repo-meta">
        <span>${i18n[currentLang].star} ${escapeHtml(repo.stargazers_count)}</span>
        <span>${escapeHtml(repo.language || i18n[currentLang].mixed)}</span>
      </div>
      <div class="repo-actions">
        <button class="btn btn-outline repo-detail" type="button" data-repo="${safeName}">${i18n[currentLang].repo_preview_readme}</button>
        ${repoInterestId ? `<button class="btn btn-outline repo-research" type="button" data-repo="${safeName}">${i18n[currentLang].show_in_research}</button>` : ''}
        <a class="btn btn-primary" href="${repoHref}" target="_blank" rel="noreferrer">${i18n[currentLang].open_repo}</a>
      </div>
    </article>
  `;
}

function renderRepos(repos, preserveScroll = false) {
  const beforeScroll = repoGrid.scrollTop;
  const previousCards = snapshotMotionCards(repoGrid);
  const items = sortedRepos(repos);
  const total = items.length;
  let shown = [];

  if (repoState.mode === 'pagination') {
    const totalPages = Math.max(1, Math.ceil(total / repoState.pageSize));
    repoState.page = Math.min(Math.max(repoState.page, 1), totalPages);
    const start = (repoState.page - 1) * repoState.pageSize;
    shown = items.slice(start, start + repoState.pageSize);

    repoPager.style.display = 'flex';
    repoPageInfo.textContent = i18n[currentLang].page_info
      .replace('{page}', String(repoState.page))
      .replace('{total}', String(totalPages));
    repoPrev.disabled = repoState.page <= 1;
    repoNext.disabled = repoState.page >= totalPages;
  } else {
    repoState.infiniteCount = Math.max(repoState.pageSize, repoState.infiniteCount);
    shown = items.slice(0, repoState.infiniteCount);
    repoPager.style.display = 'none';
    repoPageInfo.textContent = '';
  }

  const sourceLabel = {
    live: i18n[currentLang].repo_source_live,
    mixed: i18n[currentLang].repo_source_mixed,
    snapshot: i18n[currentLang].repo_source_snapshot
  }[repoDataSource] || i18n[currentLang].repo_source_snapshot;
  repoCount.textContent = i18n[currentLang].repo_count
    .replace('{shown}', String(shown.length))
    .replace('{total}', String(total))
    + ` · ${sourceLabel}`;

  if (!shown.length) {
    repoGrid.innerHTML = `<p class="muted">${i18n[currentLang].no_repos}</p>`;
    if (isProjectsViewActive()) repoMapFeature?.render();
    return;
  }

  repoGrid.innerHTML = shown.map((repo) => renderRepoPreviewCard(repo)).join('');

  if (repoState.mode === 'infinite' && shown.length < total) {
    repoGrid.insertAdjacentHTML('beforeend', `<p class="muted">${i18n[currentLang].infinite_hint}</p>`);
  }

  document.querySelectorAll('.repo-detail').forEach((btn) => {
    btn.addEventListener('click', () => openRepoDetail(btn.dataset.repo));
  });
  document.querySelectorAll('.repo-research').forEach((btn) => {
    btn.addEventListener('click', () => {
      const repo = allRepos.find((item) => item.name === btn.dataset.repo);
      const interestId = repo ? primaryInterestId(repo, 'repo') : null;
      if (interestId) jumpToResearchInterest(interestId, repo.name);
    });
  });
  attachInterestJumpHandlers(repoGrid);
  attachInteractiveCards(repoGrid);
  animateGridTransition(repoGrid, previousCards);

  if (isProjectsViewActive()) repoMapFeature?.render();
  if (preserveScroll) repoGrid.scrollTop = beforeScroll;
}

function resizeDrawingCanvas(canvasElement, context) {
  const rect = canvasElement.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);
  const width = Math.max(1, Math.floor(rect.width * scale));
  const height = Math.max(1, Math.floor(rect.height * scale));
  if (canvasElement.width !== width || canvasElement.height !== height) {
    canvasElement.width = width;
    canvasElement.height = height;
  }
  context.setTransform(scale, 0, 0, scale, 0, 0);
  return { width: rect.width, height: rect.height };
}

function repoColor(language) {
  if (currentTheme === 'mono') {
    const monoPalette = {
      JavaScript: '#f2f2f2',
      TypeScript: '#d4d4d4',
      Python: '#b6b6b6',
      TeX: '#989898',
      HTML: '#7a7a7a'
    };
    const fallback = ['#e3e3e3', '#c5c5c5', '#a7a7a7', '#898989', '#6b6b6b'];
    return monoPalette[language]
      || fallback[Math.abs(hashString(String(language || 'Mixed'))) % fallback.length];
  }
  if (currentTheme === 'warm') {
    const warmPalette = {
      JavaScript: '#f2b84b',
      TypeScript: '#df7a5e',
      Python: '#c78b52',
      TeX: '#e09f3e',
      HTML: '#b86b4b'
    };
    const fallback = ['#d9a441', '#d47d5d', '#bd8455', '#e0a03f', '#aa684e'];
    return warmPalette[language]
      || fallback[Math.abs(hashString(String(language || 'Mixed'))) % fallback.length];
  }
  const palette = {
    JavaScript: '#00f5ff',
    TypeScript: '#62a8ff',
    Python: '#ffd166',
    TeX: '#ff2e88',
    HTML: '#9b5cff'
  };
  return palette[language] || '#8ee6a8';
}

function colorWithAlpha(color, alpha) {
  const value = String(color || '').trim();
  let hex = value;
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    const number = Number.parseInt(hex.slice(1), 16);
    const r = (number >> 16) & 255;
    const g = (number >> 8) & 255;
    const b = number & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (value.startsWith('rgb(')) return value.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  return `rgba(255, 255, 255, ${alpha})`;
}

function hashString(value) {
  return String(value).split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function researchMapPalette() {
  if (document.documentElement.dataset.theme === 'mono') {
    return ['#f5f5f5', '#d8d8d8', '#bdbdbd', '#9f9f9f', '#7f7f7f'];
  }
  return [
    themeColor('--cyan') || '#00f5ff',
    themeColor('--pink') || '#ff2e88',
    themeColor('--violet') || '#9b5cff',
    '#8ee6a8',
    '#ffd166'
  ];
}

function repoInterestEntries(repo) {
  const entriesById = new Map(allInterestChildren().map((entry) => [entry.child.id, entry]));
  return [...new Set(assignedInterestIds(repo, 'repo'))]
    .map((id) => entriesById.get(id))
    .filter(Boolean);
}

function repoMappingLabel(repo) {
  const entries = repoInterestEntries(repo);
  if (!entries.length) return '';
  return entries.map((entry) => textFor(entry.child.title)).join(' + ');
}

function themeColor(name) {
  if (themeColorCache.has(name)) return themeColorCache.get(name);
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  themeColorCache.set(name, value);
  return value;
}

function currentPublications() {
  const source = loadedPublications.length ? loadedPublications : [];
  const byTitle = new Map();
  const trustedOverrides = new Map(staticPublications.map((item) => [item.title, item]));
  [...staticPublications, ...source, ...fallbackPublications[currentLang]].forEach((item) => {
    const override = trustedOverrides.get(item.title);
    byTitle.set(item.title, override
      ? {
        ...item,
        authors: override.authors,
        doi: override.doi,
        link: override.link,
        status: currentLang === 'zh' ? override.statusZh : override.status,
        interests: override.interests
      }
      : item);
  });
  return Array.from(byTitle.values());
}

function updateHeroPublicationCount() {
  if (heroPublicationCount) heroPublicationCount.textContent = String(currentPublications().length);
}

function renderPublications(preserveScroll = false) {
  const beforeScroll = pubList.scrollTop;
  const previousCards = snapshotMotionCards(pubList);
  const items = currentPublications();
  updateHeroPublicationCount();
  const total = items.length;
  let shown = [];

  if (pubState.mode === 'pagination') {
    const totalPages = Math.max(1, Math.ceil(total / pubState.pageSize));
    pubState.page = Math.min(Math.max(pubState.page, 1), totalPages);
    const start = (pubState.page - 1) * pubState.pageSize;
    shown = items.slice(start, start + pubState.pageSize);

    pubPager.style.display = 'flex';
    pubPageInfo.textContent = i18n[currentLang].page_info
      .replace('{page}', String(pubState.page))
      .replace('{total}', String(totalPages));
    pubPrev.disabled = pubState.page <= 1;
    pubNext.disabled = pubState.page >= totalPages;
  } else {
    pubState.infiniteCount = Math.max(pubState.pageSize, pubState.infiniteCount);
    shown = items.slice(0, pubState.infiniteCount);
    pubPager.style.display = 'none';
    pubPageInfo.textContent = '';
  }

  pubCount.textContent = i18n[currentLang].pub_count
    .replace('{shown}', String(shown.length))
    .replace('{total}', String(total));

  if (!shown.length) {
    pubList.innerHTML = `<p class="muted">${i18n[currentLang].pub_empty}</p>`;
    return;
  }
  pubList.innerHTML = shown.map((item) => {
    const primaryId = primaryInterestId(item, 'paper');
    const safeTitle = escapeHtml(item.title);
    return `
    <article class="pub-card interactive-card motion-card ${highlightedPaper === item.title ? 'highlight' : ''}" data-motion-card data-motion-key="paper-${safeTitle}" data-paper-card="${safeTitle}">
      <div class="pub-meta">
        <span>${escapeHtml(item.venue || '')}</span>
        <span>${escapeHtml(item.year || '')}</span>
        <span class="pub-status">${escapeHtml(item.status || '')}</span>
      </div>
      <h3 style="margin:8px 0;font-size:1em">${safeTitle}</h3>
      ${item.authors ? `<p class="muted"><strong>${i18n[currentLang].pub_authors}:</strong> ${escapeHtml(item.authors)}</p>` : ''}
      <div class="research-badges">${researchBadgesHtml(item, 'paper')}</div>
      <p class="muted">${escapeHtml(item.summary || '')}</p>
      <div class="repo-actions">
        <button class="btn btn-outline pub-detail" type="button" data-paper="${safeTitle}">${i18n[currentLang].view_details}</button>
        <button class="btn btn-outline pub-research" type="button" data-paper="${safeTitle}" ${primaryId ? '' : 'disabled'}>${i18n[currentLang].show_in_research}</button>
        <a class="btn btn-primary" href="${safeExternalHref(item.link)}" target="_blank" rel="noreferrer">${i18n[currentLang].pub_open_article}</a>
      </div>
    </article>
  `;
  }).join('');
  if (publicationLoadFailed) {
    pubList.insertAdjacentHTML('afterbegin', `<p class="muted">${i18n[currentLang].pub_load_fail}</p>`);
  }

  if (pubState.mode === 'infinite' && shown.length < total) {
    pubList.insertAdjacentHTML('beforeend', `<p class="muted">${i18n[currentLang].infinite_hint}</p>`);
  }
  pubList.querySelectorAll('.pub-detail').forEach((button) => {
    button.addEventListener('click', () => {
      const paper = currentPublications().find((item) => item.title === button.dataset.paper);
      if (paper) bindItemToInterestAnimation(paper, 'paper', primaryInterestId(paper, 'paper'));
      openPaperDetail(button.dataset.paper);
    });
  });
  pubList.querySelectorAll('.pub-research').forEach((button) => {
    button.addEventListener('click', () => {
      const paper = currentPublications().find((item) => item.title === button.dataset.paper);
      const interestId = paper ? primaryInterestId(paper, 'paper') : null;
      if (!interestId) return;
      bindItemToInterestAnimation(paper, 'paper', interestId);
      jumpToResearchInterest(interestId);
    });
  });
  attachInterestJumpHandlers(pubList);
  attachInteractiveCards(pubList);
  animateGridTransition(pubList, previousCards);

  if (preserveScroll) pubList.scrollTop = beforeScroll;
}

function mapOrcidWorks(payload) {
  const groups = Array.isArray(payload.group) ? payload.group : [];
  return groups
    .slice(0, 200)
    .map((group) => {
      const summary = Array.isArray(group['work-summary']) ? group['work-summary'][0] : null;
      if (!isPlainRecord(summary)) return null;
      const title = externalText(summary.title?.title?.value, '', 500);
      if (!title) return null;

      const year = externalText(summary['publication-date']?.year?.value, '', 20);
      const venue = externalText(summary['journal-title']?.value, 'ORCID Record', 300);
      const status = currentLang === 'zh' ? '已发表' : 'Published';
      const workType = externalText(summary.type, '', 100);
      const summaryText = workType
        ? `Type: ${workType}`
        : (currentLang === 'zh' ? '来自 ORCID 公开记录。' : 'From ORCID public record.');
      const link = validatedExternalHttpUrl(summary.url?.value)
        || validatedExternalHttpUrl(
          summary['external-ids']?.['external-id']?.[0]?.['external-id-url']?.value
        )
        || `https://orcid.org/${ORCID_ID}`;

      return {
        title,
        venue,
        year,
        status,
        summary: summaryText,
        link,
        interests: inferInterestIds({ title, summary: summaryText, venue })
      };
    })
    .filter(Boolean);
}

function normalizeGitHubRepo(repo, localByName) {
  if (!isPlainRecord(repo)) throw new Error('Invalid GitHub repository entry');
  const name = externalText(repo.name, '', 100);
  if (!/^[A-Za-z0-9._-]+$/.test(name)) throw new Error('Invalid GitHub repository name');
  const local = localByName.get(name);
  const defaultBranch = externalText(repo.default_branch, local?.default_branch || 'main', 255);
  const encodedOwner = encodeURIComponent(GITHUB_OWNER);
  const encodedName = encodeURIComponent(name);
  const encodedBranch = defaultBranch.split('/').map(encodeURIComponent).join('/');
  const fallbackRepoUrl = `https://github.com/${encodedOwner}/${encodedName}`;
  const stars = Number.isSafeInteger(repo.stargazers_count) && repo.stargazers_count >= 0
    ? repo.stargazers_count
    : (local?.stargazers_count || 0);
  const remoteSource = isPlainRecord(repo.source)
    ? repo.source
    : (isPlainRecord(repo.parent) ? repo.parent : null);
  const sourceName = externalText(remoteSource?.full_name, local?.source?.full_name || '', 200);
  const sourceUrl = validatedExternalHttpUrl(remoteSource?.html_url)
    || validatedExternalHttpUrl(local?.source?.html_url);
  const fork = repo.fork === true || local?.fork === true;

  return {
    name,
    description: externalText(repo.description, '', 1000) || local?.description || '',
    language: externalText(repo.language, '', 100) || local?.language || null,
    stargazers_count: stars,
    updated_at: externalText(repo.updated_at, local?.updated_at || '', 100),
    default_branch: defaultBranch,
    html_url: validatedExternalHttpUrl(repo.html_url)
      || validatedExternalHttpUrl(local?.html_url)
      || fallbackRepoUrl,
    readme_url: `https://raw.githubusercontent.com/${encodedOwner}/${encodedName}/${encodedBranch}/README.md`,
    fork,
    source: fork && sourceName && sourceUrl
      ? { full_name: sourceName, html_url: sourceUrl }
      : null,
    interests: local?.interests
  };
}

async function loadRepos() {
  const localByName = new Map(localRepos.map((repo) => [repo.name, repo]));
  try {
    const response = await fetchWithTimeout(
      `https://api.github.com/users/${GITHUB_OWNER}/repos?per_page=100&sort=updated`,
      { headers: { Accept: 'application/vnd.github+json' } },
      REQUEST_TIMEOUT_MS.github
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remoteRepos = await response.json();
    if (!Array.isArray(remoteRepos)) throw new Error('Invalid repository payload');
    const normalizedRemoteRepos = remoteRepos.map((repo) => normalizeGitHubRepo(repo, localByName));
    const remoteNames = new Set(normalizedRemoteRepos.map((repo) => repo.name));
    const localOnlyRepos = localRepos.filter((repo) => !remoteNames.has(repo.name));
    repoDataSource = localOnlyRepos.length ? 'mixed' : 'live';
    allRepos = [...normalizedRemoteRepos, ...localOnlyRepos];
  } catch {
    repoDataSource = 'snapshot';
    allRepos = [...localRepos];
  }
  filteredRepos = [...allRepos];
  renderHeroPreview();
  refreshInitializedView('projects');
  refreshInitializedView('research');
}

async function loadPublications() {
  if (initializedViews.has('publications')) {
    pubList.innerHTML = `<p class="muted">${i18n[currentLang].pub_loading}</p>`;
  }
  try {
    const response = await fetchWithTimeout(
      `https://pub.orcid.org/v3.0/${ORCID_ID}/works`,
      { headers: { Accept: 'application/json' } },
      REQUEST_TIMEOUT_MS.orcid
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    loadedPublications = mapOrcidWorks(payload);
    publicationLoadFailed = false;
  } catch {
    loadedPublications = [];
    publicationLoadFailed = true;
  }
  updateHeroPublicationCount();
  renderHeroPreview();
  refreshInitializedView('publications');
  refreshInitializedView('research');
}

async function loadBlogPosts() {
  if (initializedViews.has('writing') && writingList) {
    writingList.innerHTML = `<p class="muted">${i18n[currentLang].writing_loading}</p>`;
  }
  try {
    const response = await fetch(versionedModuleUrl('./blog/posts.json'), { cache: 'default' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const posts = await response.json();
    blogPosts = Array.isArray(posts) ? posts : [];
  } catch {
    blogPosts = [];
  }
  filteredBlogPosts = [...blogPosts];
  renderHeroPreview();
  refreshInitializedView('writing');
  refreshInitializedView('research');
  if (commandPalette.classList.contains('open')) renderCommandList();
}

repoSearch.addEventListener('input', applyRepoFilter);
writingSearch?.addEventListener('input', applyWritingFilter);
repoSort.addEventListener('change', () => renderRepos(filteredRepos));
repoMode.addEventListener('change', () => {
  repoState.mode = repoMode.value;
  repoState.page = 1;
  repoState.infiniteCount = repoState.pageSize;
  renderRepos(filteredRepos);
});
repoPageSize.addEventListener('change', () => {
  repoState.pageSize = Number(repoPageSize.value);
  repoState.page = 1;
  repoState.infiniteCount = repoState.pageSize;
  renderRepos(filteredRepos);
});
repoPrev.addEventListener('click', () => {
  repoState.page -= 1;
  renderRepos(filteredRepos);
});
repoNext.addEventListener('click', () => {
  repoState.page += 1;
  renderRepos(filteredRepos);
});
repoGrid.addEventListener('scroll', () => {
  if (repoState.mode !== 'infinite') return;
  const nearBottom = repoGrid.scrollTop + repoGrid.clientHeight >= repoGrid.scrollHeight - 40;
  if (!nearBottom) return;
  const items = sortedRepos(filteredRepos);
  if (repoState.infiniteCount >= items.length) return;
  repoState.infiniteCount += repoState.pageSize;
  renderRepos(filteredRepos, true);
});

pubMode.addEventListener('change', () => {
  pubState.mode = pubMode.value;
  pubState.page = 1;
  pubState.infiniteCount = pubState.pageSize;
  renderPublications();
});
pubPageSize.addEventListener('change', () => {
  pubState.pageSize = Number(pubPageSize.value);
  pubState.page = 1;
  pubState.infiniteCount = pubState.pageSize;
  renderPublications();
});
pubPrev.addEventListener('click', () => {
  pubState.page -= 1;
  renderPublications();
});
pubNext.addEventListener('click', () => {
  pubState.page += 1;
  renderPublications();
});
pubList.addEventListener('scroll', () => {
  if (pubState.mode !== 'infinite') return;
  const nearBottom = pubList.scrollTop + pubList.clientHeight >= pubList.scrollHeight - 40;
  if (!nearBottom) return;
  const items = currentPublications();
  if (pubState.infiniteCount >= items.length) return;
  pubState.infiniteCount += pubState.pageSize;
  renderPublications(true);
});

let statusIndex = 0;
let typeTimer = null;
const STATUS_ROTATION_MS = 6000;

function typeLoop() {
  const statuses = i18n[currentLang].statuses;
  if (!statuses.length) {
    typeTarget.textContent = '';
    return;
  }
  typeTarget.textContent = statuses[statusIndex % statuses.length];
  if (statuses.length <= 1 || reducedMotionQuery.matches || document.hidden) return;
  typeTimer = setTimeout(() => {
    statusIndex = (statusIndex + 1) % statuses.length;
    typeLoop();
  }, STATUS_ROTATION_MS);
}

function restartTypeLoop() {
  clearTimeout(typeTimer);
  statusIndex = 0;
  typeLoop();
}

function applyTranslations() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    const value = i18n[currentLang][key];
    if (typeof value === 'string') node.textContent = value;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((node) => {
    const key = node.dataset.i18nPh;
    const value = i18n[currentLang][key];
    if (typeof value === 'string') node.setAttribute('placeholder', value);
  });
  repoSearch.setAttribute('aria-label', i18n[currentLang].repo_search_aria);
  writingSearch?.setAttribute('aria-label', i18n[currentLang].writing_search_aria);
  commandInput.setAttribute('aria-label', i18n[currentLang].command_search_aria);
  document.querySelectorAll('[data-i18n="hero_subtitle_html"]').forEach((node) => {
    node.innerHTML = i18n[currentLang].hero_subtitle_html;
  });

  langToggle.textContent = i18n[currentLang].lang_btn;
  modalClose.textContent = i18n[currentLang].modal_close;
  updateHeroStats();
  updateHeroPublicationCount();
  renderHeroPreview();
  refreshInitializedView('projects');
  refreshInitializedView('publications');
  refreshInitializedView('writing');
  refreshInitializedView('research');
  researchCanvasFeature?.contextChanged();
  repoMapFeature?.contextChanged();
  updateViewDocumentTitle(document.querySelector('.view.active')?.id || 'about');
  if (commandPalette.classList.contains('open')) renderCommandList();
}

langToggle.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  localStorage.setItem(LANG_KEY, currentLang);
  applyTranslations();
  restartTypeLoop();
});

function setUtilityMenuOpen(open) {
  utilityMenu?.classList.toggle('open', open);
  utilityMenuToggle?.setAttribute('aria-expanded', String(open));
}

utilityMenuToggle?.addEventListener('click', () => {
  setUtilityMenuOpen(!utilityMenu.classList.contains('open'));
});

document.addEventListener('pointerdown', (event) => {
  if (utilityMenu?.classList.contains('open') && !utilityMenu.contains(event.target)) setUtilityMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (commandPalette.classList.contains('open')) closeCommandPalette();
    else openCommandPalette();
    return;
  }
  if (event.key === 'Escape') {
    if (commandPalette.classList.contains('open')) closeCommandPalette();
    else if (readmeDrawer?.classList.contains('open')) closeReadmeDrawer();
    else if (researchManager.classList.contains('open')) closeResearchManager();
    else if (modal.classList.contains('open')) closeModal();
    else if (utilityMenu?.classList.contains('open')) {
      setUtilityMenuOpen(false);
      utilityMenuToggle?.focus();
    }
    return;
  }
});

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = Array.from({ length: Math.min(72, Math.floor(window.innerWidth / 18)) }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * 1.5 + 0.4,
    r: Math.random() * 1.4 + 0.2
  }));
}

function shouldRunMotion() {
  return !reducedMotionQuery.matches && document.visibilityState !== 'hidden';
}

function shouldAnimateHeroPreview(timestamp) {
  return shouldRunMotion()
    && heroPreviewVisible
    && timestamp - lastHeroPreviewFrame >= HERO_PREVIEW_FRAME_SKIP * 16;
}

function drawStarfieldFrame(timestamp = 0) {
  if (timestamp - lastStarfieldFrame < STARFIELD_FRAME_SKIP * 16) return;
  lastStarfieldFrame = timestamp;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    s.y += s.z;
    if (s.y > canvas.height) {
      s.y = -2;
      s.x = Math.random() * canvas.width;
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.z > 1.3 ? 'rgba(0, 245, 255, 0.95)' : 'rgba(155, 92, 255, 0.7)';
    ctx.fill();
  }
}

function motionCadence() {
  if (isResearchViewActive() && researchCanvasFeature?.isVisible()) return researchCanvasFeature.cadence();
  if (isProjectsViewActive() && repoMapFeature) return repoMapFeature.cadence();
  return heroPreviewVisible ? 100 : 140;
}

function stopMotionLoop() {
  if (motionTimer !== null) window.clearTimeout(motionTimer);
  if (motionFrame !== null) cancelAnimationFrame(motionFrame);
  motionTimer = null;
  motionFrame = null;
}

function scheduleMotionLoop(options = {}) {
  const { immediate = false } = options;
  if (!shouldRunMotion()) {
    stopMotionLoop();
    return;
  }
  if (immediate && motionTimer !== null) {
    window.clearTimeout(motionTimer);
    motionTimer = null;
  }
  if (motionTimer !== null || motionFrame !== null) return;
  const requestFrame = () => {
    motionTimer = null;
    motionFrame = requestAnimationFrame(runMotionFrame);
  };
  if (immediate) requestFrame();
  else motionTimer = window.setTimeout(requestFrame, motionCadence());
}

function runMotionFrame(timestamp = 0) {
  motionFrame = null;
  if (!shouldRunMotion()) return;
  drawStarfieldFrame(timestamp);
  researchCanvasFeature?.frame(timestamp);
  if (shouldAnimateHeroPreview(timestamp)) {
    heroPreviewTick += 1;
    lastHeroPreviewFrame = timestamp;
    drawHeroPreviewCanvas();
  }
  repoMapFeature?.frame(timestamp);
  scheduleMotionLoop();
}

initCustomCursor();
applyTheme(currentTheme, { animate: false });
applyTranslations();
applyLocationRoute({ scroll: Boolean(window.location.hash) });
lastHandledRouteUrl = currentRouteUrl();
restartTypeLoop();
if ('IntersectionObserver' in window && heroPreviewCanvas) {
  const heroPreviewObserver = new IntersectionObserver(([entry]) => {
    heroPreviewVisible = Boolean(entry?.isIntersecting);
    if (heroPreviewVisible) drawHeroPreviewCanvas();
    scheduleMotionLoop({ immediate: heroPreviewVisible });
  }, { threshold: 0.08 });
  heroPreviewObserver.observe(heroPreviewCanvas);
}
reducedMotionQuery.addEventListener?.('change', () => {
  restartTypeLoop();
  drawHeroPreviewCanvas();
  researchCanvasFeature?.contextChanged();
  repoMapFeature?.contextChanged();
  if (reducedMotionQuery.matches) stopMotionLoop();
  else scheduleMotionLoop({ immediate: true });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearTimeout(typeTimer);
    stopMotionLoop();
  } else {
    lastHeroPreviewFrame = 0;
    lastStarfieldFrame = 0;
    researchCanvasFeature?.contextChanged();
    repoMapFeature?.contextChanged();
    restartTypeLoop();
    scheduleMotionLoop({ immediate: true });
  }
});
window.addEventListener('resize', () => {
  themeColorCache.clear();
  resizeCanvas();
  repoMapFeature?.resize();
  researchCanvasFeature?.resize();
  drawHeroPreviewCanvas();
});
resizeCanvas();
scheduleMotionLoop({ immediate: true });
