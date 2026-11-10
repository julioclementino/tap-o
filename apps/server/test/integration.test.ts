import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import mysql from 'mysql2/promise';
import { defaultPreferences, getTutorial } from '@tap-o/core';
import { config } from '../src/config';
import { createApp } from '../src/app';
import { migrate } from '../src/migrate';
import { seed } from '../src/seed';
// Dedicated test schema, never the demo schema. No existing records are deleted.
const database = process.env.TEST_DB_NAME || 'tap_o_test';
if (!database.endsWith('_test')) throw new Error('TEST_DB_NAME must end with _test');
const db = mysql.createPool({ ...config.database, database });
const app = createApp(db);
const payload = (guided = true) => ({
  taskId: 'message',
  guided,
  events: getTutorial('message').steps.map((s) => ({
    type: s.event,
    screen: s.screen,
    target: s.target,
    valid: true,
    assisted: false,
    confirmed: true,
  })),
});
beforeAll(async () => {
  await migrate(db);
  await seed(db);
}, 30000);
afterAll(async () => {
  await db.end();
});
it('persists completion and reads it via a newly created API/pool', async () => {
  const id = randomUUID();
  await request(app).put(`/sessions/${id}`).send(payload()).expect(200);
  const fresh = mysql.createPool({ ...config.database, database });
  try {
    const response = await request(createApp(fresh)).get('/progress').expect(200);
    expect(response.body.sessions.find((s: { id: string }) => s.id === id)?.mode).toBe('guided');
  } finally {
    await fresh.end();
  }
});
it('is idempotent under retries and concurrent duplicate writes', async () => {
  const id = randomUUID();
  await Promise.all(
    [1, 2, 3].map(() => request(app).put(`/sessions/${id}`).send(payload()).expect(200)),
  );
  const response = await request(app).get('/progress').expect(200);
  expect(response.body.sessions.filter((s: { id: string }) => s.id === id)).toHaveLength(1);
  await request(app).put(`/sessions/${id}`).send(payload(false)).expect(409);
});
it('rejects missing steps, wrong events and unconfirmed assistance without persistence', async () => {
  const id = randomUUID();
  const data = payload();
  data.events[0].assisted = true;
  data.events[0].confirmed = false;
  await request(app).put(`/sessions/${id}`).send(data).expect(400);
  await request(app)
    .put(`/sessions/${id}`)
    .send({ ...payload(), events: payload().events.slice(0, 2) })
    .expect(400);
  const response = await request(app).get('/progress');
  expect(response.body.sessions.some((s: { id: string }) => s.id === id)).toBe(false);
});
it('persists all three modes without calling assisted execution mastery', async () => {
  for (const mode of ['guided', 'assisted', 'independent']) {
    const id = randomUUID();
    const data = payload(mode !== 'independent');
    if (mode === 'assisted') data.events[0].assisted = true;
    const response = await request(app).put(`/sessions/${id}`).send(data).expect(200);
    expect(response.body.mode).toBe(mode);
  }
});
it('persists preferences, lessons, game outcomes and feedback', async () => {
  await request(app)
    .put('/preferences')
    .send({ ...defaultPreferences, textScale: 1.4, highContrast: true })
    .expect(200);
  expect((await request(app).get('/preferences')).body.textScale).toBe(1.4);
  const id = randomUUID();
  const attempt = { activityId: 'scam-game', answers: [0], readPages: 1 };
  expect((await request(app).put(`/attempts/${id}`).send(attempt).expect(200)).body.correct).toBe(
    false,
  );
  await request(app)
    .put(`/attempts/${id}`)
    .send({ ...attempt, answers: [1] })
    .expect(409);
  await request(app)
    .put(`/attempts/${randomUUID()}`)
    .send({ activityId: 'phone-basics', answers: [0], readPages: 3 })
    .expect(200);
  await request(app).put(`/feedback/${randomUUID()}`).send({ rating: 3 }).expect(200);
});
it('does not claim saved when MySQL is unavailable', async () => {
  const unavailable = mysql.createPool({
    ...config.database,
    database,
    port: 1,
    connectTimeout: 1000,
  });
  try {
    const response = await request(createApp(unavailable))
      .put(`/sessions/${randomUUID()}`)
      .send(payload())
      .expect(503);
    expect(response.body.saved).toBeUndefined();
  } finally {
    await unavailable.end();
  }
});
