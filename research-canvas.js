let researchCanvasInstance = null;

export function createResearchCanvas(options) {
  if (researchCanvasInstance) return researchCanvasInstance;

  const {
    getActiveEntry,
    getContext,
    getPrimaryInterestId,
    requestMotionFrame = () => {}
  } = options;
  const interestCanvas = document.getElementById('interestCanvas');
  const interestCtx = interestCanvas?.getContext('2d');
  const interestCanvasStatus = document.getElementById('interestCanvasStatus');
  const interestDemoPrevious = document.getElementById('interestDemoPrevious');
  const interestDemoAction = document.getElementById('interestDemoAction');
  const interestDemoReset = document.getElementById('interestDemoReset');
  const compactInterestMotionQuery = window.matchMedia('(max-width: 720px), (hover: none), (pointer: coarse)');
  const themeColorCache = new Map();
  const MAX_CANVAS_DPR = 2;
  const INTEREST_DESKTOP_FRAME_MS = 46;
  const INTEREST_MOBILE_IDLE_FRAME_MS = 200;
  let currentLang = 'en';
  let interestTick = 0;
  let lastInterestFrame = 0;
  let interestCanvasVisible = !('IntersectionObserver' in window);
  let interestCanvasSize = { width: 0, height: 0, scale: 1 };

  function syncContext() {
    currentLang = getContext().lang;
  }

  function activeInterestEntry() {
    return getActiveEntry();
  }

  function primaryInterestId(item, kind) {
    return getPrimaryInterestId(item, kind);
  }

  function isResearchViewActive() {
    return document.getElementById('research')?.classList.contains('active');
  }

  function updateInterestCanvasSize(width, height) {
    if (!interestCanvas || !interestCtx) return false;
    const scale = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);
    const cssWidth = Math.max(0, width);
    const cssHeight = Math.max(0, height);
    const pixelWidth = Math.max(1, Math.floor(cssWidth * scale));
    const pixelHeight = Math.max(1, Math.floor(cssHeight * scale));
    const changed = interestCanvas.width !== pixelWidth
      || interestCanvas.height !== pixelHeight
      || interestCanvasSize.width !== cssWidth
      || interestCanvasSize.height !== cssHeight
      || interestCanvasSize.scale !== scale;
    if (interestCanvas.width !== pixelWidth) interestCanvas.width = pixelWidth;
    if (interestCanvas.height !== pixelHeight) interestCanvas.height = pixelHeight;
    interestCtx.setTransform(scale, 0, 0, scale, 0, 0);
    interestCanvasSize = { width: cssWidth, height: cssHeight, scale };
    return changed;
  }

  function measureInterestCanvasSize() {
    if (!interestCanvas) return false;
    const rect = interestCanvas.getBoundingClientRect();
    return updateInterestCanvasSize(rect.width, rect.height);
  }

  function interestPointer(event) {
    return {
      x: Math.max(0, Math.min(interestCanvasSize.width, Number(event.offsetX) || 0)),
      y: Math.max(0, Math.min(interestCanvasSize.height, Number(event.offsetY) || 0))
    };
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

  function themeColor(name) {
    if (themeColorCache.has(name)) return themeColorCache.get(name);
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    themeColorCache.set(name, value);
    return value;
  }

const pointCloudInteraction = {
  active: false,
  dragging: false,
  x: 0.5,
  y: 0.5,
  scrub: 0.48,
  targetScrub: 0.48,
  energy: 0,
  completed: false
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
  selectedStage: 'request',
  hoverType: null,
  hoverId: null,
  pulse: 0,
  runBoost: 0,
  completed: false
};

const educationInteraction = {
  active: false,
  dragging: false,
  x: 0.5,
  y: 0.5,
  selectedConcept: 'functions',
  selectedSignal: 'hint',
  hoverType: null,
  hoverId: null,
  pulse: 0,
  masteryBoost: 0
};

const medicalCases = [
  { id: 'C01', uncertainty: 0.82, finding: 'Normal', seed: 11 },
  { id: 'C02', uncertainty: 0.31, finding: 'Normal', seed: 23 },
  { id: 'C03', uncertainty: 0.74, finding: 'Finding A', seed: 37 },
  { id: 'C04', uncertainty: 0.57, finding: 'Normal', seed: 43 },
  { id: 'C05', uncertainty: 0.91, finding: 'Finding B', seed: 59 },
  { id: 'C06', uncertainty: 0.46, finding: 'Normal', seed: 67 },
  { id: 'C07', uncertainty: 0.68, finding: 'Finding A', seed: 79 },
  { id: 'C08', uncertainty: 0.22, finding: 'Normal', seed: 83 },
  { id: 'C09', uncertainty: 0.79, finding: 'Finding B', seed: 97 },
  { id: 'C10', uncertainty: 0.52, finding: 'Normal', seed: 101 },
  { id: 'C11', uncertainty: 0.63, finding: 'Finding A', seed: 113 },
  { id: 'C12', uncertainty: 0.38, finding: 'Normal', seed: 127 }
];

const medicalInteraction = {
  active: false,
  dragging: false,
  x: 0.5,
  y: 0.5,
  selected: 4,
  hoverIndex: null,
  labeled: new Set([1, 7]),
  pulse: 0
};

const registrationState = {
  points: [],
  seed: 7,
  params: {
    noise: 12,
    missing: 18,
    rotation: 34
  }
};

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
  return registrationState.params;
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
  } else if (resolvedInterestId === 'medical-image-analysis') {
    medicalInteraction.active = true;
    medicalInteraction.selected = hash % medicalCases.length;
    medicalInteraction.hoverIndex = medicalInteraction.selected;
    medicalInteraction.pulse = 1;
    updateInterestCanvasAccessibility();
  } else if (resolvedInterestId === 'agent') {
    agentInteraction.active = true;
    agentInteraction.taskIndex = hay.includes('readme') || kind === 'paper' ? 1 : 0;
    agentInteraction.selectedStage = 'work';
    agentInteraction.pulse = 1;
    agentInteraction.runBoost = 0.75;
  } else if (resolvedInterestId === 'ai4edu') {
    educationInteraction.active = true;
    educationInteraction.selectedConcept = hay.includes('tetrahedron') || hay.includes('geometry') ? 'geometry' : 'functions';
    educationInteraction.selectedSignal = 'hint';
    educationInteraction.pulse = 1;
    educationInteraction.masteryBoost = 1;
  }
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

function isMedicalImageInterestActive() {
  return activeInterestAnimationType() === 'medical-image';
}

