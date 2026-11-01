import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = new Map([
  ['/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['public/index.html', 'text/html; charset=utf-8']],
  ...['styles.css', 'tokens.css'].map(name => [`/${name}`, [`public/${name}`, 'text/css; charset=utf-8']]),
  ...['app.js', 'model.js', 'data.js'].map(name => [`/src/${name}`, [`src/${name}`, 'text/javascript; charset=utf-8']]),
  ['/assets/zealpro-logo.png', ['public/assets/zealpro-logo.png', 'image/png']],
  ['/assets/general-sans.woff2', ['public/assets/general-sans.woff2', 'font/woff2']],
  ['/assets/general-sans-semibold.woff2', ['public/assets/general-sans-semibold.woff2', 'font/woff2']],
]);
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be a valid TCP port.');
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = files.get(pathname);
  if (!file || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(fileURLToPath(new URL(file[0], import.meta.url)));
    res.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500); res.end('Unable to load application file.'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Zealpro demo: http://127.0.0.1:${server.address().port}`));
