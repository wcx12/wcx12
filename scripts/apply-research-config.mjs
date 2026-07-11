import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeResearchConfigUpdatePayload } from './research-config-schema.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(rootDir, 'research-config.json');
const encoded = String(process.env.RESEARCH_CONFIG_UPDATE_BASE64 || '').trim();

if (!encoded || encoded.length > 128 * 1024 || !/^[a-z0-9+/]+={0,2}$/i.test(encoded)) {
  throw new Error('RESEARCH_CONFIG_UPDATE_BASE64 is missing or invalid.');
}

const decoded = Buffer.from(encoded, 'base64');
if (decoded.length > 96 * 1024) throw new Error('Decoded research config update exceeds 96 KiB.');
const payload = normalizeResearchConfigUpdatePayload(JSON.parse(decoded.toString('utf8').replace(/^\uFEFF/, '')));
const expectedHash = payload.expected_sha256;
const submitted = payload.config;
const submittedSource = `${JSON.stringify(submitted, null, 2)}\n`;
if (Buffer.byteLength(submittedSource, 'utf8') > 64 * 1024) throw new Error('Research config exceeds 64 KiB.');
const currentSource = await fs.readFile(configPath, 'utf8');
const currentHash = createHash('sha256').update(currentSource).digest('hex');
if (currentHash !== expectedHash) {
  throw new Error(`Research config changed after editing began (expected ${expectedHash}, found ${currentHash}). Reload before saving.`);
}

await fs.writeFile(configPath, submittedSource);
console.log('Validated research-config.json update.');
