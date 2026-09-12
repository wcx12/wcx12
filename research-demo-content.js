export const localize = (value, lang) => value[lang === 'zh' ? 'zh' : 'en'];

// Fixed fixtures, not live retrieval or generated answers.
export const AGENT_TASKS = [
  {
    id: 'visit',
    title: { en: 'Plan a visit', zh: '安排参观' },
    request: { en: 'I have 40 minutes from 14:00. Plan a visit to the gallery and lab, starting at the gate.', zh: '我从 14:00 起有 40 分钟，从大门出发，想参观展厅和实验室。请安排路线。' },
    snippets: [
      { id: 'S1', text: { en: 'Visitor guide: gate to gallery takes 5 minutes; gallery visit takes 15 minutes.', zh: '参观指南：大门到展厅步行 5 分钟；展厅参观需 15 分钟。' } },
      { id: 'S2', text: { en: 'Lab guide: gallery to lab takes 5 minutes; lab visit takes 10 minutes. The lab closes at 14:35.', zh: '实验室指南：展厅到实验室步行 5 分钟；参观需 10 分钟。实验室 14:35 关闭。' } }
    ],
    result: { en: '14:00 gate → 14:05 gallery; visit until 14:20 [S1]. Walk to the lab by 14:25; finish at 14:35, at closing time [S2]. Total: 35 minutes, leaving 5 minutes spare.', zh: '14:00 从大门出发，14:05 到展厅，参观至 14:20 [S1]；14:25 到实验室，14:35 参观结束，恰好赶在关门时完成 [S2]。共需 35 分钟，余下 5 分钟。' }
  },
  {
    id: 'materials',
    title: { en: 'Prepare a class', zh: '准备课堂' },
    request: { en: 'Prepare materials for 12 learners working in groups of three. What is still missing?', zh: '为 12 名学生准备课堂材料，每 3 人一组。目前还缺什么？' },
    snippets: [
      { id: 'S1', text: { en: 'Activity sheet: each group needs one ruler and two sheets of graph paper.', zh: '活动说明：每组需 1 把尺子和 2 张方格纸。' } },
      { id: 'S2', text: { en: 'Supply inventory: three rulers and ten sheets of graph paper are available.', zh: '库存记录：现有 3 把尺子和 10 张方格纸。' } }
    ],
    result: { en: '12 ÷ 3 = 4 groups. Set out 4 rulers and 8 sheets [S1]. With 3 rulers and 10 sheets in stock [S2], borrow 1 more ruler. No paper is missing; 2 sheets remain.', zh: '12 ÷ 3 = 4 组。需准备 4 把尺子、8 张方格纸 [S1]。对照库存的 3 把尺子和 10 张纸 [S2]，还需借 1 把尺子；纸张足够，剩余 2 张。' }
  },
  {
    id: 'meeting',
    title: { en: 'Find a time', zh: '安排会议' },
    request: { en: 'Find a 30-minute meeting slot for Lin and Chen, and name an available room.', zh: '为小林和小陈找一个 30 分钟的会议时段，并选出可用会议室。' },
    snippets: [
      { id: 'S1', text: { en: 'Calendars: Lin is free 10:00–11:00; Chen is free 10:30–11:30.', zh: '日程：小林 10:00–11:00 有空；小陈 10:30–11:30 有空。' } },
      { id: 'S2', text: { en: 'Room list: room A is booked until 11:00; room B is free 10:00–12:00.', zh: '会议室记录：A 室在 11:00 前已被预订；B 室在 10:00–12:00 可用。' } }
    ],
    result: { en: 'Meet 10:30–11:00 in room B. This is the 30-minute overlap in both calendars [S1], and B is available throughout [S2]. Room A is unavailable. This is a proposal; nothing has been booked.', zh: '建议 10:30–11:00 在 B 室开会。两人的共同空闲时段恰好为 30 分钟 [S1]，且 B 室全程可用 [S2]；A 室不可用。这只是安排建议，未执行任何预订。' }
  }
];

export function nextAgentStage(stage) {
  return stage === 'request' ? 'work' : stage === 'work' || stage === 'deliver' ? 'deliver' : 'request';
}

