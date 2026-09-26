import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import matter from 'gray-matter';
import { assertPublicEditor, packagePages } from './package-pages.mjs';
import { createMarkdownRenderer } from './build-blog.mjs';
import { SITE } from './blog-content.mjs';

test('withdrawn article references become text without changing live links or term explanations', () => {
  const renderer = createMarkdownRenderer({ publishedSlugs: new Set(['current', 'live']) });
  const { html } = renderer.render(`[missing](../withdrawn/#section) [absolute](${SITE.url}/blog/posts/withdrawn/index.html)
[live](../live/) [fragment](#section) [external](https://example.com/blog/posts/withdrawn/)
[ANN](#term-ann) [missing again](../withdrawn/)`, { slug: 'current', lang: 'en' });
  assert.match(html, /<span title="This article is not currently public">missing<\/span>/);
  assert.match(html, /<span title="This article is not currently public">absolute<\/span>/);
  assert.doesNotMatch(html, /href="(?:\.\.\/withdrawn|https:\/\/wcx12\.github\.io\/wcx12\/blog\/posts\/withdrawn)/);
  assert.match(html, /href="\.\.\/live\/"/);
  assert.match(html, /href="#section"/);
  assert.match(html, /href="https:\/\/example.com\/blog\/posts\/withdrawn\/"/);
  assert.match(html, /<span title="This article is not currently public">missing again<\/span>/);
});

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shell = '<!doctype html><title>Draft Studio</title><textarea data-draft-editor></textarea>';
const fixtureFiles = [
  '404.html', 'content.css', 'favicon.svg', 'homepage-bootstrap.js', 'homepage-i18n.js',
  'profile-data.js', 'index.html', 'repo-map.js', 'research-canvas.js', 'research-demo-content.js',
  'research-config.json', 'robots.txt', 'rss.xml', 'script.js', 'site-data.js', 'sitemap.xml',
  'styles.css', 'site-nav.css', 'theme-init.js', 'scripts/portfolio-ranking.js',
  'scripts/research-config-schema.js', 'assets/public.svg', 'projects/index.html',
  'publications/index.html', 'research/index.html', 'resume/index.html', 'zh/index.html',
  'blog/index.html', 'blog/posts/public-note/index.html', 'blog/assets/blog.js'
];

async function write(root, relative, content) {
  const target = path.join(root, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
}

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wcx12-blog-privacy-'));
  t.after(async () => {
    const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(root));
    assert.ok(relative.startsWith('wcx12-blog-privacy-') && !relative.includes(path.sep));
    await fs.rm(root, { recursive: true, force: true });
  });
  for (const file of fixtureFiles) await write(root, file, 'public fixture\n');
  await write(root, 'blog/drafts/index.html', shell);
  await write(root, 'blog/assets/draft-studio.js', 'export {};\n');
  const published = [{ title: 'Public note', slug: 'public-note', date: '2026-07-10', tags: ['notes'], url: 'blog/posts/public-note/' }];
  await write(root, 'blog/posts.json', `${JSON.stringify(published, null, 2)}\n`);
  await write(root, 'blog/search.json', `${JSON.stringify([{ ...published[0], text: 'Published body.' }], null, 2)}\n`);
  return root;
}

async function filesUnder(root, relative = '') {
  const files = [];
  for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    assert.ok(!entry.isSymbolicLink(), 'artifact must not contain symbolic links');
    if (entry.isDirectory()) files.push(...await filesUnder(root, name));
    else files.push(name);
  }
  return files;
}

