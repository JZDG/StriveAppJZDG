import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { useWorkout } from '../../domain/providers/WorkoutContext';
import { formatDuration } from '../../core/utils/distanceCalculator';
import { GlassCard } from '../widgets/GlassCard';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

export function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { history, loadHistory } = useWorkout();

  useEffect(() => { loadHistory(); }, []);

  // Calculate totals
  const totalCalories = history.reduce((s, a) => s + a.caloriesBurned, 0);
  const totalDistance = history.reduce((s, a) => s + a.distanceMeters, 0);
  const totalDuration = history.reduce((s, a) => s + a.durationSeconds, 0);
  const totalSteps = history.reduce((s, a) => s + (a.steps || 0), 0);
  const goalCalories = 300;
  const progress = Math.min(totalCalories / goalCalories, 1);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Summary</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{dayName}</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color={theme.textMuted} />
          </View>
        </View>

        {/* Activity Ring Card */}
        <GlassCard style={styles.ringCard}>
          <Text style={[styles.ringTitle, { color: theme.textPrimary }]}>Activity Ring</Text>
          <View style={styles.ringRow}>
            <ActivityRing progress={progress} size={120} />
            <View style={styles.ringInfo}>
              <Text style={[styles.ringLabel, { color: theme.textMuted }]}>Move</Text>
              <Text style={styles.ringValue}>
                <Text style={{ color: '#30D158' }}>{Math.round(totalCalories)}</Text>
                <Text style={{ color: theme.textMuted }}>/{goalCalories} </Text>
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>KCAL</Text>
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Step Count + Distance */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#1C1C1E' }]}
            onPress={() => navigation.navigate('StatsDetail', { statType: 'steps', color: '#5AC8FA' })}
            activeOpacity={0.7}
          >
            <View style={styles.gridCardHeader}>
              <Text style={[styles.gridCardTitle, { color: theme.textPrimary }]}>Step Count</Text>
              <Ionicons name="chevron-forward-circle-outline" size={20} color={theme.textMuted} />
            </View>
            <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>Today</Text>
            <Text style={[styles.gridCardValue, { color: '#5AC8FA' }]}>
              {totalSteps.toLocaleString()}
            </Text>
            <View style={styles.miniChart}>
              {[0.2, 0.1, 0.4, 0.8, 0.3, 0.1].map((h, i) => (
                <View key={i} style={styles.miniChartBarWrap}>
                  <View style={[styles.miniChartBar, { height: h * 24, backgroundColor: i === 3 ? '#5AC8FA' : '#3A3A3C' }]} />
                </View>
              ))}
            </View>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>12 AM</Text>
              <Text style={styles.chartLabel}>6 AM</Text>
              <Text style={styles.chartLabel}>12 PM</Text>
              <Text style={styles.chartLabel}>6 PM</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#1C1C1E' }]}
            onPress={() => navigation.navigate('StatsDetail', { statType: 'distance', color: '#30D158' })}
            activeOpacity={0.7}
          >
            <View style={styles.gridCardHeader}>
              <Text style={[styles.gridCardTitle, { color: theme.textPrimary }]}>Distance</Text>
              <Ionicons name="chevron-forward-circle-outline" size={20} color={theme.textMuted} />
            </View>
            <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>Today</Text>
            <Text style={[styles.gridCardValue, { color: '#30D158' }]}>
              {(totalDistance / 1000).toFixed(2)}<Text style={styles.gridCardUnit}>KM</Text>
            </Text>
            <View style={styles.miniChart}>
              {[0.1, 0.05, 0.3, 0.6, 0.2, 0.05].map((h, i) => (
                <View key={i} style={styles.miniChartBarWrap}>
                  <View style={[styles.miniChartBar, { height: h * 24, backgroundColor: i === 3 ? '#30D158' : '#3A3A3C' }]} />
                </View>
              ))}
            </View>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>12 AM</Text>
              <Text style={styles.chartLabel}>6 AM</Text>
              <Text style={styles.chartLabel}>12 PM</Text>
              <Text style={styles.chartLabel}>6 PM</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sessions + Duration */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#1C1C1E' }]}
            onPress={() => navigation.navigate('StatsDetail', { statType: 'sessions', color: '#BF5AF2' })}
            activeOpacity={0.7}
          >
            <View style={styles.gridCardHeader}>
              <Text style={[styles.gridCardTitle, { color: theme.textPrimary }]}>Sessions</Text>
              <Ionicons name="chevron-forward-circle-outline" size={20} color={theme.textMuted} />
            </View>
            <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>Total</Text>
            <Text style={[styles.gridCardValue, { color: '#BF5AF2' }]}>
              {history.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#1C1C1E' }]}
            onPress={() => navigation.navigate('StatsDetail', { statType: 'duration', color: '#FF9F0A' })}
            activeOpacity={0.7}
          >
            <View style={styles.gridCardHeader}>
              <Text style={[styles.gridCardTitle, { color: theme.textPrimary }]}>Duration</Text>
              <Ionicons name="chevron-forward-circle-outline" size={20} color={theme.textMuted} />
            </View>
            <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>Total</Text>
            <Text style={[styles.gridCardValue, { color: '#FF9F0A' }]}>
              {formatDuration(totalDuration)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activities — with map thumbnails */}
        {history.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent</Text>
            {history.slice(0, 5).map((activity) => {
              const hasRoute = activity.routePoints && activity.routePoints.length > 1;
              return (
                <TouchableOpacity
                  key={activity.id}
                  style={[styles.recentCard, { backgroundColor: '#1C1C1E' }]}
                  onPress={() => navigation.navigate('ActivityDetail', { activity })}
                  activeOpacity={0.7}
                >
                  {/* Map thumbnail */}
                  {hasRoute && (
                    <View style={styles.recentMap}>
                      <MapView
                        style={styles.recentMapView}
                        provider={PROVIDER_DEFAULT}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                        showsUserLocation={false}
                        showsCompass={false}
                        showsScale={false}
                        showsPointsOfInterest={false}
                        legalLabelInsets={{ bottom: -100, right: -100 }}
                        userInterfaceStyle="dark"
                        initialRegion={{
                          latitude: (activity.routePoints[0][0] + activity.routePoints[activity.routePoints.length - 1][0]) / 2,
                          longitude: (activity.routePoints[0][1] + activity.routePoints[activity.routePoints.length - 1][1]) / 2,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                      >
                        <Polyline
                          coordinates={activity.routePoints.map(p => ({ latitude: p[0], longitude: p[1] }))}
                          strokeColor="#30D158"
                          strokeWidth={3}
                          lineCap="round"
                          lineJoin="round"
                        />
                      </MapView>
                    </View>
                  )}
                  {/* Info */}
                  <View style={styles.recentInfo}>
                    <View style={styles.recentInfoTop}>
                      <View style={[styles.recentIcon, { backgroundColor: '#30D15820' }]}>
                        <Ionicons name="fitness" size={14} color="#30D158" />
                      </View>
                      <Text style={[styles.recentTitle, { color: theme.textPrimary }]}>{activity.title || activity.typeLabel}</Text>
                    </View>
                    <View style={styles.recentStats}>
                      <Text style={[styles.recentStat, { color: theme.textMuted }]}>{(activity.distanceMeters / 1000).toFixed(2)} km</Text>
                      <Text style={[styles.recentStat, { color: theme.textMuted }]}>·</Text>
                      <Text style={[styles.recentStat, { color: theme.textMuted }]}>{formatDuration(activity.durationSeconds)}</Text>
                      <Text style={[styles.recentStat, { color: theme.textMuted }]}>·</Text>
                      <Text style={[styles.recentStat, { color: theme.textMuted }]}>{Math.round(activity.caloriesBurned)} kcal</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityRing({ progress, size }) {
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size}>
      {/* Background ring — dark muted green */}
      <SvgCircle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="#0A3A1A" strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round"
      />
      {/* Progress ring — bright green */}
      <SvgCircle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="#30D158" strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        rotation="-90" origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, marginBottom: 20 },
  title: { fontSize: 34, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  // Activity Ring
  ringCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  ringTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  ringRow: { flexDirection: 'row', alignItems: 'center' },
  ringInfo: { marginLeft: 20 },
  ringLabel: { fontSize: 14 },
  ringValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  // Grid cards
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridCard: { flex: 1, borderRadius: 16, padding: 14, minHeight: 130 },
  gridCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridCardTitle: { fontSize: 14, fontWeight: '600' },
  gridCardSub: { fontSize: 12, marginTop: 4 },
  gridCardValue: { fontSize: 28, fontWeight: '700', marginTop: 8 },
  gridCardUnit: { fontSize: 14, fontWeight: '500' },
  // Mini chart
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12, height: 24 },
  miniChartBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 24 },
  miniChartBar: { width: 6, borderRadius: 3, minHeight: 2 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  chartLabel: { fontSize: 8, color: '#8E8E93' },
  // Recent
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 12 },
  recentCard: { borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  recentMap: { height: 140 },
  recentMapView: { flex: 1 },
  recentInfo: { padding: 14 },
  recentInfoTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recentTitle: { fontSize: 16, fontWeight: '600' },
  recentStats: { flexDirection: 'row', gap: 6, marginTop: 6 },
  recentStat: { fontSize: 13 },
});
