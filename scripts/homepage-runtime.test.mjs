import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { homepageI18n } from '../homepage-i18n.js';
import { localRepos, staticPublications } from '../site-data.js';
import {
  RESEARCH_CONFIG_LIMITS,
  WORKFLOW_DISPATCH_INPUT_MAX_LENGTH
} from './research-config-schema.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const read = (relativePath) => fs.readFile(path.join(rootDir, relativePath), 'utf8');

const [
  indexSource,
  scriptSource,
  researchCanvasSource,
  repoMapSource,
  styleSource,
  readmeSource,
  researchConfigSource,
  homepageI18nSource,
  chineseIndexSource
] = await Promise.all([
  read('index.html'),
  read('script.js'),
  read('research-canvas.js'),
  read('repo-map.js'),
  read('styles.css'),
  read('README.md'),
  read('research-config.json'),
  read('homepage-i18n.js'),
  read('zh/index.html')
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
  assert.deepEqual([...htmlIds(chineseIndexSource)].sort(), [...ids].sort(), 'Chinese homepage DOM ids drifted from the English homepage');
});

test('research and repository visualizations are real lazy modules', async () => {
  const releaseVersion = indexSource.match(/<script\s+type="module"\s+src="script\.js\?v=([a-f0-9]{12})"><\/script>/i)?.[1];
  assert.ok(releaseVersion, 'homepage entry module must include a release version');
  for (const assetPath of ['./site-data.js', './homepage-i18n.js', './scripts/research-config-schema.js']) {
    assert.match(
      indexSource,
      new RegExp(`<link\\s+rel="modulepreload"\\s+href="${assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=${releaseVersion}"\\s*\\/?>`, 'i'),
      `${assetPath} must be preloaded with the entry module release version`
    );
  }
  assert.match(scriptSource, /import\(versionedModuleUrl\('\.\/site-data\.js'\)\)/);
  assert.match(scriptSource, /import\(versionedModuleUrl\('\.\/homepage-i18n\.js'\)\)/);
  assert.match(scriptSource, /import\(versionedModuleUrl\('\.\/scripts\/research-config-schema\.js'\)\)/);
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
  const translationBytes = (await fs.stat(path.join(rootDir, 'homepage-i18n.js'))).size;
  const schemaBytes = (await fs.stat(path.join(rootDir, 'scripts', 'research-config-schema.js'))).size;
  assert.ok(eagerBytes < 150 * 1024, `eager homepage script grew to ${eagerBytes} bytes`);
  assert.ok(translationBytes < 26 * 1024, `homepage translations grew to ${translationBytes} bytes`);
  assert.ok(eagerBytes + translationBytes + schemaBytes < 190 * 1024, 'homepage runtime split increased total JavaScript unexpectedly');
});