function isAgentInterestActive() {
  return activeInterestAnimationType() === 'agent';
}

function isEducationInterestActive() {
  return activeInterestAnimationType() === 'education';
}

function medicalLearningScore() {
  return Math.min(94, 54 + medicalInteraction.labeled.size * 4);
}

function medicalFindingLabel(sample) {
  if (currentLang !== 'zh') return sample.finding;
  if (sample.finding === 'Normal') return '正常';
  return sample.finding.replace('Finding', '病灶');
}

function medicalStatusText() {
  const sample = medicalCases[medicalInteraction.selected] || medicalCases[0];
  const labeled = medicalInteraction.labeled.has(medicalInteraction.selected);
  if (currentLang === 'zh') {
    return `${sample.id}，不确定度 ${Math.round(sample.uncertainty * 100)}%，${labeled ? `已标注为${medicalFindingLabel(sample)}` : '待标注'}。已标注 ${medicalInteraction.labeled.size}/${medicalCases.length}，模型得分 ${medicalLearningScore()}%。`;
  }
  return `${sample.id}, uncertainty ${Math.round(sample.uncertainty * 100)}%, ${labeled ? `labeled ${sample.finding}` : 'unlabeled'}. ${medicalInteraction.labeled.size}/${medicalCases.length} labeled, model score ${medicalLearningScore()}%.`;
}

function pointCloudStatusText() {
  const params = registrationParams();
  const error = Math.max(0.2, (1 - clamp01(pointCloudInteraction.scrub)) * 8 + params.noise * 0.03 + params.missing * 0.015);
  if (currentLang === 'zh') {
    return pointCloudInteraction.completed
      ? `配准完成，估计对齐误差 ${error.toFixed(2)}，旋转 ${params.rotation}°。`
      : `当前旋转 ${params.rotation}°，估计对齐误差 ${error.toFixed(2)}。`;
  }
  return pointCloudInteraction.completed
    ? `Registration complete. Estimated alignment error ${error.toFixed(2)} at ${params.rotation}° rotation.`
    : `Current rotation ${params.rotation}°. Estimated alignment error ${error.toFixed(2)}.`;
}

function selectedVprCandidate() {
  const selectedId = vprInteraction.selected || bestVprCandidate()?.id;
  return vprCandidateScores().find((candidate) => candidate.id === selectedId) || bestVprCandidate();
}

function vprStatusText() {
  const candidate = selectedVprCandidate();
  if (!candidate) return currentLang === 'zh' ? '当前没有匹配候选。' : 'No match candidate is selected.';
  const confidence = Math.round(candidate.score * 100);
  return currentLang === 'zh'
    ? `当前匹配 ${candidate.id}（${candidate.name}），置信度 ${confidence}%。`
    : `Current match ${candidate.id} (${candidate.name}), ${confidence}% confidence.`;
}

function agentStatusText() {
  const scenario = humanAiScenario();
  const stage = humanAiStages.find((item) => item.id === agentInteraction.selectedStage) || humanAiStages[0];
  const stageZh = { request: '提出任务', work: 'AI 协作', deliver: '交付结果' }[stage.id] || stage.label;
  const result = stage.id === 'request' ? scenario.human : stage.id === 'work' ? scenario.ai : scenario.output;
  return currentLang === 'zh'
    ? `任务 ${agentInteraction.taskIndex + 1}：${scenario.task}。阶段：${stageZh}。${agentInteraction.completed ? '结果' : '当前状态'}：${result}。`
    : `Task ${agentInteraction.taskIndex + 1}: ${scenario.task}. Stage: ${stage.label}. ${agentInteraction.completed ? 'Result' : 'Current state'}: ${result}.`;
}

function educationStatusText() {
  const concept = educationConceptForSelected();
  const signal = educationSignalForSelected();
  const mastery = Math.round(educationMastery(concept) * 100);
  const conceptZh = { algebra: '代数', functions: '函数', geometry: '几何', proof: '证明', word: '应用题' }[concept.id] || concept.label;
  const signalZh = { correct: '回答正确', hint: '已使用提示', incorrect: '回答错误' }[signal.id] || signal.label;
  return currentLang === 'zh'
    ? `当前练习：${conceptZh}。学习状态：${signalZh}，掌握度 ${mastery}%。`
    : `Current exercise: ${concept.label}. Learning state: ${signal.label}, ${mastery}% mastery.`;
}

function interestDemoStatusText(type) {
  if (type === 'point-cloud') return pointCloudStatusText();
  if (type === 'vpr') return vprStatusText();
  if (type === 'medical-image') return medicalStatusText();
  if (type === 'agent') return agentStatusText();
  if (type === 'education') return educationStatusText();
  return '';
}

function interestDemoLabels(type) {
  const labels = currentLang === 'zh'
    ? {
      'point-cloud': ['旋转点云', '执行配准', '重置配准'],
      vpr: ['前一候选', '下一候选', '重置匹配'],
      'medical-image': ['前一高不确定样本', '标注样本', '重置主动学习'],
      agent: ['前一任务', '执行下一步', '重置任务'],
      education: ['前一练习', educationInteraction.selectedSignal === 'correct' ? '下一提示' : '提交回答', '重置学习']
    }
    : {
      'point-cloud': ['Rotate Point Cloud', 'Run Registration', 'Reset Registration'],
      vpr: ['Previous Candidate', 'Next Candidate', 'Reset Match'],
      'medical-image': ['Previous Uncertain Sample', 'Annotate Sample', 'Reset Active Learning'],
      agent: ['Previous Task', 'Run Next Step', 'Reset Task'],
      education: ['Previous Exercise', educationInteraction.selectedSignal === 'correct' ? 'Next Hint' : 'Submit Response', 'Reset Learning']
    };
  return labels[type] || [];
}

function updateInterestDemoControls() {
  const type = activeInterestAnimationType();
  const labels = interestDemoLabels(type);
  if (interestDemoPrevious) {
    interestDemoPrevious.hidden = !labels[0];
    if (labels[0]) interestDemoPrevious.textContent = labels[0];
  }
  if (interestDemoAction) {
    interestDemoAction.hidden = !labels[1];
    if (labels[1]) interestDemoAction.textContent = labels[1];
  }
  if (interestDemoReset) {
    interestDemoReset.hidden = !labels[2];
    if (labels[2]) interestDemoReset.textContent = labels[2];
  }
  if (interestCanvasStatus) interestCanvasStatus.textContent = interestDemoStatusText(type);
}

