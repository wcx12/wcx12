import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

const validationMarkdown = new MarkdownIt({ html: false });
const SAFE_MEDIA_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif']);

export const SITE = {
  title: 'Research Fieldnotes',
  description: 'A growing research and engineering notebook by Chenxu Wang (wcx12), with reproducible workflows and fieldnotes from ongoing work.',
  author: 'Chenxu Wang',
  copyrightYear: 2026,
  lang: 'en',
  url: (process.env.SITE_URL || 'https://wcx12.github.io/wcx12').replace(/\/$/, '')
};

export const SITE_TIME_ZONE = process.env.SITE_TIME_ZONE || 'Asia/Shanghai';

const FALLBACK_RESEARCH_IDS = new Set([
  'point-cloud-registration',
  'vpr',
  'medical-image-analysis',
  'agent',
  'ai4edu'
]);

export const VALID_CATEGORIES = new Set([
  'Computer Vision',
  'Point Cloud',
  'Large Models',
  'AI for Education',
  'Engineering',
  'Research Notes'
]);

export function slugify(value) {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'untitled';
}

export function formatDate(value, locale = 'en-US') {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function siteDate(value = new Date(), timeZone = SITE_TIME_ZONE) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('siteDate requires a valid date value');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function publicationState(data, today = siteDate()) {
  if (data.draft === true) return 'draft';
  return String(data.date || '') > today ? 'scheduled' : 'published';
}

export function estimateReadingMinutes(markdown) {
  const words = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function excerptText(markdown, maxLength = 180) {
  const text = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]+\)/g, (match) => match.slice(1, match.indexOf(']')))
    .replace(/[#>*_`~|[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;
}

async function walkPostSources(dir, isRoot = false) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  entries.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
  const bundleIndex = !isRoot && entries.find((entry) => entry.isFile() && entry.name === 'index.md');
  if (bundleIndex) return [path.join(dir, bundleIndex.name)];
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkPostSources(absolute));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolute);
    }
  }
  return files;
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function validateDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function contentUsesMath(content) {
  const textUsesMath = (value) => {
    const text = String(value || '').replace(/\\\$/g, '');
    return /\$\$[\s\S]*?\$\$/.test(text)
      || /(^|[^$])\$(?![$\s])[^$\n]*\S\$(?!\$)/.test(text);
  };
  return validationMarkdown.parse(content, {}).some((token) => token.type === 'inline'
    && token.children?.some((child) => child.type === 'text' && textUsesMath(child.content)));
}

function markdownResourceReferences(content) {
  const references = [];
  for (const token of validationMarkdown.parse(content, {})) {
    if (token.type !== 'inline' || !token.children) continue;
    for (const child of token.children) {
      if (child.type === 'image') {
        references.push({ kind: 'image', url: child.attrGet('src') || '', alt: child.content || '' });
      } else if (child.type === 'link_open') {
        references.push({ kind: 'link', url: child.attrGet('href') || '', alt: '' });
      }
    }
  }
  return references;
}

