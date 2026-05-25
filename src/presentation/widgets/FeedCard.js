import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { formatDistance, formatDuration } from '../../core/utils/distanceCalculator';
import { GlassCard } from './GlassCard';

const ACTIVITY_CONFIG = {
  run: { icon: 'run-fast', label: 'Run', color: '#30D158' },
  walk: { icon: 'walk', label: 'Walk', color: '#FFD60A' },
  cycle: { icon: 'bike', label: 'Cycle', color: '#FF9F0A' },
  gym: { icon: 'dumbbell', label: 'Strength', color: '#BF5AF2' },
};

export function FeedCard({ activity, onPress }) {
  const { theme } = useTheme();
  const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.run;
  const isGym = activity.type === 'gym';
  const hasRoute = activity.routePoints && activity.routePoints.length > 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
    >
      <GlassCard style={styles.card}>
      {/* Route map thumbnail */}
      {hasRoute && (
        <View style={styles.mapThumb}>
          <RouteMap routePoints={activity.routePoints} color={config.color} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.iconBadge, { backgroundColor: config.color + '20' }]}>
            <MaterialCommunityIcons name={config.icon} size={16} color={config.color} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {activity.title || config.label}
            </Text>
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {new Date(activity.startTime).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric'
              })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {isGym ? (
            <>
              <Stat label="Time" value={formatDuration(activity.durationSeconds)} theme={theme} />
              <Stat label="Exercises" value={`${activity.gymExercises?.length || 0}`} theme={theme} />
              <Stat label="Calories" value={`${Math.round(activity.caloriesBurned)}`} theme={theme} />
            </>
          ) : (
            <>
              <Stat label="Distance" value={formatDistance(activity.distanceMeters)} theme={theme} />
              <Stat label="Time" value={formatDuration(activity.durationSeconds)} theme={theme} />
              <Stat label="Calories" value={`${Math.round(activity.caloriesBurned)}`} theme={theme} />
            </>
          )}
        </View>
      </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

function Stat({ label, value, theme }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

function RouteMap({ routePoints, color }) {
  const coords = routePoints.map((p) => ({ latitude: p[0], longitude: p[1] }));
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of routePoints) {
    if (p[0] < minLat) minLat = p[0];
    if (p[0] > maxLat) maxLat = p[0];
    if (p[1] < minLng) minLng = p[1];
    if (p[1] > maxLng) maxLng = p[1];
  }
  const latDelta = Math.max((maxLat - minLat) * 1.6, 0.004);
  const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.004);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  return (
    <MapView
      key={`map-${centerLat}-${centerLng}`}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      showsUserLocation={false}
      showsCompass={false}
      showsScale={false}
      showsPointsOfInterest={false}
      showsBuildings={false}
      legalLabelInsets={{ bottom: -100, right: -100 }}
      userInterfaceStyle="dark"
      initialRegion={{
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      }}
    >
      <Polyline coordinates={coords} strokeColor={color} strokeWidth={4} lineCap="round" lineJoin="round" />
    </MapView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  mapThumb: { height: 120 },
  map: { flex: 1 },
  content: { padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 13, marginTop: 1 },
  statsRow: { flexDirection: 'row', marginTop: 12, gap: 4 },
  stat: { flex: 1 },
  statValue: { fontSize: 15, fontWeight: '600' },
  statLabel: { fontSize: 12, marginTop: 1 },
});
