import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { homepageI18n } from '../homepage-i18n.js';
import { profileData } from '../profile-data.js';

const source = await fs.readFile(new URL('../script.js', import.meta.url), 'utf8');

function loadFunction(name, nextName, context) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf(`function ${nextName}(`, start + 1);
  assert.ok(start >= 0 && end > start, `missing function boundary: ${name}`);
  return vm.runInNewContext(`${source.slice(start, end)}\n${name}`, context);
}

test('identity status and timeline share confirmed profile data in both languages', () => {
  for (const language of ['en', 'zh']) {
    assert.equal(homepageI18n[language].hero_affiliation, profileData.affiliation[language]);
    assert.equal(homepageI18n[language].hero_status_value, profileData.status[language]);
    assert.deepEqual(homepageI18n[language].statuses, [profileData.status[language]]);
    assert.equal(homepageI18n[language].timeline_2026, profileData.currentWork[language]);
    assert.equal(homepageI18n[language].about_line1, profileData.about[language]);
  }
  assert.equal(profileData.education.major.zh, '数据科学');
  assert.equal(profileData.location.zh, '中国深圳');
});

test('research navigation closes blocking overlays before activating its destination', () => {
  const calls = [];
  const context = {
    interestEntryById: () => ({ child: { id: 'vpr' } }),
    modal: { classList: { contains: () => true } },
    readmeDrawer: { classList: { contains: () => true } },
    closeModal: (options) => calls.push(['modal', options.restoreFocus]),
    closeReadmeDrawer: (options) => calls.push(['readme', options.restoreFocus]),
    allRepos: [],
    setInterestPanel: (panel) => calls.push(['panel', panel]),
    activateView: (view) => calls.push(['view', view])
  };
  loadFunction('jumpToResearchInterest', 'focusRepoInProjects', context)('vpr');
  assert.deepEqual(calls, [['modal', false], ['readme', false], ['panel', 'animation'], ['view', 'research']]);
  assert.equal(context.activeInterestId, 'vpr');
});

test('closing a modal for navigation releases inert state without restoring stale focus', () => {
  const calls = [];
  const context = {
    modal: {
      classList: { contains: () => true, remove: () => calls.push('remove') },
      setAttribute: (name, value) => calls.push([name, value])
    },
    modalReturnFocus: {},
    setOverlayActive: (_modal, active) => calls.push(['overlay', active]),
    restoreOverlayFocus: () => calls.push('focus')
  };
  const start = source.indexOf('function closeModal(');
  const end = source.indexOf("modalClose.addEventListener", start);
  const close = vm.runInNewContext(`${source.slice(start, end)}\ncloseModal`, context);
  close({ restoreFocus: false });
  assert.deepEqual(calls, ['remove', ['aria-hidden', 'true'], ['overlay', false]]);
  assert.equal(context.modalReturnFocus, null);
});

test('skip navigation focuses the active view without changing its hash', () => {
  let callback;
  const calls = [];
  const view = { focus: () => calls.push('focus'), scrollIntoView: () => calls.push('scroll') };
  const context = {
    document: {
      querySelector: (selector) => selector === '.skip-link'
        ? { addEventListener: (_event, handler) => { callback = handler; } } : view
    },
    window: { location: { hash: '#research/vpr' } }
  };
  const start = source.indexOf("document.querySelector('.skip-link')");
  const end = source.indexOf('function commandItems()', start);
  vm.runInNewContext(source.slice(start, end), context);
  callback({ preventDefault: () => calls.push('prevent') });
  assert.deepEqual(calls, ['prevent', 'focus', 'scroll']);
  assert.equal(context.window.location.hash, '#research/vpr');
  assert.equal(view.tabIndex, -1);
});

test('mobile topic rail reveals route-selected topics without scrolling the page', () => {
  let bounds = { left: -231, right: 23 };
  const rail = {
    scrollWidth: 1500, clientWidth: 254, scrollLeft: 802,
    getBoundingClientRect: () => ({ left: 33, right: 287 }),
    querySelector: () => ({ getBoundingClientRect: () => bounds })
  };
  const context = {
    interestRail: rail,
    document: { getElementById: () => ({ classList: { contains: () => true } }) },
    ResizeObserver: class { observe() {} }
  };
  const keepVisible = loadFunction('keepActiveInterestVisible', 'setInterestPanel', context);
  keepVisible();
  assert.equal(rail.scrollLeft, 530);
  bounds = { left: 100, right: 200 };
  keepVisible();
  assert.equal(rail.scrollLeft, 530);
  bounds = { left: 270, right: 500 };
  keepVisible();
  assert.equal(rail.scrollLeft, 751);
});
