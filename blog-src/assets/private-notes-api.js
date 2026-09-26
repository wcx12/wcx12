export const OWNER = 'wcx12';
export const PRIVATE_REPO = 'wcx12-private-notes';
export const PUBLIC_REPO = 'wcx12';
export const MAX_NOTE_BYTES = 220 * 1024;
export const CATEGORIES = Object.freeze([
  'Computer Vision', 'Point Cloud', 'Large Models',
  'AI for Education', 'Engineering', 'Research Notes'
]);

const API = 'https://api.github.com';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const PUBLIC_PATH = /^content\/posts\/[a-z0-9]+(?:-[a-z0-9]+)*\/index\.md$/;
const NOTE_FIELDS = [
  'version', 'id', 'slug', 'title', 'description', 'lang', 'category',
  'tags', 'research', 'date', 'updated', 'status', 'body'
];
const META_FIELDS = [
  'translationKey', 'translations', 'series', 'featured', 'math', 'toc',
  'socialImage', 'socialImageAlt'
];
const MESSAGES = Object.freeze({
  AUTH: 'GitHub authentication failed.',
  FORBIDDEN: 'GitHub access is not permitted.',
  NOT_FOUND: 'The requested GitHub resource is unavailable.',
  CONFLICT: 'The file changed or already exists. Reload before retrying.',
  NETWORK: 'The GitHub request could not be completed.',
  API: 'GitHub could not complete the request.',
  PRIVACY: 'The repository does not have the required visibility.',
  REPOSITORY: 'The repository identity or state is not permitted.',
  NOT_CONNECTED: 'Connect before accessing notes.',
  DISPOSED: 'This notes session has been closed.',
  INVALID_NOTE: 'The note does not match the supported schema.',
  INVALID_PATH: 'The requested note path is not permitted.',
  INVALID_SHA: 'An explicit valid file SHA or permitted null is required.',
  INVALID_RESPONSE: 'GitHub returned an unsupported response.',
  TOO_LARGE: 'Note content exceeds the 220 KiB limit.',
  CONFIRMATION_REQUIRED: 'Explicit confirmation is required for public changes.',
  PUBLIC_CONTENT_REQUIRED: 'Publishing requires a title, description, body, and tag.',
  INVALID_HEADINGS: 'Public article headings must start at level two.',
  IMAGES_UNSUPPORTED: 'Publishing new note images is not supported.'
});

export class PrivateNotesError extends Error {
  constructor(code, status) {
    super(MESSAGES[code] || MESSAGES.API);
    this.name = 'PrivateNotesError';
    this.code = Object.hasOwn(MESSAGES, code) ? code : 'API';
    if (Number.isInteger(status)) this.status = status;
  }
}

