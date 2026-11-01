import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { get } from 'node:http';

const server = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, PORT: '0', ZEALPRO_DB_DIR: ':memory:' }, stdio: ['ignore', 'pipe', 'pipe'] });
after(() => server.kill());
const origin = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Local API startup timed out.')), 20000);
  server.once('error', error => { clearTimeout(timer); reject(error); });
  server.once('exit', code => { clearTimeout(timer); reject(new Error(`Local API exited: ${code}`)); });
  server.stdout.on('data', data => { const url = data.toString().match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) { clearTimeout(timer); resolve(url); } });
});
const post = command => fetch(`${origin}/api/commands`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(command) });

test('local API starts empty and executes validated idempotent commands', async () => {
  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).database, 'PostgreSQL (PGlite)');
  const empty = await (await fetch(`${origin}/api/workspace`)).json();
  assert.equal(empty.revision, 0);
  assert.equal(empty.state.clients.length, 0);
  const command = { requestId: 'api-seed', revision: 0, action: 'seed', values: {} };
  assert.equal((await post(command)).status, 200);
  const replay = await (await post(command)).json();
  assert.equal(replay.replayed, true);
  assert.equal(replay.revision, 1);
  const stale = await post({ requestId: 'api-stale', revision: 0, action: 'restock', id: 'm1', values: { quantity: 10 } });
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).error.code, 'REVISION_CONFLICT');
  const invalid = await post({ requestId: 'api-invalid', revision: 1, action: 'payment', id: 'INV-SERVICE-1', values: { amount: 1e9, method: 'Cash', reference: 'NO' } });
  assert.equal(invalid.status, 422);
  const backup = await fetch(`${origin}/api/backup`);
  assert.equal(backup.status, 200);
  const saved = await backup.json();
  assert.equal(saved.format, 'zealpro-workspace-v1');
  assert.equal(saved.state.visits.length, 10);
  assert.equal(saved.revision, 1);
});

test('API rejects foreign origins, host rebinding, unsupported commands, malformed and oversized data', async () => {
  for (const headers of [{ Origin: 'https://evil.example' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
    assert.equal((await fetch(`${origin}/api/workspace`, { headers })).status, 403, JSON.stringify(headers));
  }
  const hostStatus = await new Promise((resolve, reject) => get(`${origin}/api/workspace`, { headers: { Host: 'evil.example' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject));
  assert.equal(hostStatus, 403);
  assert.equal((await fetch(`${origin}/api/commands`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' })).status, 415);
  assert.equal((await fetch(`${origin}/api/commands`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await post({ requestId: 'no-command', revision: 1, action: '__proto__', values: {} })).status, 400);
  assert.equal((await fetch(`${origin}/api/commands`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: ' '.repeat(2 * 1024 * 1024 + 1) })).status, 413);
  for (const path of ['/backend/database.mjs', '/backend/migrations/001_workspace.sql', '/.local/db', '/node_modules/@electric-sql/pglite/package.json']) assert.equal((await fetch(`${origin}${path}`)).status, 404);
});

test('malformed HTTP request targets return 400 without stopping the database server', async () => {
  const response = await new Promise((resolve, reject) => get(origin, { path: 'http://[' }, result => { result.resume(); resolve(result.statusCode); }).on('error', reject));
  assert.equal(response, 400);
  assert.equal((await fetch(`${origin}/api/health`)).status, 200);
});
