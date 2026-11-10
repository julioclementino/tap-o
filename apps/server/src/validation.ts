import { z } from 'zod';
import { activities, getTutorial, resultMode, startTraining, transition } from '@tap-o/core';
export const uuid = z.string().uuid();
export const eventSchema = z
  .object({
    type: z.enum([
      'CONTACT_SELECTED',
      'FIELD_FOCUSED',
      'TEXT_ENTERED',
      'MESSAGE_SENT',
      'RECORD_STARTED',
      'RECORD_STOPPED',
      'AUDIO_PLAYED',
      'AUDIO_SENT',
      'CALL_OPENED',
      'CALL_CONFIRMED',
      'CALL_ENDED',
      'BALANCE_OPENED',
      'STATEMENT_OPENED',
      'HELP_OPENED',
      'SCAM_REJECTED',
    ]),
    screen: z.enum([
      'contacts',
      'conversation',
      'calling',
      'bank',
      'balance',
      'statement',
      'help',
      'security',
    ]),
    target: z.string().min(1).max(50),
    valid: z.boolean(),
    assisted: z.boolean(),
    confirmed: z.boolean(),
  })
  .strict();
export const sessionSchema = z
  .object({
    taskId: z.string().max(40),
    guided: z.boolean(),
    events: z.array(eventSchema).min(1).max(20),
  })
  .strict();
export const preferenceSchema = z
  .object({
    textScale: z.union([z.literal(1), z.literal(1.2), z.literal(1.4)]),
    highContrast: z.boolean(),
    voiceEnabled: z.boolean(),
    reducedMotion: z.boolean(),
    inactivitySeconds: z.number().int().min(10).max(120),
  })
  .strict();
export const attemptSchema = z
  .object({
    activityId: z.string().max(40),
    answers: z.array(z.number().int().min(0).max(2)).min(1).max(3),
    readPages: z.number().int().min(0).max(3),
  })
  .strict();
export function validateSession(input: unknown) {
  const data = sessionSchema.parse(input);
  getTutorial(data.taskId);
  let state = { ...startTraining(data.taskId), guided: data.guided };
  for (const event of data.events) {
    const next = transition(state, event);
    if (next === state) throw new Error('Etapas fora de ordem ou sem confirmação.');
    state = next;
  }
  if (state.status !== 'completed') throw new Error('Conclua todas as etapas antes de salvar.');
  return { ...data, mode: resultMode(state) };
}
export function validateAttempt(input: unknown) {
  const data = attemptSchema.parse(input);
  const activity = activities.find((a) => a.id === data.activityId);
  if (!activity) throw new Error('Atividade não encontrada.');
  if (activity.kind === 'lesson' && data.readPages !== activity.content.length)
    throw new Error('Leia as páginas da aula antes de responder.');
  const correct =
    activity.id === 'order-game'
      ? data.answers.join(',') === '0,1,2'
      : data.answers.length === 1 && data.answers[0] === activity.answer;
  return { ...data, correct, explanation: activity.explanation };
}
