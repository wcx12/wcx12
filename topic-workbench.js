const DAY_START = 9 * 60;
const DAY_END = 17 * 60;
const STEP = 15;

export function createInitialCalendar() {
  return [
    { id: 'sync', kind: 'sync', start: 540, end: 570 },
    { id: 'review', kind: 'review', start: 600, end: 660 },
    { id: 'lunch', kind: 'lunch', start: 720, end: 780 },
    { id: 'office', kind: 'office', start: 900, end: 930 }
  ];
}

export function formatCalendarTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

const overlaps = (a, b, gap = 0) => a.start < b.end + gap && a.end + gap > b.start;
const isMinute = value => Number.isInteger(value) && value % STEP === 0;

// Earliest-fit is complete for these ordered tasks: an earlier finish can only
// leave more room for the next task. Fixed appointments are never moved by it.
export function proposeSchedule({
  events = createInitialCalendar(), request = 'focus', focusMinutes = 90,
  windowStart = DAY_START, windowEnd = DAY_END, bufferMinutes = 0,
  reviewStart, reviewMinutes
} = {}) {
  const fail = reason => ({ ok: false, reason, additions: [], events: [] });
  if (!Array.isArray(events) || events.some(event => !event || typeof event.id !== 'string' || !event.id
    || !isMinute(event.start) || !isMinute(event.end)
    || event.start < DAY_START || event.end > DAY_END || event.end <= event.start)
    || new Set(events.map(event => event.id)).size !== events.length) return fail('invalid-calendar');
  const savedReview = events.find(event => event.id === 'review');
  const nextReviewStart = reviewStart ?? savedReview?.start;
  const nextReviewMinutes = reviewMinutes ?? (savedReview ? savedReview.end - savedReview.start : undefined);
  if (savedReview && (!isMinute(nextReviewStart) || !isMinute(nextReviewMinutes)
    || nextReviewMinutes < 30 || nextReviewStart < DAY_START
    || nextReviewStart + nextReviewMinutes > DAY_END)) return fail('invalid-review');
  if (!isMinute(windowStart) || !isMinute(windowEnd) || windowStart < DAY_START
    || windowEnd > DAY_END || windowStart >= windowEnd) return fail('invalid-window');
  if (!['focus', 'meeting-reading'].includes(request) || ![0, 15, 30].includes(bufferMinutes)
    || (request === 'focus' && (!isMinute(focusMinutes) || focusMinutes < 30 || focusMinutes > 240))) return fail('invalid-request');
  const nextEvents = events.map(event => event.id === 'review'
    ? { ...event, start: nextReviewStart, end: nextReviewStart + nextReviewMinutes } : { ...event });
  for (let i = 0; i < nextEvents.length; i += 1) {
    for (let j = i + 1; j < nextEvents.length; j += 1) {
      if (overlaps(nextEvents[i], nextEvents[j])) return fail('review-conflict');
    }
  }
  const tasks = request === 'focus'
    ? [{ kind: 'focus', minutes: focusMinutes }]
    : [{ kind: 'meeting', minutes: 30 }, { kind: 'reading', minutes: 45 }];
  const additions = [];
  let earliest = windowStart;
  let sequence = 1;
  for (const task of tasks) {
    let slot;
    for (let start = earliest; start + task.minutes <= windowEnd; start += STEP) {
      const candidate = { start, end: start + task.minutes };
      if (nextEvents.every(event => !overlaps(candidate, event, bufferMinutes))) {
        slot = candidate;
        break;
      }
    }
    if (!slot) return fail('no-space');
    while (nextEvents.some(event => event.id === `scheduled-${sequence}`)) sequence += 1;
    const addition = { id: `scheduled-${sequence++}`, kind: task.kind, ...slot };
    additions.push(addition);
    nextEvents.push(addition);
    earliest = slot.end + bufferMinutes;
  }
  return {
    ok: true, reason: null, additions,
    events: nextEvents.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id)),
    reviewChanged: Boolean(savedReview && (nextReviewStart !== savedReview.start
      || nextReviewStart + nextReviewMinutes !== savedReview.end))
  };
}

export const RECTANGLE_EXERCISES = Object.freeze([
  Object.freeze({ id: 'courtyard', area: 24, perimeter: 20, width: 3, height: 2 }),
  Object.freeze({ id: 'studio', area: 30, perimeter: 22, width: 4, height: 3 }),
  Object.freeze({ id: 'garden', area: 36, perimeter: 26, width: 6, height: 6 })
]);

export function evaluateRectangle(exerciseId, width, height) {
  const exercise = RECTANGLE_EXERCISES.find(item => item.id === exerciseId);
  if (!exercise || ![width, height].every(value => Number.isInteger(value) && value >= 1 && value <= 10)) {
    throw new RangeError('A known exercise and integer sides from 1 to 10 are required.');
  }
  const area = width * height;
  const perimeter = 2 * (width + height);
  return {
    area, perimeter, areaDelta: exercise.area - area, perimeterDelta: exercise.perimeter - perimeter,
    areaMatch: area === exercise.area, perimeterMatch: perimeter === exercise.perimeter,
    solved: area === exercise.area && perimeter === exercise.perimeter
  };
}

