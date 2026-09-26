import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const [label, command, ...args] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label || '') || !['npm', 'node'].includes(command)) {
  throw new Error('Usage: node scripts/qa/run-command.mjs <label> <npm|node> [...args]');
}
const output = path.join(root, 'output/site-quality-20260926/commands');
await fs.mkdir(output, { recursive: true });
const started = new Date().toISOString();
const executableArgs = command === 'npm'
  ? [path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), ...args]
  : args;
let log = '';
const child = spawn(process.execPath, executableArgs, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
  log += chunk.toString();
  process.stdout.write(chunk);
});
const exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
await fs.writeFile(path.join(output, `${label}.log`), log);
await fs.writeFile(path.join(output, `${label}.json`), JSON.stringify({ command: [command, ...args], started,
  finished: new Date().toISOString(), node: process.version, platform: process.platform, exitCode }, null, 2) + '\n');
process.exitCode = exitCode ?? 1;
