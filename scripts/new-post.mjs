import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from './blog-content.mjs';

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: npm run new:post "Post Title"');
  process.exit(1);
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const today = localDateString();
const slug = slugify(title);
const filePath = path.join(rootDir, 'content', 'posts', `${today}-${slug}.md`);

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

await fs.writeFile(filePath, template, { flag: 'wx' });
console.log(path.relative(rootDir, filePath).replace(/\\/g, '/'));
