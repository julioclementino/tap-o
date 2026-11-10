import { useState } from 'react';
import { Button, Card, Notice, Screen, T } from '../components/ui';
import { api, type Progress } from '../services/api';
export default function Family() {
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setError('');
    try {
      setData(await api<Progress>('/progress'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Aprender com apoio" subtitle="Modo família · demonstração">
      <Notice>
        Esta demonstração usa apenas o perfil de teste deste Tap-o. Não existe acompanhamento
        remoto, convite ou acesso a dados de outras pessoas.
      </Notice>
      <Card>
        <T variant="subtitle">Apoiar sem tirar a autonomia</T>
        <T>
          Um familiar pode incentivar novas tentativas e respeitar o tempo de quem está aprendendo.
        </T>
        <Button
          label="Mostrar resultados do perfil de teste"
          disabled={busy}
          onPress={() => void load()}
        />
        {error && <Notice error>{error}</Notice>}
        {data && (
          <>
            <T>{data.totals.tasks} tentativas concluídas</T>
            <T>{data.totals.independent} concluídas sem ajuda</T>
            <T>{data.totals.assisted} com execução assistida</T>
          </>
        )}
      </Card>
      <T>
        O modo família completo é um extra futuro. Compartilhamento real dependerá de consentimento
        e controles de acesso.
      </T>
    </Screen>
  );
}
