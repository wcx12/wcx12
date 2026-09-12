const demoContentUrl = new URL('./research-demo-content.js', import.meta.url);
const demoAssetVersion = new URL(import.meta.url).searchParams.get('v');
if (demoAssetVersion) demoContentUrl.searchParams.set('v', demoAssetVersion);
const { AGENT_TASKS, EDUCATION_EXERCISES, localize, nextAgentStage, evaluateAnswer } = await import(demoContentUrl.href);

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
  const controlsContainer = document.querySelector('#interestCanvasControls');
  const demoContent = createDemoContent();
  const say = (en, zh) => currentLang === 'zh' ? zh : en;
  const localized = (value) => localize(value, currentLang);
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
  selectedSignal: 'unanswered',
  answer: '',
  hintVisible: false,
  hoverType: null,
  hoverId: null,
  pulse: 0
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
    selectAgentTask(agentInteraction.taskIndex);
  } else if (resolvedInterestId === 'ai4edu') {
    educationInteraction.active = true;
    educationInteraction.selectedConcept = hay.includes('tetrahedron') || hay.includes('geometry') ? 'geometry' : 'functions';
    selectEducationExercise(educationInteraction.selectedConcept);
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



function medicalFindingLabel(sample) {
  if (currentLang !== 'zh') return sample.finding;
  if (sample.finding === 'Normal') return '正常';
  return sample.finding.replace('Finding', '病灶');
}

function medicalStatusText() {
  const sample = medicalCases[medicalInteraction.selected] || medicalCases[0];
  const labeled = medicalInteraction.labeled.has(medicalInteraction.selected);
  return say(
    `Synthetic sample ${sample.id}: illustrative uncertainty ${Math.round(sample.uncertainty * 100)}%; ${labeled ? `labeled ${medicalFindingLabel(sample)}` : 'unlabeled'}. ${medicalInteraction.labeled.size}/${medicalCases.length} labeled. No model training or clinical inference.`,
    `合成样本 ${sample.id}：示意不确定度 ${Math.round(sample.uncertainty * 100)}%；${labeled ? `已标注为${medicalFindingLabel(sample)}` : '待标注'}。已标注 ${medicalInteraction.labeled.size}/${medicalCases.length}；未进行模型训练或临床推断。`
  );
}

function pointCloudStatusText() {
  const params = registrationParams();
  const error = Math.max(0.2, (1 - clamp01(pointCloudInteraction.targetScrub)) * 8 + params.noise * 0.03 + params.missing * 0.015);
  if (currentLang === 'zh') {
    return pointCloudInteraction.completed
      ? `配准示意完成，示意对齐误差 ${error.toFixed(2)}，旋转 ${params.rotation}°。`
      : `当前旋转 ${params.rotation}°，示意对齐误差 ${error.toFixed(2)}。`;
  }
  return pointCloudInteraction.completed
    ? `Illustrative registration complete. Simulated alignment error ${error.toFixed(2)} at ${params.rotation}° rotation.`
    : `Current rotation ${params.rotation}°. Simulated alignment error ${error.toFixed(2)}.`;
}

function vprPlaceName(place) {
  const names = { Gate: '大门', Quad: '广场', Bridge: '桥梁', Road: '道路', Corner: '转角', Hall: '大厅' };
  return currentLang === 'zh' ? names[place.name] : place.name;
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
    ? `当前匹配 ${candidate.id}（${vprPlaceName(candidate)}），示意相似度 ${confidence}%，不是实测置信度。`
    : `Current match ${candidate.id} (${vprPlaceName(candidate)}), illustrative similarity ${confidence}%, not measured confidence.`;
}

function agentStageLabel() {
  return {
    request: say('Waiting', '等待'),
    work: say('Processing', '处理中'),
    deliver: say('Complete', '已完成')
  }[agentInteraction.selectedStage];
}

function agentStatusText() {
  const task = humanAiScenario();
  const detail = agentInteraction.selectedStage === 'request'
    ? say('Request received; retrieval has not started.', '已收到任务，尚未检索。')
    : agentInteraction.selectedStage === 'work'
      ? say('Two fixture excerpts retrieved; result not yet compiled.', '已检索两条预设片段，尚未整理结果。')
      : say('Result compiled from excerpts S1 and S2.', '已根据片段 S1、S2 整理结果。');
  return `${localized(task.title)} · ${agentStageLabel()}. ${detail}`;
}

function educationFeedbackText() {
  const exercise = educationConceptForSelected();
  if (educationInteraction.selectedSignal === 'correct') return say('Correct. ', '回答正确。') + localized(exercise.explanation);
  if (educationInteraction.selectedSignal === 'incorrect') return say('Not quite. ', '回答不正确。') + localized(exercise.hint);
  if (educationInteraction.selectedSignal === 'empty') return say('Choose an answer before submitting.', '请先选择答案再提交。');
  return say('Awaiting an answer.', '等待作答。');
}

function educationStatusText() {
  const announceHint = educationInteraction.hintVisible && !['correct', 'incorrect'].includes(educationInteraction.selectedSignal);
  return `${localized(educationConceptForSelected().label)} · ${educationFeedbackText()}${announceHint ? ' ' + localized(educationConceptForSelected().hint) : ''}`;
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
  const agentAction = agentInteraction.selectedStage === 'request'
    ? say('Retrieve excerpts', '检索片段')
    : agentInteraction.selectedStage === 'work' ? say('Compile result', '整理结果') : say('Next task', '下一任务');
  return {
    'point-cloud': [say('Rotate', '旋转'), say('Register', '执行配准'), say('Reset', '重置')],
    vpr: [say('Previous', '前一候选'), say('Next', '下一候选'), say('Reset', '重置')],
    'medical-image': [say('Previous sample', '前一样本'), say('Annotate', '标注样本'), say('Reset', '重置')],
    agent: [say('Previous task', '前一任务'), agentAction, say('Reset task', '重置任务')],
    education: [say('Previous exercise', '前一练习'), educationInteraction.selectedSignal === 'correct' ? say('Next exercise', '下一练习') : say('Submit answer', '提交答案'), say('Reset', '重置')]
  }[type] || [];
}

function createDemoContent() {
  if (!controlsContainer) return null;
  const make = (tag, className, parent) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    parent?.append(node);
    return node;
  };
  const root = make('div', 'research-demo-content');
  root.tabIndex = 0;
  controlsContainer.classList.add('research-demo-controls');
  controlsContainer.prepend(root);
  const note = make('p', 'research-demo-note', root);
  const pickerLabel = make('label', 'research-demo-picker', root);
  const pickerTitle = make('span', '', pickerLabel);
  const picker = make('select', '', pickerLabel);
  picker.dataset.demoPicker = '';
  const agent = make('div', 'research-demo-agent', root);
  const requestTitle = make('strong', '', agent);
  const request = make('p', '', agent);
  const excerptsTitle = make('strong', '', agent);
  const excerpts = make('ul', 'research-demo-excerpts', agent);
  const excerptItems = [make('li', '', excerpts), make('li', '', excerpts)];
  const resultTitle = make('strong', '', agent);
  const result = make('p', 'research-demo-result', agent);
  const exercise = make('fieldset', 'research-demo-exercise', root);
  const question = make('legend', '', exercise);
  const choices = make('div', 'research-demo-choices', exercise);
  const answers = Array.from({ length: 3 }, () => {
    const label = make('label', 'research-demo-choice', choices);
    const input = make('input', '', label);
    input.type = 'radio';
    input.name = 'research-demo-answer';
    input.setAttribute('aria-describedby', 'interestCanvasStatus');
    const text = make('span', '', label);
    input.addEventListener('change', () => {
      educationInteraction.answer = input.value;
      educationInteraction.selectedSignal = 'unanswered';
      commitInterestDemoControl();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      runEducationAction();
      commitInterestDemoControl();
    });
    return { input, text };
  });
  const feedback = make('p', 'research-demo-feedback', exercise);
  const hintButton = make('button', 'btn btn-outline research-demo-hint', exercise);
  hintButton.type = 'button';
  hintButton.dataset.demoHint = '';
  const hint = make('p', 'research-demo-hint-text', exercise);
  hint.id = 'research-demo-hint-text';
  hintButton.setAttribute('aria-controls', hint.id);
  hintButton.addEventListener('click', () => {
    requestEducationHint();
    commitInterestDemoControl();
  });
  picker.addEventListener('change', () => {
    if (isAgentInterestActive()) selectAgentTask(Number(picker.value));
    else if (isEducationInterestActive()) selectEducationExercise(picker.value);
    commitInterestDemoControl();
  });
  return { root, note, pickerLabel, pickerTitle, picker, agent, requestTitle, request, excerptsTitle, excerpts, excerptItems, resultTitle, result, exercise, question, answers, feedback, hintButton, hint };
}

