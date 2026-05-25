import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { formatDistance, formatDuration, formatPace } from '../../core/utils/distanceCalculator';
import { ShareCardModal } from '../widgets/ShareCard';
import { GlassCard } from '../widgets/GlassCard';

const { width } = Dimensions.get('window');

const ACTIVITY_ICONS = {
  run: 'run-fast',
  walk: 'walk',
  cycle: 'bike',
  gym: 'dumbbell',
};

export function ActivityDetailScreen({ route, navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { activity } = route.params;
  const [showReplay, setShowReplay] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayPaused, setReplayPaused] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(5);
  const replaySpeedRef = useRef(5);
  const [replayAutoCenter, setReplayAutoCenter] = useState(true);
  const replayAutoCenterRef = useRef(true);
  const [showShareCard, setShowShareCard] = useState(false);
  const mapRef = useRef(null);
  const replayTimerRef = useRef(null);

  // Tab bar hidden by native stack (full screen covers it)

  const hasRoute = activity.routePoints && activity.routePoints.length >= 2;
  const isGym = activity.type === 'gym';

  const polylineCoords = hasRoute
    ? activity.routePoints.map((p) => ({ latitude: p[0], longitude: p[1] }))
    : [];

  const distKm = (activity.distanceMeters / 1000).toFixed(2);
  const avgSpeedKmh = activity.durationSeconds > 0
    ? ((activity.distanceMeters / 1000) / (activity.durationSeconds / 3600)).toFixed(1)
    : '0.0';

  // Fit map to route
  useEffect(() => {
    if (hasRoute && mapRef.current && !showReplay) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(polylineCoords, {
          edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
          animated: true,
        });
      }, 500);
    }
  }, [hasRoute, showReplay]);

  // Replay logic
  const startReplay = () => {
    if (!hasRoute) return;
    setShowReplay(true);
    setReplayIndex(0);
    setIsReplaying(true);
    setReplayAutoCenter(true);
    replayAutoCenterRef.current = true;

    // Fly to start
    const start = activity.routePoints[0];
    mapRef.current?.animateCamera({
      center: { latitude: start[0], longitude: start[1] },
      pitch: 60,
      heading: 0,
      altitude: 300,
      zoom: 18,
    }, { duration: 1500 });

    setTimeout(() => {
      runReplay(0);
    }, 2000);
  };

  // Interpolate route points for smoother replay (add sub-points between each GPS point)
  const smoothRoutePoints = React.useMemo(() => {
    if (!hasRoute) return [];
    const points = activity.routePoints;
    const smooth = [];
    const stepsPerSegment = 5; // 5 sub-points between each GPS point
    for (let i = 0; i < points.length - 1; i++) {
      const [lat1, lng1] = points[i];
      const [lat2, lng2] = points[i + 1];
      for (let s = 0; s < stepsPerSegment; s++) {
        const t = s / stepsPerSegment;
        smooth.push([lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]);
      }
    }
    smooth.push(points[points.length - 1]);
    return smooth;
  }, [activity.routePoints, hasRoute]);

  const runReplay = (startIdx) => {
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    let idx = startIdx;
    const totalPoints = smoothRoutePoints.length;
    const interval = 30; // Fixed 30ms tick
    const skip = Math.max(1, Math.round(replaySpeedRef.current)); // Points to skip per tick

    // Start camera at first point (zoomed in, tilted 3D)
    const startPt = smoothRoutePoints[startIdx] || smoothRoutePoints[0];
    if (startPt) {
      mapRef.current?.animateCamera({
        center: { latitude: startPt[0], longitude: startPt[1] },
        pitch: 60,
        altitude: 400,
        zoom: 17.5,
      }, { duration: 1000 });
    }

    replayTimerRef.current = setInterval(() => {
      idx += skip;
      if (idx >= totalPoints) {
        clearInterval(replayTimerRef.current);
        setIsReplaying(false);
        setReplayIndex(totalPoints - 1);
        return;
      }
      setReplayIndex(idx);

      // Camera follow handled by camera prop on MapView
    }, interval);
  };

  const pauseReplay = () => {
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    setReplayPaused(true);
  };

  const resumeReplay = () => {
    setReplayPaused(false);
    runReplay(replayIndex);
  };

  const seekReplay = (direction) => {
    // Jump 10% forward or backward
    const jump = Math.round(smoothRoutePoints.length * 0.1);
    const newIdx = direction === 'forward'
      ? Math.min(replayIndex + jump, smoothRoutePoints.length - 1)
      : Math.max(replayIndex - jump, 0);
    setReplayIndex(newIdx);
    if (!replayPaused) {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
      runReplay(newIdx);
    }
  };

  const stopReplay = () => {
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    setIsReplaying(false);
    setShowReplay(false);
    // Fit overview
    if (hasRoute) {
      mapRef.current?.fitToCoordinates(polylineCoords, {
        edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, []);

  // Replay polyline (drawn portion only) — uses smooth points
  const replayCoords = showReplay
    ? smoothRoutePoints.slice(0, replayIndex + 1).map(p => ({ latitude: p[0], longitude: p[1] }))
    : polylineCoords;

  // Current replay position
  const replayPosition = showReplay && smoothRoutePoints[replayIndex]
    ? { latitude: smoothRoutePoints[replayIndex][0], longitude: smoothRoutePoints[replayIndex][1] }
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={22} color="#FFF" />
      </TouchableOpacity>

      {/* Share button */}
      <TouchableOpacity
        style={styles.shareBtn}
        onPress={() => setShowShareCard(true)}
      >
        <Ionicons name="share-outline" size={20} color="#FFF" />
      </TouchableOpacity>

      {/* Map Section (top half or full if replaying) */}
      {hasRoute && (
        <View style={[styles.mapSection, showReplay && styles.mapFull]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            userInterfaceStyle={isDarkMode ? 'dark' : 'light'}
            mapType="hybrid"
            pitchEnabled
            rotateEnabled
            onPanDrag={() => { setReplayAutoCenter(false); replayAutoCenterRef.current = false; }}
            camera={showReplay && replayAutoCenter && smoothRoutePoints[replayIndex] ? {
              center: { latitude: smoothRoutePoints[replayIndex][0], longitude: smoothRoutePoints[replayIndex][1] },
              pitch: 60,
              altitude: 400,
              zoom: 17.5,
            } : undefined}
          >
            {/* Route outline */}
            <Polyline
              coordinates={showReplay ? replayCoords : polylineCoords}
              strokeColor="#000000"
              strokeWidth={10}
              lineCap="round"
              lineJoin="round"
            />
            {/* Route line */}
            <Polyline
              coordinates={showReplay ? replayCoords : polylineCoords}
              strokeColor="#30D158"
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
            />

            {/* Start marker */}
            {polylineCoords.length > 0 && (
              <Marker coordinate={polylineCoords[0]} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.startMarker}>
                  <View style={styles.startDot} />
                </View>
              </Marker>
            )}

            {/* End marker (or replay puck) */}
            {replayPosition && showReplay ? (
              <Marker coordinate={replayPosition} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.puckOuter}>
                  <View style={styles.puckInner} />
                </View>
              </Marker>
            ) : polylineCoords.length > 1 ? (
              <Marker coordinate={polylineCoords[polylineCoords.length - 1]} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.endMarker}>
                  <Ionicons name="flag" size={12} color="#FFF" />
                </View>
              </Marker>
            ) : null}
          </MapView>

          {/* Replay button (when not replaying) */}
          {!showReplay && hasRoute && (
            <TouchableOpacity style={styles.replayBtn} onPress={startReplay}>
              <Ionicons name="play" size={16} color="#000" />
              <Text style={styles.replayBtnText}>REPLAY</Text>
            </TouchableOpacity>
          )}

          {/* Replay Controls — bottom modal dock */}
          {showReplay && (
            <View style={styles.replayDock}>
              {/* Speed selector row */}
              <View style={styles.speedRow}>
                {[0.5, 1, 2, 5, 10, 20].map((spd) => (
                  <TouchableOpacity
                    key={spd}
                    style={[styles.speedBtn, replaySpeed === spd && styles.speedBtnActive]}
                    onPress={() => { replaySpeedRef.current = spd; setReplaySpeed(spd); if (!replayPaused) { clearInterval(replayTimerRef.current); runReplay(replayIndex); } }}
                  >
                    <Text style={[styles.speedText, replaySpeed === spd && styles.speedTextActive]}>
                      {spd}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Playback controls row */}
              <View style={styles.playbackRow}>
                <TouchableOpacity style={styles.playbackBtn} onPress={() => { if (replayTimerRef.current) clearInterval(replayTimerRef.current); setReplayIndex(0); setReplayPaused(false); runReplay(0); }}>
                  <Ionicons name="refresh" size={20} color="#30D158" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playbackBtn} onPress={() => seekReplay('backward')}>
                  <Ionicons name="play-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playbackBtnLarge} onPress={replayPaused ? resumeReplay : pauseReplay}>
                  <Ionicons name={replayPaused ? 'play' : 'pause'} size={28} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playbackBtn} onPress={() => seekReplay('forward')}>
                  <Ionicons name="play-forward" size={22} color="#FFF" />
                </TouchableOpacity>
                {!replayAutoCenter && (
                  <TouchableOpacity style={styles.playbackBtn} onPress={() => { setReplayAutoCenter(true); replayAutoCenterRef.current = true; }}>
                    <Ionicons name="locate" size={20} color="#30D158" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Stats HUD — centered overlay on top */}
          {showReplay && isReplaying && (
            <View style={styles.replayHUD}>
              <Text style={styles.hudBigValue}>
                {((replayIndex / Math.max(smoothRoutePoints.length - 1, 1)) * activity.distanceMeters / 1000).toFixed(1)}
              </Text>
              <Text style={styles.hudBigLabel}>KM</Text>

              <Text style={styles.hudMedValue}>
                {activity.routeSpeeds && activity.routeSpeeds.length > 0
                  ? (activity.routeSpeeds[Math.min(Math.floor(replayIndex / 5), activity.routeSpeeds.length - 1)] * 3.6).toFixed(0)
                  : '0'}
                <Text style={styles.hudMedUnit}> km/h</Text>
              </Text>
              <Text style={styles.hudMedLabel}>Speed</Text>

              <Text style={styles.hudMedValue}>
                {formatDuration(Math.round((replayIndex / Math.max(smoothRoutePoints.length - 1, 1)) * activity.durationSeconds))}
              </Text>
              <Text style={styles.hudMedLabel}>Duration</Text>
            </View>
          )}
        </View>
      )}

      {/* Details Section */}
      {!showReplay && (
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <GlassCard style={styles.header}>
            <View style={styles.headerIconCircle}>
              <MaterialCommunityIcons
                name={ACTIVITY_ICONS[activity.type] || 'lightning-bolt'}
                size={24}
                color="#1DB954"
              />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {activity.title || activity.typeLabel}
            </Text>
            {activity.description ? (
              <Text style={[styles.description, { color: theme.textMuted }]}>{activity.description}</Text>
            ) : null}
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {new Date(activity.startTime).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </Text>
          </GlassCard>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatBox icon="map-marker-distance" label="DISTANCE" value={distKm} unit="km" theme={theme} color="#1DB954" />
            <StatBox icon="timer-outline" label="DURATION" value={formatDuration(activity.durationSeconds)} unit="" theme={theme} color="#87CEFA" />
            <StatBox icon="speedometer" label="AVG SPEED" value={avgSpeedKmh} unit="km/h" theme={theme} color="#FF9500" />
            <StatBox icon="clock-fast" label="PACE" value={formatPace(activity.distanceMeters, activity.durationSeconds)} unit="" theme={theme} color="#AF52DE" />
            <StatBox icon="fire" label="CALORIES" value={Math.round(activity.caloriesBurned).toString()} unit="kcal" theme={theme} color="#FF3B30" />
            <StatBox icon="shoe-print" label="STEPS" value={activity.steps.toString()} unit="" theme={theme} color="#FFD700" />
          </View>

          {/* Heart Rate */}
          {activity.avgHeartRate > 0 && (
            <View style={[styles.hrCard, { backgroundColor: theme.card, borderColor: theme.outline + '66' }]}>
              <MaterialCommunityIcons name="heart-pulse" size={14} color="#FF3B30" />
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>  HEART RATE</Text>
              <View style={styles.hrRow}>
                <View style={styles.hrStat}>
                  <Text style={[styles.hrValue, { color: theme.textPrimary }]}>{Math.round(activity.avgHeartRate)}</Text>
                  <Text style={[styles.hrLabel, { color: theme.textMuted }]}>AVG BPM</Text>
                </View>
                <View style={[styles.hrDivider, { backgroundColor: theme.divider }]} />
                <View style={styles.hrStat}>
                  <Text style={[styles.hrValue, { color: '#FF3B30' }]}>{activity.maxHeartRate}</Text>
                  <Text style={[styles.hrLabel, { color: theme.textMuted }]}>MAX BPM</Text>
                </View>
              </View>
            </View>
          )}

          {/* Gym Exercises */}
          {activity.gymExercises && activity.gymExercises.length > 0 && (
            <View style={[styles.gymCard, { backgroundColor: theme.card, borderColor: theme.outline + '66' }]}>
              <View style={styles.gymHeader}>
                <MaterialCommunityIcons name="dumbbell" size={14} color="#1DB954" />
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>  EXERCISES</Text>
              </View>
              {activity.gymExercises.map((ex, i) => (
                <View key={i} style={[styles.exerciseRow, { borderColor: theme.divider }]}>
                  <Text style={[styles.exerciseName, { color: theme.textPrimary }]}>{ex.name}</Text>
                  <Text style={styles.exerciseDetail}>
                    {ex.sets} × {ex.reps}{ex.weight > 0 ? ` · ${ex.weight} KG` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Share Card Preview */}
          <TouchableOpacity onPress={() => setShowShareCard(true)} activeOpacity={0.8}>
            <GlassCard style={styles.sharePreview}>
              <View style={styles.sharePreviewInner}>
                <View style={styles.sharePreviewLeft}>
                  <MaterialCommunityIcons name={ACTIVITY_ICONS[activity.type] || 'lightning-bolt'} size={18} color="#FC4C02" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.sharePreviewTitle, { color: theme.textPrimary }]}>Share Card</Text>
                    <Text style={[styles.sharePreviewSub, { color: theme.textMuted }]}>Tap to edit & save</Text>
                  </View>
                </View>
                <Ionicons name="create-outline" size={18} color={theme.textMuted} />
              </View>
            </GlassCard>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Share Card Modal */}
      <ShareCardModal
        visible={showShareCard}
        onClose={() => setShowShareCard(false)}
        activity={activity}
      />
    </View>
  );
}

function StatBox({ icon, label, value, unit, theme, color }) {
  return (
    <GlassCard style={styles.statBox}>
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>{value}</Text>
        {unit ? <Text style={[styles.statUnit, { color: theme.textMuted }]}> {unit}</Text> : null}
      </View>
    </GlassCard>
  );
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1R = (lat1 * Math.PI) / 180;
  const lat2R = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  backBtn: {
    position: 'absolute', top: 56, left: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute', top: 56, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  mapSection: { height: 200 },
  mapFull: { flex: 1 },
  map: { flex: 1 },
  replayBtn: {
    position: 'absolute', bottom: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#30D158', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  replayBtnText: { color: '#000', fontWeight: '900', fontSize: 11, letterSpacing: 1, marginLeft: 6 },
  replayDock: {
    position: 'absolute', bottom: 20, left: 12, right: 12,
    backgroundColor: 'rgba(28,28,30,0.95)', borderRadius: 24,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  speedRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 },
  speedBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  speedBtnActive: { backgroundColor: '#30D158' },
  speedText: { color: '#888', fontSize: 12, fontWeight: '800' },
  speedTextActive: { color: '#000' },
  playbackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  playbackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  playbackBtnLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  replayHUD: {
    position: 'absolute', top: 80, left: 0, right: 0,
    alignItems: 'center', paddingHorizontal: 20,
  },
  hudBigValue: { color: '#FFF', fontSize: 72, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  hudBigLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600', marginBottom: 24 },
  hudMedValue: { color: '#FFF', fontSize: 36, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  hudMedUnit: { fontSize: 16, fontWeight: '600' },
  hudMedLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', marginBottom: 20 },
  startMarker: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#1DB954', alignItems: 'center', justifyContent: 'center',
  },
  startDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  endMarker: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
  },
  puckOuter: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2196F3', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6,
  },
  puckInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3' },
  detailContent: { padding: 16, paddingTop: 60 },
  header: {
    borderRadius: 24, padding: 20, alignItems: 'center',
    marginBottom: 16,
  },
  headerIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(29,185,84,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '900', marginTop: 10 },
  description: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  date: { fontSize: 11, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBox: { width: '48%', borderRadius: 20, padding: 14, marginBottom: 10 },
  statLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 6 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  statValue: { fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  statUnit: { fontSize: 10, fontWeight: '700' },
  hrCard: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
  sectionLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  hrRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  hrStat: { alignItems: 'center' },
  hrValue: { fontSize: 24, fontWeight: '900' },
  hrLabel: { fontSize: 10, marginTop: 4 },
  hrDivider: { width: 1, height: '80%', alignSelf: 'center' },
  gymCard: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
  gymHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exerciseRow: { paddingVertical: 12, borderBottomWidth: 0.5 },
  exerciseName: { fontSize: 14, fontWeight: '800' },
  exerciseDetail: { fontSize: 12, fontWeight: '700', color: '#1DB954', marginTop: 3 },
  sharePreview: { marginTop: 16, padding: 16 },
  sharePreviewInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sharePreviewLeft: { flexDirection: 'row', alignItems: 'center' },
  sharePreviewTitle: { fontSize: 15, fontWeight: '700' },
  sharePreviewSub: { fontSize: 12, marginTop: 1 },
});
