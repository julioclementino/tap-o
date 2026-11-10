import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { RowDataPacket } from 'mysql2/promise';
import { createPool, type Database } from './db';
export async function migrate(db: Database) {
  const conn = await db.getConnection();
  try {
    const [lock] = await conn.query<RowDataPacket[]>(
      "SELECT GET_LOCK('tap_o_migration', 20) AS acquired",
    );
    if (!lock[0].acquired) throw new Error('Outra migração está em andamento.');
    await conn.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(120) PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
    );
    const folder = fileURLToPath(new URL('../migrations/', import.meta.url));
    for (const name of (await readdir(folder)).filter((f) => f.endsWith('.sql')).sort()) {
      const sql = await readFile(`${folder}/${name}`, 'utf8');
      const hash = createHash('sha256').update(sql).digest('hex');
      const [rows] = await conn.execute<RowDataPacket[]>(
        'SELECT checksum FROM schema_migrations WHERE name = ?',
        [name],
      );
      if (rows.length) {
        if (rows[0].checksum !== hash) throw new Error(`Migração alterada: ${name}`);
        continue;
      }
      for (const statement of sql
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean))
        await conn.query(statement);
      await conn.execute('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)', [
        name,
        hash,
      ]);
    }
  } finally {
    await conn.query("SELECT RELEASE_LOCK('tap_o_migration')");
    conn.release();
  }
}
if (process.argv[1]?.endsWith('migrate.ts')) {
  const db = createPool();
  try {
    await migrate(db);
    console.log('Migrações aplicadas.');
  } finally {
    await db.end();
  }
}
