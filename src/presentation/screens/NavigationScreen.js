import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export function NavigationScreen({ route, navigation }) {
  const { routeCoords, routeSteps, routeDistance, routeDuration, destination, destinationName } = route.params;

  const [location, setLocation] = useState(null);
  const [snappedLocation, setSnappedLocation] = useState(routeCoords[0] || null);
  const [userHeading, setUserHeading] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(routeDistance || '');
  const [etaRemaining, setEtaRemaining] = useState(routeDuration || '');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [arrived, setArrived] = useState(false);

  const mapRef = useRef(null);
  const locationSubRef = useRef(null);
  const lastSnappedIdx = useRef(0);

  // Start watching location
  useEffect(() => {
    let sub;
    (async () => {
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3, timeInterval: 1500 },
        (loc) => {
          setLocation(loc.coords);
          setCurrentSpeed(loc.coords.speed || 0);
        }
      );
      locationSubRef.current = sub;
    })();

    return () => {
      if (locationSubRef.current) locationSubRef.current.remove();
    };
  }, []);

  // Snap to route + advance steps
  useEffect(() => {
    if (!location || routeCoords.length < 2) return;

    const searchStart = Math.max(0, lastSnappedIdx.current - 2);
    const searchEnd = Math.min(routeCoords.length, lastSnappedIdx.current + 40);
    let minDist = Infinity;
    let bestIdx = lastSnappedIdx.current;

    for (let i = searchStart; i < searchEnd; i++) {
      const d = getDistance(location.latitude, location.longitude, routeCoords[i].latitude, routeCoords[i].longitude);
      if (d < minDist) { minDist = d; bestIdx = i; }
    }

    if (minDist < 50 && bestIdx >= lastSnappedIdx.current) {
      lastSnappedIdx.current = bestIdx;
      const snapped = routeCoords[bestIdx];
      setSnappedLocation(snapped);

      // Heading toward next point
      const nextIdx = Math.min(bestIdx + 5, routeCoords.length - 1);
      const next = routeCoords[nextIdx];
      const heading = calcBearing(snapped.latitude, snapped.longitude, next.latitude, next.longitude);
      setUserHeading(heading);

      // Camera follow
      if (mapRef.current) {
        mapRef.current.animateCamera({
          center: snapped,
          pitch: 65,
          heading: heading,
          altitude: 250,
          zoom: 18.5,
        }, { duration: 1200 });
      }

      // Update remaining distance
      const remaining = calculateRemainingDistance(routeCoords, bestIdx);
      setDistanceRemaining(formatDist(remaining));
      setEtaRemaining(formatETA(remaining, currentSpeed));

      // Check arrival
      if (bestIdx >= routeCoords.length - 3) {
        setArrived(true);
      }

      // Advance step
      if (routeSteps.length > 0) {
        for (let i = currentStepIndex; i < routeSteps.length; i++) {
          const step = routeSteps[i];
          if (step.location) {
            const dist = getDistance(location.latitude, location.longitude, step.location.latitude, step.location.longitude);
            if (dist < 25) {
              setCurrentStepIndex(Math.min(i + 1, routeSteps.length - 1));
              break;
            }
          }
        }
      }
    }
  }, [location]);

  // Initial camera
  useEffect(() => {
    if (routeCoords.length >= 2 && mapRef.current) {
      const start = routeCoords[0];
      const next = routeCoords[Math.min(5, routeCoords.length - 1)];
      const heading = calcBearing(start.latitude, start.longitude, next.latitude, next.longitude);
      setTimeout(() => {
        mapRef.current?.animateCamera({
          center: start,
          pitch: 65,
          heading: heading,
          altitude: 250,
          zoom: 18.5,
        }, { duration: 1500 });
      }, 500);
    }
  }, []);

  const handleEnd = () => {
    if (locationSubRef.current) locationSubRef.current.remove();
    navigation.goBack();
  };

  const currentStep = routeSteps[currentStepIndex];
  const nextStep = routeSteps[currentStepIndex + 1];
  const stepIcon = getStepIcon(currentStep?.modifier);
  const speedKmh = Math.max(0, currentSpeed * 3.6).toFixed(0);

  // Remaining route polyline (from current position forward)
  const remainingCoords = routeCoords.slice(lastSnappedIdx.current);
  const traveledCoords = routeCoords.slice(0, lastSnappedIdx.current + 1);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        userInterfaceStyle="dark"
        mapType="standard"
        pitchEnabled
        rotateEnabled
        scrollEnabled
        zoomEnabled
        legalLabelInsets={{ bottom: -30, right: 0 }}
      >
        {/* Traveled portion — dimmed */}
        {traveledCoords.length >= 2 && (
          <Polyline coordinates={traveledCoords} strokeColor="rgba(48,209,88,0.3)" strokeWidth={6} lineCap="round" lineJoin="round" />
        )}

        {/* Remaining route */}
        {remainingCoords.length >= 2 && (
          <>
            <Polyline coordinates={remainingCoords} strokeColor="#000" strokeWidth={9} lineCap="round" lineJoin="round" />
            <Polyline coordinates={remainingCoords} strokeColor="#30D158" strokeWidth={5} lineCap="round" lineJoin="round" />
          </>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.destMarker}>
              <Ionicons name="flag" size={14} color="#FFF" />
            </View>
          </Marker>
        )}

        {/* Turn markers */}
        {routeSteps.map((step, i) => (
          i > currentStepIndex && i < routeSteps.length - 1 && step.location ? (
            <Marker key={i} coordinate={step.location} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={styles.turnMarker}>
                <Ionicons name={getStepIcon(step.modifier)} size={10} color="#FFF" />
              </View>
            </Marker>
          ) : null
        ))}

        {/* Navigation puck */}
        {snappedLocation && (
          <Marker coordinate={snappedLocation} anchor={{ x: 0.5, y: 0.5 }} flat tracksViewChanges={false} rotation={userHeading}>
            <View style={styles.navPuckOuter}>
              <View style={styles.navPuckInner}>
                <View style={styles.navArrow} />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top instruction card */}
      <View style={styles.instructionCard}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.instructionContent}>
          <View style={styles.instructionIconWrap}>
            <Ionicons name={stepIcon} size={28} color="#30D158" />
          </View>
          <View style={styles.instructionTextWrap}>
            <Text style={styles.instructionMain}>
              {arrived ? 'You have arrived!' : getStepText(currentStep)}
            </Text>
            <Text style={styles.instructionStreet} numberOfLines={1}>
              {currentStep?.name || destinationName || 'Continue'}
            </Text>
          </View>
        </View>
        {/* Next step preview */}
        {nextStep && !arrived && (
          <View style={styles.nextStepRow}>
            <Text style={styles.nextStepLabel}>THEN</Text>
            <Ionicons name={getStepIcon(nextStep.modifier)} size={14} color="#FFF8" />
            <Text style={styles.nextStepText}>{getStepText(nextStep)}</Text>
          </View>
        )}
      </View>

      {/* Bottom info panel */}
      <View style={styles.bottomPanel}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.bottomContent}>
          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{etaRemaining}</Text>
              <Text style={styles.statLabel}>ETA</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{distanceRemaining}</Text>
              <Text style={styles.statLabel}>REMAINING</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#30D158' }]}>{speedKmh}</Text>
              <Text style={styles.statLabel}>KM/H</Text>
            </View>
          </View>

          {/* End navigation button */}
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recenter button */}
      <TouchableOpacity style={styles.recenterBtn} onPress={() => {
        if (snappedLocation && mapRef.current) {
          const nextIdx = Math.min(lastSnappedIdx.current + 5, routeCoords.length - 1);
          const next = routeCoords[nextIdx];
          const heading = calcBearing(snappedLocation.latitude, snappedLocation.longitude, next.latitude, next.longitude);
          mapRef.current.animateCamera({
            center: snappedLocation,
            pitch: 65,
            heading: heading,
            altitude: 250,
            zoom: 18.5,
          }, { duration: 1000 });
        }
      }}>
        <Ionicons name="locate" size={18} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Helpers ───

function calcBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateRemainingDistance(coords, fromIdx) {
  let dist = 0;
  for (let i = fromIdx; i < coords.length - 1; i++) {
    dist += getDistance(coords[i].latitude, coords[i].longitude, coords[i + 1].latitude, coords[i + 1].longitude);
  }
  return dist;
}

function formatDist(meters) {
  if (meters >= 1000) return (meters / 1000).toFixed(1) + ' km';
  return Math.round(meters) + ' m';
}

function formatETA(meters, speed) {
  // Assume walking speed ~5 km/h if speed is 0
  const effectiveSpeed = speed > 0.5 ? speed : 1.4; // m/s
  const seconds = meters / effectiveSpeed;
  const mins = Math.round(seconds / 60);
  if (mins < 1) return '<1 min';
  if (mins >= 60) return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
  return mins + ' min';
}

function getStepIcon(modifier) {
  switch (modifier) {
    case 'left': case 'sharp left': return 'arrow-back';
    case 'slight left': return 'arrow-back-outline';
    case 'right': case 'sharp right': return 'arrow-forward';
    case 'slight right': return 'arrow-forward-outline';
    case 'uturn': return 'return-down-back';
    default: return 'arrow-up';
  }
}

function getStepText(step) {
  if (!step) return 'Continue';
  const mod = step.modifier || '';
  const type = step.instruction || '';
  if (type === 'arrive') return 'You have arrived!';
  if (type === 'depart') return 'Start walking';
  if (mod === 'sharp left') return 'Sharp left';
  if (mod === 'slight left') return 'Slight left';
  if (mod.includes('left')) return 'Turn left';
  if (mod === 'sharp right') return 'Sharp right';
  if (mod === 'slight right') return 'Slight right';
  if (mod.includes('right')) return 'Turn right';
  if (mod === 'uturn') return 'Make a U-turn';
  if (type === 'continue') return 'Continue straight';
  return 'Continue';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  // Instruction card (top)
  instructionCard: {
    position: 'absolute', top: 50, left: 12, right: 12,
    borderRadius: 20, overflow: 'hidden',
  },
  instructionContent: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  instructionIconWrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(48,209,88,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  instructionTextWrap: { flex: 1, marginLeft: 14 },
  instructionMain: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  instructionStreet: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', marginTop: 3 },
  nextStepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4,
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  nextStepLabel: { color: '#8E8E93', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  nextStepText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  // Bottom panel
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  bottomContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#8E8E93', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  endBtn: {
    backgroundColor: '#EF4444', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  endBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  // Recenter
  recenterBtn: {
    position: 'absolute', bottom: 140, right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },
  // Markers
  destMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#30D158', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFF',
  },
  turnMarker: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(48,209,88,0.8)', alignItems: 'center', justifyContent: 'center',
  },
  navPuckOuter: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#007AFF', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  navPuckInner: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center',
  },
  navArrow: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 14,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#FFF',
    marginBottom: 2,
  },
});
