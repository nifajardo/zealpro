import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database.mjs';
import { WorkspaceStore } from './workspace.mjs';
import { exportBackup, exportSql, readImport } from './backup.mjs';

let database;
try {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: { file: { type: 'string' }, out: { type: 'string' }, revision: { type: 'string' }, confirm: { type: 'boolean', default: false } } });
  const command = positionals[0] || 'status';
  if (!['init', 'status', 'seed', 'backup', 'export-sql', 'import'].includes(command)) throw new Error('Use init, status, seed, backup, export-sql or import.');
  if (process.env.ZEALPRO_DB_DIR === ':memory:') throw new Error('Administration commands require a persistent database directory.');
  let imported;
  if (command === 'import') {
    if (!values.file || !values.confirm || !/^\d+$/.test(values.revision || '')) throw new Error('Import requires --file PATH --revision N --confirm. Existing records are backed up before replacement.');
    imported = readImport(await readFile(resolve(values.file), 'utf8'));
  }
  const directory = resolve(process.env.ZEALPRO_DB_DIR || fileURLToPath(new URL('../.local/db', import.meta.url)));
  database = await openDatabase(directory);
  const store = new WorkspaceStore(database.db);
  if (command === 'seed') await store.execute({ requestId: randomUUID(), revision: (await store.snapshot()).revision, action: 'seed', values: {} });
  if (command === 'import') await store.execute({ requestId: randomUUID(), revision: Number(values.revision), action: 'import', values: { state: imported } });
  if (command === 'backup' || command === 'export-sql') {
    const extension = command === 'backup' ? 'json' : 'sql';
    const output = resolve(values.out || fileURLToPath(new URL(`../.local/backups/zealpro-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`, import.meta.url)));
    const content = command === 'backup' ? JSON.stringify(await exportBackup(store), null, 2) : await exportSql(database.db);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, content, { flag: 'wx', mode: 0o600 });
    console.log(`Export saved: ${output}`);
  } else {
    const snapshot = await store.snapshot();
    const version = (await database.db.query('SHOW server_version')).rows[0].server_version;
    console.log(JSON.stringify({ database: 'PostgreSQL (PGlite)', postgresVersion: version, directory, revision: snapshot.revision, counts: Object.fromEntries(Object.entries(snapshot.state).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])) }, null, 2));
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await database?.close(); }