const normalizeLanguage = lang => String(lang).toLowerCase().startsWith('zh') ? 'zh' : 'en';
const copy = {
  en: {
    calendarEyebrow: 'MONDAY / LOCAL CALENDAR', calendarTitle: 'A little room to think.',
    calendarRegion: 'Local scheduling assistant', resetDay: 'Reset day',
    settings: 'Constraints & review time',
    disclaimer: 'Local rule demo. No model calls, external services, or calendar writes.',
    request: 'Make time for', focus: 'Protected focus', 'meeting-reading': 'Meeting + reading',
    focusLength: 'Focus length', notBefore: 'Not before', finishBy: 'Finish by', gap: 'Between events',
    reviewEdit: 'Project review / draft edit', reviewStart: 'Starts', reviewLength: 'Length',
    propose: 'Find a time', approve: 'Approve plan', decline: 'Decline',
    saved: 'Saved day', preview: 'Proposed day', timeline: 'Day timeline, 09:00 to 17:00',
    savedKey: 'Saved', pendingKey: 'Pending', emptyPreview: 'No proposal',
    idle: 'Your saved day is unchanged.', edited: 'Draft changed. Find a time to review the new plan.',
    pending: 'Awaiting approval. Your saved day is unchanged.',
    applied: 'Approved. These times are now in the local calendar.',
    declined: 'Declined. Your saved day is unchanged.',
    'invalid-calendar': 'The calendar contains an invalid event.',
    'invalid-review': 'The review must fit between 09:00 and 17:00.',
    'invalid-window': 'Choose an end time later than the start time.',
    'invalid-request': 'Choose a valid duration and gap.',
    'review-conflict': 'The review overlaps a saved event. Change its start or length.',
    'no-space': 'No complete plan fits. Widen the time window, shorten focus, or reduce the gap.',
    sync: 'Team sync', review: 'Review', lunch: 'Lunch', office: 'Office hours',
    meeting: 'Meeting', reading: 'Reading', focusEvent: 'Focus',
    changedReview: 'Review moved', changedReviewLength: 'Review updated',
    minutes: value => `${value} min`, savedCount: value => `${value} saved events`,
    proposalCount: value => `${value} new ${value === 1 ? 'event' : 'events'}`,
    educationRegion: 'Rectangle area workshop', educationEyebrow: 'GEOMETRY / AREA LAB',
    educationTitle: 'Same area. Different shape.', exercise: 'Exercise',
    courtyard: '01 / Courtyard', studio: '02 / Studio', garden: '03 / Garden',
    area: 'Area', perimeter: 'Perimeter', target: 'Target', width: 'Width', height: 'Height',
    resetExercise: 'Reset shape', showHint: 'Hint', hideHint: 'Hide hint',
    increaseWidth: 'Increase width', decreaseWidth: 'Decrease width',
    increaseHeight: 'Increase height', decreaseHeight: 'Decrease height',
    shapeName: (w, h) => `Rectangle: width ${w}, height ${h}, on a ten by ten unit grid`,
    goal: (a, p) => `Build a rectangle with area ${a} and perimeter ${p}.`,
    units: value => `${value} ${value === 1 ? 'unit' : 'units'}`,
    areaUnit: 'square units', perimeterUnit: 'units around',
    solved: 'Both targets met.', areaCorrect: 'Area fits. Now reshape the boundary.',
    moreArea: value => `${value} more square ${value === 1 ? 'unit' : 'units'} needed.`,
    lessArea: value => `${value} square ${value === 1 ? 'unit' : 'units'} too many.`,
    perimeterCorrect: 'The perimeter matches.',
    morePerimeter: value => `The perimeter needs ${value} more units.`,
    lessPerimeter: value => `The perimeter needs ${value} fewer units.`,
    sumHint: (target, actual) => `Width + height must equal ${target}; yours add to ${actual}.`,
    factorHint: (area, width, height) => `At width ${width}, area ${area} needs height ${height}.`,
    gridHint: (width, height) => `At width ${width}, the required height is ${height}, beyond this 10-unit grid. Increase the width.`,
    divisorHint: (area, width) => `${width} is not a whole-number factor of ${area}. Try a width that divides ${area}.`,
    spreadHint: 'Keep the area; move the two side lengths further apart to increase the perimeter.',
    compactHint: 'Keep the area; move the two side lengths closer together to reduce the perimeter.',
    successHint: (w, h, a, p) => `${w} x ${h} = ${a}. And 2 x (${w} + ${h}) = ${p}.`,
    matched: 'Matched', remaining: 'Not yet matched'
  },
  zh: {
    calendarEyebrow: '\u661f\u671f\u4e00 / \u672c\u5730\u65e5\u5386', calendarTitle: '\u7559\u4e00\u70b9\u65f6\u95f4\u601d\u8003\u3002',
    calendarRegion: '\u672c\u5730\u65e5\u7a0b\u52a9\u624b', resetDay: '\u91cd\u7f6e\u65e5\u7a0b',
    settings: '\u65f6\u95f4\u7ea6\u675f\u4e0e\u8bc4\u5ba1\u5b89\u6392',
    disclaimer: '\u672c\u5730\u89c4\u5219\u6f14\u793a\u3002\u4e0d\u8c03\u7528\u6a21\u578b\uff0c\u4e0d\u8fde\u63a5\u5916\u90e8\u670d\u52a1\uff0c\u4e0d\u5199\u5165\u771f\u5b9e\u65e5\u5386\u3002',
    request: '\u5b89\u6392', focus: '\u4fdd\u7559\u4e13\u6ce8\u65f6\u95f4', 'meeting-reading': '\u4f1a\u8bae + \u9605\u8bfb',
    focusLength: '\u4e13\u6ce8\u65f6\u957f', notBefore: '\u6700\u65e9\u5f00\u59cb', finishBy: '\u6700\u665a\u7ed3\u675f', gap: '\u65e5\u7a0b\u95f4\u9694',
    reviewEdit: '\u9879\u76ee\u8bc4\u5ba1 / \u8349\u7a3f\u7f16\u8f91', reviewStart: '\u5f00\u59cb', reviewLength: '\u65f6\u957f',
    propose: '\u67e5\u627e\u65f6\u6bb5', approve: '\u6279\u51c6\u65b9\u6848', decline: '\u62d2\u7edd',
    saved: '\u5df2\u4fdd\u5b58', preview: '\u5efa\u8bae\u65e5\u7a0b', timeline: '\u65e5\u7a0b\u65f6\u95f4\u8f74\uff0c09:00 \u81f3 17:00',
    savedKey: '\u5df2\u4fdd\u5b58', pendingKey: '\u5f85\u6279\u51c6', emptyPreview: '\u6682\u65e0\u65b9\u6848',
    idle: '\u5df2\u4fdd\u5b58\u7684\u65e5\u7a0b\u672a\u6539\u53d8\u3002', edited: '\u8349\u7a3f\u5df2\u66f4\u6539\uff0c\u8bf7\u91cd\u65b0\u67e5\u627e\u65f6\u6bb5\u3002',
    pending: '\u7b49\u5f85\u6279\u51c6\u3002\u5df2\u4fdd\u5b58\u7684\u65e5\u7a0b\u672a\u6539\u53d8\u3002',
    applied: '\u5df2\u6279\u51c6\uff0c\u65b0\u65f6\u6bb5\u5df2\u52a0\u5165\u672c\u5730\u65e5\u5386\u3002',
    declined: '\u5df2\u62d2\u7edd\uff0c\u5df2\u4fdd\u5b58\u7684\u65e5\u7a0b\u672a\u6539\u53d8\u3002',
    'invalid-calendar': '\u65e5\u5386\u5305\u542b\u65e0\u6548\u65e5\u7a0b\u3002',
    'invalid-review': '\u8bc4\u5ba1\u9700\u5728 09:00 \u81f3 17:00 \u4e4b\u95f4\u5b8c\u6210\u3002',
    'invalid-window': '\u7ed3\u675f\u65f6\u95f4\u5fc5\u987b\u665a\u4e8e\u5f00\u59cb\u65f6\u95f4\u3002',
    'invalid-request': '\u8bf7\u9009\u62e9\u6709\u6548\u7684\u65f6\u957f\u548c\u95f4\u9694\u3002',
    'review-conflict': '\u8bc4\u5ba1\u4e0e\u5df2\u4fdd\u5b58\u65e5\u7a0b\u51b2\u7a81\uff0c\u8bf7\u4fee\u6539\u5f00\u59cb\u65f6\u95f4\u6216\u65f6\u957f\u3002',
    'no-space': '\u6ca1\u6709\u80fd\u5bb9\u7eb3\u5b8c\u6574\u65b9\u6848\u7684\u7a7a\u95f4\u3002\u8bf7\u6269\u5927\u65f6\u95f4\u8303\u56f4\u3001\u7f29\u77ed\u4e13\u6ce8\u65f6\u957f\u6216\u51cf\u5c11\u95f4\u9694\u3002',
    sync: '\u6668\u4f1a', review: '\u8bc4\u5ba1', lunch: '\u5348\u9910', office: '\u7b54\u7591',
    meeting: '\u4f1a\u8bae', reading: '\u9605\u8bfb', focusEvent: '\u4e13\u6ce8',
    changedReview: '\u8bc4\u5ba1\u5df2\u79fb\u52a8', changedReviewLength: '\u8bc4\u5ba1\u5df2\u8c03\u6574',
    minutes: value => `${value} \u5206\u949f`, savedCount: value => `${value} \u9879\u5df2\u4fdd\u5b58`,
    proposalCount: value => `${value} \u9879\u65b0\u65e5\u7a0b`,
    educationRegion: '\u77e9\u5f62\u9762\u79ef\u5de5\u4f5c\u574a', educationEyebrow: '\u51e0\u4f55 / \u9762\u79ef\u5b9e\u9a8c\u5ba4',
    educationTitle: '\u76f8\u540c\u9762\u79ef\uff0c\u4e0d\u540c\u5f62\u72b6\u3002', exercise: '\u7ec3\u4e60',
    courtyard: '01 / \u5ead\u9662', studio: '02 / \u5de5\u4f5c\u5ba4', garden: '03 / \u82b1\u56ed',
    area: '\u9762\u79ef', perimeter: '\u5468\u957f', target: '\u76ee\u6807', width: '\u5bbd', height: '\u9ad8',
    resetExercise: '\u91cd\u7f6e\u5f62\u72b6', showHint: '\u63d0\u793a', hideHint: '\u6536\u8d77\u63d0\u793a',
    increaseWidth: '\u589e\u52a0\u5bbd\u5ea6', decreaseWidth: '\u51cf\u5c11\u5bbd\u5ea6',
    increaseHeight: '\u589e\u52a0\u9ad8\u5ea6', decreaseHeight: '\u51cf\u5c11\u9ad8\u5ea6',
    shapeName: (w, h) => `\u5341\u4e58\u5341\u5355\u4f4d\u7f51\u683c\u4e0a\u7684\u77e9\u5f62\uff0c\u5bbd ${w}\uff0c\u9ad8 ${h}`,
    goal: (a, p) => `\u6784\u9020\u9762\u79ef\u4e3a ${a}\u3001\u5468\u957f\u4e3a ${p} \u7684\u77e9\u5f62\u3002`,
    units: value => `${value} \u5355\u4f4d`, areaUnit: '\u5e73\u65b9\u5355\u4f4d', perimeterUnit: '\u5355\u4f4d\u957f\u5ea6',
    solved: '\u4e24\u4e2a\u76ee\u6807\u5747\u5df2\u8fbe\u6210\u3002', areaCorrect: '\u9762\u79ef\u6b63\u786e\uff0c\u518d\u8c03\u6574\u8fb9\u754c\u3002',
    moreArea: value => `\u8fd8\u9700 ${value} \u5e73\u65b9\u5355\u4f4d\u3002`,
    lessArea: value => `\u591a\u4e86 ${value} \u5e73\u65b9\u5355\u4f4d\u3002`,
    perimeterCorrect: '\u5468\u957f\u5df2\u5339\u914d\u3002',
    morePerimeter: value => `\u5468\u957f\u8fd8\u9700\u589e\u52a0 ${value} \u5355\u4f4d\u3002`,
    lessPerimeter: value => `\u5468\u957f\u8fd8\u9700\u51cf\u5c11 ${value} \u5355\u4f4d\u3002`,
    sumHint: (target, actual) => `\u5bbd + \u9ad8\u5e94\u4e3a ${target}\uff1b\u5f53\u524d\u4e3a ${actual}\u3002`,
    factorHint: (area, width, height) => `\u5bbd\u4e3a ${width} \u65f6\uff0c\u9762\u79ef ${area} \u9700\u8981\u9ad8\u4e3a ${height}\u3002`,
    gridHint: (width, height) => `\u5bbd\u4e3a ${width} \u65f6\u9700\u8981\u9ad8\u4e3a ${height}\uff0c\u8d85\u51fa 10 \u5355\u4f4d\u7f51\u683c\u3002\u8bf7\u589e\u52a0\u5bbd\u5ea6\u3002`,
    divisorHint: (area, width) => `${width} \u4e0d\u662f ${area} \u7684\u6574\u6570\u56e0\u5b50\uff0c\u8bf7\u5c1d\u8bd5\u80fd\u6574\u9664 ${area} \u7684\u5bbd\u5ea6\u3002`,
    spreadHint: '\u4fdd\u6301\u9762\u79ef\uff0c\u62c9\u5927\u4e24\u8fb9\u957f\u5ea6\u7684\u5dee\u8ddd\u4ee5\u589e\u52a0\u5468\u957f\u3002',
    compactHint: '\u4fdd\u6301\u9762\u79ef\uff0c\u8ba9\u4e24\u8fb9\u957f\u5ea6\u66f4\u63a5\u8fd1\u4ee5\u51cf\u5c11\u5468\u957f\u3002',
    successHint: (w, h, a, p) => `${w} x ${h} = ${a}\u3002\u4e14 2 x (${w} + ${h}) = ${p}\u3002`,
    matched: '\u5df2\u5339\u914d', remaining: '\u5c1a\u672a\u5339\u914d'
  }
};

