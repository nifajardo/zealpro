import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { openDatabase } from '../backend/database.mjs';
import { WorkspaceStore } from '../backend/workspace.mjs';
import { exportSql, exportBackup, readImport } from '../backend/backup.mjs';

test('portable SQL restores records, schema and idempotency receipts into a fresh PostgreSQL engine', async () => {
  const database = await openDatabase(), restored = await PGlite.create();
  try {
    const store = new WorkspaceStore(database.db);
    const seed = { requestId: 'portable-seed', revision: 0, action: 'seed', values: {} };
    await store.execute(seed);
    const backup = await exportBackup(store);
    assert.equal(backup.format, 'zealpro-workspace-v1');
    assert.deepEqual(readImport(JSON.stringify(backup)), backup.state);
    assert.throws(() => readImport('{'), /JSON/);
    assert.throws(() => readImport(JSON.stringify({ format: 'unknown', state: backup.state })), /format/);
    const sql = await exportSql(database.db);
    assert.match(sql, /CREATE SCHEMA zealpro/);
    await restored.exec(sql);
    const recovered = new WorkspaceStore(restored);
    assert.deepEqual(await recovered.snapshot(), await store.snapshot());
    assert.equal((await recovered.execute(seed)).replayed, true);
    assert.equal((await restored.query('SELECT count(*)::int AS count FROM zealpro.schema_migrations')).rows[0].count, 1);
  } finally { await restored.close(); await database.close(); }
});
