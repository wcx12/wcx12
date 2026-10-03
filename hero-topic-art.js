// Shared subject geometry for the lightweight canvas and optional Three.js relief.
// These are authored concept illustrations, not medical images or model outputs.
const topicKeys = new Map([
  ['point-cloud-registration', 'arch'], ['vpr', 'vpr'],
  ['medical-image-analysis', 'medical'], ['agent', 'agent'], ['ai4edu', 'education']
]);
export function heroTopicKey(id) { return topicKeys.get(id) || 'generic'; }

const copy = {
  vpr: ['同一地标，昼夜再识别', 'One landmark, day and night'],
  medical: ['筛选样本，交给人来标注', 'Select a sample for human annotation'],
  agent: ['接收任务，使用工具，交付结果', 'A task, tools, and a delivered result'],
  education: ['几何问题，提示与作答反馈', 'Geometry, a hint, and answer feedback'],
  arch: ['不同观测下的点集配准', 'Align point sets from different observations'],
  generic: ['研究概念', 'Research concept']
};

export function heroTopicDescription(id, lang = 'en') {
  return copy[heroTopicKey(id)][String(lang).startsWith('zh') ? 0 : 1];
}

const stories = {
  vpr: [
    ['参考', 'Reference', '同一地标，先记录白天的外观与结构。', 'The same landmark, recorded in daylight.'],
    ['夜间', 'Night', '光照变了，钟面、门窗的位置仍然对应。', 'At night, appearance changes but the clock and windows stay in place.'],
    ['匹配', 'Match', '对应结构指向同一地点；这里展示的是匹配概念。', 'Corresponding structures identify the same place in this illustrative example.']
  ],
  medical: [
    ['样本池', 'Samples', '未标注样本，等待选择与人工判断。', 'Unlabelled samples await selection and human annotation.'],
    ['选样', 'Select', '选出一个样本并放大；选择规则在此仅作示意。', 'One sample is selected and enlarged; the selection is illustrative.'],
    ['标注', 'Annotate', '人给选中样本加上标签，再放回已标注集合。', 'A human labels the selected sample for the labelled set.']
  ],
  agent: [
    ['任务', 'Task', '任务：整理三条研究资料，生成待核查的摘要。', 'Task: organize three research notes into a summary for review.'],
    ['工具', 'Tools', '助手读取资料并整理要点，原始来源随结果保留。', 'The assistant reads the notes and keeps their sources with the draft.'],
    ['交付', 'Review', '摘要草稿已交付，事实和引用仍由人核查。', 'A summary draft is delivered for human fact and citation checks.']
  ],
  education: [
    ['题目', 'Problem', '几何问题：两个全等的等腰直角三角形能拼成正方形吗？', 'Can two congruent isosceles right triangles form a square?'],
    ['提示', 'Hint', '提示：旋转其中一块，让两条斜边相接。', 'Hint: rotate one piece and bring the two hypotenuses together.'],
    ['作答', 'Answer', '两块恰好拼成正方形，分界线保留了每块的形状。', 'The pieces form a square; the diagonal shows both original triangles.']
  ]
};
export function normalizeHeroStage(value) {
  return Number.isInteger(value) ? Math.max(0, Math.min(2, value)) : 0;
}
export function heroTopicStages(id, lang = 'en') {
  const zh = String(lang).startsWith('zh');
  return (stories[heroTopicKey(id)] || []).map(row => ({ label: row[zh ? 0 : 1], description: row[zh ? 2 : 3] }));
}

