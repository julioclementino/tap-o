# Tap-o

Projeto Integrador | Acessibilidade digital

Protótipo mobile em **React Native + Expo 58 + TypeScript**, com Expo Router, API Express e **MySQL 8**. A tartaruga original acompanha treinamentos dentro do Tap-o. Não há integração com WhatsApp, bancos reais, OCR, controle do sistema ou dependência de IA.

O percurso de demonstração é: perfil de teste → aprender a enviar uma mensagem → tocar na tartaruga → seguir quatro etapas → confirmar envio fictício → consultar o resultado persistido.

## Começar no Windows e VS Code

Pré-requisitos: **Node.js 24 LTS**, npm, **MySQL 8.0 ou 8.4** e VS Code. Docker não é necessário. Abra esta pasta no VS Code e use o terminal PowerShell. Os comandos usam `npm.cmd`/`npx.cmd` para funcionar mesmo quando a política do PowerShell bloqueia `npm.ps1`.

```powershell
npm.cmd ci
```

### Opção A: MySQL isolado para a demonstração

Se o MySQL está em `C:\Program Files\MySQL\MySQL Server 8.0\bin`:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-local-mysql.ps1
npm.cmd run db:migrate
npm.cmd run db:seed
```

Para outra instalação, acrescente `-MySqlBin "C:\caminho\do\MySQL\bin"` ao primeiro comando. O script usa os executáveis já instalados, cria uma instância **somente local, na porta 3307**, com arquivos em `.local/mysql-data`, e preserva o serviço MySQL existente. Gera senhas aleatórias locais, `apps/server/.env` e as bases `tap_o` e `tap_o_test`. Um `.env` existente é preservado: nesse caso, confira sua configuração. O script pode ser executado novamente após reiniciar o computador. Não apague `.local` se quiser manter o progresso.

### Opção B: seu serviço MySQL existente

Crie uma base e um usuário próprios pelo MySQL Workbench ou cliente MySQL, usando uma senha escolhida por você:

```sql
CREATE DATABASE tap_o CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE tap_o_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tap_o'@'localhost' IDENTIFIED BY 'SUBSTITUA_POR_SUA_SENHA';
GRANT ALL PRIVILEGES ON tap_o.* TO 'tap_o'@'localhost';
GRANT ALL PRIVILEGES ON tap_o_test.* TO 'tap_o'@'localhost';
```

```powershell
Copy-Item apps/server/.env.example apps/server/.env
# Edite DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASSWORD no VS Code.
npm.cmd run db:migrate
npm.cmd run db:seed
```

As migrações são versionadas e têm checksum. O seed pode ser repetido: prepara perfil, preferências iniciais e conteúdo, **sem inventar resultados nem apagar o progresso**. Credenciais ficam somente no servidor e não entram no Git.

### Abrir a demonstração

Terminal 1, na raiz:

```powershell
npm.cmd run server
```

Terminal 2, na raiz:

```powershell
npm.cmd run web
```

Abra `http://localhost:8081`. A API está em `http://localhost:3001`; `/health` verifica também o MySQL. Para a versão nativa, use `npm.cmd run mobile` e o Expo Go compatível com SDK 58. O mesmo código tem a opção web para a apresentação no computador.

Para executar builds locais já gerados:

```powershell
npm.cmd run build:server
npm.cmd run build:web
# Em terminais separados:
npm.cmd run start -w @tap-o/server
npm.cmd run preview
```

## Celular físico pela rede local

1. Conecte computador e celular ao mesmo Wi-Fi, sem isolamento entre clientes.
2. Execute `ipconfig` no computador e encontre o **IPv4 da conexão Wi-Fi**, por exemplo `192.168.1.10`.
3. Copie `apps/mobile/.env.example` para `apps/mobile/.env`. Configure `EXPO_PUBLIC_API_URL=http://192.168.1.10:3001`, substituindo pelo seu IP. **Não use localhost no celular**: ele apontaria para o próprio aparelho.
4. Inicie a API: `npm.cmd run server`. Ela escuta em `0.0.0.0`; o MySQL continua local e nunca é acessado pelo celular.
5. No navegador do celular, confira `http://SEU_IP:3001/health`. Se não abrir, verifique a rede e permita o Node.js no Firewall do Windows **somente na rede privada**. Não é necessário expor a porta do MySQL.
6. Execute `npm.cmd run mobile -- --lan` e escaneie o QR code no Expo Go compatível. Após mudar `.env`, reinicie com `npm.cmd run mobile -- --clear`.

