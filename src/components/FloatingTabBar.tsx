import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useTheme } from '@/theme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_GAP = 12;

export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const go = (route: (typeof state.routes)[number], focused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
  };
  const icon = (route: (typeof state.routes)[number], focused: boolean, size: number) =>
    descriptors[route.key].options.tabBarIcon?.({
      focused,
      color: focused ? '#FFFFFF' : theme.textSecondary,
      size,
    });

  const hiddenRoutes = new Set(['chat', 'insights', 'coach', 'history']);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + TAB_BAR_GAP }]}
    >
      <View style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {state.routes
          .filter((route) => !hiddenRoutes.has(route.name))
          .map((route) => {
            const focused = state.routes[state.index]?.key === route.key;
            const { title } = descriptors[route.key].options;
            const isAdd = route.name === 'add';
            return (
              <SmoothPressable
                key={route.key}
                onPress={() => go(route, focused)}
                accessibilityLabel={title ?? route.name}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                style={[
                  styles.item,
                  isAdd && styles.addItem,
                  focused && !isAdd && { backgroundColor: theme.buttonPrimary, borderRadius: TAB_BAR_HEIGHT / 2 },
                ]}
              >
                {isAdd ? (
                  <View style={[styles.addIcon, { backgroundColor: theme.buttonPrimary }]}>
                    <Ionicons name="add" size={27} color="#FFFFFF" />
                  </View>
                ) : (
                  <>
                    {icon(route, focused, 23)}
                    <Text style={[styles.label, { color: focused ? '#FFFFFF' : theme.textSecondary }]}>
                      {title ?? route.name}
                    </Text>
                  </>
                )}
              </SmoothPressable>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    paddingHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadow(),
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, marginVertical: 4 },
  addItem: { justifyContent: 'center' },
  addIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '600' },
});

function shadow() {
  return {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  };
}
