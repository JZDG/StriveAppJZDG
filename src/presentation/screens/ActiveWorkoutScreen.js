import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Dimensions } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Video, ResizeMode } from 'expo-av';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useTheme } from '../../core/theme/ThemeContext';
import { useWorkout } from '../../domain/providers/WorkoutContext';
import { formatDuration, formatPace } from '../../core/utils/distanceCalculator';
import { AppConstants } from '../../core/constants/appConstants';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const { width } = Dimensions.get('window');
const { WORKOUT_STATES } = AppConstants;

export function ActiveWorkoutScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const workout = useWorkout();
  const mapRef = useRef(null);
  const [showMap, setShowMap] = useState(false);
  const [mapType, setMapType] = useState('standard');

  // Tab bar hidden by native stack (full screen covers it)
  useEffect(() => {
    activateKeepAwakeAsync();
    let headingSub;
    (async () => { headingSub = await Location.watchHeadingAsync(() => {}); })();
    return () => { deactivateKeepAwake(); if (headingSub) headingSub.remove(); };
  }, []);

  const handleStop = () => {
    Alert.alert('Finish Workout?', 'End this session and save?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { workout.stopAndDiscardWorkout(); navigation.goBack(); }},
      { text: 'Save', onPress: async () => { await workout.stopAndSaveWorkout(); navigation.goBack(); }},
    ]);
  };

  const isPaused = workout.workoutState === WORKOUT_STATES.PAUSED;
  const distKm = (workout.totalDistanceMeters / 1000).toFixed(2);
  const speedKmh = (workout.currentSpeed * 3.6).toFixed(1);
  const calories = Math.round(workout.realTimeCalories || (workout.totalDistanceMeters / 1000) * 70);

  // Polyline
  const polylineCoords = React.useMemo(() => {
    const coords = workout.routePoints.map((p) => ({ latitude: p[0], longitude: p[1] }));
    if (workout.currentLocation) coords.push({ latitude: workout.currentLocation.latitude, longitude: workout.currentLocation.longitude });
    return coords;
  }, [workout.routePoints, workout.currentLocation]);

  // Activity ring progress (calories / 300 goal)
  const ringProgress = Math.min(calories / 300, 1);

  const activityVideos = {
    run: require('../../../assets/running.mp4'),
    walk: require('../../../assets/walking.mp4'),
    cycle: require('../../../assets/bike.mp4'),
  };
  const activityIcons = { run: 'run-fast', walk: 'walk', cycle: 'bike', gym: 'dumbbell' };

  // ─── FULL MAP VIEW ───
  if (showMap) {
    return (
      <View style={styles.fullMap}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_DEFAULT}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          userLocationAnnotationTitle=""
          showsPointsOfInterest={false}
          userInterfaceStyle={isDarkMode ? 'dark' : 'light'}
          mapType={mapType}
          followsUserLocation
          userLocationFollowsHeading
          legalLabelInsets={{ bottom: -30, right: 0 }}
          camera={{
            center: { latitude: workout.currentLocation?.latitude || 14.5995, longitude: workout.currentLocation?.longitude || 120.9842 },
            pitch: 55, altitude: 500, zoom: 17,
          }}
        >
          {polylineCoords.length >= 2 && (
            <>
              <Polyline coordinates={polylineCoords} strokeColor="rgba(0,0,0,0.7)" strokeWidth={12} lineCap="round" lineJoin="round" />
              <Polyline coordinates={polylineCoords} strokeColor="#30D158" strokeWidth={7} lineCap="round" lineJoin="round" />
            </>
          )}
          {polylineCoords.length > 0 && (
            <Marker coordinate={polylineCoords[0]} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={styles.startMarker}><View style={styles.startDot} /></View>
            </Marker>
          )}
        </MapView>
        <TouchableOpacity style={styles.mapCloseBtn} onPress={() => setShowMap(false)}>
          <Ionicons name="chevron-down" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapLayerBtn} onPress={() => setMapType(mapType === 'standard' ? 'hybrid' : 'standard')}>
          <Ionicons name="layers" size={18} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.myLocationBtn} onPress={() => {
          if (workout.currentLocation && mapRef.current) {
            mapRef.current.animateCamera({ center: { latitude: workout.currentLocation.latitude, longitude: workout.currentLocation.longitude }, altitude: 400, zoom: 17 }, { duration: 800 });
          }
        }}>
          <Ionicons name="locate" size={18} color="#FFF" />
        </TouchableOpacity>

        {/* Stats HUD — 2 column grid overlay on top (like replay screen) */}
        <View style={styles.mapHUD}>
          <View style={styles.hudRow}>
            <View style={styles.hudItem}>
              <Text style={styles.hudBigValue}>{(workout.totalDistanceMeters / 1000).toFixed(1)}</Text>
              <Text style={styles.hudLabel}>KM</Text>
            </View>
            <View style={styles.hudItem}>
              <Text style={styles.hudBigValue}>{(workout.currentSpeed * 3.6).toFixed(0)}</Text>
              <Text style={styles.hudLabel}>KM/H</Text>
            </View>
          </View>
          <View style={styles.hudRow}>
            <View style={styles.hudItem}>
              <Text style={styles.hudBigValue}>{calories}</Text>
              <Text style={styles.hudLabel}>ACTIVE KCAL</Text>
            </View>
            <View style={styles.hudItem}>
              <Text style={styles.hudBigValue}>{workout.steps}</Text>
              <Text style={styles.hudLabel}>STEPS</Text>
            </View>
          </View>
        </View>

        {/* Bottom Dock — floating over map */}
        <View style={styles.mapBottomDock}>
          <View style={styles.dockTop}>
            <View style={styles.dockIconCircle}>
              {activityVideos[workout.activityType] ? (
                <Video
                  source={activityVideos[workout.activityType]}
                  style={styles.dockVideo}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted
                  useNativeControls={false}
                  pointerEvents="none"
                />
              ) : (
                <MaterialCommunityIcons name={activityIcons[workout.activityType] || 'run-fast'} size={20} color="#30D158" />
              )}
            </View>
            <Text style={styles.dockTimer}>{formatDuration(workout.elapsedSeconds)}</Text>
            <MiniRing progress={ringProgress} size={32} />
          </View>
          <View style={styles.dockControls}>
            <TouchableOpacity style={styles.dockBtn} onPress={handleStop}>
              <Ionicons name="stop-circle" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.dockBtnLarge} onPress={isPaused ? workout.resumeWorkout : workout.pauseWorkout}>
              <Ionicons name={isPaused ? 'play' : 'pause'} size={32} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.dockBtn}>
              <Ionicons name="heart-dislike-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── STATS VIEW (Apple Fitness style) ───
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.statsArea}>
        {/* Big stats — Apple Fitness style */}
        <View style={styles.statsCenter}>
          <Text style={styles.bigNum}>{(workout.totalDistanceMeters / 1000).toFixed(1)}<Text style={styles.bigUnit}>KM</Text></Text>
          
          <Text style={styles.bigNum}>{(workout.currentSpeed * 3.6).toFixed(1)}<Text style={styles.bigUnit}>KM/H  </Text><Text style={styles.inlineLabel}>CURRENT PACE</Text></Text>

          <View style={styles.statRow}>
            <View>
              <Text style={styles.medNum}>{calories}</Text>
              <Text style={styles.statLabel}>ACTIVE KCAL</Text>
            </View>
            <View>
              <Text style={styles.medNum}>{calories}</Text>
              <Text style={styles.statLabel}>TOTAL KCAL</Text>
            </View>
          </View>
        </View>

        {/* Mini map — moved here, outside statsCenter */}
        <View style={styles.miniMapWrap}>
          <MapView
            style={styles.miniMap}
            provider={PROVIDER_DEFAULT}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            userInterfaceStyle={isDarkMode ? 'dark' : 'light'}
            mapType={mapType}
            followsUserLocation
            userLocationFollowsHeading
            legalLabelInsets={{ bottom: -30, right: 0 }}
            camera={{
              center: { latitude: workout.currentLocation?.latitude || 14.5995, longitude: workout.currentLocation?.longitude || 120.9842 },
              pitch: 50, altitude: 600, zoom: 16,
            }}
          >
            {polylineCoords.length >= 2 && (
              <Polyline coordinates={polylineCoords} strokeColor="#30D158" strokeWidth={4} lineCap="round" lineJoin="round" />
            )}
          </MapView>
          <TouchableOpacity style={styles.expandBtn} onPress={() => setShowMap(true)}>
            <Ionicons name="expand" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom Dock */}
      <View style={styles.bottomDock}>
        {/* Top row: icon + timer + ring */}
        <View style={styles.dockTop}>
          <View style={styles.dockIconCircle}>
            {activityVideos[workout.activityType] ? (
              <Video
                source={activityVideos[workout.activityType]}
                style={styles.dockVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
                useNativeControls={false}
                pointerEvents="none"
              />
            ) : (
              <MaterialCommunityIcons name={activityIcons[workout.activityType] || 'run-fast'} size={20} color="#30D158" />
            )}
          </View>
          <Text style={styles.dockTimer}>{formatDuration(workout.elapsedSeconds)}</Text>
          <MiniRing progress={ringProgress} size={32} />
        </View>

        {/* Bottom row: controls */}
        <View style={styles.dockControls}>
          <TouchableOpacity style={styles.dockBtn} onPress={handleStop}>
            <Ionicons name="stop-circle" size={22} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dockBtnLarge} onPress={isPaused ? workout.resumeWorkout : workout.pauseWorkout}>
            <Ionicons name={isPaused ? 'play' : 'pause'} size={32} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dockBtn}>
            <Ionicons name="heart-dislike-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function MiniRing({ progress, size }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <SvgCircle cx={size/2} cy={size/2} r={r} stroke="#0A3A1A" strokeWidth={sw} fill="none" />
      <SvgCircle cx={size/2} cy={size/2} r={r} stroke="#30D158" strokeWidth={sw} fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
        rotation="-90" origin={`${size/2}, ${size/2}`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fullMap: { flex: 1 },
  statsArea: { flex: 1, paddingHorizontal: 24 },
  statsCenter: { justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  bigNum: { color: '#FFF', fontSize: 60, fontWeight: '700', marginBottom: 30, textAlign: 'center' },
  bigUnit: { fontSize: 22, fontWeight: '600' },
  inlineLabel: { fontSize: 14, fontWeight: '700', color: '#8E8E93' },
  statRow: { flexDirection: 'row', gap: 50, marginTop: 20, justifyContent: 'center' },
  medNum: { color: '#FFF', fontSize: 42, fontWeight: '700', textAlign: 'center' },
  statLabel: { color: '#8E8E93', fontSize: 12, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  // Mini map
  miniMapWrap: { height: 220, borderRadius: 16, overflow: 'hidden', marginHorizontal: 12, marginTop: 12, marginBottom: 8, position: 'relative' },
  miniMap: { flex: 1 },
  expandBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  // Bottom dock
  bottomDock: {
    backgroundColor: '#1C1C1E', borderRadius: 24, marginHorizontal: 10, marginBottom: 16, paddingHorizontal: 20, paddingVertical: 14,
  },
  mapBottomDock: {
    position: 'absolute', bottom: 20, left: 10, right: 10,
    backgroundColor: 'rgba(28,28,30,0.92)', borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  dockTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#3A3A3C' },
  dockIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A2E1A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dockVideo: { width: 40, height: 40 },
  dockTimer: { color: '#FFD60A', fontSize: 28, fontWeight: '500', fontVariant: ['tabular-nums'] },
  dockControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dockBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3A3A3C', alignItems: 'center', justifyContent: 'center' },
  dockBtnLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#3A3A3C', alignItems: 'center', justifyContent: 'center' },
  // Map controls
  mapCloseBtn: { position: 'absolute', top: 56, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  mapLayerBtn: { position: 'absolute', top: 56, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  myLocationBtn: { position: 'absolute', top: 100, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  // Map HUD (2-column grid overlay)
  mapHUD: {
    position: 'absolute', top: 70, left: 16, right: 16,
    gap: 12,
  },
  hudRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
  },
  hudItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  hudBigValue: { color: '#FFF', fontSize: 36, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  hudLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  startMarker: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#30D158', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  startDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF' },
});