export function createTopicArt(key, stage = 2) {
  stage = normalizeHeroStage(stage);
  const shapes = [];
  let depth = 0;
  const shape = (points, fill = null, stroke = 'ink', role = '') => {
    depth += .003;
    shapes.push({ points: points.map(([x, y]) => [x, y, depth]), fill, stroke, role });
  };
  const line = (points, color = 'ink', role = '') => shape(points, null, color, role);
  const poly = (points, fill = 'surface', stroke = 'ink', role = '') =>
    shape([...points, points[0]], fill, stroke, role);
  const box = (x, y, w, h, fill = 'surface', stroke = 'ink', role = '') =>
    poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, stroke, role);
  const oval = (x, y, rx, ry, fill = 'surface', stroke = 'ink', role = '') =>
    poly(Array.from({ length: 40 }, (_, i) => {
      const a = i / 40 * Math.PI * 2;
      return [x + Math.cos(a) * rx, y + Math.sin(a) * ry];
    }), fill, stroke, role);
  const round = (x, y, w, h, r, fill = 'surface', stroke = 'ink', role = '') => {
    const corners = [[x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2],
      [x + r, y + r, Math.PI], [x + w - r, y + r, Math.PI * 1.5]];
    poly(corners.flatMap(([cx, cy, start]) => Array.from({ length: 9 }, (_, i) => {
      const a = start + i / 8 * Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    })), fill, stroke, role);
  };
  const check = (x, y, s = 1, role = '') => line([
    [x - .14 * s, y], [x - .03 * s, y - .12 * s], [x + .2 * s, y + .16 * s]
  ], 'accent', role);
  const assistant = (x, y, s = 1, teaching = false) => {
    // A task-oriented assistant silhouette, not a calendar used as a stand-in for AI.
    const b = (dx, dy, w, h, f, c) => box(x + dx * s, y + dy * s, w * s, h * s, f, c);
    round(x - .33 * s, y - .71 * s, .66 * s, .65 * s, .18 * s, 'surface', 'ink');
    oval(x, y - .12 * s, .32 * s, .09 * s, 'accent', null);
    round(x - .47 * s, y, .94 * s, .68 * s, .18 * s, 'muted', 'ink');
    round(x - .39 * s, y + .1 * s, .78 * s, .47 * s, .13 * s, 'screen', 'accent');
    const look = stage === 0 ? 0 : .025 * s;
    oval(x - .19 * s + look, y + .34 * s, .045 * s, .07 * s, 'accent', null);
    oval(x + .19 * s + look, y + .34 * s, .045 * s, .07 * s, 'accent', null);
    line([[x - .08 * s, y + .21 * s], [x, y + .18 * s], [x + .08 * s, y + .21 * s]], 'accent');
    line([[x, y + .68 * s], [x, y + .86 * s]], 'ink');
    oval(x, y + .91 * s, .055 * s, .055 * s, 'warm', null);
    line([[x - .34 * s, y - .26 * s], [x - .53 * s, y - .6 * s]], 'ink');
    const hand = teaching && stage > 0 ? .48 : -.48;
    line([[x + .34 * s, y - .26 * s], [x + .65 * s, y + (hand > 0 ? .2 : -.48) * s],
      [x + .92 * s, y + hand * s]], 'accent');
    oval(x + .92 * s, y + hand * s, .075 * s, .075 * s, 'accent', null);
    b(-.16, -.5, .32, .06, 'accent', null);
  };

  if (key === 'vpr') {
    for (const [x, night] of [[-1.25, false], [1.25, true]]) {
      const face = night && stage > 0 ? 'screen' : 'surface';
      box(x - .8, -.84, 1.62, .08, 'muted', null);
      box(x - .6, -.75, 1.2, 1.55, face, 'ink');
      poly([[x - .68, .8], [x, 1.05], [x + .68, .8]], 'warm', 'ink');
      box(x + .6, -.75, .18, 1.55, 'muted', 'ink');
      oval(x, .54, .22, .22, 'surface', 'accent');
      line([[x, .68], [x, .54], [x + .12, .49]], 'ink');
      // The clock, doorway and three windows match in both observations.
      box(x - .17, -.75, .34, .53, 'screen', 'accent');
      oval(x, -.23, .17, .17, 'screen', 'accent');
      for (const dx of [-.42, 0, .42]) box(x + dx - .1, .02, .2, .21, night && stage > 0 ? 'warm' : 'accent', null);
      if (night && stage > 0) {
        oval(x + .7, 1.15, .17, .17, 'warm', null);
        oval(x + .78, 1.21, .14, .14, 'background', null);
      } else {
        oval(x - .68, 1.15, .13, .13, 'warm', null);
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          line([[x - .68 + Math.cos(a) * .19, 1.15 + Math.sin(a) * .19],
            [x - .68 + Math.cos(a) * .26, 1.15 + Math.sin(a) * .26]], 'warm');
        }
      }
      if (stage === 2) {
        oval(x, .54, .3, .3, null, 'accent', 'result');
        line([[x - .57, -.72], [x - .57, -.05], [x + .57, -.05], [x + .57, -.72]], 'accent', 'result');
      }
    }
    if (stage === 2) {
      for (let x = -.82; x < .85; x += .22) line([[x, .54], [x + .1, .54]], 'accent', 'result');
      check(0, -.4, 1.3, 'result');
    }
  } else if (key === 'medical') {
    // A slide/sample pool, a selected cell and an annotation pen.
    poly([[-2.2, -.82], [-.12, -.82], [.13, .83], [-1.95, .83]], 'surface', 'muted');
    for (const [x, y, lobed] of [[-1.65, .39, false], [-.75, .39, true], [-1.55, -.38, true], [-.65, -.38, false]]) {
      oval(x, y, .3, .27, 'screen', 'muted');
      if (lobed) {
        oval(x - .08, y, .105, .14, 'violet', null);
        oval(x + .08, y + .04, .105, .14, 'violet', null);
      } else oval(x, y, .13, .17, 'violet', null);
    }
    const corners = [[-.75 - .36, .39 - .34, 1, 1], [-.75 + .36, .39 - .34, -1, 1],
      [-.75 - .36, .39 + .34, 1, -1], [-.75 + .36, .39 + .34, -1, -1]];
    if (stage > 0) for (const [x, y, dx, dy] of corners) line([[x + dx * .14, y], [x, y], [x, y + dy * .14]], 'accent', 'result');
    oval(1.15, .22, .73, .73, 'surface', 'ink');
    oval(1.15, .22, .61, .6, 'screen', 'accent');
    if (stage > 0) {
    oval(1.01, .19, .23, .3, 'violet', null);
    oval(1.3, .29, .23, .3, 'violet', null);
    } else {
      line([[.92, .22], [1.38, .22]], 'muted');
      line([[1.15, -.01], [1.15, .45]], 'muted');
    }
    line([[1.6, -.34], [2.04, -.8]], 'ink');
    if (stage === 2) {
    poly([[.8, -.92], [.94, -.99], [1.7, -.16], [1.55, -.05]], 'warm', 'ink', 'result');
    poly([[.8, -.92], [.78, -1.1], [.94, -.99]], 'ink', null, 'result');
    check(.2, -.35, .9, 'result');
    round(-.99, -.05, .48, .16, .04, 'accent', null, 'result');
    line([[-.91, .02], [-.83, -.01], [-.65, .07]], 'screen', 'result');
    }
  } else if (key === 'agent') {
    assistant(-1.48, .08, 1.05);
    line([[-2.12, -.9], [2.1, -.9]], 'muted');
    box(-.35, -.48, 1.38, .95, 'surface', 'ink');
    box(-.25, -.37, 1.18, .73, 'screen', 'accent');
    poly([[-.5, -.68], [.96, -.68], [1.1, -.48], [-.35, -.48]], 'muted', 'ink');
    for (let i = 0; i < 3; i++) {
      box(-.1, .16 - i * .2, .09, .07, i === 2 ? 'warm' : 'accent', null);
      line([[.09, .2 - i * .2], [.65 - (stage === 0 ? .32 : i * .08), .2 - i * .2]], 'ink');
      if (stage > 0) check(.78, .19 - i * .2, .3, 'result');
    }
    if (stage === 0) {
      for (let i = 0; i < 3; i++) {
        box(1.22 + i * .12, -.26 + i * .14, .59, .76, 'surface', 'muted');
        line([[1.32 + i * .12, .34 + i * .14], [1.68 + i * .12, .34 + i * .14]], 'ink');
      }
    } else if (stage === 1) {
      for (let i = 0; i < 3; i++) {
        round(1.24, .5 - i * .33, .78, .22, .05, 'surface', 'ink', 'result');
        line([[1.35, .61 - i * .33], [1.84, .61 - i * .33]], 'accent', 'result');
      }
    } else {
    box(1.28, -.4, .72, 1.15, 'surface', 'ink', 'result');
    for (let i = 0; i < 3; i++) line([[1.41, .49 - i * .17], [1.86, .49 - i * .17]], 'muted', 'result');
    check(1.61, -.17, .9, 'result');
    for (let i = 0; i < 3; i++) box(1.41 + i * .16, -.35, .09, .05, 'accent', null, 'result');
    }
    line([[1.18, -.63], [2.1, -.63], [2.1, -.48]], 'accent');
  } else if (key === 'education') {
    assistant(-1.64, .05, .9, true);
    box(-.49, -.57, 2.53, 1.66, 'surface', 'ink');
    box(-.4, -.48, 2.35, 1.48, 'screen', 'muted');
    line([[-.6, -.64], [2.15, -.64]], 'warm');
    poly([[-.22, -.12], [.38, -.12], [-.22, .48]], 'accent', 'ink', 'triangle-input-a');
    poly([[.16, .75], [.76, .15], [.76, .75]], 'warm', 'ink', 'triangle-input-b');
    if (stage === 2) {
    line([[.94, .2], [1.18, .2]], 'muted');
    line([[.94, .31], [1.18, .31]], 'muted');
    poly([[1.31, -.02], [1.91, -.02], [1.31, .58]], 'accent', 'ink', 'triangle-output-a');
    poly([[1.31, .58], [1.91, -.02], [1.91, .58]], 'warm', 'ink', 'triangle-output-b');
    line([[1.31, .58], [1.91, -.02]], 'screen', 'partition');
    } else {
      box(1.31, -.02, .6, .6, null, 'muted');
      if (stage === 1) {
        line([[1.31, .58], [1.91, -.02]], 'accent', 'result');
        line([[.76, .8], [1.03, .8], [1.03, .6], [1.15, .6]], 'warm', 'result');
        line([[1.04, .69], [1.15, .6], [1.04, .51]], 'warm', 'result');
      } else {
        oval(1.61, .27, .1, .1, null, 'muted');
      }
    }
    // A learner's answer sheet receives feedback below the geometric example.
    poly([[.08, -1.13], [1.35, -1.13], [1.53, -.83], [.26, -.83]], 'surface', 'ink');
    line([[.42, -.98], [.78, -.98]], 'muted');
    if (stage === 2) check(1.04, -.97, .62, 'result');
    else line([[.92, -.98], [1.15, -.98]], 'muted');
  }
  return shapes;
}

