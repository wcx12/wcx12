const views = document.querySelectorAll('.view');
const commands = document.querySelectorAll('.cmd');
const chips = document.querySelectorAll('.chip');
const chipOutput = document.getElementById('chipOutput');
const typeTarget = document.getElementById('typeTarget');
const focusAreaCount = document.getElementById('focusAreaCount');
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

const themeSelect = document.getElementById('themeSelect');
const langToggle = document.getElementById('langToggle');
const openCommand = document.getElementById('openCommand');
const openProjects = document.getElementById('openProjects');
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
const commandInput = document.getElementById('commandInput');
const commandList = document.getElementById('commandList');
const heroPreviewCanvas = document.getElementById('heroPreviewCanvas');
const heroPreviewCtx = heroPreviewCanvas?.getContext('2d');
const heroPreviewStatus = document.getElementById('heroPreviewStatus');
const heroPreviewMeta = document.getElementById('heroPreviewMeta');
const researchShowcase = document.getElementById('researchShowcase');

const registrationCanvas = document.getElementById('registrationCanvas');
const regCtx = registrationCanvas?.getContext('2d');
const noiseRange = document.getElementById('noiseRange');
const missingRange = document.getElementById('missingRange');
const rotationRange = document.getElementById('rotationRange');
const noiseValue = document.getElementById('noiseValue');
const missingValue = document.getElementById('missingValue');
const rotationValue = document.getElementById('rotationValue');
const labScore = document.getElementById('labScore');
const alignDemo = document.getElementById('alignDemo');
const resetDemo = document.getElementById('resetDemo');

const repoMap = document.getElementById('repoMap');
const repoMapCtx = repoMap.getContext('2d');
const repoMapHint = document.getElementById('repoMapHint');

const interestRail = document.getElementById('interestRail');
const interestPath = document.getElementById('interestPath');
const interestTitle = document.getElementById('interestTitle');
const interestTag = document.getElementById('interestTag');
const interestDescription = document.getElementById('interestDescription');
const interestDetail = document.querySelector('.interest-detail');
const interestSectionTabs = document.querySelectorAll('[data-interest-panel]');
const interestCanvas = document.getElementById('interestCanvas');
const interestCtx = interestCanvas.getContext('2d');
const interestProjects = document.getElementById('interestProjects');
const interestPapers = document.getElementById('interestPapers');
const customCursor = document.getElementById('customCursor');

let currentLang = 'en';
let currentTheme = localStorage.getItem('wcx12-theme') || 'neon';
let allRepos = [];
let filteredRepos = [];
let loadedPublications = [];
let commandCursor = 0;
let repoNodes = [];
let repoMapFieldNodes = [];
let hoveredRepo = null;
let hoveredMapField = null;
let highlightedRepo = null;
let highlightedPaper = null;
let activeInterestPanel = 'animation';
let repoMapTick = 0;
let activeInterestId = 'point-cloud-registration';
let interestTick = 0;
let heroPreviewTick = 0;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const HERO_PREVIEW_FRAME_SKIP = 4;
const STARFIELD_FRAME_SKIP = 3;
const INTEREST_FRAME_SKIP = 2;
const REPO_MAP_FRAME_SKIP = 6;
let lastHeroPreviewFrame = 0;
let lastStarfieldFrame = 0;
let lastInterestFrame = 0;
let lastRepoMapFrame = 0;
let heroPreviewVisible = true;

const pointCloudInteraction = {
  active: false,
  dragging: false,
  x: 0.5,
  y: 0.5,
  scrub: 0.48,
  targetScrub: 0.48,
  energy: 0
};

const vprPlaces = [
  { id: 'DB-01', name: 'Gate', u: 0.08, condition: 0.16 },
  { id: 'DB-07', name: 'Quad', u: 0.25, condition: 0.52 },
  { id: 'DB-12', name: 'Bridge', u: 0.43, condition: 0.28 },
  { id: 'DB-18', name: 'Road', u: 0.62, condition: 0.74 },
  { id: 'DB-24', name: 'Corner', u: 0.8, condition: 0.38 },
  { id: 'DB-31', name: 'Hall', u: 0.94, condition: 0.62 }
];

const vprInteraction = {
  active: false,
  dragging: false,
  route: 0.34,
  targetRoute: 0.34,
  condition: 0.42,
  targetCondition: 0.42,
  selected: null,
  energy: 0
};

const agentInteraction = {
  active: false,
  dragging: false,
  x: 0.54,
  y: 0.44,
  taskIndex: 0,
  selectedStage: 'plan',
  selectedTool: 'rag',
  tools: {
    memory: true,
    rag: true,
    code: true,
    browser: false,
    eval: true
  },
  hoverType: null,
  hoverId: null,
  pulse: 0,
  runBoost: 0
};

const educationInteraction = {
  active: false,
  dragging: false,
  x: 0.5,
  y: 0.5,
  selectedPath: 'learner',
  selectedConcept: 'functions',
  selectedSignal: 'hint',
  hoverType: null,
  hoverId: null,
  pulse: 0,
  masteryBoost: 0
};

const ORCID_ID = '0009-0005-6139-4327';

const registrationState = {
  points: [],
  target: [],
  progress: 0,
  seed: 7,
  animationFrame: null
};

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

const localRepos = [
  {
    name: 'FusionTrack',
    description: 'Graduation thesis and tracking-related research artifacts.',
    language: 'TeX',
    stargazers_count: 0,
    updated_at: '2026-05-16T15:24:53Z',
    html_url: 'https://github.com/wcx12/FusionTrack',
    readme_url: 'https://raw.githubusercontent.com/wcx12/FusionTrack/main/README.md',
    interests: ['point-cloud-registration']
  },
  {
    name: 'wcx12',
    description: 'Interactive GitHub profile and research homepage.',
    language: 'JavaScript',
    stargazers_count: 2,
    updated_at: '2026-05-16T15:56:07Z',
    html_url: 'https://github.com/wcx12/wcx12',
    readme_url: 'https://raw.githubusercontent.com/wcx12/wcx12/main/README.md',
    interests: []
  },
  {
    name: 'hlpp-crossword',
    description: 'Interactive learning/game project for classroom selection and practice.',
    language: 'TypeScript',
    stargazers_count: 1,
    updated_at: '2026-05-13T11:45:15Z',
    html_url: 'https://github.com/wcx12/hlpp-crossword',
    readme_url: 'https://raw.githubusercontent.com/wcx12/hlpp-crossword/master/README.md',
    interests: ['ai4edu']
  },
  {
    name: 'codex-pet-battle',
    description: 'Agent-style companion project with leveling, skills, and battles.',
    language: null,
    stargazers_count: 0,
    updated_at: '2026-05-06T14:30:11Z',
    html_url: 'https://github.com/wcx12/codex-pet-battle',
    readme_url: 'https://raw.githubusercontent.com/wcx12/codex-pet-battle/main/README.md',
    interests: ['agent']
  },
  {
    name: 'shuxuepeiyou',
    description: 'Mathematics enrichment notes and education resources.',
    language: 'TeX',
    stargazers_count: 0,
    updated_at: '2026-05-05T03:08:07Z',
    html_url: 'https://github.com/wcx12/shuxuepeiyou',
    readme_url: 'https://raw.githubusercontent.com/wcx12/shuxuepeiyou/main/README.md',
    interests: ['ai4edu']
  },
  {
    name: 'tetrahedron-visualizer',
    description: 'Geometry visualization for mathematical intuition.',
    language: 'JavaScript',
    stargazers_count: 0,
    updated_at: '2026-04-18T15:51:40Z',
    html_url: 'https://github.com/wcx12/tetrahedron-visualizer',
    readme_url: 'https://raw.githubusercontent.com/wcx12/tetrahedron-visualizer/master/README.md',
    interests: ['ai4edu', 'point-cloud-registration']
  },
  {
    name: 'BIT-The-mathematical-foundation-of-big-Data',
    description: 'Course notes for mathematical foundations of big data.',
    language: 'TeX',
    stargazers_count: 0,
    updated_at: '2024-10-05T11:04:02Z',
    html_url: 'https://github.com/wcx12/BIT-The-mathematical-foundation-of-big-Data',
    readme_url: 'https://raw.githubusercontent.com/wcx12/BIT-The-mathematical-foundation-of-big-Data/main/README.md',
    interests: ['ai4edu']
  }
];

const staticPublications = [
  {
    title: 'TF-VPR: A novel benchmark for training-free visual place recognition',
    venue: 'Neurocomputing',
    year: '2026',
    status: 'Published',
    summary: 'Benchmark work connected to visual place recognition and visual localization.',
    link: 'https://doi.org/10.1016/j.neucom.2026.133399',
    interests: ['vpr']
  }
];

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
const GITHUB_CONFIG_PATH = 'research-config.json';
const GITHUB_REPOSITORY = 'wcx12/wcx12';
const GITHUB_BRANCH = 'main';
const GITHUB_OWNER = 'wcx12';
const OWNER_TOOLS_KEY = 'wcx12-owner-tools';
const GITHUB_TOKEN_KEY = 'wcx12-github-token';

function detectOwnerTools() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('ownerTools') === '1') localStorage.setItem(OWNER_TOOLS_KEY, 'enabled');
  if (params.get('ownerTools') === '0') localStorage.removeItem(OWNER_TOOLS_KEY);
  return localStorage.getItem(OWNER_TOOLS_KEY) === 'enabled';
}

const ownerToolsEnabled = detectOwnerTools();
const RESEARCH_CONFIG_VERSION = 2;

const defaultResearchInterests = JSON.parse(JSON.stringify(researchInterests));

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

function normalizeResearchConfig(config) {
  const defaults = defaultResearchConfig();
  const incomingInterests = Array.isArray(config?.interests) && config.interests.length ? config.interests : defaults.interests;
  const shouldBackfillDefaults = !config?.version || Number(config.version) < RESEARCH_CONFIG_VERSION;
  return {
    version: RESEARCH_CONFIG_VERSION,
    interests: shouldBackfillDefaults ? mergeDefaultResearchInterests(incomingInterests, defaults.interests) : incomingInterests,
    repoAssignments: { ...defaults.repoAssignments, ...(config?.repoAssignments || {}) },
    paperAssignments: { ...defaults.paperAssignments, ...(config?.paperAssignments || {}) }
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
    const response = await fetch(`${CONFIG_PATH}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remoteConfig = await response.json();
    applyResearchConfig(remoteConfig);
    if (ownerToolsEnabled) localStorage.setItem(CONFIG_KEY, JSON.stringify(researchConfig));
    renderResearchInterest();
    renderRepos(filteredRepos);
    renderPublications();
    if (ownerToolsEnabled && managerRemoteStatus) {
      managerRemoteStatus.textContent = i18n[currentLang].manager_remote_loaded;
    }
  } catch {
    if (ownerToolsEnabled && managerRemoteStatus) {
      managerRemoteStatus.textContent = i18n[currentLang].manager_remote_load_fail;
    }
  }
}

function saveResearchConfig() {
  if (!ownerToolsEnabled) return;
  researchConfig.interests = researchInterests;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(researchConfig));
}

const repoState = {
  mode: 'pagination',
  pageSize: 12,
  page: 1,
  infiniteCount: 12
};

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
    theme_neon: 'Default',
    theme_warm: 'Warm Archive',
    theme_mono: 'Mono Lab',
    hero_kicker: 'Machine Learning Researcher',
    hero_hi: 'Hi, I am',
    hero_status: 'Status',
    hero_subtitle_html: 'Point Set Registration + Anomaly Detection.<br />Building clean pipelines and practical open-source tools.',
    hero_preview_label: 'Research Preview',
    hero_preview_live: 'live',
    hero_preview_hint: 'Click to open this research lane.',
    featured_research_label: 'Featured Research',
    featured_research_hint: 'Fast entry points into the demo gallery.',
    preview_projects: 'Projects',
    preview_papers: 'Papers',
    explore_research: 'Explore',
    repo_preview_title: 'Repository Preview',
    repo_preview_readme: 'Read README',
    btn_command: 'Command',
    btn_contact: 'Contact Me',
    btn_repos: 'Explore My Repos',
    lab_eyebrow: 'live sandbox',
    lab_title: 'Point Set Registration',
    lab_desc: 'Tune noise, missing points, and rotation, then run a lightweight alignment preview.',
    lab_noise: 'Noise',
    lab_missing: 'Missing',
    lab_rotation: 'Rotation',
    lab_align: 'Align',
    lab_reset: 'Reset',
    stat_focus: 'Focus Areas',
    stat_grad: 'Graduation',
    stat_stack: 'Main Stack',
    hints: 'Shortcuts: Ctrl/⌘K commands · P projects · R research · L language · / search repos',
    tab_about: 'about',
    tab_research: 'research',
    tab_projects: 'projects',
    tab_publications: 'publications',
    tab_timeline: 'timeline',
    tab_skills: 'skills',
    tab_resources: 'resources',
    tab_contact: 'contact',
    about_title: 'About',
    about_line1: 'I study at Beijing Institute of Technology and expect to graduate in 2026.',
    about_line2: 'I enjoy combining geometric understanding with reliable engineering delivery.',
    research_title: 'Research Interests',
    research_intro: 'Choose a sub-interest to see related demos, projects, and papers.',
    manage_research: 'Manage Mapping',
    research_1: 'Point set registration under noisy and incomplete observations',
    research_2: 'Anomaly detection for complex and high-dimensional signals',
    research_3: 'Robust ML pipelines and reproducible experiments',
    view_details: 'View Details',
    related_projects: 'Related Projects',
    related_papers: 'Related Papers',
    section_animation: 'Animation',
    section_projects: 'Projects',
    section_papers: 'Papers',
    show_in_projects: 'Show in Projects',
    show_in_research: 'Show in Research',
    no_related_projects: 'No mapped project yet.',
    no_related_papers: 'No mapped paper yet.',
    manager_title: 'Research Mapping',
    manager_add_title: 'Add Category',
    manager_domain: 'Domain',
    manager_interest: 'Sub-interest',
    manager_label: 'Label',
    manager_animation: 'Animation',
    manager_add: 'Add',
    manager_assign_title: 'Assign Current Category',
    manager_save: 'Apply Mapping',
    manager_token: 'GitHub token',
    manager_save_remote: 'Save to GitHub',
    manager_remote_hint: 'Token stays in this browser session.',
    manager_remote_loaded: 'Remote config loaded.',
    manager_remote_load_fail: 'Using local defaults. Remote config was not loaded.',
    manager_remote_need_token: 'Paste a GitHub token with Contents read/write permission.',
    manager_remote_saving: 'Saving to GitHub...',
    manager_remote_saved: 'Saved to GitHub. Pages may take about a minute to rebuild.',
    manager_remote_unchanged: 'GitHub config is already up to date.',
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
    unmapped_title: 'Unmapped',
    unmapped_label: 'Needs category',
    fallback_profile_title: 'Profile',
    fallback_profile_label: 'Homepage',
    fallback_general_title: 'General',
    fallback_general_label: 'Other projects',
    repo_search_ph: 'Search repositories...',
    sort_updated: 'Sort: Updated',
    sort_stars: 'Sort: Stars',
    sort_name: 'Sort: Name',
    mode_pagination: 'Mode: Pagination',
    mode_infinite: 'Mode: Infinite',
    page_prev: 'Prev',
    page_next: 'Next',
    page_info: 'Page {page}/{total}',
    repo_count: 'Showing {shown}/{total} repositories',
    pub_count: 'Showing {shown}/{total} publications',
    infinite_hint: 'Scroll down to auto-load more',
    timeline_title: 'Timeline',
    timeline_2024: 'Focused on strengthening ML engineering foundations and reproducible workflows.',
    timeline_2025: 'Deepening research on point set registration and anomaly signal analysis.',
    timeline_2026: 'Graduation year and active applications for Master\'s / PhD opportunities.',
    skill_title: 'Skill Matrix',
    skill_hint: 'Click a skill chip to highlight what I use.',
    res_title: 'Resume & Files',
    pub_title: 'Publications',
    pub_desc: 'Publication entries are shown below with status and links.',
    pub_loading: 'Loading publications from ORCID...',
    pub_load_fail: 'Unable to load from ORCID right now. Showing local fallback list.',
    pub_empty: 'No public publication records found yet.',
    pub_open: 'Open Publication List',
    pub_file_title: 'Raw Publication File',
    pub_file_desc: 'Open source markdown list.',
    cv_title: 'Resume',
    cv_desc: 'Download my latest CV snapshot from this repository.',
    cv_download: 'Download Resume',
    contact_title: 'Contact',
    contact_last: 'Open to research collaboration and open-source building.',
    footer: '© 2026 wcx12',
    command_placeholder: 'Type a command or repository...',
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
    details_research_body: 'Current work emphasizes robust geometric matching, anomaly signal understanding, and reproducible engineering pipelines.',
    details_project_link_text: 'Open Repository',
    project_overview: 'Project Overview',
    project_mapping: 'Research Mapping',
    project_updated: 'Updated',
    modal_close: 'x',
    lang_btn: '中文',
    chip_loaded: 'Loaded: {tag} -> actively used in my current workflow.',
    statuses: [
      'Applying for Master/PhD programs',
      'Building robust ML experiments',
      'Open to research collaboration'
    ]
  },
  zh: {
    theme_neon: '默认风格',
    theme_warm: '暖色档案',
    theme_mono: '黑白极简',
    hero_kicker: '机器学习研究者',
    hero_hi: '你好，我是',
    hero_status: '状态',
    hero_subtitle_html: '点集配准 + 异常检测。<br />专注于可复现、可落地的机器学习工程。',
    hero_preview_label: '研究预览',
    hero_preview_live: '实时',
    hero_preview_hint: '点击进入这个研究方向。',
    featured_research_label: '精选研究方向',
    featured_research_hint: '快速进入对应动画、项目与论文。',
    preview_projects: '项目',
    preview_papers: '论文',
    explore_research: '进入研究',
    repo_preview_title: '仓库预览',
    repo_preview_readme: '查看 README',
    btn_command: '命令',
    btn_contact: '联系我',
    btn_repos: '查看我的仓库',
    lab_eyebrow: '实时实验台',
    lab_title: '点集配准演示',
    lab_desc: '调节噪声、缺失比例和旋转角度，然后运行一次轻量配准预览。',
    lab_noise: '噪声',
    lab_missing: '缺失',
    lab_rotation: '旋转',
    lab_align: '配准',
    lab_reset: '重置',
    stat_focus: '研究方向',
    stat_grad: '毕业时间',
    stat_stack: '主要技术栈',
    hints: '快捷键：Ctrl/⌘K 命令 · P 项目 · R 研究 · L 语言切换 · / 搜索仓库',
    tab_about: '关于',
    tab_research: '研究',
    tab_projects: '项目',
    tab_publications: '论文',
    tab_timeline: '时间线',
    tab_skills: '技能',
    tab_resources: '资源',
    tab_contact: '联系',
    about_title: '关于我',
    about_line1: '我目前在北京理工大学学习，预计 2026 年毕业。',
    about_line2: '我喜欢把几何理解和可靠工程实现结合起来。',
    research_title: '研究兴趣',
    research_intro: '选择一个子兴趣，查看关联动画、项目和论文。',
    manage_research: '管理映射',
    research_1: '在噪声和缺失观测下的点集配准',
    research_2: '复杂高维信号中的异常检测',
    research_3: '稳健的机器学习流水线与可复现实验',
    view_details: '查看详情',
    related_projects: '相关项目',
    related_papers: '相关论文',
    section_animation: '动画',
    section_projects: '项目',
    section_papers: '论文',
    show_in_projects: '在项目中显示',
    show_in_research: '查看研究方向',
    no_related_projects: '暂未映射项目。',
    no_related_papers: '暂未映射论文。',
    manager_title: '研究映射',
    manager_add_title: '添加分类',
    manager_domain: '一级领域',
    manager_interest: '子兴趣',
    manager_label: '标签',
    manager_animation: '动画',
    manager_add: '添加',
    manager_assign_title: '分配当前分类',
    manager_save: '应用映射',
    manager_token: 'GitHub token',
    manager_save_remote: '保存到 GitHub',
    manager_remote_hint: 'Token 只保存在当前浏览器会话中。',
    manager_remote_loaded: '已加载远程配置。',
    manager_remote_load_fail: '未加载远程配置，正在使用本地默认值。',
    manager_remote_need_token: '请输入具有 Contents 读写权限的 GitHub token。',
    manager_remote_saving: '正在保存到 GitHub...',
    manager_remote_saved: '已保存到 GitHub，Pages 可能需要约一分钟重新构建。',
    manager_remote_unchanged: 'GitHub 配置已是最新。',
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
    unmapped_title: '未映射',
    unmapped_label: '需要分类',
    fallback_profile_title: '主页',
    fallback_profile_label: '个人主页',
    fallback_general_title: '通用',
    fallback_general_label: '其它项目',
    repo_search_ph: '搜索仓库...',
    sort_updated: '排序：最近更新',
    sort_stars: '排序：星标数',
    sort_name: '排序：名称',
    mode_pagination: '模式：分页',
    mode_infinite: '模式：无限加载',
    page_prev: '上一页',
    page_next: '下一页',
    page_info: '第 {page}/{total} 页',
    repo_count: '显示 {shown}/{total} 个仓库',
    pub_count: '显示 {shown}/{total} 篇论文',
    infinite_hint: '向下滚动自动加载更多',
    timeline_title: '时间线',
    timeline_2024: '强化机器学习工程基础与可复现实验流程。',
    timeline_2025: '深入开展点集配准与异常信号分析研究。',
    timeline_2026: '毕业年份，同时积极申请硕士/博士机会。',
    skill_title: '技能矩阵',
    skill_hint: '点击技能标签可查看当前使用说明。',
    res_title: '简历与文件',
    pub_title: '论文发表',
    pub_desc: '论文条目直接展示在页面中，包含状态和跳转链接。',
    pub_loading: '正在从 ORCID 加载论文...',
    pub_load_fail: '当前无法从 ORCID 加载，已显示本地备用列表。',
    pub_empty: '暂未发现公开论文记录。',
    pub_open: '打开论文列表文件',
    pub_file_title: '原始论文文件',
    pub_file_desc: '查看仓库中的 markdown 列表。',
    cv_title: '简历',
    cv_desc: '从当前仓库下载最新简历快照。',
    cv_download: '下载简历',
    contact_title: '联系方式',
    contact_last: '欢迎研究合作与开源协作。',
    footer: '© 2026 wcx12',
    command_placeholder: '输入命令或仓库名称...',
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
    details_research_body: '当前重点在稳健几何匹配、异常信号理解，以及可复现的工程化流程。',
    details_project_link_text: '打开仓库',
    project_overview: '项目概览',
    project_mapping: '研究映射',
    project_updated: '更新时间',
    modal_close: 'x',
    lang_btn: 'EN',
    chip_loaded: '已加载: {tag} -> 已纳入当前工作流。',
    statuses: [
      '正在申请硕士/博士项目',
      '构建稳健的机器学习实验体系',
      '欢迎科研合作'
    ]
  }
};

function activateView(viewId) {
  commands.forEach((c) => c.classList.remove('active'));
  views.forEach((v) => v.classList.remove('active'));
  const targetCmd = document.querySelector(`.cmd[data-view="${viewId}"]`);
  const targetView = document.getElementById(viewId);
  if (targetCmd) targetCmd.classList.add('active');
  if (targetView) targetView.classList.add('active');
  if (viewId === 'projects') requestAnimationFrame(() => renderRepoMap(filteredRepos));
  if (viewId === 'research') requestAnimationFrame(renderResearchInterest);
  if (viewId === 'publications') requestAnimationFrame(renderPublications);
  if (targetView && ['projects', 'research', 'publications'].includes(viewId)) {
    requestAnimationFrame(() => targetView.closest('.console')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}

commands.forEach((btn) => btn.addEventListener('click', () => activateView(btn.dataset.view)));
openProjects.addEventListener('click', () => {
  activateView('projects');
  repoSearch.focus();
});

function commandItems() {
  const viewItems = Array.from(commands).map((btn) => ({
    title: btn.textContent,
    detail: i18n[currentLang].command_jump,
    type: i18n[currentLang].command_palette,
    action: () => activateView(btn.dataset.view)
  }));

  const utilityItems = [
    {
      title: i18n[currentLang].command_search_repos,
      detail: '/',
      type: i18n[currentLang].command_search,
      action: () => {
        activateView('projects');
        repoSearch.focus();
      }
    },
    {
      title: i18n[currentLang].command_search_research,
      detail: i18n[currentLang].featured_research_label,
      type: i18n[currentLang].command_search,
      action: () => activateView('research')
    },
    {
      title: i18n[currentLang].command_search_papers,
      detail: i18n[currentLang].tab_publications,
      type: i18n[currentLang].command_search,
      action: () => activateView('publications')
    },
    {
      title: i18n[currentLang].command_theme,
      detail: currentTheme,
      type: i18n[currentLang].command_run,
      action: () => {
        const order = ['neon', 'warm', 'mono'];
        applyTheme(order[(order.indexOf(currentTheme) + 1) % order.length]);
      }
    },
    {
      title: i18n[currentLang].command_toggle_lang,
      detail: i18n[currentLang].lang_btn,
      type: i18n[currentLang].command_run,
      action: () => langToggle.click()
    },
    {
      title: i18n[currentLang].command_github,
      detail: 'github.com/wcx12',
      type: i18n[currentLang].command_open,
      action: () => window.open('https://github.com/wcx12', '_blank', 'noreferrer')
    },
    {
      title: i18n[currentLang].command_orcid,
      detail: ORCID_ID,
      type: i18n[currentLang].command_open,
      action: () => window.open(`https://orcid.org/${ORCID_ID}`, '_blank', 'noreferrer')
    }
  ];

  const researchItems = allInterestChildren().map(({ domain, child }) => ({
    title: textFor(child.title),
    detail: `${textFor(domain.title)} / ${textFor(child.label)}`,
    type: i18n[currentLang].tab_research,
    action: () => jumpToResearchInterest(child.id)
  }));

  const paperItems = currentPublications().map((paper) => ({
    title: paper.title,
    detail: `${paper.venue || ''} ${paper.year || ''}`.trim() || i18n[currentLang].tab_publications,
    type: i18n[currentLang].tab_publications,
    action: () => openPaperDetail(paper.title)
  }));

  const repoItems = allRepos.map((repo) => ({
    title: repo.name,
    detail: repo.description || i18n[currentLang].no_desc,
    type: i18n[currentLang].command_repo,
    action: () => openRepoDetail(repo.name)
  }));

  return [...utilityItems, ...viewItems, ...researchItems, ...paperItems, ...repoItems];
}

