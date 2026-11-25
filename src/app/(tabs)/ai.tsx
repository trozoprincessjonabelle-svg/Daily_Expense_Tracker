import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { SmoothPressable } from '@/components/SmoothPressable';
import { ChatExperience } from './chat';
import { InsightsScreen } from './insights';
import { useTheme } from '@/theme';

type ViewMode = 'insights' | 'chat';

export default function AiScreen() {
  const theme = useTheme();
  const [view, setView] = useState<ViewMode>('chat');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.switcher, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {([
          ['chat', 'AI Chatbot'],
          ['insights', 'Insights'],
        ] as const).map(([key, label]) => {
          const selected = view === key;
          return (
            <SmoothPressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setView(key)}
              style={[styles.option, selected && { backgroundColor: theme.buttonPrimary }]}
            >
              <Text style={{ color: selected ? '#FFFFFF' : theme.textSecondary, fontSize: 13, fontWeight: '700' }}>
                {label}
              </Text>
            </SmoothPressable>
          );
        })}
      </View>
      {view === 'insights' ? <InsightsScreen /> : <ChatExperience coachMode embedded />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  switcher: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 8,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 13,
  },
  option: { flex: 1, minHeight: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