function updateInterestCanvasAccessibility() {
  const type = activeInterestAnimationType();
  const labels = currentLang === 'zh'
    ? {
      'point-cloud': '点云配准概念演示。拖动指针观察点集对齐。',
      vpr: '视觉地点识别概念演示。移动指针匹配路线中的地点。',
      'medical-image': '医学影像主动学习概念演示。选择高不确定度样本并进行标注。',
      agent: '人类与 AI 协作完成任务的概念演示。',
      education: '机器人教师辅助学生学习的概念演示。'
    }
    : {
      'point-cloud': 'Illustrative point-cloud registration concept. Drag to inspect point-set alignment.',
      vpr: 'Illustrative visual place recognition concept. Move along the route to match a place.',
      'medical-image': 'Illustrative medical-image active-learning concept. Select uncertain samples to annotate.',
      agent: 'Illustrative concept of human and AI task collaboration.',
      education: 'Illustrative concept of a robot teacher supporting a learner.'
    };
  interestCanvas.setAttribute('role', 'img');
  interestCanvas.setAttribute('aria-label', labels[type] || (currentLang === 'zh' ? '研究方向概念演示' : 'Research interest concept demo'));
  interestCanvas.tabIndex = -1;
  if (document.activeElement === interestCanvas) interestCanvas.blur();
  updateInterestDemoControls();
}

function commitInterestDemoControl() {
  updateInterestCanvasAccessibility();
  drawInterestInteractionFrame();
  requestMotionFrame({ immediate: true });
}

function cycleVprCandidate(delta) {
  const currentId = vprInteraction.selected || bestVprCandidate()?.id;
  const currentIndex = Math.max(0, vprPlaces.findIndex((place) => place.id === currentId));
  const next = vprPlaces[(currentIndex + delta + vprPlaces.length) % vprPlaces.length];
  vprInteraction.selected = next.id;
  vprInteraction.route = next.u;
  vprInteraction.targetRoute = next.u;
  vprInteraction.condition = next.condition;
  vprInteraction.targetCondition = next.condition;
  vprInteraction.active = true;
  vprInteraction.energy = 1;
}

function selectPreviousUncertainMedicalCase() {
  const ordered = medicalCases
    .map((sample, index) => ({ index, uncertainty: sample.uncertainty }))
    .sort((a, b) => b.uncertainty - a.uncertainty);
  const currentPosition = ordered.findIndex((item) => item.index === medicalInteraction.selected);
  const nextPosition = (Math.max(0, currentPosition) - 1 + ordered.length) % ordered.length;
  selectMedicalCase(ordered[nextPosition].index);
}

function selectPreviousAgentTask() {
  agentInteraction.taskIndex = (agentInteraction.taskIndex - 1 + humanAiCollabScenarios.length) % humanAiCollabScenarios.length;
  agentInteraction.selectedStage = humanAiStages[0].id;
  agentInteraction.completed = false;
  agentInteraction.active = true;
  agentInteraction.pulse = 1;
  agentInteraction.runBoost = 0.4;
}

function runNextAgentStage() {
  const currentIndex = Math.max(0, humanAiStages.findIndex((stage) => stage.id === agentInteraction.selectedStage));
  const nextIndex = Math.min(humanAiStages.length - 1, currentIndex + 1);
  agentInteraction.selectedStage = humanAiStages[nextIndex].id;
  agentInteraction.completed = nextIndex === humanAiStages.length - 1;
  agentInteraction.active = true;
  agentInteraction.pulse = 1;
  agentInteraction.runBoost = 1;
}

function selectPreviousEducationExercise() {
  const currentIndex = Math.max(0, educationConcepts.findIndex((concept) => concept.id === educationInteraction.selectedConcept));
  const previous = educationConcepts[(currentIndex - 1 + educationConcepts.length) % educationConcepts.length];
  educationInteraction.selectedConcept = previous.id;
  educationInteraction.selectedSignal = 'hint';
  educationInteraction.active = true;
  educationInteraction.pulse = 1;
  educationInteraction.masteryBoost = 0.25;
}

function runEducationAction() {
  if (educationInteraction.selectedSignal === 'correct') {
    const currentIndex = Math.max(0, educationConcepts.findIndex((concept) => concept.id === educationInteraction.selectedConcept));
    educationInteraction.selectedConcept = educationConcepts[(currentIndex + 1) % educationConcepts.length].id;
    educationInteraction.selectedSignal = 'hint';
    educationInteraction.masteryBoost = 0.3;
  } else {
    educationInteraction.selectedSignal = 'correct';
    educationInteraction.masteryBoost = 1;
  }
  educationInteraction.active = true;
  educationInteraction.pulse = 1;
}

function runInterestDemoPrevious() {
  const type = activeInterestAnimationType();
  if (type === 'point-cloud') {
    const rotation = (registrationParams().rotation + 15) % 360;
    registrationState.params.rotation = rotation;
    pointCloudInteraction.scrub = 0.22;
    pointCloudInteraction.targetScrub = 0.22;
    pointCloudInteraction.x = 0.22;
    pointCloudInteraction.active = true;
    pointCloudInteraction.energy = 1;
    pointCloudInteraction.completed = false;
  } else if (type === 'vpr') {
    cycleVprCandidate(-1);
  } else if (type === 'medical-image') {
    selectPreviousUncertainMedicalCase();
    return;
  } else if (type === 'agent') {
    selectPreviousAgentTask();
  } else if (type === 'education') {
    selectPreviousEducationExercise();
  }
  commitInterestDemoControl();
}

function runInterestDemoAction() {
  const type = activeInterestAnimationType();
  if (type === 'point-cloud') {
    pointCloudInteraction.scrub = 1;
    pointCloudInteraction.targetScrub = 1;
    pointCloudInteraction.x = 1;
    pointCloudInteraction.active = true;
    pointCloudInteraction.energy = 1;
    pointCloudInteraction.completed = true;
  } else if (type === 'vpr') {
    cycleVprCandidate(1);
  } else if (type === 'medical-image') {
    selectMedicalCase(medicalInteraction.selected, true);
    return;
  } else if (type === 'agent') {
    runNextAgentStage();
  } else if (type === 'education') {
    runEducationAction();
  }
  commitInterestDemoControl();
}

