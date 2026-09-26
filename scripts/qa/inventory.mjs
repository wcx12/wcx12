import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadPosts } from '../blog-content.mjs';
import { localRepos, staticPublications } from '../../site-data.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const phase = process.argv[2] || 'baseline';
if (!/^[a-z0-9-]+$/.test(phase)) throw new Error('Invalid phase');
const output = path.join(root, 'output/site-quality-20260926', phase);
await fs.mkdir(output, { recursive: true });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const gh = (...args) => JSON.parse(execFileSync('gh', args, { cwd: root, encoding: 'utf8' }));
async function walk(directory) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(target));
    else if (entry.isFile()) result.push(target);
  }
  return result;
}
const artifact = path.join(root, 'output/pages');
const files = await walk(artifact);
const pages = [];
for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = await fs.readFile(file, 'utf8');
  pages.push({ path: path.relative(artifact, file).replaceAll('\\', '/'), sha256: sha256(html),
    title: html.match(/<title>(.*?)<\/title>/)?.[1], lang: html.match(/<html[^>]*lang="([^"]+)"/)?.[1],
    canonical: html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1],
    fingerprints: [...new Set([...html.matchAll(/[?&]v=([a-f0-9]+)/g)].map(match => match[1]))] });
}
const { posts, publicationCounts } = await loadPosts(root);
const online = await fetch('https://wcx12.github.io/wcx12/', { cache: 'no-store' });
const onlineHtml = await online.text();
await fs.writeFile(path.join(output, 'online-home.html'), onlineHtml);
const sitemap = await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8');
const inventory = {
  capturedAt: new Date().toISOString(), workspace: root, node: process.version, branch: git('branch', '--show-current'),
  commit: git('rev-parse', 'HEAD'), defaultBranchCommit: git('rev-parse', 'origin/main'), remote: git('remote', 'get-url', 'origin'),
  worktree: git('status', '--short'), lockHash: sha256(await fs.readFile(path.join(root, 'package-lock.json'))),
  deployment: gh('run', 'list', '--repo', 'wcx12/wcx12', '--workflow', 'blog-build.yml', '--branch', 'main', '--limit', '3', '--json', 'databaseId,status,conclusion,headSha,url,updatedAt'),
  hosting: gh('api', 'repos/wcx12/wcx12/pages'),
  online: { status: online.status, sha256: sha256(onlineHtml), fingerprints: [...new Set([...onlineHtml.matchAll(/[?&]v=([a-f0-9]+)/g)].map(match => match[1]))],
    exactHomeMatch: onlineHtml === await fs.readFile(path.join(root, 'index.html'), 'utf8') },
  pages, sitemap: [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), publicationCounts,
  articles: posts.map(({ slug, title, lang, translationKey, translations, relativePath, content }) => ({ slug, title, lang, translationKey, translations, source: relativePath, bodyHash: sha256(content) })),
  publications: staticPublications, repositories: localRepos.map(({ name, html_url, fork, description }) => ({ name, html_url, fork, description })),
  resources: await Promise.all(files.map(async file => ({ path: path.relative(artifact, file).replaceAll('\\', '/'), bytes: (await fs.stat(file)).size })))
};
await fs.writeFile(path.join(output, 'inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
console.log(JSON.stringify({ phase, branch: inventory.branch, commit: inventory.commit, pages: pages.length, articles: posts.length,
  online: inventory.online, output }, null, 2));