function filteredCommandItems() {
  const query = commandInput.value.trim().toLowerCase();
  const items = commandItems();
  if (!query) return items.slice(0, 12);
  return items
    .filter((item) => `${item.title} ${item.detail} ${item.type}`.toLowerCase().includes(query))
    .slice(0, 12);
}

function renderCommandList() {
  const items = filteredCommandItems();
  commandCursor = Math.min(commandCursor, Math.max(items.length - 1, 0));
  if (!items.length) {
    commandList.innerHTML = `<p class="muted">${i18n[currentLang].command_empty}</p>`;
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
}

function openCommandPalette() {
  commandPalette.classList.add('open');
  commandPalette.setAttribute('aria-hidden', 'false');
  commandInput.value = '';
  commandCursor = 0;
  renderCommandList();
  requestAnimationFrame(() => commandInput.focus());
}

function closeCommandPalette() {
  commandPalette.classList.remove('open');
  commandPalette.setAttribute('aria-hidden', 'true');
}

openCommand.addEventListener('click', openCommandPalette);
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
        <strong>${textFor(domain.title)}</strong>
        <span>${textFor(domain.label)}</span>
      </div>
      ${domain.children.map((child) => `
        <button class="interest-child ${child.id === activeInterestId ? 'active' : ''}" type="button" data-interest="${child.id}">
          ${textFor(child.title)}
          <small>${textFor(child.label)}</small>
        </button>
      `).join('')}
    </section>
  `).join('');

  interestRail.querySelectorAll('.interest-child').forEach((button) => {
    button.addEventListener('click', () => {
      activeInterestId = button.dataset.interest;
      renderResearchInterest();
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
  const map = kind === 'repo' ? researchConfig.repoAssignments : researchConfig.paperAssignments;
  const key = itemKey(item);
  if (Array.isArray(map[key])) return map[key];
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
    return `<span class="research-badge fallback ${fallback.className}">${fallback.title}</span>`;
  }
  const sourceKey = escapeHtml(itemKey(item));
  return ids.map((id) => `
    <button class="research-badge" type="button" data-interest-jump="${id}" data-interest-source-kind="${kind}" data-interest-source-key="${sourceKey}">
      ${interestLabel(id)}
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
        : currentPublications().find((paper) => paper.title === sourceKey);
      if (item) bindItemToInterestAnimation(item, sourceKind, button.dataset.interestJump);
      jumpToResearchInterest(button.dataset.interestJump);
    });
  });
}

function setInterestPanel(panel) {
  activeInterestPanel = ['animation', 'projects', 'papers'].includes(panel) ? panel : 'animation';
  if (interestDetail) interestDetail.dataset.panel = activeInterestPanel;
  interestSectionTabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.interestPanel === activeInterestPanel);
  });
}

