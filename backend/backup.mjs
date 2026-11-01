import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { migrateState } from '../src/model.js';

export async function exportBackup(store) {
  return { format: 'zealpro-workspace-v1', exportedAt: new Date().toISOString(), ...await store.snapshot() };
}

export function readImport(text) {
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('Import file must contain valid JSON.'); }
  if (parsed?.format !== undefined && parsed.format !== 'zealpro-workspace-v1') throw new Error('Unsupported backup format.');
  return migrateState(parsed?.format ? parsed.state : parsed);
}

export async function exportSql(db) {
  const dump = await pgDump({ pg: db, args: ['--schema=zealpro', '--no-owner'], fileName: 'zealpro.sql' });
  return dump.text();
}
