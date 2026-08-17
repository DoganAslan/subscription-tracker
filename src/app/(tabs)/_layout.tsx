import React, { useRef, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/context/LanguageContext';

function LiquidGlassTabBar({ state, descriptors, navigation }: any) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomMargin = Math.max(insets.bottom + 6, 16);
  // This is intentionally explicit: custom tab bars receive every mounted route,
  // even when Expo Router hides its href from the default tab bar.
  const primaryRouteNames = ['index', 'subscriptions', 'calendar', 'settings'];
  const visibleRoutes = state.routes.filter((route: any) =>
    primaryRouteNames.some((name) => route.name === name || route.name.startsWith(`${name}/`))
  );
  const activeRouteKey = state.routes[state.index]?.key;
  const totalTabs = visibleRoutes.length;
  const activeIndex = Math.max(0, visibleRoutes.findIndex((route: any) => route.key === activeRouteKey));

  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 32);
  const tabWidth = containerWidth / Math.max(1, totalTabs);

  const slideAnim = useRef(new Animated.Value(activeIndex * tabWidth)).current;
  const lastHoveredIndex = useRef(activeIndex);
  const containerRef = useRef<View>(null);
  const [containerPageX, setContainerPageX] = useState(16);

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex * tabWidth,
      tension: 340,
      friction: 22,
      useNativeDriver: false,
    }).start();
    lastHoveredIndex.current = activeIndex;
  }, [activeIndex, tabWidth]);

  const getTargetIndexFromPageX = (pageX: number) => {
    const relativeX = pageX - containerPageX;
    const idx = Math.min(Math.max(0, Math.floor(relativeX / tabWidth)), totalTabs - 1);
    return isNaN(idx) ? activeIndex : idx;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 8,
      onPanResponderGrant: (evt) => {
        const pageX = evt.nativeEvent.pageX || (evt.nativeEvent as any).clientX || 0;
        const targetIndex = getTargetIndexFromPageX(pageX);
        if (targetIndex !== lastHoveredIndex.current) {
          lastHoveredIndex.current = targetIndex;
          triggerHaptic('selection');
        }
        Animated.spring(slideAnim, {
          toValue: targetIndex * tabWidth,
          tension: 350,
          friction: 22,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (evt) => {
        const pageX = evt.nativeEvent.pageX || (evt.nativeEvent as any).clientX || 0;
        const targetIndex = getTargetIndexFromPageX(pageX);
        if (targetIndex !== lastHoveredIndex.current) {
          lastHoveredIndex.current = targetIndex;
          triggerHaptic('selection');
        }
        Animated.spring(slideAnim, {
          toValue: targetIndex * tabWidth,
          tension: 350,
          friction: 22,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderRelease: (evt) => {
        const pageX = evt.nativeEvent.pageX || (evt.nativeEvent as any).clientX || 0;
        const finalIndex = getTargetIndexFromPageX(pageX);
        const route = visibleRoutes[finalIndex];
        const routeIndex = state.routes.findIndex((item: any) => item.key === route?.key);
        const isFocused = state.index === routeIndex;

        if (route) {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }
      },
    })
  ).current;

  return (
    <View
      ref={containerRef}
      style={[
        styles.liquidTabBarContainer,
        {
          bottom: bottomMargin,
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
          shadowColor: isDark ? '#000000' : '#3B82F6',
        },
      ]}
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width);
        if (containerRef.current && (containerRef.current as any).measure) {
          (containerRef.current as any).measure((_x: number, _y: number, _w: number, _h: number, pageX: number) => {
            if (pageX) setContainerPageX(pageX);
          });
        }
      }}
      {...panResponder.panHandlers}
    >
      {/* Liquid Glass Sliding Active Pill Indicator */}
      <Animated.View
        style={[
          styles.liquidActiveIndicator,
          {
            width: tabWidth - 6,
            transform: [{ translateX: slideAnim }],
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.16)',
            borderColor: colors.primary + '40',
          },
        ]}
      />

      {/* Tab Buttons */}
      {visibleRoutes.map((route: any) => {
        const { options } = descriptors[route.key];
        const isFocused = state.routes[state.index]?.key === route.key;
        const rName = (route.name || '').toLowerCase();

        let iconName: any = 'grid-outline';
        if (rName.includes('subscription')) {
          iconName = isFocused ? 'list' : 'list-outline';
        } else if (rName.includes('analytic')) {
          iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
        } else if (rName.includes('ai')) {
          iconName = isFocused ? 'sparkles' : 'sparkles-outline';
        } else if (rName.includes('calendar')) {
          iconName = isFocused ? 'calendar' : 'calendar-outline';
        } else if (rName.includes('wallet')) {
          iconName = isFocused ? 'wallet' : 'wallet-outline';
        } else if (rName.includes('setting')) {
          iconName = isFocused ? 'cog' : 'cog-outline';
        } else {
          iconName = isFocused ? 'home' : 'home-outline';
        }

        const activeColor = rName.includes('ai') ? '#8B5CF6' : colors.primary;
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.liquidTabItem, { width: tabWidth }]}
            onPress={() => {
              triggerHaptic('selection');
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, isFocused && { transform: [{ scale: 1.1 }] }]}>
              <Ionicons
                name={iconName}
                size={20}
                color={isFocused ? activeColor : colors.textSecondary}
              />
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.liquidTabLabel,
                {
                  color: isFocused ? activeColor : colors.textSecondary,
                  fontWeight: isFocused ? '800' : '600',
                  opacity: isFocused ? 1 : 0.75,
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  useTheme();
  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarLabel: t.tabs.home,
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: t.tabs.subscriptions,
          tabBarLabel: isTurkish ? 'Takip' : 'List',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: isTurkish ? 'Analiz' : 'Analytics',
          tabBarLabel: isTurkish ? 'Analiz' : 'Analytics',
          href: null,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.tabs.calendar,
          tabBarLabel: isTurkish ? 'Takvim' : 'Calendar',
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t.tabs.wallet,
          tabBarLabel: isTurkish ? 'Cüzdan' : 'Wallet',
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: isTurkish ? 'Ayarlar' : 'Settings',
          tabBarLabel: isTurkish ? 'Ayarlar' : 'Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  liquidTabBarContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 58,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  liquidActiveIndicator: {
    position: 'absolute',
    left: 3,
    top: 5,
    bottom: 5,
    borderRadius: 22,
    borderWidth: 1,
  },
  liquidTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
    paddingVertical: 4,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liquidTabLabel: {
    fontSize: 9,
    marginTop: 2,
    letterSpacing: -0.2,
  },
});
