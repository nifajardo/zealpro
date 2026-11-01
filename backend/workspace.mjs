import { createHash } from 'node:crypto';
import { createDemo } from '../src/data.js';
import { validateState, migrateState, saveService, saveProduct, setCatalogActive, scheduleVisit, completeVisit, reviseReport, recordPayment, restock, enrollClient, addAssessment, linkServicePayment } from '../src/model.js';

const collections = ['materials', 'services', 'clients', 'visits', 'reports', 'invoices', 'assessments', 'observations'];
const nested = [['services', 'products', 'service_products'], ['visits', 'estimatedProducts', 'visit_products'], ['reports', 'products', 'report_products'], ['invoices', 'payments', 'payments']];
const operations = {
  service: (state, id, values) => saveService(state, values, id),
  product: (state, id, values) => saveProduct(state, values, id),
  'catalog-active': (state, id, values) => setCatalogActive(state, values.collection, id, values.active),
  visit: (state, id, values) => scheduleVisit(state, values),
  complete: (state, id, values) => completeVisit(state, id, values),
  'report-revision': (state, id, values) => reviseReport(state, id, values),
  payment: (state, id, values) => recordPayment(state, id, values.amount, values.method, values.reference),
  restock: (state, id, values) => restock(state, id, values.quantity),
  client: (state, id, values) => enrollClient(state, values),
  assessment: (state, id, values) => addAssessment(state, values),
  'service-payment': (state, id, values) => linkServicePayment(state, id, values.invoiceId),
};

export class WorkspaceError extends Error {
  constructor(code, message, status = 422) { super(message); this.code = code; this.status = status; }
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}

async function readState(tx) {
  const state = { version: 2 };
  for (const name of collections) state[name] = (await tx.query(`SELECT data FROM zealpro.${name} ORDER BY position`)).rows.map(row => row.data);
  for (const [collection, field, table] of nested) {
    const owners = new Map(state[collection].map(row => { row[field] = []; return [row.id, row]; }));
    for (const row of (await tx.query(`SELECT owner_id, data FROM zealpro.${table} ORDER BY owner_id, position`)).rows) owners.get(row.owner_id)[field].push(row.data);
  }
  return state;
}

async function writeState(tx, state) {
  // shortcut: rewrite the single local workspace in one transaction; use targeted row updates before multi-user scale.
  for (const table of ['payments', 'report_products', 'visit_products', 'service_products', 'observations', 'assessments', 'invoices', 'reports', 'visits', 'services', 'clients', 'materials']) await tx.exec(`DELETE FROM zealpro.${table}`);
  for (const collection of collections) {
    const field = nested.find(row => row[0] === collection)?.[1];
    const rows = state[collection].map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== field)));
    const id = collection === 'observations' ? '' : "value->>'id', ";
    await tx.query(`INSERT INTO zealpro.${collection} (${collection === 'observations' ? '' : 'id, '}position, data) SELECT ${id}ordinality - 1, value FROM jsonb_array_elements($1::jsonb) WITH ORDINALITY`, [JSON.stringify(rows)]);
  }
  for (const [collection, field, table] of nested) {
    const lines = state[collection].flatMap(row => row[field].map((data, position) => ({ owner: row.id, position, data })));
    await tx.query(`INSERT INTO zealpro.${table} (owner_id, position, data) SELECT value->>'owner', (value->>'position')::int, value->'data' FROM jsonb_array_elements($1::jsonb)`, [JSON.stringify(lines)]);
  }
}

export class WorkspaceStore {
  constructor(db) { this.db = db; }

  async snapshot() {
    return this.db.transaction(async tx => ({ revision: (await tx.query('SELECT revision FROM zealpro.workspace_meta')).rows[0].revision, state: await readState(tx) }));
  }

  async execute(command) {
    if (!command || typeof command !== 'object' || Array.isArray(command) || typeof command.requestId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(command.requestId) || !Number.isSafeInteger(command.revision) || command.revision < 0 || typeof command.action !== 'string' || (command.id !== undefined && typeof command.id !== 'string') || !command.values || typeof command.values !== 'object' || Array.isArray(command.values)) throw new WorkspaceError('INVALID_COMMAND', 'Provide a request ID, expected revision, action and values object.', 400);
    if (!['seed', 'import'].includes(command.action) && !Object.hasOwn(operations, command.action)) throw new WorkspaceError('UNKNOWN_COMMAND', 'This workspace command is not supported.', 400);
    const hash = createHash('sha256').update(JSON.stringify(canonical(command))).digest('hex');
    return this.db.transaction(async tx => {
      const current = (await tx.query('SELECT revision FROM zealpro.workspace_meta FOR UPDATE')).rows[0].revision;
      const receipt = (await tx.query('SELECT request_hash, result FROM zealpro.command_receipts WHERE request_id = $1', [command.requestId])).rows[0];
      if (receipt) {
        if (receipt.request_hash !== hash) throw new WorkspaceError('REQUEST_REUSED', 'This request ID was already used for different data.', 409);
        return { revision: current, state: await readState(tx), result: receipt.result, replayed: true };
      }
      if (command.revision !== current) throw new WorkspaceError('REVISION_CONFLICT', 'The workspace changed. Reload its latest revision before saving.', 409);
      let state = await readState(tx), result = null;
      try {
        if (command.action === 'seed' || command.action === 'import') {
          if (command.action === 'seed' && (current !== 0 || collections.some(name => state[name].length))) throw new Error('Sample seed is allowed only in a new empty workspace. Existing records were not replaced.');
          const imported = command.action === 'seed' ? createDemo() : migrateState(command.values.state);
          await tx.query('INSERT INTO zealpro.workspace_backups (revision, state) VALUES ($1, $2::jsonb)', [current, JSON.stringify(state)]);
          state = imported;
        } else result = operations[command.action](state, command.id, command.values) ?? null;
        if (!validateState(state)) throw new Error('The operation would create invalid workspace records.');
      } catch (error) { throw new WorkspaceError('VALIDATION_ERROR', error.message); }
      await writeState(tx, state);
      const revision = current + 1;
      await tx.query('UPDATE zealpro.workspace_meta SET revision = $1, updated_at = now()', [revision]);
      await tx.query('INSERT INTO zealpro.command_receipts (request_id, request_hash, action, revision, result) VALUES ($1, $2, $3, $4, $5::jsonb)', [command.requestId, hash, command.action, revision, JSON.stringify(result)]);
      return { revision, state, result, replayed: false };
    });
  }
}
