export type Activity = {
  id: string;
  kind: 'lesson' | 'game';
  title: string;
  description: string;
  content: string[];
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};
export const activities: Activity[] = [
  {
    id: 'phone-basics',
    kind: 'lesson',
    title: 'Primeiros passos no celular',
    description: 'Toques, leitura e tempo para aprender.',
    content: [
      'Um toque curto abre um botão. Você não precisa apertar com força.',
      'Leia o nome do botão antes de tocar. Para voltar, procure “Voltar”.',
      'Se o texto estiver pequeno, aumente em Preferências. Aprender não tem prazo.',
    ],
    question: 'O texto está pequeno. O que pode ajudar?',
    options: ['Aumentar o tamanho do texto', 'Tocar mais forte na tela', 'Desistir da leitura'],
    answer: 0,
    explanation:
      'Aumentar o texto facilita a leitura. Você pode ajustar isso nas Preferências do Tap-o.',
  },
  {
    id: 'communication',
    kind: 'lesson',
    title: 'Mensagens, áudios e ligações',
    description: 'Escolha como conversar.',
    content: [
      'Primeiro, confira o nome da pessoa com quem deseja falar.',
      'Escreva uma mensagem ou grave um áudio. Leia ou ouça antes de enviar.',
      'Uma ligação começa depois que você escolhe o contato e confirma. Aqui tudo é treinamento.',
    ],
    question: 'Antes de enviar um áudio, você pode…',
    options: ['Enviar sem conferir o contato', 'Ouvir a gravação', 'Compartilhar uma senha'],
    answer: 1,
    explanation: 'Ouvir a gravação ajuda a conferir se ela ficou como você queria.',
  },
  {
    id: 'digital-safety',
    kind: 'lesson',
    title: 'Segurança digital',
    description: 'Uma pausa pode proteger você.',
    content: [
      'Desconfie de mensagens que pedem senha, código ou uma decisão urgente.',
      'Não compartilhe senhas nem códigos recebidos por mensagem.',
      'Pare a conversa e procure um canal oficial que você já conhece. Não use o link enviado na mensagem suspeita.',
    ],
    question: 'Alguém pediu um código por mensagem. O que fazer?',
    options: [
      'Enviar rapidamente',
      'Publicar o código',
      'Não compartilhar e procurar ajuda oficial',
    ],
    answer: 2,
    explanation: 'Guarde o código para você. Procure um canal oficial por conta própria.',
  },
  {
    id: 'icon-game',
    kind: 'game',
    title: 'Qual é o ícone?',
    description: 'Reconheça controles do dia a dia.',
    content: [
      'Ícones são pequenos desenhos que ajudam a reconhecer uma ação. Leia também o rótulo.',
    ],
    question: 'Qual controle você usaria para gravar sua voz?',
    options: ['Microfone — gravar áudio', 'Lixeira — descartar', 'Lupa — buscar'],
    answer: 0,
    explanation:
      'O microfone representa a gravação de voz. A lixeira descarta e a lupa ajuda a buscar.',
  },
  {
    id: 'scam-game',
    kind: 'game',
    title: 'Pode confiar?',
    description: 'Aprenda a reconhecer sinais de golpe.',
    content: [
      'Exemplo fictício: “Sua conta será bloqueada agora! Envie sua senha e o código recebido.”',
    ],
    question: 'Qual é a atitude mais segura?',
    options: [
      'Enviar o código para resolver logo',
      'Não compartilhar e procurar um canal oficial',
      'Encaminhar a senha a um amigo',
    ],
    answer: 1,
    explanation:
      'Urgência e pedido de senha são sinais de alerta. Pare e confira por um canal oficial.',
  },
  {
    id: 'order-game',
    kind: 'game',
    title: 'Um passo de cada vez',
    description: 'Coloque uma mensagem na ordem.',
    content: ['Toque nas etapas na ordem em que você enviaria uma mensagem. Você pode recomeçar.'],
    question: 'Qual é a ordem para enviar uma mensagem?',
    options: ['Escolher o contato', 'Escrever a mensagem', 'Conferir e enviar'],
    answer: 0,
    explanation: 'Primeiro escolha a pessoa, depois escreva e, por último, confira e envie.',
  },
];
export const defaultPreferences = {
  textScale: 1,
  highContrast: false,
  voiceEnabled: true,
  reducedMotion: false,
  inactivitySeconds: 25,
};
export type Preferences = typeof defaultPreferences;
