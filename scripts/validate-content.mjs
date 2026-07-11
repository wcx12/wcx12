import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPosts, summarizeDiagnostics } from './blog-content.mjs';
import { validateResearchConfigValue } from './research-config-schema.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
