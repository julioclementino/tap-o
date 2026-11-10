import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultPreferences, type Preferences } from '@tap-o/core';
import { api, type PendingRecord } from '../services/api';
import { speech } from '../services/speech';
import { contrastColors, theme } from '../theme';
type ContextValue = {
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  colors: typeof theme.colors;
  reader: boolean;
  webVoiceApproved: boolean;
  approveWebVoice: () => void;
  ready: boolean;
  pending: PendingRecord[];
  storageError: string;
  submit: (record: PendingRecord) => Promise<void>;
  sync: () => Promise<void>;
};
const Context = createContext<ContextValue | null>(null);
const QUEUE = 'tap-o.pending.v1';
const PREFS = 'tap-o.preferences.v1';
export function AppProvider({ children }: React.PropsWithChildren) {
  const [prefs, updatePrefs] = useState(defaultPreferences);
  const [reader, setReader] = useState(true);
  const [webVoiceApproved, setWebVoiceApproved] = useState(false);
  const [ready, setReady] = useState(false);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const [pending, setPending] = useState<PendingRecord[]>([]);
  const [storageError, setStorageError] = useState('');
  const queue = useRef<PendingRecord[]>([]);
  const write = useRef(Promise.resolve());
  useEffect(() => {
    let alive = true;
    Promise.all([
      AsyncStorage.getItem(PREFS),
      AsyncStorage.getItem(QUEUE),
      // React Native Web returns a constant true, not actual screen-reader detection.
      Platform.OS === 'web' ? Promise.resolve(false) : AccessibilityInfo.isScreenReaderEnabled(),
      AccessibilityInfo.isReduceMotionEnabled(),
    ])
      .then(([p, q, sr, rm]) => {
        if (!alive) return;
        if (p)
          updatePrefs({
            ...defaultPreferences,
            ...JSON.parse(p),
            ...(rm ? { reducedMotion: true } : {}),
          });
        else if (rm) updatePrefs({ ...defaultPreferences, reducedMotion: true });
        if (q) {
          queue.current = JSON.parse(q);
          setPending(queue.current);
        }
        setReader(sr);
        setSystemReduceMotion(rm);
      })
      .catch(() => {
        if (alive) setStorageError('Não foi possível recuperar os dados locais.');
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    const sr = AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      setReader(enabled);
      if (enabled) void speech.stop();
    });
    const rm = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduceMotion);
    const state = AppState.addEventListener('change', (s) => {
      if (s !== 'active') void speech.stop();
    });
    return () => {
      alive = false;
      sr.remove();
      rm.remove();
      state.remove();
      void speech.stop();
    };
  }, []);
  function setPrefs(p: Preferences) {
    updatePrefs(p);
    if (!p.voiceEnabled) void speech.stop();
    void AsyncStorage.setItem(PREFS, JSON.stringify(p)).catch(() =>
      setStorageError('Preferências aplicadas apenas nesta abertura.'),
    );
  }
  function persistQueue(next: PendingRecord[]) {
    queue.current = next;
    setPending(next);
    write.current = write.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(QUEUE, JSON.stringify(next)));
    return write.current;
  }
  async function submit(record: PendingRecord) {
    await persistQueue([...queue.current.filter((p) => p.id !== record.id), record]).catch(() => {
      setStorageError(
        'Não foi possível guardar a tentativa neste aparelho. Mantenha esta tela aberta e tente salvar novamente.',
      );
    });
    await api(`/${record.kind}/${record.id}`, record.body);
    await persistQueue(queue.current.filter((p) => p.id !== record.id));
  }
  async function sync() {
    for (const item of [...queue.current]) await submit(item);
  }
  return (
    <Context.Provider
      value={{
        prefs: { ...prefs, reducedMotion: prefs.reducedMotion || systemReduceMotion },
        setPrefs,
        colors: prefs.highContrast ? contrastColors : theme.colors,
        reader,
        webVoiceApproved,
        approveWebVoice: () => setWebVoiceApproved(true),
        ready,
        pending,
        storageError,
        submit,
        sync,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('AppProvider missing');
  return value;
}
