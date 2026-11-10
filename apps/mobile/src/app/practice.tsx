import { router } from 'expo-router';
import { activities, tutorials } from '@tap-o/core';
import { Button, Card, Screen, T } from '../components/ui';
export default function Practice() {
  return (
    <Screen
      title="Praticar faz parte"
      subtitle="Experimente quantas vezes quiser. Sem limite de tempo."
    >
      <T variant="subtitle">Ambientes de treinamento</T>
      {tutorials.map((t) => (
        <Card key={t.id}>
          <T variant="small">
            {t.category === 'bank'
              ? 'BANCO HORIZONTE · FICTÍCIO'
              : 'CONVERSAS · CONTATOS FICTÍCIOS'}
          </T>
          <T variant="label">{t.title}</T>
          <Button
            label={`Praticar: ${t.title}`}
            kind="secondary"
            onPress={() =>
              router.push({
                pathname: '/training/[task]',
                params: { task: t.id, independent: '1' },
              })
            }
          />
          <Button
            label="Aprender com orientação"
            kind="quiet"
            onPress={() => router.push(`/training/${t.id}`)}
          />
        </Card>
      ))}
      <T variant="subtitle">Pequenos jogos, novas descobertas</T>
      {activities
        .filter((a) => a.kind === 'game')
        .map((a) => (
          <Card key={a.id}>
            <T variant="label">{a.title}</T>
            <T>{a.description}</T>
            <Button
              label={`Jogar: ${a.title}`}
              icon="play"
              onPress={() => router.push(`/activity/${a.id}`)}
            />
          </Card>
        ))}
    </Screen>
  );
}