export const EDUCATION_EXERCISES = [
  {
    id: 'algebra', label: { en: 'Algebra', zh: '代数' }, formula: 'x + 3 = 7',
    question: { en: 'Solve x + 3 = 7. What is x?', zh: '解方程 x + 3 = 7，x 等于多少？' },
    choices: [{ id: 'a', text: { en: '3', zh: '3' } }, { id: 'b', text: { en: '4', zh: '4' } }, { id: 'c', text: { en: '10', zh: '10' } }], answer: 'b',
    hint: { en: 'Subtract 3 from both sides of the equation.', zh: '在等式两边同时减去 3。' },
    explanation: { en: 'x = 7 − 3 = 4. Check: 4 + 3 = 7.', zh: 'x = 7 − 3 = 4。检验：4 + 3 = 7。' }
  },
  {
    id: 'functions', label: { en: 'Functions', zh: '函数' }, formula: 'f(x) = 2x + 1',
    question: { en: 'For f(x) = 2x + 1, what is f(3)?', zh: '已知 f(x) = 2x + 1，f(3) 等于多少？' },
    choices: [{ id: 'a', text: { en: '5', zh: '5' } }, { id: 'b', text: { en: '6', zh: '6' } }, { id: 'c', text: { en: '7', zh: '7' } }], answer: 'c',
    hint: { en: 'Replace x with 3. Multiply by 2 before adding 1.', zh: '把 x 换成 3，先乘以 2，再加上 1。' },
    explanation: { en: 'f(3) = 2 × 3 + 1 = 7, not 6: the final +1 matters.', zh: 'f(3) = 2 × 3 + 1 = 7，不是 6；最后还要加 1。' }
  },
  {
    id: 'geometry', label: { en: 'Geometry', zh: '几何' }, formula: 'A = 6 × 4 ÷ 2',
    question: { en: 'A triangle has base 6 cm and perpendicular height 4 cm. What is its area?', zh: '三角形的底为 6 厘米，对应的高为 4 厘米，面积是多少？' },
    choices: [{ id: 'a', text: { en: '10 cm²', zh: '10 平方厘米' } }, { id: 'b', text: { en: '12 cm²', zh: '12 平方厘米' } }, { id: 'c', text: { en: '24 cm²', zh: '24 平方厘米' } }], answer: 'b',
    hint: { en: 'Triangle area is half of base times perpendicular height.', zh: '三角形面积等于底乘以对应的高，再除以 2。' },
    explanation: { en: '6 × 4 ÷ 2 = 12 cm². Without dividing by 2, you get the rectangle area.', zh: '6 × 4 ÷ 2 = 12 平方厘米。不除以 2 得到的是矩形面积。' }
  },
  {
    id: 'proof', label: { en: 'Proof', zh: '证明' }, formula: '2n + 2m = 2(n + m)',
    question: { en: 'For integers n and m, why is 2n + 2m even?', zh: 'n 和 m 都是整数，为什么 2n + 2m 一定是偶数？' },
    choices: [{ id: 'a', text: { en: 'It equals 2(n + m).', zh: '它等于 2(n + m)。' } }, { id: 'b', text: { en: 'It is always positive.', zh: '它总是正数。' } }, { id: 'c', text: { en: 'n and m must be even.', zh: 'n 和 m 必须是偶数。' } }], answer: 'a',
    hint: { en: 'An even integer can be written as 2 times an integer.', zh: '偶数可以写成 2 乘以某个整数的形式。' },
    explanation: { en: 'Factor out 2: 2(n + m). Since n + m is an integer, the sum is even.', zh: '提出公因数 2，得到 2(n + m)。n + m 是整数，所以这个和是偶数。' }
  },
  {
    id: 'word', label: { en: 'Word problem', zh: '应用题' }, formula: '12 ÷ 3 = ?',
    question: { en: 'Share 12 pencils equally among 3 learners. How many does each receive?', zh: '把 12 支铅笔平均分给 3 名学生，每人能分到几支？' },
    choices: [{ id: 'a', text: { en: '3 pencils', zh: '3 支' } }, { id: 'b', text: { en: '4 pencils', zh: '4 支' } }, { id: 'c', text: { en: '9 pencils', zh: '9 支' } }], answer: 'b',
    hint: { en: 'Equal sharing uses division: total pencils divided by learners.', zh: '平均分用除法：铅笔总数除以学生人数。' },
    explanation: { en: '12 ÷ 3 = 4 pencils each. Check: 3 × 4 = 12.', zh: '12 ÷ 3 = 4，每人 4 支。检验：3 × 4 = 12。' }
  }
];

export function evaluateAnswer(exerciseId, answer) {
  if (!answer) return 'empty';
  const exercise = EDUCATION_EXERCISES.find((item) => item.id === exerciseId);
  return exercise?.choices.some((choice) => choice.id === answer) && exercise.answer === answer ? 'correct' : 'incorrect';
}
