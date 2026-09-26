import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadPosts } from './blog-content.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = ['scripts/site-output.test.mjs', 'scripts/site-review.test.mjs', 'scripts/site-navigation.test.mjs'];

function assertInside(root, target) {
  const relative = path.relative(root, path.resolve(target));
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'fixture operation must stay inside its temporary root');
}

async function removeFixtureEntry(root, relative) {
  const target = path.join(root, relative);
  assertInside(root, target);
  assertInside(root, await fs.realpath(target));
  await fs.rm(target);
}

async function snapshot(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wcx12-withdrawal-'));
  t.after(async () => {
    assertInside(path.resolve(os.tmpdir()), root);
    await fs.unlink(path.join(root, 'node_modules')).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    await fs.rm(root, { recursive: true, force: true });
  });
  const excluded = new Set(['.git', '.playwright-cli', 'node_modules', 'output']);
  await fs.cp(rootDir, root, {
    recursive: true,
    filter: (source) => !excluded.has(path.relative(rootDir, source).split(path.sep)[0])
  });
  // Dependencies are shared read-only; source deletion and generated output stay in the snapshot.
  await fs.symlink(path.join(rootDir, 'node_modules'), path.join(root, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  return root;
}

function run(root, args) {
  const env = { ...process.env };
  // Nested Node test runners must not inherit the parent's worker protocol.
  delete env.NODE_TEST_CONTEXT;
  return new Promise((resolve) => {
    execFile(process.execPath, args, { cwd: root, env, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ code: error?.code ?? 0, output: `${stdout}${stderr}` });
    });
  });
}

test('withdrawal deployment validates remaining sources without relying on fixed articles', { timeout: 300000 }, async (t) => {
  const root = await snapshot(t);
  const { posts } = await loadPosts(root);
  const originals = new Map();
  for (const post of posts) originals.set(post.relativePath, await fs.readFile(post.sourcePath));
  const groups = new Map();
  for (const post of posts) {
    const key = post.translationKey || post.slug;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(post);
  }
  const cases = [
    ['baseline', []],
    ...posts.map((post) => [`withdraw ${post.slug}`, [post]]),
    ...[...groups].filter(([, variants]) => variants.length > 1).map(([key, variants]) => [`withdraw translation group ${key}`, variants]),
    ['withdraw every public article', posts]
  ];
  for (const [name, withdrawn] of cases) {
    await t.test(name, async () => {
      for (const [relative, source] of originals) await fs.writeFile(path.join(root, relative), source);
      for (const post of withdrawn) await removeFixtureEntry(root, post.relativePath);
      const build = await run(root, ['scripts/build-blog.mjs']);
      assert.equal(build.code, 0, build.output);
      const result = await run(root, ['--test', '--test-reporter=tap', ...suites]);
      const reportLines = result.output.split('\n');
      const failures = reportLines.flatMap((line, index) => /^not ok /.test(line) ? reportLines.slice(index, index + 16) : []);
      assert.equal(result.code, 0, failures.join('\n') || result.output.slice(-4000));
      for (const name of ['all generated local links and assets resolve', 'RSS declares itself', 'every generated surface loads']) {
        assert.match(result.output, new RegExp(`^ok \\d+ - ${name}`, 'm'), 'generic validation must actually run');
      }
      const feed = JSON.parse(await fs.readFile(path.join(root, 'blog/posts.json'), 'utf8'));
      const removed = new Set(withdrawn.map((post) => post.slug));
      assert.deepEqual(feed.map((post) => post.slug).sort(), posts.filter((post) => !removed.has(post.slug)).map((post) => post.slug).sort());
      for (const post of withdrawn) {
        await assert.rejects(fs.access(path.join(root, 'blog/posts', post.slug, 'index.html')), { code: 'ENOENT' });
      }
    });
  }
  await t.test('missing generated pages still fail when their sources remain public', async () => {
    for (const [relative, source] of originals) await fs.writeFile(path.join(root, relative), source);
    const build = await run(root, ['scripts/build-blog.mjs']);
    assert.equal(build.code, 0, build.output);
    const post = posts.find((item) => item.slug === 'tiger-generative-retrieval-reading') || posts[0];
    if (!post) return;
    await removeFixtureEntry(root, `blog/posts/${post.slug}/index.html`);
    const result = await run(root, ['--test', '--test-reporter=tap', '--test-name-pattern=generated article routes|TIGER main results|every generated surface', ...suites]);
    assert.notEqual(result.code, 0, 'missing generated output must fail the deployment tests');
    assert.match(result.output, /not ok \d+ - generated article routes exactly match/);
    assert.match(result.output, /not ok \d+ - every generated surface loads/);
    if (post.slug === 'tiger-generative-retrieval-reading') assert.match(result.output, /not ok \d+ - TIGER main results/);
  });
});
