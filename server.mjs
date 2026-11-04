import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './backend/database.mjs';
import { WorkspaceStore } from './backend/workspace.mjs';
import { handleApi } from './backend/api.mjs';

const files = new Map([
  ['/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['public/index.html', 'text/html; charset=utf-8']],
  ...['styles.css', 'tokens.css'].map(name => [`/${name}`, [`public/${name}`, 'text/css; charset=utf-8']]),
  ...['app.js', 'model.js', 'data.js', 'access.js', 'reporting.js', 'presentation.js', 'workspace-ui.js'].map(name => [`/src/${name}`, [`src/${name}`, 'text/javascript; charset=utf-8']]),
  ['/assets/zealpro-logo.png', ['public/assets/zealpro-logo.png', 'image/png']],
  ...['zealpro-hygiene-inspection.jpg', 'zealpro-facility-equipment.jpg'].map(name => [`/assets/${name}`, [`public/assets/${name}`, 'image/jpeg']]),
  ['/assets/general-sans.woff2', ['public/assets/general-sans.woff2', 'font/woff2']],
  ['/assets/general-sans-semibold.woff2', ['public/assets/general-sans-semibold.woff2', 'font/woff2']],
]);
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be a valid TCP port.');
const database = await openDatabase(process.env.ZEALPRO_DB_DIR === ':memory:' ? undefined : process.env.ZEALPRO_DB_DIR || fileURLToPath(new URL('./.local/db', import.meta.url)));
const store = new WorkspaceStore(database.db);
const server = createServer(async (req, res) => {
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; }
  catch { res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Invalid request URL.'); return; }
  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname, store, server.address().port);
  const file = files.get(pathname);
  if (!file || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(fileURLToPath(new URL(file[0], import.meta.url)));
    res.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500); res.end('Unable to load application file.'); }
});
server.requestTimeout = 30000;
server.on('error', async error => { console.error('Local server failed:', error.code || error.name); await database.close(); process.exitCode = 1; });
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  server.close(async () => { await database.close(); });
  server.closeIdleConnections();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.listen(port, '127.0.0.1', () => console.log(`Zealpro demo: http://127.0.0.1:${server.address().port}`));
