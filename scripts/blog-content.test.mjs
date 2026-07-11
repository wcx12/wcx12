import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import MarkdownIt from 'markdown-it';
import markdownItKatexModule from 'markdown-it-katex';
import { loadPosts, publicationState, siteDate, summarizeDiagnostics } from './blog-content.mjs';

const markdownItKatex = typeof markdownItKatexModule === 'function'
  ? markdownItKatexModule
  : markdownItKatexModule.default;
const ONE_PIXEL_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

function createRenderer() {
  return new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true
  }).use(markdownItKatex, { throwOnError: false, errorColor: '#ff6f59' });
}

function assertNoExecutableMarkup(html) {
  assert.doesNotMatch(html, /<(?:embed|iframe|img|object|script|svg)\b/i);
  assert.doesNotMatch(html, /<[^>]+\son(?:error|load)\s*=/i);
  assert.doesNotMatch(html, /<[^>]+(?:href|src)\s*=\s*["']?\s*javascript\s*:/i);
}

test('renders inline and block dollar-delimited formulas with KaTeX', () => {
  const html = createRenderer().render(String.raw`Inline: $E=mc^2$.

$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$
`);

  assert.match(html, /class="katex"/);
  assert.match(html, /class="katex-display"/);
  assert.match(html, /<annotation encoding="application\/x-tex">E=mc\^2<\/annotation>/);
  assert.match(html, /<p class="katex-block">/);
});

test('escapes known markdown-it-katex XSS payloads', () => {
  const renderer = createRenderer();
  const payloads = [
    '$<img src=a onerror=alert(1)>%$',
    String.raw`$\unicode{<img src=x onerror=alert(1)>}$`
  ];

  for (const payload of payloads) {
    const html = renderer.render(payload);
    assertNoExecutableMarkup(html);
    assert.match(html, /&lt;img/i);
  }
});

function postSource(body) {
  return `---
title: "Heading validation"
slug: "heading-validation"
date: "2026-07-10"
updated: "2026-07-10"
description: "Heading validation fixture."
category: "Research Notes"
tags: ["notes"]
research: []
featured: false
draft: false
math: false
toc: true
lang: "en"
---

${body}
`;
}

async function validateSource(source) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wcx12-content-'));
  try {
    const postsDir = path.join(root, 'content', 'posts');
    await fs.mkdir(postsDir, { recursive: true });
    await fs.writeFile(path.join(postsDir, 'fixture.md'), source);
    const { diagnostics } = await loadPosts(root, { includeDrafts: true });
    return summarizeDiagnostics(diagnostics);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function validateFixture(body) {
  return validateSource(postSource(body));
}

async function withContentRoot(callback) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wcx12-content-'));
  try {
    await fs.mkdir(path.join(root, 'content', 'posts'), { recursive: true });
    return await callback(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('rejects Setext level-one headings supplied inside post bodies', async () => {
  const { errors } = await validateFixture('Duplicate title\n===============');
  assert.match(errors.join('\n'), /heading level 2/);
});

test('does not treat headings inside tilde code fences as document headings', async () => {
  const { errors } = await validateFixture('~~~sh\n# shell comment\n~~~');
  assert.equal(errors.length, 0);
});

test('rejects impossible calendar dates instead of normalizing them', async () => {
  const source = postSource('Body')
    .replace('date: "2026-07-10"', 'date: "2026-02-31"')
    .replace('updated: "2026-07-10"', 'updated: "2026-02-31"');
  const { errors } = await validateSource(source);
  assert.match(errors.join('\n'), /date must be YYYY-MM-DD/);
  assert.match(errors.join('\n'), /updated must be YYYY-MM-DD/);
});

test('requires front matter flags to use YAML booleans', async () => {
  const source = postSource('Body')
    .replace('draft: false', 'draft: "false"')
    .replace('toc: true', 'toc: 1');
  const { errors } = await validateSource(source);
  assert.match(errors.join('\n'), /draft must be a boolean/);
  assert.match(errors.join('\n'), /toc must be a boolean/);
});

test('requires math metadata when prose contains formulas', async () => {
  const { errors } = await validateFixture('The relation $E=mc^2$ is rendered as mathematics.');
  assert.match(errors.join('\n'), /math content requires front matter "math: true"/);

  const codeOnly = await validateFixture('`$E=mc^2$`\n\n```sh\necho "$HOME"\n```');
  assert.doesNotMatch(codeOnly.errors.join('\n'), /math content requires/);
});

test('uses the configured site timezone for publication dates', () => {
  assert.equal(siteDate('2026-07-10T15:59:59Z', 'Asia/Shanghai'), '2026-07-10');
  assert.equal(siteDate('2026-07-10T16:00:00Z', 'Asia/Shanghai'), '2026-07-11');
  assert.equal(publicationState({ draft: true, date: '2026-07-01' }, '2026-07-10'), 'draft');
  assert.equal(publicationState({ draft: false, date: '2026-07-11' }, '2026-07-10'), 'scheduled');
  assert.equal(publicationState({ draft: false, date: '2026-07-10' }, '2026-07-10'), 'published');
});

test('keeps drafts and future posts out of the public collection', async () => withContentRoot(async (root) => {
  const postsDir = path.join(root, 'content', 'posts');
  await fs.writeFile(path.join(postsDir, 'published.md'), postSource('Published body'));
  await fs.writeFile(path.join(postsDir, 'scheduled.md'), postSource('Scheduled body')
    .replaceAll('heading-validation', 'scheduled-post')
    .replace('Heading validation', 'Scheduled post')
    .replaceAll('2026-07-10', '2026-07-11'));
  await fs.writeFile(path.join(postsDir, 'draft.md'), postSource('Draft body')
    .replaceAll('heading-validation', 'draft-post')
    .replace('Heading validation', 'Draft post')
    .replace('draft: false', 'draft: true'));

  const publicResult = await loadPosts(root, { today: '2026-07-10' });
  assert.deepEqual(publicResult.posts.map((post) => post.slug), ['heading-validation']);
  assert.deepEqual(publicResult.publicationCounts, { published: 1, scheduled: 1, draft: 1 });

  const previewResult = await loadPosts(root, { today: '2026-07-10', includeDrafts: true, includeFuture: true });
  assert.deepEqual(new Set(previewResult.posts.map((post) => post.publicationState)), new Set(['published', 'scheduled', 'draft']));
}));

test('validates bundled post media and fingerprints referenced files', async () => withContentRoot(async (root) => {
  const bundle = path.join(root, 'content', 'posts', 'fixture');
  await fs.mkdir(path.join(bundle, 'media'), { recursive: true });
  await fs.writeFile(path.join(bundle, 'index.md'), postSource('![Registration correspondences](media/plot.png)'));
  await fs.writeFile(path.join(bundle, 'media', 'plot.png'), ONE_PIXEL_PNG);

  const { posts, diagnostics } = await loadPosts(root, { today: '2026-07-10' });
  const { errors } = summarizeDiagnostics(diagnostics);
  assert.deepEqual(errors, []);
  assert.equal(posts[0].mediaFiles[0].publicPath, 'media/plot.png');
  assert.match(posts[0].mediaFiles[0].version, /^[a-f0-9]{12}$/);
}));

test('validates and publishes a front-matter social image from the article bundle', async () => withContentRoot(async (root) => {
  const bundle = path.join(root, 'content', 'posts', 'fixture');
  await fs.mkdir(path.join(bundle, 'media'), { recursive: true });
  const source = postSource('Article body.')
    .replace('lang: "en"', 'lang: "en"\nsocialImage: "media/social-card.png"\nsocialImageAlt: "A concise article preview"');
  await fs.writeFile(path.join(bundle, 'index.md'), source);
  await fs.writeFile(path.join(bundle, 'media', 'social-card.png'), ONE_PIXEL_PNG);

  const { posts, diagnostics } = await loadPosts(root, { today: '2026-07-10' });
  const { errors } = summarizeDiagnostics(diagnostics);
  assert.deepEqual(errors, []);
  assert.equal(posts[0].socialImage, 'media/social-card.png');
  assert.equal(posts[0].socialImageAlt, 'A concise article preview');
  assert.equal(posts[0].mediaFiles[0].publicPath, 'media/social-card.png');
}));

test('requires social image metadata to be typed and accessible', async () => {
  const missingAlt = postSource('Article body.')
    .replace('lang: "en"', 'lang: "en"\nsocialImage: "media/social-card.png"');
  const invalidType = postSource('Article body.')
    .replace('lang: "en"', 'lang: "en"\nsocialImage: 42\nsocialImageAlt: "Preview"');
  const missingAltResult = await validateSource(missingAlt);
  const invalidTypeResult = await validateSource(invalidType);
  assert.match(missingAltResult.errors.join('\n'), /socialImage requires non-empty socialImageAlt/);
  assert.match(invalidTypeResult.errors.join('\n'), /socialImage must be a string/);
});

test('rejects missing, mis-cased, unsafe, and unlabelled media', async () => withContentRoot(async (root) => {
  const bundle = path.join(root, 'content', 'posts', 'fixture');
  await fs.mkdir(path.join(bundle, 'media'), { recursive: true });
  await fs.writeFile(path.join(bundle, 'media', 'Plot.png'), ONE_PIXEL_PNG);
  await fs.writeFile(path.join(bundle, 'index.md'), postSource([
    '![](media/missing.png)',
    '![Case mismatch](media/plot.png)',
    '![Traversal](media/%2e%2e/secret.png)'
  ].join('\n\n')));

  const { diagnostics } = await loadPosts(root, { today: '2026-07-10' });
  const { errors } = summarizeDiagnostics(diagnostics);
  assert.match(errors.join('\n'), /must include alt text/);
  assert.match(errors.join('\n'), /does not exist with exact casing/);
  assert.match(errors.join('\n'), /invalid media path/);
}));

test('requires media references to come from a bundled post', async () => {
  const { errors } = await validateFixture('![Plot](media/plot.png)');
  assert.match(errors.join('\n'), /requires a bundled post with index\.md/);
});

test('rejects active media formats and files disguised as safe images', async () => withContentRoot(async (root) => {
  const bundle = path.join(root, 'content', 'posts', 'fixture');
  const media = path.join(bundle, 'media');
  await fs.mkdir(media, { recursive: true });
  await fs.writeFile(path.join(bundle, 'index.md'), postSource([
    '![Active payload](media/payload.svg)',
    '![Disguised payload](media/fake.png)'
  ].join('\n\n')));
  await fs.writeFile(path.join(media, 'payload.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  await fs.writeFile(path.join(media, 'fake.png'), '<script>alert(1)</script>');

  const { diagnostics } = await loadPosts(root, { today: '2026-07-10' });
  const { errors } = summarizeDiagnostics(diagnostics);
  assert.match(errors.join('\n'), /unsupported media type "\.svg"/);
  assert.match(errors.join('\n'), /does not match its \.png extension/);
}));

test('rejects symbolic links in article media', async (context) => withContentRoot(async (root) => {
  const bundle = path.join(root, 'content', 'posts', 'fixture');
  const media = path.join(bundle, 'media');
  await fs.mkdir(media, { recursive: true });
  await fs.writeFile(path.join(bundle, 'index.md'), postSource('![Linked media](media/link.png)'));
  await fs.writeFile(path.join(bundle, 'real.png'), ONE_PIXEL_PNG);
  try {
    await fs.symlink(path.join(bundle, 'real.png'), path.join(media, 'link.png'), 'file');
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) {
      context.skip(`symbolic links unavailable: ${error.code}`);
      return;
    }
    throw error;
  }
  const { diagnostics } = await loadPosts(root, { today: '2026-07-10' });
  const { errors } = summarizeDiagnostics(diagnostics);
  assert.match(errors.join('\n'), /must not contain symbolic links/);
}));

test('rejects a symbolic article media directory', async (context) => withContentRoot(async (root) => {
  const bundle = path.join(root, 'content', 'posts', 'fixture');
  const externalMedia = path.join(root, 'external-media');
  await fs.mkdir(bundle, { recursive: true });
  await fs.mkdir(externalMedia, { recursive: true });
  await fs.writeFile(path.join(bundle, 'index.md'), postSource('![Linked media](media/link.png)'));
  await fs.writeFile(path.join(externalMedia, 'link.png'), ONE_PIXEL_PNG);
  try {
    await fs.symlink(externalMedia, path.join(bundle, 'media'), 'dir');
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) {
      context.skip(`symbolic links unavailable: ${error.code}`);
      return;
    }
    throw error;
  }
  const { diagnostics } = await loadPosts(root, { today: '2026-07-10' });
  const { errors } = summarizeDiagnostics(diagnostics);
  assert.match(errors.join('\n'), /must not contain symbolic links/);
}));
