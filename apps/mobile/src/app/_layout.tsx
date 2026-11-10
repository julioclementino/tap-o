import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../state/AppProvider';
import { speech } from '../services/speech';
import { Screen, T } from '../components/ui';
function Routes() {
  const { prefs, ready } = useApp();
  const path = usePathname();
  useEffect(() => {
    void speech.stop();
  }, [path]);
  if (!ready)
    return (
      <Screen title="Preparando seu espaço" back={false} nav={false} help={false}>
        <T>Carregando seus ajustes…</T>
      </Screen>
    );
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, animation: prefs.reducedMotion ? 'none' : 'fade' }}
      />
    </>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Routes />
      </AppProvider>
    </SafeAreaProvider>
  );
}
