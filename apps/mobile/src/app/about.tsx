import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { Button, Card, Notice, Screen, T } from '../components/ui';
import { useApp } from '../state/AppProvider';
export default function About() {
  const { submit } = useApp();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [id] = useState(() => Crypto.randomUUID());
  async function rate(rating: number) {
    setBusy(true);
    try {
      await submit({ id, kind: 'feedback', title: 'Sua opinião sobre o Tap-o', body: { rating } });
      setFeedback('Obrigado. Sua resposta foi salva no MySQL.');
    } catch (e) {
      setFeedback((e as Error).message + ' Resposta pendente em Meu progresso.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen
      title="Tecnologia que aproxima"
      subtitle="Tap-o · Projeto Integrador | Acessibilidade digital"
    >
      <Card>
        <T variant="subtitle">Autonomia começa com confiança.</T>
        <T>
          O Tap-o ajuda pessoas com baixo letramento digital a praticar o uso do celular com
          orientações simples, voz e apoio visual.
        </T>
        <T>
          Elis Clementino, de 76 anos, relatou que gostaria de usar o celular e aplicativos
          bancários sem depender constantemente de ajuda.
        </T>
        <T variant="small">
          Referência de público fornecida pela equipe. Este protótipo não apresenta novos
          depoimentos ou resultados de pesquisa.
        </T>
      </Card>
      <Card>
        <T variant="subtitle">O essencial é gratuito</T>
        <T>Assistente, orientações básicas, aulas, jogos e ajustes de acessibilidade.</T>
        <T variant="label">Possibilidades futuras</T>
        <T>Personalização do mascote, trilhas aprofundadas e modo família.</T>
      </Card>
      <Card>
        <T variant="subtitle">Inclusão se constrói em conjunto</T>
        <T>
          O projeto pode apoiar parcerias com bancos, operadoras, prefeituras e instituições de
          inclusão digital para oferecer treinamento acessível.
        </T>
        <T>
          Hoje, todas as atividades acontecem dentro do Tap-o, com tarefas programadas. Não há
          integração com WhatsApp, bancos reais ou serviços de inteligência artificial.
        </T>
        <T>
          Uma integração Android nativa exigirá desenvolvimento e avaliação próprios. O controle de
          outros aplicativos não é uma promessa para iOS.
        </T>
      </Card>
      <Card>
        <T variant="subtitle">Como foi aprender aqui?</T>
        <T>Resposta opcional, sem nome ou comentário pessoal.</T>
        {!feedback &&
          [1, 2, 3].map((rating, i) => (
            <Button
              key={rating}
              label={['Preciso de mais apoio', 'Foi razoável', 'Foi fácil acompanhar'][i]}
              kind="secondary"
              disabled={busy}
              onPress={() => void rate(rating)}
            />
          ))}
        {feedback && <Notice>{feedback}</Notice>}
      </Card>
    </Screen>
  );
}