function fail(code, status) { throw new PrivateNotesError(code, status); }
function matches(pattern, value) { return typeof value === 'string' && pattern.test(value); }
function checkSize(source) {
  if (new TextEncoder().encode(source).byteLength > MAX_NOTE_BYTES) fail('TOO_LARGE');
}
function isRecord(value) {
  return value !== null && typeof value === 'object'
    && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
function checkRecord(value, allowed, required = []) {
  if (!isRecord(value) || Reflect.ownKeys(value).some((key) =>
    !allowed.includes(key) || !Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value')
  ) || required.some((key) => !Object.hasOwn(value, key))) fail('INVALID_NOTE');
}
function validDate(value) {
  if (!matches(/^\d{4}-\d{2}-\d{2}$/, value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function stringList(value) {
  if (!Array.isArray(value) || value.length > MAX_NOTE_BYTES) fail('INVALID_NOTE');
  const copy = [];
  for (const item of value) {
    if (!matches(SLUG, item)) fail('INVALID_NOTE');
    copy.push(item);
  }
  return copy;
}
function publicMeta(value) {
  checkRecord(value, META_FIELDS);
  const result = {};
  for (const key of META_FIELDS) {
    if (!Object.hasOwn(value, key)) continue;
    const item = value[key];
    if (['featured', 'math', 'toc'].includes(key)) {
      if (typeof item !== 'boolean') fail('INVALID_NOTE');
    } else if (key === 'translations') {
      checkRecord(item, ['en', 'zh']);
      result.translations = {};
      for (const language of Object.keys(item)) {
        if (!matches(SLUG, item[language])) fail('INVALID_NOTE');
        result.translations[language] = item[language];
      }
      continue;
    } else if (typeof item !== 'string') fail('INVALID_NOTE');
    if (key === 'socialImage' && item !== '' && !matches(
      /^media\/(?:[a-zA-Z0-9][a-zA-Z0-9_-]*\/)*[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g|gif|webp|avif)$/,
      item
    )) fail('INVALID_NOTE');
    result[key] = item;
  }
  return result;
}

// Returns a detached schema-only snapshot; callers cannot change a pending write.
export function validateNote(value) {
  checkRecord(value, [...NOTE_FIELDS, 'publicPath', 'publicMeta'], NOTE_FIELDS);
  if (value.version !== 1 || !matches(UUID, value.id) || !matches(SLUG, value.slug)
    || !['en', 'zh'].includes(value.lang) || !CATEGORIES.includes(value.category)
    || !['draft', 'complete'].includes(value.status)
    || !validDate(value.date) || !validDate(value.updated) || value.updated < value.date
    || ['title', 'description', 'body'].some((key) => typeof value[key] !== 'string')) {
    fail('INVALID_NOTE');
  }
  const note = Object.fromEntries(NOTE_FIELDS.map((key) => [key, value[key]]));
  note.tags = stringList(value.tags);
  note.research = stringList(value.research);
  if (Object.hasOwn(value, 'publicPath')) {
    if (!matches(PUBLIC_PATH, value.publicPath)) fail('INVALID_PATH');
    note.publicPath = value.publicPath;
  }
  if (Object.hasOwn(value, 'publicMeta')) note.publicMeta = publicMeta(value.publicMeta);
  checkSize(JSON.stringify(note));
  return note;
}

function hasImages(note) {
  // Conservative until media upload exists; even image syntax in code needs review.
  return /!\s*\[|<\s*(?:img|picture|source|svg|image|video|object|embed)\b/i.test(note.body)
    || Boolean(note.publicMeta?.socialImage);
}
function yamlValue(value) {
  // YAML 1.1 treats these otherwise-valid JSON characters as line breaks/controls.
  return JSON.stringify(value).replace(/[\u007f-\u009f\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function hasLevelOneHeading(body) {
  // Use the site's Markdown engine when present. Without it, fail closed on
  // ambiguous syntax, including headings inside code examples, rather than parse Markdown.
  if (typeof globalThis.markdownit === 'function') {
    try {
      return globalThis.markdownit({ html: false }).parse(body, {}).some(
        (token) => token.type === 'heading_open' && token.tag === 'h1'
      );
    } catch { fail('INVALID_NOTE'); }
  }
  return /^(?:[ \t\uFEFF]*(?:>[ \t]*|(?:[-+*]|\d+[.)])[ \t]+))*[ \t\uFEFF]*(?:#(?:[ \t]|$)|=+[ \t]*$)/m
    .test(body.replace(/\r\n?/g, '\n'));
}

export function toPublicMarkdown(value) {
  const note = validateNote(value);
  if (!note.title.trim() || !note.description.trim() || !note.body.trim() || !note.tags.length) {
    fail('PUBLIC_CONTENT_REQUIRED');
  }
  if (hasLevelOneHeading(note.body)) fail('INVALID_HEADINGS');
  if (!note.publicPath && hasImages(note)) fail('IMAGES_UNSUPPORTED');
  if (note.publicMeta?.socialImage && !note.publicMeta.socialImageAlt?.trim()) fail('INVALID_NOTE');
  const metadata = {
    title: note.title, slug: note.slug, date: note.date, updated: note.updated,
    description: note.description, lang: note.lang, category: note.category,
    tags: note.tags, research: note.research, featured: false, math: true, toc: true,
    ...note.publicMeta, draft: false, visibility: 'public'
  };
  const source = `---\n${Object.entries(metadata).map(([key, item]) =>
    `${key}: ${yamlValue(item)}`).join('\n')}\n---\n\n${note.body}\n`;
  checkSize(source);
  return source;
}

function encodeContent(source) {
  const bytes = new TextEncoder().encode(source);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}
function decodeContent(data, path) {
  if (data?.type !== 'file' || data.path !== path || data.encoding !== 'base64'
    || data.target || data.submodule_git_url || !matches(SHA, data.sha)
    || typeof data.content !== 'string' || !Number.isSafeInteger(data.size) || data.size < 0) {
    fail('INVALID_RESPONSE');
  }
  if (data.size > MAX_NOTE_BYTES || data.content.length > MAX_NOTE_BYTES * 2) fail('TOO_LARGE');
  let binary;
  let source;
  try {
    binary = atob(data.content.replace(/[\r\n]/g, ''));
    source = new TextDecoder('utf-8', { fatal: true }).decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0))
    );
  } catch { fail('INVALID_RESPONSE'); }
  if (binary.length > MAX_NOTE_BYTES) fail('TOO_LARGE');
  if (binary.length !== data.size) fail('INVALID_RESPONSE');
  return { source, sha: data.sha };
}
function notePath(note) { return note.publicPath || `content/posts/${note.slug}/index.md`; }
function expectedSha(value, allowNull = false) {
  if (!(allowNull && value === null) && !matches(SHA, value)) fail('INVALID_SHA');
}
function contentsPath(repo, path, branch) {
  const base = `/repos/${OWNER}/${repo}/contents/${path}`;
  return branch === undefined ? base : `${base}?ref=${encodeURIComponent(branch)}`;
}
function commitResult(data) {
  if (!matches(SHA, data?.commit?.sha)) fail('INVALID_RESPONSE');
  const sha = data.commit.sha;
  return { sha, url: `https://github.com/${OWNER}/${PUBLIC_REPO}/commit/${sha}` };
}

export class PrivateNotesClient {
  #token;
  #fetchImpl;
  #controller = new AbortController();
  #generation = 0;
  #disposed = false;
  #connected = false;

  constructor(token, { fetchImpl = (...args) => fetch(...args) } = {}) {
    if (typeof token !== 'string' || !token.length || /[^\x21-\x7e]/.test(token)) fail('AUTH');
    if (typeof fetchImpl !== 'function') fail('NETWORK');
    this.#token = token;
    this.#fetchImpl = fetchImpl;
  }

  dispose() {
    this.#token = '';
    this.#fetchImpl = null;
    this.#connected = false;
    this.#disposed = true;
    this.#generation += 1;
    this.#controller.abort();
  }

  #active(generation) {
    if (this.#disposed || generation !== this.#generation) fail('DISPOSED');
  }

  #session() {
    this.#active(this.#generation);
    if (!this.#connected) fail('NOT_CONNECTED');
    return this.#generation;
  }

  async #request(path, generation, { method = 'GET', body } = {}) {
    this.#active(generation);
    let response;
    try {
      response = await this.#fetchImpl(`${API}${path}`, {
        method, credentials: 'omit', redirect: 'error', cache: 'no-store',
        referrerPolicy: 'no-referrer', signal: this.#controller.signal,
        headers: {
          Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.#token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
    } catch {
      this.#active(generation);
      fail('NETWORK');
    }
    this.#active(generation);
    if (response.redirected || (response.url && response.url !== `${API}${path}`)) fail('NETWORK');
    if (!response.ok) {
      const status = response.status;
      const code = status === 401 ? 'AUTH' : [403, 429].includes(status) ? 'FORBIDDEN'
        : status === 404 ? 'NOT_FOUND' : [409, 412].includes(status)
          || (method !== 'GET' && status === 422) ? 'CONFLICT' : 'API';
      // Never read error bodies, status text, or propagate fetch exceptions/cause.
      fail(code, status);
    }
    let data;
    try { data = await response.json(); } catch {
      this.#active(generation);
      fail('INVALID_RESPONSE');
    }
    this.#active(generation);
    return data;
  }

  async #repository(repo, generation, write = false) {
    const data = await this.#request(`/repos/${OWNER}/${repo}`, generation);
    this.#active(generation);
    if (data?.name !== repo || data.owner?.login !== OWNER || data.archived !== false
      || data.disabled === true) fail('REPOSITORY');
    if (data.private !== (repo === PRIVATE_REPO)) fail('PRIVACY');
    if ((write || repo === PRIVATE_REPO) && data.permissions?.push !== true) fail('FORBIDDEN');
    if (typeof data.default_branch !== 'string' || !data.default_branch.length
      || data.default_branch.length > 255 || /[\x00-\x20\x7f-\x9f\ud800-\udfff]/.test(data.default_branch)) {
      fail('REPOSITORY');
    }
    return data.default_branch;
  }

  async connect() {
    const generation = this.#generation;
    this.#active(generation);
    this.#connected = false;
    const user = await this.#request('/user', generation);
    if (user?.login !== OWNER) fail('FORBIDDEN');
    const defaultBranch = await this.#repository(PRIVATE_REPO, generation);
    this.#active(generation);
    this.#connected = true;
    return { login: OWNER, defaultBranch };
  }

  async listNotes() {
    const generation = this.#session();
    const branch = await this.#repository(PRIVATE_REPO, generation);
    let entries;
    try {
      entries = await this.#request(contentsPath(PRIVATE_REPO, 'notes', branch), generation);
    } catch (error) {
      this.#active(generation);
      if (error.code === 'NOT_FOUND') return [];
      throw error;
    }
    this.#active(generation);
    if (!Array.isArray(entries)) fail('INVALID_RESPONSE');
    return entries.filter((entry) => entry?.type === 'file' && !entry.target && !entry.submodule_git_url
      && matches(/^[a-f0-9-]{36}\.json$/, entry.name) && matches(UUID, entry.name.slice(0, -5))
      && entry.path === `notes/${entry.name}` && matches(SHA, entry.sha))
      .map(({ name, sha }) => ({ id: name.slice(0, -5), name, sha }));
  }

  async getNote(id) {
    const generation = this.#session();
    if (!matches(UUID, id)) fail('INVALID_PATH');
    const branch = await this.#repository(PRIVATE_REPO, generation);
    const path = `notes/${id}.json`;
    const data = await this.#request(contentsPath(PRIVATE_REPO, path, branch), generation);
    this.#active(generation);
    const { source, sha } = decodeContent(data, path);
    let parsed;
    try { parsed = JSON.parse(source); } catch { fail('INVALID_NOTE'); }
    const note = validateNote(parsed);
    if (note.id !== id) fail('INVALID_NOTE');
    return { note, sha };
  }

  async saveNote(value, sha) {
    const generation = this.#session();
    const note = validateNote(value);
    if (sha !== undefined && sha !== null) expectedSha(sha);
    const content = encodeContent(JSON.stringify(note));
    // Recheck privacy immediately before each private write, not only at login.
    const branch = await this.#repository(PRIVATE_REPO, generation, true);
    const data = await this.#request(contentsPath(PRIVATE_REPO, `notes/${note.id}.json`), generation, {
      method: 'PUT', body: {
        message: 'Save private note', content, branch,
        ...(sha === undefined || sha === null ? {} : { sha })
      }
    });
    this.#active(generation);
    if (!matches(SHA, data?.content?.sha)) fail('INVALID_RESPONSE');
    return { note, sha: data.content.sha };
  }

  async #publicBranch(generation, write = false) {
    await this.#repository(PRIVATE_REPO, generation);
    return this.#repository(PUBLIC_REPO, generation, write);
  }

  async #publicSource(path, branch, generation, allowMissing = false) {
    let data;
    try {
      data = await this.#request(contentsPath(PUBLIC_REPO, path, branch), generation);
    } catch (error) {
      this.#active(generation);
      if (allowMissing && error.code === 'NOT_FOUND') return null;
      throw error;
    }
    this.#active(generation);
    return decodeContent(data, path);
  }

  async listPublicSources() {
    const generation = this.#session();
    const branch = await this.#publicBranch(generation);
    const entries = await this.#request(contentsPath(PUBLIC_REPO, 'content/posts', branch), generation);
    this.#active(generation);
    if (!Array.isArray(entries)) fail('INVALID_RESPONSE');
    return entries.filter((entry) => entry?.type === 'dir' && matches(SLUG, entry.name)
      && entry.path === `content/posts/${entry.name}` && !entry.target && !entry.submodule_git_url)
      .map(({ name, path }) => ({ path: `${path}/index.md`, name }));
  }

  async readPublicSource(path) {
    const generation = this.#session();
    if (!matches(PUBLIC_PATH, path)) fail('INVALID_PATH');
    const branch = await this.#publicBranch(generation);
    return this.#publicSource(path, branch, generation);
  }

  async getPublicState(value) {
    const generation = this.#session();
    const note = validateNote(value);
    const branch = await this.#publicBranch(generation);
    return this.#publicSource(notePath(note), branch, generation, true);
  }

  async #publicWrite(note, expected, generation, method, source) {
    const branch = await this.#publicBranch(generation, true);
    const path = notePath(note);
    const current = await this.#publicSource(path, branch, generation, true);
    if ((current?.sha ?? null) !== expected) fail('CONFLICT');
    // A changed default branch invalidates the caller's comparison as well.
    const verifiedBranch = await this.#repository(PUBLIC_REPO, generation, true);
    if (verifiedBranch !== branch) fail('CONFLICT');
    const data = await this.#request(contentsPath(PUBLIC_REPO, path), generation, {
      method, body: {
        message: method === 'DELETE' ? 'Withdraw public note' : 'Publish note', branch,
        ...(expected === null ? {} : { sha: expected }),
        ...(method === 'DELETE' ? {} : { content: encodeContent(source) })
      }
    });
    this.#active(generation);
    return commitResult(data);
  }

  async publishNote(value, expectedPublicSha, confirmed = false) {
    const generation = this.#session();
    if (confirmed !== true) fail('CONFIRMATION_REQUIRED');
    expectedSha(expectedPublicSha, true);
    const note = validateNote(value);
    const source = toPublicMarkdown(note);
    if (expectedPublicSha === null && hasImages(note)) fail('IMAGES_UNSUPPORTED');
    return this.#publicWrite(note, expectedPublicSha, generation, 'PUT', source);
  }

  async withdrawNote(value, expectedPublicSha, confirmed = false) {
    const generation = this.#session();
    if (confirmed !== true) fail('CONFIRMATION_REQUIRED');
    expectedSha(expectedPublicSha);
    const note = validateNote(value);
    return this.#publicWrite(note, expectedPublicSha, generation, 'DELETE');
  }
}
