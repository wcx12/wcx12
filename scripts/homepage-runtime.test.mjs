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
  assert.match(indexSource, /"propertyID": "ORCID"/);
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
  assert.doesNotMatch(styleSource, /\.repo-card\s*\{[^}]*content-visibility:\s*auto;/s, 'offscreen cards must not flash as blank placeholders');
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
  assert.match(researchCanvasSource, /addEventListener\('pointerup'[\s\S]*?updateInterestCanvasAccessibility\(\);[\s\S]*?releasePointerCapture/);
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
    './projects/',
    './publications/'
  ];

  for (const href of expectedHrefs) {
    assert.match(indexSource, new RegExp(`<a\\b[^>]*href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'), `${href} must be an ordinary link`);
  }
  assert.match(indexSource, /<noscript>[\s\S]*?\.\/zh\/research\/[\s\S]*?<\/noscript>/i, 'no-JavaScript navigation must include the Chinese research index');
});

test('homepage exposes navigation and hero meaning without runtime-only semantics', () => {
  assert.match(indexSource, /<nav\s+class="top-actions-nav"[^>]+aria-label="Primary navigation"/i);
  assert.match(indexSource, /id="typeTarget">Applying for Master\/PhD programs<\/span>/i);
  assert.match(indexSource, /<canvas\s+id="heroPreviewCanvas"\s+aria-hidden="true"><\/canvas>/i);
  assert.match(indexSource, /id="heroPreviewMeta"[\s\S]*?\.\/research\/point-cloud-registration\/[\s\S]*?Robust point set registration/i);
  assert.doesNotMatch(scriptSource, /heroPreviewCanvas\?\.setAttribute\('aria-label'/);
});

test('canonical repository and publication data stays unique and classifiable', () => {
  assert.ok(localRepos.length >= 9, 'repository snapshot unexpectedly lost records');
  assert.equal(new Set(localRepos.map((repo) => repo.name)).size, localRepos.length, 'repository names must be unique');
  assert.equal(new Set(localRepos.map((repo) => repo.html_url)).size, localRepos.length, 'repository URLs must be unique');
  for (const repo of localRepos) {
    assert.ok(repo.stage?.en && repo.stage?.zh, `${repo.name} is missing a bilingual maturity stage`);
    assert.ok(repo.evidence?.en && repo.evidence?.zh, `${repo.name} is missing a bilingual public-evidence note`);
  }
  assert.equal(localRepos.find((repo) => repo.name === 'codex-pet-battle')?.stage?.en, 'Planning');
  assert.equal(localRepos.find((repo) => repo.name === 'TrendRadar')?.stage?.en, 'Upstream fork');
  assert.deepEqual(
    localRepos.filter((repo) => repo.demo_url).map((repo) => repo.name).sort(),
    ['FusionTrack', 'shuxuepeiyou', 'tetrahedron-visualizer']
  );
  assert.ok(localRepos.filter((repo) => repo.demo_url).every((repo) => /^https:\/\//.test(repo.demo_url)));
  assert.match(scriptSource, /stage: local\?\.stage \|\| null/);
  assert.match(scriptSource, /evidence: local\?\.evidence \|\| null/);
  assert.match(scriptSource, /demo_url: validatedExternalHttpUrl\(local\?\.demo_url\)/);
  assert.match(scriptSource, /description: local\?\.description \|\| externalText\(repo\.description/);

  assert.ok(staticPublications.length >= 2, 'canonical publication data unexpectedly lost verified papers');
  assert.equal(new Set(staticPublications.map((publication) => publication.doi)).size, staticPublications.length, 'publication DOIs must be unique');
  for (const doi of ['10.1016/j.neucom.2026.133399', '10.1016/j.neucom.2026.134314']) {
    assert.ok(staticPublications.some((publication) => publication.doi === doi), `verified publication is missing: ${doi}`);
  }
  for (const publication of staticPublications) {
    assert.match(publication.code_url || '', /^https:\/\/github\.com\/ddfs430\//);
    assert.ok(publication.code_note?.en && publication.code_note?.zh, `${publication.doi} is missing a bilingual code-hosting note`);
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
  for (const name of ['hlpp-crossword', 'codex-pet-battle', 'shuxuepeiyou', 'tetrahedron-visualizer', 'BIT-The-mathematical-foundation-of-big-Data']) {
    assert.deepEqual(researchConfig.repoAssignments[name], [], `${name} must remain a project without being counted as research evidence`);
    assert.deepEqual(localRepos.find((repo) => repo.name === name)?.interests, []);
  }
  assert.match(
    researchConfig.interests.find((domain) => domain.id === 'ai4edu')?.children[0]?.description?.en || '',
    /Educational software, interactive mathematics visualizations/
  );
  assert.deepEqual(
    researchConfig.paperAssignments['Synergistic learning for active learning: A unified training objective for sample-efficient medical image classification'],
    ['medical-image-analysis']
  );
});

test('homepage localizes accessible names and avoids per-frame canvas layout reads', () => {
  assert.match(indexSource, /data-i18n-aria="aria_theme"/);
  assert.match(indexSource, /id="readmeDrawerTitle"/);
  assert.match(indexSource, /role="status" aria-live="polite"/);
  assert.match(indexSource, /id="repoMap" aria-hidden="true"/);
  assert.match(scriptSource, /querySelectorAll\('\[data-i18n-aria\]'\)/);
  assert.match(scriptSource, /new ResizeObserver/);
  assert.doesNotMatch(
    scriptSource.match(/function drawHeroPreviewCanvas\(\)[\s\S]*?\n}/)?.[0] || '',
    /getBoundingClientRect/
  );
  assert.doesNotMatch(
    researchCanvasSource.match(/function drawInterestAnimation\(\)[\s\S]*?\n}/)?.[0] || '',
    /getBoundingClientRect|resizeDrawingCanvas/
  );
  assert.doesNotMatch(
    repoMapSource.match(/function renderRepoMap\([^)]*\)[\s\S]*?\n}/)?.[0] || '',
    /getBoundingClientRect|resizeDrawingCanvas/
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

test('agent and education canvases expose only the current human-facing scenes', () => {
  assert.match(researchCanvasSource, /function drawHumanAiCollab\(/);
  assert.match(researchCanvasSource, /function drawRobotTeacherClassroom\(/);
  assert.match(researchCanvasSource, /const humanAiStages = \[/);
  assert.match(researchCanvasSource, /\{ id: 'request', label: 'Human request' \}/);
  assert.doesNotMatch(researchCanvasSource, /LEGACY_RUNNER_SCENES_ENABLED|agentRunnerLayout|educationRunnerLayout/);
  assert.doesNotMatch(researchCanvasSource, /agentWorkbench|drawEducationGarden|selectedTool|selectedPath/);
});
