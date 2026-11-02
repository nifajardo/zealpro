import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../backend/database.mjs';
import { WorkspaceStore } from '../backend/workspace.mjs';

test('ocular findings round-trip JSONB and commands reject invalid rows atomically', async () => {
  const database = await openDatabase();
  try {
    const store = new WorkspaceStore(database.db);
    await store.execute({ requestId: 'ocular-seed', revision: 0, action: 'seed', values: {} });
    const values = { clientId: 'c1', date: '2026-11-03', time: '09:00', assessor: 'Marco Reyes', notes: 'Follow up next week.', findings: [
      { location: 'Loading bay', problem: 'Rodent activity', serviceId: 's6', materialIds: ['m5', 'm3'], notes: 'Check the door gap.' },
      { location: 'Kitchen', problem: 'Cockroach activity', serviceId: 's3', materialIds: ['m2'], notes: 'Inspect the sink.' },
    ] };
    const command = { requestId: 'ocular-create', revision: 1, action: 'assessment', values };
    const created = await store.execute(command);
    assert.deepEqual(created.result.findings, values.findings);
    assert.deepEqual((await store.snapshot()).state.assessments.at(-1), created.result);
    const persisted = await database.db.query('SELECT data FROM zealpro.assessments WHERE id = $1', [created.result.id]);
    assert.deepEqual(persisted.rows[0].data.findings, values.findings);
    const before = await store.snapshot();
    assert.equal((await store.execute(command)).replayed, true);
    assert.deepEqual(await store.snapshot(), before);
    const invalid = structuredClone(values);
    invalid.findings[1].materialIds = ['missing'];
    await assert.rejects(store.execute({ ...command, requestId: 'ocular-invalid', revision: 2, values: invalid }), error => error.code === 'VALIDATION_ERROR');
    assert.deepEqual(await store.snapshot(), before);
    const imported = await store.execute({ requestId: 'ocular-restore', revision: 2, action: 'import', values: { state: before.state } });
    assert.deepEqual(imported.state.assessments.at(-1), created.result);
  } finally { await database.close(); }
});
