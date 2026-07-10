import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function walk(dir, predicate) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute, predicate));
    else if (entry.isFile() && predicate(absolute)) files.push(absolute);
  }
  return files;
}

function matches(source, pattern) {
  return [...source.matchAll(pattern)];
}

test('public HTML has stable document structure and valid JSON-LD', async () => {
  const pages = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, '404.html'),
    path.join(rootDir, 'resume', 'index.html'),
    ...await walk(path.join(rootDir, 'blog'), (file) => file.endsWith('.html'))
  ];

  assert.ok(pages.length >= 4, 'expected homepage, 404, resume, and blog pages');
  for (const file of pages) {
    const source = await fs.readFile(file, 'utf8');
    const relative = path.relative(rootDir, file).replace(/\\/g, '/');
    assert.match(source, /<html\s+[^>]*lang="(?:en|zh)"/i, `${relative}: missing valid document language`);
    assert.equal(matches(source, /<h1\b/gi).length, 1, `${relative}: expected exactly one h1`);
    assert.match(source, /http-equiv="Content-Security-Policy"/i, `${relative}: missing CSP`);

    if (relative !== '404.html') {
      assert.match(source, /<link\s+rel="canonical"/i, `${relative}: missing canonical URL`);
      assert.match(source, /class="skip-link"[^>]+href="#main-content"/i, `${relative}: missing skip link`);
      assert.match(source, /<main\s+[^>]*id="main-content"/i, `${relative}: missing main target`);
    } else {
      assert.match(source, /name="robots"\s+content="noindex,follow"/i, '404 must not be indexed');
    }

    for (const [, json] of matches(source, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      assert.doesNotThrow(() => JSON.parse(json), `${relative}: invalid JSON-LD`);
    }
  }
});

test('single-post blog avoids duplicate discovery sections', async () => {
  const posts = JSON.parse(await fs.readFile(path.join(rootDir, 'blog', 'posts.json'), 'utf8'));
  if (posts.length !== 1) return;
  const source = await fs.readFile(path.join(rootDir, 'blog', 'index.html'), 'utf8');
  assert.doesNotMatch(source, /section_featured_title/, 'one post should not be repeated in a featured section');
  assert.doesNotMatch(source, /id="blogSearch"/, 'search should wait until there is useful content breadth');
  assert.doesNotMatch(source, /data-blog-i18n="stat_search"/, 'hidden search must not be advertised as ready');
  assert.match(source, /data-blog-i18n="stat_language"/, 'single-post blog should advertise its bilingual interface');
});

test('blog presents the agreed fieldnotes identity', async () => {
  const indexSource = await fs.readFile(path.join(rootDir, 'blog', 'index.html'), 'utf8');
  const clientSource = await fs.readFile(path.join(rootDir, 'blog-src', 'assets', 'blog.js'), 'utf8');
  assert.match(indexSource, />Research Fieldnotes<\/h1>/);
  assert.match(clientSource, /hero_title:\s*'知研札记'/);
  assert.match(clientSource, /hero_kicker:\s*'wcx12 的研究手记'/);
  assert.match(clientSource, /document\.documentElement\.lang\s*=\s*uiLang/);
});

test('generated code blocks and article contents remain keyboard reachable', async () => {
  const articleFiles = await walk(path.join(rootDir, 'blog', 'posts'), (file) => file.endsWith('index.html'));
  for (const file of articleFiles) {
    const source = await fs.readFile(file, 'utf8');
    assert.match(source, /<article\s+class="blog-post-card"\s+lang="[a-z-]+"/i, `${path.relative(rootDir, file)}: article language must remain explicit`);
    for (const [, pre] of matches(source, /(<pre\b[^>]*>)/gi)) {
      assert.match(pre, /tabindex="0"/i, `${path.relative(rootDir, file)}: scrollable pre must be focusable`);
    }
    assert.match(source, /blog-toc-mobile/, `${path.relative(rootDir, file)}: missing mobile contents navigation`);
  }
});

test('GitHub Actions are pinned and do not expose a long-lived metrics token', async () => {
  const workflowDir = path.join(rootDir, '.github', 'workflows');
  const workflows = await walk(workflowDir, (file) => /\.ya?ml$/i.test(file));
  assert.ok(workflows.length > 0, 'expected workflow files');
  for (const file of workflows) {
    const source = await fs.readFile(file, 'utf8');
    for (const line of source.split(/\r?\n/).filter((value) => /^\s*-?\s*uses:/.test(value))) {
      assert.match(line, /@[a-f0-9]{40}(?:\s|$)/i, `${path.basename(file)}: action must use a full commit SHA`);
    }
    assert.doesNotMatch(source, /METRICS_TOKEN/, `${path.basename(file)}: metrics must use the job-scoped token`);
  }
});

test('public publication source contains only the two verified DOI records', async () => {
  const source = await fs.readFile(path.join(rootDir, 'publications.md'), 'utf8');
  assert.match(source, /10\.1016\/j\.neucom\.2026\.133399/);
  assert.match(source, /10\.1016\/j\.neucom\.2026\.134314/);
  assert.doesNotMatch(source, /coming soon|work in progress/i);
});
