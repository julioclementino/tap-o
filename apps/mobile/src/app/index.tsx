import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { Preferences } from '@tap-o/core';
import { Button, Card, Mascot, Notice, Screen, T } from '../components/ui';
import { api } from '../services/api';
import { useApp } from '../state/AppProvider';
export default function Welcome() {
  const { setPrefs, ready, colors } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function enter() {
    setBusy(true);
    setError('');
    try {
      await api('/demo');
      const prefs = await api<Preferences>('/preferences');
      setPrefs(prefs);
      router.replace('/home');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen
      title={'Mais confiança.\nUm toque de cada vez.'}
      subtitle="Seu espaço para aprender a usar o celular com autonomia."
      back={false}
      nav={false}
      help={false}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 32,
          padding: 8,
        }}
      >
        <Mascot size={230} />
        <T variant="subtitle">Olá, eu sou o Tap-o.</T>
        <T style={{ textAlign: 'center', padding: 16 }}>Vamos praticar juntos, no seu ritmo?</T>
      </View>
      <Card>
        <T variant="label">Um lugar seguro para experimentar</T>
        <T>
          Contatos e banco são fictícios. Aqui, nenhuma mensagem ou ligação vai para outra pessoa.
        </T>
        <Button
          label={busy ? 'Conectando…' : 'Entrar com perfil de demonstração'}
          icon="arrow-right"
          onPress={enter}
          disabled={!ready || busy}
        />
        <T variant="small">Perfil compartilhado de teste. Não é uma autenticação segura.</T>
      </Card>
      {error && (
        <>
          <Notice error>{error}</Notice>
          <Button
            label="Explorar sem conexão"
            kind="secondary"
            onPress={() => router.replace('/home')}
          />
          <T variant="small">Resultados ficarão pendentes até você conectar e sincronizar.</T>
        </>
      )}
    </Screen>
  );
}
