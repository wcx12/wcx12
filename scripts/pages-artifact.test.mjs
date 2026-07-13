import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(rootDir, 'output', 'pages');
const projectPath = '/wcx12/';

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) files.push({ absolute, type: 'symlink' });
    else if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push({ absolute, type: 'file' });
  }
  return files;
}

function relative(file) {
  return path.relative(artifactDir, file).replace(/\\/g, '/');
}

test('Pages artifact contains only the explicit public surface', async () => {
  const entries = await walk(artifactDir);
  const paths = entries.map((entry) => relative(entry.absolute));
  assert.ok(paths.includes('.nojekyll'));
  for (const required of [
    'index.html',
    'content.css',
    'homepage-bootstrap.js',
    'zh/index.html',
    'resume/index.html',
    'zh/resume/index.html',
    'blog/index.html',
    'research/index.html',
    'projects/index.html',
    'publications/index.html',
    'publications/citations/10-1016-j-neucom-2026-133399.bib',
    'publications/citations/10-1016-j-neucom-2026-133399.ris',
    'publications/citations/10-1016-j-neucom-2026-134314.bib',
    'publications/citations/10-1016-j-neucom-2026-134314.ris',
    'scripts/portfolio-ranking.js',
    'scripts/research-config-schema.js'
  ]) assert.ok(paths.includes(required), `artifact is missing ${required}`);

  assert.ok(entries.every((entry) => entry.type === 'file'), 'Pages artifact must not contain symbolic links');
  assert.ok(paths.every((value) => !value.endsWith('.md')), 'source Markdown must not be deployed');
  assert.ok(paths.every((value) => !/^(?:\.git|\.github|blog-src|content|node_modules)(?:\/|$)/.test(value)));
  for (const forbidden of ['resume.html', 'publications.html', 'publications.md', 'resume.md', 'resume.zh.md']) {
    assert.ok(!paths.includes(forbidden), `source-derived duplicate leaked into artifact: ${forbidden}`);
  }
});

test('every local HTML asset and link remains inside the Pages artifact', async () => {
  const entries = await walk(artifactDir);
  const htmlFiles = entries.filter((entry) => entry.type === 'file' && entry.absolute.endsWith('.html'));
  for (const file of htmlFiles) {
    const source = await fs.readFile(file.absolute, 'utf8');
    for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/gi)) {
      const raw = match[1];
      if (!raw || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(raw)) continue;
      const clean = decodeURIComponent(raw.split(/[?#]/, 1)[0]);
      if (!clean) continue;
      let target;
      if (clean.startsWith('/')) {
        assert.ok(clean.startsWith(projectPath), `${relative(file.absolute)} uses a host-root path outside ${projectPath}: ${raw}`);
        target = path.resolve(artifactDir, clean.slice(projectPath.length));
      } else {
        target = path.resolve(path.dirname(file.absolute), clean);
      }
      if (/[\\/]$/.test(clean)) target = path.join(target, 'index.html');
      const withinArtifact = path.relative(artifactDir, target);
      assert.ok(withinArtifact && !withinArtifact.startsWith('..') && !path.isAbsolute(withinArtifact), `${relative(file.absolute)} escapes artifact: ${raw}`);
      const exists = await fs.stat(target).then(() => true, () => false);
      assert.ok(exists, `${relative(file.absolute)} references missing artifact file: ${raw}`);
    }
  }
});

test('homepage runtime dependencies are packaged without exposing the source tree', async () => {
  const [bootstrap, source] = await Promise.all([
    fs.readFile(path.join(artifactDir, 'homepage-bootstrap.js'), 'utf8'),
    fs.readFile(path.join(artifactDir, 'script.js'), 'utf8')
  ]);
  assert.match(bootstrap, /new URL\('\.\/script\.js', bootstrapUrl\)/);
  for (const dependency of [
    './site-data.js',
    './homepage-i18n.js',
    './scripts/research-config-schema.js',
    './scripts/portfolio-ranking.js',
    './research-canvas.js',
    './repo-map.js'
  ]) {
    assert.match(source, new RegExp(dependency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  const scripts = await fs.readdir(path.join(artifactDir, 'scripts'));
  assert.deepEqual(scripts, ['portfolio-ranking.js', 'research-config-schema.js']);
});
