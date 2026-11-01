import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const server = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
after(() => server.kill());
const origin = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Demo server did not start within 10 seconds.')), 10000);
  server.once('error', error => { clearTimeout(timer); reject(error); });
  server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited early: ${code}`)); });
  server.stdout.on('data', data => {
    const url = data.toString().match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (url) { clearTimeout(timer); resolve(url); }
  });
});

test('public assets serve with local-only security headers', async () => {
  for (const path of ['/', '/styles.css', '/tokens.css', '/src/app.js', '/assets/zealpro-logo.png', '/assets/general-sans-semibold.woff2']) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
});

test('paperwork, secrets, repository files and traversal paths are not served', async () => {
  for (const path of ['/ZEALPRO%20-%20SRS.pdf', '/a14ba4fb-89db-47c3-aa8a-19723c748653.jfif', '/PROJECT_PREFERENCES.md', '/.env', '/.git/config', '/server.mjs', '/src/../server.mjs', '/%2e%2e/server.mjs', '/assets/%2e%2e/%2e%2e/.env']) {
    assert.equal((await fetch(`${origin}${path}`)).status, 404, path);
  }
  assert.equal((await fetch(origin, { method: 'POST', body: 'test' })).status, 404);
});