test('Pages packaging isolates draft canaries and keeps published metadata byte-for-byte', async (t) => {
  const root = await fixture(t);
  const canary = `private-${randomUUID()}`;
  const encoded = Buffer.from(canary).toString('base64');
  const privatePaths = [
    'blog/drafts/drafts.json', 'blog/drafts/media/private.png', 'blog/drafts/private.html',
    'blog/drafts/index.html.bak', 'blog/drafts/nested/index.html', 'blog/drafts/.private.json',
    'content/posts/private/index.md', 'blog-src/private.json', 'output/preview/index.html',
    'output/pages/blog/drafts/old.json', 'output/pages/stale-private.html',
    'blog/posts/public-note/index.md', 'blog/assets/draft-studio.js.map'
  ];
  for (const file of privatePaths) await write(root, file, `${canary}\n${encoded}`);
  const artifact = await packagePages(root);
  assert.deepEqual(await fs.readdir(path.join(artifact, 'blog/drafts')), ['index.html']);
  const paths = await filesUnder(artifact);
  assert.ok(paths.includes('blog/drafts/index.html'));
  assert.ok(paths.includes('blog/posts/public-note/index.html'));
  for (const relative of paths) {
    assert.ok(!privatePaths.includes(relative), 'private paths must be omitted');
    const content = await fs.readFile(path.join(artifact, relative));
    assert.ok(!content.includes(Buffer.from(canary)), 'private content must not leak');
    assert.ok(!content.includes(Buffer.from(encoded)), 'encoded private content must not leak');
  }
  for (const relative of ['blog/drafts/index.html', 'blog/posts.json', 'blog/search.json', 'rss.xml', 'sitemap.xml']) {
    assert.deepEqual(await fs.readFile(path.join(artifact, relative)), await fs.readFile(path.join(root, relative)));
  }
  assert.equal(await fs.readFile(path.join(root, 'blog/drafts/drafts.json'), 'utf8'), `${canary}\n${encoded}`, 'packaging must not mutate source artifacts');
});

test('Pages packaging fails closed on serialized private content or legacy publishing transports', async (t) => {
  const root = await fixture(t);
  const canary = `private-${randomUUID()}`;
  const unsafeShells = [
    `<script type="application/json">${JSON.stringify({ drafts: [{ title: canary }] })}</script>`,
    `<script type="application/json">${JSON.stringify({ contentBase64: Buffer.from(canary).toString('base64') })}</script>`,
    `<script type="application/json">${JSON.stringify({ markdown: canary })}</script>`,
    `<script>const privateNotes = ["${canary}"];</script>`,
    `<textarea id="noteBody">${canary}</textarea>`,
    `<input id="noteTitle" value="${canary}" />`,
    '<script>fetch("drafts.json")</script>',
    '<a href="https://github.com/wcx12/wcx12/actions/workflows/blog-draft-update.yml">Update</a>'
  ];
  for (const unsafe of unsafeShells) {
    await write(root, 'blog/drafts/index.html', unsafe);
    await write(root, 'output/pages/stale-private.html', canary);
    await assert.rejects(packagePages(root), (error) => {
      assert.match(error.message, /Refusing to package/);
      assert.ok(!error.message.includes(canary), 'failure diagnostics must not quote private content');
      return true;
    });
    await assert.rejects(fs.access(path.join(root, 'output/pages')), { code: 'ENOENT' });
  }
  await write(root, 'blog/drafts/index.html', shell);
  await write(root, 'blog/assets/draft-studio.js', 'fetch("/actions/workflows/blog-draft-update.yml/dispatches")');
  await assert.rejects(packagePages(root), /deprecated public draft workflow/);
  await assert.rejects(fs.access(path.join(root, 'output/pages')), { code: 'ENOENT' });
});

