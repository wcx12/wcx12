import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { normalizeResearchConfigValue, validateResearchConfigValue } from './research-config-schema.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const currentConfig = JSON.parse(await fs.readFile(path.join(rootDir, 'research-config.json'), 'utf8'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('current research configuration passes the shared schema', () => {
  assert.deepEqual(validateResearchConfigValue(currentConfig), []);
  assert.deepEqual(normalizeResearchConfigValue(currentConfig), currentConfig);
});

test('shared schema rejects path traversal and unsupported animations', () => {
  const config = clone(currentConfig);
  config.interests[0].id = '..';
  config.interests[0].children[0].id = '../outside';
  config.interests[0].children[0].animation = 'remote-script';
  const errors = validateResearchConfigValue(config).join('\n');
  assert.match(errors, /interests\[0\]\.id must use lowercase letters/);
  assert.match(errors, /children\[0\]\.id must use lowercase letters/);
  assert.match(errors, /animation must be one of/);
});

test('shared schema rejects unknown and duplicate assignment targets', () => {
  const config = clone(currentConfig);
  config.repoAssignments.FusionTrack = ['point-cloud-registration', 'point-cloud-registration', 'missing-topic'];
  const errors = validateResearchConfigValue(config).join('\n');
  assert.match(errors, /duplicates interest id "point-cloud-registration"/);
  assert.match(errors, /references unknown interest id "missing-topic"/);
});

test('normalization strips unrecognized fields from workflow input', () => {
  const config = clone(currentConfig);
  config.untrusted = '<script>';
  config.interests[0].untrusted = true;
  config.interests[0].children[0].untrusted = true;
  const normalized = normalizeResearchConfigValue(config);
  assert.equal(Object.hasOwn(normalized, 'untrusted'), false);
  assert.equal(Object.hasOwn(normalized.interests[0], 'untrusted'), false);
  assert.equal(Object.hasOwn(normalized.interests[0].children[0], 'untrusted'), false);
});
