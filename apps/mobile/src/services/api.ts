import type { Preferences, TrainingEvent } from '@tap-o/core';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
class ApiFailure extends Error {}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: body === undefined ? 'GET' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiFailure(data.message || 'Não foi possível salvar. Tente novamente.');
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiFailure) throw error;
    throw new Error('Sem conexão com o servidor. Confira a rede e tente novamente.');
  } finally {
    clearTimeout(timeout);
  }
}
export type SessionPayload = { taskId: string; guided: boolean; events: TrainingEvent[] };
export type PendingRecord = {
  id: string;
  kind: 'sessions' | 'attempts' | 'feedback';
  title: string;
  body:
    | SessionPayload
    | { activityId: string; answers: number[]; readPages: number }
    | { rating: number };
};
export type Progress = {
  totals: {
    tasks: number;
    lessons: number;
    games: number;
    guided: number;
    assisted: number;
    independent: number;
  };
  sessions: {
    id: string;
    taskId: string;
    title: string;
    mode: 'guided' | 'assisted' | 'independent';
    guided: boolean;
    completedAt: string;
    assistedSteps: number;
  }[];
  results: { id: string; activityId: string; kind: 'lesson' | 'game'; correct: boolean }[];
};
export const savePreferences = (value: Preferences) => api<Preferences>('/preferences', value);
