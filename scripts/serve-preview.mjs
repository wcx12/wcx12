import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewRoot = path.join(rootDir, 'output', 'preview');
const host = '127.0.0.1';
const port = Number.parseInt(process.env.PORT || '4173', 10);

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8']
]);

function buildPreview() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/build-blog.mjs', '--preview-drafts'], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`Preview build exited with code ${code}`)));
  });
}

function safeRequestPath(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, `http://${host}:${port}`).pathname);
  } catch {
    return null;
  }
  const target = path.resolve(previewRoot, `.${pathname}`);
  return target === previewRoot || target.startsWith(`${previewRoot}${path.sep}`) ? target : null;
}

await buildPreview();

const server = http.createServer(async (request, response) => {
  let target = safeRequestPath(request.url || '/');
  if (!target) {
    response.writeHead(400).end('Bad request');
    return;
  }
  const initialStats = await fs.stat(target).catch(() => null);
  if (initialStats?.isDirectory()) target = path.join(target, 'index.html');
  const stats = await fs.stat(target).catch(() => null);
  if (!stats?.isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }).end('Not found');
    return;
  }
  const body = await fs.readFile(target);
  response.writeHead(200, {
    'Content-Type': mimeTypes.get(path.extname(target).toLowerCase()) || 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(body);
});

server.listen(port, host, () => {
  console.log(`Draft preview: http://${host}:${port}/`);
  console.log('Press Ctrl+C to stop.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
