const language = value => String(value).toLowerCase().startsWith('zh') ? 'zh' : 'en';
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

const COPY = freeze({
  en: {
    vpr: 'Street match', medical: 'Annotation desk', reset: 'Reset', next: 'Next place',
    reference: 'Reference', choices: 'Same place?', day: 'Day', night: 'Night',
    front: 'Street level', left: 'From the left', right: 'From the right',
    same: 'Same place', different: 'Lookalike, different place', pending: 'No place selected',
    clock: 'Clock', entry: 'Entrance', canopy: 'Awning', round: 'Round clock',
    square: 'Square clock', arch: 'One arched doorway', twin: 'Two square doorways',
    striped: 'Striped awning', plain: 'Plain awning', match: 'Matches', differs: 'Different',
    landmarks: 'Landmark correspondence', candidate: 'View', roundLabel: 'Place',
    pool: 'Unlabeled pool', all: 'All', clear: 'Clear', ambiguous: 'Obscured',
    filter: 'Image condition', budget: 'Annotation budget', remaining: 'remaining',
    specimen: 'Specimen', single: 'Single', lobed: 'Lobed', unsure: 'Unclear',
    singleFull: 'Single nucleus', lobedFull: 'Lobed nucleus', unsureFull: 'Unclear shape',
    crisp: 'Distinct boundary', overlap: 'Overlapping cells', faint: 'Faint boundary',
    label: 'Nucleus shape', unlabeled: 'Unlabeled', yourLabel: 'Your label', key: 'Synthetic key',
    undo: 'Undo label', exhausted: 'Budget used', labeled: 'Labeled',
    observed: 'Observed', revealed: 'Outline revealed', noSamples: 'No samples',
    learning: 'ACTIVE LEARNING', singleObservation: 'One closed oval nucleus, with a distinct edge.',
    lobedObservation: 'Three connected nuclear lobes, with a distinct edge.',
    overlapObservation: 'An irregular nuclear contour, partly covered by another cell.',
    faintObservation: 'A pale oval nuclear contour, with an indistinct edge.',
    votes: 'Mock model votes', voteClasses: 'Single / Lobed', query: 'Query uncertain',
    split: 'Split votes', mixed: 'Mixed votes', unanimous: 'Unanimous votes', acquired: 'Labeled query set',
    vprDisclaimer: 'Synthetic scenes. No measured or model results.',
    medDisclaimer: 'Synthetic specimens and votes. No trained-model or clinical results.'
  },
  zh: {
    vpr: '\u8857\u666f\u914d\u5bf9', medical: '\u6807\u6ce8\u5de5\u4f5c\u53f0', reset: '\u91cd\u7f6e', next: '\u4e0b\u4e00\u5730\u70b9',
    reference: '\u53c2\u8003\u8857\u666f', choices: '\u54ea\u5f20\u662f\u540c\u4e00\u5730\u70b9\uff1f', day: '\u767d\u5929', night: '\u591c\u665a',
    front: '\u6b63\u9762\u89c6\u89d2', left: '\u5de6\u4fa7\u89c6\u89d2', right: '\u53f3\u4fa7\u89c6\u89d2',
    same: '\u540c\u4e00\u5730\u70b9', different: '\u76f8\u4f3c\u8857\u666f\uff0c\u4e0d\u540c\u5730\u70b9', pending: '\u5c1a\u672a\u9009\u62e9\u5730\u70b9',
    clock: '\u949f\u697c', entry: '\u5165\u53e3', canopy: '\u906e\u9633\u7bf7', round: '\u5706\u5f62\u65f6\u949f',
    square: '\u65b9\u5f62\u65f6\u949f', arch: '\u5355\u4e2a\u62f1\u5f62\u95e8\u6d1e', twin: '\u4e24\u4e2a\u65b9\u5f62\u95e8\u6d1e',
    striped: '\u6761\u7eb9\u906e\u9633\u7bf7', plain: '\u7eaf\u8272\u906e\u9633\u7bf7', match: '\u4e00\u81f4', differs: '\u4e0d\u540c',
    landmarks: '\u5730\u6807\u5bf9\u5e94', candidate: '\u5019\u9009', roundLabel: '\u5730\u70b9',
    pool: '\u672a\u6807\u6ce8\u6837\u672c\u6c60', all: '\u5168\u90e8', clear: '\u6e05\u6670', ambiguous: '\u53d7\u906e\u853d',
    filter: '\u56fe\u50cf\u6761\u4ef6', budget: '\u6807\u6ce8\u9884\u7b97', remaining: '\u5269\u4f59',
    specimen: '\u6837\u672c', single: '\u5355\u6838', lobed: '\u5206\u53f6', unsure: '\u4e0d\u786e\u5b9a',
    singleFull: '\u5355\u4e2a\u7ec6\u80de\u6838', lobedFull: '\u5206\u53f6\u7ec6\u80de\u6838', unsureFull: '\u5f62\u6001\u4e0d\u786e\u5b9a',
    crisp: '\u8fb9\u754c\u6e05\u6670', overlap: '\u7ec6\u80de\u91cd\u53e0', faint: '\u8fb9\u754c\u6d45\u6de1',
    label: '\u7ec6\u80de\u6838\u5f62\u6001', unlabeled: '\u672a\u6807\u6ce8', yourLabel: '\u4f60\u7684\u6807\u6ce8', key: '\u5408\u6210\u6807\u51c6',
    undo: '\u64a4\u9500\u6807\u6ce8', exhausted: '\u9884\u7b97\u5df2\u7528\u5b8c', labeled: '\u5df2\u6807\u6ce8',
    observed: '\u89c2\u5bdf\u56fe\u50cf', revealed: '\u8f6e\u5ed3\u5df2\u663e\u793a', noSamples: '\u6682\u65e0\u6837\u672c',
    learning: '\u4e3b\u52a8\u5b66\u4e60', singleObservation: '\u4e00\u4e2a\u5c01\u95ed\u7684\u692d\u5706\u5f62\u7ec6\u80de\u6838\uff0c\u8fb9\u754c\u6e05\u6670\u3002',
    lobedObservation: '\u4e09\u4e2a\u76f8\u8fde\u7684\u6838\u53f6\uff0c\u8fb9\u754c\u6e05\u6670\u3002',
    overlapObservation: '\u4e0d\u89c4\u5219\u7684\u6838\u8f6e\u5ed3\uff0c\u90e8\u5206\u88ab\u53e6\u4e00\u7ec6\u80de\u906e\u6321\u3002',
    faintObservation: '\u6d45\u6de1\u7684\u692d\u5706\u5f62\u6838\u8f6e\u5ed3\uff0c\u8fb9\u754c\u4e0d\u6e05\u3002',
    votes: '\u793a\u610f\u6a21\u578b\u6295\u7968', voteClasses: '\u5355\u6838 / \u5206\u53f6', query: '\u67e5\u8be2\u9ad8\u5206\u6b67\u6837\u672c',
    split: '\u6295\u7968\u6301\u5e73', mixed: '\u6295\u7968\u6709\u5206\u6b67', unanimous: '\u6295\u7968\u4e00\u81f4', acquired: '\u5df2\u6807\u6ce8\u67e5\u8be2\u96c6',
    vprDisclaimer: '\u5408\u6210\u8857\u666f\uff0c\u975e\u5b9e\u6d4b\u6216\u6a21\u578b\u7ed3\u679c\u3002',
    medDisclaimer: '\u5408\u6210\u6837\u672c\u4e0e\u793a\u610f\u6295\u7968\uff0c\u975e\u8bad\u7ec3\u6a21\u578b\u8f93\u51fa\u6216\u4e34\u5e8a\u7ed3\u679c\u3002'
  }
});

