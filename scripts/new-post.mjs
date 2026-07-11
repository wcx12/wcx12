import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteDate, slugify } from './blog-content.mjs';

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: npm run new:post "Post Title"');
  process.exit(1);
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const today = siteDate();
const slug = slugify(title);
const bundlePath = path.join(rootDir, 'content', 'posts', `${today}-${slug}`);
const filePath = path.join(bundlePath, 'index.md');

const template = `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
date: "${today}"
updated: "${today}"
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
---

Write the opening summary here.

## Notes

- Replace this draft with the actual article.
`;

await fs.mkdir(path.join(bundlePath, 'media'), { recursive: true });
await fs.writeFile(filePath, template, { flag: 'wx' });
console.log(path.relative(rootDir, filePath).replace(/\\/g, '/'));
