import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LedgerTransaction, UpcomingEvent } from '@/db/ledger';
import { formatDate, formatMoney } from '@/ledger/format';
import { useTheme } from '@/theme';
import { useSettings } from '@/settings/SettingsContext';
import { SmoothPressable } from '../SmoothPressable';

export function HomeNotificationsModal({
  visible,
  events,
  transactions,
  loading,
  unreadCount,
  onClose,
  onMarkAllRead,
}: {
  visible: boolean;
  events: UpcomingEvent[];
  transactions: LedgerTransaction[];
  loading: boolean;
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
}) {
  const theme = useTheme();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const popupHeight = Math.min(height * 0.62, 420, height - insets.top - 76);
  const [slideX] = useState(() => new Animated.Value(width));
  const notifications: {
    id: string;
    createdAt: number;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    tone: string;
    title: string;
    body: string;
    translateTitle: boolean;
  }[] = [
    ...events.map((event) => ({
      id: `event-${event.id}`,
      createdAt: event.created_at,
      icon: 'calendar-outline' as React.ComponentProps<typeof Ionicons>['name'],
      tone: theme.tint,
      title: event.title,
      translateTitle: false,
      body: `${formatDate(event.event_date, settings.language)}${event.amount > 0 ? ` · ${formatMoney(event.amount)}` : ''}`,
    })),
    ...transactions.map((transaction) => {
      const income = transaction.type === 'income';
      return {
        id: `transaction-${transaction.id}`,
        createdAt: transaction.created_at,
        icon: income ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline' as React.ComponentProps<typeof Ionicons>['name'],
        tone: income ? theme.success : theme.tint,
        title: income ? 'Money received' : 'Expense recorded',
        translateTitle: true,
        body: `${transaction.category} · ${income ? '+' : '-'}${formatMoney(transaction.amount)} · ${formatDate(transaction.transaction_date, settings.language)}`,
      };
    }),
  ].sort((a, b) => b.createdAt - a.createdAt);

  useEffect(() => {
    if (!visible) return;
    slideX.setValue(width);
    Animated.timing(slideX, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [slideX, visible, width]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close notifications"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
        <Animated.View
          style={[
            styles.popup,
            {
              width: Math.min(width - 24, 340),
              height: popupHeight,
              marginTop: insets.top + 52,
              backgroundColor: theme.card,
              borderColor: theme.border,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: `${theme.tint}18` }]}>
              <Ionicons name="notifications-outline" size={18} color={theme.tint} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Your money updates</Text>
            </View>
            <SmoothPressable
              accessibilityRole="button"
              accessibilityLabel="Close notifications"
              onPress={onClose}
              style={[styles.close, { backgroundColor: theme.buttonSecondary }]}
            >
              <Ionicons name="close" size={21} color={theme.textSecondary} />
            </SmoothPressable>
          </View>

          <SmoothPressable
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
            accessibilityState={{ disabled: unreadCount === 0 }}
            disabled={unreadCount === 0}
            onPress={onMarkAllRead}
            style={[
              styles.markReadButton,
              { backgroundColor: theme.buttonSecondary, opacity: unreadCount === 0 ? 0.55 : 1 },
            ]}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={theme.tint} />
            <Text style={[styles.markReadLabel, { color: theme.tint }]}>Mark all as read</Text>
          </SmoothPressable>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                icon={notification.icon}
                tone={notification.tone}
                title={notification.title}
                translateTitle={notification.translateTitle}
                body={notification.body}
              />
            ))}

            {!loading && notifications.length === 0 && (
              <View style={styles.empty}>
                <View style={[styles.emptyIcon, { backgroundColor: `${theme.success}18` }]}>
                  <Ionicons name="checkmark" size={23} color={theme.success} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>You’re all caught up</Text>
                <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>
                  New money updates and upcoming events will show here.
                </Text>
              </View>
            )}

            <Text style={[styles.note, { color: theme.textSecondary }]}>
              On-device updates · no push notifications
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function NotificationItem({
  icon,
  tone,
  title,
  translateTitle,
  body,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone: string;
  title: string;
  translateTitle: boolean;
  body: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.itemIcon, { backgroundColor: `${tone}18` }]}>
        <Ionicons name={icon} size={19} color={tone} />
      </View>
      <View style={styles.itemCopy}>
        <Text translate={translateTitle} style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.itemBody, { color: theme.textSecondary }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.16)' },
  popup: { marginRight: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 13, elevation: 12, shadowColor: '#000000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.16, shadowRadius: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 11 },
  headerIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 3 },
  title: { fontSize: 16, fontWeight: '800' },
  close: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  markReadButton: { minHeight: 34, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  markReadLabel: { fontSize: 11, fontWeight: '700' },
  scroll: { flex: 1, flexShrink: 1, minHeight: 0 },
  list: { gap: 7, paddingBottom: 9 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth },
  itemIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 12, fontWeight: '700' },
  itemBody: { fontSize: 11, lineHeight: 15 },
  empty: { alignItems: 'center', paddingVertical: 17, paddingHorizontal: 12, gap: 6 },
  emptyIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '700' },
  emptyCopy: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  note: { fontSize: 10, lineHeight: 14, textAlign: 'center', paddingHorizontal: 5, paddingTop: 2 },
});