export const VPR_LANDMARKS = freeze(['clock', 'entry', 'canopy']);
export const VPR_ROUNDS = freeze([
  {
    id: 'arcade', palette: 0, reference: { clock: 'round', entry: 'arch', canopy: 'striped' },
    view: { time: 'day', angle: 'front' },
    candidates: [
      { id: 'A', time: 'night', angle: 'right', clock: 'square', entry: 'arch', canopy: 'striped' },
      { id: 'B', time: 'night', angle: 'left', clock: 'round', entry: 'arch', canopy: 'striped' },
      { id: 'C', time: 'day', angle: 'right', clock: 'round', entry: 'twin', canopy: 'plain' }
    ]
  },
  {
    id: 'junction', palette: 1, reference: { clock: 'square', entry: 'twin', canopy: 'striped' },
    view: { time: 'night', angle: 'front' },
    candidates: [
      { id: 'A', time: 'day', angle: 'left', clock: 'square', entry: 'twin', canopy: 'striped' },
      { id: 'B', time: 'day', angle: 'right', clock: 'square', entry: 'arch', canopy: 'plain' },
      { id: 'C', time: 'night', angle: 'left', clock: 'round', entry: 'twin', canopy: 'striped' }
    ]
  },
  {
    id: 'terrace', palette: 2, reference: { clock: 'round', entry: 'twin', canopy: 'plain' },
    view: { time: 'day', angle: 'front' },
    candidates: [
      { id: 'A', time: 'night', angle: 'right', clock: 'round', entry: 'twin', canopy: 'striped' },
      { id: 'B', time: 'day', angle: 'left', clock: 'square', entry: 'arch', canopy: 'plain' },
      { id: 'C', time: 'night', angle: 'left', clock: 'round', entry: 'twin', canopy: 'plain' }
    ]
  }
]);

export function evaluatePlaceChoice(roundId, candidateId) {
  const round = VPR_ROUNDS.find(item => item.id === roundId);
  const candidate = round?.candidates.find(item => item.id === candidateId);
  if (!candidate) throw new RangeError('Unknown place or candidate');
  const landmarks = VPR_LANDMARKS.map(key => ({
    key, reference: round.reference[key], candidate: candidate[key],
    matches: round.reference[key] === candidate[key]
  }));
  return { samePlace: landmarks.every(item => item.matches), landmarks };
}

export const ANNOTATION_BUDGET = 3;
export const MEDICAL_LABELS = freeze(['single', 'lobed', 'unsure']);
export const MEDICAL_SAMPLES = freeze([
  { id: 'S01', seed: 11, shape: 'single', ambiguity: 'clear', reason: 'crisp', votes: [4, 0] },
  { id: 'S02', seed: 28, shape: 'lobed', ambiguity: 'ambiguous', reason: 'overlap', votes: [3, 1] },
  { id: 'S03', seed: 49, shape: 'lobed', ambiguity: 'clear', reason: 'crisp', votes: [2, 2] },
  { id: 'S04', seed: 63, shape: 'single', ambiguity: 'ambiguous', reason: 'faint', votes: [4, 0] },
  { id: 'S05', seed: 86, shape: 'single', ambiguity: 'clear', reason: 'crisp', votes: [3, 1] },
  { id: 'S06', seed: 107, shape: 'lobed', ambiguity: 'ambiguous', reason: 'overlap', votes: [2, 2] },
  { id: 'S07', seed: 134, shape: 'lobed', ambiguity: 'clear', reason: 'crisp', votes: [0, 4] },
  { id: 'S08', seed: 159, shape: 'single', ambiguity: 'ambiguous', reason: 'faint', votes: [1, 3] }
]);

