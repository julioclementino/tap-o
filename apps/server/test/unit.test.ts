import { expect, it } from 'vitest';
import { getTutorial } from '@tap-o/core';
import { validateAttempt, validateSession } from '../src/validation';
const payload = () => ({
  taskId: 'message',
  guided: true,
  events: getTutorial('message').steps.map((s) => ({
    type: s.event,
    screen: s.screen,
    target: s.target,
    valid: true,
    assisted: false,
    confirmed: false,
  })),
});
it('rejects message content and unknown payload fields', () => {
  const data = payload();
  expect(() => validateSession({ ...data, message: 'private' })).toThrow();
  expect(() =>
    validateSession({ ...data, events: [{ ...data.events[0], text: 'private' }] }),
  ).toThrow();
});
it('requires complete ordered events', () => {
  const data = payload();
  expect(validateSession(data).mode).toBe('guided');
  expect(() => validateSession({ ...data, events: data.events.slice(1) })).toThrow();
  expect(() => validateSession({ ...data, events: [...data.events].reverse() })).toThrow();
});
it('rejects assistance without consent', () => {
  const data = payload();
  data.events[0].assisted = true;
  expect(() => validateSession(data)).toThrow();
  data.events[0].confirmed = true;
  expect(validateSession(data).mode).toBe('assisted');
});
it('calculates game results, accepts mistakes, and validates lesson reading', () => {
  expect(validateAttempt({ activityId: 'scam-game', answers: [0], readPages: 1 }).correct).toBe(
    false,
  );
  expect(
    validateAttempt({ activityId: 'order-game', answers: [0, 1, 2], readPages: 1 }).correct,
  ).toBe(true);
  expect(() =>
    validateAttempt({ activityId: 'phone-basics', answers: [0], readPages: 0 }),
  ).toThrow();
});
