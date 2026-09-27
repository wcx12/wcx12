import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const publicFiles = [
  '404.html',
  'content.css',
  'site-tokens.css',
  'favicon.svg',
  'homepage-bootstrap.js',
  'homepage-i18n.js',
  'profile-data.js',
  'index.html',
  'repo-map.js',
  'research-canvas.js',
  'topic-experiences.js',
  'topic-perception.js',
  'topic-perception.css',
  'topic-workbench.js',
  'topic-workbench.css',
  'research-config.json',
  'robots.txt',
  'rss.xml',
  'script.js',
  'site-data.js',
  'sitemap.xml',
  'styles.css',
  'site-nav.css',
  'theme-init.js'
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

export function assertPublicEditor(source, { shell = false } = {}) {
  if (/blog-draft-update\.yml|draft_update_payload_base64|BLOG_DRAFT_UPDATE_BASE64/.test(source)) {
    throw new Error('Refusing to package the deprecated public draft workflow client. Rebuild the public editor.');
  }
  if (!shell) return;
  const serializedData = /drafts\.json|["'](?:contentBase64|contentHash|content_base64|expected_sha256|source|markdown|body|drafts)["']\s*:/i.test(source);
  const populatedEditor = [...source.matchAll(/<textarea\b[^>]*>([\s\S]*?)<\/textarea\s*>/gi)]
    .some((match) => match[1].trim())
    || /<input\b[^>]*\bvalue\s*=\s*(?:"[^"]+"|'[^']+'|[^\s"'>]+)/i.test(source);
  // An empty shell may contain public JSON-LD, but no executable inline code or data manifests.
  const inlineData = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .some((match) => match[2].trim() && !/\btype\s*=\s*["']application\/ld\+json["']/i.test(match[1]));
  if (serializedData || populatedEditor || inlineData) {
    throw new Error('Refusing to package serialized draft data in the public editor shell. Rebuild the public editor.');
  }
}

export async function packagePages(sourceRoot = rootDir) {
  sourceRoot = path.resolve(sourceRoot);
  const outputRoot = path.join(sourceRoot, 'output');
  const artifactDir = path.join(outputRoot, 'pages');
  assertInside(sourceRoot, outputRoot);
  assertInside(outputRoot, artifactDir);
  const outputStats = await fs.lstat(outputRoot).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (outputStats?.isSymbolicLink()) throw new Error('Pages output directory must not be a symbolic link.');

  async function publicEntry(source) {
    const relativePath = path.relative(sourceRoot, source).replace(/\\/g, '/');
    assertInside(sourceRoot, source);
    // The editor is public; every other entry in this subtree is private, including stale build output.
    if (/^blog\/drafts(?:\/|$)/i.test(relativePath)
      && !['blog/drafts', 'blog/drafts/index.html'].includes(relativePath)) return false;
    if (/\.(?:md|markdown|map)$/i.test(relativePath)) return false;
    const stats = await fs.lstat(source);
    if (stats.isSymbolicLink()) throw new Error('Public entries must not contain symbolic links.');
    if (!stats.isDirectory() && !stats.isFile()) throw new Error('Public entries must be regular files or directories.');
    if (relativePath === 'blog/drafts/index.html' && !stats.isFile()) {
      throw new Error('The public editor shell must be a regular file.');
    }
    if (relativePath === 'blog/drafts/index.html' || /^blog\/assets\/.*\.js$/i.test(relativePath)) {
      assertPublicEditor(await fs.readFile(source, 'utf8'), { shell: relativePath.endsWith('.html') });
    }
    return true;
  }

  async function copyPublicEntry(relativePath) {
    const source = path.join(sourceRoot, relativePath);
    const destination = path.join(artifactDir, relativePath);
    assertInside(sourceRoot, source);
    assertInside(artifactDir, destination);
    await fs.cp(source, destination, { recursive: true, dereference: false, filter: publicEntry });
  }

  await fs.rm(artifactDir, { recursive: true, force: true });
  try {
    await fs.mkdir(artifactDir, { recursive: true });
    for (const relativePath of [...publicFiles, ...publicDirectories]) await copyPublicEntry(relativePath);
    for (const scriptName of ['portfolio-ranking.js', 'research-config-schema.js']) {
      await copyPublicEntry(`scripts/${scriptName}`);
    }
    await fs.rm(path.join(artifactDir, 'assets', 'fonts', 'README.md'), { force: true });
    await fs.writeFile(path.join(artifactDir, '.nojekyll'), '');
  } catch (error) {
    // Never leave a partially copied artifact available to a later upload step.
    await fs.rm(artifactDir, { recursive: true, force: true });
    throw error;
  }
  return artifactDir;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Packaged GitHub Pages artifact at ${await packagePages()}`);
}
