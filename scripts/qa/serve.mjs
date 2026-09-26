import fs from 'node:fs/promises';
import http from 'node:http';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = path.resolve(root, process.argv[2] || 'output/pages');
if (!directory.startsWith(path.join(root, 'output') + path.sep)) throw new Error('Serve only artifacts below output/');
const realRoot = await fs.realpath(directory);
const port = Number(process.argv[3] || 4282);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  if (request.headers.host !== `127.0.0.1:${port}`) return response.writeHead(403).end();
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (!url.pathname.startsWith('/wcx12/')) return response.writeHead(404).end();
    let target = path.resolve(realRoot, '.' + decodeURIComponent(url.pathname.slice('/wcx12'.length)));
    if (!target.startsWith(realRoot + path.sep) && target !== realRoot) return response.writeHead(403).end();
    let stat = await fs.stat(target).catch(() => null);
    if (stat?.isDirectory()) { target = path.join(target, 'index.html'); stat = await fs.stat(target).catch(() => null); }
    const status = stat?.isFile() ? 200 : 404;
    if (status === 404) target = path.join(realRoot, '404.html');
    target = await fs.realpath(target);
    if (!target.startsWith(realRoot + path.sep)) return response.writeHead(403).end();
    let body = await fs.readFile(target);
    const gzip = /\bgzip\b/.test(request.headers['accept-encoding'] || '') && /\.(html|css|js|json|xml|svg)$/.test(target);
    if (gzip) body = gzipSync(body);
    response.writeHead(status, { 'Content-Type': (types[path.extname(target)] || 'application/octet-stream'), 'Content-Length': body.length, 'Cache-Control': 'no-store', 'Vary': 'Accept-Encoding', ...(gzip ? { 'Content-Encoding': 'gzip' } : {}) });
    response.end(body);
  } catch { response.writeHead(400).end(); }
});
server.listen(port, '127.0.0.1', () => console.log(`QA artifact: http://127.0.0.1:${port}/wcx12/ (${realRoot})`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