export function heroArtPalette(style) {
  const get = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return {
    background: get('--bg', '#101415'), surface: get('--soft-bg', '#202929'),
    screen: get('--bg', '#101415'), ink: get('--text', '#eef3f3'),
    muted: get('--muted', '#aab8ba'), accent: get('--cyan', '#75dcc8'),
    warm: get('--pink', '#f2b8bf'), violet: get('--violet', '#b4c4f3')
  };
}

const artCache = new Map();
export function paintHeroTopic(ctx, width, height, id, palette, stage = 2) {
  const key = heroTopicKey(id);
  if (key === 'arch' || key === 'generic') return false;
  const cacheKey = `${key}:${normalizeHeroStage(stage)}`;
  if (!artCache.has(cacheKey)) artCache.set(cacheKey, createTopicArt(key, stage));
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  const scale = Math.min(width / 5.1, height / 3.1);
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, -scale);
  ctx.lineWidth = 1.6 / scale;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const shape of artCache.get(cacheKey)) {
    ctx.beginPath();
    shape.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    if (shape.fill) { ctx.fillStyle = palette[shape.fill]; ctx.fill(); }
    if (shape.stroke) { ctx.strokeStyle = palette[shape.stroke]; ctx.stroke(); }
  }
  ctx.restore();
  return true;
}