function bindItemToInterestAnimation(item, kind, interestId) {
  if (!item) return;
  const resolvedInterestId = interestId || primaryInterestId(item, kind);
  if (!resolvedInterestId) return;
  const name = item.name || item.title || '';
  const description = item.description || item.summary || item.venue || '';
  const hay = `${name} ${description}`.toLowerCase();
  const hash = Math.abs(hashString(name));
  if (resolvedInterestId === 'point-cloud-registration') {
    pointCloudInteraction.active = true;
    pointCloudInteraction.x = 0.25 + (hash % 50) / 100;
    pointCloudInteraction.targetScrub = pointCloudInteraction.x;
    pointCloudInteraction.energy = 1;
  } else if (resolvedInterestId === 'vpr') {
    vprInteraction.active = true;
    vprInteraction.route = 0.12 + (hash % 76) / 100;
    vprInteraction.condition = hay.includes('tf') || hay.includes('benchmark')
      ? 0.72
      : 0.18 + ((hash >> 3) % 64) / 100;
    vprInteraction.targetRoute = vprInteraction.route;
    vprInteraction.selected = bestVprCandidate()?.id || null;
    vprInteraction.energy = 1;
  } else if (resolvedInterestId === 'agent') {
    agentInteraction.active = true;
    agentInteraction.taskIndex = hay.includes('readme') || kind === 'paper' ? 1 : 0;
    agentInteraction.selectedTool = hay.includes('rag') || hay.includes('retrieval') ? 'rag' : 'code';
    agentInteraction.selectedStage = agentInteraction.selectedTool === 'rag' ? 'retrieve' : 'act';
    agentInteraction.pulse = 1;
    agentInteraction.runBoost = 0.75;
  } else if (resolvedInterestId === 'ai4edu') {
    educationInteraction.active = true;
    educationInteraction.selectedPath = hay.includes('crossword') || hay.includes('content') ? 'content' : 'learner';
    educationInteraction.selectedConcept = hay.includes('tetrahedron') || hay.includes('geometry') ? 'geometry' : 'functions';
    educationInteraction.selectedSignal = 'hint';
    educationInteraction.pulse = 1;
    educationInteraction.masteryBoost = 1;
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
  activateView('research');
  renderResearchInterest();
  requestAnimationFrame(() => interestCanvas.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

function focusRepoInProjects(repoName) {
  highlightedRepo = repoName;
  repoSearch.value = '';
  filteredRepos = [...allRepos];
  const repoIndex = sortedRepos(filteredRepos).findIndex((repo) => repo.name === repoName);
  repoState.page = repoIndex >= 0 ? Math.floor(repoIndex / repoState.pageSize) + 1 : 1;
  repoState.infiniteCount = repoIndex >= 0 ? Math.max(repoState.pageSize, repoIndex + 1) : repoState.pageSize;
  activateView('projects');
  renderRepos(filteredRepos);
  requestAnimationFrame(() => {
    const card = Array.from(document.querySelectorAll('[data-repo]')).find((node) => node.dataset.repo === repoName);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    repoMap.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

function isResearchViewActive() {
  return document.getElementById('research')?.classList.contains('active');
}

function isProjectsViewActive() {
  return document.getElementById('projects')?.classList.contains('active');
}

function renderRelatedList(container, items, emptyText, kind) {
  if (!items.length) {
    container.innerHTML = `<p class="muted">${emptyText}</p>`;
    return;
  }

  container.innerHTML = items.slice(0, 4).map((item) => {
    const title = item.name || item.title;
    const detail = item.description || item.summary || item.language || item.venue || '';
    const meta = kind === 'repo'
      ? `${item.language || i18n[currentLang].mixed} · ${i18n[currentLang].star} ${item.stargazers_count || 0}`
      : `${item.venue || ''} · ${item.year || ''}`;
    const action = kind === 'repo'
      ? `<button class="mini-action" type="button" data-show-project="${title}">${i18n[currentLang].show_in_projects}</button>`
      : `<button class="mini-action" type="button" data-show-paper="${title}">${i18n[currentLang].tab_publications}</button>`;
    return `
      <div class="related-item">
        <button class="related-link" type="button" data-kind="${kind}" data-key="${title}">${title}</button>
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
    papers: currentPublications().filter((paper) => assignedInterestIds(paper, 'paper').includes(interestId)).length
  };
}

function heroPreviewEntry() {
  const entries = allInterestChildren();
  if (!entries.length) return null;
  return interestEntryById(activeInterestId) || entries[Math.floor(heroPreviewTick / 420) % entries.length];
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
      <button class="research-showcase-card ${activeClass}" type="button" data-showcase-interest="${escapeHtml(child.id)}" style="--delay:${index}">
        <span class="panel-eyebrow">${escapeHtml(textFor(domain.title))}</span>
        <strong>${escapeHtml(textFor(child.title))}</strong>
        <span class="showcase-label">${escapeHtml(textFor(child.label))}</span>
        <span class="showcase-desc">${escapeHtml(textFor(child.description))}</span>
        <span class="showcase-metrics">
          <span>${metrics.projects} ${i18n[currentLang].preview_projects}</span>
          <span>${metrics.papers} ${i18n[currentLang].preview_papers}</span>
        </span>
      </button>
    `;
  }).join('');

  researchShowcase.querySelectorAll('[data-showcase-interest]').forEach((button) => {
    button.addEventListener('click', () => {
      activeInterestId = button.dataset.showcaseInterest;
      setInterestPanel('animation');
      renderResearchInterest();
      requestAnimationFrame(() => interestCanvas.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    });
  });
}

function renderHeroPreview() {
  const entry = heroPreviewEntry();
  if (!entry || !heroPreviewMeta) return;
  const metrics = interestMetrics(entry.child.id);
  if (heroPreviewStatus) heroPreviewStatus.textContent = i18n[currentLang].hero_preview_live;
  heroPreviewMeta.innerHTML = `
    <button class="hero-preview-title" type="button" data-hero-interest="${escapeHtml(entry.child.id)}">
      <span>${escapeHtml(textFor(entry.domain.title))}</span>
      <strong>${escapeHtml(textFor(entry.child.title))}</strong>
    </button>
    <p>${escapeHtml(textFor(entry.child.description))}</p>
    <div class="hero-preview-pills">
      <span>${metrics.projects} ${i18n[currentLang].preview_projects}</span>
      <span>${metrics.papers} ${i18n[currentLang].preview_papers}</span>
      <span>${i18n[currentLang].hero_preview_hint}</span>
    </div>
  `;
  heroPreviewMeta.querySelector('[data-hero-interest]')?.addEventListener('click', () => jumpToResearchInterest(entry.child.id));
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
    renderResearchShowcase();
    renderHeroPreview();
    return;
  }
  interestPath.textContent = `${textFor(entry.domain.title)} / ${textFor(entry.child.title)}`;
  interestTitle.textContent = textFor(entry.child.title);
  interestTag.textContent = textFor(entry.child.label);
  interestDescription.textContent = textFor(entry.child.description);
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
  setInterestPanel(activeInterestPanel);
  renderInterestRail();
  renderRelatedList(interestProjects, relatedRepos(), i18n[currentLang].no_related_projects, 'repo');
  renderRelatedList(interestPapers, relatedPapers(), i18n[currentLang].no_related_papers, 'paper');
  renderResearchShowcase();
  renderHeroPreview();
  if (isResearchViewActive()) drawInterestAnimation();
}

function applyTheme(theme) {
  currentTheme = ['neon', 'warm', 'mono'].includes(theme) ? theme : 'neon';
  document.documentElement.dataset.theme = currentTheme;
  themeSelect.value = currentTheme;
  localStorage.setItem('wcx12-theme', currentTheme);
  drawRegistrationDemo();
  if (isProjectsViewActive()) renderRepoMap(filteredRepos);
  if (isResearchViewActive()) drawInterestAnimation();
  drawHeroPreviewCanvas();
}

themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
interestSectionTabs.forEach((button) => {
  button.addEventListener('click', () => setInterestPanel(button.dataset.interestPanel));
});

function openResearchManager() {
  if (!ownerToolsEnabled) return;
  managerGitHubToken.value = sessionStorage.getItem(GITHUB_TOKEN_KEY) || '';
  renderResearchManager();
  researchManager.classList.add('open');
  researchManager.setAttribute('aria-hidden', 'false');
}

function closeResearchManager() {
  researchManager.classList.remove('open');
  researchManager.setAttribute('aria-hidden', 'true');
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
      <input type="checkbox" data-kind="repo" value="${repo.name}" ${projectIds.has(repo.name) ? 'checked' : ''} />
      <span>${repo.name}</span>
    </label>
  `).join('');

  const paperIds = new Set(relatedPapers().map((item) => itemKey(item)));
  managerPapers.innerHTML = currentPublications().map((paper) => `
    <label class="manager-check">
      <input type="checkbox" data-kind="paper" value="${paper.title}" ${paperIds.has(paper.title) ? 'checked' : ''} />
      <span>${paper.title}</span>
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
  collectManagerAssignments();
  saveResearchConfig();
  renderResearchInterest();
  renderResearchManager();
  managerActive.textContent = `${i18n[currentLang].manager_saved} ${managerActive.textContent}`;
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

async function fetchGitHubConfigFile(token) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPOSITORY}/contents/${GITHUB_CONFIG_PATH}`;
  const current = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
    cache: 'no-store',
    headers: githubHeaders(token)
  });

  if (!current.ok) {
    const detail = await readGitHubError(current);
    throw new Error(`read ${current.status}: ${detail}`);
  }

  return current.json();
}

async function writeGitHubConfigFile(token, sha) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPOSITORY}/contents/${GITHUB_CONFIG_PATH}`;
  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      ...githubHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Update research mapping config',
      branch: GITHUB_BRANCH,
      sha,
      content: toBase64Utf8(`${JSON.stringify(researchConfig, null, 2)}\n`)
    })
  });

  if (!response.ok) {
    const detail = await readGitHubError(response);
    const error = new Error(`write ${response.status}: ${detail}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function updateResearchConfigOnGitHub(token) {
  const currentFile = await fetchGitHubConfigFile(token);

  try {
    return await writeGitHubConfigFile(token, currentFile.sha);
  } catch (error) {
    if (error.status === 409) {
      const latestFile = await fetchGitHubConfigFile(token);
      return writeGitHubConfigFile(token, latestFile.sha);
    }

    if (error.status === 422 && error.message.toLowerCase().includes('content is unchanged')) {
      return { unchanged: true };
    }

    throw error;
  }
}

async function saveResearchConfigToGitHub() {
  if (!ownerToolsEnabled) return;
  collectManagerAssignments();
  saveResearchConfig();

  const token = managerGitHubToken.value.trim() || sessionStorage.getItem(GITHUB_TOKEN_KEY) || '';
  if (!token) {
    managerRemoteStatus.textContent = i18n[currentLang].manager_remote_need_token;
    managerGitHubToken.focus();
    return;
  }

  sessionStorage.setItem(GITHUB_TOKEN_KEY, token);
  managerRemoteStatus.textContent = i18n[currentLang].manager_remote_saving;
  managerSaveRemote.disabled = true;

  try {
    const result = await updateResearchConfigOnGitHub(token);
    managerRemoteStatus.textContent = result.unchanged
      ? i18n[currentLang].manager_remote_unchanged
      : i18n[currentLang].manager_remote_saved;
  } catch (error) {
    managerRemoteStatus.textContent = `${i18n[currentLang].manager_remote_failed} (${error.message})`;
  } finally {
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
}

manageResearch.hidden = !ownerToolsEnabled;
manageResearch.addEventListener('click', openResearchManager);
managerClose.addEventListener('click', closeResearchManager);
researchManager.addEventListener('click', (event) => {
  if (event.target === researchManager) closeResearchManager();
});
managerSave.addEventListener('click', saveManagerAssignments);
managerSaveRemote.addEventListener('click', saveResearchConfigToGitHub);
managerAdd.addEventListener('click', addResearchCategory);
managerDelete.addEventListener('click', deleteActiveResearchCategory);

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    chipOutput.textContent = i18n[currentLang].chip_loaded.replace('{tag}', chip.dataset.tag);
  });
});

function openModal(config) {
  modalTitle.textContent = config.title;
  if (config.html) modalBody.innerHTML = config.html;
  else modalBody.textContent = config.body || '';
  if (config.link) {
    modalLink.style.display = 'inline-flex';
    modalLink.textContent = config.linkText || i18n[currentLang].open_external;
    modalLink.href = config.link;
  } else {
    modalLink.style.display = 'none';
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

modalClose.addEventListener('click', closeModal);
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

function safeMarkdownUrl(url) {
  const value = String(url || '').trim();
  if (/^(javascript|data):/i.test(value)) return '#';
  return escapeHtml(value);
}

function renderInlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => `<img src="${safeMarkdownUrl(url)}" alt="${escapeHtml(alt)}" loading="lazy" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${safeMarkdownUrl(url)}" target="_blank" rel="noreferrer">${label}</a>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function markdownTableCells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isMarkdownTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function renderMarkdownTable(rows) {
  const [head, ...body] = rows;
  return `
    <table>
      <thead><tr>${head.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('')}</tr></thead>
      <tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;
}

function markdownToHtml(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let listType = null;
  let codeFence = null;
  let codeLines = [];

  const closeParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br />')}</p>`);
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
      html.push(renderMarkdownTable(rows));
      return;
    }

    if (isMarkdownTableSeparator(line)) return;

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 6);
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
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
      html.push(`<li>${renderInlineMarkdown((unordered || ordered)[1])}</li>`);
      return;
    }

    if (trimmed.startsWith('>')) {
      closeParagraph();
      closeList();
      html.push(`<blockquote>${renderInlineMarkdown(trimmed.replace(/^>\s?/, ''))}</blockquote>`);
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

async function openRepoReadme(repoName) {
  const repo = allRepos.find((item) => item.name === repoName);
  if (!repo) return;
  const overview = () => `
    <div class="project-overview">
      <span class="panel-eyebrow">${i18n[currentLang].project_overview}</span>
      <p>${escapeHtml(repo.description || i18n[currentLang].no_desc)}</p>
      <div class="research-badges">${researchBadgesHtml(repo, 'repo')}</div>
      <div class="repo-meta">
        <span>${i18n[currentLang].project_mapping}: ${escapeHtml(repoMappingLabel(repo))}</span>
        <span>${i18n[currentLang].project_updated}: ${escapeHtml((repo.updated_at || '').slice(0, 10) || '-')}</span>
      </div>
    </div>
  `;
  openModal({
    title: repo.name,
    html: `${overview()}<p class="muted">${i18n[currentLang].readme_loading}</p>`,
    linkText: i18n[currentLang].details_project_link_text,
    link: repo.html_url
  });
  attachInterestJumpHandlers(modalBody);

  try {
    const response = await fetch(repo.readme_url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    modalBody.innerHTML = `${overview()}<div class="readme-box readme-content">${markdownToHtml(markdown)}</div>`;
  } catch {
    modalBody.innerHTML = `${overview()}<div class="readme-box"><p>${i18n[currentLang].readme_unavailable}</p></div>`;
  }
  attachInterestJumpHandlers(modalBody);
}

function openPaperDetail(title) {
  const paper = currentPublications().find((item) => item.title === title);
  if (!paper) return;
  openModal({
    title: paper.title,
    html: `<div class="readme-box"><p class="muted">${paper.venue || ''} · ${paper.year || ''}</p><div class="research-badges">${researchBadgesHtml(paper, 'paper')}</div><p>${paper.summary || ''}</p></div>`,
    linkText: i18n[currentLang].open_external,
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
  const desc = escapeHtml(repo.description || i18n[currentLang].no_desc);
  return `
    <article class="repo-card repo-preview-card ${highlightedRepo === repo.name ? 'highlight' : ''}" data-repo="${safeName}" style="--repo-accent:${accent}">
      <div class="repo-preview-top">
        <div>
          <span class="panel-eyebrow">${i18n[currentLang].repo_preview_title}</span>
          <h3><a href="${repo.html_url}" target="_blank" rel="noreferrer">${safeName}</a></h3>
        </div>
        <div class="repo-preview-visual" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </div>
      <p class="muted repo-preview-desc">${desc}</p>
      <div class="research-badges">${researchBadgesHtml(repo, 'repo')}</div>
      <div class="repo-preview-facts">
        <span>${i18n[currentLang].project_mapping}</span>
        <strong>${escapeHtml(mappingLabel)}</strong>
        <span>${i18n[currentLang].project_updated}</span>
        <strong>${escapeHtml(repoUpdatedDate(repo))}</strong>
      </div>
      <div class="repo-meta">
        <span>${i18n[currentLang].star} ${repo.stargazers_count}</span>
        <span>${escapeHtml(repo.language || i18n[currentLang].mixed)}</span>
      </div>
      <div class="repo-actions">
        <button class="btn btn-outline repo-detail" type="button" data-repo="${safeName}">${i18n[currentLang].repo_preview_readme}</button>
        ${repoInterestId ? `<button class="btn btn-outline repo-research" type="button" data-repo="${safeName}">${i18n[currentLang].show_in_research}</button>` : ''}
        <a class="btn btn-primary" href="${repo.html_url}" target="_blank" rel="noreferrer">${i18n[currentLang].open_repo}</a>
      </div>
    </article>
  `;
}

function renderRepos(repos, preserveScroll = false) {
  const beforeScroll = repoGrid.scrollTop;
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

  repoCount.textContent = i18n[currentLang].repo_count
    .replace('{shown}', String(shown.length))
    .replace('{total}', String(total));

  if (!shown.length) {
    repoGrid.innerHTML = `<p class="muted">${i18n[currentLang].no_repos}</p>`;
    if (isProjectsViewActive()) renderRepoMap(items);
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

  if (isProjectsViewActive()) renderRepoMap(items);
  if (preserveScroll) repoGrid.scrollTop = beforeScroll;
}

function resizeDrawingCanvas(canvasElement, context) {
  const rect = canvasElement.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
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
  if (!entries.length) return fallbackPublicCategory(repo, 'repo').title;
  return entries.map((entry) => textFor(entry.child.title)).join(' + ');
}

function repoMapGroupKey(entries) {
  return entries.length
    ? entries.map((entry) => entry.child.id).sort().join('+')
    : 'unmapped';
}

function researchMapAnchors(width, height) {
  const entries = allInterestChildren();
  const compact = width < 520;
  const colors = researchMapPalette();
  const rows = Math.ceil(entries.length / 2);
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = Math.max(82, width * 0.34);
  const radiusY = Math.max(54, height * 0.28);

  return entries.map((entry, index) => {
    let x;
    let y;
    if (compact) {
      const col = index % 2;
      const row = Math.floor(index / 2);
      x = width * (col ? 0.72 : 0.28);
      y = 62 + row * ((height - 124) / Math.max(1, rows - 1));
    } else {
      const angle = (Math.PI * 2 * index) / Math.max(1, entries.length) - Math.PI / 2;
      x = centerX + Math.cos(angle) * radiusX;
      y = centerY + Math.sin(angle) * radiusY;
    }
    return {
      ...entry,
      id: entry.child.id,
      index,
      x,
      y,
      r: compact ? 34 : 44,
      color: colors[index % colors.length],
      domainTitle: textFor(entry.domain.title),
      childTitle: textFor(entry.child.title),
      mapTitle: entry.child.id === 'ai4edu' ? (currentLang === 'zh' ? 'AI4教育' : 'AI4Edu') : textFor(entry.child.title),
      label: textFor(entry.child.label)
    };
  });
}

function renderRepoMap(repos = filteredRepos) {
  const { width, height } = resizeDrawingCanvas(repoMap, repoMapCtx);
  repoMapCtx.clearRect(0, 0, width, height);

  const items = sortedRepos(repos);
  repoNodes = [];
  repoMapFieldNodes = [];
  const compact = width < 520;
  const primary = themeColor('--cyan') || '#00f5ff';
  const muted = themeColor('--muted') || '#9ca9cf';
  const textColor = themeColor('--text') || '#e8f0ff';

  repoMapCtx.strokeStyle = 'rgba(0, 245, 255, 0.12)';
  repoMapCtx.lineWidth = 1;
  for (let x = 40; x < width; x += 70) {
    repoMapCtx.beginPath();
    repoMapCtx.moveTo(x, 18);
    repoMapCtx.lineTo(x, height - 18);
    repoMapCtx.stroke();
  }
  for (let y = 35; y < height; y += 56) {
    repoMapCtx.beginPath();
    repoMapCtx.moveTo(18, y);
      repoMapCtx.lineTo(width - 18, y);
      repoMapCtx.stroke();
    }

  repoMapCtx.fillStyle = muted;
  repoMapCtx.font = compact ? '8.5px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
  fillTruncatedText(
    repoMapCtx,
    compact ? 'Grouped by research mapping' : 'Projects grouped by mapped research interest · shared projects sit between fields',
    18,
    20,
    width - 36
  );

  if (!items.length) {
    repoMapCtx.fillStyle = 'rgba(232, 240, 255, 0.72)';
    repoMapCtx.font = '14px JetBrains Mono, monospace';
    repoMapCtx.fillText(i18n[currentLang].no_repos, 22, 42);
    return;
  }

  const anchors = researchMapAnchors(width, height);
  const unmappedAnchor = {
    id: 'unmapped',
    x: compact ? width * 0.5 : width * 0.5,
    y: compact ? height - 32 : height - 38,
    r: compact ? 28 : 34,
    color: themeColor('--muted') || '#9ca9cf',
    mapTitle: i18n[currentLang].fallback_general_title,
    domainTitle: i18n[currentLang].fallback_general_label,
    index: anchors.length,
    child: { id: 'unmapped' }
  };
  const mapAnchors = [...anchors, unmappedAnchor];
  repoMapFieldNodes = mapAnchors;
  const anchorById = new Map(mapAnchors.map((anchor) => [anchor.id, anchor]));
  const contexts = items.map((repo, index) => {
    const entries = repoInterestEntries(repo);
    return { repo, index, entries, key: repoMapGroupKey(entries) };
  });
  const groups = new Map();
  contexts.forEach((context) => {
    if (!groups.has(context.key)) groups.set(context.key, []);
    groups.get(context.key).push(context.index);
  });

  mapAnchors.forEach((anchor) => {
    const active = hoveredMapField === anchor.id || (hoveredRepo && contexts.some((context) => (
      context.repo.name === hoveredRepo && (
        context.entries.some((entry) => entry.child.id === anchor.id)
        || (anchor.id === 'unmapped' && !context.entries.length)
      )
    )));
    const pulse = 2 + (Math.sin(repoMapTick * 0.035 + anchor.index) + 1) * 2;
    repoMapCtx.beginPath();
    repoMapCtx.arc(anchor.x, anchor.y, anchor.r + pulse, 0, Math.PI * 2);
    repoMapCtx.fillStyle = colorWithAlpha(anchor.color, active ? 0.16 : 0.07);
    repoMapCtx.fill();
    repoMapCtx.strokeStyle = colorWithAlpha(anchor.color, active ? 0.62 : 0.32);
    repoMapCtx.lineWidth = active ? 1.7 : 1;
    repoMapCtx.stroke();
    repoMapCtx.fillStyle = active ? textColor : anchor.color;
    repoMapCtx.font = compact ? '9px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
    fillTruncatedText(repoMapCtx, anchor.mapTitle, anchor.x - anchor.r + 7, anchor.y - 3, anchor.r * 2 - 14);
    repoMapCtx.fillStyle = muted;
    repoMapCtx.font = compact ? '7.5px JetBrains Mono, monospace' : '8px JetBrains Mono, monospace';
    fillTruncatedText(repoMapCtx, anchor.domainTitle, anchor.x - anchor.r + 7, anchor.y + 11, anchor.r * 2 - 14);
  });

  contexts.forEach((context) => {
    const anchorRefs = context.entries.length
      ? context.entries.map((entry) => anchorById.get(entry.child.id)).filter(Boolean)
      : [unmappedAnchor];
    const group = groups.get(context.key) || [];
    const slot = Math.max(0, group.indexOf(context.index));
    const total = Math.max(1, group.length);
    const baseX = anchorRefs.length
      ? anchorRefs.reduce((sum, anchor) => sum + anchor.x, 0) / anchorRefs.length
      : width / 2;
    const baseY = anchorRefs.length
      ? anchorRefs.reduce((sum, anchor) => sum + anchor.y, 0) / anchorRefs.length
      : height / 2;
    const hash = Math.abs(hashString(context.repo.name));
    const slotAngle = total > 1 ? (Math.PI * 2 * slot) / total : (hash % 360) * Math.PI / 180;
    const drift = Math.sin(repoMapTick * 0.018 + hash * 0.01) * 2.2;
    const spread = anchorRefs.length > 1
      ? (compact ? 12 : 18)
      : (anchorRefs[0]?.r || (compact ? 34 : 44)) + (compact ? 8 : 12);
    const x = Math.max(18, Math.min(width - 18, baseX + Math.cos(slotAngle) * spread + drift));
    const y = Math.max(32, Math.min(height - 18, baseY + Math.sin(slotAngle) * spread * 0.72));
    const size = Math.min(compact ? 10 : 13, 6 + Math.min(6, context.repo.stargazers_count * 2.4) + Math.min(3, context.repo.name.length / 12));
    repoNodes.push({
      repo: context.repo,
      x,
      y,
      r: size,
      color: repoColor(context.repo.language),
      anchors: anchorRefs,
      entries: context.entries,
      hash
    });
  });

  repoNodes.forEach((node) => {
    const active = hoveredRepo === node.repo.name || highlightedRepo === node.repo.name;
    node.anchors.forEach((anchor) => {
      repoMapCtx.beginPath();
      repoMapCtx.moveTo(anchor.x, anchor.y);
      repoMapCtx.lineTo(node.x, node.y);
      repoMapCtx.strokeStyle = colorWithAlpha(anchor.color, active ? 0.52 : 0.16);
      repoMapCtx.lineWidth = active ? 1.8 : 1;
      repoMapCtx.stroke();

      const flow = (repoMapTick * 0.008 + (node.hash % 100) / 100) % 1;
      const dotX = anchor.x + (node.x - anchor.x) * flow;
      const dotY = anchor.y + (node.y - anchor.y) * flow;
      repoMapCtx.beginPath();
      repoMapCtx.arc(dotX, dotY, active ? 2.4 : 1.5, 0, Math.PI * 2);
      repoMapCtx.fillStyle = colorWithAlpha(anchor.color, active ? 0.9 : 0.42);
      repoMapCtx.fill();
    });
  });

  repoNodes.forEach((node) => {
    const active = hoveredRepo === node.repo.name || highlightedRepo === node.repo.name;
    const multi = node.anchors.length > 1;
    repoMapCtx.beginPath();
    repoMapCtx.arc(node.x, node.y, active ? node.r + 6 : node.r + 3, 0, Math.PI * 2);
    repoMapCtx.fillStyle = active ? colorWithAlpha(node.color, 0.24) : colorWithAlpha(primary, 0.07);
    repoMapCtx.fill();

    if (multi) {
      const segment = (Math.PI * 2) / node.anchors.length;
      node.anchors.forEach((anchor, index) => {
        repoMapCtx.beginPath();
        repoMapCtx.arc(node.x, node.y, active ? node.r + 2.5 : node.r + 1.5, index * segment - Math.PI / 2, (index + 0.72) * segment - Math.PI / 2);
        repoMapCtx.strokeStyle = colorWithAlpha(anchor.color, active ? 0.95 : 0.72);
        repoMapCtx.lineWidth = active ? 2.4 : 1.7;
        repoMapCtx.stroke();
      });
    }

    repoMapCtx.beginPath();
    repoMapCtx.arc(node.x, node.y, active ? node.r : node.r * 0.72, 0, Math.PI * 2);
    repoMapCtx.fillStyle = node.color;
    repoMapCtx.fill();
    repoMapCtx.strokeStyle = active ? textColor : colorWithAlpha(textColor, 0.42);
    repoMapCtx.lineWidth = active ? 1.6 : 0.8;
    repoMapCtx.stroke();

    if (active) {
      const labelX = Math.min(Math.max(node.x + 12, 12), width - (active ? 210 : 140));
      const labelY = Math.max(node.y - 9, 35);
      repoMapCtx.fillStyle = active ? textColor : colorWithAlpha(textColor, 0.84);
      repoMapCtx.font = active ? '11px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace';
      fillTruncatedText(repoMapCtx, node.repo.name, labelX, labelY, active ? 190 : 128);
      repoMapCtx.fillStyle = muted;
      repoMapCtx.font = '8px JetBrains Mono, monospace';
      fillTruncatedText(repoMapCtx, repoMappingLabel(node.repo), labelX, labelY + 12, 190);
    }
  });
}

function repoMapPointer(event) {
  const rect = repoMap.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
}

repoMap.addEventListener('mousemove', (event) => {
  const pointer = repoMapPointer(event);
  const hit = repoNodes.find((node) => Math.hypot(pointer.x - node.x, pointer.y - node.y) <= node.r + 8);
  const fieldHit = hit ? null : repoMapFieldNodes.find((node) => Math.hypot(pointer.x - node.x, pointer.y - node.y) <= node.r + 8);
  hoveredRepo = hit ? hit.repo.name : null;
  hoveredMapField = fieldHit ? fieldHit.id : null;
  repoMap.style.cursor = hit || (fieldHit && fieldHit.id !== 'unmapped') ? 'pointer' : 'default';
  repoMapHint.textContent = hit
    ? `${hit.repo.name} · ${repoMappingLabel(hit.repo)} · ${hit.repo.language || i18n[currentLang].mixed} · ${i18n[currentLang].star} ${hit.repo.stargazers_count}`
    : fieldHit
      ? `${fieldHit.mapTitle} · ${fieldHit.domainTitle}`
      : i18n[currentLang].repo_map_hint;
  renderRepoMap(filteredRepos);
});

repoMap.addEventListener('mouseleave', () => {
  hoveredRepo = null;
  hoveredMapField = null;
  repoMapHint.textContent = i18n[currentLang].repo_map_hint;
  renderRepoMap(filteredRepos);
});

repoMap.addEventListener('click', (event) => {
  const pointer = repoMapPointer(event);
  const hit = repoNodes.find((node) => Math.hypot(pointer.x - node.x, pointer.y - node.y) <= node.r + 8);
  const fieldHit = hit ? null : repoMapFieldNodes.find((node) => Math.hypot(pointer.x - node.x, pointer.y - node.y) <= node.r + 8);
  if (hit) openRepoDetail(hit.repo.name);
  else if (fieldHit && fieldHit.id !== 'unmapped') jumpToResearchInterest(fieldHit.id);
});

function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function activeInterestAnimationType() {
  return activeInterestEntry()?.child.animation;
}

function isPointCloudInterestActive() {
  return activeInterestAnimationType() === 'point-cloud';
}

function isVprInterestActive() {
  return activeInterestAnimationType() === 'vpr';
}

function isAgentInterestActive() {
  return activeInterestAnimationType() === 'agent';
}

function isEducationInterestActive() {
  return activeInterestAnimationType() === 'education';
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function routePoint(width, height, u) {
  const left = width * 0.1;
  const right = width * 0.9;
  const x = left + (right - left) * u;
  const y = height * (0.38 + Math.sin(u * Math.PI * 2.1 - 0.4) * 0.1 + Math.sin(u * Math.PI * 5.2) * 0.035);
  return { x, y };
}

function vprCandidateScores() {
  return vprPlaces
    .map((place, index) => {
      const spatial = Math.max(0, 1 - Math.abs(vprInteraction.route - place.u) / 0.32);
      const appearance = Math.max(0, 1 - Math.abs(vprInteraction.condition - place.condition) / 0.82);
      const ripple = 0.03 * Math.sin(interestTick * 0.08 + index * 1.7);
      return {
        ...place,
        score: clamp01(spatial * 0.78 + appearance * 0.22 + ripple)
      };
    })
    .sort((a, b) => b.score - a.score);
}

function bestVprCandidate() {
  return vprCandidateScores()[0];
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

const agentTasks = [
  {
    title: 'Map research repos',
    compactTitle: 'MAP',
    prompt: 'Assign projects to research interests',
    outcome: 'Mapping config ready',
    trace: {
      plan: 'Goal parsed -> organize projects by research area',
      retrieve: 'Sources retrieved -> repo metadata and README signals',
      act: 'Analysis run -> compare project topics with category rules',
      observe: 'Evidence checked -> ambiguous repositories flagged',
      evaluate: 'Quality check -> mapping confidence updated',
      revise: 'Revise -> repair uncertain mapping before saving'
    }
  },
  {
    title: 'Read project README',
    compactTitle: 'README',
    prompt: 'Summarize one project before opening it',
    outcome: 'Traceable project summary',
    trace: {
      plan: 'Goal parsed -> summarize scope, usage, and relevance',
      retrieve: 'Sources retrieved -> README sections loaded',
      act: 'Analysis run -> extract purpose and implementation notes',
      observe: 'Evidence checked -> summary compared with repo topic',
      evaluate: 'Quality check -> missing context noted',
      revise: 'Revise -> tighten summary with project evidence'
    }
  },
  {
    title: 'Verify page update',
    compactTitle: 'CHECK',
    prompt: 'Verify an experiment or page update',
    outcome: 'Verified result report',
    trace: {
      plan: 'Goal parsed -> choose validation path',
      retrieve: 'State collected -> latest page and config loaded',
      act: 'Browser check -> inspect rendered interaction',
      observe: 'Evidence checked -> mismatch or success detected',
      evaluate: 'Quality check -> confidence and risk reported',
      revise: 'Revise -> retry the failing branch'
    }
  }
];

const agentWorkbenchScenarios = [
  {
    verb: 'Classify',
    result: 'Point Cloud / Registration',
    stamp: 'MAPPED',
    evidence: [
      { id: 'readme', title: 'README.md', lines: ['registration pipeline', 'point cloud alignment'], x: 0.38, y: 0.38, r: -0.08 },
      { id: 'repo', title: 'Repo topic', lines: ['geometry', 'tracking thesis'], x: 0.56, y: 0.31, r: 0.06 },
      { id: 'label', title: 'Research label', lines: ['robust matching', '3D vision'], x: 0.74, y: 0.47, r: -0.04 }
    ]
  },
  {
    verb: 'Summarize',
    result: 'Traceable project brief',
    stamp: 'SUMMARY',
    evidence: [
      { id: 'purpose', title: 'Purpose', lines: ['what it builds', 'why it matters'], x: 0.38, y: 0.34, r: 0.05 },
      { id: 'usage', title: 'Usage', lines: ['commands', 'workflow'], x: 0.56, y: 0.44, r: -0.06 },
      { id: 'scope', title: 'Scope', lines: ['research fit', 'limits'], x: 0.75, y: 0.33, r: 0.04 }
    ]
  },
  {
    verb: 'Verify',
    result: 'Page update verified',
    stamp: 'CHECKED',
    evidence: [
      { id: 'site', title: 'Live page', lines: ['rendered view', 'theme state'], x: 0.38, y: 0.42, r: -0.05 },
      { id: 'config', title: 'Config', lines: ['mapping json', 'category tree'], x: 0.56, y: 0.32, r: 0.04 },
      { id: 'proof', title: 'Proof', lines: ['browser check', 'no console errors'], x: 0.75, y: 0.48, r: 0.08 }
    ]
  }
];

const agentTools = [
  { id: 'memory', label: 'Memory', compact: 'MEM', detail: 'Past context', stage: 'retrieve' },
  { id: 'rag', label: 'RAG', compact: 'RAG', detail: 'Grounded search', stage: 'retrieve' },
  { id: 'code', label: 'Code', compact: 'CODE', detail: 'Run analysis', stage: 'act' },
  { id: 'browser', label: 'Web', compact: 'WEB', detail: 'Web evidence', stage: 'observe' },
  { id: 'eval', label: 'Eval', compact: 'EVAL', detail: 'Quality check', stage: 'evaluate' }
];

const agentStages = [
  { id: 'plan', label: 'Plan', compact: 'Plan', detail: 'Split the research goal into steps' },
  { id: 'retrieve', label: 'Search', compact: 'Search', detail: 'Ground the answer in notes, repos, or papers' },
  { id: 'act', label: 'Act', compact: 'Act', detail: 'Call tools such as code or browser checks' },
  { id: 'observe', label: 'Check', compact: 'Check', detail: 'Read tool results and evidence' },
  { id: 'evaluate', label: 'Eval', compact: 'Eval', detail: 'Score quality and trigger revision when needed' }
];

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

function agentRunnerLayout(width, height) {
  const compact = width < 440 || height < 210;
  if (compact) {
    const taskW = Math.max(68, (width - 36) / 3);
    const toolW = Math.max(42, Math.min(52, (width - 36) / 5));
    const stageW = Math.max(48, Math.min(60, (width - 30) / 5));
    return {
      compact,
      hint: { x: 12, y: 10, text: 'Tap task, tool, or stage' },
      taskCards: agentTasks.map((task, index) => ({
        ...task,
        index,
        x: 12 + index * (taskW + 6),
        y: 22,
        w: taskW,
        h: 24
      })),
      toolCards: agentTools.map((tool, index) => ({
        ...tool,
        x: 12 + index * (toolW + 5),
        y: 54,
        w: toolW,
        h: 22
      })),
      stageCards: agentStages.map((stage, index) => ({
        ...stage,
        x: 12 + index * (stageW + 5),
        y: 86,
        w: stageW,
        h: 26
      })),
      trace: { x: 12, y: 121, w: width - 24, h: Math.max(28, height - 151) },
      outcome: { x: 12, y: height - 23, w: width - 24, h: 13 },
      meter: { x: 12, y: height - 8, w: width - 24, h: 4 }
    };
  }

  const taskW = Math.min(160, width * 0.27);
  const workX = taskW + 34;
  const workW = width - workX - 16;
  const toolW = Math.max(62, Math.min(78, (workW - 24) / 5));
  const stageW = Math.max(68, Math.min(92, (workW - 34) / 5));
  return {
    compact,
    hint: { x: 16, y: 16, text: 'Hover to inspect · Click to pin tools and tasks' },
    taskCards: agentTasks.map((task, index) => ({
      ...task,
      index,
      x: 16,
      y: 34 + index * 40,
      w: taskW,
      h: 34
    })),
    toolCards: agentTools.map((tool, index) => ({
      ...tool,
      x: workX + index * (toolW + 6),
      y: 36,
      w: toolW,
      h: 34
    })),
    stageCards: agentStages.map((stage, index) => ({
      ...stage,
      x: workX + index * (stageW + 7),
      y: 88 + (index % 2) * 16,
      w: stageW,
      h: 34
    })),
    trace: { x: workX, y: height - 83, w: workW, h: 54 },
    outcome: { x: workX, y: height - 24, w: workW, h: 18 },
    meter: { x: 16, y: height - 72, w: taskW, h: 54 }
  };
}

function agentTraceFor(task, verification) {
  const retrievalTool = agentInteraction.tools.rag ? 'rag' : agentInteraction.tools.memory ? 'memory' : null;
  const actionTool = agentInteraction.tools[agentInteraction.selectedTool] && !['memory', 'rag', 'eval'].includes(agentInteraction.selectedTool)
    ? agentInteraction.selectedTool
    : agentInteraction.tools.code
      ? 'code'
      : agentInteraction.tools.browser
        ? 'browser'
        : null;
  const observeTool = agentInteraction.tools.browser ? 'browser' : agentInteraction.tools.eval ? 'eval' : null;
  const trace = [
    { stage: 'plan', label: task.trace.plan },
    {
      stage: 'retrieve',
      toolId: retrievalTool,
      label: retrievalTool ? task.trace.retrieve : 'Prompt-only context -> retrieval disabled'
    },
    {
      stage: 'act',
      toolId: actionTool,
      label: actionTool ? task.trace.act : 'No external tool call -> reason from context only'
    },
    {
      stage: 'observe',
      toolId: observeTool,
      label: observeTool ? task.trace.observe : 'Manual observation -> no browser or eval tool'
    },
    {
      stage: 'evaluate',
      toolId: agentInteraction.tools.eval ? 'eval' : null,
      label: agentInteraction.tools.eval ? task.trace.evaluate : 'Light check -> eval disabled'
    }
  ];
  if (agentInteraction.tools.eval && verification > 0.58) {
    trace.push({ stage: 'evaluate', toolId: 'eval', label: task.trace.revise, retry: true });
  }
  return trace;
}

function agentOutcomeText(task, confidence) {
  const level = confidence > 0.78 ? 'High' : confidence > 0.62 ? 'Medium' : 'Low';
  return `Outcome: ${task.outcome} · Confidence ${level}`;
}

function agentInspectText(task, activeTrace, confidence) {
  if (agentInteraction.hoverType === 'tool') {
    const tool = agentTools.find((item) => item.id === agentInteraction.hoverId);
    if (tool) return `${tool.label}: ${tool.detail} · ${agentInteraction.tools[tool.id] ? 'enabled' : 'disabled'}`;
  }
  if (agentInteraction.hoverType === 'stage') {
    const stage = agentStages.find((item) => item.id === agentInteraction.hoverId);
    if (stage) return `${stage.label}: ${stage.detail}`;
  }
  if (agentInteraction.hoverType === 'task') {
    const hoveredTask = agentTasks[agentInteraction.hoverId];
    if (hoveredTask) return `Task: ${hoveredTask.prompt}`;
  }
  if (activeTrace) return activeTrace.label;
  return agentOutcomeText(task, confidence);
}

function agentHitRegion(event) {
  const rect = interestCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const layout = humanAiCollabLayout(rect.width, rect.height);
  const regions = [
    ...layout.taskCards.map((item) => ({ type: 'task', item })),
    { type: 'human', item: layout.human },
    { type: 'ai', item: { x: layout.ai.x - layout.ai.r, y: layout.ai.y - layout.ai.r, w: layout.ai.r * 2, h: layout.ai.r * 2, id: 'ai' } },
    { type: 'output', item: layout.output }
  ];
  return regions.find(({ item }) => (
    x >= item.x
    && x <= item.x + item.w
    && y >= item.y
    && y <= item.y + item.h
  ));
}

const educationPaths = [
  {
    id: 'learner',
    label: 'Learner',
    compact: 'Learner',
    title: 'Learner profile',
    detail: 'Diagnose mastery, confidence, engagement, and misconceptions.'
  },
  {
    id: 'content',
    label: 'Content',
    compact: 'Content',
    title: 'Targeted content',
    detail: 'Generate hints, examples, quizzes, and challenge tasks from weak concepts.'
  },
  {
    id: 'teacher',
    label: 'Teacher',
    compact: 'Teacher',
    title: 'Teacher insight',
    detail: 'Surface intervention opportunities and reduce feedback workload.'
  },
  {
    id: 'evidence',
    label: 'Evidence',
    compact: 'Evidence',
    title: 'Research evidence',
    detail: 'Track retention, transfer, fairness, and learning efficiency.'
  }
];

const educationConcepts = [
  { id: 'algebra', label: 'Algebra', compact: 'Alg', mastery: 0.74, x: 0.16, y: 0.36 },
  { id: 'functions', label: 'Functions', compact: 'Func', mastery: 0.42, x: 0.3, y: 0.22 },
  { id: 'geometry', label: 'Geometry', compact: 'Geo', mastery: 0.62, x: 0.3, y: 0.52 },
  { id: 'proof', label: 'Proof', compact: 'Proof', mastery: 0.36, x: 0.46, y: 0.38 },
  { id: 'word', label: 'Word Prob.', compact: 'Word', mastery: 0.58, x: 0.16, y: 0.62 }
];

const educationSignals = [
  { id: 'correct', label: 'Correct', compact: 'OK', detail: 'Mastery rises after independent success.' },
  { id: 'hint', label: 'Hint used', compact: 'Hint', detail: 'Feedback targets a misconception before retry.' },
  { id: 'incorrect', label: 'Incorrect', compact: 'Miss', detail: 'System lowers confidence and selects a scaffold.' }
];

const educationLoop = [
  { id: 'diagnose', label: 'Diagnose', compact: 'Dx' },
  { id: 'generate', label: 'Generate', compact: 'Gen' },
  { id: 'practice', label: 'Practice', compact: 'Try' },
  { id: 'feedback', label: 'Feedback', compact: 'Fb' },
  { id: 'update', label: 'Update', compact: 'Up' },
  { id: 'evaluate', label: 'Evaluate', compact: 'Eval' }
];

function educationPathForSelected() {
  return educationPaths.find((path) => path.id === educationInteraction.selectedPath) || educationPaths[0];
}

function educationConceptForSelected() {
  return educationConcepts.find((concept) => concept.id === educationInteraction.selectedConcept) || educationConcepts[1];
}

function educationSignalForSelected() {
  return educationSignals.find((signal) => signal.id === educationInteraction.selectedSignal) || educationSignals[1];
}

function educationRunnerLayout(width, height) {
  const compact = width < 440 || height < 220;
  if (compact) {
    const chipW = Math.max(60, (width - 42) / 4);
    const conceptW = Math.max(42, (width - 36) / educationConcepts.length);
    const signalW = Math.max(64, (width - 36) / 3);
    return {
      compact,
      hint: { x: 12, y: 10, text: 'Tap to change path, concept, or feedback' },
      pathCards: educationPaths.map((path, index) => ({
        ...path,
        x: 12 + index * (chipW + 6),
        y: 22,
        w: chipW,
        h: 24
      })),
      conceptCards: educationConcepts.map((concept, index) => ({
        ...concept,
        x: 12 + index * (conceptW + 3),
        y: 56,
        w: conceptW,
        h: 30
      })),
      learner: { x: 12, y: 96, w: width * 0.34, h: 48 },
      practice: { x: width * 0.42, y: 96, w: width * 0.26, h: 48 },
      insight: { x: width * 0.7, y: 96, w: width * 0.26 - 10, h: 48 },
      signalCards: educationSignals.map((signal, index) => ({
        ...signal,
        x: 12 + index * (signalW + 6),
        y: 151,
        w: signalW,
        h: 24
      })),
      loop: { x: 12, y: height - 18, w: width - 24, h: 10 }
    };
  }

  const leftW = Math.min(160, width * 0.28);
  const rightW = Math.min(172, width * 0.3);
  const centerX = leftW + (width - leftW - rightW) * 0.48;
  const centerY = height * 0.48;
  const graphX = leftW + 24;
  const graphW = Math.max(120, centerX - graphX + 38);
  return {
    compact,
    hint: { x: 16, y: 16, text: 'Hover to inspect · Click to change path, concept, or feedback signal' },
    pathCards: educationPaths.map((path, index) => ({
      ...path,
      x: 16,
      y: 36 + index * 31,
      w: leftW,
      h: 25
    })),
    conceptCards: educationConcepts.map((concept) => ({
      ...concept,
      x: graphX + concept.x * graphW,
      y: height * concept.y,
      w: 72,
      h: 28
    })),
    learner: { x: centerX - 46, y: centerY - 43, w: 92, h: 86 },
    practice: { x: width - rightW - 16, y: 38, w: rightW, h: 78 },
    insight: { x: width - rightW - 16, y: 128, w: rightW, h: 58 },
    signalCards: educationSignals.map((signal, index) => ({
      ...signal,
      x: centerX - 112 + index * 76,
      y: height - 65,
      w: 70,
      h: 24
    })),
    loop: { x: centerX - 138, y: height - 28, w: 276, h: 16 }
  };
}

function educationHitRegion(event) {
  const rect = interestCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const layout = robotTeacherLayout(rect.width, rect.height);
  const regions = [
    ...layout.feedbackButtons.map((item) => ({ type: 'signal', item })),
    { type: 'robot', item: { x: layout.robot.x - layout.robot.w / 2, y: layout.robot.y - layout.robot.h / 2, w: layout.robot.w, h: layout.robot.h, id: 'robot' } },
    { type: 'student', item: { x: layout.student.x - layout.student.w / 2, y: layout.student.y - layout.student.h / 2, w: layout.student.w, h: layout.student.h, id: 'student' } },
    { type: 'board', item: layout.board }
  ];
  return regions.find(({ item }) => (
    x >= item.x
    && x <= item.x + item.w
    && y >= item.y
    && y <= item.y + item.h
  ));
}

function educationInspectText(path, concept, signal) {
  if (educationInteraction.hoverType === 'path') {
    const hovered = educationPaths.find((item) => item.id === educationInteraction.hoverId);
    if (hovered) return `${hovered.title}: ${hovered.detail}`;
  }
  if (educationInteraction.hoverType === 'concept') {
    const hovered = educationConcepts.find((item) => item.id === educationInteraction.hoverId);
    if (hovered) return `${hovered.label}: mastery ${Math.round(hovered.mastery * 100)}%, targeted next.`;
  }
  if (educationInteraction.hoverType === 'signal') {
    const hovered = educationSignals.find((item) => item.id === educationInteraction.hoverId);
    if (hovered) return `${hovered.label}: ${hovered.detail}`;
  }
  if (educationInteraction.hoverType === 'practice') return `Practice: adaptive ${concept.label} task with hint and explanation.`;
  if (educationInteraction.hoverType === 'insight') return 'Teacher insight: intervention, fairness, and learning efficiency signals.';
  return `${path.title}: ${concept.label} -> ${signal.label} -> mastery update.`;
}

function educationMastery(concept) {
  const responseShift = educationInteraction.selectedSignal === 'correct'
    ? 0.12
    : educationInteraction.selectedSignal === 'hint'
      ? 0.06
      : -0.04;
  return clamp01(concept.mastery + responseShift + educationInteraction.masteryBoost * 0.04);
}

const humanAiCollabScenarios = [
  {
    task: 'Research task',
    shortTask: 'Task',
    human: 'Human asks',
    ai: 'AI works',
    output: 'Result ready',
    detail: 'Mapped research work'
  },
  {
    task: 'Read project',
    shortTask: 'Read',
    human: 'Project question',
    ai: 'AI summarizes',
    output: 'Brief ready',
    detail: 'Traceable summary'
  },
  {
    task: 'Verify update',
    shortTask: 'Check',
    human: 'Need proof',
    ai: 'AI checks page',
    output: 'Verified',
    detail: 'Evidence delivered'
  }
];

function humanAiScenario() {
  return humanAiCollabScenarios[agentInteraction.taskIndex % humanAiCollabScenarios.length] || humanAiCollabScenarios[0];
}

function humanAiCollabLayout(width, height) {
  const compact = width < 460 || height < 220;
  const centerY = height * (compact ? 0.5 : 0.54);
  const buttonW = compact ? Math.max(74, (width - 46) / 3) : 118;
  return {
    compact,
    taskCards: humanAiCollabScenarios.map((task, index) => ({
      ...task,
      index,
      x: compact ? 14 + index * (buttonW + 7) : 18,
      y: compact ? 14 : 24 + index * 38,
      w: buttonW,
      h: compact ? 28 : 30
    })),
    human: {
      id: 'human',
      x: compact ? width * 0.18 : width * 0.22,
      y: centerY,
      w: compact ? 82 : 104,
      h: compact ? 112 : 132
    },
    ai: {
      id: 'ai',
      x: compact ? width * 0.5 : width * 0.51,
      y: centerY - (compact ? 6 : 2),
      r: compact ? 38 : 48
    },
    output: {
      id: 'output',
      x: compact ? width * 0.7 : width * 0.73,
      y: centerY - (compact ? 48 : 54),
      w: compact ? 104 : 138,
      h: compact ? 94 : 112
    }
  };
}

function drawHumanFigure(ctx, figure, primary, secondary, muted, active) {
  const headR = figure.w * 0.16;
  const x = figure.x;
  const y = figure.y;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = active ? primary : 'rgba(255,255,255,0.48)';
  ctx.lineWidth = active ? 3 : 2.2;
  ctx.beginPath();
  ctx.arc(x, y - figure.h * 0.28, headR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - figure.h * 0.12);
  ctx.lineTo(x, y + figure.h * 0.24);
  ctx.moveTo(x - figure.w * 0.22, y + figure.h * 0.02);
  ctx.quadraticCurveTo(x + figure.w * 0.08, y - figure.h * 0.02, x + figure.w * 0.33, y - figure.h * 0.1);
  ctx.moveTo(x, y + figure.h * 0.22);
  ctx.lineTo(x - figure.w * 0.22, y + figure.h * 0.46);
  ctx.moveTo(x, y + figure.h * 0.22);
  ctx.lineTo(x + figure.w * 0.24, y + figure.h * 0.46);
  ctx.stroke();
  drawRoundedRect(ctx, x - figure.w * 0.45, y + figure.h * 0.49, figure.w * 0.9, 24, 8);
  ctx.fillStyle = active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)';
  ctx.fill();
  ctx.strokeStyle = active ? primary : 'rgba(255,255,255,0.14)';
  ctx.stroke();
  ctx.fillStyle = active ? primary : muted;
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Human', x, y + figure.h * 0.49 + 16);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawAiAssistant(ctx, ai, primary, secondary, textColor, activePulse) {
  ctx.save();
  const rings = [1, 1.38, 1.75];
  rings.forEach((scale, index) => {
    ctx.beginPath();
    ctx.arc(ai.x, ai.y, ai.r * scale + activePulse * (6 + index * 4), 0, Math.PI * 2);
    ctx.strokeStyle = index === 0 ? primary : `rgba(255,255,255,${0.13 - index * 0.03})`;
    ctx.lineWidth = index === 0 ? 2.4 : 1;
    ctx.stroke();
  });
  const glow = ctx.createRadialGradient(ai.x, ai.y, 0, ai.x, ai.y, ai.r * 1.2);
  glow.addColorStop(0, 'rgba(255,255,255,0.18)');
  glow.addColorStop(0.56, 'rgba(0,245,255,0.12)');
  glow.addColorStop(1, 'rgba(0,245,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(ai.x, ai.y, ai.r * 1.25, 0, Math.PI * 2);
  ctx.fill();
  drawRoundedRect(ctx, ai.x - ai.r * 0.58, ai.y - ai.r * 0.46, ai.r * 1.16, ai.r * 0.92, 12);
  ctx.fillStyle = 'rgba(3,7,18,0.58)';
  ctx.fill();
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ai.x - ai.r * 0.22, ai.y - ai.r * 0.08, ai.r * 0.08, 0, Math.PI * 2);
  ctx.arc(ai.x + ai.r * 0.22, ai.y - ai.r * 0.08, ai.r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = primary;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(ai.x - ai.r * 0.18, ai.y + ai.r * 0.16);
  ctx.quadraticCurveTo(ai.x, ai.y + ai.r * 0.26, ai.x + ai.r * 0.18, ai.y + ai.r * 0.16);
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ai.x, ai.y - ai.r * 0.46);
  ctx.lineTo(ai.x, ai.y - ai.r * 0.72);
  ctx.strokeStyle = secondary;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ai.x, ai.y - ai.r * 0.8, ai.r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = secondary;
  ctx.fill();
  ctx.fillStyle = primary;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AI', ai.x, ai.y + ai.r * 0.82);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawOutputArtifact(ctx, output, scenario, primary, secondary, muted, textColor, active) {
  ctx.save();
  drawRoundedRect(ctx, output.x, output.y, output.w, output.h, 12);
  ctx.fillStyle = active ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.075)';
  ctx.fill();
  ctx.strokeStyle = active ? secondary : 'rgba(255,255,255,0.18)';
  ctx.lineWidth = active ? 2.4 : 1.2;
  ctx.stroke();
  ctx.fillStyle = secondary;
  ctx.font = '10px JetBrains Mono, monospace';
  fillTruncatedText(ctx, scenario.output, output.x + 12, output.y + 20, output.w - 24);
  ctx.strokeStyle = primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(output.x + 15, output.y + 38);
  ctx.lineTo(output.x + 26, output.y + 49);
  ctx.lineTo(output.x + 48, output.y + 29);
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.font = '9px JetBrains Mono, monospace';
  fillTruncatedText(ctx, scenario.detail, output.x + 12, output.y + 67, output.w - 24);
  ctx.fillStyle = muted;
  fillTruncatedText(ctx, 'Delivered by AI', output.x + 12, output.y + 84, output.w - 24);
  ctx.restore();
}

function drawHumanAiCollab(width, height, t, primary, secondary, muted) {
  const layout = humanAiCollabLayout(width, height);
  const scenario = humanAiScenario();
  const textColor = themeColor('--text') || '#f5f5f5';
  const progress = (t * 0.28 + agentInteraction.runBoost * 0.52) % 1;
  const activePulse = agentInteraction.pulse;
  const phase = progress < 0.38 ? 'toAi' : progress < 0.72 ? 'thinking' : 'toDone';
  const tokenProgress = phase === 'toAi'
    ? progress / 0.38
    : phase === 'thinking'
      ? 1
      : (progress - 0.72) / 0.28;

  agentInteraction.pulse *= 0.86;
  agentInteraction.runBoost *= 0.9;

  const humanActive = phase === 'toAi' || agentInteraction.hoverType === 'human';
  const outputActive = phase === 'toDone' || agentInteraction.hoverType === 'output';
  const aiActive = phase === 'thinking' || agentInteraction.hoverType === 'ai';

  layout.taskCards.forEach((card) => {
    const selected = card.index === agentInteraction.taskIndex;
    const hovered = agentInteraction.hoverType === 'task' && agentInteraction.hoverId === card.index;
    drawRoundedRect(interestCtx, card.x, card.y, card.w, card.h, 10);
    interestCtx.fillStyle = selected || hovered ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.06)';
    interestCtx.fill();
    interestCtx.strokeStyle = selected ? secondary : hovered ? primary : 'rgba(255,255,255,0.15)';
    interestCtx.lineWidth = selected || hovered ? 2 : 1;
    interestCtx.stroke();
    interestCtx.fillStyle = selected ? secondary : textColor;
    interestCtx.font = layout.compact ? '9px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
    interestCtx.textAlign = 'center';
    interestCtx.fillText(layout.compact ? card.shortTask : card.task, card.x + card.w / 2, card.y + card.h / 2 + 4);
    interestCtx.textAlign = 'left';
  });

  drawHumanFigure(interestCtx, layout.human, primary, secondary, muted, humanActive);
  drawAiAssistant(interestCtx, layout.ai, primary, secondary, textColor, aiActive ? activePulse + 0.35 : activePulse * 0.5);
  drawOutputArtifact(interestCtx, layout.output, scenario, primary, secondary, muted, textColor, outputActive);

  const from = { x: layout.human.x + layout.human.w * 0.33, y: layout.human.y - layout.human.h * 0.1 };
  const mid = { x: layout.ai.x, y: layout.ai.y };
  const to = { x: layout.output.x + layout.output.w * 0.15, y: layout.output.y + layout.output.h * 0.5 };
  const flowStart = phase === 'toDone' ? mid : from;
  const flowEnd = phase === 'toDone' ? to : mid;
  const tokenX = flowStart.x + (flowEnd.x - flowStart.x) * tokenProgress;
  const tokenY = flowStart.y + (flowEnd.y - flowStart.y) * tokenProgress + Math.sin(tokenProgress * Math.PI) * -20;

  [[from, mid], [mid, to]].forEach(([a, b], index) => {
    interestCtx.beginPath();
    interestCtx.moveTo(a.x, a.y);
    interestCtx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 26, b.x, b.y);
    interestCtx.strokeStyle = index === 0 && phase === 'toAi' || index === 1 && phase === 'toDone'
      ? `rgba(255,255,255,0.36)`
      : 'rgba(255,255,255,0.12)';
    interestCtx.lineWidth = index === 0 && phase === 'toAi' || index === 1 && phase === 'toDone' ? 2.2 : 1;
    interestCtx.stroke();
  });

  drawRoundedRect(interestCtx, tokenX - 34, tokenY - 15, 68, 30, 9);
  interestCtx.fillStyle = 'rgba(3,7,18,0.72)';
  interestCtx.fill();
  interestCtx.strokeStyle = phase === 'thinking' ? primary : secondary;
  interestCtx.lineWidth = 2;
  interestCtx.stroke();
  interestCtx.fillStyle = textColor;
  interestCtx.font = '9px JetBrains Mono, monospace';
  interestCtx.textAlign = 'center';
  interestCtx.fillText(phase === 'thinking' ? 'working' : scenario.shortTask, tokenX, tokenY + 3);
  interestCtx.textAlign = 'left';

  if (phase === 'thinking') {
    for (let i = 0; i < 8; i += 1) {
      const a = t * 0.9 + i * Math.PI / 4;
      interestCtx.beginPath();
      interestCtx.arc(layout.ai.x + Math.cos(a) * (layout.ai.r + 22), layout.ai.y + Math.sin(a) * (layout.ai.r + 18), 2.2, 0, Math.PI * 2);
      interestCtx.fillStyle = i % 2 ? secondary : primary;
      interestCtx.fill();
    }
  }

  interestCtx.fillStyle = muted;
  interestCtx.font = layout.compact ? '8.5px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
  fillTruncatedText(interestCtx, layout.compact ? 'Tap a task. AI helps. Result returns.' : `${scenario.human} -> ${scenario.ai} -> ${scenario.output}`, 16, height - 15, width - 32);
}

function robotTeacherLayout(width, height) {
  const compact = width < 460 || height < 220;
  const feedbackY = height - (compact ? 40 : 44);
  const feedbackGroupW = Math.min(compact ? width - 42 : 330, width - (compact ? 36 : 120));
  const feedbackGap = compact ? 6 : 8;
  const feedbackX = (width - feedbackGroupW) / 2;
  const feedbackSegmentW = (feedbackGroupW - feedbackGap * 2) / 3;
  const boardY = compact ? 28 : 30;
  const boardHeight = Math.max(
    compact ? 92 : 118,
    Math.min(compact ? height * 0.42 : height * 0.5, feedbackY - boardY - (compact ? 70 : 62))
  );
  return {
    compact,
    feedbackGroup: {
      x: feedbackX,
      y: feedbackY,
      w: feedbackGroupW,
      h: compact ? 30 : 32,
      gap: feedbackGap
    },
    robot: {
      id: 'robot',
      x: compact ? width * 0.3 : width * 0.28,
      y: Math.min(compact ? height * 0.5 : height * 0.5, feedbackY - (compact ? 74 : 80)),
      w: compact ? 96 : 122,
      h: compact ? 126 : 148
    },
    student: {
      id: 'student',
      x: compact ? width * 0.13 : width * 0.15,
      y: compact ? feedbackY - 66 : feedbackY - 70,
      w: compact ? 78 : 92,
      h: compact ? 86 : 94
    },
    board: {
      id: 'board',
      x: compact ? width * 0.44 : width * 0.44,
      y: boardY,
      w: compact ? width * 0.52 : width * 0.5,
      h: boardHeight
    },
    feedbackButtons: educationSignals.map((signal, index) => ({
      ...signal,
      x: feedbackX + index * (feedbackSegmentW + feedbackGap),
      y: feedbackY,
      w: feedbackSegmentW,
      h: compact ? 30 : 32
    }))
  };
}

function drawEducationStageBackdrop(ctx, width, height, layout, primary, secondary) {
  ctx.save();
  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, 'rgba(5, 12, 28, 0.98)');
  backdrop.addColorStop(0.56, 'rgba(4, 10, 22, 0.94)');
  backdrop.addColorStop(1, 'rgba(6, 9, 18, 0.98)');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = primary;
  ctx.lineWidth = 1;
  const grid = layout.compact ? 48 : 44;
  for (let x = -grid; x <= width + grid; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 14, height);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.04;
  for (let y = grid * 0.75; y <= height; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y - 10);
    ctx.stroke();
  }

  const floorY = height - (layout.compact ? 78 : 82);
  ctx.globalAlpha = 1;
  const floor = ctx.createLinearGradient(0, floorY, 0, height);
  floor.addColorStop(0, 'rgba(255, 255, 255, 0.035)');
  floor.addColorStop(1, 'rgba(255, 255, 255, 0.09)');
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.bezierCurveTo(width * 0.28, floorY + 22, width * 0.72, floorY - 16, width, floorY + 10);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = floor;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = floorY + 16 + i * 18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(width * 0.5, y - 10, width, y + 3);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = secondary;
  ctx.lineWidth = layout.compact ? 1.2 : 1.5;
  ctx.beginPath();
  ctx.moveTo(layout.robot.x - layout.robot.w * 0.42, floorY + 6);
  ctx.quadraticCurveTo(layout.robot.x, floorY - 8, layout.robot.x + layout.robot.w * 0.52, floorY + 4);
  ctx.stroke();
  ctx.restore();
}

function drawRobotTeacher(ctx, robot, primary, secondary, textColor, active) {
  ctx.save();
  const x = robot.x;
  const y = robot.y;
  const w = robot.w;
  const h = robot.h;
  const teacherSway = Math.sin(interestTick * 0.045) * 2.4;
  const teacherLift = Math.sin(interestTick * 0.062) * 1.8;
  const lean = active ? -0.08 : -0.045;
  const headX = x + teacherSway;
  const headY = y - h * 0.35 + teacherLift;
  const bodyX = x - w * 0.04 + teacherSway * 0.25;
  const bodyY = y - h * 0.04 + teacherLift * 0.35;
  const raisedHand = {
    x: x + w * 0.58 + teacherSway * 0.2,
    y: y - h * 0.3 + teacherLift
  };
  const openHand = {
    x: x - w * 0.42 + teacherSway * 0.15,
    y: y + h * 0.08 + teacherLift * 0.4
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.ellipse(x + teacherSway * 0.2, y + h * 0.5, w * 0.34, h * 0.045, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(bodyX - w * 0.14, bodyY + h * 0.31);
  ctx.quadraticCurveTo(bodyX - w * 0.22, bodyY + h * 0.43, bodyX - w * 0.34, bodyY + h * 0.48);
  ctx.moveTo(bodyX + w * 0.13, bodyY + h * 0.31);
  ctx.quadraticCurveTo(bodyX + w * 0.28, bodyY + h * 0.42, bodyX + w * 0.39, bodyY + h * 0.47);
  ctx.strokeStyle = 'rgba(255,255,255,0.48)';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  drawRoundedRect(ctx, bodyX - w * 0.25, bodyY - h * 0.03, w * 0.52, h * 0.36, 13);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  drawRoundedRect(ctx, bodyX - w * 0.1, bodyY + h * 0.07, w * 0.2, h * 0.09, 6);
  ctx.fillStyle = active ? secondary : primary;
  ctx.fill();
  ctx.fillStyle = '#031019';
  ctx.font = '8px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AI', bodyX, bodyY + h * 0.135);

  ctx.beginPath();
  ctx.moveTo(bodyX + w * 0.2, bodyY + h * 0.07);
  ctx.quadraticCurveTo(x + w * 0.38, y - h * 0.2, raisedHand.x, raisedHand.y);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = active ? 4 : 3.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(raisedHand.x, raisedHand.y, w * 0.045, 0, Math.PI * 2);
  ctx.fillStyle = secondary;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(bodyX - w * 0.2, bodyY + h * 0.08);
  ctx.quadraticCurveTo(x - w * 0.34, y + h * 0.02, openHand.x, openHand.y);
  ctx.strokeStyle = primary;
  ctx.lineWidth = active ? 3.8 : 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(openHand.x, openHand.y, w * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = primary;
  ctx.fill();

  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(lean);
  drawRoundedRect(ctx, -w * 0.32, -h * 0.17, w * 0.64, h * 0.36, 14);
  ctx.fillStyle = 'rgba(3,7,18,0.66)';
  ctx.fill();
  ctx.strokeStyle = active ? secondary : primary;
  ctx.lineWidth = active ? 2.8 : 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-w * 0.04, -h * 0.18);
  ctx.lineTo(w * 0.02, -h * 0.28);
  ctx.strokeStyle = 'rgba(255,255,255,0.42)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w * 0.025, -h * 0.295, w * 0.026, 0, Math.PI * 2);
  ctx.fillStyle = secondary;
  ctx.fill();

  const blink = Math.sin(interestTick * 0.085) > 0.92;
  ctx.strokeStyle = primary;
  ctx.fillStyle = primary;
  ctx.lineWidth = 1.8;
  if (blink) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.16, -h * 0.035);
    ctx.lineTo(-w * 0.08, -h * 0.035);
    ctx.moveTo(w * 0.08, -h * 0.045);
    ctx.lineTo(w * 0.16, -h * 0.045);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-w * 0.13, -h * 0.04, w * 0.045, 0, Math.PI * 2);
    ctx.arc(w * 0.13, -h * 0.055, w * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-w * 0.11, h * 0.055);
  ctx.quadraticCurveTo(w * 0.02, h * 0.12, w * 0.16, h * 0.035);
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  if (w > 100) {
    for (let i = 0; i < 3; i += 1) {
      const px = raisedHand.x + 10 + i * 8;
      const py = raisedHand.y - 8 + Math.sin(interestTick * 0.06 + i) * 4;
      ctx.beginPath();
      ctx.arc(px, py, 1.7, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? primary : secondary;
      ctx.fill();
    }
  }

  ctx.textAlign = 'left';
  ctx.restore();
}

function drawStudentDesk(ctx, student, primary, secondary, muted, textColor, active) {
  const x = student.x;
  const y = student.y;
  const w = student.w;
  const h = student.h;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.ellipse(x, y + h * 0.5, w * 0.46, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fill();

  drawRoundedRect(ctx, x - w * 0.5, y + h * 0.1, w, h * 0.3, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.strokeStyle = active ? primary : 'rgba(255,255,255,0.16)';
  ctx.lineWidth = active ? 1.8 : 1.2;
  ctx.stroke();

  drawRoundedRect(ctx, x - w * 0.18, y - h * 0.18, w * 0.36, h * 0.38, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.075)';
  ctx.fill();
  ctx.strokeStyle = active ? primary : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = active ? 2 : 1.4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y - h * 0.32, w * 0.17, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.strokeStyle = active ? primary : 'rgba(255,255,255,0.46)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - w * 0.08, y - h * 0.31);
  ctx.lineTo(x - w * 0.02, y - h * 0.31);
  ctx.moveTo(x + w * 0.06, y - h * 0.31);
  ctx.lineTo(x + w * 0.12, y - h * 0.31);
  ctx.strokeStyle = primary;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  drawRoundedRect(ctx, x - w * 0.42, y + h * 0.02, w * 0.36, h * 0.2, 6);
  ctx.fillStyle = 'rgba(3,7,18,0.78)';
  ctx.fill();
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = secondary;
  ctx.font = `${Math.max(8, Math.round(w * 0.1))}px JetBrains Mono, monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('?', x - w * 0.24, y + h * 0.15);

  ctx.beginPath();
  ctx.moveTo(x + w * 0.16, y + h * 0.2);
  ctx.lineTo(x + w * 0.34, y + h * 0.2);
  ctx.strokeStyle = muted;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = active ? primary : muted;
  ctx.font = '8.5px JetBrains Mono, monospace';
  if (!student.compact && w > 86) {
    ctx.fillText('Learner', x, y + h * 0.58);
  }
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawStudentFigure(ctx, student, primary, muted, active) {
  const x = student.x;
  const y = student.y;
  ctx.save();
  ctx.strokeStyle = active ? primary : 'rgba(255,255,255,0.42)';
  ctx.lineWidth = active ? 2.8 : 2;
  ctx.beginPath();
  ctx.arc(x, y - student.h * 0.22, student.w * 0.16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - student.h * 0.05);
  ctx.lineTo(x, y + student.h * 0.25);
  ctx.moveTo(x - student.w * 0.18, y + student.h * 0.08);
  ctx.lineTo(x + student.w * 0.2, y + student.h * 0.08);
  ctx.stroke();
  ctx.fillStyle = active ? primary : muted;
  ctx.font = '9px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  if (student.h >= 80) {
    ctx.fillText('Student', x, y + student.h * 0.45);
  }
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawClassroomBoard(ctx, board, concept, signal, mastery, primary, secondary, muted, textColor) {
  const narrow = board.w < 230;
  const title = signal.id === 'correct'
    ? 'Next: challenge'
    : signal.id === 'hint'
      ? 'Hint: one step'
      : 'Retry: simpler';
  const line1 = signal.id === 'correct'
    ? `${concept.label}: harder practice`
    : signal.id === 'hint'
      ? `${concept.label}: show key step`
      : `${concept.label}: rebuild basics`;
  const line2 = signal.id === 'correct'
    ? 'Great. Move forward.'
    : signal.id === 'hint'
      ? 'Explain, then retry.'
      : 'Slow down and scaffold.';
  const displayTitle = narrow
    ? (signal.id === 'correct' ? 'Challenge' : signal.id === 'hint' ? 'Hint step' : 'Retry')
    : title;
  const displayLine1 = narrow
    ? (signal.id === 'correct'
      ? `${concept.label}: harder`
      : signal.id === 'hint'
        ? `${concept.label}: key step`
        : `${concept.label}: basics`)
    : line1;
  const displayLine2 = narrow
    ? (signal.id === 'correct' ? 'Move forward.' : signal.id === 'hint' ? 'Explain, retry.' : 'Scaffold first.')
    : line2;
  drawRoundedRect(ctx, board.x, board.y, board.w, board.h, 16);
  const boardFill = ctx.createLinearGradient(board.x, board.y, board.x + board.w, board.y + board.h);
  boardFill.addColorStop(0, 'rgba(6, 16, 32, 0.84)');
  boardFill.addColorStop(1, 'rgba(3, 7, 18, 0.72)');
  ctx.fillStyle = boardFill;
  ctx.fill();
  ctx.shadowColor = primary;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = 'rgba(0,245,255,0.28)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.moveTo(board.x + 1.5, board.y + 16);
  ctx.lineTo(board.x + 1.5, board.y + board.h - 16);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 3;
  ctx.stroke();

  const pad = narrow ? 14 : 18;
  ctx.fillStyle = primary;
  ctx.font = narrow ? '12.5px JetBrains Mono, monospace' : '14px JetBrains Mono, monospace';
  fillTruncatedText(ctx, displayTitle, board.x + pad, board.y + 28, board.w - pad * 2);
  ctx.fillStyle = textColor;
  ctx.font = narrow ? '9.5px JetBrains Mono, monospace' : '10.5px JetBrains Mono, monospace';
  fillTruncatedText(ctx, displayLine1, board.x + pad, board.y + 56, board.w - pad * 2);
  ctx.fillStyle = muted;
  fillTruncatedText(ctx, displayLine2, board.x + pad, board.y + 78, board.w - pad * 2);

  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const y = board.y + 96 + i * 14;
    if (y > board.y + board.h - 42) break;
    ctx.beginPath();
    ctx.moveTo(board.x + pad, y);
    ctx.lineTo(board.x + board.w - pad, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.moveTo(board.x + pad, board.y + board.h - 30);
  ctx.lineTo(board.x + board.w - pad, board.y + board.h - 30);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(board.x + pad, board.y + board.h - 30);
  ctx.lineTo(board.x + pad + (board.w - pad * 2) * mastery, board.y + board.h - 30);
  ctx.strokeStyle = mastery > 0.68 ? primary : mastery > 0.48 ? secondary : 'rgba(255,255,255,0.55)';
  ctx.stroke();
  ctx.fillStyle = secondary;
  ctx.font = '9px JetBrains Mono, monospace';
  fillTruncatedText(ctx, `Mastery ${Math.round(mastery * 100)}%`, board.x + pad, board.y + board.h - 12, board.w - pad * 2);
}

function drawEducationFeedbackSegment(ctx, button, selected, hovered, layout, primary, secondary, textColor) {
  ctx.save();
  const radius = layout.compact ? 13 : 15;
  drawRoundedRect(ctx, button.x, button.y, button.w, button.h, radius);
  ctx.fillStyle = selected
    ? 'rgba(255, 44, 163, 0.18)'
    : hovered
      ? 'rgba(0, 245, 255, 0.12)'
      : 'rgba(255,255,255,0.055)';
  ctx.fill();
  ctx.strokeStyle = selected ? secondary : hovered ? primary : 'rgba(255,255,255,0.14)';
  ctx.lineWidth = selected || hovered ? 2 : 1;
  ctx.stroke();
  if (selected) {
    ctx.shadowColor = secondary;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const dotR = layout.compact ? 2.2 : 2.6;
  ctx.beginPath();
  ctx.arc(button.x + 12, button.y + button.h / 2, dotR, 0, Math.PI * 2);
  ctx.fillStyle = selected ? secondary : primary;
  ctx.fill();

  ctx.fillStyle = selected ? secondary : textColor;
  ctx.font = layout.compact ? '8.5px JetBrains Mono, monospace' : '9.5px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(layout.compact ? button.compact : button.label, button.x + button.w / 2 + 6, button.y + button.h / 2 + 4);
  ctx.restore();
}

function drawRobotTeacherClassroom(width, height, t, primary, secondary, muted) {
  const layout = robotTeacherLayout(width, height);
  const concept = educationConceptForSelected();
  const signal = educationSignalForSelected();
  const mastery = educationMastery(concept);
  const textColor = themeColor('--text') || '#f5f5f5';

  educationInteraction.pulse *= 0.86;
  educationInteraction.masteryBoost *= 0.9;

  drawEducationStageBackdrop(interestCtx, width, height, layout, primary, secondary);

  const teacherSway = Math.sin(interestTick * 0.045) * 2.4;
  const teacherLift = Math.sin(interestTick * 0.062) * 1.8;
  const raisedHand = {
    x: layout.robot.x + layout.robot.w * 0.58 + teacherSway * 0.2,
    y: layout.robot.y - layout.robot.h * 0.3 + teacherLift
  };
  const pointerStart = raisedHand;
  const pointerEnd = { x: layout.board.x + 4, y: layout.board.y + layout.board.h * 0.52 };
  if (!layout.compact) {
    interestCtx.beginPath();
    interestCtx.moveTo(pointerStart.x, pointerStart.y);
    interestCtx.quadraticCurveTo((pointerStart.x + pointerEnd.x) / 2, pointerStart.y - 20, pointerEnd.x, pointerEnd.y);
    interestCtx.strokeStyle = secondary;
    interestCtx.lineWidth = 2.5;
    interestCtx.lineCap = 'round';
    interestCtx.setLineDash([2, 8]);
    interestCtx.stroke();
    interestCtx.setLineDash([]);
  }

  drawClassroomBoard(interestCtx, layout.board, concept, signal, mastery, primary, secondary, muted, textColor);
  drawStudentDesk(interestCtx, layout.student, primary, secondary, muted, textColor, educationInteraction.hoverType === 'student');
  drawRobotTeacher(interestCtx, layout.robot, primary, secondary, textColor, educationInteraction.pulse > 0.12 || educationInteraction.hoverType === 'robot');

  if (signal.id === 'correct') {
    interestCtx.beginPath();
    interestCtx.moveTo(layout.student.x + 22, layout.student.y - 30);
    interestCtx.lineTo(layout.student.x + 30, layout.student.y - 20);
    interestCtx.lineTo(layout.student.x + 48, layout.student.y - 42);
    interestCtx.strokeStyle = primary;
    interestCtx.lineWidth = 3;
    interestCtx.stroke();
  } else if (signal.id === 'incorrect') {
    drawRoundedRect(interestCtx, layout.student.x + 24, layout.student.y - 48, 58, 24, 8);
    interestCtx.fillStyle = 'rgba(255,255,255,0.08)';
    interestCtx.fill();
    interestCtx.strokeStyle = secondary;
    interestCtx.stroke();
    interestCtx.fillStyle = secondary;
    interestCtx.font = '9px JetBrains Mono, monospace';
    interestCtx.fillText('try 1 step', layout.student.x + 30, layout.student.y - 33);
  }

  drawRoundedRect(interestCtx, layout.feedbackGroup.x - 5, layout.feedbackGroup.y - 5, layout.feedbackGroup.w + 10, layout.feedbackGroup.h + 10, 18);
  interestCtx.fillStyle = 'rgba(3,7,18,0.38)';
  interestCtx.fill();
  interestCtx.strokeStyle = 'rgba(255,255,255,0.08)';
  interestCtx.lineWidth = 1;
  interestCtx.stroke();

  layout.feedbackButtons.forEach((button) => {
    const selected = button.id === educationInteraction.selectedSignal;
    const hovered = educationInteraction.hoverType === 'signal' && educationInteraction.hoverId === button.id;
    drawEducationFeedbackSegment(interestCtx, button, selected, hovered, layout, primary, secondary, textColor);
  });

  if (educationInteraction.active && (educationInteraction.dragging || educationInteraction.pulse > 0.18)) {
    const pointerX = educationInteraction.x * width;
    const pointerY = educationInteraction.y * height;
    interestCtx.beginPath();
    interestCtx.arc(pointerX, pointerY, 7 + educationInteraction.pulse * 8, 0, Math.PI * 2);
    interestCtx.strokeStyle = 'rgba(255,255,255,0.24)';
    interestCtx.lineWidth = 1.2;
    interestCtx.stroke();
  }
}

function agentWorkbenchScenario() {
  return agentWorkbenchScenarios[agentInteraction.taskIndex % agentWorkbenchScenarios.length] || agentWorkbenchScenarios[0];
}

function agentWorkbenchLayout(width, height) {
  const compact = width < 460 || height < 220;
  const scenario = agentWorkbenchScenario();
  const taskW = compact ? Math.max(70, (width - 38) / 3) : Math.min(138, width * 0.22);
  const taskY = compact ? 14 : 24;
  const paperW = compact ? Math.min(96, width * 0.25) : Math.min(124, width * 0.2);
  const paperH = compact ? 58 : 76;
  const desk = {
    x: compact ? 10 : 22,
    y: compact ? 48 : 58,
    w: width - (compact ? 20 : 44),
    h: height - (compact ? 76 : 88)
  };
  return {
    compact,
    desk,
    taskCards: agentTasks.map((task, index) => ({
      ...task,
      index,
      x: compact ? 12 + index * (taskW + 7) : 18,
      y: compact ? taskY : 28 + index * 38,
      w: taskW,
      h: compact ? 24 : 30
    })),
    evidenceSheets: scenario.evidence.map((sheet) => ({
      ...sheet,
      x: desk.x + desk.w * sheet.x - paperW / 2,
      y: desk.y + desk.h * sheet.y - paperH / 2,
      w: paperW,
      h: paperH
    })),
    lens: {
      x: desk.x + desk.w * (agentInteraction.active ? agentInteraction.x : 0.46 + Math.sin(interestTick * 0.026) * 0.16),
      y: desk.y + desk.h * (agentInteraction.active ? agentInteraction.y : 0.4 + Math.cos(interestTick * 0.022) * 0.11),
      r: compact ? 22 : 30
    },
    stamp: {
      id: 'stamp',
      x: desk.x + desk.w * (compact ? 0.61 : 0.73),
      y: desk.y + desk.h * (compact ? 0.72 : 0.69),
      w: compact ? 102 : 132,
      h: compact ? 34 : 42
    },
    result: {
      x: desk.x + desk.w * (compact ? 0.5 : 0.66),
      y: desk.y + desk.h * (compact ? 0.66 : 0.58),
      w: compact ? 146 : 178,
      h: compact ? 52 : 66
    }
  };
}

function drawRotatedSheet(ctx, sheet, options = {}) {
  ctx.save();
  ctx.translate(sheet.x + sheet.w / 2, sheet.y + sheet.h / 2);
  ctx.rotate(sheet.r || 0);
  drawRoundedRect(ctx, -sheet.w / 2, -sheet.h / 2, sheet.w, sheet.h, 8);
  ctx.fillStyle = options.fill || 'rgba(255,255,255,0.1)';
  ctx.fill();
  ctx.strokeStyle = options.stroke || 'rgba(255,255,255,0.18)';
  ctx.lineWidth = options.lineWidth || 1;
  ctx.stroke();
  ctx.fillStyle = options.titleColor || options.textColor || '#f5f5f5';
  ctx.font = options.titleFont || '10px JetBrains Mono, monospace';
  fillTruncatedText(ctx, sheet.title, -sheet.w / 2 + 10, -sheet.h / 2 + 17, sheet.w - 20);
  ctx.fillStyle = options.lineColor || 'rgba(255,255,255,0.62)';
  ctx.font = options.lineFont || '8.5px JetBrains Mono, monospace';
  (sheet.lines || []).slice(0, 2).forEach((line, index) => {
    fillTruncatedText(ctx, line, -sheet.w / 2 + 10, -sheet.h / 2 + 34 + index * 13, sheet.w - 20);
  });
  ctx.restore();
}

function drawAgentWorkbench(width, height, t, primary, secondary, muted) {
  const layout = agentWorkbenchLayout(width, height);
  const scenario = agentWorkbenchScenario();
  const task = agentTasks[agentInteraction.taskIndex % agentTasks.length];
  const textColor = themeColor('--text') || '#f5f5f5';
  const desk = layout.desk;
  const activeEvidenceIndex = Math.floor((t * (0.42 + agentInteraction.runBoost * 0.5)) % scenario.evidence.length);
  const activeEvidence = layout.evidenceSheets[activeEvidenceIndex] || layout.evidenceSheets[0];

  agentInteraction.pulse *= 0.86;
  agentInteraction.runBoost *= 0.88;

  interestCtx.save();
  interestCtx.beginPath();
  interestCtx.moveTo(desk.x + 16, desk.y + 6);
  interestCtx.lineTo(desk.x + desk.w - 12, desk.y);
  interestCtx.lineTo(desk.x + desk.w, desk.y + desk.h);
  interestCtx.lineTo(desk.x, desk.y + desk.h - 2);
  interestCtx.closePath();
  interestCtx.fillStyle = 'rgba(255,255,255,0.045)';
  interestCtx.fill();
  interestCtx.strokeStyle = 'rgba(255,255,255,0.12)';
  interestCtx.stroke();

  const grainCount = layout.compact ? 5 : 8;
  for (let i = 0; i < grainCount; i += 1) {
    const y = desk.y + 22 + i * (desk.h - 40) / grainCount;
    interestCtx.beginPath();
    interestCtx.moveTo(desk.x + 18, y);
    interestCtx.quadraticCurveTo(width * 0.52, y + Math.sin(t + i) * 4, desk.x + desk.w - 18, y + Math.cos(t + i) * 2);
    interestCtx.strokeStyle = 'rgba(255,255,255,0.045)';
    interestCtx.lineWidth = 1;
    interestCtx.stroke();
  }

  layout.taskCards.forEach((card) => {
    const selected = card.index === agentInteraction.taskIndex;
    const hovered = agentInteraction.hoverType === 'task' && agentInteraction.hoverId === card.index;
    drawRotatedSheet(interestCtx, {
      ...card,
      r: layout.compact ? 0 : -0.035 + card.index * 0.025,
      title: layout.compact ? card.compactTitle : card.title,
      lines: layout.compact ? [] : [card.prompt]
    }, {
      fill: selected || hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.075)',
      stroke: selected ? secondary : hovered ? primary : 'rgba(255,255,255,0.16)',
      lineWidth: selected || hovered ? 2 : 1,
      titleColor: selected ? secondary : hovered ? primary : textColor,
      lineColor: muted,
      titleFont: layout.compact ? '9px JetBrains Mono, monospace' : '9.5px JetBrains Mono, monospace'
    });
  });

  layout.evidenceSheets.forEach((sheet, index) => {
    const active = index === activeEvidenceIndex;
    const hovered = agentInteraction.hoverType === 'evidence' && agentInteraction.hoverId === sheet.id;
    const selected = agentInteraction.selectedStage === sheet.id;
    drawRotatedSheet(interestCtx, sheet, {
      fill: active || hovered || selected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.085)',
      stroke: selected ? secondary : active || hovered ? primary : 'rgba(255,255,255,0.17)',
      lineWidth: active || hovered || selected ? 2 : 1,
      titleColor: active || hovered ? primary : textColor,
      lineColor: active ? textColor : muted
    });

    if (active || selected) {
      const cx = sheet.x + sheet.w / 2;
      const cy = sheet.y + sheet.h / 2;
      interestCtx.beginPath();
      interestCtx.arc(cx, cy, Math.max(sheet.w, sheet.h) * 0.48 + agentInteraction.pulse * 8, 0, Math.PI * 2);
      interestCtx.strokeStyle = `rgba(255,255,255,${active ? 0.2 : 0.12})`;
      interestCtx.lineWidth = 1.2;
      interestCtx.stroke();
    }
  });

  const lens = layout.lens;
  const scanX = activeEvidence.x + activeEvidence.w / 2;
  const scanY = activeEvidence.y + activeEvidence.h / 2;
  interestCtx.beginPath();
  interestCtx.arc(agentInteraction.active ? lens.x : scanX, agentInteraction.active ? lens.y : scanY, lens.r, 0, Math.PI * 2);
  interestCtx.fillStyle = 'rgba(255,255,255,0.035)';
  interestCtx.fill();
  interestCtx.strokeStyle = primary;
  interestCtx.lineWidth = 2.2;
  interestCtx.stroke();
  interestCtx.beginPath();
  interestCtx.moveTo((agentInteraction.active ? lens.x : scanX) + lens.r * 0.62, (agentInteraction.active ? lens.y : scanY) + lens.r * 0.62);
  interestCtx.lineTo((agentInteraction.active ? lens.x : scanX) + lens.r * 1.18, (agentInteraction.active ? lens.y : scanY) + lens.r * 1.18);
  interestCtx.strokeStyle = secondary;
  interestCtx.lineWidth = 4;
  interestCtx.lineCap = 'round';
  interestCtx.stroke();
  interestCtx.lineCap = 'butt';

  const result = layout.result;
  drawRotatedSheet(interestCtx, {
    ...result,
    r: -0.035,
    title: `${scenario.verb} result`,
    lines: [scenario.result, task.outcome]
  }, {
    fill: 'rgba(255,255,255,0.11)',
    stroke: agentInteraction.hoverType === 'stamp' ? secondary : 'rgba(255,255,255,0.22)',
    lineWidth: agentInteraction.hoverType === 'stamp' ? 2 : 1,
    titleColor: secondary,
    lineColor: textColor,
    titleFont: '10px JetBrains Mono, monospace'
  });

  const stamp = layout.stamp;
  interestCtx.save();
  interestCtx.translate(stamp.x + stamp.w / 2, stamp.y + stamp.h / 2);
  interestCtx.rotate(-0.13);
  drawRoundedRect(interestCtx, -stamp.w / 2, -stamp.h / 2, stamp.w, stamp.h, 7);
  interestCtx.strokeStyle = secondary;
  interestCtx.lineWidth = 2.4 + agentInteraction.pulse * 2.2;
  interestCtx.stroke();
  interestCtx.fillStyle = `rgba(255,255,255,${0.04 + agentInteraction.pulse * 0.04})`;
  interestCtx.fill();
  interestCtx.fillStyle = secondary;
  interestCtx.font = layout.compact ? '13px JetBrains Mono, monospace' : '16px JetBrains Mono, monospace';
  interestCtx.textAlign = 'center';
  interestCtx.fillText(scenario.stamp, 0, 5);
  interestCtx.textAlign = 'left';
  interestCtx.restore();

  interestCtx.fillStyle = muted;
  interestCtx.font = layout.compact ? '8.5px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
  fillTruncatedText(interestCtx, layout.compact ? 'Tap a note. Scan evidence. Stamp a result.' : 'Research workbench: click a note, scan the evidence, then stamp the conclusion.', desk.x + 10, height - 14, desk.w - 20);
  interestCtx.restore();
}

function educationGardenLayout(width, height) {
  const compact = width < 460 || height < 220;
  const soilY = height * (compact ? 0.72 : 0.76);
  const plantArea = {
    x: compact ? 20 : 36,
    y: compact ? 42 : 44,
    w: width - (compact ? 40 : 72),
    h: soilY - (compact ? 46 : 52)
  };
  const visibleConcepts = educationConcepts.slice(0, compact ? 4 : educationConcepts.length);
  return {
    compact,
    soilY,
    plantArea,
    plants: visibleConcepts.map((concept, index) => {
      const gap = plantArea.w / Math.max(1, visibleConcepts.length - 1);
      const x = plantArea.x + gap * index;
      const selectedGrowth = concept.id === educationInteraction.selectedConcept ? educationMastery(concept) : concept.mastery;
      const h = (compact ? 44 : 70) + selectedGrowth * (compact ? 34 : 54);
      return {
        ...concept,
        x,
        y: soilY - h,
        w: compact ? 54 : 68,
        h,
        growth: selectedGrowth
      };
    }),
    feedbackStones: educationSignals.map((signal, index) => ({
      ...signal,
      x: width * 0.16 + index * Math.min(106, width * 0.23),
      y: height - (compact ? 34 : 38),
      w: compact ? 74 : 92,
      h: compact ? 24 : 28
    })),
    signpost: {
      id: 'signpost',
      x: width - (compact ? 128 : 178),
      y: compact ? 18 : 30,
      w: compact ? 112 : 154,
      h: compact ? 48 : 58
    }
  };
}

function drawLeaf(ctx, x, y, size, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.55, -size * 0.55, size * 1.2, -size * 0.2, size * 1.35, 0);
  ctx.bezierCurveTo(size * 0.82, size * 0.42, size * 0.28, size * 0.44, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawEducationGarden(width, height, t, primary, secondary, muted) {
  const layout = educationGardenLayout(width, height);
  const concept = educationConceptForSelected();
  const signal = educationSignalForSelected();
  const mastery = educationMastery(concept);
  const textColor = themeColor('--text') || '#f5f5f5';
  const violet = themeColor('--violet') || '#9b5cff';
  const signalShift = signal.id === 'correct' ? 'grows stronger' : signal.id === 'hint' ? 'adds a guide light' : 'gets a simpler next step';

  educationInteraction.pulse *= 0.86;
  educationInteraction.masteryBoost *= 0.9;

  const skyGlow = interestCtx.createRadialGradient(width * 0.25, height * 0.18, 0, width * 0.25, height * 0.18, width * 0.75);
  skyGlow.addColorStop(0, 'rgba(255,255,255,0.08)');
  skyGlow.addColorStop(1, 'rgba(255,255,255,0)');
  interestCtx.fillStyle = skyGlow;
  interestCtx.fillRect(0, 0, width, height);

  interestCtx.beginPath();
  interestCtx.moveTo(0, layout.soilY);
  for (let x = 0; x <= width; x += 24) {
    interestCtx.lineTo(x, layout.soilY + Math.sin(t + x * 0.03) * 3);
  }
  interestCtx.lineTo(width, height);
  interestCtx.lineTo(0, height);
  interestCtx.closePath();
  interestCtx.fillStyle = 'rgba(255,255,255,0.055)';
  interestCtx.fill();
  interestCtx.strokeStyle = 'rgba(255,255,255,0.13)';
  interestCtx.stroke();

  for (let i = 0; i < 16; i += 1) {
    const x = (i * 57 + interestTick * 0.2) % width;
    const y = layout.soilY + 9 + (i % 4) * 12;
    interestCtx.beginPath();
    interestCtx.arc(x, y, 1.2, 0, Math.PI * 2);
    interestCtx.fillStyle = i % 3 === 0 ? secondary : primary;
    interestCtx.globalAlpha = 0.24;
    interestCtx.fill();
    interestCtx.globalAlpha = 1;
  }

  layout.plants.forEach((plant, index) => {
    const selected = plant.id === educationInteraction.selectedConcept;
    const hovered = educationInteraction.hoverType === 'concept' && educationInteraction.hoverId === plant.id;
    const droop = selected && signal.id === 'incorrect' ? 0.22 : 0;
    const sway = Math.sin(t * 1.2 + index) * (selected ? 3.2 : 1.6);
    const baseX = plant.x;
    const baseY = layout.soilY + 2;
    const topX = baseX + sway + droop * 14;
    const topY = baseY - plant.h * (0.72 + plant.growth * 0.18);
    const stemColor = selected ? primary : 'rgba(255,255,255,0.52)';

    interestCtx.beginPath();
    interestCtx.moveTo(baseX, baseY);
    interestCtx.quadraticCurveTo(baseX + sway * 0.7, (baseY + topY) / 2, topX, topY);
    interestCtx.strokeStyle = stemColor;
    interestCtx.lineWidth = selected || hovered ? 3.2 : 2;
    interestCtx.stroke();

    const leafColor = selected ? `rgba(255,255,255,${0.32 + plant.growth * 0.28})` : 'rgba(255,255,255,0.22)';
    drawLeaf(interestCtx, baseX - 2, baseY - plant.h * 0.28, 11 + plant.growth * 8, -0.82, leafColor);
    drawLeaf(interestCtx, baseX + 3, baseY - plant.h * 0.48, 10 + plant.growth * 7, 0.42, leafColor);
    if (!layout.compact) drawLeaf(interestCtx, baseX - 1, baseY - plant.h * 0.63, 8 + plant.growth * 5, -0.58, leafColor);

    const bloom = 7 + plant.growth * 13 + (selected ? educationInteraction.pulse * 7 : 0);
    const petals = selected ? 7 : 5;
    for (let p = 0; p < petals; p += 1) {
      const a = (Math.PI * 2 / petals) * p + t * 0.12;
      interestCtx.beginPath();
      interestCtx.ellipse(topX + Math.cos(a) * bloom * 0.55, topY + Math.sin(a) * bloom * 0.42, bloom * 0.33, bloom * 0.18, a, 0, Math.PI * 2);
      interestCtx.fillStyle = selected ? (p % 2 ? secondary : primary) : 'rgba(255,255,255,0.22)';
      interestCtx.globalAlpha = selected ? 0.76 : 0.42;
      interestCtx.fill();
      interestCtx.globalAlpha = 1;
    }
    interestCtx.beginPath();
    interestCtx.arc(topX, topY, bloom * 0.34, 0, Math.PI * 2);
    interestCtx.fillStyle = selected ? textColor : 'rgba(255,255,255,0.38)';
    interestCtx.fill();

    if (selected && signal.id === 'hint') {
      for (let i = 0; i < 5; i += 1) {
        const a = t * 0.8 + i * 1.25;
        interestCtx.beginPath();
        interestCtx.arc(topX + Math.cos(a) * (bloom + 13), topY + Math.sin(a) * (bloom + 9), 2.2, 0, Math.PI * 2);
        interestCtx.fillStyle = secondary;
        interestCtx.fill();
      }
    }

    interestCtx.fillStyle = selected || hovered ? textColor : muted;
    interestCtx.font = layout.compact ? '8px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace';
    interestCtx.textAlign = 'center';
    interestCtx.fillText(layout.compact ? plant.compact : plant.label, baseX, Math.min(height - 9, layout.soilY + 20));
    interestCtx.textAlign = 'left';
  });

  layout.feedbackStones.forEach((stone) => {
    const selected = stone.id === educationInteraction.selectedSignal;
    const hovered = educationInteraction.hoverType === 'signal' && educationInteraction.hoverId === stone.id;
    interestCtx.beginPath();
    interestCtx.ellipse(stone.x + stone.w / 2, stone.y + stone.h / 2, stone.w / 2, stone.h / 2, -0.05, 0, Math.PI * 2);
    interestCtx.fillStyle = selected || hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.065)';
    interestCtx.fill();
    interestCtx.strokeStyle = selected ? secondary : hovered ? primary : 'rgba(255,255,255,0.15)';
    interestCtx.lineWidth = selected || hovered ? 2 : 1;
    interestCtx.stroke();
    interestCtx.fillStyle = selected ? secondary : textColor;
    interestCtx.font = layout.compact ? '8.5px JetBrains Mono, monospace' : '9.5px JetBrains Mono, monospace';
    interestCtx.textAlign = 'center';
    interestCtx.fillText(layout.compact ? stone.compact : stone.label, stone.x + stone.w / 2, stone.y + stone.h / 2 + 3);
    interestCtx.textAlign = 'left';
  });

  const sign = layout.signpost;
  interestCtx.beginPath();
  interestCtx.moveTo(sign.x + 16, sign.y + sign.h);
  interestCtx.lineTo(sign.x + 16, layout.soilY - 4);
  interestCtx.strokeStyle = 'rgba(255,255,255,0.24)';
  interestCtx.lineWidth = 3;
  interestCtx.stroke();
  drawRoundedRect(interestCtx, sign.x, sign.y, sign.w, sign.h, 9);
  interestCtx.fillStyle = 'rgba(3, 7, 18, 0.52)';
  interestCtx.fill();
  interestCtx.strokeStyle = educationInteraction.hoverType === 'insight' ? primary : 'rgba(255,255,255,0.18)';
  interestCtx.stroke();
  interestCtx.fillStyle = primary;
  interestCtx.font = layout.compact ? '8.5px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
  fillTruncatedText(interestCtx, 'Next practice', sign.x + 10, sign.y + 16, sign.w - 20);
  interestCtx.fillStyle = textColor;
  interestCtx.font = layout.compact ? '8px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace';
  fillTruncatedText(interestCtx, `${concept.label}: ${signalShift}`, sign.x + 10, sign.y + 31, sign.w - 20);
  interestCtx.fillStyle = mastery > 0.68 ? primary : mastery > 0.48 ? violet : secondary;
  fillTruncatedText(interestCtx, `Mastery ${Math.round(mastery * 100)}%`, sign.x + 10, sign.y + 46, sign.w - 20);

  if (educationInteraction.active) {
    const pointerX = educationInteraction.x * width;
    const pointerY = educationInteraction.y * height;
    interestCtx.beginPath();
    interestCtx.arc(pointerX, pointerY, 12 + educationInteraction.pulse * 14, 0, Math.PI * 2);
    interestCtx.strokeStyle = `rgba(255,255,255,${educationInteraction.dragging ? 0.42 : 0.22})`;
    interestCtx.lineWidth = educationInteraction.dragging ? 2 : 1.1;
    interestCtx.stroke();
  }
}

function drawInterestAnimation() {
  const rect = interestCanvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  const { width, height } = resizeDrawingCanvas(interestCanvas, interestCtx);
  if (width < 2 || height < 2) return;
  const entry = activeInterestEntry();
  if (!entry) return;
  const type = entry.child.animation;
  const primary = themeColor('--cyan') || '#00f5ff';
  const secondary = themeColor('--pink') || '#ff2e88';
  const muted = themeColor('--muted') || '#9ca9cf';
  const t = interestTick * 0.05;

  interestCtx.clearRect(0, 0, width, height);
  interestCtx.fillStyle = 'rgba(3, 7, 18, 0.46)';
  interestCtx.fillRect(0, 0, width, height);
  interestCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  interestCtx.lineWidth = 1;
  for (let x = 24; x < width; x += 36) {
    interestCtx.beginPath();
    interestCtx.moveTo(x, 0);
    interestCtx.lineTo(x, height);
    interestCtx.stroke();
  }
  for (let y = 24; y < height; y += 36) {
    interestCtx.beginPath();
    interestCtx.moveTo(0, y);
    interestCtx.lineTo(width, y);
    interestCtx.stroke();
  }

  if (type === 'point-cloud') {
    const cx = width * 0.5;
    const cy = height * 0.52;
    const scale = Math.min(width, height) * 0.8;
    const pointerX = pointCloudInteraction.x * width;
    const pointerY = pointCloudInteraction.y * height;
    const autoScrub = 0.36 + Math.sin(t * 0.74) * 0.28;
    pointCloudInteraction.targetScrub = pointCloudInteraction.dragging
      ? pointCloudInteraction.targetScrub
      : pointCloudInteraction.active
        ? pointCloudInteraction.x
        : autoScrub;
    pointCloudInteraction.scrub += (pointCloudInteraction.targetScrub - pointCloudInteraction.scrub) * (pointCloudInteraction.dragging ? 0.72 : 0.18);
    pointCloudInteraction.energy += ((pointCloudInteraction.active ? 1 : 0) - pointCloudInteraction.energy) * 0.16;
    const progress = Math.max(0, Math.min(1, pointCloudInteraction.scrub));

    registrationState.points.forEach((point, index) => {
      const target = transformPoint(point, index, registrationParams());
      if (!target.visible) return;
      const sourceX = cx + point.x * scale;
      const sourceY = cy + point.y * scale;
      const targetX = cx + target.x * scale;
      const targetY = cy + target.y * scale;
      let x = sourceX + (targetX - sourceX) * progress;
      let y = sourceY + (targetY - sourceY) * progress;
      const pointerDistance = Math.hypot(pointerX - x, pointerY - y);
      const influence = pointCloudInteraction.active
        ? Math.max(0, 1 - pointerDistance / (scale * 0.52)) ** 1.35
        : 0;
      const orbit = Math.sin(t + index * 0.43) * influence * scale * 0.022;
      x += (targetX - x) * influence * 0.92 + orbit;
      y += (targetY - y) * influence * 0.92 - orbit;

      interestCtx.beginPath();
      interestCtx.arc(sourceX, sourceY, 2.1, 0, Math.PI * 2);
      interestCtx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      interestCtx.fill();

      interestCtx.beginPath();
      interestCtx.arc(targetX, targetY, 2.8, 0, Math.PI * 2);
      interestCtx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      interestCtx.fill();

      interestCtx.beginPath();
      interestCtx.moveTo(x, y);
      interestCtx.lineTo(targetX, targetY);
      interestCtx.strokeStyle = `rgba(232, 240, 255, ${0.08 + influence * 0.34})`;
      interestCtx.lineWidth = 0.8 + influence * 1.7;
      interestCtx.stroke();

      interestCtx.beginPath();
      interestCtx.arc(x, y, 3.8 + influence * 6.4, 0, Math.PI * 2);
      interestCtx.fillStyle = index % 2 ? primary : secondary;
      interestCtx.fill();
    });

    if (pointCloudInteraction.energy > 0.02) {
      const lens = interestCtx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, scale * 0.22);
      lens.addColorStop(0, `rgba(255, 255, 255, ${0.2 * pointCloudInteraction.energy})`);
      lens.addColorStop(0.58, `rgba(255, 255, 255, ${0.05 * pointCloudInteraction.energy})`);
      lens.addColorStop(1, 'rgba(255, 255, 255, 0)');
      interestCtx.fillStyle = lens;
      interestCtx.beginPath();
      interestCtx.arc(pointerX, pointerY, scale * 0.22, 0, Math.PI * 2);
      interestCtx.fill();

      interestCtx.beginPath();
      interestCtx.arc(pointerX, pointerY, scale * 0.16 + Math.sin(t * 1.5) * 5, 0, Math.PI * 2);
      interestCtx.strokeStyle = `rgba(255, 255, 255, ${(pointCloudInteraction.dragging ? 0.72 : 0.38) * pointCloudInteraction.energy})`;
      interestCtx.lineWidth = pointCloudInteraction.dragging ? 2.8 : 1.8;
      interestCtx.stroke();

      if (pointCloudInteraction.dragging) {
        interestCtx.beginPath();
        interestCtx.moveTo(pointerX, 16);
        interestCtx.lineTo(pointerX, height - 16);
        interestCtx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        interestCtx.lineWidth = 1;
        interestCtx.stroke();
      }
    }

    const barWidth = Math.min(220, width * 0.46);
    const barX = width - barWidth - 18;
    const barY = height - 20;
    interestCtx.lineCap = 'round';
    interestCtx.lineWidth = 8;
    interestCtx.beginPath();
    interestCtx.moveTo(barX, barY);
    interestCtx.lineTo(barX + barWidth, barY);
    interestCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    interestCtx.stroke();
    interestCtx.beginPath();
    interestCtx.moveTo(barX, barY);
    interestCtx.lineTo(barX + barWidth * progress, barY);
    interestCtx.strokeStyle = secondary;
    interestCtx.stroke();
    interestCtx.beginPath();
    interestCtx.arc(barX + barWidth * progress, barY, pointCloudInteraction.dragging ? 8 : 6, 0, Math.PI * 2);
    interestCtx.fillStyle = primary;
    interestCtx.fill();
    interestCtx.strokeStyle = 'rgba(3, 7, 18, 0.8)';
    interestCtx.lineWidth = 2;
    interestCtx.stroke();
    interestCtx.lineCap = 'butt';
    interestCtx.lineWidth = 1;
  } else if (type === 'vpr') {
    vprInteraction.route += (vprInteraction.targetRoute - vprInteraction.route) * (vprInteraction.dragging ? 0.55 : 0.14);
    vprInteraction.condition += (vprInteraction.targetCondition - vprInteraction.condition) * (vprInteraction.dragging ? 0.55 : 0.12);
    vprInteraction.energy += ((vprInteraction.active ? 1 : 0) - vprInteraction.energy) * 0.14;

    const query = routePoint(width, height, vprInteraction.route);
    const candidates = vprCandidateScores();
    const best = candidates[0];
    const selected = vprInteraction.selected || best.id;
    const conditionTint = vprInteraction.condition;
    const cardY = height * 0.68;
    const cardGap = Math.max(7, width * 0.012);
    const cardWidth = Math.min(86, (width - cardGap * 6) / 5.2);
    const cardHeight = Math.max(44, height * 0.2);
    const startX = Math.max(16, width * 0.5 - (cardWidth * 5 + cardGap * 4) / 2);

    interestCtx.beginPath();
    for (let step = 0; step <= 70; step += 1) {
      const point = routePoint(width, height, step / 70);
      if (step === 0) interestCtx.moveTo(point.x, point.y);
      else interestCtx.lineTo(point.x, point.y);
    }
    interestCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    interestCtx.lineWidth = 5;
    interestCtx.stroke();
    interestCtx.strokeStyle = primary;
    interestCtx.lineWidth = 1.5;
    interestCtx.stroke();

    vprPlaces.forEach((place) => {
      const point = routePoint(width, height, place.u);
      const isBest = place.id === best.id;
      const isSelected = place.id === selected;
      const radius = isBest ? 9 + Math.sin(t * 2) * 1.5 : 5.5;

      interestCtx.beginPath();
      interestCtx.arc(point.x, point.y, radius + 7, 0, Math.PI * 2);
      interestCtx.fillStyle = isBest ? `rgba(255,255,255,${0.08 + best.score * 0.18})` : 'rgba(255,255,255,0.04)';
      interestCtx.fill();
      interestCtx.beginPath();
      interestCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      interestCtx.fillStyle = isBest ? secondary : primary;
      interestCtx.fill();
      interestCtx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.24)';
      interestCtx.lineWidth = isSelected ? 2 : 1;
      interestCtx.stroke();
      interestCtx.fillStyle = muted;
      interestCtx.font = '10px JetBrains Mono, monospace';
      interestCtx.fillText(place.id, point.x - 16, point.y - 14);
    });

    const bestPoint = routePoint(width, height, best.u);
    interestCtx.beginPath();
    interestCtx.moveTo(query.x, query.y);
    interestCtx.quadraticCurveTo((query.x + bestPoint.x) / 2, Math.min(query.y, bestPoint.y) - height * 0.16, bestPoint.x, bestPoint.y);
    interestCtx.strokeStyle = `rgba(255,255,255,${0.18 + best.score * 0.46})`;
    interestCtx.lineWidth = 1.4 + best.score * 2.2;
    interestCtx.stroke();

    const frustum = 24 + vprInteraction.energy * 8;
    interestCtx.save();
    interestCtx.translate(query.x, query.y);
    interestCtx.rotate((vprInteraction.condition - 0.5) * 0.34 + Math.sin(t) * 0.04);
    interestCtx.beginPath();
    interestCtx.moveTo(0, -8);
    interestCtx.lineTo(frustum, -frustum * 0.62);
    interestCtx.lineTo(frustum, frustum * 0.62);
    interestCtx.closePath();
    interestCtx.fillStyle = `rgba(255,255,255,${0.06 + vprInteraction.energy * 0.08})`;
    interestCtx.strokeStyle = secondary;
    interestCtx.lineWidth = vprInteraction.dragging ? 2.8 : 1.8;
    interestCtx.fill();
    interestCtx.stroke();
    interestCtx.beginPath();
    interestCtx.arc(0, 0, 8 + vprInteraction.energy * 4, 0, Math.PI * 2);
    interestCtx.fillStyle = primary;
    interestCtx.fill();
    interestCtx.restore();

    const queryPanelX = Math.max(16, query.x - 42);
    const queryPanelY = Math.max(14, query.y - 64);
    drawRoundedRect(interestCtx, queryPanelX, queryPanelY, 84, 42, 8);
    interestCtx.fillStyle = `rgba(3, 7, 18, ${0.66 + conditionTint * 0.18})`;
    interestCtx.fill();
    interestCtx.strokeStyle = secondary;
    interestCtx.stroke();
    interestCtx.fillStyle = primary;
    interestCtx.font = '11px JetBrains Mono, monospace';
    interestCtx.fillText('QUERY', queryPanelX + 10, queryPanelY + 17);
    interestCtx.fillStyle = muted;
    interestCtx.fillText(conditionTint < 0.34 ? 'day' : conditionTint < 0.68 ? 'shift' : 'night', queryPanelX + 10, queryPanelY + 31);

    candidates.slice(0, 5).forEach((candidate, index) => {
      const x = startX + index * (cardWidth + cardGap);
      const y = cardY;
      const isTop = index === 0;
      const isSelected = candidate.id === selected;
      const shade = 18 + Math.round(candidate.condition * 72);

      drawRoundedRect(interestCtx, x, y, cardWidth, cardHeight, 8);
      interestCtx.fillStyle = `rgba(${shade}, ${shade}, ${shade + 26}, 0.72)`;
      interestCtx.fill();
      interestCtx.strokeStyle = isTop ? secondary : isSelected ? primary : 'rgba(255,255,255,0.18)';
      interestCtx.lineWidth = isTop ? 2.2 : 1;
      interestCtx.stroke();

      interestCtx.beginPath();
      interestCtx.moveTo(x + 8, y + cardHeight * 0.56);
      interestCtx.lineTo(x + cardWidth * 0.38, y + cardHeight * 0.36);
      interestCtx.lineTo(x + cardWidth * 0.65, y + cardHeight * 0.52);
      interestCtx.lineTo(x + cardWidth - 8, y + cardHeight * 0.32);
      interestCtx.strokeStyle = `rgba(255,255,255,${0.18 + candidate.score * 0.28})`;
      interestCtx.lineWidth = 1.3;
      interestCtx.stroke();

      interestCtx.fillStyle = isTop ? secondary : primary;
      interestCtx.font = '10px JetBrains Mono, monospace';
      interestCtx.fillText(candidate.id, x + 8, y + 14);
      interestCtx.fillStyle = muted;
      interestCtx.fillText(candidate.name, x + 8, y + cardHeight - 18);

      interestCtx.beginPath();
      interestCtx.moveTo(x + 8, y + cardHeight - 8);
      interestCtx.lineTo(x + cardWidth - 8, y + cardHeight - 8);
      interestCtx.strokeStyle = 'rgba(255,255,255,0.14)';
      interestCtx.lineWidth = 4;
      interestCtx.stroke();
      interestCtx.beginPath();
      interestCtx.moveTo(x + 8, y + cardHeight - 8);
      interestCtx.lineTo(x + 8 + (cardWidth - 16) * candidate.score, y + cardHeight - 8);
      interestCtx.strokeStyle = isTop ? secondary : primary;
      interestCtx.lineWidth = 4;
      interestCtx.stroke();
    });

    const scoreX = width - 114;
    const scoreY = 20;
    drawRoundedRect(interestCtx, scoreX, scoreY, 94, 42, 10);
    interestCtx.fillStyle = 'rgba(3, 7, 18, 0.58)';
    interestCtx.fill();
    interestCtx.strokeStyle = 'rgba(255,255,255,0.16)';
    interestCtx.stroke();
    interestCtx.fillStyle = secondary;
    interestCtx.font = '12px JetBrains Mono, monospace';
    interestCtx.fillText(`TOP ${Math.round(best.score * 100)}%`, scoreX + 12, scoreY + 18);
    interestCtx.fillStyle = muted;
    interestCtx.fillText(best.id, scoreX + 12, scoreY + 32);
  } else if (type === 'agent') {
    drawHumanAiCollab(width, height, t, primary, secondary, muted);
    return;
    const layout = agentRunnerLayout(width, height);
    const task = agentTasks[agentInteraction.taskIndex % agentTasks.length];
    const autonomy = clamp01(agentInteraction.active ? agentInteraction.x : 0.52 + Math.sin(t * 0.52) * 0.18);
    const verification = clamp01(agentInteraction.active ? 1 - agentInteraction.y : 0.58 + Math.cos(t * 0.48) * 0.18);
    const trace = agentTraceFor(task, verification);
    const flowSpeed = 0.42 + autonomy * 0.28 + agentInteraction.runBoost * 0.36;
    const flow = (t * flowSpeed) % trace.length;
    const activeTraceIndex = Math.floor(flow);
    const activeTrace = trace[activeTraceIndex] || trace[0];
    const enabledRatio = agentTools.filter((tool) => agentInteraction.tools[tool.id]).length / agentTools.length;
    const confidence = clamp01(0.42 + enabledRatio * 0.22 + verification * 0.2 + (agentInteraction.tools.eval ? 0.1 : -0.08));
    const textColor = themeColor('--text') || '#f5f5f5';
    const stageMap = Object.fromEntries(layout.stageCards.map((stage) => [stage.id, stage]));
    const activeToolId = activeTrace?.toolId || null;
    const inspectText = agentInspectText(task, activeTrace, confidence);

    agentInteraction.pulse *= 0.86;
    agentInteraction.runBoost *= 0.88;

    interestCtx.fillStyle = muted;
    interestCtx.font = layout.compact ? '8.5px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
    fillTruncatedText(interestCtx, layout.hint.text, layout.hint.x, layout.hint.y, width - layout.hint.x * 2);

    layout.taskCards.forEach((card) => {
      const selected = card.index === agentInteraction.taskIndex;
      const hovered = agentInteraction.hoverType === 'task' && agentInteraction.hoverId === card.index;
      drawRoundedRect(interestCtx, card.x, card.y, card.w, card.h, 8);
      interestCtx.fillStyle = selected || hovered ? 'rgba(255,255,255,0.12)' : 'rgba(3, 7, 18, 0.54)';
      interestCtx.fill();
      interestCtx.strokeStyle = hovered ? primary : selected ? secondary : 'rgba(255,255,255,0.16)';
      interestCtx.lineWidth = selected || hovered ? 2 : 1;
      interestCtx.stroke();
      interestCtx.fillStyle = hovered ? primary : selected ? secondary : textColor;
      interestCtx.font = '10px JetBrains Mono, monospace';
      fillTruncatedText(interestCtx, layout.compact ? card.compactTitle : card.title, card.x + 9, card.y + 14, card.w - 18);
      if (!layout.compact) {
        interestCtx.fillStyle = muted;
        interestCtx.font = '9px JetBrains Mono, monospace';
        fillTruncatedText(interestCtx, card.prompt, card.x + 9, card.y + 27, card.w - 18);
      }
    });

    layout.toolCards.forEach((tool) => {
      const enabled = agentInteraction.tools[tool.id];
      const selected = agentInteraction.selectedTool === tool.id;
      const active = activeToolId === tool.id;
      const hovered = agentInteraction.hoverType === 'tool' && agentInteraction.hoverId === tool.id;
      drawRoundedRect(interestCtx, tool.x, tool.y, tool.w, tool.h, 7);
      interestCtx.fillStyle = active || hovered ? 'rgba(255,255,255,0.14)' : enabled ? 'rgba(255,255,255,0.1)' : 'rgba(3, 7, 18, 0.48)';
      interestCtx.fill();
      interestCtx.strokeStyle = active ? secondary : hovered ? primary : selected ? secondary : enabled ? primary : 'rgba(255,255,255,0.16)';
      interestCtx.lineWidth = active || selected || hovered ? 2 : 1;
      interestCtx.stroke();
      interestCtx.beginPath();
      interestCtx.arc(tool.x + 8, tool.y + (layout.compact ? tool.h / 2 : 10), 3.2, 0, Math.PI * 2);
      interestCtx.fillStyle = enabled ? active ? secondary : primary : 'rgba(255,255,255,0.18)';
      interestCtx.fill();
      interestCtx.fillStyle = enabled ? textColor : muted;
      interestCtx.font = '9px JetBrains Mono, monospace';
      fillTruncatedText(interestCtx, layout.compact ? tool.compact : tool.label, tool.x + 15, tool.y + (layout.compact ? tool.h / 2 + 3 : 13), tool.w - 18);
      if (!layout.compact) {
        interestCtx.fillStyle = enabled ? muted : 'rgba(255,255,255,0.26)';
        interestCtx.font = '8px JetBrains Mono, monospace';
        fillTruncatedText(interestCtx, tool.detail, tool.x + 9, tool.y + 27, tool.w - 16);
      }
    });

    if (!layout.compact) {
      layout.toolCards.forEach((tool) => {
        const stage = stageMap[tool.stage];
        if (!stage) return;
        const active = activeToolId === tool.id || (agentInteraction.hoverType === 'tool' && agentInteraction.hoverId === tool.id);
        interestCtx.beginPath();
        interestCtx.moveTo(tool.x + tool.w / 2, tool.y + tool.h);
        interestCtx.lineTo(stage.x + stage.w / 2, stage.y);
        interestCtx.strokeStyle = active ? `rgba(255,255,255,0.42)` : 'rgba(255,255,255,0.08)';
        interestCtx.lineWidth = active ? 1.6 : 0.8;
        interestCtx.stroke();
      });
    }

    layout.stageCards.forEach((stage, index) => {
      if (index > 0) {
        const previous = layout.stageCards[index - 1];
        const y1 = previous.y + previous.h / 2;
        const y2 = stage.y + stage.h / 2;
        interestCtx.beginPath();
        interestCtx.moveTo(previous.x + previous.w, y1);
        interestCtx.lineTo(stage.x, y2);
        interestCtx.strokeStyle = activeTrace?.stage === stage.id ? secondary : 'rgba(255,255,255,0.18)';
        interestCtx.lineWidth = activeTrace?.stage === stage.id ? 2.4 : 1.2;
        interestCtx.stroke();
      }
    });

    layout.stageCards.forEach((stage) => {
      const active = activeTrace?.stage === stage.id;
      const selected = agentInteraction.selectedStage === stage.id;
      const hovered = agentInteraction.hoverType === 'stage' && agentInteraction.hoverId === stage.id;
      const pulse = active || selected ? agentInteraction.pulse : 0;
      drawRoundedRect(interestCtx, stage.x - pulse * 5, stage.y - pulse * 4, stage.w + pulse * 10, stage.h + pulse * 8, 8);
      interestCtx.fillStyle = active || hovered ? 'rgba(255,255,255,0.13)' : 'rgba(3, 7, 18, 0.62)';
      interestCtx.fill();
      interestCtx.strokeStyle = selected ? secondary : active || hovered ? primary : 'rgba(255,255,255,0.2)';
      interestCtx.lineWidth = selected || hovered ? 2.4 : 1.2;
      interestCtx.stroke();
      interestCtx.beginPath();
      interestCtx.arc(stage.x + 10, stage.y + 11, 6, 0, Math.PI * 2);
      interestCtx.fillStyle = active ? secondary : 'rgba(255,255,255,0.14)';
      interestCtx.fill();
      interestCtx.fillStyle = active ? '#050505' : textColor;
      interestCtx.font = '8px JetBrains Mono, monospace';
      interestCtx.textAlign = 'center';
      interestCtx.fillText(String(layout.stageCards.indexOf(stage) + 1), stage.x + 10, stage.y + 14);
      interestCtx.textAlign = 'left';
      interestCtx.fillStyle = active || hovered ? primary : textColor;
      interestCtx.font = '10px JetBrains Mono, monospace';
      fillTruncatedText(interestCtx, layout.compact ? stage.compact : stage.label, stage.x + 20, stage.y + 14, stage.w - 24);
      if (!layout.compact) {
        interestCtx.fillStyle = muted;
        interestCtx.font = '8px JetBrains Mono, monospace';
        fillTruncatedText(interestCtx, stage.detail, stage.x + 9, stage.y + 27, stage.w - 16);
      }
    });

    if (activeTrace?.retry) {
      const from = stageMap.evaluate;
      const to = stageMap.plan;
      interestCtx.beginPath();
      interestCtx.moveTo(from.x + from.w * 0.5, from.y);
      interestCtx.quadraticCurveTo(width * 0.55, from.y - 34, to.x + to.w * 0.5, to.y);
      interestCtx.strokeStyle = secondary;
      interestCtx.lineWidth = 2.2;
      interestCtx.stroke();
    }

    drawRoundedRect(interestCtx, layout.trace.x, layout.trace.y, layout.trace.w, layout.trace.h, 8);
    interestCtx.fillStyle = 'rgba(3, 7, 18, 0.58)';
    interestCtx.fill();
    interestCtx.strokeStyle = 'rgba(255,255,255,0.16)';
    interestCtx.lineWidth = 1;
    interestCtx.stroke();
    const traceWindow = layout.compact ? 2 : 4;
    const traceStart = Math.max(0, Math.min(activeTraceIndex - (layout.compact ? 1 : 2), Math.max(0, trace.length - traceWindow)));
    const visibleTrace = trace.slice(traceStart, traceStart + traceWindow);
    visibleTrace.forEach((item, index) => {
      const absoluteIndex = traceStart + index;
      const active = absoluteIndex === activeTraceIndex;
      const y = layout.trace.y + 17 + index * (layout.compact ? 12 : 11);
      interestCtx.beginPath();
      interestCtx.arc(layout.trace.x + 12, y - 3, active ? 4.2 : 2.6, 0, Math.PI * 2);
      interestCtx.fillStyle = active ? secondary : item.retry ? primary : 'rgba(255,255,255,0.32)';
      interestCtx.fill();
      interestCtx.fillStyle = active ? textColor : muted;
      interestCtx.font = layout.compact ? '8.5px JetBrains Mono, monospace' : '9.5px JetBrains Mono, monospace';
      const status = active ? 'running' : absoluteIndex < activeTraceIndex ? 'done' : item.retry ? 'retry' : 'queued';
      fillTruncatedText(interestCtx, `${status}: ${item.label}`, layout.trace.x + 22, y, layout.trace.w - 32);
    });

    const outcome = layout.outcome;
    drawRoundedRect(interestCtx, outcome.x, outcome.y, outcome.w, outcome.h, 7);
    interestCtx.fillStyle = 'rgba(255,255,255,0.07)';
    interestCtx.fill();
    interestCtx.strokeStyle = activeTrace?.retry ? secondary : 'rgba(255,255,255,0.14)';
    interestCtx.lineWidth = 1;
    interestCtx.stroke();
    interestCtx.fillStyle = activeTrace?.retry ? secondary : primary;
    interestCtx.font = layout.compact ? '8px JetBrains Mono, monospace' : '9.5px JetBrains Mono, monospace';
    fillTruncatedText(interestCtx, layout.compact ? agentOutcomeText(task, confidence) : inspectText, outcome.x + 8, outcome.y + (layout.compact ? 9 : 12), outcome.w - 16);

    const meter = layout.meter;
    drawRoundedRect(interestCtx, meter.x, meter.y, meter.w, meter.h, 8);
    interestCtx.fillStyle = 'rgba(3, 7, 18, 0.42)';
    interestCtx.fill();
    interestCtx.strokeStyle = 'rgba(255,255,255,0.12)';
    interestCtx.stroke();
    if (layout.compact) {
      interestCtx.beginPath();
      interestCtx.moveTo(meter.x + 8, meter.y + 7);
      interestCtx.lineTo(meter.x + meter.w - 8, meter.y + 7);
      interestCtx.strokeStyle = 'rgba(255,255,255,0.14)';
      interestCtx.lineWidth = 4;
      interestCtx.stroke();
      interestCtx.beginPath();
      interestCtx.moveTo(meter.x + 8, meter.y + 7);
      interestCtx.lineTo(meter.x + 8 + (meter.w - 16) * confidence, meter.y + 7);
      interestCtx.strokeStyle = primary;
      interestCtx.stroke();
    } else {
      [
        ['confidence', confidence, primary],
        ['verification', verification, secondary]
      ].forEach(([label, value, color], index) => {
        const y = meter.y + 18 + index * 22;
        interestCtx.fillStyle = muted;
        interestCtx.font = '9.5px JetBrains Mono, monospace';
        interestCtx.fillText(label, meter.x + 10, y - 2);
        interestCtx.beginPath();
        interestCtx.moveTo(meter.x + 82, y - 5);
        interestCtx.lineTo(meter.x + meter.w - 12, y - 5);
        interestCtx.strokeStyle = 'rgba(255,255,255,0.14)';
        interestCtx.lineWidth = 5;
        interestCtx.stroke();
        interestCtx.beginPath();
        interestCtx.moveTo(meter.x + 82, y - 5);
        interestCtx.lineTo(meter.x + 82 + (meter.w - 94) * value, y - 5);
        interestCtx.strokeStyle = color;
        interestCtx.stroke();
      });
    }

    if (agentInteraction.active) {
      const pointerX = agentInteraction.x * width;
      const pointerY = agentInteraction.y * height;
      interestCtx.beginPath();
      interestCtx.arc(pointerX, pointerY, 18 + agentInteraction.pulse * 18, 0, Math.PI * 2);
      interestCtx.strokeStyle = `rgba(255,255,255,${agentInteraction.dragging ? 0.52 : 0.28})`;
      interestCtx.lineWidth = agentInteraction.dragging ? 2 : 1.2;
      interestCtx.stroke();
      interestCtx.beginPath();
      interestCtx.moveTo(pointerX - 8, pointerY);
      interestCtx.lineTo(pointerX + 8, pointerY);
      interestCtx.moveTo(pointerX, pointerY - 8);
      interestCtx.lineTo(pointerX, pointerY + 8);
      interestCtx.strokeStyle = secondary;
      interestCtx.stroke();
    }
  } else if (type === 'education') {
    drawRobotTeacherClassroom(width, height, t, primary, secondary, muted);
    return;
    const layout = educationRunnerLayout(width, height);
    const path = educationPathForSelected();
    const concept = educationConceptForSelected();
    const signal = educationSignalForSelected();
    const mastery = educationMastery(concept);
    const textColor = themeColor('--text') || '#f5f5f5';
    const violet = themeColor('--violet') || '#9b5cff';
    const flow = (t * 0.42) % educationLoop.length;
    const activeLoopIndex = Math.floor(flow);
    const activeLoop = educationLoop[activeLoopIndex];
    const inspectText = educationInspectText(path, concept, signal);

    educationInteraction.pulse *= 0.86;
    educationInteraction.masteryBoost *= 0.9;

    interestCtx.fillStyle = muted;
    interestCtx.font = layout.compact ? '8.5px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
    fillTruncatedText(interestCtx, layout.hint.text, layout.hint.x, layout.hint.y, width - layout.hint.x * 2);

    layout.pathCards.forEach((card) => {
      const selected = card.id === educationInteraction.selectedPath;
      const hovered = educationInteraction.hoverType === 'path' && educationInteraction.hoverId === card.id;
      drawRoundedRect(interestCtx, card.x, card.y, card.w, card.h, 8);
      interestCtx.fillStyle = selected || hovered ? 'rgba(255,255,255,0.12)' : 'rgba(3, 7, 18, 0.52)';
      interestCtx.fill();
      interestCtx.strokeStyle = hovered ? primary : selected ? secondary : 'rgba(255,255,255,0.16)';
      interestCtx.lineWidth = selected || hovered ? 2 : 1;
      interestCtx.stroke();
      interestCtx.fillStyle = hovered ? primary : selected ? secondary : textColor;
      interestCtx.font = '10px JetBrains Mono, monospace';
      fillTruncatedText(interestCtx, layout.compact ? card.compact : card.label, card.x + 9, card.y + 14, card.w - 18);
      if (!layout.compact) {
        interestCtx.fillStyle = muted;
        interestCtx.font = '8px JetBrains Mono, monospace';
        fillTruncatedText(interestCtx, card.title, card.x + 9, card.y + 22, card.w - 18);
      }
    });

    if (!layout.compact) {
      layout.conceptCards.forEach((from, index) => {
        const to = layout.conceptCards[(index + 1) % layout.conceptCards.length];
        interestCtx.beginPath();
        interestCtx.moveTo(from.x + from.w / 2, from.y + from.h / 2);
        interestCtx.lineTo(to.x + to.w / 2, to.y + to.h / 2);
        interestCtx.strokeStyle = from.id === educationInteraction.selectedConcept || to.id === educationInteraction.selectedConcept
          ? `rgba(255,255,255,0.26)`
          : 'rgba(255,255,255,0.08)';
        interestCtx.lineWidth = from.id === educationInteraction.selectedConcept || to.id === educationInteraction.selectedConcept ? 1.6 : 0.8;
        interestCtx.stroke();
      });
    }

    layout.conceptCards.forEach((card) => {
      const selected = card.id === educationInteraction.selectedConcept;
      const hovered = educationInteraction.hoverType === 'concept' && educationInteraction.hoverId === card.id;
      const value = selected ? mastery : card.mastery;
      const weak = value < 0.5;
      drawRoundedRect(interestCtx, card.x, card.y, card.w, card.h, 8);
      interestCtx.fillStyle = selected || hovered ? 'rgba(255,255,255,0.12)' : 'rgba(3, 7, 18, 0.6)';
      interestCtx.fill();
      interestCtx.strokeStyle = selected ? secondary : hovered ? primary : weak ? 'rgba(255,177,93,0.62)' : 'rgba(255,255,255,0.18)';
      interestCtx.lineWidth = selected || hovered ? 2 : 1;
      interestCtx.stroke();
      interestCtx.beginPath();
      interestCtx.arc(card.x + 9, card.y + 11, 3.2 + (weak ? Math.sin(t * 1.4) * 0.8 : 0), 0, Math.PI * 2);
      interestCtx.fillStyle = weak ? secondary : primary;
      interestCtx.fill();
      interestCtx.fillStyle = textColor;
      interestCtx.font = '9px JetBrains Mono, monospace';
      fillTruncatedText(interestCtx, layout.compact ? card.compact : card.label, card.x + 16, card.y + 12, card.w - 22);
      interestCtx.beginPath();
      interestCtx.moveTo(card.x + 10, card.y + card.h - 7);
      interestCtx.lineTo(card.x + card.w - 10, card.y + card.h - 7);
      interestCtx.strokeStyle = 'rgba(255,255,255,0.14)';
      interestCtx.lineWidth = 3;
      interestCtx.stroke();
      interestCtx.beginPath();
      interestCtx.moveTo(card.x + 10, card.y + card.h - 7);
      interestCtx.lineTo(card.x + 10 + (card.w - 20) * value, card.y + card.h - 7);
      interestCtx.strokeStyle = value > 0.68 ? primary : value > 0.48 ? violet : secondary;
      interestCtx.stroke();
    });

    const learner = layout.learner;
    drawRoundedRect(interestCtx, learner.x, learner.y, learner.w, learner.h, 12);
    interestCtx.fillStyle = 'rgba(3, 7, 18, 0.58)';
    interestCtx.fill();
    interestCtx.strokeStyle = educationInteraction.hoverType === 'learner' ? primary : 'rgba(255,255,255,0.18)';
    interestCtx.lineWidth = educationInteraction.hoverType === 'learner' ? 2 : 1;
    interestCtx.stroke();
    const learnerCx = learner.x + learner.w / 2;
    const learnerCy = learner.y + (layout.compact ? 18 : 28);
    interestCtx.beginPath();
    interestCtx.arc(learnerCx, learnerCy, layout.compact ? 11 : 15, 0, Math.PI * 2);
    interestCtx.fillStyle = primary;
    interestCtx.fill();
    interestCtx.strokeStyle = secondary;
    interestCtx.stroke();
    const rings = [
      ['Mastery', mastery],
      ['Confidence', signal.id === 'correct' ? 0.78 : signal.id === 'hint' ? 0.58 : 0.38],
      ['Engage', path.id === 'learner' ? 0.72 : 0.62]
    ];
    rings.forEach(([label, value], index) => {
      if (layout.compact && index > 1) return;
      const y = learner.y + (layout.compact ? 38 : 51 + index * 10);
      interestCtx.fillStyle = muted;
      interestCtx.font = '8px JetBrains Mono, monospace';
      interestCtx.fillText(layout.compact ? label.slice(0, 4) : label, learner.x + 8, y);
      interestCtx.beginPath();
      interestCtx.moveTo(learner.x + (layout.compact ? 42 : 76), y - 3);
      interestCtx.lineTo(learner.x + learner.w - 8, y - 3);
      interestCtx.strokeStyle = 'rgba(255,255,255,0.12)';
      interestCtx.lineWidth = 3;
      interestCtx.stroke();
      interestCtx.beginPath();
      interestCtx.moveTo(learner.x + (layout.compact ? 42 : 76), y - 3);
      interestCtx.lineTo(learner.x + (layout.compact ? 42 : 76) + (learner.w - (layout.compact ? 50 : 84)) * value, y - 3);
      interestCtx.strokeStyle = index === 0 ? primary : index === 1 ? secondary : violet;
      interestCtx.stroke();
    });

    const selectedConceptCard = layout.conceptCards.find((item) => item.id === concept.id) || layout.conceptCards[1];
    const practice = layout.practice;
    interestCtx.beginPath();
    interestCtx.moveTo(selectedConceptCard.x + selectedConceptCard.w, selectedConceptCard.y + selectedConceptCard.h / 2);
    interestCtx.lineTo(practice.x, practice.y + practice.h / 2);
    interestCtx.strokeStyle = 'rgba(255,255,255,0.24)';
    interestCtx.lineWidth = 1.4;
    interestCtx.stroke();

    drawRoundedRect(interestCtx, practice.x, practice.y, practice.w, practice.h, 10);
    interestCtx.fillStyle = 'rgba(3, 7, 18, 0.58)';
    interestCtx.fill();
    interestCtx.strokeStyle = educationInteraction.hoverType === 'practice' ? primary : secondary;
    interestCtx.lineWidth = educationInteraction.hoverType === 'practice' ? 2 : 1.3;
    interestCtx.stroke();
    interestCtx.fillStyle = secondary;
    interestCtx.font = '9px JetBrains Mono, monospace';
    fillTruncatedText(interestCtx, layout.compact ? 'Practice' : 'Generated practice', practice.x + 9, practice.y + 14, practice.w - 18);
    interestCtx.fillStyle = textColor;
    interestCtx.font = layout.compact ? '8.5px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace';
    fillTruncatedText(interestCtx, `${concept.label}: ${mastery < 0.55 ? 'scaffold' : 'challenge'}`, practice.x + 9, practice.y + 30, practice.w - 18);
    if (!layout.compact) {
      interestCtx.fillStyle = muted;
      fillTruncatedText(interestCtx, 'Hint · example · next step', practice.x + 9, practice.y + 48, practice.w - 18);
      interestCtx.fillStyle = primary;
      fillTruncatedText(interestCtx, 'Difficulty adapts', practice.x + 9, practice.y + 64, practice.w - 18);
    }

    const insight = layout.insight;
    drawRoundedRect(interestCtx, insight.x, insight.y, insight.w, insight.h, 10);
    interestCtx.fillStyle = 'rgba(3, 7, 18, 0.55)';
    interestCtx.fill();
    interestCtx.strokeStyle = educationInteraction.hoverType === 'insight' || path.id === 'teacher' || path.id === 'evidence'
      ? primary
      : 'rgba(255,255,255,0.16)';
    interestCtx.stroke();
    interestCtx.fillStyle = primary;
    interestCtx.font = '9px JetBrains Mono, monospace';
    fillTruncatedText(interestCtx, path.id === 'teacher' ? 'Teacher insight' : path.id === 'evidence' ? 'Research metrics' : 'Learning evidence', insight.x + 9, insight.y + 14, insight.w - 18);
    interestCtx.fillStyle = muted;
    interestCtx.font = layout.compact ? '8px JetBrains Mono, monospace' : '8.5px JetBrains Mono, monospace';
    const metric = path.id === 'evidence' ? 'Retention · fairness' : path.id === 'teacher' ? 'Intervention queued' : `Mastery +${Math.round((mastery - concept.mastery) * 100)}%`;
    fillTruncatedText(interestCtx, metric, insight.x + 9, insight.y + 30, insight.w - 18);
    if (!layout.compact) {
      fillTruncatedText(interestCtx, 'Explainable next action', insight.x + 9, insight.y + 45, insight.w - 18);
    }

    layout.signalCards.forEach((card) => {
      const selected = card.id === educationInteraction.selectedSignal;
      const hovered = educationInteraction.hoverType === 'signal' && educationInteraction.hoverId === card.id;
      drawRoundedRect(interestCtx, card.x, card.y, card.w, card.h, 8);
      interestCtx.fillStyle = selected || hovered ? 'rgba(255,255,255,0.12)' : 'rgba(3, 7, 18, 0.52)';
      interestCtx.fill();
      interestCtx.strokeStyle = selected ? secondary : hovered ? primary : 'rgba(255,255,255,0.16)';
      interestCtx.lineWidth = selected || hovered ? 2 : 1;
      interestCtx.stroke();
      interestCtx.fillStyle = selected ? secondary : textColor;
      interestCtx.font = '9px JetBrains Mono, monospace';
      fillTruncatedText(interestCtx, layout.compact ? card.compact : card.label, card.x + 8, card.y + 14, card.w - 16);
    });

    const loop = layout.loop;
    educationLoop.forEach((step, index) => {
      const x = loop.x + (loop.w / Math.max(1, educationLoop.length - 1)) * index;
      const y = loop.y + loop.h / 2;
      if (index > 0) {
        const px = loop.x + (loop.w / Math.max(1, educationLoop.length - 1)) * (index - 1);
        interestCtx.beginPath();
        interestCtx.moveTo(px, y);
        interestCtx.lineTo(x, y);
        interestCtx.strokeStyle = index <= activeLoopIndex ? `rgba(255,255,255,0.34)` : 'rgba(255,255,255,0.12)';
        interestCtx.lineWidth = 2;
        interestCtx.stroke();
      }
      const active = index === activeLoopIndex;
      interestCtx.beginPath();
      interestCtx.arc(x, y, active ? 5.2 : 3.6, 0, Math.PI * 2);
      interestCtx.fillStyle = active ? secondary : index < activeLoopIndex ? primary : 'rgba(255,255,255,0.22)';
      interestCtx.fill();
      if (!layout.compact || index % 2 === 0) {
        interestCtx.fillStyle = active ? textColor : muted;
        interestCtx.font = layout.compact ? '7.5px JetBrains Mono, monospace' : '8px JetBrains Mono, monospace';
        interestCtx.textAlign = 'center';
        interestCtx.fillText(layout.compact ? step.compact : step.label, x, y - 8);
        interestCtx.textAlign = 'left';
      }
    });

    if (educationInteraction.active) {
      const pointerX = educationInteraction.x * width;
      const pointerY = educationInteraction.y * height;
      interestCtx.beginPath();
      interestCtx.arc(pointerX, pointerY, 14 + educationInteraction.pulse * 15, 0, Math.PI * 2);
      interestCtx.strokeStyle = `rgba(255,255,255,${educationInteraction.dragging ? 0.5 : 0.25})`;
      interestCtx.lineWidth = educationInteraction.dragging ? 2 : 1.1;
      interestCtx.stroke();
    }
  }
}

function updatePointCloudPointer(event) {
  const rect = interestCanvas.getBoundingClientRect();
  pointCloudInteraction.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  pointCloudInteraction.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  pointCloudInteraction.active = true;
  pointCloudInteraction.targetScrub = pointCloudInteraction.x;
  if (pointCloudInteraction.dragging) pointCloudInteraction.scrub = pointCloudInteraction.x;
}

function updateVprPointer(event) {
  const rect = interestCanvas.getBoundingClientRect();
  vprInteraction.targetRoute = clamp01((event.clientX - rect.left) / rect.width);
  vprInteraction.targetCondition = clamp01((event.clientY - rect.top) / rect.height);
  vprInteraction.active = true;
  if (vprInteraction.dragging) {
    vprInteraction.route = vprInteraction.targetRoute;
    vprInteraction.condition = vprInteraction.targetCondition;
  }
}

function updateAgentPointer(event) {
  const rect = interestCanvas.getBoundingClientRect();
  agentInteraction.x = clamp01((event.clientX - rect.left) / rect.width);
  agentInteraction.y = clamp01((event.clientY - rect.top) / rect.height);
  agentInteraction.active = true;
  const hit = agentHitRegion(event);
  agentInteraction.hoverType = hit?.type || null;
  agentInteraction.hoverId = hit?.type === 'task' ? hit.item.index : hit?.item.id || null;
}

function interactWithAgentRunner(event) {
  const hit = agentHitRegion(event);
  if (hit?.type === 'task') {
    agentInteraction.taskIndex = hit.item.index;
    agentInteraction.selectedStage = 'plan';
  } else if (hit?.type === 'human') {
    agentInteraction.selectedStage = 'request';
    agentInteraction.selectedTool = 'memory';
  } else if (hit?.type === 'ai') {
    agentInteraction.selectedStage = 'work';
    agentInteraction.selectedTool = 'rag';
  } else if (hit?.type === 'output') {
    agentInteraction.selectedStage = 'deliver';
    agentInteraction.selectedTool = 'eval';
  } else {
    agentInteraction.pulse = 0.35;
    agentInteraction.runBoost = 0.24;
    return;
  }
  agentInteraction.pulse = 1;
  agentInteraction.runBoost = 0.72;
}

function updateEducationPointer(event) {
  const rect = interestCanvas.getBoundingClientRect();
  educationInteraction.x = clamp01((event.clientX - rect.left) / rect.width);
  educationInteraction.y = clamp01((event.clientY - rect.top) / rect.height);
  educationInteraction.active = true;
  const hit = educationHitRegion(event);
  educationInteraction.hoverType = hit?.type || null;
  educationInteraction.hoverId = hit?.item.id || null;
}

function interactWithEducationStudio(event) {
  const hit = educationHitRegion(event);
  if (hit?.type === 'path') {
    educationInteraction.selectedPath = hit.item.id;
  } else if (hit?.type === 'concept') {
    educationInteraction.selectedConcept = hit.item.id;
  } else if (hit?.type === 'signal') {
    educationInteraction.selectedSignal = hit.item.id;
  } else if (hit?.type === 'learner') {
    educationInteraction.selectedPath = 'learner';
  } else if (hit?.type === 'practice') {
    educationInteraction.selectedPath = 'content';
  } else if (hit?.type === 'insight') {
    educationInteraction.selectedPath = educationInteraction.selectedPath === 'teacher' ? 'evidence' : 'teacher';
  } else if (hit?.type === 'robot' || hit?.type === 'board') {
    educationInteraction.selectedSignal = 'hint';
    educationInteraction.selectedPath = 'teacher';
  } else if (hit?.type === 'student') {
    educationInteraction.selectedSignal = 'incorrect';
    educationInteraction.selectedPath = 'learner';
  } else {
    educationInteraction.pulse = 0.3;
    educationInteraction.masteryBoost = 0.2;
    return;
  }
  educationInteraction.pulse = 1;
  educationInteraction.masteryBoost = 1;
}

function canvasCursorForActiveInterest() {
  if (isPointCloudInterestActive()) return pointCloudInteraction.dragging ? 'grabbing' : 'grab';
  if (isVprInterestActive()) return vprInteraction.dragging ? 'grabbing' : 'crosshair';
  if (isAgentInterestActive()) return agentInteraction.dragging ? 'grabbing' : 'pointer';
  if (isEducationInterestActive()) return educationInteraction.dragging ? 'grabbing' : 'pointer';
  return 'default';
}

interestCanvas.addEventListener('pointerenter', (event) => {
  if (isPointCloudInterestActive()) updatePointCloudPointer(event);
  else if (isVprInterestActive()) updateVprPointer(event);
  else if (isAgentInterestActive()) updateAgentPointer(event);
  else if (isEducationInterestActive()) updateEducationPointer(event);
});

interestCanvas.addEventListener('pointermove', (event) => {
  if (isPointCloudInterestActive()) updatePointCloudPointer(event);
  else if (isVprInterestActive()) updateVprPointer(event);
  else if (isAgentInterestActive()) updateAgentPointer(event);
  else if (isEducationInterestActive()) updateEducationPointer(event);
});

interestCanvas.addEventListener('pointerdown', (event) => {
  if (!isPointCloudInterestActive() && !isVprInterestActive() && !isAgentInterestActive() && !isEducationInterestActive()) return;
  event.preventDefault();
  if (isPointCloudInterestActive()) {
    pointCloudInteraction.dragging = true;
    updatePointCloudPointer(event);
    pointCloudInteraction.targetScrub = pointCloudInteraction.x;
  } else if (isVprInterestActive()) {
    vprInteraction.dragging = true;
    vprInteraction.selected = null;
    updateVprPointer(event);
  } else if (isAgentInterestActive()) {
    agentInteraction.dragging = true;
    updateAgentPointer(event);
    agentInteraction.pulse = 0.8;
    agentInteraction.runBoost = 0.52;
  } else {
    educationInteraction.dragging = true;
    updateEducationPointer(event);
    educationInteraction.pulse = 0.8;
    educationInteraction.masteryBoost = 0.6;
  }
  interestCanvas.style.cursor = 'grabbing';
  try {
    interestCanvas.setPointerCapture?.(event.pointerId);
  } catch {
    // Synthetic pointer events used by browser tests may not own capture.
  }
});

interestCanvas.addEventListener('pointerup', (event) => {
  if (!isPointCloudInterestActive() && !isVprInterestActive() && !isAgentInterestActive() && !isEducationInterestActive()) return;
  if (isPointCloudInterestActive()) {
    pointCloudInteraction.dragging = false;
    updatePointCloudPointer(event);
  } else if (isVprInterestActive()) {
    updateVprPointer(event);
    vprInteraction.selected = bestVprCandidate()?.id || null;
    vprInteraction.dragging = false;
  } else if (isAgentInterestActive()) {
    updateAgentPointer(event);
    interactWithAgentRunner(event);
    agentInteraction.dragging = false;
  } else {
    updateEducationPointer(event);
    interactWithEducationStudio(event);
    educationInteraction.dragging = false;
  }
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
  try {
    interestCanvas.releasePointerCapture?.(event.pointerId);
  } catch {
    // Synthetic pointer events used by browser tests may not own capture.
  }
});

interestCanvas.addEventListener('pointercancel', () => {
  pointCloudInteraction.dragging = false;
  pointCloudInteraction.active = false;
  vprInteraction.dragging = false;
  vprInteraction.active = false;
  agentInteraction.dragging = false;
  agentInteraction.active = false;
  agentInteraction.hoverType = null;
  agentInteraction.hoverId = null;
  educationInteraction.dragging = false;
  educationInteraction.active = false;
  educationInteraction.hoverType = null;
  educationInteraction.hoverId = null;
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
});

interestCanvas.addEventListener('pointerleave', () => {
  if (pointCloudInteraction.dragging || vprInteraction.dragging || agentInteraction.dragging || educationInteraction.dragging) return;
  pointCloudInteraction.active = false;
  vprInteraction.active = false;
  agentInteraction.active = false;
  agentInteraction.hoverType = null;
  agentInteraction.hoverId = null;
  educationInteraction.active = false;
  educationInteraction.hoverType = null;
  educationInteraction.hoverId = null;
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
});

function currentPublications() {
  const source = loadedPublications.length ? loadedPublications : [];
  const byTitle = new Map();
  [...staticPublications, ...source, ...fallbackPublications[currentLang]].forEach((item) => {
    byTitle.set(item.title, item);
  });
  return Array.from(byTitle.values());
}

function renderPublications(preserveScroll = false) {
  const beforeScroll = pubList.scrollTop;
  const items = currentPublications();
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
    return `
    <article class="pub-card ${highlightedPaper === item.title ? 'highlight' : ''}" data-paper-card="${escapeHtml(item.title)}">
      <div class="pub-meta">
        <span>${item.venue}</span>
        <span>${item.year}</span>
        <span class="pub-status">${item.status}</span>
      </div>
      <h4>${item.title}</h4>
      <div class="research-badges">${researchBadgesHtml(item, 'paper')}</div>
      <p class="muted">${item.summary}</p>
      <div class="repo-actions">
        <button class="btn btn-outline pub-detail" type="button" data-paper="${escapeHtml(item.title)}">${i18n[currentLang].view_details}</button>
        <button class="btn btn-outline pub-research" type="button" data-paper="${escapeHtml(item.title)}" ${primaryId ? '' : 'disabled'}>${i18n[currentLang].show_in_research}</button>
        <a class="btn btn-primary" href="${item.link}" target="_blank" rel="noreferrer">${i18n[currentLang].pub_open}</a>
      </div>
    </article>
  `;
  }).join('');

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

  if (preserveScroll) pubList.scrollTop = beforeScroll;
}

function mapOrcidWorks(payload) {
  const groups = Array.isArray(payload.group) ? payload.group : [];
  return groups
    .map((group) => {
      const summary = Array.isArray(group['work-summary']) ? group['work-summary'][0] : null;
      if (!summary) return null;
      const title = summary.title?.title?.value;
      if (!title) return null;

      const year = summary['publication-date']?.year?.value || '';
      const venue = summary['journal-title']?.value || 'ORCID Record';
      const status = currentLang === 'zh' ? '已发表' : 'Published';
      const summaryText = summary.type
        ? `Type: ${summary.type}`
        : (currentLang === 'zh' ? '来自 ORCID 公开记录。' : 'From ORCID public record.');
      const link = summary.url?.value
        || summary['external-ids']?.['external-id']?.[0]?.['external-id-url']?.value
        || './publications.md';

      return { title, venue, year, status, summary: summaryText, link, interests: inferInterestIds({ title, summary: summaryText, venue }) };
    })
    .filter(Boolean);
}

async function loadRepos() {
  const localByName = new Map(localRepos.map((repo) => [repo.name, repo]));
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_OWNER}/repos?per_page=100&sort=updated`, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remoteRepos = await response.json();
    const remoteNames = new Set(remoteRepos.map((repo) => repo.name));
    allRepos = [
      ...remoteRepos.map((repo) => {
        const local = localByName.get(repo.name);
        return {
          name: repo.name,
          description: repo.description || local?.description || '',
          language: repo.language || local?.language || null,
          stargazers_count: repo.stargazers_count ?? local?.stargazers_count ?? 0,
          updated_at: repo.updated_at || local?.updated_at || '',
          html_url: repo.html_url || local?.html_url || `https://github.com/${GITHUB_OWNER}/${repo.name}`,
          readme_url: local?.readme_url || `https://raw.githubusercontent.com/${GITHUB_OWNER}/${repo.name}/${repo.default_branch || 'main'}/README.md`,
          interests: local?.interests
        };
      }),
      ...localRepos.filter((repo) => !remoteNames.has(repo.name))
    ];
  } catch {
    allRepos = [...localRepos];
  }
  filteredRepos = [...allRepos];
  renderRepos(filteredRepos);
  renderResearchInterest();
}

async function loadPublications() {
  pubList.innerHTML = `<p class="muted">${i18n[currentLang].pub_loading}</p>`;
  try {
    const response = await fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/works`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    loadedPublications = mapOrcidWorks(payload);
    renderPublications();
    renderResearchInterest();
  } catch {
    loadedPublications = [];
    renderPublications();
    renderResearchInterest();
    pubList.insertAdjacentHTML('afterbegin', `<p class="muted">${i18n[currentLang].pub_load_fail}</p>`);
  }
}

repoSearch.addEventListener('input', applyRepoFilter);
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

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function generateRegistrationPoints() {
  const random = seededRandom(registrationState.seed);
  registrationState.points = Array.from({ length: 42 }, (_, index) => {
    const angle = index * 0.52;
    const ring = 0.12 + (index % 9) * 0.035;
    return {
      x: Math.cos(angle) * ring + (random() - 0.5) * 0.06,
      y: Math.sin(angle) * ring + (random() - 0.5) * 0.06,
      keep: random()
    };
  });
}

function registrationParams() {
  return {
    noise: Number(noiseRange?.value ?? 12),
    missing: Number(missingRange?.value ?? 18),
    rotation: Number(rotationRange?.value ?? 34)
  };
}

function updateRegistrationLabels() {
  if (!noiseValue || !missingValue || !rotationValue) return;
  const params = registrationParams();
  noiseValue.textContent = String(params.noise);
  missingValue.textContent = `${params.missing}%`;
  rotationValue.textContent = `${params.rotation}°`;
}

function transformPoint(point, index, params) {
  const angle = (params.rotation * Math.PI) / 180;
  const random = seededRandom(registrationState.seed + index * 97);
  const noise = params.noise / 360;
  const nx = (random() - 0.5) * noise;
  const ny = (random() - 0.5) * noise;
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle) + 0.12 + nx,
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle) - 0.08 + ny,
    visible: point.keep > params.missing / 100
  };
}

function drawRegistrationDemo() {
  if (!registrationCanvas || !regCtx) return;
  const { width, height } = resizeDrawingCanvas(registrationCanvas, regCtx);
  const params = registrationParams();
  const progress = registrationState.progress;
  const scale = Math.min(width, height) * 0.92;
  const originX = width / 2;
  const originY = height / 2;

  regCtx.clearRect(0, 0, width, height);
  regCtx.fillStyle = 'rgba(3, 7, 18, 0.45)';
  regCtx.fillRect(0, 0, width, height);

  regCtx.strokeStyle = 'rgba(0, 245, 255, 0.14)';
  regCtx.lineWidth = 1;
  for (let x = 28; x < width; x += 32) {
    regCtx.beginPath();
    regCtx.moveTo(x, 0);
    regCtx.lineTo(x, height);
    regCtx.stroke();
  }
  for (let y = 24; y < height; y += 32) {
    regCtx.beginPath();
    regCtx.moveTo(0, y);
    regCtx.lineTo(width, y);
    regCtx.stroke();
  }

  const toCanvas = (point) => ({
    x: originX + point.x * scale,
    y: originY + point.y * scale
  });

  registrationState.points.forEach((point, index) => {
    const source = toCanvas(point);
    const targetRaw = transformPoint(point, index, params);
    if (!targetRaw.visible) return;
    const aligned = {
      x: targetRaw.x + (point.x - targetRaw.x) * progress,
      y: targetRaw.y + (point.y - targetRaw.y) * progress
    };
    const target = toCanvas(aligned);

    regCtx.strokeStyle = `rgba(232, 240, 255, ${0.08 + progress * 0.22})`;
    regCtx.beginPath();
    regCtx.moveTo(source.x, source.y);
    regCtx.lineTo(target.x, target.y);
    regCtx.stroke();

    regCtx.beginPath();
    regCtx.arc(source.x, source.y, 3.2, 0, Math.PI * 2);
    regCtx.fillStyle = 'rgba(0, 245, 255, 0.88)';
    regCtx.fill();

    regCtx.beginPath();
    regCtx.arc(target.x, target.y, 4.5, 0, Math.PI * 2);
    regCtx.fillStyle = 'rgba(255, 46, 136, 0.9)';
    regCtx.fill();
  });

  const quality = Math.max(0, 1 - params.noise / 72 - params.missing / 120);
  if (labScore) labScore.textContent = (progress * Math.max(0.16, quality)).toFixed(2);
}

function runAlignmentDemo() {
  if (!registrationCanvas || !regCtx) return;
  cancelAnimationFrame(registrationState.animationFrame);
  const start = performance.now();
  const from = registrationState.progress;
  const duration = 1100;

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    registrationState.progress = from + (1 - from) * eased;
    drawRegistrationDemo();
    if (t < 1) registrationState.animationFrame = requestAnimationFrame(frame);
  }

  registrationState.animationFrame = requestAnimationFrame(frame);
}

function resetRegistrationDemo() {
  cancelAnimationFrame(registrationState.animationFrame);
  registrationState.seed += 11;
  registrationState.progress = 0;
  generateRegistrationPoints();
  updateRegistrationLabels();
  drawRegistrationDemo();
}

[noiseRange, missingRange, rotationRange].filter(Boolean).forEach((input) => {
  input.addEventListener('input', () => {
    registrationState.progress = 0;
    updateRegistrationLabels();
    drawRegistrationDemo();
  });
});
alignDemo?.addEventListener('click', runAlignmentDemo);
resetDemo?.addEventListener('click', resetRegistrationDemo);

let statusIndex = 0;
let charIndex = 0;
let deleting = false;
let typeTimer = null;

function typeLoop() {
  const statuses = i18n[currentLang].statuses;
  const current = statuses[statusIndex % statuses.length];
  if (!deleting) {
    charIndex += 1;
    typeTarget.textContent = current.slice(0, charIndex);
    if (charIndex >= current.length) {
      deleting = true;
      typeTimer = setTimeout(typeLoop, 1200);
      return;
    }
  } else {
    charIndex -= 1;
    typeTarget.textContent = current.slice(0, Math.max(charIndex, 0));
    if (charIndex <= 0) {
      deleting = false;
      statusIndex = (statusIndex + 1) % statuses.length;
    }
  }
  typeTimer = setTimeout(typeLoop, deleting ? 35 : 60);
}

function restartTypeLoop() {
  clearTimeout(typeTimer);
  statusIndex = 0;
  charIndex = 0;
  deleting = false;
  typeTarget.textContent = '';
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
  document.querySelectorAll('[data-i18n="hero_subtitle_html"]').forEach((node) => {
    node.innerHTML = i18n[currentLang].hero_subtitle_html;
  });

  langToggle.textContent = i18n[currentLang].lang_btn;
  modalClose.textContent = i18n[currentLang].modal_close;
  if (!hoveredRepo) repoMapHint.textContent = i18n[currentLang].repo_map_hint;
  renderRepos(filteredRepos);
  renderPublications();
  renderResearchInterest();
  updateRegistrationLabels();
  drawRegistrationDemo();
  if (commandPalette.classList.contains('open')) renderCommandList();
}

langToggle.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  applyTranslations();
  restartTypeLoop();
});

function isEditableTarget(target) {
  const tag = target.tagName;
  return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (commandPalette.classList.contains('open')) closeCommandPalette();
    else openCommandPalette();
    return;
  }
  if (event.key === 'Escape') {
    if (commandPalette.classList.contains('open')) closeCommandPalette();
    else if (researchManager.classList.contains('open')) closeResearchManager();
    else if (modal.classList.contains('open')) closeModal();
    return;
  }
  if (isEditableTarget(event.target)) return;
  if (event.key === 'p' || event.key === 'P') activateView('projects');
  if (event.key === 'r' || event.key === 'R') activateView('research');
  if (event.key === 'l' || event.key === 'L') langToggle.click();
  if (event.key === '/') {
    event.preventDefault();
    activateView('projects');
    repoSearch.focus();
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

function shouldAnimateInterest(timestamp) {
  return shouldRunMotion()
    && document.getElementById('research')?.classList.contains('active')
    && timestamp - lastInterestFrame >= INTEREST_FRAME_SKIP * 16;
}

function shouldAnimateRepoMap(timestamp) {
  return shouldRunMotion()
    && document.getElementById('projects')?.classList.contains('active')
    && timestamp - lastRepoMapFrame >= REPO_MAP_FRAME_SKIP * 16;
}

function drawStars(timestamp = 0) {
  if (!shouldRunMotion()) {
    requestAnimationFrame(drawStars);
    return;
  }
  if (timestamp - lastStarfieldFrame < STARFIELD_FRAME_SKIP * 16) {
    requestAnimationFrame(drawStars);
    return;
  }
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
  requestAnimationFrame(drawStars);
}

function animateInterestCanvas(timestamp = 0) {
  if (shouldAnimateInterest(timestamp)) {
    interestTick += 1;
    lastInterestFrame = timestamp;
    drawInterestAnimation();
  }
  if (shouldAnimateHeroPreview(timestamp)) {
    heroPreviewTick += 1;
    lastHeroPreviewFrame = timestamp;
    drawHeroPreviewCanvas();
  }
  requestAnimationFrame(animateInterestCanvas);
}

function animateRepoMap(timestamp = 0) {
  if (shouldAnimateRepoMap(timestamp)) {
    repoMapTick += 1;
    lastRepoMapFrame = timestamp;
    renderRepoMap(filteredRepos);
  }
  requestAnimationFrame(animateRepoMap);
}

generateRegistrationPoints();
initCustomCursor();
updateRegistrationLabels();
applyTheme(currentTheme);
applyTranslations();
restartTypeLoop();
loadRepos();
loadPublications();
loadRemoteResearchConfig();
if ('IntersectionObserver' in window && heroPreviewCanvas) {
  const heroPreviewObserver = new IntersectionObserver(([entry]) => {
    heroPreviewVisible = Boolean(entry?.isIntersecting);
    if (heroPreviewVisible) drawHeroPreviewCanvas();
  }, { threshold: 0.08 });
  heroPreviewObserver.observe(heroPreviewCanvas);
}
reducedMotionQuery.addEventListener?.('change', () => {
  drawHeroPreviewCanvas();
  if (isResearchViewActive()) drawInterestAnimation();
  if (isProjectsViewActive()) renderRepoMap(filteredRepos);
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastHeroPreviewFrame = 0;
    lastStarfieldFrame = 0;
    lastInterestFrame = 0;
    lastRepoMapFrame = 0;
  }
});
window.addEventListener('resize', () => {
  resizeCanvas();
  drawRegistrationDemo();
  if (isProjectsViewActive()) renderRepoMap(filteredRepos);
  if (isResearchViewActive()) drawInterestAnimation();
  drawHeroPreviewCanvas();
});
resizeCanvas();
drawRegistrationDemo();
renderResearchInterest();
drawStars();
animateInterestCanvas();
animateRepoMap();
