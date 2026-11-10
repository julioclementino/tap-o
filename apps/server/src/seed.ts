import { activities, defaultPreferences, tutorials } from '@tap-o/core';
import { createPool, type Database } from './db';
export const DEMO_ID = 'demo-tap-o';
export async function seed(db: Database) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('INSERT IGNORE INTO profiles (id, display_name) VALUES (?, ?)', [
      DEMO_ID,
      'Pessoa visitante',
    ]);
    await conn.execute('INSERT IGNORE INTO preferences (profile_id, settings) VALUES (?, ?)', [
      DEMO_ID,
      JSON.stringify(defaultPreferences),
    ]);
    for (const t of tutorials) {
      await conn.execute(
        'INSERT INTO tutorials (id, title) VALUES (?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title)',
        [t.id, t.title],
      );
      for (const [i, s] of t.steps.entries())
        await conn.execute(
          'INSERT INTO tutorial_steps (tutorial_id, step_index, definition) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE definition = VALUES(definition)',
          [t.id, i, JSON.stringify(s)],
        );
    }
    for (const a of activities)
      await conn.execute(
        'INSERT INTO activities (id, kind, definition) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE definition = VALUES(definition)',
        [a.id, a.kind, JSON.stringify(a)],
      );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
if (process.argv[1]?.endsWith('seed.ts')) {
  const db = createPool();
  try {
    await seed(db);
    console.log('Perfil e conteúdo demonstrativos preparados. Nenhum resultado inventado.');
  } finally {
    await db.end();
  }
}
