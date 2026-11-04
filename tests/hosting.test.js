import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('hosting build includes browser dependencies, removes stale output and excludes private/server files', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'zealpro-hosting-'));
  try {
    for (const directory of ['public', 'src', 'scripts']) await cp(join(root, directory), join(fixture, directory), { recursive: true });
    await mkdir(join(fixture, 'dist'), { recursive: true });
    await writeFile(join(fixture, 'dist', 'stale-secret.txt'), 'Must not survive a rebuild.');
    await writeFile(join(fixture, 'public', 'private-paperwork.pdf'), 'Must not be published.');
    await writeFile(join(fixture, 'ZEALPRO UPDATED REQUIREMENTS.pdf'), 'Must stay private.');
    await writeFile(join(fixture, 'src', 'server-secret.js'), 'Must not be published.');
    await writeFile(join(fixture, '.env'), 'SECRET=private');
    execFileSync(process.execPath, [join(fixture, 'scripts/build.mjs')], { cwd: fixture });

    const files = (await readdir(join(fixture, 'dist'), { recursive: true, withFileTypes: true })).filter(entry => entry.isFile());
    assert.equal(files.length, 14);
    for (const file of ['index.html', 'styles.css', 'tokens.css', 'src/app.js', 'src/model.js', 'src/data.js', 'src/access.js', 'src/reporting.js', 'src/presentation.js', 'src/workspace-ui.js', 'assets/zealpro-logo.png', 'assets/general-sans.woff2', 'assets/general-sans-semibold.woff2', 'assets/General-Sans-FFL.txt']) {
      const source = file.startsWith('src/') ? file : `public/${file}`;
      assert.deepEqual(await readFile(join(fixture, 'dist', file)), await readFile(join(root, source)), file);
    }
    const index = await readFile(join(fixture, 'dist/index.html'), 'utf8');
    assert.match(index, /src="\/src\/app\.js"/);
    assert.match(index, /href="\/styles\.css"/);
    assert.doesNotMatch(await readFile(join(fixture, 'dist/src/app.js'), 'utf8'), /fetch\([^)]*\/api\//);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('Vercel selects static output without a Node function or catch-all rewrite', async () => {
  const config = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
  assert.equal(config.framework, null);
  assert.equal(config.outputDirectory, 'dist');
  assert.equal(config.buildCommand, 'npm run build');
  assert.equal(config.functions, undefined);
  assert.equal(config.builds, undefined);
  assert.equal(config.rewrites, undefined);
  const headers = Object.fromEntries(config.headers.find(rule => rule.source === '/(.*)').headers.map(header => [header.key, header.value]));
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
});
