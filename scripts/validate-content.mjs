import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPosts, summarizeDiagnostics } from './blog-content.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH_CONFIG_VERSION = 2;
const SUPPORTED_ANIMATIONS = new Set(['point-cloud', 'vpr', 'medical-image', 'agent', 'education']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function addConfigError(errors, location, message) {
  errors.push(`research-config.json: ${location ? `${location} ` : ''}${message}`);
}

function validateNonEmptyString(value, location, errors) {
  if (typeof value !== 'string' || !value.trim()) {
    addConfigError(errors, location, 'must be a non-empty string');
    return false;
  }
  return true;
}

function validateLocalizedText(value, location, errors) {
  if (!isPlainObject(value)) {
    addConfigError(errors, location, 'must be an object with non-empty "en" and "zh" strings');
    return;
  }
  validateNonEmptyString(value.en, `${location}.en`, errors);
  validateNonEmptyString(value.zh, `${location}.zh`, errors);
}

function validatePlaceholderQuestionMarks(value, location, errors) {
  if (typeof value === 'string') {
    if (value.trim() === '?' || /\?{2,}/.test(value)) {
      addConfigError(errors, location, 'contains placeholder question marks');
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validatePlaceholderQuestionMarks(item, `${location}[${index}]`, errors));
    return;
  }
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      validatePlaceholderQuestionMarks(item, location ? `${location}.${key}` : key, errors);
    });
  }
}

function validateAssignments(assignments, location, interestIds, errors) {
  if (!isPlainObject(assignments)) {
    addConfigError(errors, location, 'must be an object mapping item names to interest id arrays');
    return;
  }

  for (const [itemName, ids] of Object.entries(assignments)) {
    const itemLocation = `${location}[${JSON.stringify(itemName)}]`;
    if (!itemName.trim()) addConfigError(errors, itemLocation, 'item name must not be empty');
    if (!Array.isArray(ids)) {
      addConfigError(errors, itemLocation, 'must be an array of interest ids');
      continue;
    }

    const seenIds = new Set();
    ids.forEach((id, index) => {
      const idLocation = `${itemLocation}[${index}]`;
      if (!validateNonEmptyString(id, idLocation, errors)) return;
      if (seenIds.has(id)) addConfigError(errors, idLocation, `duplicates interest id "${id}"`);
      seenIds.add(id);
      if (!interestIds.has(id)) addConfigError(errors, idLocation, `references unknown interest id "${id}"`);
    });
  }
}

function validateResearchConfigValue(config) {
  const errors = [];
  if (!isPlainObject(config)) {
    addConfigError(errors, '', 'root must be an object');
    return errors;
  }

  if (!Number.isInteger(config.version) || config.version !== RESEARCH_CONFIG_VERSION) {
    addConfigError(errors, 'version', `must be the integer ${RESEARCH_CONFIG_VERSION}`);
  }

  const domainIds = new Set();
  const interestIds = new Set();
  if (!Array.isArray(config.interests) || !config.interests.length) {
    addConfigError(errors, 'interests', 'must be a non-empty array');
  } else {
    config.interests.forEach((domain, domainIndex) => {
      const domainLocation = `interests[${domainIndex}]`;
      if (!isPlainObject(domain)) {
        addConfigError(errors, domainLocation, 'must be an object');
        return;
      }

      if (validateNonEmptyString(domain.id, `${domainLocation}.id`, errors)) {
        if (domainIds.has(domain.id)) addConfigError(errors, `${domainLocation}.id`, `duplicates domain id "${domain.id}"`);
        domainIds.add(domain.id);
      }
      validateLocalizedText(domain.title, `${domainLocation}.title`, errors);
      validateLocalizedText(domain.label, `${domainLocation}.label`, errors);

      if (!Array.isArray(domain.children) || !domain.children.length) {
        addConfigError(errors, `${domainLocation}.children`, 'must be a non-empty array');
        return;
      }

      domain.children.forEach((interest, interestIndex) => {
        const interestLocation = `${domainLocation}.children[${interestIndex}]`;
        if (!isPlainObject(interest)) {
          addConfigError(errors, interestLocation, 'must be an object');
          return;
        }

        if (validateNonEmptyString(interest.id, `${interestLocation}.id`, errors)) {
          if (interestIds.has(interest.id)) addConfigError(errors, `${interestLocation}.id`, `duplicates interest id "${interest.id}"`);
          interestIds.add(interest.id);
        }
        validateLocalizedText(interest.title, `${interestLocation}.title`, errors);
        validateLocalizedText(interest.label, `${interestLocation}.label`, errors);
        validateLocalizedText(interest.description, `${interestLocation}.description`, errors);
        if (validateNonEmptyString(interest.animation, `${interestLocation}.animation`, errors)
          && !SUPPORTED_ANIMATIONS.has(interest.animation)) {
          addConfigError(
            errors,
            `${interestLocation}.animation`,
            `must be one of: ${[...SUPPORTED_ANIMATIONS].join(', ')}; received "${interest.animation}"`
          );
        }
      });
    });
  }

  validateAssignments(config.repoAssignments, 'repoAssignments', interestIds, errors);
  validateAssignments(config.paperAssignments, 'paperAssignments', interestIds, errors);
  validatePlaceholderQuestionMarks(config, '', errors);
  return errors;
}

async function validateResearchConfig() {
  const configPath = path.join(rootDir, 'research-config.json');
  let source;
  try {
    source = await fs.readFile(configPath, 'utf8');
  } catch (error) {
    return [`research-config.json: cannot be read (${error.message})`];
  }

  try {
    return validateResearchConfigValue(JSON.parse(source));
  } catch (error) {
    return [`research-config.json: invalid JSON (${error.message})`];
  }
}

const [{ diagnostics }, configErrors] = await Promise.all([
  loadPosts(rootDir, { includeDrafts: true }),
  validateResearchConfig()
]);
const { errors: contentErrors, warnings } = summarizeDiagnostics(diagnostics);
const errors = [...contentErrors, ...configErrors];

warnings.forEach((warning) => console.warn(`warning: ${warning}`));

if (errors.length) {
  errors.forEach((error) => console.error(`error: ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Content validation passed with ${warnings.length} warning(s).`);
}
