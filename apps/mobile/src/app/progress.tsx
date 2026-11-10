import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { View } from 'react-native';
import { modeLabels } from '@tap-o/core';
import { Button, Card, Notice, Screen, T } from '../components/ui';
import { api, type Progress } from '../services/api';
import { useApp } from '../state/AppProvider';
export default function ProgressScreen() {
  const { pending, sync, colors } = useApp();
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      setData(await api<Progress>('/progress'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function retry() {
    setBusy(true);
    setError('');
    try {
      await sync();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Cada passo conta" subtitle="Meu progresso · perfil de demonstração">
      {pending.length > 0 && (
        <Card>
          <T variant="label">{pending.length} registro(s) pendente(s)</T>
          <T>Ainda não confirmados no servidor. Eles não entram nos totais abaixo.</T>
          {pending.map((item) => (
            <T key={item.id} variant="small">
              • {item.title}
            </T>
          ))}
          <Button
            label="Sincronizar agora"
            icon="refresh-cw"
            onPress={() => void retry()}
            disabled={busy}
          />
        </Card>
      )}
      {error && (
        <Notice error>
          {error}{' '}
          {data ? 'Os números abaixo são da última consulta e podem estar desatualizados.' : ''}
        </Notice>
      )}
      <Button
        label={busy ? 'Consultando…' : 'Atualizar progresso'}
        kind="secondary"
        onPress={() => void load()}
        disabled={busy}
      />
      {data && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Tentativas concluídas', value: data.totals.tasks },
              { label: 'Aulas concluídas', value: data.totals.lessons },
              { label: 'Jogos realizados', value: data.totals.games },
            ].map((item) => (
              <Card key={item.label} style={{ flexGrow: 1, flexBasis: 180 }}>
                <T variant="hero" style={{ color: colors.green }}>
                  {item.value}
                </T>
                <T>{item.label}</T>
              </Card>
            ))}
          </View>
          <Card>
            <T variant="subtitle">Como você praticou</T>
            <T>{data.totals.guided} com orientação</T>
            <T>{data.totals.assisted} com execução assistida</T>
            <T>{data.totals.independent} sem ajuda</T>
            <T variant="small">
              Fazer um passo com ajuda não significa domínio da tarefa. Compare novas tentativas da
              mesma atividade.
            </T>
          </Card>
          <T variant="subtitle">Suas tentativas, da mais recente</T>
          {data.sessions.length === 0 ? (
            <Card>
              <T>Seu primeiro passo começa aqui. Nenhum treinamento concluído ainda.</T>
              <Button
                label="Aprender a enviar uma mensagem"
                onPress={() => router.push('/training/message')}
              />
            </Card>
          ) : (
            data.sessions.map((item, index, all) => (
              <Card key={item.id}>
                <T variant="label">{item.title}</T>
                <T>{modeLabels[item.mode]}</T>
                <T variant="small">
                  {new Date(item.completedAt).toLocaleString('pt-BR')} · {item.assistedSteps}{' '}
                  passo(s) executado(s) com ajuda
                </T>
                <T variant="small">
                  Tentativa {all.slice(index).filter((s) => s.taskId === item.taskId).length} desta
                  tarefa
                </T>
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}
