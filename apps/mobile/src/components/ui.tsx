import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { router, usePathname, type Href } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { theme } from '../theme';
type IconName = React.ComponentProps<typeof Feather>['name'];
export function T({
  children,
  variant = 'body',
  style,
  ...props
}: TextProps & { variant?: keyof typeof theme.type }) {
  const { prefs, colors } = useApp();
  const fontSize = theme.type[variant] * prefs.textScale;
  return (
    <Text
      {...props}
      style={[
        {
          color: colors.text,
          fontSize,
          lineHeight: fontSize * 1.36,
          fontWeight: ['title', 'hero', 'subtitle', 'label'].includes(variant) ? '700' : '400',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Icon({
  name,
  size = 24,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { colors } = useApp();
  return <Feather name={name} size={size} color={color || colors.text} accessible={false} />;
}
export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'quiet' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  testID?: string;
}) {
  const { colors } = useApp();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: kind === 'primary' ? colors.primary : colors.surface,
          borderColor:
            kind === 'danger' ? colors.danger : kind === 'quiet' ? 'transparent' : colors.border,
          borderWidth: kind === 'primary' ? 0 : 1.5,
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {icon && <Icon name={icon} color={kind === 'danger' ? colors.danger : colors.text} />}
      <T
        variant="label"
        style={{
          flexShrink: 1,
          textAlign: 'center',
          color: kind === 'danger' ? colors.danger : colors.text,
        }}
      >
        {label}
      </T>
    </Pressable>
  );
}
export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) {
  const { colors } = useApp();
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}
export function Notice({ children, error = false }: React.PropsWithChildren<{ error?: boolean }>) {
  const { colors } = useApp();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        s.notice,
        { borderColor: error ? colors.danger : colors.green, backgroundColor: colors.surface },
      ]}
    >
      <Icon name={error ? 'alert-circle' : 'info'} color={error ? colors.danger : colors.green} />
      <T style={{ flex: 1 }}>{children}</T>
    </View>
  );
}
export function Mascot({ size = 100 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/mascot/tap-o.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="Tartaruga Tap-o, amarela com casco verde"
    />
  );
}
export function MascotHelp({
  onPress,
  compact = false,
}: {
  onPress?: () => void;
  compact?: boolean;
}) {
  const { colors } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tocar na tartaruga para pedir ajuda"
      onPress={onPress || (() => router.push('/assistant'))}
      style={[s.mascot, { backgroundColor: colors.softGreen, borderColor: colors.border }]}
    >
      <Mascot size={compact ? 62 : 84} />
      <View style={{ flex: 1 }}>
        <T variant="label">{compact ? 'Toque para receber ajuda' : 'Vamos no seu ritmo.'}</T>
        {!compact && <T variant="small">Toque na tartaruga quando precisar.</T>}
      </View>
      <Icon name="volume-2" />
    </Pressable>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  back = true,
  nav = true,
  help = true,
  onBack,
}: React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  back?: boolean;
  nav?: boolean;
  help?: boolean;
  onBack?: () => void;
}>) {
  const { colors, storageError } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.container}>
          <View style={s.brand}>
            <T variant="subtitle">
              Tap-o<T variant="small"> / no seu tempo</T>
            </T>
            {back && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                onPress={
                  onBack || (() => (router.canGoBack() ? router.back() : router.replace('/home')))
                }
                style={s.back}
              >
                <Icon name="arrow-left" />
                <T variant="small">Voltar</T>
              </Pressable>
            )}
          </View>
          <View style={s.heading}>
            <T variant="title" accessibilityRole="header">
              {title}
            </T>
            {subtitle && <T style={{ color: colors.muted }}>{subtitle}</T>}
          </View>
          {storageError && <Notice error>{storageError}</Notice>}
          {children}
          {help && <MascotHelp />}
        </ScrollView>
      </KeyboardAvoidingView>
      {nav && <Navigation />}
    </SafeAreaView>
  );
}
function Navigation() {
  const path = usePathname();
  const { colors } = useApp();
  const items: { href: Href; label: string; icon: IconName }[] = [
    { href: '/home', label: 'Início', icon: 'home' },
    { href: '/learn', label: 'Aprender', icon: 'book-open' },
    { href: '/progress', label: 'Progresso', icon: 'bar-chart-2' },
    { href: '/preferences', label: 'Ajustes', icon: 'sliders' },
  ];
  return (
    <View style={[s.nav, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {items.map((item) => (
        <Pressable
          key={item.label}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: path === item.href }}
          onPress={() => router.navigate(item.href)}
          style={[
            s.navItem,
            { backgroundColor: path === item.href ? colors.background : colors.surface },
          ]}
        >
          <Icon name={item.icon} />
          <T
            variant="small"
            style={{ fontWeight: path === item.href ? '700' : '400', textAlign: 'center' }}
          >
            {item.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}
export function Confirm({
  title,
  detail,
  confirmLabel,
  onConfirm,
  onCancel,
  cancelLabel = 'Cancelar',
}: {
  title: string;
  detail: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}) {
  const { colors } = useApp();
  return (
    <Modal transparent animationType="none" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <ScrollView contentContainerStyle={s.modalScroll}>
          <View accessibilityViewIsModal style={[s.modal, { backgroundColor: colors.surface }]}>
            <T variant="subtitle" accessibilityRole="header">
              {title}
            </T>
            <T>{detail}</T>
            <Button label={confirmLabel} onPress={onConfirm} />
            <Button label={cancelLabel} kind="secondary" onPress={onCancel} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
/** Border follows the rendered element, without fixed overlay coordinates or interception. */
export function Target({ active, children }: React.PropsWithChildren<{ active: boolean }>) {
  const { colors } = useApp();
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: active ? colors.green : 'transparent',
        borderRadius: 18,
        padding: 4,
        gap: 4,
      }}
    >
      {active && (
        <T variant="small" style={{ fontWeight: '700', color: colors.green }}>
          ↓ Próximo passo
        </T>
      )}
      {children}
    </View>
  );
}
export const s = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingBottom: 36,
    flexGrow: 1,
  },
  brand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  heading: { gap: 8, marginTop: 8, marginBottom: 8 },
  back: { minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', padding: 8 },
  button: {
    minHeight: 58,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  card: { padding: 22, borderRadius: theme.radius.card, borderWidth: 1, gap: 16 },
  notice: {
    borderLeftWidth: 4,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  mascot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 80,
  },
  nav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    padding: 6,
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    minWidth: 75,
    padding: 8,
    minHeight: 66,
    borderRadius: 14,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(9,29,51,0.5)', justifyContent: 'center' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  modal: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 24,
    gap: 18,
  },
});
