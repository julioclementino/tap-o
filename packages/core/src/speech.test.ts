import { expect, it, vi } from 'vitest';
import { SpeechCoordinator } from './speech';
it('stops previous speech before speaking and drops stale requests', async () => {
  const resolvers: (() => void)[] = [];
  const speak = vi.fn();
  const manager = new SpeechCoordinator({
    stop: () => new Promise<void>((resolve) => resolvers.push(resolve)),
    speak,
  });
  const first = manager.speak('first');
  const second = manager.speak('second');
  resolvers[0]();
  await first;
  expect(speak).not.toHaveBeenCalled();
  resolvers[1]();
  await second;
  expect(speak).toHaveBeenCalledExactlyOnceWith('second');
});
it('a blur/stop cancels a pending narration', async () => {
  const resolvers: (() => void)[] = [];
  const speak = vi.fn();
  const manager = new SpeechCoordinator({
    stop: () => new Promise<void>((resolve) => resolvers.push(resolve)),
    speak,
  });
  const narration = manager.speak('old screen');
  const stop = manager.stop();
  resolvers.forEach((resolve) => resolve());
  await Promise.all([narration, stop]);
  expect(speak).not.toHaveBeenCalled();
});