function resetInterestDemo() {
  const type = activeInterestAnimationType();
  if (type === 'point-cloud') {
    registrationState.params = { noise: 12, missing: 18, rotation: 34 };
    pointCloudInteraction.active = false;
    pointCloudInteraction.dragging = false;
    pointCloudInteraction.x = 0.5;
    pointCloudInteraction.y = 0.5;
    pointCloudInteraction.scrub = 0.48;
    pointCloudInteraction.targetScrub = 0.48;
    pointCloudInteraction.energy = 0;
    pointCloudInteraction.completed = false;
  } else if (type === 'vpr') {
    vprInteraction.active = false;
    vprInteraction.dragging = false;
    vprInteraction.route = 0.34;
    vprInteraction.targetRoute = 0.34;
    vprInteraction.condition = 0.42;
    vprInteraction.targetCondition = 0.42;
    vprInteraction.selected = bestVprCandidate()?.id || null;
    vprInteraction.energy = 0;
  } else if (type === 'medical-image') {
    resetMedicalActiveLearning();
    return;
  } else if (type === 'agent') {
    agentInteraction.active = false;
    agentInteraction.dragging = false;
    agentInteraction.taskIndex = 0;
    agentInteraction.selectedStage = 'request';
    agentInteraction.hoverType = null;
    agentInteraction.hoverId = null;
    agentInteraction.pulse = 0;
    agentInteraction.runBoost = 0;
    agentInteraction.completed = false;
  } else if (type === 'education') {
    educationInteraction.active = false;
    educationInteraction.dragging = false;
    educationInteraction.selectedConcept = 'functions';
    educationInteraction.selectedSignal = 'hint';
    educationInteraction.hoverType = null;
    educationInteraction.hoverId = null;
    educationInteraction.pulse = 0;
    educationInteraction.masteryBoost = 0;
  }
  commitInterestDemoControl();
}

interestDemoPrevious?.addEventListener('click', runInterestDemoPrevious);
interestDemoAction?.addEventListener('click', runInterestDemoAction);
interestDemoReset?.addEventListener('click', resetInterestDemo);

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