function mediaReference(value, kind) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (kind === 'image' && /^(?:https?:|data:|\/)/i.test(raw)) {
    return { error: `images must be bundled inside the article media/ directory: "${raw}"` };
  }
  if (/^(?:https?:|mailto:|tel:|data:|#|\/)/i.test(raw)) return null;
  const pathPart = raw.split(/[?#]/, 1)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(pathPart);
  } catch {
    return { error: `invalid URL encoding in media reference "${raw}"` };
  }
  if (decoded.includes('\\')) return { error: `media reference must use forward slashes: "${raw}"` };
  const normalized = decoded.replace(/^\.\//, '');
  if (!normalized.startsWith('media/')) {
    return kind === 'image' ? { error: `local images must use the article media/ directory: "${raw}"` } : null;
  }
  const relativePath = normalized.slice('media/'.length);
  const segments = relativePath.split('/');
  if (!relativePath
    || segments.some((segment) => !segment || segment === '.' || segment === '..')
    || !/^[a-z0-9][a-z0-9._/-]*$/.test(relativePath)) {
    return { error: `invalid media path "${raw}"; use lowercase portable names inside media/` };
  }
  const extension = path.extname(relativePath);
  if (!SAFE_MEDIA_EXTENSIONS.has(extension)) {
    return { error: `unsupported media type "${extension || '(none)'}" in "${raw}"; use PNG, JPEG, GIF, WebP, or AVIF` };
  }
  return { relativePath, publicPath: `media/${relativePath}`, extension };
}

function mediaSignatureMatches(content, extension) {
  const startsWith = (...bytes) => bytes.every((byte, index) => content[index] === byte);
  if (extension === '.png') return content.length >= 8 && startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (extension === '.jpg' || extension === '.jpeg') return content.length >= 3 && startsWith(0xff, 0xd8, 0xff);
  if (extension === '.gif') {
    const header = content.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }
  if (extension === '.webp') {
    return content.length >= 12
      && content.subarray(0, 4).toString('ascii') === 'RIFF'
      && content.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  if (extension === '.avif') {
    return content.length >= 16
      && content.subarray(4, 8).toString('ascii') === 'ftyp'
      && /avi[fs]/.test(content.subarray(8, Math.min(content.length, 40)).toString('ascii'));
  }
  return false;
}

async function inspectMediaPath(root, relativePath) {
  const rootStats = await fs.lstat(root).catch(() => null);
  if (!rootStats) return { error: 'missing-or-case' };
  if (rootStats.isSymbolicLink()) return { error: 'symlink' };
  if (!rootStats.isDirectory()) return { error: 'not-file' };

  let current = root;
  const segments = relativePath.split('/');
  for (const [index, segment] of segments.entries()) {
    const names = await fs.readdir(current).catch(() => []);
    if (!names.includes(segment)) return { error: 'missing-or-case' };
    current = path.join(current, segment);
    const stats = await fs.lstat(current).catch(() => null);
    if (!stats) return { error: 'missing-or-case' };
    if (stats.isSymbolicLink()) return { error: 'symlink' };
    if (index < segments.length - 1 && !stats.isDirectory()) return { error: 'not-file' };
    if (index === segments.length - 1 && !stats.isFile()) return { error: 'not-file' };
  }
  return { stats: await fs.lstat(current) };
}

async function validatePostMedia(post, errors, warnings) {
  const references = markdownResourceReferences(post.content);
  if (post.data.socialImage) {
    references.push({
      kind: 'image',
      url: post.data.socialImage,
      alt: post.data.socialImageAlt || ''
    });
  }
  const mediaByPath = new Map();
  for (const reference of references) {
    if (reference.kind === 'image' && !reference.alt.trim()) {
      (post.data.draft ? warnings : errors).push(`image "${reference.url}" must include alt text`);
    }
    const parsed = mediaReference(reference.url, reference.kind);
    if (parsed?.error) {
      errors.push(parsed.error);
      continue;
    }
    if (!parsed) continue;
    if (!post.bundleRoot) {
      errors.push(`local media requires a bundled post with index.md: "${reference.url}"`);
      continue;
    }
    if (!mediaByPath.has(parsed.relativePath)) mediaByPath.set(parsed.relativePath, parsed);
  }

  const mediaRoot = post.bundleRoot ? path.join(post.bundleRoot, 'media') : '';
  const mediaFiles = [];
  for (const parsed of mediaByPath.values()) {
    const sourcePath = path.resolve(mediaRoot, parsed.relativePath);
    const relativeToRoot = path.relative(mediaRoot, sourcePath);
    if (!relativeToRoot || relativeToRoot === '..' || relativeToRoot.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToRoot)) {
      errors.push(`media path escapes its article bundle: "${parsed.publicPath}"`);
      continue;
    }
    const inspected = await inspectMediaPath(mediaRoot, parsed.relativePath);
    if (inspected.error === 'missing-or-case') {
      errors.push(`media path does not exist with exact casing: "${parsed.publicPath}"`);
      continue;
    }
    if (inspected.error === 'symlink') {
      errors.push(`media path must not contain symbolic links: "${parsed.publicPath}"`);
      continue;
    }
    if (inspected.error === 'not-file') {
      errors.push(`media reference must point to a regular file: "${parsed.publicPath}"`);
      continue;
    }
    const stats = inspected.stats;
    if (stats.size > 10 * 1024 * 1024) {
      errors.push(`media file exceeds 10 MB: "${parsed.publicPath}"`);
      continue;
    }
    const content = await fs.readFile(sourcePath);
    if (!mediaSignatureMatches(content, parsed.extension)) {
      errors.push(`media file content does not match its ${parsed.extension} extension: "${parsed.publicPath}"`);
      continue;
    }
    mediaFiles.push({
      ...parsed,
      sourcePath,
      bytes: stats.size,
      version: createHash('sha256').update(content).digest('hex').slice(0, 12)
    });
  }
  return mediaFiles;
}

async function validatePost(post, seenSlugs, validResearchIds) {
  const errors = [];
  const warnings = [];
  const data = post.data;
  const rawData = post.rawData || data;

  for (const field of ['draft', 'featured', 'math', 'toc']) {
    if (Object.hasOwn(rawData, field) && typeof rawData[field] !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    }
  }

  for (const field of ['title', 'slug', 'date', 'category']) {
    if (!data[field] || typeof data[field] !== 'string') {
      errors.push(`missing string field "${field}"`);
    }
  }
  if (typeof data.description !== 'string') {
    errors.push('missing string field "description"');
  } else if (!data.description.trim()) {
    if (data.draft) warnings.push('draft description is empty');
    else errors.push('published posts must include a description');
  }
  if (Object.hasOwn(rawData, 'socialImage') && typeof data.socialImage !== 'string') {
    errors.push('socialImage must be a string');
  }
  if (Object.hasOwn(rawData, 'socialImageAlt') && typeof data.socialImageAlt !== 'string') {
    errors.push('socialImageAlt must be a string');
  }
  if (data.socialImage && !String(data.socialImageAlt || '').trim()) {
    errors.push('socialImage requires non-empty socialImageAlt text');
  }
  if (!['en', 'zh'].includes(data.lang)) errors.push('lang must be "en" or "zh"');

  if (data.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('slug must use lowercase letters, numbers, and hyphens');
  }
  if (data.slug && seenSlugs.has(data.slug)) {
    errors.push(`duplicate slug "${data.slug}"`);
  }
  if (data.slug) seenSlugs.add(data.slug);

  if (!validateDate(data.date)) errors.push('date must be YYYY-MM-DD');
  if (data.updated && !validateDate(data.updated)) errors.push('updated must be YYYY-MM-DD');
  if (data.updated && data.date && data.updated < data.date) {
    errors.push('updated date cannot be earlier than date');
  }

  if (!VALID_CATEGORIES.has(data.category)) {
    warnings.push(`category "${data.category}" is not in the recommended category list`);
  }

  const tags = asArray(data.tags);
  if (!tags.length) errors.push('tags must contain at least one tag');
  tags.forEach((tag) => {
    if (typeof tag !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) {
      errors.push(`invalid tag "${tag}"; use lowercase slug-style tags`);
    }
  });

  asArray(data.research).forEach((id) => {
    if (!validResearchIds.has(id)) errors.push(`research id "${id}" is not configured in research-config.json`);
  });

  if (!post.content.trim()) errors.push('post body is empty');
  if (!data.math && contentUsesMath(post.content)) {
    errors.push('math content requires front matter "math: true"');
  }
  const hasLevelOneHeading = validationMarkdown
    .parse(post.content, {})
    .some((token) => token.type === 'heading_open' && token.tag === 'h1');
  if (hasLevelOneHeading) {
    errors.push('post body must start at heading level 2; the template already provides the h1');
  }
  if (post.content.includes('\t')) warnings.push('contains tab characters');

  const mediaFiles = await validatePostMedia(post, errors, warnings);

  return { errors, warnings, mediaFiles };
}

export async function loadPosts(rootDir, options = {}) {
  const postsDir = path.join(rootDir, 'content', 'posts');
  const files = await walkPostSources(postsDir, true);
  const today = options.today || siteDate(options.now || new Date());
  if (!validateDate(today)) throw new TypeError('loadPosts option "today" must be YYYY-MM-DD');
  const seenSlugs = new Set();
  const diagnostics = [];
  const posts = [];
  const publicationCounts = { published: 0, scheduled: 0, draft: 0 };
  let validResearchIds = options.validResearchIds ? new Set(options.validResearchIds) : null;
  if (!validResearchIds) {
    try {
      const config = JSON.parse(await fs.readFile(path.join(rootDir, 'research-config.json'), 'utf8'));
      validResearchIds = new Set((config.interests || []).flatMap((domain) => (
        Array.isArray(domain.children) ? domain.children.map((child) => String(child.id || '')) : []
      )).filter(Boolean));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      validResearchIds = new Set(FALLBACK_RESEARCH_IDS);
    }
  }

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = matter(raw);
    const data = {
      ...parsed.data,
      tags: asArray(parsed.data.tags).map((tag) => String(tag)),
      research: asArray(parsed.data.research).map((id) => String(id)),
      draft: parsed.data.draft === true,
      featured: parsed.data.featured === true,
      math: parsed.data.math === true,
      toc: parsed.data.toc !== false,
      lang: String(parsed.data.lang || SITE.lang).toLowerCase()
    };
    const post = {
      sourcePath: file,
      bundleRoot: path.basename(file) === 'index.md' ? path.dirname(file) : null,
      relativePath: path.relative(rootDir, file).replace(/\\/g, '/'),
      rawData: parsed.data,
      data,
      content: parsed.content
    };
    const result = await validatePost(post, seenSlugs, validResearchIds);
    const state = publicationState(data, today);
    publicationCounts[state] += 1;
    diagnostics.push({ file: post.relativePath, errors: result.errors, warnings: result.warnings });
    const include = state === 'published'
      || (state === 'draft' && options.includeDrafts)
      || (state === 'scheduled' && options.includeFuture);
    if (include) {
      posts.push({
        ...post,
        slug: data.slug,
        title: data.title,
        description: data.description || excerptText(parsed.content),
        date: data.date,
        updated: data.updated || data.date,
        category: data.category,
        tags: data.tags,
        research: data.research,
        series: data.series || '',
        featured: data.featured,
        math: data.math,
        lang: data.lang,
        toc: data.toc !== false,
        socialImage: data.socialImage || '',
        socialImageAlt: data.socialImageAlt || '',
        readingMinutes: estimateReadingMinutes(parsed.content),
        draft: data.draft,
        publicationState: state,
        mediaFiles: result.mediaFiles
      });
    }
  }

  posts.sort((a, b) => {
    const dateCompare = a.date === b.date ? 0 : a.date < b.date ? 1 : -1;
    return dateCompare || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
  });

  return { posts, diagnostics, publicationCounts, today };
}

export function summarizeDiagnostics(diagnostics) {
  const errors = [];
  const warnings = [];
  diagnostics.forEach((item) => {
    item.errors.forEach((message) => errors.push(`${item.file}: ${message}`));
    item.warnings.forEach((message) => warnings.push(`${item.file}: ${message}`));
  });
  return { errors, warnings };
}
