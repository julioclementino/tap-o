import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { AppState, Keyboard, Platform, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import {
  currentStep,
  getTutorial,
  modeLabels,
  resultMode,
  scriptedGuidance,
  startTraining,
  transition,
  type EventType,
  type Screen as TrainingScreenName,
  type TrainingEvent,
} from '@tap-o/core';
import {
  Button,
  Card,
  Confirm,
  Icon,
  MascotHelp,
  Notice,
  Screen,
  T,
  Target,
} from '../../components/ui';
import { useApp } from '../../state/AppProvider';
import { speech } from '../../services/speech';
import type { PendingRecord } from '../../services/api';
import { AudioPractice } from './audio';
type Confirmation = { title: string; detail: string; label: string; execute: () => void; cancelLabel?: string; cancel?: () => void };
export function TrainingScreen({ taskId, independent }: { taskId: string; independent: boolean }) {
  const tutorial = getTutorial(taskId);
  const app = useApp();
  const { colors, prefs, reader } = app;
  const [state, setState] = useState(() => startTraining(taskId));
  const stateRef = useRef(state);
  const [screen, setScreen] = useState<TrainingScreenName>(tutorial.steps[0].screen);
  const [guide, setGuide] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [offer, setOffer] = useState(false);
  const [activity, setActivity] = useState(0);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [callPrompt, setCallPrompt] = useState(false);
  const [hint, setHint] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [audioBusy, setAudioBusy] = useState(false);
  const sessionId = useRef(Crypto.randomUUID());
  const completion = useRef<PendingRecord | null>(null);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const step = currentStep(state);
  const guidance = scriptedGuidance.resolve(state, screen);
  const helping = guide && !paused && focused;
  const canSpeak = prefs.voiceEnabled && !reader && (Platform.OS !== 'web' || app.webVoiceApproved);
  const submitRef = useRef(app.submit);
  useEffect(() => {
    submitRef.current = app.submit;
  }, [app.submit]);
  function update(next: typeof state) {
    stateRef.current = next;
    setState(next);
  }
  function interact() {
    setOffer(false);
    setActivity((n) => n + 1);
  }
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setPaused(true);
        setOffer(false);
        setConfirmation(null);
        void speech.stop();
      };
    }, []),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (value) => {
      if (value !== 'active') {
        setPaused(true);
        setOffer(false);
        setConfirmation(null);
        void speech.stop();
      }
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (helping && guidance && canSpeak && !audioBusy && !confirmation)
      void speech.speak(guidance.speech);
    else void speech.stop();
    return () => {
      void speech.stop();
    };
  }, [helping, guidance, canSpeak, audioBusy, confirmation]);
  useEffect(() => {
    if (!helping || !guidance || confirmation || audioBusy) return;
    const timer = setTimeout(() => setOffer(true), prefs.inactivitySeconds * 1000);
    return () => clearTimeout(timer);
  }, [helping, guidance, activity, prefs.inactivitySeconds, confirmation, audioBusy]);
  const persist = useCallback(async (record: PendingRecord) => {
    setSaveStatus('saving');
    setSaveError('');
    try {
      await submitRef.current(record);
      setSaveStatus('saved');
    } catch (error) {
      setSaveError((error as Error).message);
      setSaveStatus('error');
    }
  }, []);
  useEffect(() => {
    if (state.status !== 'completed' || completion.current) return;
    Keyboard.dismiss();
    void speech.stop();
    setOffer(false);
    const record: PendingRecord = {
      id: sessionId.current,
      kind: 'sessions',
      title: tutorial.title,
      body: { taskId, guided: state.guided, events: state.events },
    };
    completion.current = record;
    void persist(record);
  }, [state, taskId, tutorial.title, persist]);
  function emit(type: EventType, target: string, options: Partial<TrainingEvent> = {}) {
    interact();
    const event: TrainingEvent = {
      type,
      target,
      screen,
      valid: true,
      assisted: false,
      confirmed: false,
      ...options,
    };
    const next = transition(stateRef.current, event);
    update(next);
  }
  function askHelp() {
    interact();
    update({ ...stateRef.current, guided: true });
    setGuide(true);
    setPaused(false);
    if (Platform.OS === 'web' && !app.webVoiceApproved && prefs.voiceEnabled) {
      setConfirmation({ title: 'Quer ouvir as orientações?', detail: 'Se você usa um leitor de tela, escolha somente texto para evitar duas vozes ao mesmo tempo. O navegador não consegue detectar seu leitor de tela.', label: 'Ouvir a voz do Tap-o', execute: app.approveWebVoice, cancelLabel: 'Continuar somente com texto', cancel: () => app.setPrefs({ ...prefs, voiceEnabled: false }) });
      return;
    }
    if (helping && guidance && canSpeak && !audioBusy)
      void speech.speak(guidance.speech);
  }
  function selectContact(assisted = false) {
    emit('CONTACT_SELECTED', 'contact-ana', { assisted, confirmed: assisted });
    setScreen('conversation');
  }
  function focusField(assisted = false) {
    emit('FIELD_FOCUSED', 'message-field', { assisted, confirmed: assisted });
    input.current?.focus();
  }
  function changeText(value: string, assisted = false) {
    setDraft(value);
    emit('TEXT_ENTERED', 'message-field', {
      valid: value.trim().length > 0,
      assisted,
      confirmed: assisted,
    });
  }
  function sendMessage(assisted = false) {
    if (!draft.trim() || stateRef.current.index !== 3) return;
    void speech.stop();
    setConfirmation({
      title: 'Enviar mensagem de treinamento?',
      detail: `A mensagem “${draft}” aparecerá apenas na conversa fictícia com Ana. Ninguém receberá uma mensagem real.`,
      label: 'Confirmar envio para Ana',
      execute: () => {
        setMessages((m) => [...m, draft]);
        emit('MESSAGE_SENT', 'send-message', { assisted, confirmed: true, valid: !!draft.trim() });
        setDraft('');
      },
    });
  }
  function openCall(assisted = false) {
    emit('CALL_OPENED', 'call-open', { assisted, confirmed: assisted });
    setCallPrompt(true);
  }
  function confirmCall(assisted = false) {
    void speech.stop();
    setConfirmation({
      title: 'Ligar para Ana no treinamento?',
      detail:
        'A tela mostrará uma chamada fictícia. Não será usado o telefone e ninguém receberá uma ligação.',
      label: 'Confirmar ligação de treinamento',
      execute: () => {
        emit('CALL_CONFIRMED', 'call-confirm', { assisted, confirmed: true });
        setCallPrompt(false);
        setScreen('calling');
      },
    });
  }
  function endCall(assisted = false) {
    emit('CALL_ENDED', 'call-end', { assisted, confirmed: assisted });
    setScreen('conversation');
  }
  function bankAction(target: 'balance' | 'statement' | 'help', assisted = false) {
    const events = {
      balance: 'BALANCE_OPENED',
      statement: 'STATEMENT_OPENED',
      help: 'HELP_OPENED',
    } as const;
    emit(events[target], target, { assisted, confirmed: assisted });
    setScreen(target);
  }
  function assist() {
    interact();
    if (!step || !helping) return;
    if (step.assistance === 'manual') {
      setHint(
        'Este passo é seu: toque no botão indicado. Posso repetir a explicação quantas vezes quiser.',
      );
      return;
    }
    switch (step.event) {
      case 'CONTACT_SELECTED':
        selectContact(true);
        break;
      case 'FIELD_FOCUSED':
        focusField(true);
        break;
      case 'TEXT_ENTERED':
        changeText('Olá, Ana! Tudo bem?', true);
        break;
      case 'MESSAGE_SENT':
        sendMessage(true);
        break;
      case 'CALL_OPENED':
        openCall(true);
        break;
      case 'CALL_CONFIRMED':
        confirmCall(true);
        break;
      case 'CALL_ENDED':
        endCall(true);
        break;
      case 'BALANCE_OPENED':
        bankAction('balance', true);
        break;
      case 'STATEMENT_OPENED':
        bankAction('statement', true);
        break;
      case 'HELP_OPENED':
        bankAction('help', true);
        break;
      default:
        setHint('Use o controle indicado para este passo.');
    }
  }
  const highlight = (target: string) => helping && guidance?.target === target;
  function leave() {
    void speech.stop();
    setPaused(true);
    setConfirmation({
      title: 'Encerrar este tutorial?',
      detail:
        state.status === 'completed'
          ? 'A tentativa concluída ficará disponível no progresso ou na fila de sincronização.'
          : 'Esta tentativa ainda não terminou e não contará como conclusão. Você pode começar novamente quando quiser.',
      label: 'Encerrar tutorial',
      execute: () => {
        update({ ...stateRef.current, status: 'ended' });
        router.replace('/home');
      },
    });
  }
  return (
    <Screen
      title={tutorial.category === 'messages' ? 'Conversas' : 'Banco Horizonte'}
      subtitle="Ambiente de treinamento"
      nav={false}
      help={false}
      onBack={leave}
    >
      <Card style={{ backgroundColor: colors.softGreen }}>
        <T variant="label">{tutorial.title}</T>
        <T>{tutorial.goal}</T>
        <T variant="small">
          {state.status === 'completed'
            ? 'Etapas concluídas'
            : `Passo ${state.index + 1} de ${tutorial.steps.length}`}
          {independent && !state.guided ? ' · Prática independente' : ''}
        </T>
      </Card>
      {state.status !== 'completed' && (
        <>
          <MascotHelp compact onPress={askHelp} />
          {guide && (
            <Card>
              <T variant="small">{paused ? 'AJUDA PAUSADA' : 'ORIENTAÇÃO DO TAP-O'}</T>
              <T accessibilityLiveRegion="polite">
                {guidance?.instruction || 'Volte à tela da atividade para continuar.'}
              </T>
              {reader && (
                <T variant="small">
                  Leitor de tela detectado: a voz automática do Tap-o está desligada.
                </T>
              )}
              <Button
                label={paused ? 'Retomar ajuda' : 'Repetir orientação'}
                icon="volume-2"
                kind="secondary"
                onPress={askHelp}
              />
              <Button
                label="Pausar ajuda"
                icon="pause"
                kind="quiet"
                onPress={() => {
                  setPaused(true);
                  setOffer(false);
                  void speech.stop();
                }}
              />
              <Button
                label={prefs.voiceEnabled ? 'Desligar voz' : 'Ligar voz'}
                icon={prefs.voiceEnabled ? 'volume-x' : 'volume-2'}
                kind="quiet"
                onPress={() => app.setPrefs({ ...prefs, voiceEnabled: !prefs.voiceEnabled })}
              />
            </Card>
          )}
          {offer && (
            <Card>
              <T variant="label">Quer que eu faça este passo com você?</T>
              <Button label="Sim, me ajude" onPress={assist} />
              <Button label="Vou tentar" kind="secondary" onPress={interact} />
            </Card>
          )}
          {hint && <Notice>{hint}</Notice>}
        </>
      )}
      {screen === 'contacts' && (
        <Card>
          <T variant="subtitle">Seus contatos de treinamento</T>
          <T>Vamos conversar com Ana.</T>
          <Target active={highlight('contact-ana')}>
            <Button
              label="Ana · contato fictício"
              icon="user"
              kind="secondary"
              onPress={() => selectContact()}
            />
          </Target>
          <T variant="small">Nenhum contato do seu celular é acessado.</T>
        </Card>
      )}
      {screen === 'conversation' && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="user" />
            <View>
              <T variant="subtitle">Ana</T>
              <T variant="small">Contato fictício</T>
            </View>
          </View>
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.background }}>
            <T>Olá! Esta é nossa conversa de treinamento.</T>
          </View>
          {messages.map((message, index) => (
            <View
              key={index}
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.softGreen,
                alignSelf: 'flex-end',
                maxWidth: '95%',
              }}
            >
              <T>{message}</T>
              <T variant="small">✓ Enviada no treinamento</T>
            </View>
          ))}
          {taskId === 'message' && state.status !== 'completed' && (
            <>
              <Target active={highlight('message-field')}>
                <T variant="small">Sua mensagem</T>
                <TextInput
                  ref={input}
                  accessibilityLabel="Sua mensagem"
                  placeholder="Escreva aqui…"
                  placeholderTextColor={colors.muted}
                  value={draft}
                  onFocus={() => emit('FIELD_FOCUSED', 'message-field')}
                  onChangeText={(text) => changeText(text)}
                  multiline
                  maxLength={300}
                  style={{
                    minHeight: 92,
                    padding: 16,
                    fontSize: 20 * prefs.textScale,
                    color: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1.5,
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                  }}
                />
              </Target>
              <Target active={highlight('send-message')}>
                <Button
                  label="Enviar mensagem"
                  icon="send"
                  onPress={() => sendMessage()}
                  disabled={!draft.trim() || state.index !== 3}
                />
              </Target>
            </>
          )}
          {taskId === 'call' && state.status !== 'completed' && (
            <>
              {!callPrompt ? (
                <Target active={highlight('call-open')}>
                  <Button label="Ligar para Ana" icon="phone" onPress={() => openCall()} />
                </Target>
              ) : (
                <Target active={highlight('call-confirm')}>
                  <Button
                    label="Iniciar ligação de treinamento"
                    icon="phone"
                    onPress={() => confirmCall()}
                  />
                </Target>
              )}
            </>
          )}
          {taskId === 'audio' && (
            <AudioPractice
              emit={emit}
              highlight={highlight}
              completed={state.status === 'completed'}
              focused={focused}
              setBusy={setAudioBusy}
              onRestart={() =>
                router.replace({
                  pathname: '/training/[task]',
                  params: { task: 'audio', run: Crypto.randomUUID() },
                })
              }
            />
          )}
        </Card>
      )}
      {screen === 'calling' && (
        <Card>
          <Icon name="phone-call" size={48} />
          <T variant="subtitle">Ligação simulada com Ana</T>
          <T>Nenhum som está sendo transmitido. Nenhuma chamada real foi feita.</T>
          <Target active={highlight('call-end')}>
            <Button
              label="Encerrar ligação"
              icon="phone-off"
              kind="danger"
              onPress={() => endCall()}
            />
          </Target>
        </Card>
      )}
      {screen === 'bank' && (
        <Card>
          <T variant="subtitle">Bem-vindo ao Banco Horizonte</T>
          <T>Conta fictícia · Pessoa visitante</T>
          {(['balance', 'statement', 'help'] as const).map((target) => (
            <Target key={target} active={highlight(target)}>
              <Button
                kind="secondary"
                label={
                  {
                    balance: 'Ver saldo fictício',
                    statement: 'Consultar extrato',
                    help: 'Ajuda do banco',
                  }[target]
                }
                onPress={() => bankAction(target)}
              />
            </Target>
          ))}
        </Card>
      )}
      {screen === 'balance' && (
        <Card>
          <T>Saldo fictício disponível</T>
          <T variant="hero">R$ 1.250,00</T>
          <T variant="small">Valor demonstrativo. Não representa dinheiro real.</T>
        </Card>
      )}
      {screen === 'statement' && (
        <Card>
          <T variant="subtitle">Extrato fictício</T>
          <T>Saldo inicial: R$ 1.500,00</T>
          <T>Compra demonstrativa: − R$ 250,00</T>
          <T>Saldo final: R$ 1.250,00</T>
        </Card>
      )}
      {screen === 'help' && (
        <Card>
          <T variant="subtitle">Ajuda do Banco Horizonte</T>
          <T>
            Em um aplicativo real, procure os canais oficiais da instituição. Este é apenas um
            exemplo de onde a ajuda pode ficar.
          </T>
        </Card>
      )}
      {['balance', 'statement', 'help'].includes(screen) && state.status !== 'completed' && (
        <Button
          label="Voltar ao banco"
          kind="secondary"
          onPress={() => {
            setScreen('bank');
            interact();
          }}
        />
      )}
      {screen === 'security' && (
        <Card>
          <T variant="subtitle">Mensagem fictícia recebida</T>
          <T>“Sua conta será bloqueada! Envie sua senha e o código recebido agora.”</T>
          <Button
            label="Compartilhar a senha"
            kind="secondary"
            onPress={() => {
              interact();
              setHint(
                'Pedido de senha com urgência é um sinal de alerta. Não compartilhe. Procure ajuda por um canal oficial.',
              );
            }}
            disabled={state.status === 'completed'}
          />
          <Target active={highlight('scam-reject')}>
            <Button
              label="Não compartilhar e buscar ajuda"
              onPress={() => emit('SCAM_REJECTED', 'scam-reject')}
              disabled={state.status === 'completed'}
            />
          </Target>
        </Card>
      )}
      {state.status === 'completed' && (
        <Card>
          <Icon name="check-circle" size={40} color={colors.green} />
          <T variant="subtitle">Você concluiu esta tentativa!</T>
          <T>{modeLabels[resultMode(state)]}</T>
          {resultMode(state) === 'assisted' && (
            <T>
              Fizemos alguns passos juntos. Uma nova prática sem ajuda pode mostrar o que você já
              consegue fazer.
            </T>
          )}
          {saveStatus === 'saved' ? (
            <Notice>Resultado salvo no MySQL.</Notice>
          ) : saveStatus === 'error' ? (
            <>
              <Notice error>{saveError} Sincronização pendente.</Notice>
              <Button
                label="Tentar salvar novamente"
                onPress={() => completion.current && void persist(completion.current)}
              />
            </>
          ) : (
            <T>Salvando resultado…</T>
          )}
          <Button
            label="Ver meu progresso"
            icon="bar-chart-2"
            onPress={() => router.replace('/progress')}
          />
          <Button
            label="Praticar novamente sem ajuda"
            kind="secondary"
            onPress={() =>
              router.replace({
                pathname: '/training/[task]',
                params: { task: taskId, independent: '1', run: Crypto.randomUUID() },
              })
            }
          />
        </Card>
      )}
      <Button label="Encerrar tutorial" kind="quiet" onPress={leave} />
      {confirmation && (
        <Confirm
          title={confirmation.title}
          detail={confirmation.detail}
          confirmLabel={confirmation.label}
          cancelLabel={confirmation.cancelLabel}
          onCancel={() => {
            confirmation.cancel?.();
            setConfirmation(null);
            interact();
          }}
          onConfirm={() => {
            const action = confirmation.execute;
            setConfirmation(null);
            action();
          }}
        />
      )}
    </Screen>
  );
}