let instanceSequence = 0;

function makeSurface(root, className, lang) {
  const document = root.ownerDocument;
  const surface = document.createElement('section');
  surface.className = className;
  surface.lang = normalizeLanguage(lang);
  surface.setAttribute('role', 'region');
  surface.tabIndex = 0;
  root.append(surface);
  const disposers = [];
  let destroyed = false;
  return {
    surface, document, prefix: `topic-workbench-${++instanceSequence}`,
    get destroyed() { return destroyed; },
    on(target, name, listener) {
      target.addEventListener(name, listener);
      disposers.push(() => target.removeEventListener(name, listener));
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      disposers.splice(0).forEach(dispose => dispose());
      surface.remove();
    }
  };
}

function translate(surface, strings) {
  surface.querySelectorAll('[data-copy]').forEach(node => setText(node, strings[node.dataset.copy]));
}

function setText(node, value) {
  if (node.textContent !== String(value)) node.textContent = value;
}

function setOptions(select, entries, value) {
  const document = select.ownerDocument;
  if (select.options.length !== entries.length
    || entries.some(([key], index) => select.options[index].value !== String(key))) {
    select.replaceChildren(...entries.map(([key, text]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = text;
      return option;
    }));
  } else entries.forEach(([, text], index) => setText(select.options[index], text));
  if (select.value !== String(value)) select.value = String(value);
}