// Fixed mock committee votes are independent of image condition and are never
// updated by annotation. Acquisition ranks disagreement, not visual obscurity.
export function rankUnlabeledSamples(state) {
  return MEDICAL_SAMPLES.filter(sample => !state.annotations[sample.id]).sort((a, b) =>
    Math.abs(a.votes[0] - a.votes[1]) - Math.abs(b.votes[0] - b.votes[1]) || a.id.localeCompare(b.id)
  );
}

export function createAnnotationState(budget = ANNOTATION_BUDGET) {
  if (!Number.isInteger(budget) || budget < 0 || budget > MEDICAL_SAMPLES.length) {
    throw new RangeError('Budget must be an integer within the sample pool');
  }
  return { budget, annotations: {} };
}

export function annotateSample(state, sampleId, label) {
  if (!MEDICAL_SAMPLES.some(item => item.id === sampleId) || !MEDICAL_LABELS.includes(label)) {
    throw new RangeError('Unknown sample or shape label');
  }
  if (state.annotations[sampleId] || Object.keys(state.annotations).length >= state.budget) return state;
  return { ...state, annotations: { ...state.annotations, [sampleId]: label } };
}

export function undoAnnotation(state, sampleId) {
  if (!state.annotations[sampleId]) return state;
  const annotations = { ...state.annotations };
  delete annotations[sampleId];
  return { ...state, annotations };
}

