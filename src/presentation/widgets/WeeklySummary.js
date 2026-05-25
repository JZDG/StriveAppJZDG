import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { formatDuration } from '../../core/utils/distanceCalculator';
import { GlassCard } from './GlassCard';

export function WeeklySummary({ activities }) {
  const { theme } = useTheme();

  const totalDistance = activities.reduce((sum, a) => sum + a.distanceMeters, 0);
  const totalDuration = activities.reduce((sum, a) => sum + a.durationSeconds, 0);
  const totalCalories = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  const totalActivities = activities.length;

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.dashLabel, { color: theme.textPrimary }]}>DASHBOARD</Text>
          <Text style={[styles.subLabel, { color: theme.textMuted }]}>PERFORMANCE OVERVIEW</Text>
        </View>
        <Ionicons name="person-circle-outline" size={32} color={theme.textMuted + '30'} />
      </View>

      {/* Analytics Grid 2x2 */}
      <View style={styles.gridRow}>
        <GlassCard style={styles.analyticsBox}>
          <MaterialCommunityIcons name="map-marker-distance" size={14} color="#30D158" />
          <View style={styles.analyticsValueRow}>
            <Text style={[styles.analyticsValue, { color: theme.textPrimary }]}>{(totalDistance / 1000).toFixed(1)}</Text>
            <Text style={[styles.analyticsUnit, { color: '#30D158' }]}> KM</Text>
          </View>
          <Text style={[styles.analyticsLabel, { color: theme.textMuted }]}>DISTANCE</Text>
        </GlassCard>
        <GlassCard style={styles.analyticsBox}>
          <Ionicons name="time" size={14} color="#64D2FF" />
          <View style={styles.analyticsValueRow}>
            <Text style={[styles.analyticsValue, { color: theme.textPrimary }]}>{formatDuration(totalDuration)}</Text>
          </View>
          <Text style={[styles.analyticsLabel, { color: theme.textMuted }]}>TIME</Text>
        </GlassCard>
      </View>
      <View style={styles.gridRow}>
        <GlassCard style={styles.analyticsBox}>
          <MaterialCommunityIcons name="fire" size={14} color="#FF9F0A" />
          <View style={styles.analyticsValueRow}>
            <Text style={[styles.analyticsValue, { color: theme.textPrimary }]}>{Math.round(totalCalories)}</Text>
            <Text style={[styles.analyticsUnit, { color: '#FF9F0A' }]}> KCAL</Text>
          </View>
          <Text style={[styles.analyticsLabel, { color: theme.textMuted }]}>CALORIES</Text>
        </GlassCard>
        <GlassCard style={styles.analyticsBox}>
          <Ionicons name="flash" size={14} color="#FFD60A" />
          <View style={styles.analyticsValueRow}>
            <Text style={[styles.analyticsValue, { color: theme.textPrimary }]}>{totalActivities}</Text>
            <Text style={[styles.analyticsUnit, { color: '#FFD60A' }]}> SESSIONS</Text>
          </View>
          <Text style={[styles.analyticsLabel, { color: theme.textMuted }]}>ACTIVITIES</Text>
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingBottom: 8 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  dashLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  subLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 3 },
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  analyticsBox: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 14,
  },
  analyticsValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
  analyticsValue: { fontSize: 22, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
  analyticsUnit: { fontSize: 8, fontWeight: '900' },
  analyticsLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 2 },
});
