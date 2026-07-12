import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  WORKFLOW_DISPATCH_INPUT_MAX_LENGTH,
  normalizeResearchConfigUpdateInput,
  normalizeResearchConfigUpdatePayload,
  normalizeResearchConfigValue,
  validateResearchConfigValue
} from './research-config-schema.js';

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

test('update payload normalization binds a valid config to its source hash', () => {
  const expectedHash = 'a'.repeat(64);
  const normalized = normalizeResearchConfigUpdatePayload({
    version: 1,
    expected_sha256: expectedHash.toUpperCase(),
    config: { ...clone(currentConfig), untrusted: true }
  });
  assert.equal(normalized.expected_sha256, expectedHash);
  assert.deepEqual(normalized.config, currentConfig);
  assert.throws(
    () => normalizeResearchConfigUpdatePayload({ version: 2, expected_sha256: expectedHash, config: currentConfig }),
    /version 1 object/
  );
  assert.throws(
    () => normalizeResearchConfigUpdatePayload({ version: 1, expected_sha256: 'invalid', config: currentConfig }),
    /lowercase SHA-256/
  );
});

test('workflow input normalization enforces the GitHub dispatch transport limit', () => {
  assert.equal(WORKFLOW_DISPATCH_INPUT_MAX_LENGTH, 65_535);
  assert.equal(normalizeResearchConfigUpdateInput('e30='), 'e30=');
  assert.throws(() => normalizeResearchConfigUpdateInput('not base64'), /valid base64/);
  assert.throws(
    () => normalizeResearchConfigUpdateInput('A'.repeat(WORKFLOW_DISPATCH_INPUT_MAX_LENGTH + 1)),
    /65535 characters/
  );
});
