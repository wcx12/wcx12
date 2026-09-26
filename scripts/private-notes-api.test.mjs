import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';
import { loadPosts } from './blog-content.mjs';
import {
  CATEGORIES, MAX_NOTE_BYTES, OWNER, PRIVATE_REPO, PUBLIC_REPO,
  PrivateNotesClient, PrivateNotesError, toPublicMarkdown, validateNote
} from '../blog-src/assets/private-notes-api.js';

const TOKEN = 'github_pat_TEST_SECRET_NEVER_EXPOSE';
const ID = 'b85ed62e-150f-40fb-a121-fc5e5a1386a9';
const SHA = 'a'.repeat(40);
const NEXT_SHA = 'b'.repeat(40);
const COMMIT = 'c'.repeat(40);
const ORIGIN = 'https://api.github.com';
const PRIVATE_API = `/repos/${OWNER}/${PRIVATE_REPO}`;
const PUBLIC_API = `/repos/${OWNER}/${PUBLIC_REPO}`;
const PRIVATE_FILE = `notes/${ID}.json`;
const PUBLIC_FILE = 'content/posts/security-notes/index.md';
const IMPORTED_FILE = 'content/posts/2026-08-30-tiger-generative-retrieval-reading/index.md';

function note(overrides = {}) {
  return {
    version: 1, id: ID, slug: 'security-notes', title: 'Security notes',
    description: 'Notes on secure browser clients.', lang: 'en', category: 'Engineering',
    tags: ['security'], research: [], date: '2026-09-01', updated: '2026-09-26',
    status: 'draft', body: '## Notes\n\nPlain **Markdown**, not rendered HTML.', ...overrides
  };
}
function repo(name = PRIVATE_REPO, overrides = {}) {
  return {
    name, owner: { login: OWNER }, private: name === PRIVATE_REPO, archived: false,
    disabled: false, permissions: { push: true }, default_branch: 'main', ...overrides
  };
}
function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}
function file(path, source = JSON.stringify(note()), sha = SHA, overrides = {}) {
  return {
    type: 'file', path, name: path.split('/').at(-1), sha, size: Buffer.byteLength(source),
    encoding: 'base64', content: Buffer.from(source).toString('base64'), ...overrides
  };
}
function queueFetch(steps) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, ...options });
    const next = steps.shift();
    if (next === undefined) throw new Error('Unexpected mock request.');
    if (typeof next === 'function') return next(url, options);
    return next;
  };
  return { fetchImpl, calls, done: () => assert.equal(steps.length, 0, 'all mock responses used') };
}
async function connected(steps = [], privateOverrides = {}) {
  const mock = queueFetch([
    response({ login: OWNER }), response(repo(PRIVATE_REPO, privateOverrides)), ...steps
  ]);
  const client = new PrivateNotesClient(TOKEN, { fetchImpl: mock.fetchImpl });
  const identity = await client.connect();
  return { client, identity, ...mock };
}
function isCode(code, status) {
  return (error) => {
    assert.ok(error instanceof PrivateNotesError);
    assert.equal(error.code, code);
    if (status !== undefined) assert.equal(error.status, status);
    assert.equal(error.cause, undefined);
    assert.doesNotMatch(`${error.stack} ${JSON.stringify(error)}`, new RegExp(TOKEN));
    return true;
  };
}
function writes(calls) { return calls.filter(({ method }) => method !== 'GET'); }
function writeResult() { return response({ content: { sha: NEXT_SHA }, commit: { sha: COMMIT } }); }
function publicSteps(current = null, { publicOverrides = {}, finalOverrides = {} } = {}) {
  return [
    response(repo()), response(repo(PUBLIC_REPO, publicOverrides)),
    current === null ? response({}, 404) : response(current),
    response(repo(PUBLIC_REPO, finalOverrides)), writeResult()
  ];
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function frontMatter(source) {
  const [, metadata] = source.split('---\n');
  return Object.fromEntries(metadata.trimEnd().split('\n').map((line) => {
    const separator = line.indexOf(': ');
    return [line.slice(0, separator), JSON.parse(line.slice(separator + 2))];
  }));
}

test('connect authenticates exact owner, verifies private repo, and derives its branch', async () => {
  const { client, identity, calls, done } = await connected([], { default_branch: 'notes/main' });
  assert.deepEqual(identity, { login: OWNER, defaultBranch: 'notes/main' });
  assert.deepEqual(calls.map(({ url }) => url), [`${ORIGIN}/user`, `${ORIGIN}${PRIVATE_API}`]);
  assert.equal(JSON.stringify(client), '{}');
  assert.deepEqual(Object.getOwnPropertyNames(client), []);
  done();
});

test('default fetch does not bind a browser native function to the client instance', async (t) => {
  const mock = queueFetch([response({ login: OWNER }), response(repo())]);
  t.mock.method(globalThis, 'fetch', function (...args) {
    assert.ok(this === undefined || this === globalThis, 'native fetch must not receive the client as its receiver');
    return mock.fetchImpl(...args);
  });
  const client = new PrivateNotesClient(TOKEN);
  await client.connect();
  mock.done();
  client.dispose();
});

test('all current articles survive private import and public serialization with their metadata intact', async (t) => {
  const previous = globalThis.markdownit;
  globalThis.markdownit = MarkdownIt;
  t.after(() => { if (previous === undefined) delete globalThis.markdownit; else globalThis.markdownit = previous; });
  const { posts } = await loadPosts(fileURLToPath(new URL('../', import.meta.url)));
  for (const post of posts) {
    const source = await readFile(post.sourcePath, 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source);
    assert.ok(match, post.slug);
    const data = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
    const publicMeta = Object.fromEntries(['translationKey', 'translations', 'series', 'featured', 'math', 'toc', 'socialImage', 'socialImageAlt']
      .filter(key => data[key] !== undefined).map(key => [key, data[key]]));
    const imported = note({ ...Object.fromEntries(['slug', 'title', 'description', 'lang', 'category', 'tags', 'research', 'date'].map(key => [key, data[key] ?? post[key]])),
      updated: post.updated || post.date, publicPath: post.relativePath.replaceAll('\\', '/'), publicMeta, body: match[2] });
    const published = toPublicMarkdown(imported);
    const metadata = frontMatter(published);
    for (const key of ['slug', 'title', 'description', 'lang', 'category', 'tags', 'research', 'date', ...Object.keys(publicMeta)]) {
      assert.deepEqual(metadata[key], data[key] ?? post[key], `${post.slug}: ${key}`);
    }
    assert.ok(published.endsWith(`${match[2]}\n`), 'article body must survive unchanged');
  }
});

test('connect rejects wrong-case and non-owner logins before repository access', async () => {
  for (const login of ['Wcx12', 'another-user', undefined]) {
    const mock = queueFetch([response({ login })]);
    const client = new PrivateNotesClient(TOKEN, { fetchImpl: mock.fetchImpl });
    await assert.rejects(client.connect(), isCode('FORBIDDEN'));
    await assert.rejects(client.listNotes(), isCode('NOT_CONNECTED'));
    assert.equal(mock.calls.length, 1);
  }
});

test('invalid tokens fail locally without exposing their values', () => {
  for (const token of ['', null, undefined, ` ${TOKEN}`, `${TOKEN}\r\nInjected: value`]) {
    assert.throws(() => new PrivateNotesClient(token), isCode('AUTH'));
  }
});

test('authentication, forbidden, not-found, conflict, and API errors remain distinct', async () => {
  for (const [status, code] of [[401, 'AUTH'], [403, 'FORBIDDEN'], [404, 'NOT_FOUND'],
    [409, 'CONFLICT'], [412, 'CONFLICT'], [429, 'FORBIDDEN'], [500, 'API']]) {
    let bodyRead = false;
    const mock = queueFetch([{
      ok: false, status, statusText: TOKEN,
      json: async () => { bodyRead = true; throw new Error(TOKEN); }
    }]);
    const client = new PrivateNotesClient(TOKEN, { fetchImpl: mock.fetchImpl });
    await assert.rejects(client.connect(), isCode(code, status));
    assert.equal(bodyRead, false);
    assert.equal(mock.calls.length, 1);
  }
});

test('fetch failures and JSON parsing failures never escape with a secret-bearing cause', async () => {
  for (const [step, code] of [
    [() => { throw new Error(`${TOKEN}: confidential note body`); }, 'NETWORK'],
    [{ ok: true, json: async () => { throw new Error(TOKEN); } }, 'INVALID_RESPONSE']
  ]) {
    const mock = queueFetch([step]);
    const client = new PrivateNotesClient(TOKEN, { fetchImpl: mock.fetchImpl });
    await assert.rejects(client.connect(), isCode(code));
  }
});

test('private repository must have exact identity, privacy, write access, and active state', async () => {
  for (const [overrides, code] of [
    [{ private: false }, 'PRIVACY'], [{ private: undefined }, 'PRIVACY'],
    [{ owner: { login: 'Wcx12' } }, 'REPOSITORY'], [{ name: PUBLIC_REPO }, 'REPOSITORY'],
    [{ archived: true }, 'REPOSITORY'], [{ disabled: true }, 'REPOSITORY'],
    [{ permissions: { push: false } }, 'FORBIDDEN'], [{ permissions: {} }, 'FORBIDDEN'],
    [{ default_branch: '' }, 'REPOSITORY'], [{ default_branch: 'main\n' }, 'REPOSITORY']
  ]) {
    const mock = queueFetch([response({ login: OWNER }), response(repo(PRIVATE_REPO, overrides))]);
    const client = new PrivateNotesClient(TOKEN, { fetchImpl: mock.fetchImpl });
    await assert.rejects(client.connect(), isCode(code));
    await assert.rejects(client.listNotes(), isCode('NOT_CONNECTED'));
    assert.equal(mock.calls.length, 2);
  }
});

test('all operations require a connected instance', async () => {
  const mock = queueFetch([]);
  const client = new PrivateNotesClient(TOKEN, { fetchImpl: mock.fetchImpl });
  for (const operation of [
    () => client.listNotes(), () => client.getNote(ID), () => client.saveNote(note()),
    () => client.getPublicState(note()), () => client.listPublicSources(),
    () => client.readPublicSource(PUBLIC_FILE), () => client.publishNote(note(), null, true),
    () => client.withdrawNote(note(), SHA, true)
  ]) await assert.rejects(operation(), isCode('NOT_CONNECTED'));
  assert.equal(mock.calls.length, 0);
});

test('revalidates private visibility before every operation and never falls back to public', async () => {
  for (const operation of [
    (client) => client.listNotes(), (client) => client.getNote(ID),
    (client) => client.saveNote(note()), (client) => client.getPublicState(note()),
    (client) => client.listPublicSources(), (client) => client.readPublicSource(PUBLIC_FILE),
    (client) => client.publishNote(note(), null, true), (client) => client.withdrawNote(note(), SHA, true)
  ]) {
    const { client, calls, done } = await connected([response(repo(PRIVATE_REPO, { private: false }))]);
    await assert.rejects(operation(client), isCode('PRIVACY'));
    assert.equal(calls.length, 3);
    assert.equal(calls.at(-1).url, `${ORIGIN}${PRIVATE_API}`);
    assert.equal(writes(calls).length, 0);
    done();
  }
});

test('denied private repository access cannot be confused with an empty note directory', async () => {
  for (const [status, code] of [[403, 'FORBIDDEN'], [404, 'NOT_FOUND']]) {
    const { client, calls } = await connected([response({}, status)]);
    await assert.rejects(client.listNotes(), isCode(code, status));
    assert.equal(calls.length, 3);
    assert.equal(calls.some(({ url }) => url.includes(`${PUBLIC_API}/`)), false);
  }
});

test('listNotes accepts only canonical JSON file paths and does not eagerly read notes', async () => {
  const good = { type: 'file', name: `${ID}.json`, path: PRIVATE_FILE, sha: SHA };
  const entries = [
    good, { ...good, name: 'README.md' }, { ...good, name: `${ID}.JSON` },
    { ...good, type: 'dir' }, { ...good, type: 'symlink' }, { ...good, target: 'secret' },
    { ...good, path: `../${PRIVATE_FILE}` }, { ...good, sha: 'invalid' },
    { ...good, name: `${'-'.repeat(36)}.json` }, { ...good, submodule_git_url: 'https://evil.invalid' },
    null
  ];
  const { client, calls, done } = await connected([response(repo()), response(entries)]);
  assert.deepEqual(await client.listNotes(), [{ id: ID, name: `${ID}.json`, sha: SHA }]);
  assert.equal(calls.length, 4);
  assert.equal(calls.at(-1).url, `${ORIGIN}${PRIVATE_API}/contents/notes?ref=main`);
  done();
});

test('only a contents-directory 404 becomes an empty note list', async () => {
  const { client, done } = await connected([response(repo()), response({}, 404)]);
  assert.deepEqual(await client.listNotes(), []);
  done();
  const malformed = await connected([response(repo()), response({ entries: [] })]);
  await assert.rejects(malformed.client.listNotes(), isCode('INVALID_RESPONSE'));
});

test('getNote decodes UTF-8 using browser APIs, pins path, and returns the file SHA', async () => {
  const value = note({ lang: 'zh', title: '\u7814\u7a76\u7b14\u8bb0', body: '## \u7b14\u8bb0\n\n\ud83d\udd12' });
  const data = file(PRIVATE_FILE, JSON.stringify(value));
  data.content = data.content.match(/.{1,60}/g).join('\n');
  data.download_url = 'https://evil.invalid/private';
  const { client, calls } = await connected([
    response(repo(PRIVATE_REPO, { default_branch: 'notes/main&other=value' })), response(data)
  ]);
  assert.deepEqual(await client.getNote(ID), { note: value, sha: SHA });
  assert.equal(calls.at(-1).url,
    `${ORIGIN}${PRIVATE_API}/contents/${PRIVATE_FILE}?ref=notes%2Fmain%26other%3Dvalue`);
  assert.equal(calls.length, 4);
});

test('getNote rejects path traversal and invalid identifiers without a network request', async () => {
  const { client, calls } = await connected();
  for (const id of ['../README', ID.toUpperCase(), `${ID}?ref=evil`, `${ID}.json`, '-'.repeat(36), null]) {
    await assert.rejects(client.getNote(id), isCode('INVALID_PATH'));
  }
  assert.equal(calls.length, 2);
});

test('getNote rejects mismatched IDs, malformed JSON, symlinks, bad paths, and invalid UTF-8', async () => {
  const badFiles = [
    [file(PRIVATE_FILE, JSON.stringify(note({ id: 'c85ed62e-150f-40fb-a121-fc5e5a1386a9' }))), 'INVALID_NOTE'],
    [file(PRIVATE_FILE, `${TOKEN} invalid JSON`), 'INVALID_NOTE'],
    [file(PRIVATE_FILE, '{}', SHA, { type: 'symlink', target: 'other' }), 'INVALID_RESPONSE'],
    [file('other/path.json'), 'INVALID_RESPONSE'],
    [file(PRIVATE_FILE, '{}', SHA, { content: '%%%%' }), 'INVALID_RESPONSE'],
    [file(PRIVATE_FILE, '{}', SHA, { content: '/w==', size: 1 }), 'INVALID_RESPONSE'],
    [file(PRIVATE_FILE, '{}', SHA, { size: 999 }), 'INVALID_RESPONSE'],
    [file(PRIVATE_FILE, '{}', SHA, { encoding: 'none' }), 'INVALID_RESPONSE']
  ];
  for (const [data, code] of badFiles) {
    const { client } = await connected([response(repo()), response(data)]);
    await assert.rejects(client.getNote(ID), isCode(code));
  }
});

test('validateNote returns a detached snapshot and allows empty private draft content', () => {
  const value = note({ title: '', description: '', body: '', tags: [], research: [] });
  const valid = validateNote(value);
  assert.deepEqual(valid, value);
  assert.notEqual(valid, value);
  assert.notEqual(valid.tags, value.tags);
  assert.notEqual(valid.research, value.research);
  for (const category of CATEGORIES) assert.equal(validateNote(note({ category })).category, category);
});

test('strict schema rejects unsafe paths, dates, categories, types, extensions, and accessors', () => {
  for (const override of [
    { version: 2 }, { id: '../secret' }, { slug: '../secret' }, { slug: 'bad--slug' },
    { slug: 'UPPER' }, { slug: '' }, { slug: '%2e%2e' }, { title: 42 }, { description: null },
    { body: {} }, { lang: 'fr' }, { category: 'Other' }, { status: 'published' },
    { date: '2026-02-30' }, { date: '2026-2-01' }, { updated: '2026-01-01' },
    { tags: 'security' }, { tags: ['security', 1] }, { tags: new Array(1) },
    { research: [null] }, { tags: ['bad tag'] }, { token: TOKEN }, { toJSON: () => ({ token: TOKEN }) }
  ]) assert.throws(() => validateNote(note(override)), isCode('INVALID_NOTE'));
  const missing = note();
  delete missing.body;
  assert.throws(() => validateNote(missing), isCode('INVALID_NOTE'));
  const accessor = note();
  Object.defineProperty(accessor, 'body', { get() { throw new Error(TOKEN); } });
  assert.throws(() => validateNote(accessor), isCode('INVALID_NOTE'));
  for (const value of [null, [], new Date()]) {
    assert.throws(() => validateNote(value), isCode('INVALID_NOTE'));
  }
});

test('220 KiB limit counts UTF-8 bytes, not characters, and applies to stored and public content', async () => {
  assert.equal(MAX_NOTE_BYTES, 220 * 1024);
  const overhead = Buffer.byteLength(JSON.stringify(note({ body: '' })));
  const exact = note({ body: 'x'.repeat(MAX_NOTE_BYTES - overhead) });
  assert.equal(Buffer.byteLength(JSON.stringify(validateNote(exact))), MAX_NOTE_BYTES);
  assert.throws(() => validateNote({ ...exact, body: `${exact.body}x` }), isCode('TOO_LARGE'));
  const unicode = note({ body: '\u7814'.repeat(Math.ceil(MAX_NOTE_BYTES / 3)) });
  assert.throws(() => validateNote(unicode), isCode('TOO_LARGE'));
  const { client, calls } = await connected();
  await assert.rejects(client.saveNote(unicode), isCode('TOO_LARGE'));
  assert.equal(calls.length, 2);
  assert.throws(() => toPublicMarkdown(note({ body: 'x'.repeat(MAX_NOTE_BYTES) })), isCode('TOO_LARGE'));
  const oversized = await connected([
    response(repo()), response(file(PRIVATE_FILE, '{}', SHA, { size: MAX_NOTE_BYTES + 1 }))
  ]);
  await assert.rejects(oversized.client.getNote(ID), isCode('TOO_LARGE'));
});

test('saveNote creates without adopting an unknown SHA and updates with exact caller SHA', async () => {
  for (const expected of [undefined, null, SHA]) {
    const { client, calls, done } = await connected([
      response(repo(PRIVATE_REPO, { default_branch: 'private-notes' })), writeResult()
    ]);
    const value = note();
    const result = await client.saveNote(value, expected);
    assert.deepEqual(result, { note: value, sha: NEXT_SHA });
    const [write] = writes(calls);
    assert.equal(write.url, `${ORIGIN}${PRIVATE_API}/contents/${PRIVATE_FILE}`);
    assert.equal(write.method, 'PUT');
    const payload = JSON.parse(write.body);
    assert.equal(payload.branch, 'private-notes');
    assert.equal(payload.sha, expected ?? undefined);
    assert.equal(Object.hasOwn(payload, 'sha'), typeof expected === 'string');
    assert.deepEqual(JSON.parse(Buffer.from(payload.content, 'base64').toString('utf8')), value);
    assert.equal(calls.length, 4);
    done();
  }
});

test('private writes propagate CAS failures without retry or fallback', async () => {
  for (const status of [409, 412, 422]) {
    const { client, calls } = await connected([response(repo()), response({ message: TOKEN }, status)]);
    await assert.rejects(client.saveNote(note(), SHA), isCode('CONFLICT', status));
    assert.equal(writes(calls).length, 1);
    assert.equal(calls.length, 4);
  }
});

test('snapshotting prevents caller mutation while save is waiting on repository verification', async () => {
  const ready = deferred();
  const gate = deferred();
  const { client, calls } = await connected([
    () => { ready.resolve(); return gate.promise; }, writeResult()
  ]);
  const value = note();
  const pending = client.saveNote(value, SHA);
  await ready.promise;
  value.slug = '../unsafe';
  value.body = 'changed after confirmation';
  value.tags.push('late-change');
  gate.resolve(response(repo()));
  const saved = await pending;
  assert.deepEqual(saved.note, note());
  assert.deepEqual(JSON.parse(Buffer.from(JSON.parse(writes(calls)[0].body).content, 'base64')), note());
});

test('public Markdown has JSON-escaped YAML metadata and never includes private schema fields', () => {
  const value = note({
    title: 'A "quote": yes\nvisibility: private\n---',
    description: 'C:\\notes\tline\u0085\u2028\u2029', body: '## Text\n\n---\nRaw Markdown stays raw.'
  });
  const source = toPublicMarkdown(value);
  const meta = frontMatter(source);
  assert.equal(meta.title, value.title);
  assert.equal(meta.description, value.description);
  assert.equal(meta.draft, false);
  assert.equal(meta.visibility, 'public');
  assert.equal(meta.math, true);
  assert.equal(meta.toc, true);
  assert.equal(meta.featured, false);
  assert.equal(meta.date, value.date);
  assert.equal(meta.updated, value.updated);
  assert.equal(meta.lang, value.lang);
  assert.deepEqual(meta.research, []);
  for (const key of ['id', 'version', 'status', 'publicPath', 'publicMeta']) {
    assert.equal(Object.hasOwn(meta, key), false);
  }
  assert.doesNotMatch(source, new RegExp(ID));
  assert.doesNotMatch(source, /[\u0085\u2028\u2029]/);
  assert.ok(source.endsWith(`${value.body}\n`));
});

test('publishing empty text or a tagless draft is rejected before network access', async () => {
  const { client, calls } = await connected();
  for (const override of [{ title: '' }, { description: ' \n' }, { body: '' }, { tags: [] }]) {
    assert.doesNotThrow(() => validateNote(note(override)));
    assert.throws(() => toPublicMarkdown(note(override)), isCode('PUBLIC_CONTENT_REQUIRED'));
    await assert.rejects(client.publishNote(note(override), null, true), isCode('PUBLIC_CONTENT_REQUIRED'));
  }
  assert.equal(calls.length, 2);
});

test('public level-one headings are rejected, including Setext, quotes, and list nesting', async () => {
  const { client, calls } = await connected();
  for (const body of ['# Title', '#', 'Title\n=====', '> # Title', '> Title\n> ===',
    '- # Title', '1. # Title', '> - # Title', '   # Title', 'Text\r# Title', '\uFEFF# Title']) {
    assert.doesNotThrow(() => validateNote(note({ body })));
    assert.throws(() => toPublicMarkdown(note({ body })), isCode('INVALID_HEADINGS'));
    await assert.rejects(client.publishNote(note({ body }), null, true), isCode('INVALID_HEADINGS'));
  }
  for (const body of ['## Heading\n\nText', 'Title\n-----', '\\# Literal', '#hashtag']) {
    assert.doesNotThrow(() => toPublicMarkdown(note({ body })));
  }
  assert.equal(calls.length, 2);
});

test('uses the site Markdown engine for accurate fenced-code versus heading validation', async () => {
  const { default: MarkdownIt } = await import('markdown-it');
  const previous = globalThis.markdownit;
  globalThis.markdownit = MarkdownIt;
  try {
    for (const body of ['# Heading', 'Title\n====', '> # Heading', '- # Heading']) {
      assert.throws(() => toPublicMarkdown(note({ body })), isCode('INVALID_HEADINGS'));
    }
    for (const body of ['```sh\n# comment\n```', '~~~md\n# example\n~~~', '    # code']) {
      assert.doesNotThrow(() => toPublicMarkdown(note({ body })));
    }
  } finally {
    if (previous === undefined) delete globalThis.markdownit;
    else globalThis.markdownit = previous;
  }
});

test('empty existing social-image metadata remains valid and is preserved', () => {
  const publicMeta = { socialImage: '', socialImageAlt: '' };
  const value = note({ publicPath: IMPORTED_FILE, publicMeta });
  assert.deepEqual(validateNote(value).publicMeta, publicMeta);
  const metadata = frontMatter(toPublicMarkdown(value));
  assert.equal(metadata.socialImage, '');
  assert.equal(metadata.socialImageAlt, '');
});

test('imported dated paths and only allowlisted public metadata round-trip safely', () => {
  const publicMeta = {
    translationKey: 'security-notes', translations: { zh: 'security-notes-zh' },
    series: 'Security: "clients"\nnotes', featured: true, math: false, toc: false,
    socialImage: 'media/social-card.png', socialImageAlt: 'Existing public social card'
  };
  const value = note({ publicPath: IMPORTED_FILE, publicMeta, body: '![Public figure](media/figure.png)' });
  const snapshot = validateNote(value);
  assert.deepEqual(snapshot, value);
  assert.notEqual(snapshot.publicMeta.translations, publicMeta.translations);
  const metadata = frontMatter(toPublicMarkdown(value));
  for (const [key, item] of Object.entries(publicMeta)) assert.deepEqual(metadata[key], item);
  assert.equal(metadata.draft, false);
  assert.equal(metadata.visibility, 'public');
  assert.equal(metadata.publicPath, undefined);
  assert.equal(metadata.publicMeta, undefined);
});

test('rejects arbitrary import paths and public metadata escape hatches', () => {
  for (const path of [
    'content/posts/../index.md', 'content/posts/slug/other.md', 'content/posts/slug/media/index.md',
    'content/posts/%2e%2e/index.md', '/content/posts/slug/index.md',
    'content/posts/Slug/index.md', `${IMPORTED_FILE}?ref=evil`, '.github/workflows/main.yml'
  ]) assert.throws(() => validateNote(note({ publicPath: path })), isCode('INVALID_PATH'));
  for (const publicMeta of [
    { draft: true }, { visibility: 'private' }, { id: ID }, { featured: 'true' },
    { math: 1 }, { toc: null }, { series: {} }, { translations: { fr: 'slug' } },
    { translations: { en: '../unsafe' } }, { translations: [] },
    { socialImage: '../private.png' }, { socialImage: 'https://evil.invalid/track.png' },
    { socialImage: 'media/active.svg' }, { socialImage: 'media/../private.png' },
    { socialImageAlt: 3 }, { token: TOKEN }
  ]) assert.throws(() => validateNote(note({ publicMeta })), isCode('INVALID_NOTE'));
});

test('new note images are blocked, including references, HTML, and social metadata', async () => {
  const { client, calls } = await connected();
  for (const body of [
    '![figure](media/image.png)', '![figure][ref]\n\n[ref]: https://example.com/image.png',
    '<IMG src="image.png">', '<picture><source srcset="image.webp"></picture>', '<svg></svg>'
  ]) {
    assert.throws(() => toPublicMarkdown(note({ body })), isCode('IMAGES_UNSUPPORTED'));
    await assert.rejects(client.publishNote(note({ body }), null, true), isCode('IMAGES_UNSUPPORTED'));
  }
  assert.throws(() => toPublicMarkdown(note({
    publicMeta: { socialImage: 'media/card.png', socialImageAlt: 'Card' }
  })), isCode('IMAGES_UNSUPPORTED'));
  await assert.rejects(client.publishNote(note({ publicPath: IMPORTED_FILE,
    body: '![figure](media/image.png)' }), null, true), isCode('IMAGES_UNSUPPORTED'));
  assert.equal(calls.length, 2);
});

test('listPublicSources returns only pinned directory index paths without reading articles', async () => {
  const name = '2026-08-30-tiger-generative-retrieval-reading';
  const good = { type: 'dir', name, path: `content/posts/${name}` };
  const { client, calls } = await connected([
    response(repo()), response(repo(PUBLIC_REPO)), response([
      good, { ...good, type: 'file' }, { ...good, name: '../outside' },
      { ...good, path: 'outside' }, { ...good, target: 'elsewhere' }, null
    ])
  ]);
  assert.deepEqual(await client.listPublicSources(), [{ name, path: IMPORTED_FILE }]);
  assert.equal(calls.length, 5);
  assert.equal(calls.at(-1).url, `${ORIGIN}${PUBLIC_API}/contents/content/posts?ref=main`);
});

test('readPublicSource and getPublicState read the imported path, never a response URL', async () => {
  for (const read of [
    (client) => client.readPublicSource(IMPORTED_FILE),
    (client) => client.getPublicState(note({ publicPath: IMPORTED_FILE }))
  ]) {
    const source = '---\ntitle: "Public"\n---\n\nExisting public Markdown.';
    const { client, calls } = await connected([
      response(repo()), response(repo(PUBLIC_REPO, { permissions: { push: false } })),
      response(file(IMPORTED_FILE, source, SHA, { download_url: 'https://evil.invalid' }))
    ]);
    assert.deepEqual(await read(client), { source, sha: SHA });
    assert.equal(calls.at(-1).url, `${ORIGIN}${PUBLIC_API}/contents/${IMPORTED_FILE}?ref=main`);
    assert.equal(calls.length, 5);
  }
});

test('getPublicState returns null only for a missing content file, not repo access denial', async () => {
  const { client } = await connected([response(repo()), response(repo(PUBLIC_REPO)), response({}, 404)]);
  assert.equal(await client.getPublicState(note()), null);
  const denied = await connected([response(repo()), response({}, 404)]);
  await assert.rejects(denied.client.getPublicState(note()), isCode('NOT_FOUND', 404));
  const readMissing = await connected([response(repo()), response(repo(PUBLIC_REPO)), response({}, 404)]);
  await assert.rejects(readMissing.client.readPublicSource(PUBLIC_FILE), isCode('NOT_FOUND', 404));
});

test('public writes require true confirmation and explicit valid expected SHA values', async () => {
  const { client, calls } = await connected();
  for (const confirmation of [undefined, false, null, 1, 'true', {}]) {
    await assert.rejects(client.publishNote(note(), null, confirmation), isCode('CONFIRMATION_REQUIRED'));
    await assert.rejects(client.withdrawNote(note(), SHA, confirmation), isCode('CONFIRMATION_REQUIRED'));
  }
  for (const sha of [undefined, '', 'not-a-sha', true, {}, 'a'.repeat(39)]) {
    await assert.rejects(client.publishNote(note(), sha, true), isCode('INVALID_SHA'));
    await assert.rejects(client.withdrawNote(note(), sha, true), isCode('INVALID_SHA'));
  }
  await assert.rejects(client.withdrawNote(note(), null, true), isCode('INVALID_SHA'));
  await assert.rejects(client.saveNote(note(), 'not-a-sha'), isCode('INVALID_SHA'));
  assert.equal(calls.length, 2);
});

test('public repository visibility, identity, and push permission are checked on publishing', async () => {
  for (const [overrides, code] of [
    [{ private: true }, 'PRIVACY'], [{ name: PRIVATE_REPO }, 'REPOSITORY'],
    [{ owner: { login: 'other' } }, 'REPOSITORY'], [{ archived: true }, 'REPOSITORY'],
    [{ permissions: { push: false } }, 'FORBIDDEN']
  ]) {
    const { client, calls } = await connected([response(repo()), response(repo(PUBLIC_REPO, overrides))]);
    await assert.rejects(client.publishNote(note(), null, true), isCode(code));
    assert.equal(writes(calls).length, 0);
    assert.equal(calls.length, 4);
  }
});

test('publish refuses unknown existing content, stale SHA, and a disappeared expected file', async () => {
  for (const [expected, current] of [[null, file(PUBLIC_FILE, 'existing')],
    [NEXT_SHA, file(PUBLIC_FILE, 'existing')], [SHA, null]]) {
    const { client, calls } = await connected(publicSteps(current).slice(0, 3));
    await assert.rejects(client.publishNote(note(), expected, true), isCode('CONFLICT'));
    assert.equal(writes(calls).length, 0);
    assert.equal(calls.length, 5);
  }
});

test('public create/update use CAS, selected default branch, and return pinned commit URL', async () => {
  for (const [expected, current] of [[null, null], [SHA, file(PUBLIC_FILE, 'existing')]]) {
    const { client, calls, done } = await connected(publicSteps(current, {
      publicOverrides: { default_branch: 'published' }, finalOverrides: { default_branch: 'published' }
    }));
    assert.deepEqual(await client.publishNote(note(), expected, true), {
      sha: COMMIT, url: `https://github.com/${OWNER}/${PUBLIC_REPO}/commit/${COMMIT}`
    });
    const [write] = writes(calls);
    assert.equal(write.method, 'PUT');
    assert.equal(write.url, `${ORIGIN}${PUBLIC_API}/contents/${PUBLIC_FILE}`);
    const payload = JSON.parse(write.body);
    assert.equal(payload.branch, 'published');
    assert.equal(payload.sha, expected ?? undefined);
    assert.equal(Buffer.from(payload.content, 'base64').toString('utf8'), toPublicMarkdown(note()));
    assert.doesNotMatch(write.body, new RegExp(ID));
    assert.equal(calls[4].url, `${ORIGIN}${PUBLIC_API}/contents/${PUBLIC_FILE}?ref=published`);
    done();
  }
});

test('publish imported source in its dated directory and preserve public metadata/images', async () => {
  const value = note({ publicPath: IMPORTED_FILE,
    body: '![Existing figure](media/figure.png)', publicMeta: { featured: true, math: false } });
  const { client, calls } = await connected(publicSteps(file(IMPORTED_FILE, 'existing')));
  await client.publishNote(value, SHA, true);
  const [write] = writes(calls);
  assert.equal(write.url, `${ORIGIN}${PUBLIC_API}/contents/${IMPORTED_FILE}`);
  const published = Buffer.from(JSON.parse(write.body).content, 'base64').toString('utf8');
  assert.equal(frontMatter(published).featured, true);
  assert.equal(frontMatter(published).math, false);
  assert.ok(published.includes(value.body));
  assert.doesNotMatch(published, new RegExp(ID));
  assert.equal(published.includes(IMPORTED_FILE), false);
});

test('public CAS races returned by GitHub never trigger an overwrite retry', async () => {
  for (const status of [409, 422]) {
    const steps = publicSteps(file(PUBLIC_FILE, 'existing'));
    steps[4] = response({ message: TOKEN }, status);
    const { client, calls } = await connected(steps);
    await assert.rejects(client.publishNote(note(), SHA, true), isCode('CONFLICT', status));
    assert.equal(writes(calls).length, 1);
    assert.equal(calls.length, 7);
  }
});

test('public changes abort when branch or visibility changes after the CAS preflight', async () => {
  for (const [overrides, code] of [[{ default_branch: 'changed' }, 'CONFLICT'], [{ private: true }, 'PRIVACY']]) {
    const { client, calls } = await connected(publicSteps(null, { finalOverrides: overrides }).slice(0, 4));
    await assert.rejects(client.publishNote(note(), null, true), isCode(code));
    assert.equal(writes(calls).length, 0);
  }
});

test('withdraw deletes only index.md via contents API with caller SHA and never rewrites history', async () => {
  const { client, calls, done } = await connected(publicSteps(file(IMPORTED_FILE, 'existing')));
  const result = await client.withdrawNote(note({ publicPath: IMPORTED_FILE }), SHA, true);
  assert.deepEqual(result, { sha: COMMIT, url: `https://github.com/${OWNER}/${PUBLIC_REPO}/commit/${COMMIT}` });
  const [write] = writes(calls);
  assert.equal(write.method, 'DELETE');
  assert.equal(write.url, `${ORIGIN}${PUBLIC_API}/contents/${IMPORTED_FILE}`);
  assert.deepEqual(JSON.parse(write.body), { message: 'Withdraw public note', branch: 'main', sha: SHA });
  assert.equal(calls.some(({ url }) => /\/git\/|\/media\//.test(url)), false);
  done();
});

test('withdraw rejects stale or missing public content without issuing a delete', async () => {
  for (const current of [null, file(PUBLIC_FILE, 'changed', NEXT_SHA)]) {
    const { client, calls } = await connected(publicSteps(current).slice(0, 3));
    await assert.rejects(client.withdrawNote(note(), SHA, true), isCode('CONFLICT'));
    assert.equal(writes(calls).length, 0);
  }
});

test('every fetch pins API origin, excludes cookies/referrers/cache, and rejects redirects', async () => {
  const { client, calls } = await connected(publicSteps(null));
  await client.publishNote(note(), null, true);
  for (const call of calls) {
    const url = new URL(call.url);
    assert.equal(url.origin, ORIGIN);
    assert.equal(url.username, '');
    assert.equal(url.password, '');
    assert.equal(url.hash, '');
    assert.equal(call.credentials, 'omit');
    assert.equal(call.redirect, 'error');
    assert.equal(call.cache, 'no-store');
    assert.equal(call.referrerPolicy, 'no-referrer');
    assert.equal(call.headers.Authorization, `Bearer ${TOKEN}`);
    assert.ok(call.signal instanceof AbortSignal);
    assert.equal(call.url.includes(TOKEN), false);
    assert.equal((call.body || '').includes(TOKEN), false);
  }
  for (const extra of [{ redirected: true }, { url: 'https://evil.invalid' }]) {
    const mock = queueFetch([{ ...response({ login: OWNER }), ...extra }]);
    const rejected = new PrivateNotesClient(TOKEN, { fetchImpl: mock.fetchImpl });
    await assert.rejects(rejected.connect(), isCode('NETWORK'));
    assert.equal(mock.calls.length, 1);
  }
});

test('dispose is terminal, aborts signals, and makes all operations fail locally', async () => {
  const { client, calls } = await connected();
  client.dispose();
  client.dispose();
  for (const call of calls) assert.equal(call.signal.aborted, true);
  for (const operation of [
    () => client.connect(), () => client.listNotes(), () => client.getNote(ID),
    () => client.saveNote(note()), () => client.listPublicSources(),
    () => client.readPublicSource(PUBLIC_FILE), () => client.getPublicState(note()),
    () => client.publishNote(note(), null, true), () => client.withdrawNote(note(), SHA, true)
  ]) await assert.rejects(operation(), isCode('DISPOSED'));
  assert.equal(calls.length, 2);
  assert.equal(JSON.stringify(client).includes(TOKEN), false);
});

test('dispose during connect blocks subsequent requests even if fetch ignores abort', async () => {
  const gate = deferred();
  const mock = queueFetch([() => gate.promise]);
  const client = new PrivateNotesClient(TOKEN, { fetchImpl: mock.fetchImpl });
  const pending = client.connect();
  client.dispose();
  assert.equal(mock.calls[0].signal.aborted, true);
  gate.resolve(response({ login: OWNER }));
  await assert.rejects(pending, isCode('DISPOSED'));
  assert.equal(mock.calls.length, 1);
});

test('dispose while save is verifying privacy prevents a pending write', async () => {
  const gate = deferred();
  const ready = deferred();
  const { client, calls } = await connected([() => { ready.resolve(); return gate.promise; }]);
  const pending = client.saveNote(note(), SHA);
  await ready.promise;
  client.dispose();
  gate.resolve(response(repo()));
  await assert.rejects(pending, isCode('DISPOSED'));
  assert.equal(writes(calls).length, 0);
});

test('dispose during response decoding discards private results even if JSON decoding finishes', async () => {
  const gate = deferred();
  const ready = deferred();
  const { client, calls } = await connected([
    response(repo()), { ok: true, status: 200, json: () => { ready.resolve(); return gate.promise; } }
  ]);
  const pending = client.getNote(ID);
  await ready.promise;
  client.dispose();
  gate.resolve(file(PRIVATE_FILE));
  await assert.rejects(pending, isCode('DISPOSED'));
  assert.equal(calls.length, 4);
});

test('dispose during public preflight prevents publishing and during writes discards success', async () => {
  for (const duringWrite of [false, true]) {
    const gate = deferred();
    const ready = deferred();
    const steps = publicSteps(null);
    steps[duringWrite ? 4 : 2] = () => { ready.resolve(); return gate.promise; };
    const { client, calls } = await connected(steps.slice(0, duringWrite ? 5 : 3));
    const pending = client.publishNote(note(), null, true);
    await ready.promise;
    client.dispose();
    gate.resolve(duringWrite ? writeResult() : response({}, 404));
    await assert.rejects(pending, isCode('DISPOSED'));
    assert.equal(writes(calls).length, duringWrite ? 1 : 0);
  }
});

test('the browser module has no Node imports, persistence, logging, DOM, or global token storage', async () => {
  const source = await readFile(new URL('../blog-src/assets/private-notes-api.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:import|require|Buffer|process|localStorage|sessionStorage|indexedDB|console|document|window)\b/);
  assert.match(source, /#token;/);
  assert.match(source, /this\.#token = '';/);
  assert.match(source, /this\.#controller\.abort\(\)/);
});
