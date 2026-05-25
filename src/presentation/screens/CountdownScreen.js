import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppConstants } from '../../core/constants/appConstants';

const { WORKOUT_TYPES } = AppConstants;

const SIZE = 220;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Must be outside component — recreating inside causes instant-snap bug
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ACTIVITY_META = {
  [WORKOUT_TYPES.WALK]: { icon: 'walk',     label: 'Outdoor Walk' },
  [WORKOUT_TYPES.RUN]:  { icon: 'run-fast', label: 'Outdoor Run' },
  [WORKOUT_TYPES.CYCLE]:{ icon: 'bike',     label: 'Outdoor Cycle' },
  [WORKOUT_TYPES.GYM]:  { icon: 'dumbbell', label: 'Strength Training' },
};

export function CountdownScreen({ route, navigation }) {
  const { activityType, destination } = route.params;
  const meta = ACTIVITY_META[activityType] || { icon: 'run-fast', label: 'Workout' };

  const [count, setCount] = useState(3);
  // Single animation: 1 → 0 over 3000ms (full ring → empty ring)
  const progressAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim  = useRef(new Animated.Value(1)).current;

  // offset = 0 when progress=1 (full), offset = CIRCUMFERENCE when progress=0 (empty)
  const strokeDashoffset = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  useEffect(() => {
    // One single continuous drain over 3 seconds
    Animated.timing(progressAnim, {
      toValue:  0,
      duration: 3000,
      easing:   Easing.linear,
      useNativeDriver: false,
    }).start();

    // Haptic + number change at each second
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const t1 = setTimeout(() => {
      setCount(2);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1000);

    const t2 = setTimeout(() => {
      setCount(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 2000);

    const t3 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Animated.timing(opacityAnim, {
        toValue:  0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => navigation.replace(destination));
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      progressAnim.stopAnimation();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      {/* Activity icon */}
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={meta.icon} size={26} color="#30D158" />
      </View>

      {/* Ring */}
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          {/* Track */}
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke="#1A3A1A" strokeWidth={STROKE} fill="none"
          />
          {/* Single draining arc */}
          <AnimatedCircle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke="#30D158" strokeWidth={STROKE} fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>

        {/* Number in center */}
        <View style={styles.countWrap}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>

      {/* Label */}
      <Text style={styles.label}>{meta.label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#0F2E0F',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  ringWrap: {
    width: SIZE, height: SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  countWrap: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  countText: {
    color: '#FFF', fontSize: 96, fontWeight: '300', lineHeight: 100,
  },
  label: {
    color: '#FFF', fontSize: 22, fontWeight: '400',
    marginTop: 32, letterSpacing: 0.3,
  },
});
