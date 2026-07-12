import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteDate } from './blog-content.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRootDir = path.resolve(path.dirname(scriptPath), '..');

export function postSlugify(value) {
  const source = String(value || '').trim();
  const base = source
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 10);
  if (!base) return `post-${hash}`;
  if (/[^\x00-\x7f]/.test(source)) return `${base.slice(0, 68).replace(/-+$/g, '')}-${hash}`;
  return base.slice(0, 80).replace(/-+$/g, '');
}

export function renderPostTemplate({ title, slug, date }) {
  const quoted = (value) => JSON.stringify(String(value));
  return `---
title: ${quoted(title)}
slug: ${quoted(slug)}
date: ${quoted(date)}
updated: ${quoted(date)}
description: ""
category: "Research Notes"
tags: ["notes"]
research: []
series: ""
featured: false
draft: true
math: false
toc: true
lang: "en"
socialImage: ""
socialImageAlt: ""
---

Write the opening summary here.

## Notes

- Replace this draft with the actual article.
`;
}

export async function createPostDraft(titleValue, options = {}) {
  const title = String(titleValue || '').trim();
  if (!title) throw new TypeError('Post title must not be empty.');
  const rootDir = path.resolve(options.rootDir || defaultRootDir);
  const date = options.date || siteDate();
  const slug = postSlugify(title);
  const bundlePath = path.join(rootDir, 'content', 'posts', `${date}-${slug}`);
  const filePath = path.join(bundlePath, 'index.md');
  const template = renderPostTemplate({ title, slug, date });

  await fs.mkdir(bundlePath, { recursive: true });
  await fs.writeFile(filePath, template, { flag: 'wx' });
  await fs.mkdir(path.join(bundlePath, 'media'), { recursive: true });
  return { filePath, rootDir, slug };
}

if (path.resolve(process.argv[1] || '') === scriptPath) {
  const title = process.argv.slice(2).join(' ').trim();
  if (!title) {
    console.error('Usage: npm run new:post "Post Title"');
    process.exitCode = 1;
  } else {
    const { filePath, rootDir } = await createPostDraft(title);
    console.log(path.relative(rootDir, filePath).replace(/\\/g, '/'));
  }
}
