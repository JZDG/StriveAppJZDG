import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const TAB_CONFIG = [
  { name: 'Home', icon: 'fitness', iconOutline: 'fitness-outline', label: 'Summary', lib: 'ion' },
  { name: 'Explore', icon: 'compass', iconOutline: 'compass-outline', label: 'Explore', lib: 'ion' },
  { name: 'Workout', icon: 'run-fast', iconOutline: 'run', label: 'Workout', lib: 'mci' },
  { name: 'History', icon: 'time', iconOutline: 'time-outline', label: 'History', lib: 'ion' },
];

function TabItem({ route, isFocused, onPress, config }) {
  const animValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isFocused ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const color = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#30D158'],
  });

  const iconName = isFocused ? config.icon : config.iconOutline;

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
      <Animated.View style={{ opacity: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }}>
        {config.lib === 'mci' ? (
          <MaterialCommunityIcons name={iconName} size={22} color={isFocused ? '#30D158' : '#FFF'} />
        ) : (
          <Ionicons name={iconName} size={22} color={isFocused ? '#30D158' : '#FFF'} />
        )}
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, { color: isFocused ? '#30D158' : '#FFF', opacity: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]}>
        {config.label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export function CustomTabBar({ state, descriptors, navigation }) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevIndex = useRef(state.index);

  useEffect(() => {
    if (prevIndex.current !== state.index) {
      prevIndex.current = state.index;
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();
    }
  }, [state.index]);

  // Hide tab bar when on sub-screens (ActiveWorkout, GymWorkout, ActivityDetail, StatsDetail)
  const hiddenScreens = ['ActiveWorkout', 'GymWorkout', 'ActivityDetail', 'StatsDetail', 'Navigation', 'Countdown'];
  for (let i = 0; i < state.routes.length; i++) {
    const tabRoute = state.routes[i];
    const nestedState = tabRoute?.state;
    if (nestedState && nestedState.index > 0 && i === state.index) {
      const nestedRoute = nestedState.routes[nestedState.index];
      if (hiddenScreens.includes(nestedRoute?.name)) return null;
    }
  }

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.7)'],
  });

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.blur} />
      <Animated.View style={[styles.border, { borderColor }]} />
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[index];
          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              config={config}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
});
