import { copyFile, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
// Publish an explicit browser-only allowlist, never the repository or local database.
const files = [
  ['public/index.html', 'index.html'],
  ['public/styles.css', 'styles.css'],
  ['public/tokens.css', 'tokens.css'],
  ...['app.js', 'model.js', 'data.js', 'access.js', 'reporting.js'].map(name => [`src/${name}`, `src/${name}`]),
  ...['zealpro-logo.png', 'general-sans.woff2', 'general-sans-semibold.woff2', 'General-Sans-FFL.txt'].map(name => [`public/assets/${name}`, `assets/${name}`]),
];

await rm(output, { recursive: true, force: true });
for (const [source, destination] of files) {
  const target = new URL(destination, output);
  await mkdir(new URL('./', target), { recursive: true });
  await copyFile(new URL(source, root), target);
}
console.log(`Built ${files.length} browser files in dist/. Local server and database excluded.`);
