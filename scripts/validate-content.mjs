import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPosts, summarizeDiagnostics } from './blog-content.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { diagnostics } = await loadPosts(rootDir, { includeDrafts: true });
const { errors, warnings } = summarizeDiagnostics(diagnostics);

warnings.forEach((warning) => console.warn(`warning: ${warning}`));

if (errors.length) {
  errors.forEach((error) => console.error(`error: ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Content validation passed with ${warnings.length} warning(s).`);
}
