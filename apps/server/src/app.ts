import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2/promise';
import { activities, tutorials } from '@tap-o/core';
import type { Database } from './db';
import { config } from './config';
import { DEMO_ID } from './seed';
import { preferenceSchema, uuid, validateAttempt, validateSession } from './validation';
export function createApp(db: Database) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || config.origins.includes(origin)) }));
  app.use(express.json({ limit: '24kb' }));
  app.get('/health', async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'mysql' });
  });
  app.get('/demo', async (_req, res) => {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, display_name AS displayName, is_demo AS isDemo FROM profiles WHERE id = ?',
      [DEMO_ID],
    );
    if (!rows.length) {
      res
        .status(503)
        .json({ message: 'Prepare o perfil demonstrativo executando os dados iniciais.' });
      return;
    }
    res.json(rows[0]);
  });
  app.get('/catalog', (_req, res) => res.json({ tutorials, activities }));
  app.get('/preferences', async (_req, res) => {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT settings FROM preferences WHERE profile_id = ?',
      [DEMO_ID],
    );
    if (!rows.length) {
      res.status(503).json({ message: 'O perfil demonstrativo ainda não está preparado.' });
      return;
    }
    res.json(rows[0].settings);
  });
  app.put('/preferences', async (req, res) => {
    const settings = preferenceSchema.parse(req.body);
    await db.execute(
      'INSERT INTO preferences (profile_id, settings) VALUES (?, ?) ON DUPLICATE KEY UPDATE settings = VALUES(settings)',
      [DEMO_ID, JSON.stringify(settings)],
    );
    res.json(settings);
  });
  app.put('/sessions/:id', async (req, res) => {
    const id = uuid.parse(req.params.id);
    let data: ReturnType<typeof validateSession>;
    try {
      data = validateSession(req.body);
    } catch {
      res
        .status(400)
        .json({ message: 'Não foi possível validar as etapas. Recomece o treinamento.' });
      return;
    }
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      // A no-op duplicate update takes an exclusive row lock, avoiding lock upgrades
      // and deadlocks when simultaneous retry requests share an idempotency key.
      await conn.execute(
        'INSERT INTO training_sessions (id, profile_id, tutorial_id, guided, mode, event_log) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = training_sessions.id',
        [id, DEMO_ID, data.taskId, data.guided, data.mode, JSON.stringify(data.events)],
      );
      const [existing] = await conn.execute<RowDataPacket[]>(
        'SELECT tutorial_id, guided, mode, event_log FROM training_sessions WHERE id = ? FOR UPDATE',
        [id],
      );
      const saved = existing[0];
      // MySQL normalizes JSON key order; compare the allowed values explicitly.
      const sameEvents =
        JSON.stringify(
          saved.event_log.map((e: Record<string, unknown>) => [
            e.type,
            e.screen,
            e.target,
            e.valid,
            e.assisted,
            e.confirmed,
          ]),
        ) ===
        JSON.stringify(
          data.events.map((e) => [e.type, e.screen, e.target, e.valid, e.assisted, e.confirmed]),
        );
      if (
        saved.tutorial_id !== data.taskId ||
        Boolean(saved.guided) !== data.guided ||
        saved.mode !== data.mode ||
        !sameEvents
      ) {
        await conn.rollback();
        res.status(409).json({ message: 'Este registro já pertence a outra tentativa.' });
        return;
      }
      await conn.execute(
        'INSERT IGNORE INTO completions (session_id, profile_id, tutorial_id) VALUES (?, ?, ?)',
        [id, DEMO_ID, data.taskId],
      );
      await conn.commit();
      res.json({ saved: true, id, mode: data.mode });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  });
  app.put('/attempts/:id', async (req, res) => {
    const id = uuid.parse(req.params.id);
    let data: ReturnType<typeof validateAttempt>;
    try {
      data = validateAttempt(req.body);
    } catch {
      res.status(400).json({ message: 'Confira a atividade e tente novamente.' });
      return;
    }
    await db.execute(
      'INSERT IGNORE INTO activity_results (id, profile_id, activity_id, correct) VALUES (?, ?, ?, ?)',
      [id, DEMO_ID, data.activityId, data.correct],
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT activity_id, correct FROM activity_results WHERE id = ?',
      [id],
    );
    if (rows[0].activity_id !== data.activityId || Boolean(rows[0].correct) !== data.correct) {
      res.status(409).json({ message: 'Este registro já pertence a outra tentativa.' });
      return;
    }
    res.json({ saved: true, correct: data.correct, explanation: data.explanation });
  });
  app.put('/feedback/:id', async (req, res) => {
    const id = uuid.parse(req.params.id);
    const { rating } = z
      .object({ rating: z.number().int().min(1).max(3) })
      .strict()
      .parse(req.body);
    await db.execute(
      'INSERT IGNORE INTO satisfaction_feedback (id, profile_id, rating) VALUES (?, ?, ?)',
      [id, DEMO_ID, rating],
    );
    res.json({ saved: true });
  });
  app.get('/progress', async (_req, res) => {
    const [sessions] = await db.execute<RowDataPacket[]>(
      "SELECT s.id, s.tutorial_id AS taskId, t.title, s.mode, s.guided, s.completed_at AS completedAt, JSON_LENGTH(s.event_log) AS steps, (SELECT COUNT(*) FROM JSON_TABLE(s.event_log, '$[*]' COLUMNS (assisted BOOLEAN PATH '$.assisted')) AS e WHERE e.assisted = TRUE) AS assistedSteps FROM training_sessions s JOIN tutorials t ON t.id = s.tutorial_id WHERE s.profile_id = ? ORDER BY s.completed_at DESC, s.id DESC",
      [DEMO_ID],
    );
    const [results] = await db.execute<RowDataPacket[]>(
      'SELECT r.id, r.activity_id AS activityId, a.kind, r.correct, r.created_at AS createdAt FROM activity_results r JOIN activities a ON a.id = r.activity_id WHERE r.profile_id = ? ORDER BY r.created_at DESC',
      [DEMO_ID],
    );
    res.json({
      sessions,
      results,
      totals: {
        tasks: sessions.length,
        lessons: new Set(
          results.filter((r) => r.kind === 'lesson' && r.correct).map((r) => r.activityId),
        ).size,
        games: results.filter((r) => r.kind === 'game').length,
        guided: sessions.filter((s) => s.mode === 'guided').length,
        assisted: sessions.filter((s) => s.mode === 'assisted').length,
        independent: sessions.filter((s) => s.mode === 'independent').length,
      },
    });
  });
  app.use((_req, res) => res.status(404).json({ message: 'Este caminho não existe.' }));
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error instanceof z.ZodError || error instanceof SyntaxError) {
        res.status(400).json({ message: 'Confira as informações e tente novamente.' });
        return;
      }
      // Never log payloads, credentials, recordings or message text.
      console.error('API failure', error instanceof Error ? error.name : 'UnknownError');
      res.status(503).json({
        message:
          'Não conseguimos acessar o banco agora. Seu resultado não foi confirmado. Tente novamente.',
      });
    },
  );
  return app;
}
