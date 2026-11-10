import { router } from 'expo-router';
import { activities } from '@tap-o/core';
import { Button, Card, Screen, T } from '../components/ui';
export default function Learn() {
  return (
    <Screen title="Aprender, no seu tempo" subtitle="Uma descoberta de cada vez.">
      <Card>
        <T variant="small">COMECE POR AQUI</T>
        <T variant="subtitle">Aprender a enviar uma mensagem</T>
        <T>Uma conversa fictícia, com ajuda em cada passo.</T>
        <Button
          label="Começar treinamento"
          icon="message-circle"
          onPress={() => router.push('/training/message')}
        />
      </Card>
      {activities
        .filter((a) => a.kind === 'lesson')
        .map((a, i) => (
          <Card key={a.id}>
            <T variant="small">AULA {String(i + 1).padStart(2, '0')} · 3 pequenas leituras</T>
            <T variant="subtitle">{a.title}</T>
            <T>{a.description}</T>
            <Button
              label={`Abrir aula: ${a.title}`}
              kind="secondary"
              icon="book-open"
              onPress={() => router.push(`/activity/${a.id}`)}
            />
          </Card>
        ))}
    </Screen>
  );
}
