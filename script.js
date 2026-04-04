const views = document.querySelectorAll('.view');
const commands = document.querySelectorAll('.cmd');
const chips = document.querySelectorAll('.chip');
const chipOutput = document.getElementById('chipOutput');
const typeTarget = document.getElementById('typeTarget');
const repoGrid = document.getElementById('repoGrid');
const langToggle = document.getElementById('langToggle');
const modal = document.getElementById('detailModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalLink = document.getElementById('modalLink');
const modalClose = document.getElementById('modalClose');

let currentLang = 'en';
let featuredRepos = [];

const i18n = {
  en: {
    hero_kicker: 'Machine Learning Researcher',
    hero_hi: 'Hi, I am',
    hero_status: 'Status',
    hero_subtitle_html: 'Point Set Registration + Anomaly Detection.<br />Building clean pipelines and practical open-source tools.',
    btn_contact: 'Contact Me',
    btn_repos: 'My Repos',
    stat_focus: 'Focus Areas',
    stat_grad: 'Graduation',
    stat_stack: 'Main Stack',
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
    research_title: 'Research Focus',
    research_1: 'Point set registration under noisy and incomplete observations',
    research_2: 'Anomaly detection for complex and high-dimensional signals',
    research_3: 'Robust ML pipelines and reproducible experiments',
    view_details: 'View Details',
    project_title: 'Featured Repositories',
    project_desc: 'Auto-loaded from my public GitHub repositories.',
    timeline_title: 'Timeline',
    timeline_2024: 'Focused on strengthening ML engineering foundations and reproducible workflows.',
    timeline_2025: 'Deepening research on point set registration and anomaly signal analysis.',
    timeline_2026: 'Graduation year and active applications for Master\'s / PhD opportunities.',
    skill_title: 'Skill Matrix',
    skill_hint: 'Click a skill chip to highlight what I use.',
    res_title: 'Publications & Resume',
    pub_title: 'Publications',
    pub_desc: 'A living list for papers, reports, and technical notes.',
    pub_open: 'Open Publication List',
    cv_title: 'Resume',
    cv_desc: 'Download my latest CV snapshot from this repository.',
    cv_download: 'Download Resume',
    contact_title: 'Contact',
    contact_last: 'Open to research collaboration and open-source building.',
    footer: '© 2026 wcx12 · Neon Full Interactive Profile',
    loading_repos: 'Loading repositories...',
    no_repos: 'No public repositories found yet.',
    load_fail: 'Unable to load repositories right now.',
    no_desc: 'No description yet.',
    star: 'Stars',
    mixed: 'Mixed',
    details_research_title: 'Research Details',
    details_research_body: 'I focus on robust geometric matching and anomaly signal understanding. The current work emphasizes reproducibility, clean benchmarks, and engineering-ready implementations.',
    details_research_link_text: 'Open Research Tab',
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
    hero_kicker: '机器学习研究者',
    hero_hi: '你好，我是',
    hero_status: '状态',
    hero_subtitle_html: '点集配准 + 异常检测。<br />专注于可复现、可落地的机器学习工程。',
    btn_contact: '联系我',
    btn_repos: '我的仓库',
    stat_focus: '研究方向',
    stat_grad: '毕业时间',
    stat_stack: '主要技术栈',
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
    research_title: '研究重点',
    research_1: '在噪声和缺失观测下的点集配准',
    research_2: '复杂高维信号中的异常检测',
    research_3: '稳健的机器学习流水线与可复现实验',
    view_details: '查看详情',
    project_title: '精选仓库',
    project_desc: '自动读取我的公开 GitHub 仓库。',
    timeline_title: '时间线',
    timeline_2024: '强化机器学习工程基础与可复现实验流程。',
    timeline_2025: '深入开展点集配准与异常信号分析研究。',
    timeline_2026: '毕业年份，同时积极申请硕士/博士机会。',
    skill_title: '技能矩阵',
    skill_hint: '点击技能标签可查看当前使用说明。',
    res_title: '论文与简历',
    pub_title: '论文列表',
    pub_desc: '持续更新论文、技术报告与研究笔记。',
    pub_open: '打开论文列表',
    cv_title: '简历',
    cv_desc: '从此仓库下载我的最新简历快照。',
    cv_download: '下载简历',
    contact_title: '联系方式',
    contact_last: '欢迎研究合作与开源协作。',
    footer: '© 2026 wcx12 · Neon 交互主页',
    loading_repos: '正在加载仓库...',
    no_repos: '暂时没有可展示的公开仓库。',
    load_fail: '当前无法加载仓库，请稍后重试。',
    no_desc: '暂无描述。',
    star: '星标',
    mixed: '混合',
    details_research_title: '研究详情',
    details_research_body: '我当前聚焦于稳健几何匹配和异常信号理解，强调可复现基准、清晰实验设计以及可工程落地的实现。',
    details_research_link_text: '打开研究页签',
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

commands.forEach((btn) => {
  btn.addEventListener('click', () => {
    commands.forEach((c) => c.classList.remove('active'));
    views.forEach((v) => v.classList.remove('active'));
    btn.classList.add('active');
    const selected = document.getElementById(btn.dataset.view);
    if (selected) selected.classList.add('active');
  });
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    const template = i18n[currentLang].chip_loaded;
    chipOutput.textContent = template.replace('{tag}', chip.dataset.tag);
  });
});

function applyTranslations() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    const value = i18n[currentLang][key];
    if (typeof value !== 'string') return;
    if (key.endsWith('_html')) {
      node.innerHTML = value;
    } else {
      node.textContent = value;
    }
  });
  langToggle.textContent = i18n[currentLang].lang_btn;
  modalClose.textContent = i18n[currentLang].modal_close;
  renderRepos(featuredRepos);
}