function polygon(ctx, points, fill, stroke) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function ellipse(ctx, x, y, rx, ry, fill, stroke, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function rect(ctx, x, y, width, height, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
}

function streetTransform(angle) {
  return angle === 'left' ? [0.85, -0.075, 0, 1, 95, 30]
    : angle === 'right' ? [0.92, 0.065, 0, 1, -15, -22]
      : [1, 0, 0, 1, 0, 0];
}

function landmarkBounds(key, angle) {
  const bounds = { clock: [331, 113, 68, 66], entry: [308, 244, 89, 101], canopy: [464, 243, 195, 42] };
  const [x, y, width, height] = bounds[key];
  const [a, b, , d, e, f] = streetTransform(angle);
  return {
    x: (a * x + e) / 8,
    y: (b * (b < 0 ? x + width : x) + d * y + f) / 4.6,
    width: a * width / 8,
    height: (d * height + Math.abs(b) * width) / 4.6
  };
}

// The same facade geometry is redrawn from three affine street viewpoints.
// Landmarks and their DOM overlays share the transform, including in night views.
function drawStreet(canvas, features, view, palette) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const night = view.time === 'night';
  const schemes = [
    { front: '#edc795', side: '#bd886c', shop: '#7babb0', awning: '#a34e49', roof: '#546b71' },
    { front: '#c5d6cd', side: '#879b9a', shop: '#dea3a1', awning: '#336b66', roof: '#78657c' },
    { front: '#e9b8b0', side: '#b48383', shop: '#9eb8d0', awning: '#5b748e', roof: '#626875' }
  ];
  const s = schemes[palette];
  const ink = night ? '#263643' : '#41535a';
  const glass = night ? '#ffda92' : '#668b99';
  ctx.clearRect(0, 0, 800, 460);
  rect(ctx, 0, 0, 800, 460, night ? '#223a50' : '#b4d8de');
  ellipse(ctx, night ? 674 : 112, 64, 24, 24, night ? '#f3e6be' : '#fff1b1');
  if (night) {
    for (let i = 0; i < 25; i++) ellipse(ctx, (i * 139 + 43) % 790, (i * 31 + 14) % 112, 1, 1, '#cfddd9');
  } else {
    for (const [x, y] of [[170, 69], [613, 87], [729, 45]]) {
      ellipse(ctx, x, y, 49, 9, '#e6eff0');
      ellipse(ctx, x - 16, y - 7, 25, 12, '#e6eff0');
    }
  }
  for (let i = 0; i < 10; i++) {
    const x = i * 89 - 20;
    const top = 108 + (i * 19) % 65;
    rect(ctx, x, top, 76, 155, night ? '#2c4759' : '#93b6ba');
    rect(ctx, x + 7, top - 5, 62, 5, night ? '#345064' : '#a2c1c0');
  }
  rect(ctx, 0, 299, 800, 161, night ? '#29383f' : '#72838a');
  polygon(ctx, [[0, 297], [800, 297], [800, 357], [0, 378]], night ? '#617078' : '#bac6c4');
  polygon(ctx, [[0, 378], [800, 357], [800, 365], [0, 387]], night ? '#869495' : '#e1e1d4');
  for (let i = 0; i < 5; i++) polygon(ctx, [[494 + i * 54, 390], [521 + i * 54, 389], [558 + i * 62, 453], [521 + i * 62, 455]], night ? '#95a09b' : '#e8e8d8');
  ctx.save();
  ctx.transform(...streetTransform(view.angle));
  // Shops, sidewalls and a stepped clock facade form an identifiable street corner.
  polygon(ctx, [[52, 139], [96, 114], [96, 331], [52, 344]], night ? '#42545a' : '#bd947a');
  rect(ctx, 96, 123, 123, 211, night ? '#847a71' : '#dec5ac');
  rect(ctx, 89, 116, 135, 13, s.roof);
  rect(ctx, 105, 136, 103, 9, night ? '#a4967f' : '#f4dac0');
  for (const y of [161, 218]) for (const x of [113, 168]) {
    rect(ctx, x - 4, y - 4, 33, 42, night ? '#ad9a7e' : '#f4dfbf');
    rect(ctx, x, y, 25, 34, glass);
    rect(ctx, x + 11, y, 3, 34, ink);
  }
  rect(ctx, 111, 279, 90, 55, ink);
  rect(ctx, 118, 288, 33, 42, glass);
  rect(ctx, 157, 288, 33, 42, glass);
  polygon(ctx, [[444, 98], [485, 123], [485, 331], [444, 342]], night ? '#6f6b67' : s.side);
  rect(ctx, 229, 106, 215, 235, night ? '#a2957b' : s.front);
  rect(ctx, 219, 97, 235, 13, s.roof);
  rect(ctx, 280, 84, 148, 20, night ? '#b0a086' : s.front);
  rect(ctx, 300, 74, 107, 13, s.roof);
  rect(ctx, 244, 176, 185, 7, night ? '#d2bc94' : '#f8e2bb');
  rect(ctx, 245, 231, 184, 7, night ? '#d2bc94' : '#f8e2bb');
  for (const x of [249, 406]) {
    rect(ctx, x, 113, 10, 221, night ? '#c0af8e' : '#f5dcb4');
    rect(ctx, x - 4, 329, 18, 12, s.side);
  }
  for (const x of [276, 329, 383]) {
    rect(ctx, x - 3, 190, 30, 36, ink);
    rect(ctx, x, 193, 24, 28, glass);
    rect(ctx, x + 10, 193, 3, 28, ink);
    rect(ctx, x - 5, 225, 34, 4, s.side);
  }
  ctx.lineWidth = 5;
  if (features.clock === 'round') ellipse(ctx, 365, 146, 24, 24, '#f6ecd2', ink);
  else { rect(ctx, 339, 120, 52, 52, ink); rect(ctx, 344, 125, 42, 42, '#f6ecd2'); }
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    ctx.beginPath(); ctx.moveTo(365 + Math.sin(a) * 17, 146 + Math.cos(a) * 17);
    ctx.lineTo(365 + Math.sin(a) * 20, 146 + Math.cos(a) * 20); ctx.stroke();
  }
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(365, 133); ctx.lineTo(365, 146); ctx.lineTo(377, 151); ctx.stroke();
  if (features.entry === 'arch') {
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(355, 280, 32, Math.PI, 0); ctx.lineTo(387, 338); ctx.lineTo(323, 338); ctx.closePath(); ctx.fill();
    rect(ctx, 331, 288, 48, 50, glass);
    rect(ctx, 353, 278, 4, 60, ink);
    rect(ctx, 324, 306, 61, 4, ink);
  } else {
    for (const x of [315, 360]) { rect(ctx, x, 252, 35, 86, ink); rect(ctx, x + 5, 260, 25, 70, glass); }
  }
  for (let i = 0; i < 3; i++) rect(ctx, 306 - i * 6, 336 + i * 5, 99 + i * 12, 4, night ? '#c1b79e' : '#f3dfbb');
  rect(ctx, 485, 182, 156, 155, night ? '#718b8e' : s.shop);
  polygon(ctx, [[641, 182], [686, 165], [686, 323], [641, 337]], night ? '#4b686b' : '#709497');
  rect(ctx, 478, 172, 171, 12, s.roof);
  for (const x of [502, 558, 607]) { rect(ctx, x, 199, 24, 34, ink); rect(ctx, x + 3, 202, 18, 27, glass); }
  rect(ctx, 500, 270, 123, 64, ink);
  for (const x of [506, 546, 586]) rect(ctx, x, 280, 30, 48, glass);
  polygon(ctx, [[486, 249], [634, 249], [653, 273], [472, 273]], s.awning);
  if (features.canopy === 'striped') {
    for (let i = 0; i < 7; i++) polygon(ctx, [[487 + i * 21, 249], [497 + i * 21, 249], [485 + i * 25, 273], [474 + i * 25, 273]], '#f4dfc4');
  }
  rect(ctx, 472, 273, 181, 7, s.awning);
  for (const x of [513, 603]) {
    rect(ctx, x, 339, 27, 12, ink); rect(ctx, x + 4, 325, 20, 17, '#778e67');
    ellipse(ctx, x + 13, 324, 17, 11, night ? '#477468' : '#548974');
  }
  // Street furniture and foliage are contextual distractors, not identity cues.
  rect(ctx, 709, 218, 5, 135, ink);
  polygon(ctx, [[696, 223], [726, 223], [723, 244], [699, 244]], night ? '#f8dc95' : '#d0d9cb', ink);
  polygon(ctx, [[694, 221], [711, 211], [729, 221]], ink);
  rect(ctx, 68, 256, 8, 105, '#655c52');
  for (const [x, y, r] of [[71, 245, 32], [49, 225, 28], [87, 215, 32], [65, 191, 30]]) {
    ellipse(ctx, x, y, r, r * 1.1, night ? '#3b6962' : '#548e76');
  }
  rect(ctx, 150, 348, 49, 6, '#805f58');
  rect(ctx, 153, 333, 43, 11, '#936e5f');
  rect(ctx, 155, 350, 4, 14, ink); rect(ctx, 190, 350, 4, 14, ink);
  ctx.restore();
  if (night) {
    ctx.globalAlpha = 0.13;
    polygon(ctx, [[255, 371], [409, 366], [466, 454], [198, 458]], '#f3d8a0');
    polygon(ctx, [[518, 368], [630, 365], [684, 425], [489, 432]], '#f3d8a0');
    ctx.globalAlpha = 1;
  }
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(1664525, value) + 1013904223) >>> 0; return value / 4294967296; };
}

