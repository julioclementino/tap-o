import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Icon, MascotHelp, Screen, T } from '../components/ui';
import { useApp } from '../state/AppProvider';
export default function Home() {
  const { colors, pending } = useApp();
  return (
    <Screen
      title="O que vamos aprender hoje?"
      subtitle="Escolha um caminho. Eu acompanho você."
      back={false}
      help={false}
    >
      <MascotHelp />
      <Card style={{ backgroundColor: colors.text }}>
        <T variant="small" style={{ color: '#FFFFFF', letterSpacing: 1 }}>
          SEU PRÓXIMO PASSO
        </T>
        <T variant="subtitle" style={{ color: '#FFFFFF' }}>
          Uma mensagem pode aproximar.
        </T>
        <T style={{ color: '#FFFFFF' }}>
          Aprenda a conversar com uma pessoa, do primeiro toque ao envio.
        </T>
        <Button
          label="Aprender a enviar uma mensagem"
          icon="message-circle"
          onPress={() => router.push('/training/message')}
        />
        <T variant="small" style={{ color: '#FFFFFF' }}>
          Ambiente de treinamento · 4 passos
        </T>
      </Card>
      <View style={{ gap: 12 }}>
        <Button
          label="Pedir ajuda"
          icon="help-circle"
          kind="secondary"
          onPress={() => router.push('/assistant')}
        />
        <Button
          label="Aprender"
          icon="book-open"
          kind="secondary"
          onPress={() => router.push('/learn')}
        />
        <Button
          label="Praticar"
          icon="grid"
          kind="secondary"
          onPress={() => router.push('/practice')}
        />
        <Button
          label="Meu progresso"
          icon="bar-chart-2"
          kind="secondary"
          onPress={() => router.push('/progress')}
        />
      </View>
      {pending.length > 0 && (
        <T>{pending.length} registro(s) aguardando sincronização em Meu progresso.</T>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="shield" color={colors.green} />
        <T style={{ flex: 1 }} variant="small">
          Sem pressa, sem cobranças. O essencial é gratuito.
        </T>
      </View>
      <Button label="Sobre o projeto" kind="quiet" onPress={() => router.push('/about')} />
      <Button
        label="Modo família · demonstração"
        kind="quiet"
        onPress={() => router.push('/family')}
      />
    </Screen>
  );
}
