import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { loadPosts, summarizeDiagnostics } from './blog-content.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const encoded = String(process.env.BLOG_DRAFT_UPDATE_BASE64 || '').trim();
const postPathPattern = /^content\/posts\/([a-z0-9]+(?:-[a-z0-9]+)*)\/index\.md$/;

function normalizeLf(value) {
  return String(value || '').replace(/\r\n?/g, '\n');
}

function sha256(value) {
  return createHash('sha256').update(normalizeLf(value)).digest('hex');
}

function fromBase64Utf8(value) {
  return Buffer.from(String(value || ''), 'base64').toString('utf8').replace(/^\uFEFF/, '');
}

function assertPathInside(parent, target) {
  const relative = path.relative(parent, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to update a file outside ${parent}.`);
  }
}

function decodePayload() {
  if (!encoded) throw new Error('BLOG_DRAFT_UPDATE_BASE64 is required.');
  if (!/^[A-Za-z0-9+/=\s]+$/.test(encoded)) throw new Error('Draft update payload is not valid base64 text.');
  const decoded = Buffer.from(encoded, 'base64');
  if (decoded.length > 256 * 1024) throw new Error('Decoded draft update payload exceeds 256 KiB.');
  const payload = JSON.parse(decoded.toString('utf8').replace(/^\uFEFF/, ''));
  if (payload.version !== 1) throw new Error('Unsupported draft update payload version.');
  return payload;
}

function validatePayload(payload) {
  const relativePath = String(payload.path || '').replace(/\\/g, '/');
  const match = postPathPattern.exec(relativePath);
  if (!match) {
    throw new Error('Draft update path must be content/posts/<slug>/index.md.');
  }
  if (!/^[a-f0-9]{64}$/.test(String(payload.expected_sha256 || ''))) {
    throw new Error('Draft update payload must include expected_sha256.');
  }
  if (!payload.content_base64 || typeof payload.content_base64 !== 'string') {
    throw new Error('Draft update payload must include content_base64.');
  }
  const content = normalizeLf(fromBase64Utf8(payload.content_base64));
  if (Buffer.byteLength(content, 'utf8') > 220 * 1024) {
    throw new Error('Draft content exceeds 220 KiB.');
  }
  if (!content.startsWith('---\n')) {
    throw new Error('Draft content must start with YAML front matter.');
  }
  const parsed = matter(content);
  if (!parsed.content.trim()) throw new Error('Draft body cannot be empty.');
  if (parsed.data.slug !== match[1]) {
    throw new Error(`Front matter slug must remain "${match[1]}".`);
  }
  if (typeof parsed.data.draft !== 'boolean') {
    throw new Error('Front matter draft must be a YAML boolean.');
  }
  return { relativePath, content };
}

const payload = decodePayload();
const { relativePath, content } = validatePayload(payload);
const filePath = path.resolve(rootDir, relativePath);
assertPathInside(path.join(rootDir, 'content', 'posts'), filePath);

const currentSource = normalizeLf(await fs.readFile(filePath, 'utf8'));
const currentHash = sha256(currentSource);
if (currentHash !== payload.expected_sha256) {
  throw new Error(`Draft changed after editing began (expected ${payload.expected_sha256}, found ${currentHash}). Reload Draft Studio before saving.`);
}

await fs.writeFile(filePath, content);

const result = await loadPosts(rootDir, { includeDrafts: true, includeFuture: true });
const { errors, warnings } = summarizeDiagnostics(result.diagnostics);
if (errors.length) {
  await fs.writeFile(filePath, currentSource);
  throw new Error(`Draft validation failed:\n${errors.join('\n')}`);
}
warnings.forEach((warning) => console.warn(warning));
console.log(`Updated blog draft ${relativePath}.`);
