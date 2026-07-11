import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeResearchConfigValue } from './research-config-schema.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(rootDir, 'research-config.json');
const encoded = String(process.env.RESEARCH_CONFIG_BASE64 || '').trim();
const expectedHash = String(process.env.EXPECTED_CONFIG_SHA256 || '').trim().toLowerCase();

if (!/^[a-f0-9]{64}$/.test(expectedHash)) throw new Error('EXPECTED_CONFIG_SHA256 must be a lowercase SHA-256 value.');
if (!encoded || encoded.length > 96 * 1024 || !/^[a-z0-9+/]+={0,2}$/i.test(encoded)) {
  throw new Error('RESEARCH_CONFIG_BASE64 is missing or invalid.');
}

const decoded = Buffer.from(encoded, 'base64');
if (decoded.length > 64 * 1024) throw new Error('Decoded research config exceeds 64 KiB.');
const submitted = normalizeResearchConfigValue(JSON.parse(decoded.toString('utf8').replace(/^\uFEFF/, '')));
const currentSource = await fs.readFile(configPath, 'utf8');
const currentHash = createHash('sha256').update(currentSource).digest('hex');
if (currentHash !== expectedHash) {
  throw new Error(`Research config changed after editing began (expected ${expectedHash}, found ${currentHash}). Reload before saving.`);
}

await fs.writeFile(configPath, `${JSON.stringify(submitted, null, 2)}\n`);
console.log('Validated research-config.json update.');