function agentHitRegion(event) {
  const { x, y } = interestPointer(event);
  const layout = humanAiCollabLayout(interestCanvasSize.width, interestCanvasSize.height);
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

function educationConceptForSelected() {
  return educationConcepts.find((concept) => concept.id === educationInteraction.selectedConcept) || educationConcepts[1];
}

function educationSignalForSelected() {
  return educationSignals.find((signal) => signal.id === educationInteraction.selectedSignal) || educationSignals[1];
}

function educationHitRegion(event) {
  const { x, y } = interestPointer(event);
  const layout = robotTeacherLayout(interestCanvasSize.width, interestCanvasSize.height);
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

const humanAiStages = [
  { id: 'request', label: 'Human request' },
  { id: 'work', label: 'AI working' },
  { id: 'deliver', label: 'Result delivered' }
];

function humanAiScenario() {
  return humanAiCollabScenarios[agentInteraction.taskIndex % humanAiCollabScenarios.length] || humanAiCollabScenarios[0];
}

function humanAiCollabLayout(width, height) {
  const compact = width < 460 || height < 220;
  const veryCompact = width < 340;
  const centerY = height * (compact ? 0.5 : 0.54);
  const buttonW = compact ? Math.max(74, (width - 46) / 3) : 118;
  return {
    compact,
    veryCompact,
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
      w: veryCompact ? 64 : compact ? 82 : 104,
      h: veryCompact ? 92 : compact ? 112 : 132
    },
    ai: {
      id: 'ai',
      x: compact ? width * 0.5 : width * 0.51,
      y: centerY - (compact ? 6 : 2),
      r: veryCompact ? 30 : compact ? 38 : 48
    },
    output: {
      id: 'output',
      x: veryCompact ? width - Math.max(68, width * 0.27) - 6 : compact ? width * 0.7 : width * 0.73,
      y: centerY - (compact ? 48 : 54),
      w: veryCompact ? Math.max(68, width * 0.27) : compact ? 104 : 138,
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
  const narrow = output.w < 90;
  drawRoundedRect(ctx, output.x, output.y, output.w, output.h, 12);
  ctx.fillStyle = active ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.075)';
  ctx.fill();
  ctx.strokeStyle = active ? secondary : 'rgba(255,255,255,0.18)';
  ctx.lineWidth = active ? 2.4 : 1.2;
  ctx.stroke();
  ctx.fillStyle = secondary;
  ctx.font = '10px JetBrains Mono, monospace';
  fillTruncatedText(ctx, narrow ? 'Done' : scenario.output, output.x + 12, output.y + 20, output.w - 24);
  ctx.strokeStyle = primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(output.x + 15, output.y + 38);
  ctx.lineTo(output.x + 26, output.y + 49);
  ctx.lineTo(output.x + 48, output.y + 29);
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.font = '9px JetBrains Mono, monospace';
  fillTruncatedText(ctx, narrow ? 'Ready' : scenario.detail, output.x + 12, output.y + 67, output.w - 24);
  ctx.fillStyle = muted;
  fillTruncatedText(ctx, narrow ? 'by AI' : 'Delivered by AI', output.x + 12, output.y + 84, output.w - 24);
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

  const tokenWidth = layout.veryCompact ? 48 : 68;
  drawRoundedRect(interestCtx, tokenX - tokenWidth / 2, tokenY - 15, tokenWidth, 30, 9);
  interestCtx.fillStyle = 'rgba(3,7,18,0.72)';
  interestCtx.fill();
  interestCtx.strokeStyle = phase === 'thinking' ? primary : secondary;
  interestCtx.lineWidth = 2;
  interestCtx.stroke();
  interestCtx.fillStyle = textColor;
  interestCtx.font = layout.veryCompact ? '8px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace';
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
      y: Math.min(compact ? height * 0.54 : height * 0.5, feedbackY - (compact ? 66 : 80)),
      w: compact ? 96 : 122,
      h: compact ? 126 : 148
    },
    student: {
      id: 'student',
      x: compact ? Math.max(40, width * 0.15) : width * 0.15,
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
  const short = board.h < 116;
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

  const pad = narrow || short ? 14 : 18;
  ctx.fillStyle = primary;
  ctx.font = short ? '11.5px JetBrains Mono, monospace' : narrow ? '12.5px JetBrains Mono, monospace' : '14px JetBrains Mono, monospace';
  fillTruncatedText(ctx, displayTitle, board.x + pad, board.y + (short ? 22 : 28), board.w - pad * 2);
  ctx.fillStyle = textColor;
  ctx.font = short ? '9px JetBrains Mono, monospace' : narrow ? '9.5px JetBrains Mono, monospace' : '10.5px JetBrains Mono, monospace';
  fillTruncatedText(ctx, displayLine1, board.x + pad, board.y + (short ? 44 : 56), board.w - pad * 2);
  if (!short) {
    ctx.fillStyle = muted;
    fillTruncatedText(ctx, displayLine2, board.x + pad, board.y + 78, board.w - pad * 2);
  }

  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; !short && i < 3; i += 1) {
    const y = board.y + 96 + i * 14;
    if (y > board.y + board.h - 42) break;
    ctx.beginPath();
    ctx.moveTo(board.x + pad, y);
    ctx.lineTo(board.x + board.w - pad, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.beginPath();
  const meterY = board.y + board.h - (short ? 24 : 30);
  ctx.moveTo(board.x + pad, meterY);
  ctx.lineTo(board.x + board.w - pad, meterY);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(board.x + pad, meterY);
  ctx.lineTo(board.x + pad + (board.w - pad * 2) * mastery, meterY);
  ctx.strokeStyle = mastery > 0.68 ? primary : mastery > 0.48 ? secondary : 'rgba(255,255,255,0.55)';
  ctx.stroke();
  ctx.fillStyle = secondary;
  ctx.font = '9px JetBrains Mono, monospace';
  fillTruncatedText(ctx, `Mastery ${Math.round(mastery * 100)}%`, board.x + pad, board.y + board.h - (short ? 7 : 12), board.w - pad * 2);
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

function medicalActiveLearningLayout(width, height) {
  const compact = width < 540 || height < 230;
  const pad = compact ? 10 : 16;
  const top = compact ? 32 : 38;
  const columns = 4;
  const rows = 3;
  const gap = compact ? 5 : 8;
  const gridWidth = compact ? width - pad * 2 : Math.max(280, width * 0.62);
  const gridHeight = compact ? Math.max(102, height * 0.53) : height - top - pad;
  const cellWidth = (gridWidth - gap * (columns - 1)) / columns;
  const cellHeight = (gridHeight - gap * (rows - 1)) / rows;
  const tiles = medicalCases.map((sample, index) => ({
    ...sample,
    index,
    x: pad + (index % columns) * (cellWidth + gap),
    y: top + Math.floor(index / columns) * (cellHeight + gap),
    w: cellWidth,
    h: cellHeight
  }));
  const detailY = compact ? top + gridHeight + 9 : top;
  return {
    compact,
    tiles,
    detail: compact
      ? { x: pad, y: detailY, w: width - pad * 2, h: Math.max(42, height - detailY - 8) }
      : { x: pad + gridWidth + 18, y: detailY, w: width - (pad + gridWidth + 18) - pad, h: gridHeight }
  };
}

function drawMedicalScan(ctx, tile, sample, options = {}) {
  const { selected = false, labeled = false, large = false, primary, secondary, muted } = options;
  const radius = large ? 12 : 7;
  drawRoundedRect(ctx, tile.x, tile.y, tile.w, tile.h, radius);
  ctx.fillStyle = large ? 'rgba(255,255,255,0.07)' : 'rgba(3,7,18,0.72)';
  ctx.fill();

  ctx.save();
  drawRoundedRect(ctx, tile.x + 1, tile.y + 1, tile.w - 2, tile.h - 2, Math.max(3, radius - 1));
  ctx.clip();
  const cx = tile.x + tile.w * 0.5;
  const cy = tile.y + tile.h * (large ? 0.46 : 0.48);
  const bodyW = tile.w * (large ? 0.58 : 0.5);
  const bodyH = tile.h * (large ? 0.68 : 0.58);
  const drift = ((sample.seed % 7) - 3) * tile.w * 0.006;

  ctx.beginPath();
  ctx.ellipse(cx, cy, bodyW * 0.58, bodyH * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(232,240,255,0.13)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,240,255,0.2)';
  ctx.lineWidth = large ? 1.4 : 0.8;
  ctx.stroke();

  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(cx + side * bodyW * 0.2 + drift, cy, bodyW * 0.18, bodyH * 0.36, side * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(3,7,18,0.78)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,240,255,0.16)';
    ctx.stroke();
  });

  ctx.beginPath();
  ctx.moveTo(cx, cy - bodyH * 0.35);
  ctx.lineTo(cx, cy + bodyH * 0.36);
  ctx.strokeStyle = 'rgba(232,240,255,0.22)';
  ctx.lineWidth = large ? 2 : 1;
  ctx.stroke();

  if (sample.finding !== 'Normal') {
    const side = sample.seed % 2 ? -1 : 1;
    const fx = cx + side * bodyW * 0.2;
    const fy = cy + ((sample.seed % 5) - 2) * bodyH * 0.07;
    ctx.beginPath();
    ctx.arc(fx, fy, Math.max(2.2, Math.min(tile.w, tile.h) * (large ? 0.065 : 0.045)), 0, Math.PI * 2);
    ctx.fillStyle = labeled ? primary : 'rgba(255,255,255,0.7)';
    ctx.fill();
    if (large || selected) {
      ctx.beginPath();
      ctx.arc(fx, fy, Math.max(5, Math.min(tile.w, tile.h) * 0.1), 0, Math.PI * 2);
      ctx.strokeStyle = labeled ? primary : secondary;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  for (let index = 0; index < (large ? 18 : 7); index += 1) {
    const px = tile.x + ((sample.seed * 13 + index * 37) % 89) / 89 * tile.w;
    const py = tile.y + ((sample.seed * 17 + index * 29) % 83) / 83 * tile.h;
    ctx.fillStyle = `rgba(255,255,255,${0.025 + (index % 3) * 0.012})`;
    ctx.fillRect(px, py, large ? 1.4 : 0.8, large ? 1.4 : 0.8);
  }
  ctx.restore();

  drawRoundedRect(ctx, tile.x, tile.y, tile.w, tile.h, radius);
  ctx.strokeStyle = selected ? secondary : labeled ? primary : 'rgba(255,255,255,0.16)';
  ctx.lineWidth = selected ? 2.2 : labeled ? 1.5 : 1;
  ctx.stroke();

  if (!large) {
    ctx.fillStyle = selected ? secondary : labeled ? primary : muted;
    ctx.font = `${tile.w < 62 ? 7.5 : 8.5}px JetBrains Mono, monospace`;
    ctx.fillText(sample.id, tile.x + 5, tile.y + 11);
    const meterWidth = Math.max(8, tile.w - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(tile.x + 5, tile.y + tile.h - 5, meterWidth, 2);
    ctx.fillStyle = labeled ? primary : sample.uncertainty > 0.7 ? secondary : muted;
    ctx.fillRect(tile.x + 5, tile.y + tile.h - 5, meterWidth * (labeled ? 0.16 : sample.uncertainty), 2);
  }
}

function drawMedicalActiveLearning(width, height, t, primary, secondary, muted) {
  const layout = medicalActiveLearningLayout(width, height);
  const selected = medicalCases[medicalInteraction.selected] || medicalCases[0];
  const isLabeled = medicalInteraction.labeled.has(medicalInteraction.selected);
  const textColor = themeColor('--text') || '#f5f5f5';
  medicalInteraction.pulse *= 0.9;

  interestCtx.fillStyle = muted;
  interestCtx.font = `${layout.compact ? 8.5 : 10}px JetBrains Mono, monospace`;
  fillTruncatedText(
    interestCtx,
    currentLang === 'zh' ? '选择高不确定度影像进行标注 · 方向键 + 回车' : 'Select an uncertain scan to annotate · arrows + Enter',
    layout.compact ? 10 : 16,
    layout.compact ? 19 : 22,
    width - (layout.compact ? 20 : 32)
  );

  layout.tiles.forEach((tile) => {
    drawMedicalScan(interestCtx, tile, tile, {
      selected: tile.index === medicalInteraction.selected || tile.index === medicalInteraction.hoverIndex,
      labeled: medicalInteraction.labeled.has(tile.index),
      primary,
      secondary,
      muted
    });
  });

  const detail = layout.detail;
  if (layout.compact) {
    const score = medicalLearningScore();
    interestCtx.fillStyle = isLabeled ? primary : secondary;
    interestCtx.font = '700 9px JetBrains Mono, monospace';
    const stateText = currentLang === 'zh'
      ? `${selected.id} · ${isLabeled ? `已标注 ${medicalFindingLabel(selected)}` : `不确定度 ${Math.round(selected.uncertainty * 100)}%`}`
      : `${selected.id} · ${isLabeled ? `labeled ${selected.finding}` : `${Math.round(selected.uncertainty * 100)}% uncertain`}`;
    fillTruncatedText(interestCtx, stateText, detail.x, detail.y + 12, detail.w * 0.58);
    interestCtx.fillStyle = muted;
    interestCtx.font = '8px JetBrains Mono, monospace';
    fillTruncatedText(
      interestCtx,
      currentLang === 'zh' ? `模型得分 ${score}% · 已标注 ${medicalInteraction.labeled.size}/${medicalCases.length}` : `Model ${score}% · ${medicalInteraction.labeled.size}/${medicalCases.length} labeled`,
      detail.x,
      detail.y + 27,
      detail.w * 0.58
    );
    const meterX = detail.x + detail.w * 0.62;
    const meterY = detail.y + 18;
    interestCtx.fillStyle = 'rgba(255,255,255,0.13)';
    interestCtx.fillRect(meterX, meterY, detail.w * 0.36, 5);
    interestCtx.fillStyle = primary;
    interestCtx.fillRect(meterX, meterY, detail.w * 0.36 * score / 100, 5);
  } else {
    const preview = {
      x: detail.x + detail.w * 0.14,
      y: detail.y + 4,
      w: detail.w * 0.72,
      h: Math.max(72, detail.h * 0.5)
    };
    drawMedicalScan(interestCtx, preview, selected, {
      selected: true,
      labeled: isLabeled,
      large: true,
      primary,
      secondary,
      muted
    });

    interestCtx.fillStyle = isLabeled ? primary : secondary;
    interestCtx.font = '700 11px JetBrains Mono, monospace';
    interestCtx.fillText(`${selected.id} · ${isLabeled ? medicalFindingLabel(selected) : `${Math.round(selected.uncertainty * 100)}% ${currentLang === 'zh' ? '不确定' : 'UNCERTAIN'}`}`, detail.x, detail.y + detail.h * 0.62);
    interestCtx.fillStyle = muted;
    interestCtx.font = '9px JetBrains Mono, monospace';
    fillTruncatedText(
      interestCtx,
      currentLang === 'zh' ? (isLabeled ? '标注已加入训练集' : '点击该影像加入标注集') : (isLabeled ? 'Annotation added to training set' : 'Click this scan to add a label'),
      detail.x,
      detail.y + detail.h * 0.72,
      detail.w
    );
    const score = medicalLearningScore();
    const meterY = detail.y + detail.h * 0.84;
    interestCtx.fillStyle = 'rgba(255,255,255,0.13)';
    interestCtx.fillRect(detail.x, meterY, detail.w, 6);
    interestCtx.fillStyle = primary;
    interestCtx.fillRect(detail.x, meterY, detail.w * score / 100, 6);
    interestCtx.fillStyle = textColor;
    interestCtx.font = '9px JetBrains Mono, monospace';
    interestCtx.fillText(`${currentLang === 'zh' ? '模型得分' : 'MODEL SCORE'} ${score}%`, detail.x, meterY + 18);
  }

  if (medicalInteraction.pulse > 0.02) {
    const tile = layout.tiles[medicalInteraction.selected];
    interestCtx.beginPath();
    interestCtx.arc(tile.x + tile.w / 2, tile.y + tile.h / 2, Math.max(tile.w, tile.h) * (0.48 + medicalInteraction.pulse * 0.18), 0, Math.PI * 2);
    interestCtx.strokeStyle = `rgba(255,255,255,${medicalInteraction.pulse * 0.42})`;
    interestCtx.lineWidth = 2;
    interestCtx.stroke();
  }
}

function medicalHitRegion(event) {
  const { x, y } = interestPointer(event);
  const layout = medicalActiveLearningLayout(interestCanvasSize.width, interestCanvasSize.height);
  return layout.tiles.find((tile) => x >= tile.x && x <= tile.x + tile.w && y >= tile.y && y <= tile.y + tile.h) || null;
}

function selectMedicalCase(index, annotate = false) {
  const nextIndex = Math.max(0, Math.min(medicalCases.length - 1, index));
  medicalInteraction.selected = nextIndex;
  medicalInteraction.active = true;
  if (annotate) {
    medicalInteraction.labeled.add(nextIndex);
    medicalInteraction.pulse = 1;
  }
  updateInterestCanvasAccessibility();
  drawInterestAnimation();
}

function resetMedicalActiveLearning() {
  medicalInteraction.labeled = new Set([1, 7]);
  medicalInteraction.selected = 4;
  medicalInteraction.hoverIndex = null;
  medicalInteraction.pulse = 1;
  updateInterestCanvasAccessibility();
  drawInterestAnimation();
}

function drawInterestAnimation() {
  const { width, height } = interestCanvasSize;
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
    const params = registrationParams();

    registrationState.points.forEach((point, index) => {
      const target = transformPoint(point, index, params);
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
  } else if (type === 'medical-image') {
    drawMedicalActiveLearning(width, height, t, primary, secondary, muted);
  } else if (type === 'agent') {
    drawHumanAiCollab(width, height, t, primary, secondary, muted);
  } else if (type === 'education') {
    drawRobotTeacherClassroom(width, height, t, primary, secondary, muted);
  }
}

function updatePointCloudPointer(event) {
  const pointer = interestPointer(event);
  pointCloudInteraction.x = clamp01(pointer.x / Math.max(1, interestCanvasSize.width));
  pointCloudInteraction.y = clamp01(pointer.y / Math.max(1, interestCanvasSize.height));
  pointCloudInteraction.active = true;
  pointCloudInteraction.targetScrub = pointCloudInteraction.x;
  if (pointCloudInteraction.dragging) pointCloudInteraction.scrub = pointCloudInteraction.x;
}

function updateVprPointer(event) {
  const pointer = interestPointer(event);
  vprInteraction.targetRoute = clamp01(pointer.x / Math.max(1, interestCanvasSize.width));
  vprInteraction.targetCondition = clamp01(pointer.y / Math.max(1, interestCanvasSize.height));
  vprInteraction.active = true;
  if (vprInteraction.dragging) {
    vprInteraction.route = vprInteraction.targetRoute;
    vprInteraction.condition = vprInteraction.targetCondition;
  }
}

function updateAgentPointer(event) {
  const pointer = interestPointer(event);
  agentInteraction.x = clamp01(pointer.x / Math.max(1, interestCanvasSize.width));
  agentInteraction.y = clamp01(pointer.y / Math.max(1, interestCanvasSize.height));
  agentInteraction.active = true;
  const hit = agentHitRegion(event);
  agentInteraction.hoverType = hit?.type || null;
  agentInteraction.hoverId = hit?.type === 'task' ? hit.item.index : hit?.item.id || null;
}

function interactWithAgentCollab(event) {
  const hit = agentHitRegion(event);
  if (hit?.type === 'task') {
    agentInteraction.taskIndex = hit.item.index;
    agentInteraction.selectedStage = 'request';
    agentInteraction.completed = false;
  } else if (hit?.type === 'human') {
    agentInteraction.selectedStage = 'request';
    agentInteraction.completed = false;
  } else if (hit?.type === 'ai') {
    agentInteraction.selectedStage = 'work';
    agentInteraction.completed = false;
  } else if (hit?.type === 'output') {
    agentInteraction.selectedStage = 'deliver';
    agentInteraction.completed = true;
  } else {
    agentInteraction.pulse = 0.35;
    agentInteraction.runBoost = 0.24;
    return;
  }
  agentInteraction.pulse = 1;
  agentInteraction.runBoost = 0.72;
}

function updateEducationPointer(event) {
  const pointer = interestPointer(event);
  educationInteraction.x = clamp01(pointer.x / Math.max(1, interestCanvasSize.width));
  educationInteraction.y = clamp01(pointer.y / Math.max(1, interestCanvasSize.height));
  educationInteraction.active = true;
  const hit = educationHitRegion(event);
  educationInteraction.hoverType = hit?.type || null;
  educationInteraction.hoverId = hit?.item.id || null;
}

function interactWithEducationStudio(event) {
  const hit = educationHitRegion(event);
  if (hit?.type === 'signal') {
    educationInteraction.selectedSignal = hit.item.id;
  } else if (hit?.type === 'robot' || hit?.type === 'board') {
    educationInteraction.selectedSignal = 'hint';
  } else if (hit?.type === 'student') {
    educationInteraction.selectedSignal = 'incorrect';
  } else {
    educationInteraction.pulse = 0.3;
    educationInteraction.masteryBoost = 0.2;
    return;
  }
  educationInteraction.pulse = 1;
  educationInteraction.masteryBoost = 1;
}

function updateMedicalPointer(event) {
  const pointer = interestPointer(event);
  medicalInteraction.x = clamp01(pointer.x / Math.max(1, interestCanvasSize.width));
  medicalInteraction.y = clamp01(pointer.y / Math.max(1, interestCanvasSize.height));
  medicalInteraction.active = true;
  medicalInteraction.hoverIndex = medicalHitRegion(event)?.index ?? null;
}

function interactWithMedicalActiveLearning(event) {
  const hit = medicalHitRegion(event);
  if (!hit) return;
  selectMedicalCase(hit.index, true);
}

function canvasCursorForActiveInterest() {
  if (isPointCloudInterestActive()) return pointCloudInteraction.dragging ? 'grabbing' : 'grab';
  if (isVprInterestActive()) return vprInteraction.dragging ? 'grabbing' : 'crosshair';
  if (isMedicalImageInterestActive()) return medicalInteraction.dragging ? 'grabbing' : 'pointer';
  if (isAgentInterestActive()) return agentInteraction.dragging ? 'grabbing' : 'pointer';
  if (isEducationInterestActive()) return educationInteraction.dragging ? 'grabbing' : 'pointer';
  return 'default';
}

function isInterestDragging() {
  return pointCloudInteraction.dragging
    || vprInteraction.dragging
    || medicalInteraction.dragging
    || agentInteraction.dragging
    || educationInteraction.dragging;
}

function drawInterestInteractionFrame() {
  if (document.visibilityState !== 'visible' || !interestCanvasVisible || !isResearchViewActive()) return;
  drawInterestAnimation();
}

interestCanvas.addEventListener('pointerenter', (event) => {
  if (isPointCloudInterestActive()) updatePointCloudPointer(event);
  else if (isVprInterestActive()) updateVprPointer(event);
  else if (isMedicalImageInterestActive()) updateMedicalPointer(event);
  else if (isAgentInterestActive()) updateAgentPointer(event);
  else if (isEducationInterestActive()) updateEducationPointer(event);
});

interestCanvas.addEventListener('pointermove', (event) => {
  if (isPointCloudInterestActive()) updatePointCloudPointer(event);
  else if (isVprInterestActive()) updateVprPointer(event);
  else if (isMedicalImageInterestActive()) updateMedicalPointer(event);
  else if (isAgentInterestActive()) updateAgentPointer(event);
  else if (isEducationInterestActive()) updateEducationPointer(event);
  if (isInterestDragging()) drawInterestInteractionFrame();
});

interestCanvas.addEventListener('pointerdown', (event) => {
  if (!isPointCloudInterestActive() && !isVprInterestActive() && !isMedicalImageInterestActive() && !isAgentInterestActive() && !isEducationInterestActive()) return;
  event.preventDefault();
  if (isPointCloudInterestActive()) {
    pointCloudInteraction.dragging = true;
    updatePointCloudPointer(event);
    pointCloudInteraction.targetScrub = pointCloudInteraction.x;
  } else if (isVprInterestActive()) {
    vprInteraction.dragging = true;
    vprInteraction.selected = null;
    updateVprPointer(event);
  } else if (isMedicalImageInterestActive()) {
    medicalInteraction.dragging = true;
    updateMedicalPointer(event);
    medicalInteraction.pulse = 0.55;
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
  drawInterestInteractionFrame();
  requestMotionFrame({ immediate: true });
});

interestCanvas.addEventListener('pointerup', (event) => {
  if (!isPointCloudInterestActive() && !isVprInterestActive() && !isMedicalImageInterestActive() && !isAgentInterestActive() && !isEducationInterestActive()) return;
  if (isPointCloudInterestActive()) {
    pointCloudInteraction.dragging = false;
    updatePointCloudPointer(event);
  } else if (isVprInterestActive()) {
    updateVprPointer(event);
    vprInteraction.selected = bestVprCandidate()?.id || null;
    vprInteraction.dragging = false;
  } else if (isMedicalImageInterestActive()) {
    updateMedicalPointer(event);
    interactWithMedicalActiveLearning(event);
    medicalInteraction.dragging = false;
  } else if (isAgentInterestActive()) {
    updateAgentPointer(event);
      interactWithAgentCollab(event);
    agentInteraction.dragging = false;
  } else {
    updateEducationPointer(event);
    interactWithEducationStudio(event);
    educationInteraction.dragging = false;
  }
  updateInterestCanvasAccessibility();
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
  try {
    interestCanvas.releasePointerCapture?.(event.pointerId);
  } catch {
    // Synthetic pointer events used by browser tests may not own capture.
  }
  drawInterestInteractionFrame();
  requestMotionFrame({ immediate: true });
});

interestCanvas.addEventListener('pointercancel', () => {
  pointCloudInteraction.dragging = false;
  pointCloudInteraction.active = false;
  vprInteraction.dragging = false;
  vprInteraction.active = false;
  medicalInteraction.dragging = false;
  medicalInteraction.active = false;
  medicalInteraction.hoverIndex = null;
  agentInteraction.dragging = false;
  agentInteraction.active = false;
  agentInteraction.hoverType = null;
  agentInteraction.hoverId = null;
  educationInteraction.dragging = false;
  educationInteraction.active = false;
  educationInteraction.hoverType = null;
  educationInteraction.hoverId = null;
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
  drawInterestInteractionFrame();
});

interestCanvas.addEventListener('pointerleave', () => {
  if (pointCloudInteraction.dragging || vprInteraction.dragging || medicalInteraction.dragging || agentInteraction.dragging || educationInteraction.dragging) return;
  pointCloudInteraction.active = false;
  vprInteraction.active = false;
  medicalInteraction.active = false;
  medicalInteraction.hoverIndex = null;
  agentInteraction.active = false;
  agentInteraction.hoverType = null;
  agentInteraction.hoverId = null;
  educationInteraction.active = false;
  educationInteraction.hoverType = null;
  educationInteraction.hoverId = null;
  interestCanvas.style.cursor = canvasCursorForActiveInterest();
  drawInterestInteractionFrame();
});

  function frameInterval() {
    if (isInterestDragging()) return INTEREST_DESKTOP_FRAME_MS;
    return compactInterestMotionQuery.matches ? INTEREST_MOBILE_IDLE_FRAME_MS : INTEREST_DESKTOP_FRAME_MS;
  }

  function render() {
    if (!interestCanvas || !interestCtx) return;
    if (interestCanvasSize.width < 2 || interestCanvasSize.height < 2) measureInterestCanvasSize();
    syncContext();
    updateInterestCanvasAccessibility();
    interestCanvas.style.cursor = canvasCursorForActiveInterest();
    drawInterestAnimation();
  }

  function frame(timestamp = 0) {
    const { lang, reducedMotion } = getContext();
    if (reducedMotion || document.visibilityState !== 'visible' || !interestCanvasVisible || !isResearchViewActive()) return false;
    if (timestamp - lastInterestFrame < frameInterval()) return false;
    lastInterestFrame = timestamp;
    currentLang = lang;
    interestTick += 1;
    drawInterestAnimation();
    return true;
  }

  function contextChanged() {
    syncContext();
    themeColorCache.clear();
    lastInterestFrame = 0;
    updateInterestCanvasAccessibility();
    if (isResearchViewActive() && interestCanvasVisible) drawInterestAnimation();
  }

  function resize() {
    measureInterestCanvasSize();
    render();
  }

  generateRegistrationPoints();
  syncContext();
  measureInterestCanvasSize();

  if ('ResizeObserver' in window && interestCanvas) {
    const resizeObserver = new ResizeObserver(([entry]) => {
      const rect = entry?.contentRect;
      if (!rect || !updateInterestCanvasSize(rect.width, rect.height)) return;
      if (isResearchViewActive() && interestCanvasVisible) render();
      requestMotionFrame({ immediate: true });
    });
    resizeObserver.observe(interestCanvas);
  }

  if ('IntersectionObserver' in window && interestCanvas) {
    const observer = new IntersectionObserver(([entry]) => {
      const nextVisible = Boolean(entry?.isIntersecting);
      if (interestCanvasVisible === nextVisible) return;
      interestCanvasVisible = nextVisible;
      lastInterestFrame = 0;
      if (nextVisible && isResearchViewActive() && document.visibilityState === 'visible' && !getContext().reducedMotion) {
        render();
      }
      requestMotionFrame({ immediate: nextVisible });
    }, { threshold: 0.05 });
    observer.observe(interestCanvas);
  }

  compactInterestMotionQuery.addEventListener?.('change', () => {
    lastInterestFrame = 0;
    if (isResearchViewActive() && interestCanvasVisible) requestMotionFrame({ immediate: true });
  });

  researchCanvasInstance = {
    bindItem: bindItemToInterestAnimation,
    cadence: frameInterval,
    contextChanged,
    frame,
    getRegistrationParams: () => ({ ...registrationParams() }),
    isVisible: () => interestCanvasVisible,
    render,
    resize,
    scrollIntoView: () => interestCanvas?.scrollIntoView({ behavior: getContext().reducedMotion ? 'auto' : 'smooth', block: 'center' })
  };
  return researchCanvasInstance;
}
