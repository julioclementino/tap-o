import { router } from 'expo-router';
import { tutorials } from '@tap-o/core';
import { Button, Card, Mascot, Notice, Screen, T } from '../components/ui';
export default function Assistant() {
  return (
    <Screen title="Como posso ajudar?" subtitle="Escolha o que você quer fazer." help={false}>
      <Card>
        <Mascot size={110} />
        <T>
          Eu explico um passo de cada vez. Durante o treino, toque em mim para ouvir a orientação.
        </T>
        <Notice>
          Por enquanto, ajudo com as atividades abaixo. Não leio outros aplicativos nem respondo
          perguntas fora destas tarefas.
        </Notice>
      </Card>
      {tutorials.slice(0, 3).map((t) => (
        <Button
          key={t.id}
          label={t.title}
          icon={t.id === 'audio' ? 'mic' : t.id === 'call' ? 'phone' : 'message-circle'}
          kind="secondary"
          onPress={() => router.push(`/training/${t.id}`)}
        />
      ))}
      <Button
        label="Aprender a navegar no banco fictício"
        icon="credit-card"
        kind="secondary"
        onPress={() => router.push('/practice')}
      />
    </Screen>
  );
}
