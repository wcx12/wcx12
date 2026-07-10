import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import MarkdownIt from 'markdown-it';
import markdownItKatexModule from 'markdown-it-katex';
import { loadPosts, summarizeDiagnostics } from './blog-content.mjs';

const markdownItKatex = typeof markdownItKatexModule === 'function'
  ? markdownItKatexModule
  : markdownItKatexModule.default;

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

async function validateFixture(body) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wcx12-content-'));
  try {
    const postsDir = path.join(root, 'content', 'posts');
    await fs.mkdir(postsDir, { recursive: true });
    await fs.writeFile(path.join(postsDir, 'fixture.md'), postSource(body));
    const { diagnostics } = await loadPosts(root, { includeDrafts: true });
    return summarizeDiagnostics(diagnostics);
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