function nucleusPath(ctx, shape, cx, cy, radius, phase) {
  ctx.beginPath();
  for (let i = 0; i <= 96; i++) {
    const angle = i / 96 * Math.PI * 2;
    const wobble = shape === 'lobed' ? 0.29 * Math.cos(3 * angle + phase) : 0.055 * Math.cos(5 * angle + phase);
    const r = radius * (1 + wobble);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r * 0.85;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawSpecimen(canvas, sample, revealed) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const random = seeded(sample.seed);
  const size = 480;
  ctx.clearRect(0, 0, size, size);
  rect(ctx, 0, 0, size, size, '#f0e9ed');
  for (let i = 0; i < 28; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = 12 + random() * 25;
    ellipse(ctx, x, y, r, r * 0.72, '#e1c5d1', '#cfa9be', random() * 2);
    ellipse(ctx, x + 2, y, r * 0.44, r * 0.32, '#cfacc6');
  }
  const cx = 237 + (sample.seed % 17) - 8;
  const cy = 240 + (sample.seed % 13) - 6;
  ellipse(ctx, cx + 3, cy + 3, 125, 116, '#e0bbd4');
  ctx.lineWidth = 3;
  ellipse(ctx, cx, cy, 121, 114, '#edd5e1', '#c797b5', 0.13);
  for (let i = 0; i < 110; i++) {
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * 105;
    ellipse(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1 + random() * 2.8, 1.5, '#cea3c1');
  }
  const phase = sample.seed * 0.4;
  ctx.save();
  nucleusPath(ctx, sample.shape, cx, cy, 65, phase);
  ctx.fillStyle = sample.reason === 'faint' && !revealed ? '#c8a7c6' : '#8a609b';
  ctx.fill();
  ctx.clip();
  for (let i = 0; i < 95; i++) {
    const x = cx - 85 + random() * 170;
    const y = cy - 75 + random() * 150;
    ellipse(ctx, x, y, 2 + random() * 5, 1 + random() * 4, sample.reason === 'faint' && !revealed ? '#bb9ebc' : '#68487c');
  }
  ctx.restore();
  if (sample.reason === 'overlap') {
    ctx.save();
    ctx.globalAlpha = revealed ? 0.22 : 0.9;
    ellipse(ctx, cx + 69, cy - 21, 76, 89, '#d9b2ce', '#b786ae', -0.4);
    ellipse(ctx, cx + 57, cy - 26, 38, 44, '#96709f', '#8a6697', -0.6);
    for (let i = 0; i < 26; i++) ellipse(ctx, cx + 33 + random() * 47, cy - 53 + random() * 54, 2, 2, '#78548b');
    ctx.restore();
  }
  if (sample.reason === 'faint' && !revealed) {
    ctx.save(); ctx.globalAlpha = 0.23;
    ellipse(ctx, cx - 23, cy - 8, 71, 78, '#edd5e1'); ctx.restore();
  }
  if (revealed) {
    nucleusPath(ctx, sample.shape, cx, cy, 65, phase);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = '#382f48'; ctx.lineWidth = 4; ctx.stroke();
  }
}

function disclaimer(type, locale) {
  const key = type === 'vpr' ? 'vprDisclaimer' : 'medDisclaimer';
  return `<p class="tp-disclaimer">${COPY[locale][key]}</p>`;
}

function createMount(root, className, lang) {
  if (!root?.ownerDocument || typeof root.replaceChildren !== 'function') throw new TypeError('A DOM root is required');
  const doc = root.ownerDocument;
  const shell = doc.createElement('section');
  shell.className = className;
  shell.lang = language(lang);
  const content = doc.createElement('div');
  const live = doc.createElement('div');
  live.className = 'tp-sr';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  shell.append(content, live);
  root.replaceChildren(shell);
  let destroyed = false;
  return {
    shell, content,
    get destroyed() { return destroyed; },
    render(html, paint) {
      if (destroyed) return;
      const active = shell.contains(doc.activeElement) ? doc.activeElement.dataset.control : null;
      content.innerHTML = html;
      paint?.();
      if (active) {
        const replacement = [...content.querySelectorAll('[data-control]')].find(node => node.dataset.control === active && !node.disabled);
        replacement?.focus({ preventScroll: true });
      }
    },
    announce(text) { if (!destroyed) live.textContent = text; },
    destroy() { destroyed = true; shell.remove(); }
  };
}

function streetDescription(features, view, t) {
  return `${t[view.time]}, ${t[view.angle]}. ${VPR_LANDMARKS.map(key => t[features[key]]).join('; ')}.`;
}

function markers(view, active) {
  return VPR_LANDMARKS.map((key, index) => {
    const box = landmarkBounds(key, view.angle);
    return `<span class="vp-region${active === key ? ' is-active' : ''}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%;height:${box.height}%" aria-hidden="true"><span class="vp-pin">${index + 1}</span></span>`;
  }).join('');
}

export function mountVpr(root, { lang = 'en' } = {}) {
  let locale = language(lang);
  let roundIndex = 0;
  let selected = null;
  let activeLandmark = 'clock';
  const mount = createMount(root, 'topic-vpr', locale);

  function render() {
    const t = COPY[locale];
    const round = VPR_ROUNDS[roundIndex];
    const choice = round.candidates.find(item => item.id === selected);
    const result = choice ? evaluatePlaceChoice(round.id, selected) : null;
    const reference = `<figure class="vp-reference"><div class="vp-picture"><canvas width="800" height="460" data-street="reference" role="img" aria-label="${streetDescription(round.reference, round.view, t)}"></canvas>${choice ? markers(round.view, activeLandmark) : ''}</div><figcaption><strong>${t.reference}</strong><span>${t[round.view.time]} / ${t[round.view.angle]}</span></figcaption></figure>`;
    const comparison = choice ? `<figure class="vp-comparison"><div class="vp-picture"><canvas width="800" height="460" data-street="comparison" role="img" aria-label="${streetDescription(choice, choice, t)}"></canvas>${markers(choice, activeLandmark)}</div><figcaption><strong>${t.candidate} ${selected}</strong><span>${t[choice.time]} / ${t[choice.angle]}</span></figcaption></figure>` : '';
    mount.shell.lang = locale;
    mount.shell.setAttribute('aria-label', t.vpr);
    mount.render(`
      <header class="tp-header"><div><span class="tp-kicker">VPR / ${t.roundLabel} ${String(roundIndex + 1).padStart(2, '0')}</span><h3>${t.vpr}</h3></div><button type="button" data-action="reset" data-control="reset" class="tp-reset">${t.reset}</button></header>
      ${disclaimer('vpr', locale)}
      <div class="vp-stage${choice ? ' has-selection' : ''}"><div class="vp-views${choice ? ' is-paired' : ''}">${reference}${comparison}</div>
      <fieldset class="vp-choices"><legend>${t.choices}</legend><div class="vp-contact-sheet">${round.candidates.map(item => `<button type="button" class="vp-choice" data-action="choose" data-id="${item.id}" data-control="choose-${item.id}" aria-pressed="${selected === item.id}"><span class="vp-picture"><canvas width="800" height="460" data-street="${item.id}" role="img" aria-label="${streetDescription(item, item, t)}"></canvas></span><span class="vp-choice-caption"><strong>${item.id}</strong><span>${t[item.time]} / ${t[item.angle]}</span></span></button>`).join('')}</div></fieldset>
      </div>
      <div class="vp-result${result ? (result.samePlace ? ' is-match' : ' is-different') : ''}" data-result="${result ? (result.samePlace ? 'same' : 'different') : 'pending'}"><strong>${result ? `${selected} / ${result.samePlace ? t.same : t.different}` : t.pending}</strong><button type="button" data-action="next" data-control="next">${t.next}</button></div>
      ${result ? `<section class="vp-evidence" aria-label="${t.landmarks}"><h4>${t.landmarks}</h4><div class="vp-evidence-head" aria-hidden="true"><span></span><span>${t.reference}</span><span>${t.candidate} ${selected}</span></div>${result.landmarks.map((item, index) => `<button type="button" class="vp-landmark" data-action="landmark" data-id="${item.key}" data-control="landmark-${item.key}" aria-pressed="${activeLandmark === item.key}" aria-label="${index + 1}. ${t[item.key]}. ${t.reference}: ${t[item.reference]}. ${t.candidate} ${selected}: ${t[item.candidate]}. ${item.matches ? t.match : t.differs}"><span class="vp-landmark-name"><b>${index + 1}</b>${t[item.key]}</span><span>${t[item.reference]}</span><span>${t[item.candidate]}<small class="${item.matches ? '' : 'is-different'}">${item.matches ? '= ' + t.match : '\u2260 ' + t.differs}</small></span></button>`).join('')}</section>` : ''}
    `, () => {
      mount.content.querySelectorAll('[data-street]').forEach(canvas => {
        const id = canvas.dataset.street;
        const features = id === 'reference' ? round.reference : id === 'comparison' ? choice : round.candidates.find(item => item.id === id);
        const view = id === 'reference' ? round.view : features;
        drawStreet(canvas, features, view, round.palette);
      });
    });
  }

  function onClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || !mount.shell.contains(button) || mount.destroyed) return;
    const t = COPY[locale];
    if (button.dataset.action === 'choose') {
      selected = button.dataset.id;
      const result = evaluatePlaceChoice(VPR_ROUNDS[roundIndex].id, selected);
      activeLandmark = result.landmarks.find(item => !item.matches)?.key || 'clock';
      render();
      mount.announce(`${selected}: ${result.samePlace ? t.same : t.different}. ${result.landmarks.map(item => `${t[item.key]}: ${item.matches ? t.match : t.differs}`).join('. ')}.`);
    } else if (button.dataset.action === 'landmark') {
      activeLandmark = button.dataset.id;
      render();
    } else {
      roundIndex = button.dataset.action === 'next' ? (roundIndex + 1) % VPR_ROUNDS.length : 0;
      selected = null;
      activeLandmark = 'clock';
      render();
      mount.announce(`${t.roundLabel} ${roundIndex + 1}. ${t.pending}.`);
    }
  }
  mount.shell.addEventListener('click', onClick);
  render();
  return {
    setLanguage(nextLang) {
      const nextLocale = language(nextLang);
      if (!mount.destroyed && nextLocale !== locale) { locale = nextLocale; mount.announce(''); render(); }
    },
    destroy() { mount.shell.removeEventListener('click', onClick); mount.destroy(); }
  };
}

