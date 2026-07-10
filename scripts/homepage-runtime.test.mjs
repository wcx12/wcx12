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
  assert.match(indexSource, /<script\s+type="module"\s+src="script\.js"><\/script>/i);
  assert.match(scriptSource, /import\(researchCanvasModuleUrl\(\)\)/);
  assert.match(scriptSource, /import\(repoMapModuleUrl\(\)\)/);
  assert.match(scriptSource, /research-canvas\.js\?retry=/, 'research module retries need a fresh module URL');
  assert.match(scriptSource, /repo-map\.js\?retry=/, 'repo-map retries need a fresh module URL');
  assert.doesNotMatch(scriptSource, /\bfrom\s+['"]\.\/(?:research-canvas|repo-map)\.js['"]/);
  assert.doesNotMatch(indexSource, /<script\b[^>]+src="(?:\.\/)?(?:research-canvas|repo-map)\.js"/i);
  assert.match(scriptSource, /function drawRoundedRect\(/, 'eager hero preview lost its rounded-rectangle helper');
  assert.match(scriptSource, /function fillTruncatedText\(/, 'eager hero preview lost its text helper');

  const eagerBytes = (await fs.stat(path.join(rootDir, 'script.js'))).size;
  assert.ok(eagerBytes < 180 * 1024, `eager homepage script grew to ${eagerBytes} bytes`);
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

  assert.equal(staticPublications.length, 2, 'public publication list must contain only the two verified papers');
  assert.equal(new Set(staticPublications.map((publication) => publication.doi)).size, staticPublications.length, 'publication DOIs must be unique');

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
