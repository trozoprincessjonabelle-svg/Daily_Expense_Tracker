import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from 'react-native';
import { LocalizedTextInput as TextInput } from '@/components/LocalizedTextInput';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SLIDES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'wallet-outline',
    title: 'Your student budget, made clearer',
    body: 'Track your allowance, earnings, and everyday school expenses in one simple ledger.',
  },
  {
    icon: 'cloud-offline-outline',
    title: 'Offline first',
    body: 'Your student budget and insights stay on this phone and work without internet.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Helpful student money insights',
    body: 'The offline Coach uses your saved money records for recommendations. No model download or internet is needed.',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState(settings.nickname);

  const isNicknameStep = step === SLIDES.length;
  const trimmed = nickname.trim();

  const finish = async () => {
    try {
      await update('nickname', trimmed);
      await update('onboarded', true);
    } catch (error) {
      showMessage('Could not finish setup', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.content}>
          {isNicknameStep ? (
            <>
              <Ionicons name="person-circle-outline" size={88} color={theme.tint} />
              <Text style={[styles.title, { color: theme.text }]}>
                What should we call you?
              </Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                Pick a nickname. You can change it later in Settings.
              </Text>
              <TextInput
                accessibilityLabel="Nickname"
                value={nickname}
                onChangeText={setNickname}
                placeholder="Your nickname"
                placeholderTextColor={theme.textSecondary}
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={() => { if (trimmed) void finish(); }}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                  },
                ]}
              />
            </>
          ) : (
            <>
              <Ionicons name={SLIDES[step].icon} size={88} color={theme.tint} />
              <Text style={[styles.title, { color: theme.text }]}>
                {SLIDES[step].title}
              </Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {SLIDES[step].body}
              </Text>
            </>
          )}
        </View>

        <View style={styles.dots}>
          {Array.from({ length: SLIDES.length + 1 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? theme.tint : theme.border },
              ]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            label={step > 0 ? 'Back' : 'Skip intro'}
            variant="secondary"
            onPress={() => setStep(step > 0 ? step - 1 : SLIDES.length)}
          />
          <Button
            label={isNicknameStep ? 'Continue' : 'Next'}
            disabled={isNicknameStep && !trimmed}
            onPress={() => {
              if (isNicknameStep) void finish();
              else setStep(step + 1);
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    marginTop: 8,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