langToggle.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  applyTranslations();
  restartTypeLoop();
});

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

function openModal(config) {
  modalTitle.textContent = config.title;
  modalBody.textContent = config.body;
  modalLink.textContent = config.linkText;
  modalLink.href = config.link;
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
        linkText: i18n[currentLang].details_research_link_text,
        link: '#research'
      });
    }
  });
});

function renderRepos(repos) {
  if (!repoGrid) return;
  if (!repos.length) {
    repoGrid.innerHTML = `<p class="muted">${i18n[currentLang].no_repos}</p>`;
    return;
  }

  repoGrid.innerHTML = repos.map((repo) => `
    <article class="repo-card" data-repo="${repo.name}">
      <h3><a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a></h3>
      <p class="muted">${repo.description || i18n[currentLang].no_desc}</p>
      <div class="repo-meta">
        <span>${i18n[currentLang].star} ${repo.stargazers_count}</span>
        <span>${repo.language || i18n[currentLang].mixed}</span>
      </div>
      <button class="btn btn-outline repo-detail" type="button" data-repo="${repo.name}">${i18n[currentLang].view_details}</button>
    </article>
  `).join('');

  document.querySelectorAll('.repo-detail').forEach((btn) => {
    btn.addEventListener('click', () => {
      const repo = featuredRepos.find((item) => item.name === btn.dataset.repo);
      if (!repo) return;
      openModal({
        title: repo.name,
        body: repo.description || i18n[currentLang].no_desc,
        linkText: i18n[currentLang].details_project_link_text,
        link: repo.html_url
      });
    });
  });
}

async function loadRepos() {
  if (!repoGrid) return;
  repoGrid.innerHTML = `<p class="muted">${i18n[currentLang].loading_repos}</p>`;
  try {
    const response = await fetch('https://api.github.com/users/wcx12/repos?sort=updated&per_page=100');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const repos = await response.json();
    featuredRepos = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.updated_at) - new Date(a.updated_at)))
      .slice(0, 6);

    renderRepos(featuredRepos);
  } catch (error) {
    repoGrid.innerHTML = `<p class="muted">${i18n[currentLang].load_fail}</p>`;
  }
}

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

applyTranslations();
restartTypeLoop();
loadRepos();
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
drawStars();
