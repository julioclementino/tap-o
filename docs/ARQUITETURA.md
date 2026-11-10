# Arquitetura do Tap-o

## Fronteiras

O aplicativo usa Expo Router em `apps/mobile/src/app`. Componentes compartilhados, simuladores, armazenamento e tema ficam fora da árvore de rotas. `packages/core` contém conteúdo revisável e regras puras, usadas tanto pelo aplicativo quanto pela API. O servidor Express usa `mysql2/promise`, consultas parametrizadas, Zod e transações MySQL.

O aplicativo só acessa a API. `EXPO_PUBLIC_API_URL` é o único endereço público de configuração; credenciais de banco nunca pertencem ao bundle. A API usa um perfil demonstrativo fixo, sem fingir autenticação. CORS restringe origens de navegador configuradas, mas não é autenticação.

## Tutorial por estados e eventos

Cada etapa define `screen`, `target`, `instruction`, `speech`, `event`, `next` e `assistance`. `transition` valida tipo, tela, alvo, validade da ação e confirmação. A interface produz eventos após a ação correspondente; foco, texto não vazio e envio são eventos diferentes. O texto digitado nunca faz parte do evento.

O `GuidanceProvider` resolve a orientação para a tela atual. O provedor atual é inteiramente programado. Uma implementação futura poderá buscar conteúdo revisado, sem mudar a interface. Perguntas livres não são interpretadas nem respondidas por IA nesta entrega.

`Target` envolve o próprio controle com borda e rótulo “Próximo passo”. Assim o destaque usa a geometria renderizada, acompanha fontes/layout e não intercepta toques. Não há coordenadas fixas, captura de tela ou OCR.

Ao tocar na tartaruga, a sessão registra uso de orientação. O timer de inatividade apenas mostra uma oferta; nunca chama uma ação. “Sim, me ajude” chama a mesma função do botão original. Para mensagem e ligação, há uma segunda confirmação com destinatário e efeito. Microfone, escuta, envio de áudio e escolha de segurança são passos manuais acompanhados por instruções.

A voz interrompe a fala anterior e descarta pedidos assíncronos antigos. Ao pausar, sair da rota, entrar em segundo plano ou detectar leitor de tela, a fala é interrompida. A reprodução/gravação de áudio bloqueia a narração; a instrução textual permanece. Movimento reduzido do sistema tem precedência sobre a animação de navegação.

## Persistência e falhas

Ao concluir, um UUID identifica a tentativa. Antes de chamar a API, o app registra localmente o payload mínimo em AsyncStorage. A API reprocessa todos os eventos pela mesma máquina de estados e grava sessão + conclusão na mesma transação. Reenvios com o mesmo UUID e conteúdo retornam sucesso sem duplicar; conteúdo incompatível retorna 409. O `INSERT ... ON DUPLICATE KEY UPDATE` sem alteração obtém um bloqueio exclusivo para serializar reenvios concorrentes.

A confirmação da API remove a tentativa da fila. Se a rede falhar, o item aparece como pendente até “Tentar salvar novamente” ou “Sincronizar agora”. Não há um progresso fictício substituindo o banco. Se nem o armazenamento local funcionar, a interface avisa para manter a tela aberta.

Tentativas incompletas são transitórias. Ao voltar/encerrar, param as orientações; após fechar a tela não há retomada dessa tentativa. Essa decisão evita registrar uma conclusão inexistente e mantém a primeira entrega simples. O histórico persistido contém eventos de tentativas concluídas, sem cronômetro obrigatório.

## Modelo de dados

| Tabela                        | Conteúdo                                            |
| ----------------------------- | --------------------------------------------------- |
| `profiles`                    | Identificador e nome do perfil demonstrativo        |
| `preferences`                 | Tamanho de texto, contraste, voz, movimento, espera |
| `tutorials`, `tutorial_steps` | Catálogo e definições das etapas                    |
| `training_sessions`           | Tarefa, eventos permitidos, modo de ajuda e data    |
| `completions`                 | Conclusão vinculada à sessão                        |
| `activities`                  | Aulas e jogos com conteúdo inicial                  |
| `activity_results`            | Tentativa, atividade, acerto/erro e data            |
| `satisfaction_feedback`       | Resposta opcional 1–3; não é NPS                    |
| `schema_migrations`           | Migrações aplicadas e checksum                      |

Migrações estão em `apps/server/migrations`. O runner usa lock MySQL e recusa alterações em migrações aplicadas. DDL MySQL não é transacional; a migração inicial usa `IF NOT EXISTS` para retomar uma execução interrompida. Acrescente novos arquivos para futuras mudanças, em vez de editar uma migração aplicada.

Os resultados dos jogos são calculados novamente na API. Aulas exigem leitura das páginas e resposta correta para entrar no total de aulas concluídas. Tentativas incorretas são armazenadas e explicadas, sem punição. Ordem de etapas é enviada como índices, sem texto pessoal.

## API

| Método e rota         | Função                                             |
| --------------------- | -------------------------------------------------- |
| `GET /health`         | Verifica API e conexão MySQL                       |
| `GET /demo`           | Perfil de teste                                    |
| `GET /catalog`        | Tutoriais e atividades                             |
| `GET /preferences`    | Preferências persistidas                           |
| `PUT /preferences`    | Valida e salva preferências                        |
| `PUT /sessions/:uuid` | Valida sequência completa e salva idempotentemente |
| `PUT /attempts/:uuid` | Calcula e registra tentativa de aula/jogo          |
| `PUT /feedback/:uuid` | Resposta de satisfação 1–3                         |
| `GET /progress`       | Totais e histórico reais do perfil de teste        |

Exemplo de evento permitido:

```json
{
  "type": "CONTACT_SELECTED",
  "screen": "contacts",
  "target": "contact-ana",
  "valid": true,
  "assisted": false,
  "confirmed": false
}
```

O servidor recusa campos desconhecidos. Não recebe mensagens, arquivos de áudio, senhas, códigos ou dados de outros apps. Limite do JSON: 24 KB. Erros internos retornam mensagem simples sem SQL, stack ou credenciais. O modelo confia no cliente demonstrativo para a ocorrência do evento; valida a consistência da sequência, não oferece prova antifraude nem telemetria autenticada.

## Métricas

“Tentativas concluídas” conta sessões, incluindo repetições; “Aulas concluídas” conta aulas distintas respondidas corretamente; “Jogos realizados” conta tentativas, certas ou erradas. O histórico mostra data, modo, número da tentativa e quantidade de passos assistidos.

Execução assistida nunca é chamada de domínio. Menos dúvidas não comprova autonomia; combine conclusão, uso de ajuda e novas tentativas independentes. Não há usuários ativos, conversão, NPS ou números comerciais fabricados.

## Evolução futura

Uma camada Android nativa poderá adaptar eventos e ações do sistema para contratos específicos, sujeita a permissões, consentimento, revisão de segurança, acessibilidade e políticas da plataforma. Nenhum serviço de acessibilidade Android foi criado agora. Não há promessa de controle equivalente de outros aplicativos no iOS.

Antes de múltiplos usuários/rede pública: autenticação, autorização por perfil, limites de requisição, TLS, política de retenção, consentimento e isolamento do modo família. Nesta entrega o modo família apenas consulta o perfil demonstrativo local. Personalização, trilhas aprofundadas e modo família completo são extras futuros; o essencial permanece gratuito.
