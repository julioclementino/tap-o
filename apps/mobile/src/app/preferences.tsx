import { useState } from 'react';
import { Switch, View } from 'react-native';
import { Button, Card, Notice, Screen, T } from '../components/ui';
import { useApp } from '../state/AppProvider';
import { savePreferences } from '../services/api';
export default function PreferencesScreen() {
  const { prefs, setPrefs, colors, reader } = useApp();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  function update(patch: Partial<typeof prefs>) {
    setPrefs({ ...prefs, ...patch });
    setSaved(false);
    setMessage('Ajustes aplicados neste aparelho. Toque em Salvar para guardar no servidor.');
  }
  async function save() {
    setBusy(true);
    try {
      await savePreferences(prefs);
      setSaved(true);
      setMessage('Preferências salvas no MySQL.');
    } catch (e) {
      setSaved(false);
      setMessage(
        (e as Error).message + ' Ajustes mantidos neste aparelho; salvamento no servidor pendente.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Do seu jeito" subtitle="Ajuste o Tap-o para ficar mais confortável.">
      <Card>
        <T variant="subtitle">Tamanho do texto</T>
        <T>Este é um exemplo de leitura.</T>
        {([1, 1.2, 1.4] as const).map((scale, index) => (
          <Button
            key={scale}
            label={`${['Padrão', 'Grande', 'Muito grande'][index]}${prefs.textScale === scale ? ' · selecionado' : ''}`}
            kind={prefs.textScale === scale ? 'primary' : 'secondary'}
            onPress={() => update({ textScale: scale })}
          />
        ))}
      </Card>
      <Card>
        {(
          [
            { key: 'highContrast', label: 'Alto contraste' },
            { key: 'voiceEnabled', label: 'Orientação por voz' },
            { key: 'reducedMotion', label: 'Reduzir movimentos' },
          ] as const
        ).map((item) => (
          <View
            key={item.key}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              minHeight: 60,
            }}
          >
            <T style={{ flex: 1 }}>{item.label}</T>
            <Switch
              accessibilityLabel={item.label}
              value={prefs[item.key]}
              onValueChange={(value) => update({ [item.key]: value })}
              trackColor={{ false: colors.border, true: colors.green }}
            />
          </View>
        ))}
        {reader && (
          <Notice>
            O leitor de tela está ativo. A narração automática do Tap-o fica desligada para evitar
            vozes juntas.
          </Notice>
        )}
      </Card>
      <Card>
        <T variant="subtitle">Tempo antes de oferecer ajuda</T>
        <T>A espera só mostra um convite. Nenhuma ação é executada sem você escolher.</T>
        {[10, 25, 60].map((seconds) => (
          <Button
            key={seconds}
            label={`${seconds} segundos${prefs.inactivitySeconds === seconds ? ' · selecionado' : ''}`}
            kind="secondary"
            onPress={() => update({ inactivitySeconds: seconds })}
          />
        ))}
      </Card>
      <Button
        label={busy ? 'Salvando…' : 'Salvar preferências'}
        icon="check"
        disabled={busy}
        onPress={() => void save()}
      />
      {message && <Notice error={!saved}>{message}</Notice>}
    </Screen>
  );
}