function updateDemoContent(type) {
  if (!demoContent) return;
  const ui = demoContent;
  const known = ['point-cloud', 'vpr', 'medical-image', 'agent', 'education'].includes(type);
  ui.root.hidden = !known;
  if (!known) return;
  controlsContainer.setAttribute('aria-label', say('Research demo controls', '研究演示控件'));
  ui.root.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  ui.root.setAttribute('aria-label', say('Demo content', '演示内容'));
  ui.note.textContent = type === 'medical-image'
    ? say('Synthetic scans and illustrative uncertainty; no clinical inference.', '合成影像与示意不确定度，不作临床推断。')
    : type === 'point-cloud' || type === 'vpr'
      ? say('Concept demo · synthetic data and illustrative values.', '概念示意 · 合成数据与示意数值。')
      : say('Deterministic concept demo · preset content, no external AI.', '确定性概念示意 · 预设内容，不连接外部 AI。');
  const hasPicker = type === 'agent' || type === 'education';
  ui.pickerLabel.hidden = !hasPicker;
  ui.agent.hidden = type !== 'agent';
  ui.exercise.hidden = type !== 'education';
  if (!hasPicker) {
    ui.root.dataset.scrollState = type;
    ui.root.scrollTop = 0;
    return;
  }
  let scrollTarget;
  let scrollState;
  const items = type === 'agent' ? humanAiCollabScenarios : educationConcepts;
  if (ui.root.dataset.type !== type) {
    ui.picker.replaceChildren(...items.map((item, index) => {
      const option = document.createElement('option');
      option.value = type === 'agent' ? String(index) : item.id;
      return option;
    }));
    ui.root.dataset.type = type;
  }
  Array.from(ui.picker.options).forEach((option, index) => {
    option.textContent = localized(type === 'agent' ? items[index].title : items[index].label);
  });
  ui.pickerTitle.textContent = type === 'agent' ? say('Task', '任务') : say('Exercise', '练习');
  if (type === 'agent') {
    const task = humanAiScenario();
    const retrieved = agentInteraction.selectedStage !== 'request';
    ui.root.dataset.stage = agentInteraction.selectedStage;
    ui.picker.value = String(agentInteraction.taskIndex);
    ui.requestTitle.textContent = say('Human request', '人类任务');
    ui.request.textContent = localized(task.request);
    ui.excerptsTitle.textContent = say('Retrieved excerpts · local fixtures', '检索片段 · 本地预设');
    ui.excerptsTitle.hidden = !retrieved;
    ui.excerpts.hidden = !retrieved;
    ui.excerptItems.forEach((item, index) => {
      item.textContent = retrieved ? `[${task.snippets[index].id}] ${localized(task.snippets[index].text)}` : '';
    });
    ui.resultTitle.textContent = say('Result', '实质结果');
    ui.resultTitle.hidden = !agentInteraction.completed;
    ui.result.hidden = !agentInteraction.completed;
    ui.result.textContent = agentInteraction.completed ? localized(task.result) : '';
    scrollState = `${type}:${task.id}:${agentInteraction.selectedStage}`;
    scrollTarget = agentInteraction.completed ? ui.resultTitle : retrieved ? ui.excerptsTitle : null;
  } else {
    const exercise = educationConceptForSelected();
    ui.picker.value = exercise.id;
    ui.question.textContent = localized(exercise.question);
    ui.answers.forEach(({ input, text }, index) => {
      const choice = exercise.choices[index];
      input.value = choice.id;
      input.checked = educationInteraction.answer === choice.id;
      text.textContent = localized(choice.text);
    });
    ui.exercise.setAttribute('aria-invalid', String(['empty', 'incorrect'].includes(educationInteraction.selectedSignal)));
    ui.feedback.hidden = educationInteraction.selectedSignal === 'unanswered';
    ui.feedback.textContent = ui.feedback.hidden ? '' : educationFeedbackText();
    ui.hintButton.textContent = say('Hint', '提示');
    ui.hintButton.setAttribute('aria-expanded', String(educationInteraction.hintVisible));
    ui.hint.hidden = !educationInteraction.hintVisible;
    ui.hint.textContent = educationInteraction.hintVisible ? localized(exercise.hint) : '';
    scrollState = `${type}:${exercise.id}:${educationInteraction.selectedSignal}:${educationInteraction.hintVisible}`;
    scrollTarget = !ui.feedback.hidden ? ui.feedback : educationInteraction.hintVisible ? ui.hint : null;
  }
  if (ui.root.dataset.scrollState !== scrollState) {
    ui.root.dataset.scrollState = scrollState;
    // Scroll only this bounded panel, leaving the page and action buttons stable.
    ui.root.scrollTop = scrollTarget
      ? ui.root.scrollTop + scrollTarget.getBoundingClientRect().top - ui.root.getBoundingClientRect().top - 8
      : 0;
  }
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
  const status = interestDemoStatusText(type);
  if (interestCanvasStatus) {
    interestCanvasStatus.tabIndex = 0;
    if (interestCanvasStatus.textContent !== status) interestCanvasStatus.textContent = status;
  }
  updateDemoContent(type);
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

function selectAgentTask(index) {
  agentInteraction.taskIndex = (index + humanAiCollabScenarios.length) % humanAiCollabScenarios.length;
  agentInteraction.selectedStage = 'request';
  agentInteraction.completed = false;
  agentInteraction.active = true;
  agentInteraction.pulse = 1;
}

function selectPreviousAgentTask() {
  selectAgentTask(agentInteraction.taskIndex - 1);
}

function runNextAgentStage() {
  agentInteraction.selectedStage = nextAgentStage(agentInteraction.selectedStage);
  agentInteraction.completed = agentInteraction.selectedStage === 'deliver';
  agentInteraction.active = true;
  agentInteraction.pulse = 1;
}

function selectEducationExercise(id) {
  educationInteraction.selectedConcept = id;
  educationInteraction.selectedSignal = 'unanswered';
  educationInteraction.answer = '';
  educationInteraction.hintVisible = false;
  educationInteraction.active = true;
  educationInteraction.pulse = 1;
}

function selectPreviousEducationExercise() {
  const current = educationConcepts.findIndex((concept) => concept.id === educationInteraction.selectedConcept);
  selectEducationExercise(educationConcepts[(current - 1 + educationConcepts.length) % educationConcepts.length].id);
}

function requestEducationHint() {
  educationInteraction.hintVisible = true;
  educationInteraction.pulse = 1;
}

function runEducationAction() {
  if (educationInteraction.selectedSignal === 'correct') {
    const current = educationConcepts.findIndex((concept) => concept.id === educationInteraction.selectedConcept);
    selectEducationExercise(educationConcepts[(current + 1) % educationConcepts.length].id);
  } else {
    educationInteraction.selectedSignal = evaluateAnswer(educationInteraction.selectedConcept, educationInteraction.answer);
    educationInteraction.pulse = 1;
  }
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
    if (agentInteraction.completed) selectAgentTask(agentInteraction.taskIndex + 1);
    else runNextAgentStage();
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
    selectEducationExercise('functions');
    educationInteraction.hoverType = null;
    educationInteraction.hoverId = null;
    educationInteraction.pulse = 0;
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
    .map((place) => {
      const spatial = Math.max(0, 1 - Math.abs(vprInteraction.route - place.u) / 0.32);
      const appearance = Math.max(0, 1 - Math.abs(vprInteraction.condition - place.condition) / 0.82);
      return {
        ...place,
        score: clamp01(spatial * 0.78 + appearance * 0.22)
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
    { type: 'human', item: { ...layout.human, x: layout.human.x - layout.human.w / 2, y: layout.human.y - layout.human.h / 2 } },
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

const educationConcepts = EDUCATION_EXERCISES;

function educationConceptForSelected() {
  return educationConcepts.find((concept) => concept.id === educationInteraction.selectedConcept) || educationConcepts[1];
}

function educationHitRegion(event) {
  const { x, y } = interestPointer(event);
  const layout = robotTeacherLayout(interestCanvasSize.width, interestCanvasSize.height);
  const regions = [
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

const humanAiCollabScenarios = AGENT_TASKS;

const humanAiStages = [
  { id: 'request', label: 'Human request' },
  { id: 'work', label: 'AI working' },
  { id: 'deliver', label: 'Result delivered' }
];

function humanAiScenario() {
  return humanAiCollabScenarios[agentInteraction.taskIndex % humanAiCollabScenarios.length] || humanAiCollabScenarios[0];
}

function humanAiCollabLayout(width, height) {
  const compact = width < 540;
  const centerY = height * 0.49;
  return {
    compact,
    human: { id: 'human', x: width * 0.17, y: centerY, w: compact ? 60 : 90, h: compact ? 90 : 124 },
    ai: { id: 'ai', x: width * 0.5, y: centerY - 4, r: compact ? 27 : 40 },
    output: { id: 'output', x: width * 0.72, y: centerY - 43, w: width * 0.24, h: 90 }
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
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(say('Human', '人类'), x, y + figure.h * 0.49 + 16);
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
  drawRoundedRect(ctx, output.x, output.y, output.w, output.h, 8);
  ctx.fillStyle = active ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.055)';
  ctx.fill();
  ctx.strokeStyle = active ? secondary : muted;
  ctx.lineWidth = active ? 2 : 1;
  ctx.stroke();
  ctx.fillStyle = active ? secondary : muted;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(say('Result', '结果'), output.x + output.w / 2, output.y + 22);
  ctx.strokeStyle = active ? primary : muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (active) {
    ctx.moveTo(output.x + output.w * 0.28, output.y + 48);
    ctx.lineTo(output.x + output.w * 0.44, output.y + 60);
    ctx.lineTo(output.x + output.w * 0.73, output.y + 37);
  } else {
    ctx.moveTo(output.x + output.w * 0.3, output.y + 48);
    ctx.lineTo(output.x + output.w * 0.7, output.y + 48);
  }
  ctx.stroke();
  ctx.fillText(active ? say('Complete', '已完成') : say('Pending', '待生成'), output.x + output.w / 2, output.y + 79);
  ctx.restore();
}

function drawHumanAiCollab(width, height, t, primary, secondary, muted) {
  const layout = humanAiCollabLayout(width, height);
  const textColor = themeColor('--text') || '#f5f5f5';
  const stage = agentInteraction.selectedStage;
  // Motion decorates the explicit step; elapsed frames never advance the task.
  const processing = stage === 'work';
  agentInteraction.pulse *= 0.86;
  drawHumanFigure(interestCtx, layout.human, primary, secondary, muted, stage === 'request');
  drawAiAssistant(interestCtx, layout.ai, primary, secondary, textColor, processing ? 0.2 + agentInteraction.pulse * 0.2 : 0);
  drawOutputArtifact(interestCtx, layout.output, humanAiScenario(), primary, secondary, muted, textColor, stage === 'deliver');
  if (processing) {
    for (let i = 0; i < 4; i += 1) {
      const a = t + i * Math.PI / 2;
      interestCtx.beginPath();
      interestCtx.arc(layout.ai.x + Math.cos(a) * (layout.ai.r + 12), layout.ai.y + Math.sin(a) * (layout.ai.r + 12), 2.5, 0, Math.PI * 2);
      interestCtx.fillStyle = i % 2 ? secondary : primary;
      interestCtx.fill();
    }
  }
  interestCtx.fillStyle = textColor;
  interestCtx.font = '14px sans-serif';
  interestCtx.textAlign = 'center';
  interestCtx.fillText(agentStageLabel(), width / 2, height - 22);
  interestCtx.textAlign = 'left';
}

function robotTeacherLayout(width, height) {
  const compact = width < 540;
  const robotHeight = Math.min(compact ? 118 : 140, height * 0.46);
  return {
    compact,
    robot: { id: 'robot', x: width * 0.22, y: height * 0.34, w: Math.min(robotHeight * 0.8, width * 0.3), h: robotHeight },
    student: { id: 'student', compact, x: width * 0.22, y: height * 0.78, w: compact ? 66 : 88, h: Math.min(78, height * 0.26) },
    board: { id: 'board', x: width * 0.44, y: 24, w: width * 0.52, h: height - 60 }
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
  ctx.font = '13px sans-serif';
  if (!student.compact && w > 86) {
    ctx.fillText(say('Learner', '学生'), x, y + h * 0.58);
  }
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawClassroomBoard(ctx, board, concept, primary, secondary, muted, textColor) {
  drawRoundedRect(ctx, board.x, board.y, board.w, board.h, 8);
  ctx.fillStyle = 'rgba(3,7,18,0.72)';
  ctx.fill();
  ctx.strokeStyle = primary;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = secondary;
  ctx.font = '14px sans-serif';
  ctx.fillText(localized(concept.label), board.x + 12, board.y + 28);
  ctx.fillStyle = textColor;
  ctx.font = '14px sans-serif';
  // Split formulas at spaces on narrow boards; the full question stays in semantic DOM.
  let line = '';
  let y = board.y + 57;
  for (const word of concept.formula.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > board.w - 24) {
      ctx.fillText(line, board.x + 12, y);
      y += 21;
      line = word;
    } else line = next;
  }
  ctx.fillText(line, board.x + 12, y);
  const signal = educationInteraction.selectedSignal;
  ctx.fillStyle = signal === 'correct' ? primary : muted;
  ctx.font = '13px sans-serif';
  ctx.fillText(signal === 'correct' ? say('Correct', '回答正确') : signal === 'incorrect' ? say('Try again', '再试一次') : say('Your turn', '请作答'), board.x + 12, board.y + board.h - 18);
}

function drawRobotTeacherClassroom(width, height, t, primary, secondary, muted) {
  const layout = robotTeacherLayout(width, height);
  const textColor = themeColor('--text') || '#f5f5f5';
  educationInteraction.pulse *= 0.86;
  drawEducationStageBackdrop(interestCtx, width, height, layout, primary, secondary);
  drawClassroomBoard(interestCtx, layout.board, educationConceptForSelected(), primary, secondary, muted, textColor);
  drawStudentDesk(interestCtx, layout.student, primary, secondary, muted, textColor, educationInteraction.hoverType === 'student');
  drawRobotTeacher(interestCtx, layout.robot, primary, secondary, textColor, educationInteraction.pulse > 0.12 || educationInteraction.hoverType === 'robot');
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
    ctx.font = '12px sans-serif';
    ctx.fillText(sample.id, tile.x + 5, tile.y + 14);
    const meterWidth = Math.max(8, tile.w - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(tile.x + 5, tile.y + tile.h - 5, meterWidth, 2);
    ctx.fillStyle = labeled ? primary : sample.uncertainty > 0.7 ? secondary : muted;
    ctx.fillRect(tile.x + 5, tile.y + tile.h - 5, meterWidth * (labeled ? 0.16 : sample.uncertainty), 2);
  }
}

function drawMedicalActiveLearning(width, height, t, primary, secondary, muted) {
  const layout = medicalActiveLearningLayout(width, height);
  const sample = medicalCases[medicalInteraction.selected] || medicalCases[0];
  const labeled = medicalInteraction.labeled.has(medicalInteraction.selected);
  medicalInteraction.pulse *= 0.9;
  interestCtx.fillStyle = muted;
  interestCtx.font = '13px sans-serif';
  interestCtx.fillText(say('Synthetic scan pool', '合成影像样本池'), layout.compact ? 10 : 16, 22);
  layout.tiles.forEach((tile) => {
    drawMedicalScan(interestCtx, tile, tile, {
      selected: tile.index === medicalInteraction.selected || tile.index === medicalInteraction.hoverIndex,
      labeled: medicalInteraction.labeled.has(tile.index), primary, secondary, muted
    });
  });
  const detail = layout.detail;
  if (!layout.compact) {
    drawMedicalScan(interestCtx, { x: detail.x + detail.w * 0.1, y: detail.y, w: detail.w * 0.8, h: detail.h * 0.52 }, sample,
      { selected: true, labeled, large: true, primary, secondary, muted });
  }
  const y = layout.compact ? detail.y + 16 : detail.y + detail.h * 0.64;
  interestCtx.fillStyle = labeled ? primary : secondary;
  interestCtx.font = '13px sans-serif';
  interestCtx.fillText(`${sample.id} · ${labeled ? medicalFindingLabel(sample) : say('Unlabeled', '待标注')}`, detail.x, y);
  interestCtx.fillStyle = muted;
  interestCtx.fillText(say(`Labeled ${medicalInteraction.labeled.size}/${medicalCases.length}`, `已标注 ${medicalInteraction.labeled.size}/${medicalCases.length}`), detail.x, y + 23);
  if (medicalInteraction.pulse > 0.02) {
    const tile = layout.tiles[medicalInteraction.selected];
    drawRoundedRect(interestCtx, tile.x - 2, tile.y - 2, tile.w + 4, tile.h + 4, 8);
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
    const compact = width < 540;
    const cardCount = compact ? 3 : 5;
    const cardY = height * 0.68;
    const cardGap = 8;
    const cardWidth = Math.min(92, (width - 32 - cardGap * (cardCount - 1)) / cardCount);
    const cardHeight = Math.min(72, height * 0.27);
    const startX = (width - cardWidth * cardCount - cardGap * (cardCount - 1)) / 2;

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
      interestCtx.font = '12px sans-serif';
      if (!compact || isBest || isSelected) interestCtx.fillText(place.id, point.x - 16, point.y - 14);
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

    const queryPanelX = 16;
    const queryPanelY = 12;
    drawRoundedRect(interestCtx, queryPanelX, queryPanelY, 84, 42, 8);
    interestCtx.fillStyle = `rgba(3, 7, 18, ${0.66 + conditionTint * 0.18})`;
    interestCtx.fill();
    interestCtx.strokeStyle = secondary;
    interestCtx.stroke();
    interestCtx.fillStyle = primary;
    interestCtx.font = '13px sans-serif';
    interestCtx.fillText(say('Query', '查询'), queryPanelX + 10, queryPanelY + 17);
    interestCtx.fillStyle = muted;
    interestCtx.fillText(conditionTint < 0.34 ? say('Day', '白天') : conditionTint < 0.68 ? say('Shift', '变化') : say('Night', '夜间'), queryPanelX + 10, queryPanelY + 31);

    candidates.slice(0, cardCount).forEach((candidate, index) => {
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
      interestCtx.font = '12px sans-serif';
      interestCtx.fillText(candidate.id, x + 8, y + 14);
      interestCtx.fillStyle = muted;
      interestCtx.fillText(vprPlaceName(candidate), x + 8, y + cardHeight - 18);

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

    const scoreX = width - 128;
    const scoreY = 12;
    drawRoundedRect(interestCtx, scoreX, scoreY, 112, 42, 8);
    interestCtx.fillStyle = 'rgba(3, 7, 18, 0.58)';
    interestCtx.fill();
    interestCtx.strokeStyle = 'rgba(255,255,255,0.16)';
    interestCtx.stroke();
    interestCtx.fillStyle = secondary;
    interestCtx.font = '13px sans-serif';
    interestCtx.fillText(say('Best match', '最佳匹配'), scoreX + 12, scoreY + 18);
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
  pointCloudInteraction.completed = pointCloudInteraction.x >= 0.999;
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
  if (hit?.type === 'human') selectAgentTask(agentInteraction.taskIndex);
  else if (hit?.type === 'ai') runNextAgentStage();
  else if (hit?.type === 'output' && agentInteraction.selectedStage === 'work') runNextAgentStage();
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
  if (hit?.type === 'robot' || hit?.type === 'board') requestEducationHint();
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
      if (nextVisible && isResearchViewActive() && document.visibilityState === 'visible') {
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