test('Pages packaging rejects directory shells and nested symlink escape routes', async (t) => {
  const root = await fixture(t);
  await fs.rm(path.join(root, 'blog/drafts/index.html'));
  await write(root, 'blog/drafts/index.html/private.json', randomUUID());
  await assert.rejects(packagePages(root), /shell must be a regular file/);
  await assert.rejects(fs.access(path.join(root, 'output/pages')), { code: 'ENOENT' });
  await fs.rm(path.join(root, 'blog/drafts/index.html'), { recursive: true });
  await write(root, 'blog/drafts/index.html', shell);
  await write(root, 'private/content.json', randomUUID());
  await fs.symlink(path.join(root, 'private'), path.join(root, 'blog/assets/linked-private'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(packagePages(root), /symbolic links/);
  await assert.rejects(fs.access(path.join(root, 'output/pages')), { code: 'ENOENT' });
  assert.ok(await fs.readFile(path.join(root, 'private/content.json'), 'utf8'));
});

test('private draft JSON is not a public shell manifest, while public structured metadata remains allowed', () => {
  assert.doesNotThrow(() => assertPublicEditor(`${shell}<script type="application/ld+json">${JSON.stringify({ '@type': 'WebPage', name: 'Draft Studio', url: 'https://wcx12.github.io/wcx12/blog/drafts/' })}</script>`, { shell: true }));
  for (const key of ['contentBase64', 'contentHash', 'content_base64', 'expected_sha256', 'source', 'markdown', 'body', 'drafts']) {
    assert.throws(() => assertPublicEditor(`<script type="application/json">${JSON.stringify({ [key]: randomUUID() })}</script>`, { shell: true }), /serialized draft data/);
  }
});

test('the shell renderer cannot read or serialize unpublished posts or write a draft manifest', async () => {
  const builder = await fs.readFile(path.join(rootDir, 'scripts/build-blog.mjs'), 'utf8');
  const renderer = builder.match(/async function renderDraftStudio\([^)]*\) \{[\s\S]*?\n\}(?=\r?\n\r?\nexport function blogArchiveBody)/)?.[0];
  assert.ok(renderer, 'expected the public shell renderer');
  const { notesStudioBody } = await import('./notes-studio-shell.mjs');
  const canary = `private-${randomUUID()}`;
  const unpublishedPosts = new Proxy([], { get() { assert.fail('public shell must not inspect unpublished posts'); } });
  const writes = new Map();
  await runInNewContext(`${renderer}\nrenderDraftStudio(unpublishedPosts, today);`, {
    path, outputDir: '/blog', unpublishedPosts, today: canary, notesStudioBody,
    createPageContext: () => ({}),
    versionedAssetLink: (_, relative) => relative,
    renderShell: (options) => `${options.body}${options.extraHead}${options.extraScripts}`,
    writePage: async (relative, content) => writes.set(relative, content),
    fs: new Proxy({}, { get() { assert.fail('public shell must not read draft files or copy media'); } })
  });
  assert.deepEqual([...writes.keys()], ['blog/drafts/index.html']);
  const html = writes.get('blog/drafts/index.html');
  assert.ok(!html.includes(canary));
  assertPublicEditor(html, { shell: true });
  assert.doesNotMatch(renderer, /contentBase64|contentHash|copyDraftStudioMedia|drafts\.json/);
});

test('private JSON stays in the private repository and publishing has no source side channels', async () => {
  const { PrivateNotesClient } = await import('../blog-src/assets/private-notes-api.js');
  const canary = `private-${randomUUID()}`;
  const note = {
    version: 1, id: randomUUID(), slug: 'public-note', title: 'Public note', description: 'Public description.',
    lang: 'en', category: 'Research Notes', tags: ['notes'], research: [],
    date: '2026-07-10', updated: '2026-07-10', status: 'complete', body: canary,
    publicPath: 'content/posts/public-note/index.md',
    publicMeta: { translationKey: 'public-note', translations: { zh: 'public-note-zh' }, series: 'Notes', featured: true, math: false, toc: true }
  };
  const sha = 'a'.repeat(40);
  const requests = [];
  const client = new PrivateNotesClient(`token-${randomUUID()}`, {
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      const route = new URL(url).pathname;
      let data;
      if (route === '/user') data = { login: 'wcx12' };
      else if (/^\/repos\/wcx12\/[^/]+$/.test(route)) {
        const name = route.split('/').at(-1);
        data = { name, owner: { login: 'wcx12' }, private: name === 'wcx12-private-notes', archived: false, default_branch: 'main', permissions: { push: true } };
      } else if (options.method === 'PUT') data = { content: { sha }, commit: { sha } };
      else {
        assert.equal(route, '/repos/wcx12/wcx12/contents/content/posts/public-note/index.md');
        data = { type: 'file', path: note.publicPath, encoding: 'base64', sha, content: Buffer.from('old public source').toString('base64'), size: Buffer.byteLength('old public source') };
      }
      return { ok: true, status: 200, json: async () => data };
    }
  });
  try {
    await client.connect();
    await client.saveNote(note, null);
    await client.publishNote(note, sha, true);
  } finally {
    client.dispose();
  }
  const writes = requests.filter(({ options }) => options.method !== 'GET');
  assert.equal(writes.length, 2);
  assert.equal(writes[0].url, `https://api.github.com/repos/wcx12/wcx12-private-notes/contents/notes/${note.id}.json`);
  const privateWrite = JSON.parse(writes[0].options.body);
  assert.deepEqual(JSON.parse(Buffer.from(privateWrite.content, 'base64').toString('utf8')), note);
  assert.equal(writes[1].url, `https://api.github.com/repos/wcx12/wcx12/contents/${note.publicPath}`);
  const publicWrite = JSON.parse(writes[1].options.body);
  assert.deepEqual(Object.keys(publicWrite).sort(), ['branch', 'content', 'message', 'sha']);
  const markdown = Buffer.from(publicWrite.content, 'base64').toString('utf8');
  assert.ok(markdown.includes(canary), 'only the explicitly published Markdown contains the body');
  const metadata = matter(markdown).data;
  assert.equal(metadata.draft, false);
  for (const [key, value] of Object.entries(note.publicMeta)) {
    assert.deepEqual(metadata[key], value, `published metadata changed: ${key}`);
  }
  assert.ok(!markdown.includes(note.id), 'private note identity must not be published');
  assert.doesNotMatch(markdown, /^status:|^publicPath:|^publicMeta:/m);
  for (const request of requests) {
    assert.equal(new URL(request.url).origin, 'https://api.github.com');
    assert.doesNotMatch(request.url, /actions|dispatch|workflow/);
    const body = request.options.body ? JSON.parse(request.options.body) : {};
    delete body.content;
    assert.ok(!JSON.stringify({ url: request.url, body }).includes(canary), 'source must not appear in URLs, commit messages, or ancillary payload fields');
    assert.equal(request.options.referrerPolicy, 'no-referrer');
  }
});