function associateFields(surface, prefix) {
  surface.querySelectorAll('[data-field]').forEach(field => {
    field.id = `${prefix}-${field.dataset.field}`;
    const label = surface.querySelector(`[data-label="${field.dataset.field}"]`);
    if (label) label.htmlFor = field.id;
  });
}

function timeOptions(start, end) {
  return Array.from({ length: (end - start) / STEP + 1 }, (_, index) => {
    const minutes = start + index * STEP;
    return [minutes, formatCalendarTime(minutes)];
  });
}

export function mountAgent(root, { lang = 'en' } = {}) {
  const lifecycle = makeSurface(root, 'topic-agent', lang);
  const { surface, document } = lifecycle;
  const defaults = () => ({
    calendar: createInitialCalendar(), request: 'focus', focusMinutes: 90,
    windowStart: DAY_START, windowEnd: DAY_END, bufferMinutes: 0,
    reviewStart: 600, reviewMinutes: 60, pending: null, status: 'idle', lastChanges: []
  });
  let state = defaults();
  let language = normalizeLanguage(lang);
  surface.innerHTML = `
    <div class="tw-inner">
      <form class="tw-request">
        <div class="tw-command">
          <div class="tw-field"><label class="tw-sr-only" data-label="request" data-copy="request"></label><select data-field="request"></select></div>
          <button type="submit" class="tw-primary" data-copy="propose"></button>
        </div>
        <p class="tw-disclaimer" data-copy="disclaimer"></p>
        <div class="tw-calendar-result">
          <div class="tw-calendar-meta"><span data-saved-count></span><span class="tw-pending-key" data-copy="pendingKey"></span></div>
          <div class="tw-timeline-head"><span></span><strong data-copy="saved"></strong><strong data-copy="preview"></strong></div>
          <div class="tw-timeline" role="group">
            <div class="tw-hours" aria-hidden="true"></div>
            <div class="tw-lane" data-lane="saved" role="list"></div>
            <div class="tw-lane tw-preview-lane" data-lane="preview" role="list"></div>
          </div>
          <div class="tw-decision">
            <p class="tw-status" role="status" aria-live="polite" aria-atomic="true"></p>
            <ul class="tw-change-list"></ul>
            <div class="tw-actions">
              <button type="button" class="tw-primary" data-action="approve" data-copy="approve"></button>
              <button type="button" class="tw-quiet" data-action="decline" data-copy="decline"></button>
            </div>
          </div>
        </div>
        <details class="tw-settings">
          <summary data-copy="settings"></summary>
          <div class="tw-settings-fields">
          <div class="tw-field" data-focus-field><label data-label="focusMinutes" data-copy="focusLength"></label><select data-field="focusMinutes"></select></div>
          <div class="tw-field-row">
            <div class="tw-field"><label data-label="windowStart" data-copy="notBefore"></label><select data-field="windowStart"></select></div>
            <div class="tw-field"><label data-label="windowEnd" data-copy="finishBy"></label><select data-field="windowEnd"></select></div>
          </div>
          <div class="tw-field"><label data-label="bufferMinutes" data-copy="gap"></label><select data-field="bufferMinutes"></select></div>
          <fieldset class="tw-review">
            <legend data-copy="reviewEdit"></legend>
            <div class="tw-field-row">
              <div class="tw-field"><label data-label="reviewStart" data-copy="reviewStart"></label><select data-field="reviewStart"></select></div>
              <div class="tw-field"><label data-label="reviewMinutes" data-copy="reviewLength"></label><select data-field="reviewMinutes"></select></div>
            </div>
          </fieldset>
          <button type="button" class="tw-quiet" data-action="reset" data-copy="resetDay"></button>
          </div>
        </details>
      </form>
    </div>`;
  associateFields(surface, lifecycle.prefix);
  const field = name => surface.querySelector(`[data-field="${name}"]`);
  const status = surface.querySelector('.tw-status');
  status.id = `${lifecycle.prefix}-status`;
  surface.querySelector('form').setAttribute('aria-describedby', status.id);
  const savedLane = surface.querySelector('[data-lane="saved"]');
  const previewLane = surface.querySelector('[data-lane="preview"]');
  const hours = surface.querySelector('.tw-hours');
  for (let minute = DAY_START; minute <= DAY_END; minute += 60) {
    const mark = document.createElement('span');
    mark.textContent = formatCalendarTime(minute);
    mark.style.top = `${(minute - DAY_START) / (DAY_END - DAY_START) * 100}%`;
    hours.append(mark);
  }
  const labelEvent = (event, strings) => strings[event.kind === 'focus' ? 'focusEvent' : event.kind] || event.kind;
  const eventTime = event => `${formatCalendarTime(event.start)} - ${formatCalendarTime(event.end)}`;

  function drawLane(lane, events, isPreview, strings) {
    if (!lane.querySelector('.tw-gridline')) {
      for (let hour = 0; hour <= 8; hour += 1) {
        const line = document.createElement('i');
        line.className = 'tw-gridline';
        line.setAttribute('aria-hidden', 'true');
        line.style.top = `${hour / 8 * 100}%`;
        lane.append(line);
      }
    }
    lane.querySelectorAll('.tw-event').forEach(node => {
      if (!events?.some(event => event.id === node.dataset.eventId)) node.remove();
    });
    if (!events) {
      const empty = lane.querySelector('.tw-empty-preview') || document.createElement('p');
      empty.className = 'tw-empty-preview';
      empty.setAttribute('role', 'listitem');
      setText(empty, strings.emptyPreview);
      if (!empty.parentNode) lane.append(empty);
      return;
    }
    lane.querySelector('.tw-empty-preview')?.remove();
    for (const event of events) {
      const original = state.calendar.find(item => item.id === event.id);
      const changed = isPreview && (!original || original.start !== event.start || original.end !== event.end);
      const strip = Array.from(lane.querySelectorAll('.tw-event')).find(node => node.dataset.eventId === event.id) || document.createElement('div');
      strip.className = 'tw-event';
      strip.dataset.eventId = event.id;
      strip.dataset.kind = event.kind;
      strip.dataset.state = changed ? 'pending' : isPreview ? 'unchanged' : 'saved';
      strip.dataset.start = event.start;
      strip.dataset.end = event.end;
      strip.dataset.compact = String(event.end - event.start <= 45);
      strip.setAttribute('role', 'listitem');
      strip.setAttribute('aria-label', `${labelEvent(event, strings)}, ${eventTime(event)}, ${changed ? strings.pendingKey : strings.savedKey}`);
      strip.title = strip.getAttribute('aria-label');
      strip.style.top = `${(event.start - DAY_START) / (DAY_END - DAY_START) * 100}%`;
      strip.style.height = `${(event.end - event.start) / (DAY_END - DAY_START) * 100}%`;
      const title = strip.querySelector('strong') || document.createElement('strong');
      setText(title, labelEvent(event, strings));
      const time = strip.querySelector('span') || document.createElement('span');
      setText(time, eventTime(event));
      if (!title.parentNode) strip.append(title, time);
      if (!strip.parentNode) lane.append(strip);
    }
  }

  function render() {
    const strings = copy[language];
    surface.lang = language;
    surface.setAttribute('aria-label', strings.calendarRegion);
    surface.dataset.status = state.status;
    translate(surface, strings);
    setOptions(field('request'), ['focus', 'meeting-reading'].map(key => [key, strings[key]]), state.request);
    setOptions(field('focusMinutes'), [30, 45, 60, 90, 120].map(value => [value, strings.minutes(value)]), state.focusMinutes);
    setOptions(field('windowStart'), timeOptions(DAY_START, DAY_END - STEP), state.windowStart);
    setOptions(field('windowEnd'), timeOptions(DAY_START + STEP, DAY_END), state.windowEnd);
    setOptions(field('bufferMinutes'), [0, 15, 30].map(value => [value, strings.minutes(value)]), state.bufferMinutes);
    setOptions(field('reviewStart'), timeOptions(DAY_START, DAY_END - 30), state.reviewStart);
    setOptions(field('reviewMinutes'), [30, 45, 60, 90].map(value => [value, strings.minutes(value)]), state.reviewMinutes);
    surface.querySelector('[data-focus-field]').hidden = state.request !== 'focus';
    setText(status, strings[state.status]);
    status.dataset.error = String(!['idle', 'edited', 'pending', 'applied', 'declined'].includes(state.status));
    surface.querySelector('[data-action="approve"]').disabled = !state.pending;
    surface.querySelector('[data-action="decline"]').disabled = !state.pending;
    surface.querySelector('.tw-decision .tw-actions').hidden = !state.pending;
    surface.querySelector('[data-saved-count]').textContent = strings.savedCount(state.calendar.length);
    surface.querySelector('.tw-pending-key').hidden = !state.pending;
    const changes = surface.querySelector('.tw-change-list');
    changes.replaceChildren();
    const additions = state.pending?.additions || state.lastChanges;
    additions.forEach(event => {
      const item = document.createElement('li');
      item.textContent = `${labelEvent(event, strings)} / ${eventTime(event)}`;
      changes.append(item);
    });
    if (state.pending?.reviewChanged) {
      const oldReview = state.calendar.find(event => event.id === 'review');
      const nextReview = state.pending.events.find(event => event.id === 'review');
      const item = document.createElement('li');
      item.textContent = `${strings.changedReviewLength}: ${eventTime(oldReview)} / ${eventTime(nextReview)}`;
      changes.append(item);
    }
    surface.querySelector('.tw-timeline').setAttribute('aria-label', strings.timeline);
    savedLane.setAttribute('aria-label', strings.saved);
    previewLane.setAttribute('aria-label', strings.preview);
    drawLane(savedLane, state.calendar, false, strings);
    drawLane(previewLane, state.pending?.events, true, strings);
  }

  lifecycle.on(surface.querySelector('form'), 'submit', event => {
    event.preventDefault();
    const proposal = proposeSchedule({ ...state, events: state.calendar });
    state.pending = proposal.ok ? proposal : null;
    state.lastChanges = [];
    state.status = proposal.ok ? 'pending' : proposal.reason;
    render();
    if (proposal.ok) surface.querySelector('[data-action="approve"]').focus({ preventScroll: true });
  });
  lifecycle.on(surface, 'change', event => {
    const name = event.target.dataset.field;
    if (!name || !(name in state)) return;
    state[name] = name === 'request' ? event.target.value : Number(event.target.value);
    state.pending = null;
    state.lastChanges = [];
    state.status = 'edited';
    render();
  });
  lifecycle.on(surface, 'click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'reset') state = defaults();
    if (action === 'approve' && state.pending) {
      state.calendar = state.pending.events.map(item => ({ ...item }));
      state.lastChanges = state.pending.additions.map(item => ({ ...item }));
      state.pending = null;
      state.status = 'applied';
    }
    if (action === 'decline' && state.pending) {
      state.pending = null;
      state.lastChanges = [];
      const review = state.calendar.find(item => item.id === 'review');
      state.reviewStart = review.start;
      state.reviewMinutes = review.end - review.start;
      state.status = 'declined';
    }
    render();
    if (action === 'approve' || action === 'decline') surface.querySelector('[type="submit"]').focus({ preventScroll: true });
  });
  render();
  return {
    setLanguage(nextLanguage) {
      if (lifecycle.destroyed) return;
      const next = normalizeLanguage(nextLanguage);
      if (next === language) return;
      language = next;
      const scrollTop = surface.scrollTop;
      render();
      surface.scrollTop = scrollTop;
    },
    destroy: () => lifecycle.destroy()
  };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function mountEducation(root, { lang = 'en' } = {}) {
  const lifecycle = makeSurface(root, 'topic-education', lang);
  const { surface, document } = lifecycle;
  let language = normalizeLanguage(lang);
  let exercise = RECTANGLE_EXERCISES[0];
  let width = exercise.width;
  let height = exercise.height;
  let hintVisible = false;
  let pointerId = null;
  surface.innerHTML = `
    <div class="tw-inner">
      <div class="tw-exercise-row">
        <div class="tw-field"><label class="tw-sr-only" data-label="exercise" data-copy="exercise"></label><select data-field="exercise"></select></div>
        <p class="tw-goal"></p>
      </div>
      <div class="tw-math-workspace">
        <figure class="tw-paper">
          <div class="tw-dimension tw-dimension-height" aria-hidden="true"></div>
          <svg class="tw-area-grid" viewBox="0 0 320 300" role="img">
            <g class="tw-grid-base" aria-hidden="true"></g>
            <rect class="tw-shape-fill" aria-hidden="true"></rect>
            <g class="tw-grid-ink" aria-hidden="true"></g>
            <rect class="tw-shape-outline" aria-hidden="true"></rect>
            <g class="tw-drag-handle" data-handle aria-hidden="true">
              <rect class="tw-handle-hit" width="58" height="58" x="-29" y="-29"></rect>
              <circle r="7"></circle><path d="M -3 0 H 3 M 0 -3 V 3"></path>
            </g>
          </svg>
          <div class="tw-dimension tw-dimension-width" aria-hidden="true"></div>
          <figcaption class="tw-equation"></figcaption>
        </figure>
        <div class="tw-math-controls">
          <div class="tw-measures">
            <div class="tw-measure" data-measure="area"><span data-copy="area"></span><div><strong data-value></strong><span class="tw-target"></span></div><span class="tw-unit" data-copy="areaUnit"></span><span class="tw-match"></span></div>
            <div class="tw-measure" data-measure="perimeter"><span data-copy="perimeter"></span><div><strong data-value></strong><span class="tw-target"></span></div><span class="tw-unit" data-copy="perimeterUnit"></span><span class="tw-match"></span></div>
          </div>
          <div class="tw-side-control" data-side="width">
            <div class="tw-side-label"><label data-label="width" data-copy="width"></label><output data-side-value="width"></output></div>
            <div class="tw-stepper"><button type="button" data-step="-1" data-axis="width">&#8722;</button><input type="range" min="1" max="10" step="1" data-field="width"><button type="button" data-step="1" data-axis="width">+</button></div>
          </div>
          <div class="tw-side-control" data-side="height">
            <div class="tw-side-label"><label data-label="height" data-copy="height"></label><output data-side-value="height"></output></div>
            <div class="tw-stepper"><button type="button" data-step="-1" data-axis="height">&#8722;</button><input type="range" min="1" max="10" step="1" data-field="height"><button type="button" data-step="1" data-axis="height">+</button></div>
          </div>
          <div class="tw-feedback" role="status" aria-live="polite" aria-atomic="true"></div>
          <div class="tw-actions"><button type="button" data-action="hint" class="tw-quiet"></button><button type="button" data-action="reset" class="tw-quiet" data-copy="resetExercise"></button></div>
          <p class="tw-hint" hidden></p>
        </div>
      </div>
    </div>`;
  associateFields(surface, lifecycle.prefix);
  const svg = surface.querySelector('svg');
  const gridBase = surface.querySelector('.tw-grid-base');
  const gridInk = surface.querySelector('.tw-grid-ink');
  const ink = document.createElementNS(SVG_NS, 'path');
  gridInk.append(ink);
  const fill = surface.querySelector('.tw-shape-fill');
  const outline = surface.querySelector('.tw-shape-outline');
  const handle = surface.querySelector('.tw-drag-handle');
  const hint = surface.querySelector('.tw-hint');
  hint.id = `${lifecycle.prefix}-hint`;
  const hintButton = surface.querySelector('[data-action="hint"]');
  hintButton.setAttribute('aria-controls', hint.id);
  const feedback = surface.querySelector('.tw-feedback');
  feedback.id = `${lifecycle.prefix}-feedback`;
  for (let index = 0; index <= 10; index += 1) {
    const line = document.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', `M ${28 + index * 26} 12 V 272 M 28 ${12 + index * 26} H 288`);
    gridBase.append(line);
  }

  function updateShape() {
    const strings = copy[language];
    const result = evaluateRectangle(exercise.id, width, height);
    surface.dataset.solved = String(result.solved);
    surface.dataset.exercise = exercise.id;
    surface.dataset.width = width;
    surface.dataset.height = height;
    for (const rect of [fill, outline]) {
      rect.setAttribute('x', '28');
      rect.setAttribute('y', '12');
      rect.setAttribute('width', String(width * 26));
      rect.setAttribute('height', String(height * 26));
    }
    const paths = [];
    for (let column = 1; column < width; column += 1) paths.push(`M ${28 + column * 26} 12 V ${12 + height * 26}`);
    for (let row = 1; row < height; row += 1) paths.push(`M 28 ${12 + row * 26} H ${28 + width * 26}`);
    ink.setAttribute('d', paths.join(' '));
    handle.setAttribute('transform', `translate(${28 + width * 26}, ${12 + height * 26})`);
    svg.setAttribute('aria-label', strings.shapeName(width, height));
    surface.querySelector('.tw-dimension-width').textContent = `${strings.width} ${width}`;
    surface.querySelector('.tw-dimension-height').textContent = `${strings.height} ${height}`;
    surface.querySelector('.tw-equation').textContent = `${width} \u00d7 ${height} = ${result.area}`;
    for (const [axis, value] of [['width', width], ['height', height]]) {
      const input = surface.querySelector(`[data-field="${axis}"]`);
      input.value = value;
      input.setAttribute('aria-valuetext', strings.units(value));
      input.setAttribute('aria-describedby', feedback.id);
      surface.querySelector(`[data-side-value="${axis}"]`).textContent = strings.units(value);
      for (const direction of [-1, 1]) {
        const button = surface.querySelector(`[data-axis="${axis}"][data-step="${direction}"]`);
        const key = `${direction === 1 ? 'increase' : 'decrease'}${axis === 'width' ? 'Width' : 'Height'}`;
        button.setAttribute('aria-label', strings[key]);
        button.title = strings[key];
        button.disabled = direction === 1 ? value === 10 : value === 1;
      }
    }
    for (const key of ['area', 'perimeter']) {
      const measure = surface.querySelector(`[data-measure="${key}"]`);
      const matched = result[`${key}Match`];
      measure.dataset.matched = String(matched);
      measure.querySelector('[data-value]').textContent = result[key];
      measure.querySelector('.tw-target').textContent = `/ ${exercise[key]}`;
      measure.querySelector('.tw-target').setAttribute('aria-label', `${strings.target} ${exercise[key]}`);
      measure.querySelector('.tw-match').textContent = matched ? strings.matched : strings.remaining;
    }
    const areaFeedback = result.areaMatch ? strings.areaCorrect : result.areaDelta > 0
      ? strings.moreArea(result.areaDelta) : strings.lessArea(-result.areaDelta);
    const perimeterFeedback = result.perimeterMatch ? strings.perimeterCorrect : result.perimeterDelta > 0
      ? strings.morePerimeter(result.perimeterDelta) : strings.lessPerimeter(-result.perimeterDelta);
    setText(feedback, result.solved
      ? `${strings.solved} ${strings.successHint(width, height, result.area, result.perimeter)}`
      : `${areaFeedback} ${perimeterFeedback}`);
    let hintText;
    if (result.solved) hintText = strings.successHint(width, height, result.area, result.perimeter);
    else if (result.areaMatch) hintText = result.perimeterDelta > 0 ? strings.spreadHint : strings.compactHint;
    else if (exercise.area % width === 0 && exercise.area / width <= 10) hintText = strings.factorHint(exercise.area, width, exercise.area / width);
    else if (exercise.area % width === 0) hintText = strings.gridHint(width, exercise.area / width);
    else hintText = strings.divisorHint(exercise.area, width);
    hint.textContent = `${hintText} ${strings.sumHint(exercise.perimeter / 2, width + height)}`;
    hint.hidden = !hintVisible;
    hintButton.textContent = strings[hintVisible ? 'hideHint' : 'showHint'];
    hintButton.setAttribute('aria-expanded', String(hintVisible));
  }

  function render() {
    const strings = copy[language];
    surface.lang = language;
    surface.setAttribute('aria-label', strings.educationRegion);
    translate(surface, strings);
    setOptions(surface.querySelector('[data-field="exercise"]'), RECTANGLE_EXERCISES.map(item => [item.id, strings[item.id]]), exercise.id);
    surface.querySelector('.tw-goal').textContent = strings.goal(exercise.area, exercise.perimeter);
    updateShape();
  }

  function setSide(axis, value) {
    const next = Math.max(1, Math.min(10, Math.round(value)));
    if (!Number.isFinite(next)) return;
    if (axis === 'width') width = next;
    if (axis === 'height') height = next;
    updateShape();
  }

  function stopDrag() {
    if (pointerId !== null && svg.hasPointerCapture(pointerId)) svg.releasePointerCapture(pointerId);
    pointerId = null;
    surface.removeAttribute('data-dragging');
  }

  lifecycle.on(surface, 'input', event => {
    const axis = event.target.dataset.field;
    if (axis === 'width' || axis === 'height') setSide(axis, Number(event.target.value));
  });
  lifecycle.on(surface, 'change', event => {
    if (event.target.dataset.field !== 'exercise') return;
    const selected = RECTANGLE_EXERCISES.find(item => item.id === event.target.value);
    if (!selected) return;
    stopDrag();
    exercise = selected;
    width = exercise.width;
    height = exercise.height;
    hintVisible = false;
    render();
  });
  lifecycle.on(surface, 'click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.axis) {
      const axis = button.dataset.axis;
      setSide(axis, (axis === 'width' ? width : height) + Number(button.dataset.step));
    }
    if (button.dataset.action === 'hint') {
      hintVisible = !hintVisible;
      updateShape();
    }
    if (button.dataset.action === 'reset') {
      stopDrag();
      width = exercise.width;
      height = exercise.height;
      hintVisible = false;
      updateShape();
    }
  });
  lifecycle.on(svg, 'pointerdown', event => {
    if (!event.target.closest('[data-handle]') || event.button !== 0 || pointerId !== null) return;
    event.preventDefault();
    pointerId = event.pointerId;
    svg.setPointerCapture(pointerId);
    surface.dataset.dragging = 'true';
  });
  lifecycle.on(svg, 'pointermove', event => {
    if (event.pointerId !== pointerId) return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    const nextWidth = Math.max(1, Math.min(10, Math.round((local.x - 28) / 26)));
    const nextHeight = Math.max(1, Math.min(10, Math.round((local.y - 12) / 26)));
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    updateShape();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) lifecycle.on(svg, name, event => {
    if (event.pointerId === pointerId) stopDrag();
  });
  render();
  return {
    setLanguage(nextLanguage) {
      if (lifecycle.destroyed) return;
      const next = normalizeLanguage(nextLanguage);
      if (next === language) return;
      language = next;
      const scrollTop = surface.scrollTop;
      render();
      surface.scrollTop = scrollTop;
    },
    destroy() {
      stopDrag();
      lifecycle.destroy();
    }
  };
}
