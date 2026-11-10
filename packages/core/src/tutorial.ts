export type Screen =
  'contacts' | 'conversation' | 'calling' | 'bank' | 'balance' | 'statement' | 'help' | 'security';
export type EventType =
  | 'CONTACT_SELECTED'
  | 'FIELD_FOCUSED'
  | 'TEXT_ENTERED'
  | 'MESSAGE_SENT'
  | 'RECORD_STARTED'
  | 'RECORD_STOPPED'
  | 'AUDIO_PLAYED'
  | 'AUDIO_SENT'
  | 'CALL_OPENED'
  | 'CALL_CONFIRMED'
  | 'CALL_ENDED'
  | 'BALANCE_OPENED'
  | 'STATEMENT_OPENED'
  | 'HELP_OPENED'
  | 'SCAM_REJECTED';
/** Deliberately contains no message body, recording URI, credential, or screen content. */
export type TrainingEvent = {
  type: EventType;
  screen: Screen;
  target: string;
  valid: boolean;
  assisted: boolean;
  confirmed: boolean;
};
export type Step = {
  id: string;
  screen: Screen;
  instruction: string;
  speech: string;
  target: string;
  event: EventType;
  next: string | null;
  assistance: 'action' | 'confirm' | 'manual';
};
export type Tutorial = {
  id: string;
  title: string;
  goal: string;
  category: 'messages' | 'bank';
  steps: Step[];
};
function steps(items: [Screen, string, EventType, string, Step['assistance']][]): Step[] {
  return items.map(([screen, target, event, instruction, assistance], i) => ({
    id: `step-${i + 1}`,
    screen,
    target,
    event,
    instruction,
    speech: instruction,
    assistance,
    next: i < items.length - 1 ? `step-${i + 2}` : null,
  }));
}
const contact: [Screen, string, EventType, string, Step['assistance']] = [
  'contacts',
  'contact-ana',
  'CONTACT_SELECTED',
  'Toque em Ana para abrir a conversa de treinamento.',
  'action',
];
export const tutorials: Tutorial[] = [
  {
    id: 'message',
    title: 'Enviar uma mensagem',
    goal: 'Envie uma mensagem para Ana, um contato fictício.',
    category: 'messages',
    steps: steps([
      contact,
      [
        'conversation',
        'message-field',
        'FIELD_FOCUSED',
        'Toque no campo “Sua mensagem”. O teclado vai aparecer.',
        'action',
      ],
      [
        'conversation',
        'message-field',
        'TEXT_ENTERED',
        'Escreva uma mensagem curta. Por exemplo: Olá, Ana!',
        'action',
      ],
      [
        'conversation',
        'send-message',
        'MESSAGE_SENT',
        'Toque em “Enviar mensagem”. Ela aparecerá somente nesta conversa de treinamento.',
        'confirm',
      ],
    ]),
  },
  {
    id: 'audio',
    title: 'Gravar e enviar um áudio',
    goal: 'Grave, ouça e envie um áudio apenas nesta conversa fictícia.',
    category: 'messages',
    steps: steps([
      contact,
      [
        'conversation',
        'record-start',
        'RECORD_STARTED',
        'Toque em “Gravar áudio”. Você pode permitir o microfone ou usar o áudio demonstrativo.',
        'manual',
      ],
      ['conversation', 'record-stop', 'RECORD_STOPPED', 'Toque em “Parar gravação”.', 'manual'],
      [
        'conversation',
        'audio-play',
        'AUDIO_PLAYED',
        'Toque em “Ouvir áudio” e ouça antes de enviar.',
        'manual',
      ],
      [
        'conversation',
        'audio-send',
        'AUDIO_SENT',
        'Toque em “Enviar áudio”. Ele ficará somente nesta conversa de treinamento.',
        'manual',
      ],
    ]),
  },
  {
    id: 'call',
    title: 'Fazer uma ligação',
    goal: 'Experimente uma chamada fictícia com Ana.',
    category: 'messages',
    steps: steps([
      contact,
      [
        'conversation',
        'call-open',
        'CALL_OPENED',
        'Toque em “Ligar para Ana”. Nenhuma ligação real será feita.',
        'action',
      ],
      [
        'conversation',
        'call-confirm',
        'CALL_CONFIRMED',
        'Confirme que deseja iniciar a ligação de treinamento com Ana.',
        'confirm',
      ],
      ['calling', 'call-end', 'CALL_ENDED', 'Toque em “Encerrar ligação”.', 'action'],
    ]),
  },
  {
    id: 'balance',
    title: 'Encontrar o saldo',
    goal: 'Encontre um saldo fictício no Banco Horizonte.',
    category: 'bank',
    steps: steps([
      ['bank', 'balance', 'BALANCE_OPENED', 'Toque em “Ver saldo fictício”.', 'action'],
    ]),
  },
  {
    id: 'statement',
    title: 'Consultar o extrato',
    goal: 'Veja as movimentações fictícias do Banco Horizonte.',
    category: 'bank',
    steps: steps([
      ['bank', 'statement', 'STATEMENT_OPENED', 'Toque em “Consultar extrato”.', 'action'],
    ]),
  },
  {
    id: 'bank-help',
    title: 'Encontrar ajuda no banco',
    goal: 'Encontre o canal de ajuda demonstrativo.',
    category: 'bank',
    steps: steps([['bank', 'help', 'HELP_OPENED', 'Toque em “Ajuda do banco”.', 'action']]),
  },
  {
    id: 'security',
    title: 'Reconhecer uma mensagem suspeita',
    goal: 'Identifique uma solicitação suspeita de senha.',
    category: 'bank',
    steps: steps([
      [
        'security',
        'scam-reject',
        'SCAM_REJECTED',
        'Uma mensagem pede sua senha e um código. Toque em “Não compartilhar e buscar ajuda”.',
        'manual',
      ],
    ]),
  },
];
export function getTutorial(id: string): Tutorial {
  const item = tutorials.find((t) => t.id === id);
  if (!item) throw new Error('Atividade não encontrada.');
  return item;
}
export type TrainingState = {
  taskId: string;
  index: number;
  events: TrainingEvent[];
  guided: boolean;
  status: 'active' | 'completed' | 'ended';
};
export function startTraining(taskId: string): TrainingState {
  getTutorial(taskId);
  return { taskId, index: 0, events: [], guided: false, status: 'active' };
}
export function currentStep(state: TrainingState) {
  return getTutorial(state.taskId).steps[state.index];
}
export function transition(state: TrainingState, event: TrainingEvent): TrainingState {
  const step = currentStep(state);
  if (
    state.status !== 'active' ||
    !step ||
    !event.valid ||
    step.screen !== event.screen ||
    step.event !== event.type ||
    step.target !== event.target
  )
    return state;
  if (event.assisted && step.assistance === 'manual') return state;
  if ((event.assisted || event.type === 'CALL_CONFIRMED') && !event.confirmed) return state;
  const index = state.index + 1;
  return {
    ...state,
    index,
    events: [...state.events, event],
    status: index === getTutorial(state.taskId).steps.length ? 'completed' : 'active',
  };
}
export function resultMode(state: TrainingState): 'assisted' | 'guided' | 'independent' {
  return state.events.some((e) => e.assisted)
    ? 'assisted'
    : state.guided
      ? 'guided'
      : 'independent';
}
export const modeLabels = {
  assisted: 'Concluído com execução assistida',
  guided: 'Concluído com orientação',
  independent: 'Concluído sem ajuda',
};
/** Selection interface can later be implemented by a reviewed-content provider. */
export interface GuidanceProvider {
  resolve(state: TrainingState, screen: Screen): Step | undefined;
}
export const scriptedGuidance: GuidanceProvider = {
  resolve: (state, screen) =>
    state.status === 'active' && currentStep(state)?.screen === screen
      ? currentStep(state)
      : undefined,
};
