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

export function createTopicArt(key) {
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
  const check = (x, y, s = 1, role = '') => line([
    [x - .14 * s, y], [x - .03 * s, y - .12 * s], [x + .2 * s, y + .16 * s]
  ], 'accent', role);
  const assistant = (x, y, s = 1, teaching = false) => {
    // A task-oriented assistant silhouette, not a calendar used as a stand-in for AI.
    const b = (dx, dy, w, h, f, c) => box(x + dx * s, y + dy * s, w * s, h * s, f, c);
    b(-.34, -.72, .68, .59, 'surface', 'ink');
    oval(x, y - .12 * s, .4 * s, .12 * s, 'accent', 'accent');
    poly([[-.39, 0], [.39, 0], [.47, .08], [.47, .6], [.39, .68], [-.39, .68], [-.47, .6], [-.47, .08]]
      .map(([dx, dy]) => [x + dx * s, y + dy * s]), 'surface', 'ink');
    b(-.37, .15, .74, .34, 'screen', 'accent');
    oval(x - .19 * s, y + .32 * s, .055 * s, .065 * s, 'accent', null);
    oval(x + .19 * s, y + .32 * s, .055 * s, .065 * s, 'accent', null);
    line([[x - .08 * s, y + .21 * s], [x, y + .18 * s], [x + .08 * s, y + .21 * s]], 'accent');
    line([[x, y + .68 * s], [x, y + .86 * s]], 'ink');
    oval(x, y + .91 * s, .055 * s, .055 * s, 'warm', null);
    line([[x - .34 * s, y - .26 * s], [x - .53 * s, y - .6 * s]], 'ink');
    line([[x + .34 * s, y - .26 * s], [x + .65 * s, y + (teaching ? .2 : -.48) * s],
      [x + .92 * s, y + (teaching ? .48 : -.48) * s]], 'accent');
    oval(x + .92 * s, y + (teaching ? .48 : -.48) * s, .075 * s, .075 * s, 'accent', null);
  };

  if (key === 'vpr') {
    for (const [x, night] of [[-1.25, false], [1.25, true]]) {
      const face = night ? 'screen' : 'surface';
      box(x - .8, -.84, 1.62, .08, 'muted', null);
      box(x - .6, -.75, 1.2, 1.55, face, 'ink');
      poly([[x - .68, .8], [x, 1.05], [x + .68, .8]], 'warm', 'ink');
      box(x + .6, -.75, .18, 1.55, 'muted', 'ink');
      oval(x, .54, .22, .22, 'surface', 'accent');
      line([[x, .68], [x, .54], [x + .12, .49]], 'ink');
      // The clock, doorway and three windows match in both observations.
      box(x - .17, -.75, .34, .53, 'screen', 'accent');
      oval(x, -.23, .17, .17, 'screen', 'accent');
      for (const dx of [-.42, 0, .42]) box(x + dx - .1, .02, .2, .21, night ? 'warm' : 'accent', null);
      if (night) {
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
      oval(x, .54, .3, .3, null, 'accent', 'result');
    }
    for (let x = -.82; x < .85; x += .22) line([[x, .54], [x + .1, .54]], 'accent', 'result');
    check(0, -.4, 1.3, 'result');
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
    for (const [x, y, dx, dy] of corners) line([[x + dx * .14, y], [x, y], [x, y + dy * .14]], 'accent', 'result');
    oval(1.15, .22, .73, .73, 'surface', 'ink');
    oval(1.15, .22, .61, .6, 'screen', 'accent');
    oval(1.01, .19, .23, .3, 'violet', null);
    oval(1.3, .29, .23, .3, 'violet', null);
    line([[1.6, -.34], [2.04, -.8]], 'ink');
    poly([[.8, -.92], [.94, -.99], [1.7, -.16], [1.55, -.05]], 'warm', 'ink', 'result');
    poly([[.8, -.92], [.78, -1.1], [.94, -.99]], 'ink', null, 'result');
    check(.2, -.35, .9, 'result');
  } else if (key === 'agent') {
    assistant(-1.48, .08, 1.05);
    line([[-2.12, -.9], [2.1, -.9]], 'muted');
    box(-.35, -.48, 1.38, .95, 'surface', 'ink');
    box(-.25, -.37, 1.18, .73, 'screen', 'accent');
    poly([[-.5, -.68], [.96, -.68], [1.1, -.48], [-.35, -.48]], 'muted', 'ink');
    for (let i = 0; i < 3; i++) {
      box(-.1, .16 - i * .2, .09, .07, i === 2 ? 'warm' : 'accent', null);
      line([[.09, .2 - i * .2], [.65 - i * .08, .2 - i * .2]], 'ink');
    }
    box(1.28, -.4, .72, 1.15, 'surface', 'ink', 'result');
    for (let i = 0; i < 3; i++) line([[1.41, .49 - i * .17], [1.86, .49 - i * .17]], 'muted', 'result');
    check(1.61, -.17, .9, 'result');
    line([[1.18, -.63], [2.1, -.63], [2.1, -.48]], 'accent');
  } else if (key === 'education') {
    assistant(-1.64, .05, .9, true);
    box(-.49, -.57, 2.53, 1.66, 'surface', 'ink');
    box(-.4, -.48, 2.35, 1.48, 'screen', 'muted');
    line([[-.6, -.64], [2.15, -.64]], 'warm');
    poly([[-.22, -.12], [.38, -.12], [-.22, .48]], 'accent', 'ink', 'triangle-input-a');
    poly([[.16, .75], [.76, .15], [.76, .75]], 'warm', 'ink', 'triangle-input-b');
    line([[.94, .2], [1.18, .2]], 'muted');
    line([[.94, .31], [1.18, .31]], 'muted');
    poly([[1.31, -.02], [1.91, -.02], [1.31, .58]], 'accent', 'ink', 'triangle-output-a');
    poly([[1.31, .58], [1.91, -.02], [1.91, .58]], 'warm', 'ink', 'triangle-output-b');
    // A learner's answer sheet receives feedback below the geometric example.
    poly([[.08, -1.13], [1.35, -1.13], [1.53, -.83], [.26, -.83]], 'surface', 'ink');
    line([[.42, -.98], [.78, -.98]], 'muted');
    check(1.04, -.97, .62, 'result');
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
export function paintHeroTopic(ctx, width, height, id, palette) {
  const key = heroTopicKey(id);
  if (key === 'arch' || key === 'generic') return false;
  if (!artCache.has(key)) artCache.set(key, createTopicArt(key));
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  const scale = Math.min(width / 5.1, height / 3.1);
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, -scale);
  ctx.lineWidth = 1.6 / scale;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const shape of artCache.get(key)) {
    ctx.beginPath();
    shape.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    if (shape.fill) { ctx.fillStyle = palette[shape.fill]; ctx.fill(); }
    if (shape.stroke) { ctx.strokeStyle = palette[shape.stroke]; ctx.stroke(); }
  }
  ctx.restore();
  return true;
}
