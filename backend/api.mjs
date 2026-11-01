import { WorkspaceError } from './workspace.mjs';

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}

async function readCommand(req) {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new WorkspaceError('CONTENT_TYPE', 'Send application/json.', 415);
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0, exceeded = false;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) {
        if (!exceeded) { exceeded = true; reject(new WorkspaceError('BODY_TOO_LARGE', 'Request exceeds the 2 MiB local API limit.', 413)); }
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (exceeded) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new WorkspaceError('INVALID_JSON', 'Request body must contain valid JSON.', 400)); }
    });
    req.on('error', () => reject(new WorkspaceError('REQUEST_INTERRUPTED', 'The request was interrupted.', 400)));
  });
}

export async function handleApi(req, res, path, store, port) {
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  const origins = hosts.map(host => `http://${host}`);
  try {
    if (!hosts.includes(req.headers.host) || (req.headers.origin && !origins.includes(req.headers.origin)) || req.headers['sec-fetch-site'] === 'cross-site') throw new WorkspaceError('LOCAL_ACCESS_ONLY', 'Only this local workspace origin may access the API.', 403);
    if (req.method === 'GET' && path === '/api/health') {
      const version = (await store.db.query('SHOW server_version')).rows[0].server_version;
      return json(res, 200, { status: 'ready', database: 'PostgreSQL (PGlite)', postgresVersion: version, mode: 'local-development', uiPersistence: 'browser-local' });
    }
    if (req.method === 'GET' && path === '/api/workspace') return json(res, 200, await store.snapshot());
    if (req.method === 'GET' && path === '/api/backup') return json(res, 200, { format: 'zealpro-workspace-v1', exportedAt: new Date().toISOString(), ...await store.snapshot() });
    if (req.method === 'POST' && path === '/api/commands') return json(res, 200, await store.execute(await readCommand(req)));
    throw new WorkspaceError('NOT_FOUND', 'This local API route or method is not available.', 404);
  } catch (error) {
    if (!(error instanceof WorkspaceError)) console.error('Local database operation failed:', error.code || error.name);
    json(res, error instanceof WorkspaceError ? error.status : 500, { error: { code: error instanceof WorkspaceError ? error.code : 'DATABASE_ERROR', message: error instanceof WorkspaceError ? error.message : 'Local database operation failed. No success was confirmed; retry with the same request ID.' } });
  }
}
