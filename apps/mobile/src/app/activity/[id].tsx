import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { activities, type Activity } from '@tap-o/core';
import { Button, Card, Icon, Notice, Screen, T } from '../../components/ui';
import { useApp } from '../../state/AppProvider';
import type { PendingRecord } from '../../services/api';
export default function ActivityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = activities.find((a) => a.id === id);
  if (!activity)
    return (
      <Screen title="Atividade não encontrada">
        <Button label="Ver aulas" onPress={() => router.replace('/learn')} />
      </Screen>
    );
  return <ActivityView key={id} activity={activity} />;
}
function ActivityView({ activity }: { activity: Activity }) {
  const { submit, colors } = useApp();
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState<PendingRecord | null>(null);
  const reading = activity.kind === 'lesson' && page < activity.content.length;
  async function persist(item: PendingRecord) {
    setBusy(true);
    setSaved(false);
    try {
      await submit(item);
      setSaved(true);
      setStatus('Resultado salvo no MySQL.');
    } catch (e) {
      setStatus((e as Error).message + ' Sincronização pendente em Meu progresso.');
    } finally {
      setBusy(false);
    }
  }
  async function answer(values: number[]) {
    if (result !== null || busy) return;
    setAnswers(values);
    const correct =
      activity.id === 'order-game' ? values.join(',') === '0,1,2' : values[0] === activity.answer;
    setResult(correct);
    const next: PendingRecord = {
      id: Crypto.randomUUID(),
      kind: 'attempts',
      title: activity.title,
      body: { activityId: activity.id, answers: values, readPages: activity.content.length },
    };
    setRecord(next);
    await persist(next);
  }
  function restart() {
    setResult(null);
    setAnswers([]);
    setStatus('');
    setSaved(false);
    setRecord(null);
  }
  return (
    <Screen
      title={activity.title}
      subtitle={
        activity.kind === 'lesson'
          ? 'Uma pequena aula, no seu ritmo.'
          : 'Minigame · sem pressa, sem punição'
      }
    >
      {reading ? (
        <Card>
          <T variant="small">
            LEITURA {page + 1} DE {activity.content.length}
          </T>
          <T variant="subtitle">{activity.content[page]}</T>
          <Button
            label={
              page === activity.content.length - 1
                ? 'Vamos praticar o que lemos'
                : 'Próxima leitura'
            }
            icon="arrow-right"
            onPress={() => setPage((n) => n + 1)}
          />
          {page > 0 && (
            <Button
              label="Ler a página anterior"
              kind="quiet"
              onPress={() => setPage((n) => n - 1)}
            />
          )}
        </Card>
      ) : (
        <>
          <Card>
            {activity.kind === 'game' && activity.content.map((text) => <T key={text}>{text}</T>)}
            <T variant="subtitle">{activity.question}</T>
            {activity.id === 'order-game' ? (
              <>
                {answers.length > 0 && (
                  <T accessibilityLiveRegion="polite">
                    Sua sequência: {answers.map((i) => activity.options[i]).join(' → ')}
                  </T>
                )}
                {[2, 0, 1].map((i) => (
                  <Button
                    key={i}
                    label={`${answers.includes(i) ? `${answers.indexOf(i) + 1}. ` : ''}${activity.options[i]}`}
                    kind="secondary"
                    disabled={result !== null || answers.includes(i)}
                    onPress={() => setAnswers((a) => [...a, i])}
                  />
                ))}
                <Button
                  label="Conferir a ordem"
                  disabled={answers.length !== 3 || result !== null || busy}
                  onPress={() => void answer(answers)}
                />
                <Button
                  label="Recomeçar a sequência"
                  kind="quiet"
                  disabled={busy}
                  onPress={restart}
                />
              </>
            ) : (
              activity.options.map((option, index) => (
                <Button
                  key={option}
                  label={option}
                  icon={
                    activity.id === 'icon-game'
                      ? (['mic', 'trash-2', 'search'] as const)[index]
                      : undefined
                  }
                  kind="secondary"
                  disabled={result !== null || busy}
                  onPress={() => void answer([index])}
                />
              ))
            )}
          </Card>
          {result !== null && (
            <Card>
              <Icon name={result ? 'check-circle' : 'info'} color={colors.green} size={36} />
              <T variant="subtitle">
                {result ? 'Você encontrou o caminho!' : 'Vamos aprender com esta tentativa.'}
              </T>
              <T>{activity.explanation}</T>
              {status && <Notice error={!saved}>{status}</Notice>}
              {!saved && record && (
                <Button
                  label={busy ? 'Salvando…' : 'Tentar salvar novamente'}
                  disabled={busy}
                  onPress={() => record && void persist(record)}
                />
              )}
              <Button label="Tentar novamente" disabled={busy} onPress={restart} />
              <Button
                label="Ver meu progresso"
                kind="secondary"
                onPress={() => router.push('/progress')}
              />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
