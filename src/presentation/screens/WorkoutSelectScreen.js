import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../core/theme/ThemeContext';
import { useWorkout } from '../../domain/providers/WorkoutContext';
import { AppConstants } from '../../core/constants/appConstants';
import { GlassCard } from '../widgets/GlassCard';

const { WORKOUT_TYPES } = AppConstants;

const WORKOUTS = [
  { type: WORKOUT_TYPES.WALK, icon: 'walk', label: 'Outdoor Walk', video: require('../../../assets/walking.mp4'), color: '#30D158' },
  { type: WORKOUT_TYPES.RUN, icon: 'run-fast', label: 'Outdoor Run', video: require('../../../assets/running.mp4'), color: '#30D158' },
  { type: WORKOUT_TYPES.CYCLE, icon: 'bike', label: 'Outdoor Cycle', video: require('../../../assets/bike.mp4'), color: '#30D158' },
  { type: WORKOUT_TYPES.GYM, icon: 'dumbbell', label: 'Strength Training', video: null, color: '#30D158' },
];

export function WorkoutSelectScreen({ navigation }) {
  const { theme } = useTheme();
  const { setActivityType, startWorkout } = useWorkout();

  const handleStart = async (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActivityType(type);
    const started = await startWorkout();
    if (started) {
      const destination = type === WORKOUT_TYPES.GYM ? 'GymWorkout' : 'ActiveWorkout';
      navigation.navigate('Countdown', { activityType: type, destination });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Workout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {WORKOUTS.map((item) => (
          <GlassCard key={item.type} style={styles.card}>
            {/* Video icon */}
            <View style={styles.videoIcon}>
              {item.video ? (
                <Video
                  source={item.video}
                  style={styles.videoThumb}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted
                  useNativeControls={false}
                  pointerEvents="none"
                />
              ) : (
                <View style={styles.iconFallback}>
                  <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                </View>
              )}
            </View>

            {/* Play button */}
            <TouchableOpacity style={styles.playBtn} onPress={() => handleStart(item.type)}>
              <Ionicons name="play" size={20} color="#000" />
            </TouchableOpacity>

            {/* Label */}
            <Text style={styles.cardLabel}>{item.label}</Text>

            {/* Bottom row — options */}
            <View style={styles.cardOptions}>
              <TouchableOpacity style={styles.optionBtn}>
                <MaterialCommunityIcons name="tune-variant" size={16} color="#FFF8" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.optionBtn, { flex: 2 }]}>
                <Ionicons name="refresh" size={16} color="#FFF8" />
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 34, fontWeight: '700' },
  scroll: { paddingHorizontal: 16 },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    position: 'relative',
  },
  cardIcon: { marginBottom: 8 },
  videoIcon: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', marginBottom: 8 },
  videoThumb: { width: 50, height: 50 },
  iconFallback: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(48,209,88,0.15)', alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#30D158', alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  cardOptions: { flexDirection: 'row', gap: 8 },
  optionBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
});
