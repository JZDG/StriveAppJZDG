import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { getWalkingDirections, formatRouteDistance, formatRouteDuration } from '../../data/services/directionsService';

const { width, height } = Dimensions.get('window');

const MAP_TYPES = [
  { id: 'standard-dark', label: 'Dark', icon: 'moon-outline', mapType: 'standard', uiStyle: 'dark' },
  { id: 'standard-light', label: 'Light', icon: 'sunny-outline', mapType: 'standard', uiStyle: 'light' },
  { id: 'hybrid', label: 'Hybrid', icon: 'layers-outline', mapType: 'hybrid', uiStyle: 'dark' },
  { id: 'satellite', label: 'Satellite', icon: 'earth', mapType: 'satellite', uiStyle: 'dark' },
];

export function MapScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const [location, setLocation] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [mapUiStyle, setMapUiStyle] = useState(isDarkMode ? 'dark' : 'light');
  const [selectedStyleId, setSelectedStyleId] = useState('standard-dark');
  const [showStylePicker, setShowStylePicker] = useState(false);

  // Directions
  const [destination, setDestination] = useState(null);
  const [destinationName, setDestinationName] = useState('');
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeDistance, setRouteDistance] = useState('');
  const [routeDuration, setRouteDuration] = useState('');
  const [routeSteps, setRouteSteps] = useState([]);
  const [showDirectionModal, setShowDirectionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mapRef = useRef(null);
  const locationSubRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Best });
      setLocation(loc.coords);
      // Zoom to user location immediately
      mapRef.current?.animateCamera({
        center: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
        altitude: 800,
        zoom: 16,
      }, { duration: 1000 });
      await Location.watchHeadingAsync(() => {});
    })();
    return () => { if (locationSubRef.current) locationSubRef.current.remove(); };
  }, []);

  // Long press — set destination
  const handleLongPress = async (event) => {
    const coord = event.nativeEvent.coordinate;
    setDestination(coord);
    try {
      const results = await Location.reverseGeocodeAsync(coord);
      if (results.length > 0) {
        const p = results[0];
        setDestinationName(p.name || p.street || `${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
      } else {
        setDestinationName(`${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
      }
    } catch (e) {
      setDestinationName(`${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
    }
    setShowDirectionModal(true);
  };

  // Get accurate road-snapped directions
  const getDirections = async () => {
    if (!location || !destination) return;
    setIsLoading(true);
    setShowDirectionModal(false);

    const result = await getWalkingDirections(
      location.latitude, location.longitude,
      destination.latitude, destination.longitude
    );

    setIsLoading(false);
    if (!result) return;

    setRouteCoords(result.routeCoords);
    setRouteDistance(formatRouteDistance(result.distanceMeters));
    setRouteDuration(formatRouteDuration(result.durationSeconds));
    setRouteSteps(result.steps);

    // Fit map to route
    mapRef.current?.fitToCoordinates(result.routeCoords, {
      edgePadding: { top: 140, right: 60, bottom: 200, left: 60 },
      animated: true,
    });
  };

  // Start in-app navigation — opens dedicated NavigationScreen
  const startNavigation = () => {
    navigation.navigate('Navigation', {
      routeCoords,
      routeSteps,
      routeDistance,
      routeDuration,
      destination,
      destinationName,
    });
    // Clear local state after navigating
    setTimeout(() => clearDirections(), 500);
  };

  // Clear everything
  const clearDirections = () => {
    setDestination(null);
    setRouteCoords([]);
    setRouteDistance('');
    setRouteDuration('');
    setRouteSteps([]);
    setDestinationName('');
  };

  const recenter = async () => {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Best });
    setLocation(loc.coords);
    mapRef.current?.animateCamera({
      center: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
      pitch: 45, altitude: 800, zoom: 16,
    }, { duration: 1000 });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        userLocationAnnotationTitle=""
        userInterfaceStyle={mapUiStyle}
        mapType={mapType}
        showsPointsOfInterest
        showsBuildings
        pitchEnabled
        rotateEnabled
        followsUserLocation={!destination}
        userLocationFollowsHeading={!destination}
        legalLabelInsets={{ bottom: -30, right: 0 }}
        onLongPress={handleLongPress}
        initialRegion={{
          latitude: location?.latitude || 14.5995,
          longitude: location?.longitude || 120.9842,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        {/* Route polyline — accurate road-snapped */}
        {routeCoords.length >= 2 && (
          <>
            <Polyline coordinates={routeCoords} strokeColor="#000" strokeWidth={8} lineCap="round" lineJoin="round" />
            <Polyline coordinates={routeCoords} strokeColor="#1DB954" strokeWidth={5} lineCap="round" lineJoin="round" />
          </>
        )}

        {/* Start marker */}
        {routeCoords.length >= 2 && (
          <Marker coordinate={routeCoords[0]} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.startMarker}>
              <View style={styles.startMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.destMarker}>
              <Ionicons name="flag" size={14} color="#FFF" />
            </View>
          </Marker>
        )}

      </MapView>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#FFF" />
        <Text style={styles.searchText}>Hold map to set destination</Text>
      </View>

      {/* Direction info banner (when route shown) */}
      {routeDistance !== '' && (
        <View style={styles.directionBanner}>
          <Ionicons name="walk" size={16} color="#1DB954" />
          <Text style={styles.dirDuration}>{routeDuration}</Text>
          <View style={styles.dirDivider} />
          <Text style={styles.dirDistance}>{routeDistance}</Text>
          <TouchableOpacity onPress={clearDirections} style={{ marginLeft: 10 }}>
            <Ionicons name="close" size={16} color="#FFF8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.surface }]} onPress={() => setShowStylePicker(true)}>
          <Ionicons name="layers" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.surface }]} onPress={recenter}>
          <Ionicons name="locate" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        {routeCoords.length > 0 && (
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#1DB954' }]} onPress={startNavigation}>
            <Ionicons name="navigate" size={18} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>Finding route...</Text>
          </View>
        </View>
      )}

      {/* Destination Modal */}
      <Modal visible={showDirectionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.dirModal, { backgroundColor: theme.modal }]}>
            <View style={styles.modalHandle} />
            <View style={styles.dirModalHeader}>
              <View style={styles.dirIconCircle}>
                <Ionicons name="location" size={20} color="#1DB954" />
              </View>
              <View style={styles.dirModalInfo}>
                <Text style={[styles.dirModalLabel, { color: theme.textMuted }]}>DESTINATION</Text>
                <Text style={[styles.dirModalName, { color: theme.textPrimary }]} numberOfLines={2}>{destinationName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.getDirectionsBtn} onPress={getDirections}>
              <Ionicons name="walk" size={18} color="#000" />
              <Text style={styles.getDirectionsText}>GET DIRECTIONS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.outline }]} onPress={() => { setShowDirectionModal(false); setDestination(null); }}>
              <Text style={[styles.cancelText, { color: theme.textMuted }]}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Style Picker */}
      <Modal visible={showStylePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.styleModal, { backgroundColor: theme.modal }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.styleTitle, { color: theme.textMuted }]}>MAP STYLES</Text>
            {MAP_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.styleOption, { backgroundColor: selectedStyleId === type.id ? 'rgba(29,185,84,0.12)' : theme.inputFill, borderColor: selectedStyleId === type.id ? '#30D158' : theme.outline + '66' }]}
                onPress={() => { setMapType(type.mapType); setMapUiStyle(type.uiStyle); setSelectedStyleId(type.id); setShowStylePicker(false); }}
              >
                <Ionicons name={type.icon} size={20} color={selectedStyleId === type.id ? '#30D158' : theme.textMuted} />
                <Text style={[styles.styleLabel, { color: selectedStyleId === type.id ? '#30D158' : theme.textPrimary }]}>{type.label}</Text>
                {selectedStyleId === type.id && <Ionicons name="checkmark-circle" size={18} color="#30D158" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.outline }]} onPress={() => setShowStylePicker(false)}>
              <Text style={[styles.cancelText, { color: theme.textMuted }]}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height, position: 'absolute', top: 0, left: 0 },
  searchBar: {
    position: 'absolute', top: 60, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  searchText: { flex: 1, color: '#FFF', fontSize: 13, marginLeft: 10 },
  // Direction banner
  directionBanner: {
    position: 'absolute', top: 110, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#000', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  dirDuration: { color: '#FFF', fontWeight: '900', fontSize: 13, marginLeft: 8 },
  dirDivider: { width: 1, height: 14, backgroundColor: '#FFF4', marginHorizontal: 10 },
  dirDistance: { color: '#FFFFFFB0', fontWeight: '700', fontSize: 12 },
  controls: { position: 'absolute', top: 120, right: 20 },
  controlBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
    elevation: 4, marginBottom: 10,
  },
  destMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1DB954', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFF',
  },
  startMarker: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2196F3', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 6,
  },
  startMarkerInner: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#2196F3',
  },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  loadingBox: { backgroundColor: '#1C1C1E', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14 },
  loadingText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  dirModal: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  dirModalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dirIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(29,185,84,0.12)', alignItems: 'center', justifyContent: 'center' },
  dirModalInfo: { marginLeft: 12, flex: 1 },
  dirModalLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  dirModalName: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  getDirectionsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1DB954', borderRadius: 16, paddingVertical: 16, gap: 8, marginBottom: 10,
  },
  getDirectionsText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  cancelBtn: { borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1 },
  cancelText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  styleModal: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  styleTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 16 },
  styleOption: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  styleLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
});
