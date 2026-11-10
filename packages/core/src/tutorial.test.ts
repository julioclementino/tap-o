import { describe, expect, it } from 'vitest';
import {
  currentStep,
  getTutorial,
  resultMode,
  scriptedGuidance,
  startTraining,
  transition,
  tutorials,
  type TrainingEvent,
} from './tutorial';
const expected = (id = 'message'): TrainingEvent => {
  const s = getTutorial(id).steps[0];
  return {
    type: s.event,
    screen: s.screen,
    target: s.target,
    valid: true,
    assisted: false,
    confirmed: false,
  };
};
describe('tutorial state machine', () => {
  it('ignores arbitrary taps, wrong screens, targets and invalid actions', () => {
    const s = startTraining('message');
    for (const patch of [
      { type: 'MESSAGE_SENT' },
      { screen: 'bank' },
      { target: 'other' },
      { valid: false },
    ])
      expect(transition(s, { ...expected(), ...patch } as TrainingEvent)).toBe(s);
  });
  it('never executes or advances because of time; assistance requires explicit consent', () => {
    const s = startTraining('message');
    expect(transition(s, { ...expected(), assisted: true })).toBe(s);
    expect(transition(s, { ...expected(), assisted: true, confirmed: true }).index).toBe(1);
  });
  it.each(tutorials)('finishes $id only in its expected order', (t) => {
    let s = startTraining(t.id);
    for (const step of t.steps)
      s = transition(s, {
        type: step.event,
        screen: step.screen,
        target: step.target,
        valid: true,
        assisted: false,
        confirmed: true,
      });
    expect(s.status).toBe('completed');
    expect(s.events).toHaveLength(t.steps.length);
    expect(transition(s, expected(t.id))).toBe(s);
  });
  it('distinguishes assisted, guided and independent completion', () => {
    const s = startTraining('message');
    expect(resultMode(s)).toBe('independent');
    expect(resultMode({ ...s, guided: true })).toBe('guided');
    expect(resultMode(transition(s, { ...expected(), assisted: true, confirmed: true }))).toBe(
      'assisted',
    );
  });
  it('does not narrate another screen or an ended tutorial', () => {
    const s = startTraining('message');
    expect(scriptedGuidance.resolve(s, 'bank')).toBeUndefined();
    expect(scriptedGuidance.resolve({ ...s, status: 'ended' }, 'contacts')).toBeUndefined();
    expect(currentStep(s).target).toBe('contact-ana');
  });
});
