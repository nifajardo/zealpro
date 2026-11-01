import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../backend/database.mjs';
import { WorkspaceStore } from '../backend/workspace.mjs';
import { createDemo } from '../src/data.js';

test('database migrations, normalized seed and records survive a disk reopen with an exclusive owner', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'zealpro-db-'));
  let database;
  try {
    database = await openDatabase(directory);
    const store = new WorkspaceStore(database.db);
    assert.equal((await store.snapshot()).state.visits.length, 0);
    await store.execute({ requestId: 'seed-1', revision: 0, action: 'import', values: { state: createDemo() } });
    assert.deepEqual((await store.snapshot()).state, createDemo());
    const lines = await database.db.query('SELECT count(*)::int AS count FROM zealpro.visit_products');
    assert.equal(lines.rows[0].count, 10);
    await assert.rejects(openDatabase(directory), /already open/);
    await database.close(); database = await openDatabase(directory);
    assert.equal((await new WorkspaceStore(database.db).snapshot()).revision, 1);
    assert.deepEqual((await new WorkspaceStore(database.db).snapshot()).state, createDemo());
    const applied = await database.db.query('SELECT count(*)::int AS count FROM zealpro.schema_migrations');
    assert.equal(applied.rows[0].count, 1);
    await assert.rejects(database.db.query("UPDATE zealpro.materials SET data = jsonb_set(data, '{stock}', '-1') WHERE id = 'm1'"), /check constraint/);
    await assert.rejects(database.db.query("UPDATE zealpro.visits SET data = jsonb_set(data, '{clientId}', '\"missing\"') WHERE id = 'v1'"), /foreign key/);
    await database.db.query("UPDATE zealpro.schema_migrations SET checksum = 'tampered'");
    await database.close(); database = undefined;
    await assert.rejects(openDatabase(directory), /checksum/);
  } finally {
    await database?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('commands commit stock, report and receivable once; reject stale writes and roll back invalid input', async () => {
  const database = await openDatabase();
  try {
    const store = new WorkspaceStore(database.db);
    await store.execute({ requestId: 'seed', revision: 0, action: 'import', values: { state: createDemo() } });
    const complete = { requestId: 'complete', revision: 1, action: 'complete', id: 'v5', values: { timeIn: '13:00', timeOut: '14:00', products: [{ productId: 'm3', quantity: 100 }], actualRevenue: 8000, expense: 0, pest: 'Rodents', pestCount: 1, location: 'Storage', findings: 'Door gap', recommendation: 'Seal gap', method: 'Baiting' } };
    const result = await store.execute(complete);
    assert.equal(result.revision, 2);
    const invoice = result.state.invoices.find(i => i.visitId === 'v5');
    assert.equal(invoice.due, '2026-12-02');
    assert.equal(result.state.materials.find(m => m.id === 'm3').stock, 3500);
    const replay = await store.execute(complete);
    assert.equal(replay.revision, 2);
    assert.deepEqual(replay.result, result.result);
    await assert.rejects(store.execute({ ...complete, values: { ...complete.values, actualRevenue: 9000 } }), error => error.code === 'REQUEST_REUSED');
    const pay = { requestId: 'payment', revision: 2, action: 'payment', id: invoice.id, values: { amount: 1000, method: 'Cash', reference: 'LOCAL-001' } };
    await store.execute(pay); await store.execute(pay);
    const saved = await store.snapshot();
    assert.equal(saved.state.invoices.find(i => i.id === invoice.id).paid, 1000);
    assert.equal(saved.state.invoices.find(i => i.id === invoice.id).payments.length, 1);
    await assert.rejects(store.execute({ ...pay, requestId: 'stale' }), error => error.code === 'REVISION_CONFLICT');
    await assert.rejects(store.execute({ ...pay, requestId: 'overpay', revision: 3, values: { ...pay.values, amount: 999999 } }));
    assert.deepEqual(await store.snapshot(), saved);
    const competing = await Promise.allSettled([1, 2].map(n => store.execute({ requestId: `restock-${n}`, revision: 3, action: 'restock', id: 'm1', values: { quantity: 1 } })));
    assert.equal(competing.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(competing.find(r => r.status === 'rejected').reason.code, 'REVISION_CONFLICT');
    const before = await store.snapshot();
    await assert.rejects(store.execute({ requestId: 'bad-import', revision: 4, action: 'import', values: { state: { version: 2 } } }));
    assert.deepEqual(await store.snapshot(), before);
    await assert.rejects(store.execute({ requestId: 'no-reset-seed', revision: 4, action: 'seed', values: {} }), /new empty/);
    assert.deepEqual(await store.snapshot(), before);
    const backups = await database.db.query('SELECT count(*)::int AS count FROM zealpro.workspace_backups');
    assert.equal(backups.rows[0].count, 1);
  } finally { await database.close(); }
});

test('SQL write failure rolls back deleted rows, stock and command receipts together', async () => {
  const database = await openDatabase();
  try {
    const store = new WorkspaceStore(database.db);
    await store.execute({ requestId: 'rollback-seed', revision: 0, action: 'seed', values: {} });
    const before = await store.snapshot();
    await database.db.exec("CREATE FUNCTION zealpro.reject_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected write failure'; END $$; CREATE TRIGGER fail_write BEFORE INSERT ON zealpro.materials FOR EACH ROW EXECUTE FUNCTION zealpro.reject_write();");
    await assert.rejects(store.execute({ requestId: 'rollback-write', revision: 1, action: 'restock', id: 'm1', values: { quantity: 10 } }), /Injected write failure/);
    assert.deepEqual(await store.snapshot(), before);
    assert.equal((await database.db.query("SELECT count(*)::int AS count FROM zealpro.command_receipts WHERE request_id = 'rollback-write'")).rows[0].count, 0);
  } finally { await database.close(); }
});
