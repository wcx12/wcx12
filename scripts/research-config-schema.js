// Shared by the browser and repository update workflow.
export const RESEARCH_CONFIG_VERSION = 2;
export const SUPPORTED_ANIMATIONS = new Set(['point-cloud', 'vpr', 'medical-image', 'agent', 'education']);
export const CONFIG_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const WORKFLOW_DISPATCH_INPUT_MAX_LENGTH = 65_535;

export const RESEARCH_CONFIG_LIMITS = Object.freeze({
  domains: 64,
  childrenPerDomain: 64,
  assignments: 512,
  idsPerAssignment: 64,
  idLength: 80,
  itemNameLength: 300,
  localizedTextLength: 1200
});

export function normalizeResearchConfigUpdateInput(value) {
  const encoded = String(value || '').trim();
  if (!encoded
    || encoded.length > WORKFLOW_DISPATCH_INPUT_MAX_LENGTH
    || encoded.length % 4 !== 0
    || !/^[a-z0-9+/]+={0,2}$/i.test(encoded)) {
    throw new TypeError(`Research config update must be valid base64 and no longer than ${WORKFLOW_DISPATCH_INPUT_MAX_LENGTH} characters.`);
  }
  return encoded;
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function addConfigError(errors, location, message) {
  errors.push(`research-config.json: ${location ? `${location} ` : ''}${message}`);
}

function validateNonEmptyString(value, location, errors, maxLength = RESEARCH_CONFIG_LIMITS.localizedTextLength) {
  if (typeof value !== 'string' || !value.trim()) {
    addConfigError(errors, location, 'must be a non-empty string');
    return false;
  }
  if (value.length > maxLength) {
    addConfigError(errors, location, `must not exceed ${maxLength} characters`);
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

function validateConfigId(value, location, errors) {
  if (!validateNonEmptyString(value, location, errors, RESEARCH_CONFIG_LIMITS.idLength)) return false;
  if (!CONFIG_ID_PATTERN.test(value)) {
    addConfigError(errors, location, 'must use lowercase letters, numbers, and single hyphens');
    return false;
  }
  return true;
}

function validatePlaceholderQuestionMarks(value, location, errors) {
  if (typeof value === 'string') {
    if (value.trim() === '?' || /\?{2,}/.test(value)) addConfigError(errors, location, 'contains placeholder question marks');
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
  const entries = Object.entries(assignments);
  if (entries.length > RESEARCH_CONFIG_LIMITS.assignments) addConfigError(errors, location, `must not exceed ${RESEARCH_CONFIG_LIMITS.assignments} entries`);

  for (const [itemName, ids] of entries) {
    const itemLocation = `${location}[${JSON.stringify(itemName)}]`;
    validateNonEmptyString(itemName, itemLocation, errors, RESEARCH_CONFIG_LIMITS.itemNameLength);
    if (!Array.isArray(ids)) {
      addConfigError(errors, itemLocation, 'must be an array of interest ids');
      continue;
    }
    if (ids.length > RESEARCH_CONFIG_LIMITS.idsPerAssignment) {
      addConfigError(errors, itemLocation, `must not exceed ${RESEARCH_CONFIG_LIMITS.idsPerAssignment} interest ids`);
    }
    const seenIds = new Set();
    ids.forEach((id, index) => {
      const idLocation = `${itemLocation}[${index}]`;
      if (!validateConfigId(id, idLocation, errors)) return;
      if (seenIds.has(id)) addConfigError(errors, idLocation, `duplicates interest id "${id}"`);
      seenIds.add(id);
      if (!interestIds.has(id)) addConfigError(errors, idLocation, `references unknown interest id "${id}"`);
    });
  }
}

export function validateResearchConfigValue(config) {
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
    if (config.interests.length > RESEARCH_CONFIG_LIMITS.domains) addConfigError(errors, 'interests', `must not exceed ${RESEARCH_CONFIG_LIMITS.domains} domains`);
    config.interests.forEach((domain, domainIndex) => {
      const domainLocation = `interests[${domainIndex}]`;
      if (!isPlainObject(domain)) {
        addConfigError(errors, domainLocation, 'must be an object');
        return;
      }
      if (validateConfigId(domain.id, `${domainLocation}.id`, errors)) {
        if (domainIds.has(domain.id)) addConfigError(errors, `${domainLocation}.id`, `duplicates domain id "${domain.id}"`);
        domainIds.add(domain.id);
      }
      validateLocalizedText(domain.title, `${domainLocation}.title`, errors);
      validateLocalizedText(domain.label, `${domainLocation}.label`, errors);
      if (!Array.isArray(domain.children) || !domain.children.length) {
        addConfigError(errors, `${domainLocation}.children`, 'must be a non-empty array');
        return;
      }
      if (domain.children.length > RESEARCH_CONFIG_LIMITS.childrenPerDomain) {
        addConfigError(errors, `${domainLocation}.children`, `must not exceed ${RESEARCH_CONFIG_LIMITS.childrenPerDomain} interests`);
      }
      domain.children.forEach((interest, interestIndex) => {
        const interestLocation = `${domainLocation}.children[${interestIndex}]`;
        if (!isPlainObject(interest)) {
          addConfigError(errors, interestLocation, 'must be an object');
          return;
        }
        if (validateConfigId(interest.id, `${interestLocation}.id`, errors)) {
          if (interestIds.has(interest.id)) addConfigError(errors, `${interestLocation}.id`, `duplicates interest id "${interest.id}"`);
          interestIds.add(interest.id);
        }
        validateLocalizedText(interest.title, `${interestLocation}.title`, errors);
        validateLocalizedText(interest.label, `${interestLocation}.label`, errors);
        validateLocalizedText(interest.description, `${interestLocation}.description`, errors);
        if (validateNonEmptyString(interest.animation, `${interestLocation}.animation`, errors, RESEARCH_CONFIG_LIMITS.idLength)
          && !SUPPORTED_ANIMATIONS.has(interest.animation)) {
          addConfigError(errors, `${interestLocation}.animation`, `must be one of: ${[...SUPPORTED_ANIMATIONS].join(', ')}; received "${interest.animation}"`);
        }
      });
    });
  }

  validateAssignments(config.repoAssignments, 'repoAssignments', interestIds, errors);
  validateAssignments(config.paperAssignments, 'paperAssignments', interestIds, errors);
  validatePlaceholderQuestionMarks(config, '', errors);
  return errors;
}

function cleanLocalizedText(value) {
  return { en: value.en.trim(), zh: value.zh.trim() };
}

function cleanAssignments(assignments) {
  return Object.fromEntries(Object.entries(assignments).map(([name, ids]) => [name.trim(), [...ids]]));
}

export function normalizeResearchConfigValue(config) {
  const errors = validateResearchConfigValue(config);
  if (errors.length) {
    const error = new TypeError(errors.join('\n'));
    error.code = 'INVALID_RESEARCH_CONFIG';
    error.errors = errors;
    throw error;
  }
  return {
    version: RESEARCH_CONFIG_VERSION,
    interests: config.interests.map((domain) => ({
      id: domain.id,
      title: cleanLocalizedText(domain.title),
      label: cleanLocalizedText(domain.label),
      children: domain.children.map((interest) => ({
        id: interest.id,
        title: cleanLocalizedText(interest.title),
        label: cleanLocalizedText(interest.label),
        animation: interest.animation,
        description: cleanLocalizedText(interest.description)
      }))
    })),
    repoAssignments: cleanAssignments(config.repoAssignments),
    paperAssignments: cleanAssignments(config.paperAssignments)
  };
}

export function normalizeResearchConfigUpdatePayload(payload) {
  if (!isPlainObject(payload) || payload.version !== 1) {
    throw new TypeError('Research config update payload must be a version 1 object.');
  }
  const expectedHash = String(payload.expected_sha256 || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) {
    throw new TypeError('expected_sha256 must be a lowercase SHA-256 value.');
  }
  return {
    version: 1,
    expected_sha256: expectedHash,
    config: normalizeResearchConfigValue(payload.config)
  };
}