test('research visualization exposes a recoverable module-failure state', () => {
  for (const source of [indexSource, chineseIndexSource]) {
    assert.match(source, /id="interestDemoPrevious"[^>]+disabled/);
    assert.match(source, /id="interestDemoAction"[^>]+disabled/);
    assert.match(source, /id="interestDemoReset"[^>]+disabled/);
    assert.match(source, /id="interestFeatureRetry"[^>]+data-i18n="interactive_retry"[^>]+hidden/);
  }
  assert.match(scriptSource, /button\.disabled = state !== 'ready'/);
  assert.match(scriptSource, /interestFeatureRetry\.hidden = state !== 'error'/);
  assert.match(scriptSource, /interestFeatureRetry\?\.addEventListener\('click'/);
  assert.match(scriptSource, /void activateLazyFeature\('research', generation\)/);
  assert.equal(homepageI18n.en.interactive_retry, 'Retry interaction');
  assert.equal(homepageI18n.zh.interactive_retry, '重试交互');
});

test('homepage prioritizes verified identity and defers optional data requests', async () => {
  assert.match(indexSource, /<title>Chenxu Wang \(wcx12\) \| Machine Learning Researcher<\/title>/);
  assert.match(indexSource, /<html lang="en" data-fixed-language="en">/);
  assert.match(indexSource, /hreflang="zh-CN" href="https:\/\/wcx12\.github\.io\/wcx12\/zh\/"/);
  assert.match(indexSource, /<h1>Chenxu Wang <span class="hero-alias">\(wcx12\)<\/span><\/h1>/);
  assert.match(indexSource, /"propertyID": "ORCID"/);
  assert.match(indexSource, /data-i18n="hero_affiliation">Beijing Institute of Technology/);
  assert.doesNotMatch(indexSource, /fonts\.(?:googleapis|gstatic)\.com/i);
  assert.match(styleSource, /space-grotesk-latin\.woff2/);
  assert.match(styleSource, /jetbrains-mono-latin\.woff2/);

  const initialization = scriptSource.slice(scriptSource.lastIndexOf('initCustomCursor();'));
  assert.doesNotMatch(initialization, /\bload(?:Repos|Publications|BlogPosts|RemoteResearchConfig)\(\);/);
  assert.match(initialization, /applyTranslations\(\{ translateDocument: !fixedLanguage \}\)/);
  assert.match(scriptSource, /function applyTranslations\(\{ translateDocument = true \} = \{\}\) \{\s*if \(translateDocument\)/);
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
  assert.match(styleSource, /@media\s*\(max-width:\s*480px\)[\s\S]*?\.hero-preview-panel\s*\{[^}]*display:\s*none/s);
  assert.match(styleSource, /@media\s*\(max-width:\s*480px\)[\s\S]*?\.top-actions\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.match(styleSource, /@media\s*\(max-width:\s*360px\)[\s\S]*?\.quick-stats\s*\{[^}]*display:\s*none/s);
});

test('view navigation and research tabs preserve visible keyboard focus and ARIA relationships', () => {
  assert.match(scriptSource, /function focusViewHeading\(targetView\)/);
  assert.match(scriptSource, /activateView\(btn\.dataset\.view, \{ focusHeading: true \}\)/);
  assert.match(scriptSource, /targetView\.closest\('\.console'\)\?\.scrollIntoView\(\{ behavior: 'auto'/);
  for (const [suffix, panel] of [
    ['Animation', 'animation'],
    ['Projects', 'projects'],
    ['Papers', 'papers'],
    ['Writing', 'writing']
  ]) {
    assert.match(indexSource, new RegExp(`id="interestTab${suffix}"[^>]+aria-controls="interestPanel${suffix}"`));
    assert.match(indexSource, new RegExp(`id="interestPanel${suffix}"[^>]+role="tabpanel"[^>]+aria-labelledby="interestTab${suffix}"[^>]+data-interest-tabpanel="${panel}"`));
  }
  assert.match(scriptSource, /tabPanel\.hidden = compactViewportQuery\.matches && tabPanel\.dataset\.interestTabpanel !== activeInterestPanel/);
  assert.match(scriptSource, /show_repo_in_research_aria\.replace\('\{repo\}', repo\.name\)/);
  assert.match(scriptSource, /open_repo_aria\.replace\('\{repo\}', repo\.name\)/);
  assert.match(scriptSource, /view_paper_details_aria\.replace\('\{paper\}', item\.title\)/);
  assert.match(scriptSource, /open_paper_aria\.replace\('\{paper\}', item\.title\)/);
  assert.match(scriptSource, /escapeHtml\(paperSummary\(item\)\)/);
});

test('command palette exposes the active option through the combobox pattern', () => {
  assert.match(indexSource, /id="commandInput"[^>]+role="combobox"[^>]+aria-controls="commandList"[^>]+aria-expanded="false"/);
  assert.match(indexSource, /id="commandList"[^>]+role="listbox"/);
  assert.match(scriptSource, /id="command-option-\$\{index\}"[^>]+role="option"[^>]+aria-selected="\$\{index === commandCursor\}"/);
  assert.match(scriptSource, /commandInput\.setAttribute\('aria-activedescendant', `command-option-\$\{commandCursor\}`\)/);
  assert.match(scriptSource, /commandInput\.setAttribute\('aria-expanded', 'true'\)/);
  assert.match(scriptSource, /commandInput\.setAttribute\('aria-expanded', 'false'\)/);
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
  assert.match(scriptSource, /compactViewportQuery\.matches \|\| reducedMotionQuery\.matches \? 'auto' : 'smooth'/);
  assert.match(researchCanvasSource, /getContext\(\)\.reducedMotion \? 'auto' : 'smooth'/);
  assert.match(repoMapSource, /context\.reducedMotion \? 'auto' : 'smooth'/);
  assert.doesNotMatch(scriptSource, /scrollIntoView\(\{ behavior: 'smooth'/);
  assert.match(researchCanvasSource, /addEventListener\('pointerup'[\s\S]*?updateInterestCanvasAccessibility\(\);[\s\S]*?releasePointerCapture/);
});

test('owner mapping hands a token-free payload to GitHub Actions', () => {
  assert.match(indexSource, /<textarea id="managerUpdatePayload"[^>]+readonly[^>]+aria-describedby="managerRemoteStatus"/);
  assert.match(indexSource, /<button id="managerPrepareRemote"[^>]+type="button"/);
  assert.match(indexSource, /<button id="managerCopyRemote"[^>]+disabled/);
  assert.match(indexSource, /href="https:\/\/github\.com\/wcx12\/wcx12\/actions\/workflows\/research-config-update\.yml"[^>]+rel="noreferrer"/);
  assert.match(scriptSource, /if \(window\.top !== window\.self\)/);
  assert.match(scriptSource, /version: 1,[\s\S]*?expected_sha256: remoteResearchConfigHash,[\s\S]*?config/);
  assert.match(scriptSource, /navigator\.clipboard\.writeText\(payload\)/);
  assert.match(homepageI18nSource, /This page never reads a repository token/);
  assert.doesNotMatch(indexSource, /type="password"|github_pat_/);
  assert.doesNotMatch(scriptSource, /Authorization: `Bearer|api\.github\.com\/repos\/.*dispatches/);
  assert.doesNotMatch(scriptSource, /repos\/\$\{GITHUB_REPOSITORY\}\/contents\//);
});

test('owner mapping reuses the workflow schema and its exact limits', () => {
  assert.equal(RESEARCH_CONFIG_LIMITS.assignments, 512);
  assert.equal(RESEARCH_CONFIG_LIMITS.idsPerAssignment, 64);
  assert.equal(RESEARCH_CONFIG_LIMITS.itemNameLength, 300);
  assert.equal(RESEARCH_CONFIG_LIMITS.localizedTextLength, 1200);
  assert.equal(WORKFLOW_DISPATCH_INPUT_MAX_LENGTH, 65_535);
  assert.match(scriptSource, /const CONFIG_LIMITS = RESEARCH_CONFIG_LIMITS/);
  assert.match(scriptSource, /normalizeResearchConfigUpdateInput\(toBase64Utf8\(JSON\.stringify\(updatePayload\)\)\)/);
  assert.match(scriptSource, /normalizeSharedResearchConfig\(nextConfig\)/);
  assert.match(scriptSource, /normalizeSharedResearchConfig\(normalizeResearchConfig\(/);
  assert.doesNotMatch(scriptSource, /const RESEARCH_CONFIG_VERSION = 2|const CONFIG_LIMITS = Object\.freeze/);
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
  assert.match(indexSource, /<a\b[^>]*id="langToggle"[^>]*href="\.\/zh\/"[^>]*hreflang="zh-CN"/i);
  assert.match(indexSource, /<noscript>[\s\S]*?\.\/zh\/[\s\S]*?<\/noscript>/i, 'no-JavaScript navigation must include the Chinese homepage');
});

test('Chinese homepage is a complete fixed-language mirror with stable deep links', () => {
  assert.match(chineseIndexSource, /<html lang="zh-CN" data-fixed-language="zh">/);
  assert.match(chineseIndexSource, /<link rel="canonical" href="https:\/\/wcx12\.github\.io\/wcx12\/zh\/"/);
  assert.match(chineseIndexSource, /hreflang="en" href="https:\/\/wcx12\.github\.io\/wcx12\/"/);
  assert.match(chineseIndexSource, /hreflang="zh-CN" href="https:\/\/wcx12\.github\.io\/wcx12\/zh\/"/);
  assert.match(chineseIndexSource, /hreflang="x-default" href="https:\/\/wcx12\.github\.io\/wcx12\/"/);
  assert.match(chineseIndexSource, /<a\b[^>]*id="langToggle"[^>]*href="\.\.\/"[^>]*hreflang="en"/i);
  assert.match(chineseIndexSource, /src="\.\.\/script\.js\?v=[a-f0-9]{12}"/);
  assert.match(chineseIndexSource, /href="\.\.\/styles\.css\?v=[a-f0-9]{12}"/);
  const chineseReleaseVersion = chineseIndexSource.match(/src="\.\.\/script\.js\?v=([a-f0-9]{12})"/)?.[1];
  assert.ok(chineseReleaseVersion, 'Chinese homepage entry module must include a release version');
  for (const assetPath of ['../site-data.js', '../homepage-i18n.js', '../scripts/research-config-schema.js']) {
    assert.match(
      chineseIndexSource,
      new RegExp(`rel="modulepreload"\\s+href="${assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=${chineseReleaseVersion}"`),
      `${assetPath} must use the Chinese route and matching release version`
    );
  }
  assert.match(chineseIndexSource, /href="\.\/research\/"[^>]*>研究<\/a>/);
  assert.match(chineseIndexSource, /href="\.\.\/blog\/"[^>]*>英文博客<\/a>/);
  assert.match(chineseIndexSource, /href="\.\/resume\/"[^>]*>履历<\/a>/);
  assert.match(chineseIndexSource, /<noscript>[\s\S]*无需 JavaScript 也可以浏览研究主页[\s\S]*href="\.\.\/"[\s\S]*<\/noscript>/);

  for (const key of ['hero_kicker', 'hero_status_value', 'hero_preview_description', 'about_line1', 'writing_title', 'timeline_2026']) {
    assert.ok(chineseIndexSource.includes(homepageI18n.zh[key]), `Chinese homepage is missing static translation ${key}`);
  }
  assert.doesNotMatch(chineseIndexSource, /Machine Learning Researcher|View Publications|Research Interests|Technical notes and research logs/);
  assert.doesNotMatch(chineseIndexSource, /href="\.\/zh\//, 'Chinese homepage must not generate nested /zh/ routes');
  assert.match(homepageI18nSource, /export const homepageI18n = \{/);
  assert.match(scriptSource, /const fixedLanguage = document\.documentElement\.dataset\.fixedLanguage/);
  assert.match(scriptSource, /if \(fixedLanguage\) localStorage\.setItem\(LANG_KEY, currentLang\)/);
  assert.match(scriptSource, /target\.search = window\.location\.search/, 'language links must preserve management and preview parameters');
  assert.match(scriptSource, /target\.hash = window\.location\.hash/, 'language links must preserve the active homepage section');
});

test('homepage exposes navigation and hero meaning without runtime-only semantics', () => {
  assert.match(indexSource, /<nav\s+class="top-actions-nav"[^>]+aria-label="Primary navigation"/i);
  assert.match(indexSource, /id="typeTarget"[^>]*>Applying for Master\/PhD programs<\/span>/i);
  assert.match(indexSource, /<canvas\s+id="heroPreviewCanvas"\s+aria-hidden="true"><\/canvas>/i);
  assert.match(indexSource, /id="heroPreviewMeta"[\s\S]*?\.\/research\/point-cloud-registration\/[\s\S]*?Robust point set registration/i);
  assert.doesNotMatch(scriptSource, /heroPreviewCanvas\?\.setAttribute\('aria-label'/);
});

test('canonical repository and publication data stays unique and classifiable', () => {
  assert.ok(localRepos.length >= 9, 'repository snapshot unexpectedly lost records');
  assert.equal(new Set(localRepos.map((repo) => repo.name)).size, localRepos.length, 'repository names must be unique');
  assert.equal(new Set(localRepos.map((repo) => repo.html_url)).size, localRepos.length, 'repository URLs must be unique');
  for (const repo of localRepos) {
    assert.ok(repo.descriptionZh, `${repo.name} is missing a curated Chinese description`);
    assert.ok(repo.stage?.en && repo.stage?.zh, `${repo.name} is missing a bilingual maturity stage`);
    assert.ok(repo.evidence?.en && repo.evidence?.zh, `${repo.name} is missing a bilingual public-evidence note`);
  }
  assert.equal(localRepos.find((repo) => repo.name === 'codex-pet-battle')?.stage?.en, 'Planning');
  assert.equal(localRepos.find((repo) => repo.name === 'TrendRadar')?.stage?.en, 'Upstream fork');
  assert.equal(localRepos.find((repo) => repo.name === 'TrendRadar')?.license_spdx, 'GPL-3.0');
  assert.ok(localRepos.every((repo) => Object.hasOwn(repo, 'license_spdx')), 'repository license status must be explicit');
  assert.ok(localRepos.filter((repo) => !repo.fork).every((repo) => repo.license_spdx === null), 'original repositories unexpectedly claim a detected license');
  const demoRepos = new Set(localRepos.filter((repo) => repo.demo_url).map((repo) => repo.name));
  for (const name of ['FusionTrack', 'shuxuepeiyou', 'tetrahedron-visualizer']) {
    assert.ok(demoRepos.has(name), `${name} unexpectedly lost its public demo`);
  }
  assert.ok(localRepos.filter((repo) => repo.demo_url).every((repo) => /^https:\/\//.test(repo.demo_url)));
  assert.match(scriptSource, /stage: local\?\.stage \|\| null/);
  assert.match(scriptSource, /evidence: local\?\.evidence \|\| null/);
  assert.match(scriptSource, /demo_url: validatedExternalHttpUrl\(local\?\.demo_url\)/);
  assert.match(scriptSource, /description: local\?\.description \|\| externalText\(repo\.description/);
  assert.match(scriptSource, /descriptionZh: local\?\.descriptionZh \|\| ''/);
  assert.match(scriptSource, /function repoDescription\(repo\)/);
  assert.match(scriptSource, /\.\.\.override,[\s\S]*?status: currentLang === 'zh' \? override\.statusZh : override\.status/);

  assert.ok(staticPublications.length >= 2, 'canonical publication data unexpectedly lost verified papers');
  assert.equal(new Set(staticPublications.map((publication) => publication.doi)).size, staticPublications.length, 'publication DOIs must be unique');
  for (const doi of ['10.1016/j.neucom.2026.133399', '10.1016/j.neucom.2026.134314']) {
    assert.ok(staticPublications.some((publication) => publication.doi === doi), `verified publication is missing: ${doi}`);
  }
  for (const publication of staticPublications) {
    assert.ok(publication.summaryZh, `${publication.doi} is missing a Chinese summary`);
    assert.ok(publication.published_date && publication.volume && publication.article_number, `${publication.doi} is missing canonical bibliographic data`);
    assert.ok(publication.citation_key && publication.citation_month && publication.citation_date, `${publication.doi} is missing citation export data`);
    assert.equal(publication.open_access, true, `${publication.doi} open-access status drifted`);
    assert.match(publication.license || '', /^https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/$/);
    assert.match(publication.code_url || '', /^https:\/\/github\.com\/ddfs430\//);
    assert.ok(publication.code_note?.en && publication.code_note?.zh, `${publication.doi} is missing a bilingual code-hosting note`);
  }
  assert.match(scriptSource, /publications\/citations/);

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

test('README previews bound response work and block arbitrary tracking images', () => {
  assert.match(scriptSource, /const MAX_README_BYTES = 1024 \* 1024/);
  assert.match(scriptSource, /responseTextWithLimit\(response, MAX_README_BYTES\)/);
  assert.match(scriptSource, /response\.body\.getReader\(\)/);
  assert.match(scriptSource, /total > maxBytes[\s\S]*?reader\.cancel\(\)/);
  assert.match(scriptSource, /const README_IMAGE_HOSTS = new Set\(\[/);
  for (const host of ['capsule-render.vercel.app', 'github.com', 'img.shields.io', 'skillicons.dev']) {
    assert.ok(scriptSource.includes(`'${host}'`), `README image allowlist is missing ${host}`);
  }
  assert.match(scriptSource, /host\.endsWith\('\.githubusercontent\.com'\)/);
  assert.match(scriptSource, /node\.setAttribute\('referrerpolicy', 'no-referrer'\)/);
  assert.match(scriptSource, /node\.setAttribute\('decoding', 'async'\)/);
});

test('monochrome theme removes hard-coded color residue from structural UI', () => {
  assert.match(styleSource, /:root\[data-theme="mono"\] #starfield \{[^}]*filter:\s*grayscale\(1\)/s);
  assert.match(styleSource, /:root\[data-theme="mono"\] \.console,[\s\S]*?border-color:\s*var\(--line\)/);
  assert.match(styleSource, /:root\[data-theme="mono"\] footer \{[^}]*color:\s*var\(--muted\)/s);
  assert.ok(homepageI18n.en.lang_link_aria.startsWith(homepageI18n.en.lang_btn));
  assert.ok(homepageI18n.zh.lang_link_aria.startsWith(homepageI18n.zh.lang_btn));
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
