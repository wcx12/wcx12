import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORCID_ID, localRepos, staticPublications } from '../site-data.js';

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), '..');
const siteDataPath = path.join(rootDir, 'site-data.js');
const DEFAULT_OWNER = 'wcx12';
const API_VERSION = '2022-11-28';

function validHttpUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

function readmeUrl(owner, repo) {
  const branch = String(repo.default_branch || 'main').split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}/${branch}/README.md`;
}

function defaultStage(repo) {
  if (repo.archived) return { en: 'Archived repository', zh: '已归档仓库' };
  if (repo.fork) return { en: 'Upstream fork', zh: '上游分叉' };
  return { en: 'Public repository', zh: '公开仓库' };
}

function defaultEvidence(repo, source) {
  if (repo.archived) {
    return {
      en: 'Automatically synchronized from GitHub; archived and retained as a public record.',
      zh: '由 GitHub 自动同步；仓库已归档，此处仅保留为公开记录。'
    };
  }
  if (repo.fork) {
    const sourceName = source?.full_name || 'an upstream repository';
    return {
      en: `Automatically synchronized fork of ${sourceName}; not claimed as original work.`,
      zh: `自动同步的 ${sourceName} 分叉；不作为原创项目认领。`
    };
  }
  return {
    en: 'Automatically synchronized public repository; maturity and research classification have not yet been curated.',
    zh: '自动同步的公开仓库；项目阶段与研究分类尚未人工整理。'
  };
}

function normalizedSource(value) {
  const fullName = String(value?.full_name || '').trim();
  const htmlUrl = validHttpUrl(value?.html_url);
  return fullName && htmlUrl ? { full_name: fullName, html_url: htmlUrl } : null;
}

export function mergeGitHubRepos(remoteRepos, curatedRepos, options = {}) {
  const owner = options.owner || DEFAULT_OWNER;
  const forkSources = options.forkSources || {};
  const curatedByName = new Map(curatedRepos.map((repo) => [String(repo.name).toLowerCase(), repo]));

  return remoteRepos
    .filter((repo) => repo && typeof repo.name === 'string' && repo.name.trim())
    .map((remote) => {
      const existing = curatedByName.get(remote.name.toLowerCase()) || {};
      const isCurated = Boolean(existing.name);
      const source = remote.fork
        ? normalizedSource(forkSources[remote.name] || existing.source)
        : null;
      const remoteDescription = String(remote.description || '').trim();
      const description = String(existing.description || '').trim()
        || remoteDescription
        || 'Public GitHub repository.';
      const descriptionZh = String(existing.descriptionZh || '').trim();
      const htmlUrl = validHttpUrl(remote.html_url) || `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(remote.name)}`;
      const existingDemo = validHttpUrl(existing.demo_url);
      const pageDemo = !isCurated && remote.has_pages
        ? validHttpUrl(remote.homepage) || `https://${owner}.github.io/${encodeURIComponent(remote.name)}/`
        : '';
      const stage = existing.stage || defaultStage(remote);
      const evidence = existing.evidence || defaultEvidence(remote, source);

      return {
        name: remote.name,
        description,
        ...(descriptionZh ? { descriptionZh } : {}),
        language: remote.language ?? null,
        stargazers_count: Number.isFinite(remote.stargazers_count) ? remote.stargazers_count : 0,
        updated_at: remote.updated_at || existing.updated_at || '',
        default_branch: remote.default_branch || existing.default_branch || 'main',
        html_url: htmlUrl,
        ...(existingDemo || pageDemo ? { demo_url: existingDemo || pageDemo } : {}),
        readme_url: readmeUrl(owner, remote),
        ...(remote.fork ? { fork: true } : {}),
        ...(source ? { source } : {}),
        ...(remote.archived ? { archived: true } : {}),
        stage,
        evidence,
        interests: Array.isArray(existing.interests) ? existing.interests : []
      };
    })
    .sort((left, right) => (
      String(right.updated_at).localeCompare(String(left.updated_at))
      || left.name.localeCompare(right.name)
    ));
}

function serialize(value) {
  return JSON.stringify(value, null, 2)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function renderSiteData({ orcidId, repos, publications }) {
  return `export const ORCID_ID = ${serialize(orcidId)};\n\nexport const localRepos = ${serialize(repos)};\n\nexport const staticPublications = ${serialize(publications)};\n`;
}

async function githubJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'wcx12-portfolio-sync',
      'X-GitHub-Api-Version': API_VERSION,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${response.statusText}`);
  return response.json();
}

async function fetchOwnerRepos(owner, token) {
  const repos = [];
  for (let page = 1; ; page += 1) {
    const batch = await githubJson(
      `https://api.github.com/users/${encodeURIComponent(owner)}/repos?type=owner&sort=updated&per_page=100&page=${page}`,
      token
    );
    if (!Array.isArray(batch)) throw new TypeError('GitHub repository response must be an array');
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  if (!repos.length) throw new Error(`GitHub returned no public repositories for ${owner}`);
  return repos;
}

async function resolveForkSources(owner, repos, token) {
  const existingByName = new Map(localRepos.map((repo) => [repo.name.toLowerCase(), repo]));
  const entries = await Promise.all(repos.filter((repo) => repo.fork).map(async (repo) => {
    const existing = normalizedSource(existingByName.get(repo.name.toLowerCase())?.source);
    if (existing) return [repo.name, existing];
    const detail = await githubJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}`, token);
    return [repo.name, normalizedSource(detail.source || detail.parent)];
  }));
  return Object.fromEntries(entries.filter(([, source]) => source));
}

export async function syncGitHubRepos(options = {}) {
  const owner = options.owner || process.env.GITHUB_REPOSITORY_OWNER || DEFAULT_OWNER;
  const token = options.token ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? '';
  const remoteRepos = await fetchOwnerRepos(owner, token);
  const forkSources = await resolveForkSources(owner, remoteRepos, token);
  const repos = mergeGitHubRepos(remoteRepos, localRepos, { owner, forkSources });
  const nextSource = renderSiteData({ orcidId: ORCID_ID, repos, publications: staticPublications });
  const currentSource = await fs.readFile(siteDataPath, 'utf8');
  if (currentSource === nextSource) {
    console.log(`Repository snapshot is current (${repos.length} repositories).`);
    return { changed: false, count: repos.length };
  }
  await fs.writeFile(siteDataPath, nextSource);
  console.log(`Updated repository snapshot (${repos.length} repositories).`);
  return { changed: true, count: repos.length };
}

if (path.resolve(process.argv[1] || '') === scriptPath) {
  await syncGitHubRepos();
}
