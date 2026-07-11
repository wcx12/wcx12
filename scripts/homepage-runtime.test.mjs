import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { localRepos, staticPublications } from '../site-data.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const read = (relativePath) => fs.readFile(path.join(rootDir, relativePath), 'utf8');

const [
  indexSource,
  scriptSource,
  researchCanvasSource,
  repoMapSource,
  styleSource,
  readmeSource,
  researchConfigSource
] = await Promise.all([
  read('index.html'),
  read('script.js'),
  read('research-canvas.js'),
  read('repo-map.js'),
  read('styles.css'),
  read('README.md'),
  read('research-config.json')
]);

const researchConfig = JSON.parse(researchConfigSource);
const topicIds = new Set(researchConfig.interests.flatMap((interest) => interest.children.map((child) => child.id)));

function literalDomIds(source) {
  return [...source.matchAll(/getElementById\(\s*(['"])([^'"]+)\1\s*\)/g)].map((match) => match[2]);
}

function htmlIds(source) {
  return new Set([...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
}

test('every literal DOM lookup used by the homepage modules exists', () => {
  const ids = htmlIds(indexSource);
  const missing = [scriptSource, researchCanvasSource, repoMapSource]
    .flatMap(literalDomIds)
    .filter((id, index, values) => !ids.has(id) && values.indexOf(id) === index);

  assert.deepEqual(missing, [], `missing homepage elements: ${missing.join(', ')}`);
});

test('research and repository visualizations are real lazy modules', async () => {
  assert.match(indexSource, /<script\s+type="module"\s+src="script\.js\?v=[a-f0-9]{12}"><\/script>/i);
  assert.match(scriptSource, /await import\(versionedModuleUrl\('\.\/site-data\.js'\)\)/);
  assert.match(scriptSource, /import\(researchCanvasModuleUrl\(\)\)/);
  assert.match(scriptSource, /import\(repoMapModuleUrl\(\)\)/);
  assert.match(scriptSource, /versionedModuleUrl\('\.\/research-canvas\.js', attempt \? \{ retry: attempt \} : \{\}\)/);
  assert.match(scriptSource, /versionedModuleUrl\('\.\/repo-map\.js', attempt \? \{ retry: attempt \} : \{\}\)/);
  assert.match(scriptSource, /url\.searchParams\.set\('v', assetVersion\)/, 'lazy modules must inherit the release version');
  assert.match(scriptSource, /versionedModuleUrl\(CONFIG_PATH\)/, 'research config must inherit the release version');
  assert.match(scriptSource, /versionedModuleUrl\('\.\/blog\/posts\.json'\)/, 'blog metadata must inherit the release version');
  assert.doesNotMatch(scriptSource, /\bfrom\s+['"]\.\/(?:research-canvas|repo-map)\.js['"]/);
  assert.doesNotMatch(indexSource, /<script\b[^>]+src="(?:\.\/)?(?:research-canvas|repo-map)\.js"/i);
  assert.match(scriptSource, /function drawRoundedRect\(/, 'eager hero preview lost its rounded-rectangle helper');
  assert.match(scriptSource, /function fillTruncatedText\(/, 'eager hero preview lost its text helper');

  const eagerBytes = (await fs.stat(path.join(rootDir, 'script.js'))).size;
  assert.ok(eagerBytes < 180 * 1024, `eager homepage script grew to ${eagerBytes} bytes`);
});

test('homepage prioritizes verified identity and defers optional data requests', async () => {
  assert.match(indexSource, /<title>Chenxu Wang \(wcx12\) \| Machine Learning Researcher<\/title>/);
  assert.match(indexSource, /<h1>Chenxu Wang <span class="hero-alias">\(wcx12\)<\/span><\/h1>/);
  assert.match(indexSource, /data-i18n="hero_affiliation">Beijing Institute of Technology/);
  assert.doesNotMatch(indexSource, /fonts\.(?:googleapis|gstatic)\.com/i);
  assert.match(styleSource, /space-grotesk-latin\.woff2/);
  assert.match(styleSource, /jetbrains-mono-latin\.woff2/);

  const initialization = scriptSource.slice(scriptSource.lastIndexOf('initCustomCursor();'));
  assert.doesNotMatch(initialization, /\bload(?:Repos|Publications|BlogPosts|RemoteResearchConfig)\(\);/);
  assert.match(scriptSource, /void ensureViewData\(resolvedViewId\)/);
  assert.match(scriptSource, /'Chenxu Wang \(wcx12\) \| Machine Learning Researcher'/);
  assert.match(scriptSource, /`\$\{displayTitle\} \| Chenxu Wang \(wcx12\)`/);

  for (const file of ['space-grotesk-latin.woff2', 'jetbrains-mono-latin.woff2', 'OFL-SpaceGrotesk.txt', 'OFL-JetBrainsMono.txt']) {
    const stats = await fs.stat(path.join(rootDir, 'assets', 'fonts', file));
    assert.ok(stats.size > 1000, `${file} is missing or unexpectedly small`);
  }
});

test('mobile utility controls stay above content and touch instructions avoid desktop-only gestures', () => {
  assert.match(styleSource, /\.topbar\s*\{[^}]*z-index:\s*50\s*;/s, 'mobile settings need their own top-level stacking context');
  assert.match(styleSource, /\.utility-menu-panel\s*\{[^}]*right:\s*auto\s*;[^}]*left:\s*0\s*;/s, 'mobile settings panel must open into the viewport');
  assert.match(styleSource, /@media\s*\(hover:\s*none\),\s*\(pointer:\s*coarse\)[\s\S]*?\.touch-hint\s*\{[^}]*display:\s*inline/s);
  assert.match(indexSource, /class="desktop-hint" data-i18n="hints"/);
  assert.match(indexSource, /class="touch-hint" data-i18n="hints_touch"/);
  assert.match(indexSource, /data-i18n="repo_map_hint_touch"/);
});

test('project view gives immediate feedback and limits first-render work on phones', () => {
  assert.match(indexSource, /<option value="6">6<\/option>/);
  assert.match(scriptSource, /const compactViewportQuery = window\.matchMedia\('\(max-width: 720px\)'\)/);
  assert.match(scriptSource, /pageSize: compactViewportQuery\.matches \? 6 : 12/);
  assert.match(scriptSource, /requestAnimationFrame\(\(\) => \{[\s\S]*?requestAnimationFrame\(\(\) => \{[\s\S]*?renderLazyView\(resolvedViewId\)/);
  assert.match(scriptSource, /previousCards\.size === 0/, 'first render must not animate every card from an empty layout');
  assert.match(styleSource, /\.repo-card\s*\{[^}]*content-visibility:\s*auto;[^}]*contain-intrinsic-size:\s*360px;/s);
});

test('canvas motion respects mobile budgets and page visibility', () => {
  assert.match(scriptSource, /Math\.min\(window\.devicePixelRatio \|\| 1, MAX_CANVAS_DPR\)/);
  for (const source of [researchCanvasSource, repoMapSource]) {
    assert.match(source, /const MAX_CANVAS_DPR = 2/);
    assert.match(source, /Math\.min\(window\.devicePixelRatio \|\| 1, MAX_CANVAS_DPR\)/);
    assert.match(source, /document\.visibilityState !== 'visible'/);
    assert.match(source, /IntersectionObserver/);
  }
  assert.match(researchCanvasSource, /INTEREST_MOBILE_IDLE_FRAME_MS = 200/);
  assert.match(researchCanvasSource, /if \(isInterestDragging\(\)\) return INTEREST_DESKTOP_FRAME_MS/);
  assert.match(repoMapSource, /REPO_MAP_MOBILE_IDLE_FRAME_MS = 200/);
});

test('owner mapping uses a framed-safe Actions dispatch instead of a contents token', () => {
  assert.match(scriptSource, /if \(window\.top !== window\.self\)/);
  assert.match(scriptSource, /actions\/workflows\/\$\{GITHUB_CONFIG_WORKFLOW\}\/dispatches/);
  assert.match(scriptSource, /method: 'POST'/);
  assert.match(scriptSource, /expected_sha256: expectedHash/);
  assert.match(scriptSource, /GitHub token \(Actions only\)/);
  assert.doesNotMatch(scriptSource, /repos\/\$\{GITHUB_REPOSITORY\}\/contents\//);
  assert.doesNotMatch(scriptSource, /method: 'PUT'/);
  assert.doesNotMatch(scriptSource, /Contents read\/write/);
});

test('homepage source exposes crawlable research and publication routes', () => {
  const expectedHrefs = [
    './research/',
    './research/point-cloud-registration/',
    './research/vpr/',
    './research/medical-image-analysis/',
    './research/agent/',
    './research/ai4edu/',
    './publications/'
  ];

  for (const href of expectedHrefs) {
    assert.match(indexSource, new RegExp(`<a\\b[^>]*href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'), `${href} must be an ordinary link`);
  }
  assert.match(indexSource, /<noscript>[\s\S]*?\.\/zh\/research\/[\s\S]*?<\/noscript>/i, 'no-JavaScript navigation must include the Chinese research index');
});

test('canonical repository and publication data stays unique and classifiable', () => {
  assert.ok(localRepos.length >= 9, 'repository snapshot unexpectedly lost records');
  assert.equal(new Set(localRepos.map((repo) => repo.name)).size, localRepos.length, 'repository names must be unique');
  assert.equal(new Set(localRepos.map((repo) => repo.html_url)).size, localRepos.length, 'repository URLs must be unique');

  assert.ok(staticPublications.length >= 2, 'canonical publication data unexpectedly lost verified papers');
  assert.equal(new Set(staticPublications.map((publication) => publication.doi)).size, staticPublications.length, 'publication DOIs must be unique');
  for (const doi of ['10.1016/j.neucom.2026.133399', '10.1016/j.neucom.2026.134314']) {
    assert.ok(staticPublications.some((publication) => publication.doi === doi), `verified publication is missing: ${doi}`);
  }

  const assignmentGroups = [
    ...Object.entries(researchConfig.repoAssignments),
    ...Object.entries(researchConfig.paperAssignments),
    ...localRepos.map((repo) => [repo.name, repo.interests || []]),
    ...staticPublications.map((publication) => [publication.title, publication.interests || []])
  ];
  for (const [name, assignments] of assignmentGroups) {
    for (const id of assignments) assert.ok(topicIds.has(id), `${name} uses unknown research topic ${id}`);
  }

  assert.deepEqual(researchConfig.repoAssignments.FusionTrack, ['point-cloud-registration']);
  assert.deepEqual(researchConfig.repoAssignments.wcx12, []);
  assert.deepEqual(
    researchConfig.paperAssignments['Synergistic learning for active learning: A unified training objective for sample-efficient medical image classification'],
    ['medical-image-analysis']
  );
});

test('retired sandbox code and taxonomy drift do not return', () => {
  const homepageSources = [indexSource, scriptSource, researchCanvasSource, styleSource];
  const retiredTerms = [
    'Registration Sandbox',
    'registrationCanvas',
    'registrationNoise',
    'registrationMissing',
    'registrationRotation',
    '.lab-panel',
    '.lab-controls'
  ];

  for (const term of retiredTerms) {
    for (const source of homepageSources) assert.ok(!source.includes(term), `retired homepage term returned: ${term}`);
  }
  for (const [name, source] of [['index.html', indexSource], ['script.js', scriptSource], ['README.md', readmeSource]]) {
    assert.doesNotMatch(source, /\banomal(?:y|ies|ous|y-detection)\b/i, `${name} still advertises an unsupported anomaly-detection focus`);
  }
});
