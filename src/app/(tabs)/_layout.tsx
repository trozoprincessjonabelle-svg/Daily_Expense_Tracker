import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { useTheme } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Apple-style tab icon: filled when selected, outline when not. */
function tabIcon(filled: IconName, outline: IconName, activeColor: string) {
  function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return (
      <View style={[
        styles.iconWrap,
        focused && { backgroundColor: `${activeColor}18` },
      ]}>
        <Ionicons
          name={focused ? filled : outline}
          size={size}
          color={typeof color === 'string' ? color : activeColor}
        />
      </View>
    );
  }
  return TabIcon;
}

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: theme.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 66,
          },
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            height: 68 + insets.bottom,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 6),
            backgroundColor: theme.card,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarItemStyle: { paddingTop: 2 },
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarLabel: 'Home', tabBarIcon: tabIcon('home', 'home-outline', theme.tint) }}
        />
        <Tabs.Screen
          name="ledger"
          options={{ title: 'Calendar', tabBarLabel: 'Calendar', tabBarIcon: tabIcon('calendar', 'calendar-outline', theme.tint) }}
        />
        <Tabs.Screen
          name="add"
          options={{ title: 'Add', tabBarLabel: 'Add', tabBarIcon: tabIcon('add', 'add', theme.tint) }}
        />
        <Tabs.Screen
          name="ai"
          options={{ title: 'AI', tabBarLabel: 'AI', tabBarIcon: tabIcon('sparkles', 'sparkles-outline', theme.tint) }}
        />
        <Tabs.Screen
          name="insights"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="coach"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="history"
          options={{ title: 'History' }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarLabel: 'Settings', tabBarIcon: tabIcon('settings', 'settings-outline', theme.tint) }}
        />
        <Tabs.Screen
          name="chat"
          options={{ href: null }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconWrap: {
    minWidth: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
