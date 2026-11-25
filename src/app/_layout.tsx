import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getDb } from '@/db/client';
import { refreshModelStatus } from '@/ai/local';
import { DownloadStatusIndicator } from '@/components/DownloadStatusIndicator';
import { PopupProvider } from '@/components/Popup';
import { AccessibilityPreferences, useReduceMotion } from '@/components/AccessibilityPreferences';
import { SettingsProvider, useSettings } from '@/settings/SettingsContext';
import { translate } from '@/settings/language';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Open + migrate the database and read the local model's on-disk
    // state before rendering any screen.
    let active = true;
    const initialize = async () => {
      setReady(false);
      setInitError(null);
      try {
        await getDb();
      } catch (error) {
        if (active) {
          setInitError(error instanceof Error ? error.message : 'Unknown database initialization error.');
          setReady(true);
        }
        return;
      }

      if (!active) return;
      setReady(true);
      void refreshModelStatus().catch((error: unknown) => {
        console.warn('Unable to refresh local model status:', error);
      });
    };
    void initialize();
    return () => { active = false; };
  }, [retryCount]);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorTitle, { color: theme.text }]}>Could not open your data</Text>
        <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>{initError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setRetryCount((count) => count + 1)}
          style={[styles.retryButton, { backgroundColor: theme.buttonPrimary }]}
        >
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SettingsProvider>
      <AccessibilityPreferences><PopupProvider><RootNavigator /></PopupProvider></AccessibilityPreferences>
    </SettingsProvider>
  );
}

/** Shows onboarding until it's completed, then the main app. */
function RootNavigator() {
  const theme = useTheme();
  const { settings, ready } = useSettings();
  const reduceMotion = useReduceMotion();

  // Keep the OS background colour (keyboard area, splash fade) in sync.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.background);
  }, [theme.background]);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.background },
          animation: reduceMotion ? 'none' : 'slide_from_right',
        }}
      >
        <Stack.Protected guard={!settings.onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={settings.onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: translate(settings.language, 'Settings') }} />
          <Stack.Screen name="chat-settings" options={{ title: translate(settings.language, 'Chat settings') }} />
          <Stack.Screen
            name="privacy"
            options={({ navigation }) => ({
              title: translate(settings.language, 'Privacy Policy'),
              headerBackVisible: false,
              headerLeft: () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  hitSlop={12}
                  onPress={() => navigation.goBack()}
                  style={{ paddingRight: 16, paddingVertical: 8 }}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
              ),
            })}
          />
          <Stack.Screen
            name="terms"
            options={({ navigation }) => ({
              title: translate(settings.language, 'Terms & Conditions'),
              headerBackVisible: false,
              headerLeft: () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  hitSlop={12}
                  onPress={() => navigation.goBack()}
                  style={{ paddingRight: 16, paddingVertical: 8 }}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
              ),
            })}
          />
        </Stack.Protected>
      </Stack>
      <DownloadStatusIndicator />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  errorTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  errorMessage: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retryButton: { minHeight: 46, minWidth: 140, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingHorizontal: 18, marginTop: 6 },
  retryLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
