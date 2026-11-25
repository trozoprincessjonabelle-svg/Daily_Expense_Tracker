import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import { useLedgerFeatures } from '@/hooks/useLedgerFeatures';
import { useLedgerTransactions } from '@/hooks/useLedgerTransactions';
import {
  answerOfflineCoachQuestion,
  getOfflineCoachRecommendation,
  getOfflineCoachSnapshot,
  type OfflineCoachData,
  type OfflineCoachReply,
  type OfflineCoachTopic,
} from '@/ledger/offlineCoach';
import { formatMoney } from '@/ledger/format';
import { useSettings } from '@/settings/SettingsContext';
import type { AppLanguage } from '@/settings/storage';
import { useTheme } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface CoachPrompt {
  icon: IconName;
  title: string;
  description: string;
  topic: OfflineCoachTopic;
}

interface CoachSection {
  title: string;
  prompts: CoachPrompt[];
}

interface CoachPageCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  privacy: string;
  disclaimer: string;
  recommendation: string;
  answerLabel: string;
  dismissAnswer: string;
  monthTitle: string;
  income: string;
  expenses: string;
  remaining: string;
  askPlaceholder: string;
  promptsHeading: string;
  sections: CoachSection[];
}

const COACH_CONTENT: Record<AppLanguage, CoachPageCopy> = {
  en: {
    eyebrow: 'OFFLINE MONEY COACH',
    title: 'What would you like help with?',
    subtitle: 'Simple tips based on your money records.',
    privacy: 'Uses only your entries on this device. Free-text questions are not saved.',
    disclaimer: 'General guidance only, not professional financial advice. Check your records and upcoming costs.',
    recommendation: 'A small next step',
    answerLabel: 'BASED ON YOUR RECORDS',
    dismissAnswer: 'Dismiss coach answer',
    monthTitle: 'This month at a glance',
    income: 'Income',
    expenses: 'Expenses',
    remaining: 'Available',
    askPlaceholder: 'Ask about your money…',
    promptsHeading: 'Try a question',
    sections: [
      {
        title: 'Understand your spending',
        prompts: [
          {
            icon: 'pie-chart-outline',
            title: 'Where did my money go this month?',
            description: 'See which categories took the biggest share.',
            topic: 'spending',
          },
          {
            icon: 'wallet-outline',
            title: 'What do I have left after expenses?',
            description: 'Compare income and spending from your records.',
            topic: 'cashflow',
          },
        ],
      },
      {
        title: 'Plan my allowance',
        prompts: [
          {
            icon: 'calendar-outline',
            title: 'How much can I spend each day?',
            description: 'Estimate a daily amount from your income and upcoming costs.',
            topic: 'budget',
          },
        ],
      },
      {
        title: 'Grow your savings',
        prompts: [
          {
            icon: 'leaf-outline',
            title: 'How is my emergency fund doing?',
            description: 'Check your saved balance and goal.',
            topic: 'savings',
          },
          {
            icon: 'calendar-outline',
            title: 'Plan for an upcoming cost',
            description: 'Review events saved in Planner.',
            topic: 'upcoming',
          },
        ],
      },
    ],
  },
  tl: {
    eyebrow: 'GABAY SA PERA NA OFFLINE',
    title: 'Ano ang gusto mong malaman?',
    subtitle: 'Simpleng payo mula sa tala ng pera mo.',
    privacy: 'Gumagamit lang ng mga tala sa device mo. Hindi sine-save ang mga libreng tanong.',
    disclaimer: 'Pangkalahatang gabay lang ito, hindi propesyonal na payong pinansyal. Suriin ang mga tala at paparating na gastos.',
    recommendation: 'Maliit na susunod na hakbang',
    answerLabel: 'BATAY SA MGA TALA MO',
    dismissAnswer: 'Isara ang sagot ng coach',
    monthTitle: 'Buod ngayong buwan',
    income: 'Pumasok',
    expenses: 'Gastos',
    remaining: 'Magagamit',
    askPlaceholder: 'Magtanong tungkol sa pera mo…',
    promptsHeading: 'Pumili ng puwedeng itanong',
    sections: [
      {
        title: 'Unawain ang mga gastos',
        prompts: [
          {
            icon: 'pie-chart-outline',
            title: 'Saan napunta ang pera ko ngayong buwan?',
            description: 'Tingnan kung aling kategorya ang may pinakamalaking gastos.',
            topic: 'spending',
          },
          {
            icon: 'wallet-outline',
            title: 'Magkano ang natira matapos ang mga gastos?',
            description: 'Ihambing ang naitalang kita at paggastos.',
            topic: 'cashflow',
          },
        ],
      },
      {
        title: 'Planuhin ang baon',
        prompts: [
          {
            icon: 'calendar-outline',
            title: 'Magkano ang puwede kong gastusin bawat araw?',
            description: 'Tantiyahin mula sa naitalang kita at mga paparating na gastos.',
            topic: 'budget',
          },
        ],
      },
      {
        title: 'Palaguin ang ipon',
        prompts: [
          {
            icon: 'leaf-outline',
            title: 'Kumusta ang pondong pang-emergency ko?',
            description: 'Tingnan ang balanse at layunin ng ipon.',
            topic: 'savings',
          },
          {
            icon: 'calendar-outline',
            title: 'Magplano sa paparating na gastusin',
            description: 'Tingnan ang mga event na nasa Plans.',
            topic: 'upcoming',
          },
        ],
      },
    ],
  },
};

