const views = document.querySelectorAll('.view');
const commands = document.querySelectorAll('.cmd');
const chips = document.querySelectorAll('.chip');
const chipOutput = document.getElementById('chipOutput');
const typeTarget = document.getElementById('typeTarget');
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
const managerActive = document.getElementById('managerActive');
const managerProjects = document.getElementById('managerProjects');
const managerPapers = document.getElementById('managerPapers');
const commandPalette = document.getElementById('commandPalette');
const commandInput = document.getElementById('commandInput');
const commandList = document.getElementById('commandList');

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
let hoveredRepo = null;
let activeInterestId = 'point-cloud-registration';
let interestTick = 0;

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

const ORCID_ID = '0009-0005-6139-4327';

const registrationState = {
  points: [],
  target: [],
  progress: 0,
  seed: 7,
  animationFrame: null
};

function initCustomCursor() {
  if (!customCursor || !window.matchMedia('(pointer: fine)').matches) return;

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
    interests: ['vpr', 'point-cloud-registration']
  },
  {
    name: 'wcx12',
    description: 'Interactive GitHub profile and research homepage.',
    language: 'JavaScript',
    stargazers_count: 2,
    updated_at: '2026-05-16T15:56:07Z',
    html_url: 'https://github.com/wcx12/wcx12',
    readme_url: 'https://raw.githubusercontent.com/wcx12/wcx12/main/README.md',
    interests: ['agent', 'ai4edu']
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
const OWNER_TOOLS_KEY = 'wcx12-owner-tools';

function detectOwnerTools() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('ownerTools') === '1') localStorage.setItem(OWNER_TOOLS_KEY, 'enabled');
  if (params.get('ownerTools') === '0') localStorage.removeItem(OWNER_TOOLS_KEY);
  return localStorage.getItem(OWNER_TOOLS_KEY) === 'enabled';
}

const ownerToolsEnabled = detectOwnerTools();

function defaultAssignments(kind) {
  const source = kind === 'repo' ? localRepos : staticPublications;
  return Object.fromEntries(source.map((item) => [item.name || item.title, item.interests || []]));
}

function loadResearchConfig() {
  if (!ownerToolsEnabled) {
    return {
      interests: researchInterests,
      repoAssignments: defaultAssignments('repo'),
      paperAssignments: defaultAssignments('paper')
    };
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
    return {
      interests: Array.isArray(parsed.interests) ? parsed.interests : researchInterests,
      repoAssignments: parsed.repoAssignments || defaultAssignments('repo'),
      paperAssignments: parsed.paperAssignments || defaultAssignments('paper')
    };
  } catch {
    return {
      interests: researchInterests,
      repoAssignments: defaultAssignments('repo'),
      paperAssignments: defaultAssignments('paper')
    };
  }
}

