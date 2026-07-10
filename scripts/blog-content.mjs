import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export const SITE = {
  title: 'Research Fieldnotes',
  description: 'Research notes by wcx12 on visual perception, point-cloud registration, VPR, LLM agents, and AI for Education.',
  author: 'wcx12',
  lang: 'en',
  url: (process.env.SITE_URL || 'https://wcx12.github.io/wcx12').replace(/\/$/, '')
};

export const VALID_RESEARCH_IDS = new Set([
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
    .replace(/[^a-z0-9]+/g, '-')
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

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkMarkdown(absolute));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolute);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function validateDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function validatePost(post, seenSlugs) {
  const errors = [];
  const warnings = [];
  const data = post.data;

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
    if (!VALID_RESEARCH_IDS.has(id)) warnings.push(`research id "${id}" is not currently configured`);
  });

  if (!post.content.trim()) errors.push('post body is empty');
  if (/!\[\s*]\([^)]+\)/.test(post.content)) warnings.push('image without alt text');
  if (post.content.includes('\t')) warnings.push('contains tab characters');

  return { errors, warnings };
}

export async function loadPosts(rootDir, options = {}) {
  const postsDir = path.join(rootDir, 'content', 'posts');
  const files = await walkMarkdown(postsDir);
  const seenSlugs = new Set();
  const diagnostics = [];
  const posts = [];

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = matter(raw);
    const data = {
      ...parsed.data,
      tags: asArray(parsed.data.tags).map((tag) => String(tag)),
      research: asArray(parsed.data.research).map((id) => String(id)),
      draft: Boolean(parsed.data.draft),
      featured: Boolean(parsed.data.featured),
      math: Boolean(parsed.data.math),
      toc: parsed.data.toc !== false
    };
    const post = {
      sourcePath: file,
      relativePath: path.relative(rootDir, file).replace(/\\/g, '/'),
      data,
      content: parsed.content
    };
    const result = validatePost(post, seenSlugs);
    diagnostics.push({ file: post.relativePath, ...result });
    if (!data.draft || options.includeDrafts) {
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
        toc: data.toc !== false,
        readingMinutes: estimateReadingMinutes(parsed.content)
      });
    }
  }

  posts.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    return dateCompare || a.title.localeCompare(b.title);
  });

  return { posts, diagnostics };
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
