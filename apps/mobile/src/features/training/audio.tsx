import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from 'expo-audio';
import type { EventType, TrainingEvent } from '@tap-o/core';
import { Button, Confirm, Notice, T, Target } from '../../components/ui';
import { speech } from '../../services/speech';
import { discardRecording } from '../../services/recording';
type Props = {
  emit: (type: EventType, target: string, options?: Partial<TrainingEvent>) => unknown;
  highlight: (target: string) => boolean;
  completed: boolean;
  focused: boolean;
  setBusy: (busy: boolean) => void;
  onRestart: () => void;
};
export function AudioPractice({ emit, highlight, completed, focused, setBusy, onRestart }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(require('../../../assets/audio/demo.wav'));
  const status = useAudioPlayerStatus(player);
  const [stage, setStage] = useState<'idle' | 'recording' | 'recorded' | 'heard'>('idle');
  const [demo, setDemo] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const recordedUri = useRef<string | null>(null);
  const alive = useRef(true);
  const active = useRef(focused);
  const heard = useRef(false);
  const requestedPlay = useRef(false);
  const propsRef = useRef({ emit, setBusy });
  useEffect(() => {
    active.current = focused;
    propsRef.current = { emit, setBusy };
  }, [focused, emit, setBusy]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      discardRecording(recordedUri.current);
    };
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (value) => {
      if (value !== 'active') {
        active.current = false;
        player.pause();
        requestedPlay.current = false;
        setConfirm(false);
        if (recorder.isRecording) {
          void recorder
            .stop()
            .then(() => discardRecording(recorder.uri))
            .catch(() => {});
          setInterrupted(true);
          setError(
            'A gravação foi interrompida ao sair do aplicativo. Descarte e recomece quando quiser.',
          );
        }
        propsRef.current.setBusy(false);
      } else {
        active.current = focused;
      }
    });
    return () => subscription.remove();
  }, [focused, player, recorder]);
  useEffect(() => {
    if (!focused) {
      player.pause();
      requestedPlay.current = false;
      if (recorder.isRecording) {
        void recorder
          .stop()
          .then(() => {
            discardRecording(recorder.uri);
            if (alive.current) setInterrupted(true);
          })
          .catch(() => {});
      }
      propsRef.current.setBusy(false);
    }
    return () => {
      player.pause();
      if (recorder.isRecording)
        void recorder
          .stop()
          .then(() => discardRecording(recorder.uri))
          .catch(() => {});
    };
  }, [focused, player, recorder]);
  useEffect(() => {
    if (status.didJustFinish && requestedPlay.current && !heard.current) {
      heard.current = true;
      requestedPlay.current = false;
      setStage('heard');
      propsRef.current.setBusy(false);
      propsRef.current.emit('AUDIO_PLAYED', 'audio-play');
    }
  }, [status.didJustFinish]);
  async function start() {
    setWorking(true);
    setError('');
    await speech.stop();
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!alive.current || !active.current) return;
      if (!permission.granted) {
        setFallback(true);
        setError('O microfone não foi permitido. Você pode continuar com um áudio demonstrativo.');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });
      await recorder.prepareToRecordAsync();
      if (!alive.current || !active.current) {
        await recorder.stop().catch(() => {});
        return;
      }
      recorder.record();
      recordedUri.current = recorder.uri;
      setBusy(true);
      setStage('recording');
      emit('RECORD_STARTED', 'record-start');
    } catch {
      setFallback(true);
      setError('Não conseguimos abrir o microfone. Você pode usar o áudio demonstrativo.');
    } finally {
      if (alive.current) setWorking(false);
    }
  }
  function startDemo() {
    void speech.stop();
    setDemo(true);
    setFallback(false);
    setError('');
    setStage('recording');
    emit('RECORD_STARTED', 'record-start');
    setBusy(true);
  }
  async function stop() {
    setWorking(true);
    try {
      if (!demo) {
        await recorder.stop();
        if (!recorder.uri) throw new Error('No recording');
        recordedUri.current = recorder.uri;
        player.replace({ uri: recorder.uri });
      }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setStage('recorded');
      emit('RECORD_STOPPED', 'record-stop');
    } catch {
      setError(
        'Não foi possível preparar a gravação. Descarte e tente novamente com o áudio demonstrativo.',
      );
    } finally {
      setBusy(false);
      setWorking(false);
    }
  }
  async function play() {
    setError('');
    await speech.stop();
    try {
      await player.seekTo(0);
      requestedPlay.current = true;
      setBusy(true);
      player.play();
    } catch {
      setBusy(false);
      setError('Não foi possível ouvir o áudio. Tente novamente.');
    }
  }
  return (
    <>
      <T variant="small">O áudio fica neste aparelho. Nenhuma gravação é enviada ao servidor.</T>
      {error && <Notice error>{error}</Notice>}
      {demo && (
        <Notice>
          Áudio demonstrativo: “Olá, Ana! Esta é uma mensagem de treinamento do Tap-o.” Não é uma
          gravação da sua voz.
        </Notice>
      )}
      {completed ? (
        <Notice>Áudio enviado somente à conversa simulada.</Notice>
      ) : (
        <>
          {stage === 'idle' && (
            <>
              <Target active={highlight('record-start')}>
                <Button
                  label={working ? 'Preparando microfone…' : 'Gravar áudio'}
                  icon="mic"
                  onPress={() => void start()}
                  disabled={working}
                />
              </Target>
              <Button
                label="Usar áudio demonstrativo"
                kind="secondary"
                onPress={startDemo}
                disabled={working}
              />
              {fallback && <T>A alternativa demonstrativa está disponível no botão acima.</T>}
            </>
          )}
          {stage === 'recording' && !interrupted && (
            <>
              <T>
                {demo
                  ? 'Áudio demonstrativo preparado. Toque em Parar gravação para continuar.'
                  : 'Gravando sua voz… Fale uma frase curta.'}
              </T>
              <Target active={highlight('record-stop')}>
                <Button
                  label="Parar gravação"
                  icon="square"
                  onPress={() => void stop()}
                  disabled={working}
                />
              </Target>
            </>
          )}
          {(stage === 'recorded' || stage === 'heard') && (
            <>
              <Target active={highlight('audio-play')}>
                <Button
                  label="Ouvir áudio"
                  icon="play"
                  onPress={() => void play()}
                  disabled={status.playing}
                />
              </Target>
              {status.playing && (
                <Button
                  label="Pausar áudio"
                  kind="secondary"
                  onPress={() => {
                    player.pause();
                    requestedPlay.current = false;
                    setBusy(false);
                  }}
                />
              )}
              <Target active={highlight('audio-send')}>
                <Button
                  label="Enviar áudio"
                  icon="send"
                  disabled={stage !== 'heard' || status.playing}
                  onPress={() => {
                    void speech.stop();
                    setConfirm(true);
                  }}
                />
              </Target>
            </>
          )}
          {stage !== 'idle' && (
            <Button
              label="Descartar áudio e recomeçar"
              kind="quiet"
              onPress={() => {
                player.pause();
                if (recorder.isRecording) void recorder.stop().catch(() => {});
                setBusy(false);
                onRestart();
              }}
            />
          )}
        </>
      )}
      {confirm && (
        <Confirm
          title="Enviar áudio de treinamento?"
          detail="Este áudio aparecerá somente na conversa fictícia com Ana. Ele não será enviado ao servidor nem a outra pessoa."
          confirmLabel="Confirmar envio do áudio"
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            emit('AUDIO_SENT', 'audio-send', { confirmed: true });
          }}
        />
      )}
    </>
  );
}