let researchConfig = loadResearchConfig();
researchInterests = researchConfig.interests;

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
    manager_save: 'Save Mapping',
    manager_delete: 'Delete Category',
    manager_projects: 'Projects',
    manager_papers: 'Papers',
    manager_saved: 'Saved.',
    readme_loading: 'Loading README...',
    readme_unavailable: 'README is unavailable right now.',
    open_external: 'Open Link',
    project_title: 'Repositories',
    project_desc: 'All public repositories are listed below with quick jump links.',
    repo_map_title: 'Repo Constellation',
    repo_map_hint: 'Hover nodes to inspect projects.',
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
    res_title: 'Publications & Resume',
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
    manager_save: '保存映射',
    manager_delete: '删除分类',
    manager_projects: '项目',
    manager_papers: '论文',
    manager_saved: '已保存。',
    readme_loading: '正在加载 README...',
    readme_unavailable: '当前无法加载 README。',
    open_external: '打开链接',
    project_title: '仓库列表',
    project_desc: '这里列出全部公开仓库，可直接跳转到对应项目。',
    repo_map_title: '仓库星图',
    repo_map_hint: '悬停节点查看项目。',
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
    res_title: '论文与简历',
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
  if (targetView && ['projects', 'research'].includes(viewId)) {
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

  const repoItems = allRepos.map((repo) => ({
    title: repo.name,
    detail: repo.description || i18n[currentLang].no_desc,
    type: i18n[currentLang].command_repo,
    action: () => openRepoDetail(repo.name)
  }));

  return [...utilityItems, ...viewItems, ...repoItems];
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
      <span><strong>${item.title}</strong><span>${item.detail}</span></span>
      <span class="command-shortcut">${item.type}</span>
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
  if (hay.includes('vpr') || hay.includes('visual place') || hay.includes('localization')) matches.push('vpr');
  if (hay.includes('point') || hay.includes('cloud') || hay.includes('registration') || hay.includes('geometry')) matches.push('point-cloud-registration');
  if (hay.includes('agent') || hay.includes('llm') || hay.includes('codex') || hay.includes('rag')) matches.push('agent');
  if (hay.includes('education') || hay.includes('learning') || hay.includes('math') || hay.includes('数学') || hay.includes('classroom')) matches.push('ai4edu');
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

function relatedRepos() {
  return allRepos.filter((repo) => assignedInterestIds(repo, 'repo').includes(activeInterestId));
}

function relatedPapers() {
  return currentPublications().filter((paper) => assignedInterestIds(paper, 'paper').includes(activeInterestId));
}

function renderRelatedList(container, items, emptyText, kind) {
  if (!items.length) {
    container.innerHTML = `<p class="muted">${emptyText}</p>`;
    return;
  }

  container.innerHTML = items.slice(0, 4).map((item) => {
    const title = item.name || item.title;
    const url = item.html_url || item.link;
    const detail = item.description || item.summary || item.language || item.venue || '';
    const meta = kind === 'repo'
      ? `${item.language || i18n[currentLang].mixed} · ${i18n[currentLang].star} ${item.stargazers_count || 0}`
      : `${item.venue || ''} · ${item.year || ''}`;
    return `
      <div class="related-item">
        <button class="related-link" type="button" data-kind="${kind}" data-key="${title}">${title}</button>
        <p class="muted">${detail}</p>
        <p class="muted">${meta}</p>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.related-link').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.kind === 'repo') openRepoReadme(button.dataset.key);
      else openPaperDetail(button.dataset.key);
    });
  });
}

function renderResearchInterest() {
  const entry = activeInterestEntry();
  if (!entry) {
    interestRail.innerHTML = '';
    interestPath.textContent = '';
    interestTitle.textContent = '';
    interestTag.textContent = '';
    interestDescription.textContent = '';
    interestProjects.innerHTML = `<p class="muted">${i18n[currentLang].no_related_projects}</p>`;
    interestPapers.innerHTML = `<p class="muted">${i18n[currentLang].no_related_papers}</p>`;
    return;
  }
  interestPath.textContent = `${textFor(entry.domain.title)} / ${textFor(entry.child.title)}`;
  interestTitle.textContent = textFor(entry.child.title);
  interestTag.textContent = textFor(entry.child.label);
  interestDescription.textContent = textFor(entry.child.description);
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
  renderInterestRail();
  renderRelatedList(interestProjects, relatedRepos(), i18n[currentLang].no_related_projects, 'repo');
  renderRelatedList(interestPapers, relatedPapers(), i18n[currentLang].no_related_papers, 'paper');
  drawInterestAnimation();
}

function applyTheme(theme) {
  currentTheme = ['neon', 'warm', 'mono'].includes(theme) ? theme : 'neon';
  document.documentElement.dataset.theme = currentTheme;
  themeSelect.value = currentTheme;
  localStorage.setItem('wcx12-theme', currentTheme);
  drawRegistrationDemo();
  renderRepoMap(filteredRepos);
  drawInterestAnimation();
}

themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));

function openResearchManager() {
  if (!ownerToolsEnabled) return;
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

function saveManagerAssignments() {
  if (!ownerToolsEnabled) return;
  managerProjects.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    setAssignment('repo', input.value, activeInterestId, input.checked);
  });
  managerPapers.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    setAssignment('paper', input.value, activeInterestId, input.checked);
  });
  saveResearchConfig();
  renderResearchInterest();
  renderResearchManager();
  managerActive.textContent = `${i18n[currentLang].manager_saved} ${managerActive.textContent}`;
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
  openModal({
    title: repo.name,
    html: `<p class="muted">${i18n[currentLang].readme_loading}</p>`,
    linkText: i18n[currentLang].details_project_link_text,
    link: repo.html_url
  });

  try {
    const response = await fetch(repo.readme_url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    modalBody.innerHTML = `<div class="readme-box readme-content"><p class="muted">${repo.description || i18n[currentLang].no_desc}</p>${markdownToHtml(markdown)}</div>`;
  } catch {
    modalBody.innerHTML = `<div class="readme-box"><p class="muted">${repo.description || i18n[currentLang].no_desc}</p><p>${i18n[currentLang].readme_unavailable}</p></div>`;
  }
}

function openPaperDetail(title) {
  const paper = currentPublications().find((item) => item.title === title);
  if (!paper) return;
  openModal({
    title: paper.title,
    html: `<div class="readme-box"><p class="muted">${paper.venue || ''} · ${paper.year || ''}</p><p>${paper.summary || ''}</p></div>`,
    linkText: i18n[currentLang].open_external,
    link: paper.link
  });
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
    renderRepoMap(items);
    return;
  }

  repoGrid.innerHTML = shown.map((repo) => `
    <article class="repo-card" data-repo="${repo.name}">
      <h3><a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a></h3>
      <p class="muted">${repo.description || i18n[currentLang].no_desc}</p>
      <div class="repo-meta">
        <span>${i18n[currentLang].star} ${repo.stargazers_count}</span>
        <span>${repo.language || i18n[currentLang].mixed}</span>
      </div>
      <div class="repo-actions">
        <button class="btn btn-outline repo-detail" type="button" data-repo="${repo.name}">${i18n[currentLang].view_details}</button>
        <a class="btn btn-primary" href="${repo.html_url}" target="_blank" rel="noreferrer">${i18n[currentLang].open_repo}</a>
      </div>
    </article>
  `).join('');

  if (repoState.mode === 'infinite' && shown.length < total) {
    repoGrid.insertAdjacentHTML('beforeend', `<p class="muted">${i18n[currentLang].infinite_hint}</p>`);
  }

  document.querySelectorAll('.repo-detail').forEach((btn) => {
    btn.addEventListener('click', () => openRepoDetail(btn.dataset.repo));
  });

  renderRepoMap(items);
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

function renderRepoMap(repos = filteredRepos) {
  const { width, height } = resizeDrawingCanvas(repoMap, repoMapCtx);
  repoMapCtx.clearRect(0, 0, width, height);

  const items = sortedRepos(repos);
  repoNodes = [];

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

  if (!items.length) {
    repoMapCtx.fillStyle = 'rgba(232, 240, 255, 0.72)';
    repoMapCtx.font = '14px JetBrains Mono, monospace';
    repoMapCtx.fillText(i18n[currentLang].no_repos, 22, 42);
    return;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = Math.max(80, width * 0.38);
  const radiusY = Math.max(56, height * 0.34);

  items.forEach((repo, index) => {
    const angle = (Math.PI * 2 * index) / items.length - Math.PI / 2;
    const languageOffset = (repo.language || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 34;
    const x = centerX + Math.cos(angle) * (radiusX - languageOffset);
    const y = centerY + Math.sin(angle) * (radiusY + languageOffset * 0.45);
    const size = 8 + Math.min(10, repo.stargazers_count * 3) + Math.min(6, repo.name.length / 7);
    repoNodes.push({ repo, x, y, r: size, color: repoColor(repo.language) });
  });

  repoMapCtx.lineWidth = 1;
  repoNodes.forEach((node, index) => {
    const next = repoNodes[(index + 1) % repoNodes.length];
    const sameLanguage = next && next.repo.language === node.repo.language;
    repoMapCtx.strokeStyle = sameLanguage ? `${node.color}66` : 'rgba(155, 92, 255, 0.18)';
    repoMapCtx.beginPath();
    repoMapCtx.moveTo(node.x, node.y);
    repoMapCtx.lineTo(next.x, next.y);
    repoMapCtx.stroke();
  });

  repoNodes.forEach((node) => {
    const active = hoveredRepo === node.repo.name;
    repoMapCtx.beginPath();
    repoMapCtx.arc(node.x, node.y, active ? node.r + 5 : node.r + 2, 0, Math.PI * 2);
    repoMapCtx.fillStyle = active ? `${node.color}33` : 'rgba(0, 245, 255, 0.07)';
    repoMapCtx.fill();

    repoMapCtx.beginPath();
    repoMapCtx.arc(node.x, node.y, active ? node.r : node.r * 0.72, 0, Math.PI * 2);
    repoMapCtx.fillStyle = node.color;
    repoMapCtx.fill();

    if (active) {
      repoMapCtx.fillStyle = 'rgba(232, 240, 255, 0.95)';
      repoMapCtx.font = '12px JetBrains Mono, monospace';
      repoMapCtx.fillText(node.repo.name, Math.min(node.x + 14, width - 180), Math.max(node.y - 12, 20));
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
  hoveredRepo = hit ? hit.repo.name : null;
  repoMap.style.cursor = hit ? 'pointer' : 'default';
  repoMapHint.textContent = hit
    ? `${hit.repo.name} · ${hit.repo.language || i18n[currentLang].mixed} · ${i18n[currentLang].star} ${hit.repo.stargazers_count}`
    : i18n[currentLang].repo_map_hint;
  renderRepoMap(filteredRepos);
});

repoMap.addEventListener('mouseleave', () => {
  hoveredRepo = null;
  repoMapHint.textContent = i18n[currentLang].repo_map_hint;
  renderRepoMap(filteredRepos);
});

repoMap.addEventListener('click', (event) => {
  const pointer = repoMapPointer(event);
  const hit = repoNodes.find((node) => Math.hypot(pointer.x - node.x, pointer.y - node.y) <= node.r + 8);
  if (hit) openRepoDetail(hit.repo.name);
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

function drawInterestAnimation() {
  const { width, height } = resizeDrawingCanvas(interestCanvas, interestCtx);
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
    const nodes = [
      ['query', 0.14, 0.5],
      ['plan', 0.34, 0.32],
      ['tool', 0.56, 0.5],
      ['eval', 0.76, 0.32],
      ['answer', 0.88, 0.62]
    ];
    nodes.forEach((node, index) => {
      const x = width * node[1];
      const y = height * node[2];
      if (index > 0) {
        const prev = nodes[index - 1];
        interestCtx.beginPath();
        interestCtx.moveTo(width * prev[1], height * prev[2]);
        interestCtx.lineTo(x, y);
        interestCtx.strokeStyle = 'rgba(255,255,255,0.24)';
        interestCtx.stroke();
      }
      const active = Math.floor(t * 1.4) % nodes.length === index;
      interestCtx.beginPath();
      interestCtx.arc(x, y, active ? 24 : 18, 0, Math.PI * 2);
      interestCtx.fillStyle = active ? secondary : primary;
      interestCtx.fill();
      interestCtx.fillStyle = '#050505';
      interestCtx.font = '11px JetBrains Mono, monospace';
      interestCtx.textAlign = 'center';
      interestCtx.fillText(node[0], x, y + 4);
      interestCtx.textAlign = 'left';
    });
  } else {
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const nodes = [
      ['student', -0.28, -0.08],
      ['practice', -0.06, -0.28],
      ['feedback', 0.18, -0.04],
      ['teacher', 0.02, 0.24],
      ['profile', -0.2, 0.22]
    ];
    nodes.forEach((node, index) => {
      const x = centerX + node[1] * width;
      const y = centerY + node[2] * height;
      interestCtx.beginPath();
      interestCtx.moveTo(centerX, centerY);
      interestCtx.lineTo(x, y);
      interestCtx.strokeStyle = 'rgba(255,255,255,0.2)';
      interestCtx.stroke();
      interestCtx.beginPath();
      interestCtx.arc(x, y, 16 + Math.sin(t + index) * 3, 0, Math.PI * 2);
      interestCtx.fillStyle = index % 2 ? primary : secondary;
      interestCtx.fill();
      interestCtx.fillStyle = muted;
      interestCtx.font = '11px JetBrains Mono, monospace';
      interestCtx.fillText(node[0], x + 20, y + 4);
    });
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

function canvasCursorForActiveInterest() {
  if (isPointCloudInterestActive()) return pointCloudInteraction.dragging ? 'grabbing' : 'grab';
  if (isVprInterestActive()) return vprInteraction.dragging ? 'grabbing' : 'crosshair';
  return 'default';
}

interestCanvas.addEventListener('pointerenter', (event) => {
  if (isPointCloudInterestActive()) updatePointCloudPointer(event);
  else if (isVprInterestActive()) updateVprPointer(event);
});

interestCanvas.addEventListener('pointermove', (event) => {
  if (isPointCloudInterestActive()) updatePointCloudPointer(event);
  else if (isVprInterestActive()) updateVprPointer(event);
});

interestCanvas.addEventListener('pointerdown', (event) => {
  if (!isPointCloudInterestActive() && !isVprInterestActive()) return;
  event.preventDefault();
  if (isPointCloudInterestActive()) {
    pointCloudInteraction.dragging = true;
    updatePointCloudPointer(event);
    pointCloudInteraction.targetScrub = pointCloudInteraction.x;
  } else {
    vprInteraction.dragging = true;
    vprInteraction.selected = null;
    updateVprPointer(event);
  }
  interestCanvas.style.cursor = 'grabbing';
  try {
    interestCanvas.setPointerCapture?.(event.pointerId);
  } catch {
    // Synthetic pointer events used by browser tests may not own capture.
  }
});

interestCanvas.addEventListener('pointerup', (event) => {
  if (!isPointCloudInterestActive() && !isVprInterestActive()) return;
  if (isPointCloudInterestActive()) {
    pointCloudInteraction.dragging = false;
    updatePointCloudPointer(event);
  } else {
    updateVprPointer(event);
    vprInteraction.selected = bestVprCandidate()?.id || null;
    vprInteraction.dragging = false;
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
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
});

interestCanvas.addEventListener('pointerleave', () => {
  if (pointCloudInteraction.dragging || vprInteraction.dragging) return;
  pointCloudInteraction.active = false;
  vprInteraction.active = false;
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

  pubList.innerHTML = shown.map((item) => `
    <article class="pub-card">
      <div class="pub-meta">
        <span>${item.venue}</span>
        <span>${item.year}</span>
        <span class="pub-status">${item.status}</span>
      </div>
      <h4>${item.title}</h4>
      <p class="muted">${item.summary}</p>
      <a class="btn btn-outline" href="${item.link}" target="_blank" rel="noreferrer">${i18n[currentLang].pub_open}</a>
    </article>
  `).join('');

  if (pubState.mode === 'infinite' && shown.length < total) {
    pubList.insertAdjacentHTML('beforeend', `<p class="muted">${i18n[currentLang].infinite_hint}</p>`);
  }

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
  allRepos = [...localRepos];
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
  stars = Array.from({ length: Math.min(140, Math.floor(window.innerWidth / 10)) }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * 1.5 + 0.4,
    r: Math.random() * 1.4 + 0.2
  }));
}

function drawStars() {
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

function animateInterestCanvas() {
  interestTick += 1;
  if (document.getElementById('research')?.classList.contains('active')) drawInterestAnimation();
  requestAnimationFrame(animateInterestCanvas);
}

generateRegistrationPoints();
initCustomCursor();
updateRegistrationLabels();
applyTheme(currentTheme);
applyTranslations();
restartTypeLoop();
loadRepos();
loadPublications();
window.addEventListener('resize', () => {
  resizeCanvas();
  drawRegistrationDemo();
  renderRepoMap(filteredRepos);
  drawInterestAnimation();
});
resizeCanvas();
drawRegistrationDemo();
renderRepoMap(filteredRepos);
renderResearchInterest();
drawStars();
animateInterestCanvas();