export function CoachScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { transactions, loading: transactionsLoading } = useLedgerTransactions();
  const { fund, events, loading: featuresLoading } = useLedgerFeatures();
  const now = useCurrentDate();
  const [answer, setAnswer] = useState<OfflineCoachReply | null>(null);
  const [activeTab, setActiveTab] = useState<'spending' | 'allowance' | 'savings'>('spending');
  const copy = COACH_CONTENT[settings.language];
  const loading = transactionsLoading || featuresLoading;
  const data = useMemo<OfflineCoachData>(
    () => ({ transactions, fund, events, now, language: settings.language }),
    [transactions, fund, events, now, settings.language]
  );
  const snapshot = useMemo(() => getOfflineCoachSnapshot(data), [data]);
  const recommendation = useMemo(() => getOfflineCoachRecommendation(data), [data]);

  const selectTopic = (topic: OfflineCoachTopic) => {
    if (loading) return;
    setAnswer(answerOfflineCoachQuestion(topic, data));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.optionHeader}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>AI Coach</Text>
          <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
            {copy.subtitle}
          </Text>
          <View style={styles.optionPrivacy}>
            <Ionicons name="shield-checkmark-outline" size={13} color={theme.tint} />
            <Text style={[styles.optionPrivacyText, { color: theme.textSecondary }]}>
              {copy.privacy}
            </Text>
          </View>
        </View>

        <View style={[styles.nextStepCard, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
          <View style={[styles.nextStepIconWrap, { backgroundColor: `${theme.tint}18` }]}>
            <Ionicons name="bulb-outline" size={20} color={theme.tint} />
          </View>
          <View style={styles.nextStepCopy}>
            <Text style={[styles.nextStepTitle, { color: theme.text }]}>{copy.recommendation}</Text>
            <Text style={[styles.nextStepBody, { color: theme.text }]}>{recommendation}</Text>
          </View>
        </View>

        {!loading && (
          <View style={styles.monthSnapshot}>
            <Text style={[styles.monthSnapshotTitle, { color: theme.textSecondary }]}>{copy.monthTitle}</Text>
            <View style={styles.monthSnapshotRow}>
              <SnapshotValue label={copy.income} value={snapshot.income} color={theme.text} />
              <SnapshotValue label={copy.expenses} value={snapshot.expenses} color={theme.danger} />
              <SnapshotValue label={copy.remaining} value={snapshot.remaining} color={theme.success} />
            </View>
          </View>
        )}

        <View style={[styles.coachTabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {([
            ['spending', 'Spending'],
            ['allowance', 'Allowance'],
            ['savings', 'Savings'],
          ] as const).map(([tab, label]) => (
            <SmoothPressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.coachTab,
                activeTab === tab && { backgroundColor: theme.buttonPrimary },
              ]}
            >
              <Text style={{
                color: activeTab === tab ? '#FFFFFF' : theme.textSecondary,
                fontSize: 12,
                fontWeight: '700',
              }}>
                {label}
              </Text>
            </SmoothPressable>
          ))}
        </View>

        {answer && (
          <View style={[styles.answerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.answerHeader}>
              <View style={[styles.answerIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.tint} />
              </View>
              <Text style={[styles.answerLabel, { color: theme.tint }]}>{copy.answerLabel}</Text>
              <SmoothPressable
                accessibilityRole="button"
                accessibilityLabel={copy.dismissAnswer}
                onPress={() => setAnswer(null)}
                style={styles.dismissButton}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </SmoothPressable>
            </View>
            <Text style={[styles.answerTitle, { color: theme.text }]}>{answer.title}</Text>
            <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{answer.body}</Text>
          </View>
        )}

        {copy.sections
          .filter((section, index) =>
            (activeTab === 'spending' && index === 0)
            || (activeTab === 'allowance' && index === 1)
            || (activeTab === 'savings' && index === 2)
          )
          .map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            {section.prompts.map((item) => (
              <SmoothPressable
                key={item.title}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.description}`}
                disabled={loading}
                onPress={() => selectTopic(item.topic)}
                style={[styles.promptCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.promptIcon, { backgroundColor: `${theme.tint}14` }]}>
                  <Ionicons name={item.icon} size={18} color={theme.tint} />
                </View>
                <View style={styles.promptCopy}>
                  <Text style={[styles.promptTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.promptDescription, { color: theme.textSecondary }]}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </SmoothPressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default CoachScreen;

function SnapshotValue({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.snapshotCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.snapshotLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.snapshotAmount, { color }]}>
        {formatMoney(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24, gap: 14 },
  optionHeader: { gap: 4 },
  optionTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  optionSubtitle: { fontSize: 12.5, lineHeight: 17 },
  optionPrivacy: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  optionPrivacyText: { flex: 1, fontSize: 11.5, lineHeight: 16 },
  nextStepCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  nextStepIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  nextStepCopy: { flex: 1, gap: 3 },
  nextStepTitle: { fontSize: 14, fontWeight: '700' },
  nextStepBody: { fontSize: 13, lineHeight: 18 },
  monthSnapshot: { gap: 8 },
  monthSnapshotTitle: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  monthSnapshotRow: { flexDirection: 'row', gap: 8 },
  snapshotCard: { flex: 1, minWidth: 0, padding: 11, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  snapshotLabel: { fontSize: 11.5 },
  snapshotAmount: { fontSize: 15, fontWeight: '700' },
  coachTabs: { height: 38, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 3, flexDirection: 'row', gap: 4 },
  coachTab: { flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  answerCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 14, gap: 8 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  answerIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  answerLabel: { flex: 1, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8 },
  dismissButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  answerTitle: { fontSize: 15, fontWeight: '700' },
  answerBody: { fontSize: 13, lineHeight: 19 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  promptCard: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  promptIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  promptCopy: { flex: 1, gap: 2 },
  promptTitle: { fontSize: 13.5, fontWeight: '600', lineHeight: 18 },
  promptDescription: { fontSize: 11.5, lineHeight: 16 },
});
