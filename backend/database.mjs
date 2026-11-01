import { PGlite } from '@electric-sql/pglite';
import { createHash } from 'node:crypto';
import { mkdir, open, readFile, readdir, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export async function openDatabase(directory) {
  const path = directory ? resolve(directory) : undefined;
  let lock, db, closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    try { await db?.close(); }
    finally { if (lock) { await lock.close(); await unlink(`${path}.lock`); } }
  };
  try {
    if (path) {
      await mkdir(dirname(path), { recursive: true });
      try { lock = await open(`${path}.lock`, 'wx'); }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        throw new Error('This database is already open or has a recovery lock. Stop its owner before using it; see README database recovery.');
      }
      await lock.writeFile(`${process.pid}\n`);
    }
    db = await PGlite.create(path);
    await db.exec('CREATE SCHEMA IF NOT EXISTS zealpro; CREATE TABLE IF NOT EXISTS zealpro.schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());');
    const files = (await readdir(new URL('./migrations/', import.meta.url))).filter(name => name.endsWith('.sql')).sort();
    await db.transaction(async tx => {
      const applied = (await tx.query('SELECT name, checksum FROM zealpro.schema_migrations ORDER BY name')).rows;
      if (applied.some(row => !files.includes(row.name))) throw new Error('An applied migration is missing from source. Database was not reset.');
      for (const name of files) {
        const sql = (await readFile(new URL(`./migrations/${name}`, import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
        const checksum = createHash('sha256').update(sql).digest('hex');
        const previous = applied.find(row => row.name === name);
        if (previous && previous.checksum !== checksum) throw new Error(`Migration checksum changed: ${name}. Database was not reset.`);
        if (!previous) {
          await tx.exec(sql);
          await tx.query('INSERT INTO zealpro.schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
        }
      }
    });
    return { db, close };
  } catch (error) { await close(); throw error; }
}