Se preferir abrir **a versão web no navegador do celular**, inclua `http://SEU_IP:8081` em `CORS_ORIGINS` do servidor e reinicie a API. A gravação web em HTTP via IP pode não estar disponível; use o áudio demonstrativo ou o aplicativo nativo. O túnel do Expo não publica automaticamente a API local.

O perfil é compartilhado de demonstração, sem autenticação segura. Execute a API em rede local de confiança; esta entrega não configura hospedagem pública nem acesso de usuários reais. [Detalhes da arquitetura e limites](docs/ARQUITETURA.md).

## O que está implementado

- Mensagem com seleção de contato, foco, digitação, confirmação, conversa simulada e persistência.
- Orientação textual e `expo-speech`, destaque preso ao elemento renderizado, repetir/pausar/encerrar, ajuda após espera com consentimento explícito.
- Áudio com `expo-audio`, permissão sob demanda, parar, ouvir até o fim, confirmar envio ou descartar; áudio demonstrativo local se o microfone for negado/indisponível.
- Ligação fictícia com confirmação e encerramento; banco Horizonte com saldo, extrato, ajuda e identificação de solicitação suspeita.
- Três aulas, três minigames, preferências, progresso, satisfação e demonstração de modo família usando exclusivamente o perfil de teste.
- Tentativas concluídas classificadas como orientação, execução assistida ou sem ajuda. Histórico permite comparar novas tentativas.
- Fila local de registros pendentes, com reenvio idempotente. A interface só afirma que salvou após confirmação da API. A fila não é um substituto do MySQL.

Mensagens digitadas ficam apenas na memória da tela. Gravações ficam no cache local e não são enviadas à API. Ao sair ou descartar, o aplicativo tenta remover o arquivo temporário; se o processo for encerrado abruptamente, o sistema pode manter o cache até sua limpeza. Apenas eventos de aprendizagem e resultados são persistidos. Tentativas incompletas não contam e não são retomadas após fechar o aplicativo; conclusões e registros pendentes são preservados.

## Estrutura

```text
apps/mobile/       Aplicativo Expo Router, tema, componentes e simuladores
apps/server/       API Express, validação, migração SQL e dados iniciais
packages/core/     Máquina de estados, orientações e conteúdo compartilhados
tests/e2e/         Testes da interface web com Playwright
scripts/           MySQL local opcional e prévia web
docs/              Arquitetura, validação, apresentação e plano de entrega
```

Mascote: `apps/mobile/assets/mascot/tap-o.png`, copiado sem alterar o desenho. A outra imagem fornecida está em `tap-o-icon.png`. O componente `Mascot` centraliza a troca. O áudio demonstrativo foi gerado localmente com a voz Microsoft Maria pt-BR, dizendo a frase identificada na tela.

## Verificações

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:integration
npm.cmd run build:server
npm.cmd run build:web
npm.cmd run test:e2e
npm.cmd run format:check
cd apps/mobile
npx.cmd expo-doctor
```

`test:integration` exige MySQL acessível e usa **tap_o_test** (ou `TEST_DB_NAME` terminado em `_test`). Aplica migrações e seed nessa base, sem apagar registros existentes. `test:e2e` exige builds atuais e Microsoft Edge instalado; inicia/encerra API e servidor web automaticamente nas portas 3001/8081, usando a base de teste. Encerre seus servidores nessas portas antes de executá-lo. Os testes criam tentativas de teste reais; não contaminam `tap_o`.

Em outros sistemas, troque `npm.cmd`/`npx.cmd` por `npm`/`npx`; ajuste o canal do navegador em `playwright.config.ts` se não usar Edge. As instruções e os testes desta entrega foram executados no Windows.

Veja [o relatório com evidências e limites](docs/VALIDACAO.md). Não há alegação de teste em aparelho Android ou iOS. A interface web testada não substitui a validação nativa de teclado, TalkBack/VoiceOver, voz e microfone.

Para encerrar, use `Ctrl+C` nos terminais da API/Expo. Se usou a instância isolada:

```powershell
node scripts/stop-local-mysql.mjs
```

O banco e o progresso permanecem no disco. Não há cobrança, anúncios ou publicação em lojas.

## Entrega e apresentação

- [Roteiro de apresentação de 4 minutos](docs/APRESENTACAO.md)
- [Plano em duas etapas e agenda dos 10 dias](docs/ENTREGA.md)
- [Arquitetura, API e futura integração nativa](docs/ARQUITETURA.md)

A implementação segue a documentação do [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Expo Audio](https://docs.expo.dev/versions/v58.0.0/sdk/audio/) e [Expo Speech](https://docs.expo.dev/versions/v58.0.0/sdk/speech/).