export function mountMedical(root, { lang = 'en' } = {}) {
  let locale = language(lang);
  let state = createAnnotationState();
  let selected = 'S03';
  let filter = 'all';
  const mount = createMount(root, 'topic-medical', locale);

  function render() {
    const t = COPY[locale];
    const sample = MEDICAL_SAMPLES.find(item => item.id === selected);
    const assigned = state.annotations[selected];
    const used = Object.keys(state.annotations).length;
    const remaining = state.budget - used;
    const samples = MEDICAL_SAMPLES.filter(item => !state.annotations[item.id] && (filter === 'all' || item.ambiguity === filter));
    const acquired = MEDICAL_SAMPLES.filter(item => state.annotations[item.id]);
    const clearCount = MEDICAL_SAMPLES.filter(item => item.ambiguity === 'clear' && state.annotations[item.id]).length;
    const ambiguousCount = used - clearCount;
    const sampleMarkup = item => {
      const annotation = state.annotations[item.id];
      const votes = `${t.votes}: ${t.single} ${item.votes[0]}, ${t.lobed} ${item.votes[1]}`;
      return `<button type="button" class="med-sample${annotation ? ' is-labeled' : ''}" data-action="sample" data-id="${item.id}" data-control="sample-${item.id}" aria-pressed="${selected === item.id}" aria-label="${t.specimen} ${item.id}, ${t[item.reason]}. ${votes}. ${annotation ? t.yourLabel + ': ' + t[annotation + 'Full'] : t.unlabeled}"><span class="med-sample-image"><canvas width="480" height="480" data-specimen="${item.id}" aria-hidden="true"></canvas>${annotation ? `<span class="med-stamp" aria-hidden="true">${annotation === 'unsure' ? '?' : annotation === 'single' ? 'S' : 'L'}</span>` : ''}</span><span class="med-sample-caption"><strong>${item.id}</strong>${annotation ? `<span>${t[annotation]}</span>` : ''}</span>${annotation ? '' : `<span class="med-mini-votes" aria-hidden="true">${item.votes[0]} : ${item.votes[1]}</span>`}</button>`;
    };
    const disagreement = sample.votes[0] === sample.votes[1] ? 'split' : sample.votes.includes(0) ? 'unanimous' : 'mixed';
    mount.shell.lang = locale;
    mount.shell.setAttribute('aria-label', t.medical);
    mount.render(`
      <header class="tp-header"><div><span class="tp-kicker">${t.learning}</span><h3>${t.medical}</h3></div><button type="button" data-action="reset" data-control="reset" class="tp-reset">${t.reset}</button></header>
      ${disclaimer('medical', locale)}
      <div class="med-budget"><div><strong>${t.budget}</strong><span data-budget>${remaining} / ${state.budget} ${t.remaining}</span></div><div class="med-tickets" aria-hidden="true">${Array.from({ length: state.budget }, (_, index) => `<span class="${index < used ? 'is-used' : ''}">${index + 1}</span>`).join('')}</div><button type="button" class="med-query" data-action="query" data-control="query"${remaining === 0 ? ' disabled' : ''}>${t.query}</button></div>
      <div class="med-workspace">
        <section class="med-inspection" aria-label="${t.specimen} ${sample.id}"><div class="med-inspection-heading"><strong>${sample.id}</strong><span>${t[sample.reason]}</span></div><figure class="med-lightbox"><canvas width="480" height="480" data-specimen="detail" role="img" aria-label="${t.specimen} ${sample.id}. ${assigned ? t.key + ': ' + t[sample.shape + 'Full'] : t[(sample.reason === 'crisp' ? sample.shape : sample.reason) + 'Observation']}"></canvas><figcaption>${assigned ? t.revealed : t.observed}</figcaption></figure>
          <div class="med-vote-detail"><div><strong>${t.votes}</strong><span>${t[disagreement]}</span></div><div class="med-vote-tally"><span><i class="is-single" aria-hidden="true"></i>${t.single} <b>${sample.votes[0]}</b></span><span><i class="is-lobed" aria-hidden="true"></i>${t.lobed} <b>${sample.votes[1]}</b></span></div></div>
          <fieldset class="med-labels"><legend>${t.label}</legend><div>${MEDICAL_LABELS.map(label => `<button type="button" data-action="label" data-id="${label}" data-control="label-${label}" aria-pressed="${assigned === label}"${assigned || remaining === 0 ? ' disabled' : ''}>${t[label]}</button>`).join('')}</div></fieldset>
          <div class="med-decision" data-annotation="${assigned || ''}">${assigned ? `<dl><div><dt>${t.yourLabel}</dt><dd>${t[assigned + 'Full']}</dd></div><div><dt>${t.key}</dt><dd>${t[sample.shape + 'Full']}</dd></div></dl><button type="button" data-action="undo" data-control="undo">${t.undo}</button>` : `<p>${remaining === 0 ? t.exhausted : t.unlabeled}</p>`}</div>
        </section>
        <section class="med-pool" aria-label="${t.pool}"><div class="med-pool-heading"><h4>${t.pool}</h4><span>${samples.length} / ${MEDICAL_SAMPLES.length - used}</span></div><fieldset class="med-condition"><legend>${t.filter}</legend><div class="med-filters">${['all', 'clear', 'ambiguous'].map(value => `<button type="button" data-action="filter" data-id="${value}" data-control="filter-${value}" aria-pressed="${filter === value}">${t[value]}</button>`).join('')}</div></fieldset>
          <div class="med-vote-heading"><span>${t.votes}</span><span>${t.voteClasses}</span></div>
          <div class="med-tray" data-pool="unlabeled">${samples.map(sampleMarkup).join('') || `<p class="med-empty">${t.noSamples}</p>`}</div>
          <section class="med-acquired" aria-label="${t.acquired}"><div class="med-pool-heading"><h4>${t.acquired}</h4><span>${used} / ${state.budget}</span></div><div class="med-tray" data-pool="labeled">${acquired.map(sampleMarkup).join('')}</div></section>
          <div class="med-counts" data-coverage><strong>${t.labeled} ${used} / ${MEDICAL_SAMPLES.length}</strong><span>${t.clear} ${clearCount} / ${t.ambiguous} ${ambiguousCount}</span></div>
        </section>
      </div>
    `, () => {
      mount.content.querySelectorAll('[data-specimen]').forEach(canvas => {
        const item = canvas.dataset.specimen === 'detail' ? sample : MEDICAL_SAMPLES.find(entry => entry.id === canvas.dataset.specimen);
        drawSpecimen(canvas, item, Boolean(state.annotations[item.id]));
      });
    });
  }

  function onClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || !mount.shell.contains(button) || button.disabled || mount.destroyed) return;
    const t = COPY[locale];
    const action = button.dataset.action;
    let announcement = '';
    if (action === 'sample') {
      selected = button.dataset.id;
      const sample = MEDICAL_SAMPLES.find(item => item.id === selected);
      announcement = `${t.specimen} ${selected}. ${t[sample.reason]}. ${state.annotations[selected] ? t[state.annotations[selected] + 'Full'] : t.unlabeled}.`;
    } else if (action === 'filter') {
      filter = button.dataset.id;
      const visible = MEDICAL_SAMPLES.filter(item => !state.annotations[item.id] && (filter === 'all' || item.ambiguity === filter));
      if (visible.length && !visible.some(item => item.id === selected)) selected = visible[0].id;
      announcement = `${t[filter]}: ${visible.length}. ${t.specimen} ${selected}.`;
    } else if (action === 'query') {
      const next = rankUnlabeledSamples(state)[0];
      if (!next || Object.keys(state.annotations).length >= state.budget) return;
      selected = next.id;
      filter = 'all';
      announcement = `${t.query}: ${selected}. ${t.votes}: ${t.single} ${next.votes[0]}, ${t.lobed} ${next.votes[1]}. ${t[next.reason]}.`;
    } else if (action === 'label') {
      const next = annotateSample(state, selected, button.dataset.id);
      if (next === state) return;
      state = next;
      const sample = MEDICAL_SAMPLES.find(item => item.id === selected);
      announcement = `${selected}. ${t.yourLabel}: ${t[button.dataset.id + 'Full']}. ${t.key}: ${t[sample.shape + 'Full']}. ${state.budget - Object.keys(state.annotations).length} ${t.remaining}.`;
    } else if (action === 'undo') {
      state = undoAnnotation(state, selected);
      announcement = `${selected}. ${t.unlabeled}. ${state.budget - Object.keys(state.annotations).length} ${t.remaining}.`;
    } else if (action === 'reset') {
      state = createAnnotationState(); selected = 'S03'; filter = 'all';
      announcement = `${t.reset}. ${state.budget} ${t.remaining}.`;
    }
    render();
    if (action === 'sample' || action === 'query') {
      const scroller = root.closest('.topic-experiences');
      const inspection = mount.content.querySelector('.med-inspection');
      if (scroller && inspection) {
        const frame = scroller.getBoundingClientRect();
        const target = inspection.getBoundingClientRect();
        if (target.top < frame.top || target.bottom > frame.bottom) {
          scroller.scrollTop += target.top - frame.top - 8;
          inspection.tabIndex = -1;
          inspection.focus({ preventScroll: true });
        }
      }
    }
    if (action === 'label') mount.content.querySelector('[data-control="undo"]')?.focus({ preventScroll: true });
    if (action === 'undo') mount.content.querySelector('[data-control="label-single"]')?.focus({ preventScroll: true });
    mount.announce(announcement);
  }
  mount.shell.addEventListener('click', onClick);
  render();
  return {
    setLanguage(nextLang) {
      const nextLocale = language(nextLang);
      if (!mount.destroyed && nextLocale !== locale) { locale = nextLocale; mount.announce(''); render(); }
    },
    destroy() { mount.shell.removeEventListener('click', onClick); mount.destroy(); }
  };
}