test('legacy update command never inspects input, parses JSON, or touches the filesystem', async () => {
  const source = await fs.readFile(path.join(rootDir, 'scripts/apply-blog-draft-update.mjs'), 'utf8');
  const messages = [];
  const processStub = new Proxy({ exitCode: 0 }, {
    get(target, key) {
      assert.equal(key, 'exitCode', 'deprecated command must not read process input');
      return target[key];
    }
  });
  runInNewContext(source, { process: processStub, console: { error: (message) => messages.push(message) }, JSON: { parse() { assert.fail('must not parse private payloads'); } } });
  assert.equal(processStub.exitCode, 1);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Deprecated.*disabled/);
  assert.match(messages[0], /wcx12\/wcx12-private-notes/);
  assert.doesNotMatch(source, /\bimport\b|\brequire\b|\bfetch\b|\bBuffer\b/);
});

test('legacy update rejects missing, malformed, and valid-shaped payloads without disclosing them', async (t) => {
  const root = await fixture(t);
  const canary = `private-${randomUUID()}`;
  const original = 'public file must remain unchanged';
  await write(root, 'content/posts/public-note/index.md', original);
  const payload = Buffer.from(JSON.stringify({ version: 1, path: 'content/posts/public-note/index.md', expected_sha256: '0'.repeat(64), content_base64: Buffer.from(canary).toString('base64') })).toString('base64');
  let rejection;
  for (const value of ['', canary, payload]) {
    const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts/apply-blog-draft-update.mjs'), canary], {
      cwd: root, env: { ...process.env, BLOG_DRAFT_UPDATE_BASE64: value }, input: canary, encoding: 'utf8', timeout: 10000
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Deprecated.*disabled/);
    assert.ok(!result.stderr.includes(canary) && !result.stderr.includes(payload));
    rejection ??= result.stderr;
    assert.equal(result.stderr, rejection, 'rejection must be independent of submitted content');
  }
  assert.equal(await fs.readFile(path.join(root, 'content/posts/public-note/index.md'), 'utf8'), original);
});

test('deprecated workflow has no inputs, permissions, credentials, or publish side channels', async () => {
  const source = await fs.readFile(path.join(rootDir, '.github/workflows/blog-draft-update.yml'), 'utf8');
  const workflow = matter(`---\n${source}\n---`).data;
  assert.deepEqual(Object.keys(workflow).sort(), ['jobs', 'name', 'on', 'permissions']);
  assert.deepEqual(workflow.on, { workflow_dispatch: null });
  assert.deepEqual(workflow.permissions, {});
  assert.deepEqual(Object.keys(workflow.jobs), ['deprecated']);
  const job = workflow.jobs.deprecated;
  assert.deepEqual(Object.keys(job).sort(), ['runs-on', 'steps']);
  assert.equal(job.steps.length, 1);
  assert.deepEqual(Object.keys(job.steps[0]).sort(), ['name', 'run']);
  assert.doesNotMatch(source, /\b(?:inputs|env|uses|with|secrets|contents|pages|id-token):|\$\{\{|\b(?:push|pull_request|workflow_call|repository_dispatch):/);
  assert.doesNotMatch(source, /draft_update_payload|BLOG_DRAFT_UPDATE|github\.token|git (?:add|commit|push)|upload.*artifact|deploy-pages/i);
  assert.match(source, /::error::Public workflow draft updates are disabled/);
  assert.match(source, /^\s+exit 1\s*$/m);
});
