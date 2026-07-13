import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(rootDir, 'output');
const artifactDir = path.join(outputRoot, 'pages');

const publicFiles = [
  '404.html',
  'favicon.svg',
  'homepage-bootstrap.js',
  'homepage-i18n.js',
  'index.html',
  'repo-map.js',
  'research-canvas.js',
  'research-config.json',
  'robots.txt',
  'rss.xml',
  'script.js',
  'site-data.js',
  'sitemap.xml',
  'styles.css'
];

const publicDirectories = [
  'assets',
  'blog',
  'projects',
  'publications',
  'research',
  'resume',
  'zh'
];

function assertInside(parent, target) {
  const relative = path.relative(parent, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside ${parent}: ${target}`);
  }
}

async function copyPublicEntry(relativePath) {
  const source = path.join(rootDir, relativePath);
  const destination = path.join(artifactDir, relativePath);
  assertInside(rootDir, source);
  assertInside(artifactDir, destination);
  const stats = await fs.lstat(source);
  if (stats.isSymbolicLink()) throw new Error(`Public entry must not be a symbolic link: ${relativePath}`);
  await fs.cp(source, destination, { recursive: stats.isDirectory(), dereference: false });
}

const resolvedOutput = path.resolve(outputRoot);
const resolvedArtifact = path.resolve(artifactDir);
assertInside(resolvedOutput, resolvedArtifact);
await fs.rm(resolvedArtifact, { recursive: true, force: true });
await fs.mkdir(resolvedArtifact, { recursive: true });

for (const relativePath of [...publicFiles, ...publicDirectories]) await copyPublicEntry(relativePath);

await fs.mkdir(path.join(artifactDir, 'scripts'), { recursive: true });
for (const scriptName of ['portfolio-ranking.js', 'research-config-schema.js']) {
  await fs.copyFile(
    path.join(rootDir, 'scripts', scriptName),
    path.join(artifactDir, 'scripts', scriptName)
  );
}

await fs.rm(path.join(artifactDir, 'assets', 'fonts', 'README.md'), { force: true });
await fs.writeFile(path.join(artifactDir, '.nojekyll'), '');

console.log(`Packaged GitHub Pages artifact at ${artifactDir}`);
