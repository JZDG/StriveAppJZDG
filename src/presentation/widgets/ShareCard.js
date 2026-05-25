import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, TextInput, Alert, Image, PanResponder } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Polyline as SvgPolyline, Circle } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDuration, formatPace } from '../../core/utils/distanceCalculator';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW * 0.78;
const CARD_H = CARD_W * 1.6;

const BG_COLORS = ['#1C1C1E', '#000000', '#0D1B2A', '#1A0A00', '#0A1A0A'];
const ROUTE_COLORS = ['#FC4C02', '#30D158', '#0A84FF', '#FFFFFF', '#FFD60A', '#FF375F', '#BF5AF2'];

export function ShareCardModal({ visible, onClose, activity }) {
  const [bgColor, setBgColor] = useState('#1C1C1E');
  const [bgImage, setBgImage] = useState(null);
  const [bgBlur, setBgBlur] = useState(0);
  const [routeColor, setRouteColor] = useState('#FC4C02');
  const [watermark, setWatermark] = useState('STRIVE');
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null); // null | 'stats' | 'route' | 'bg'
  const [statsScale, setStatsScale] = useState(1.0);
  const [routeScale, setRouteScale] = useState(1.0);
  const [statsPos, setStatsPos] = useState({ x: 0, y: 0 });
  const [routePos, setRoutePos] = useState({ x: 0, y: 0 });
  const statsPosRef = useRef({ x: 0, y: 0 });
  const routePosRef = useRef({ x: 0, y: 0 });

  // Keep refs in sync
  statsPosRef.current = statsPos;
  routePosRef.current = routePos;

  const cardRef = useRef();

  // Clamp position within card bounds
  const clampPos = (x, y) => {
    const maxX = CARD_W * 0.4;
    const maxY = CARD_H * 0.4;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  // Draggable stats
  const statsStartPos = useRef({ x: 0, y: 0 });
  const statsPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
    onPanResponderGrant: () => {
      statsStartPos.current = statsPosRef.current;
    },
    onPanResponderMove: (_, g) => {
      const newPos = clampPos(statsStartPos.current.x + g.dx, statsStartPos.current.y + g.dy);
      setStatsPos(newPos);
    },
    onPanResponderEnd: (_, g) => {
      if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
        setSelectedElement(prev => prev === 'stats' ? null : 'stats');
      }
    },
  })).current;

  // Draggable route
  const routeStartPos = useRef({ x: 0, y: 0 });
  const routePan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
    onPanResponderGrant: () => {
      routeStartPos.current = routePosRef.current;
    },
    onPanResponderMove: (_, g) => {
      const newPos = clampPos(routeStartPos.current.x + g.dx, routeStartPos.current.y + g.dy);
      setRoutePos(newPos);
    },
    onPanResponderEnd: (_, g) => {
      if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
        setSelectedElement(prev => prev === 'route' ? null : 'route');
      }
    },
  })).current;

  if (!activity) return null;

  const isGym = activity.type === 'gym';
  const distKm = (activity.distanceMeters / 1000).toFixed(2);
  const pace = formatPace(activity.distanceMeters, activity.durationSeconds);
  const duration = formatDuration(activity.durationSeconds);
  const hasRoute = !isGym && activity.routePoints && activity.routePoints.length > 1;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setBgImage(result.assets[0].uri);
  };

  const saveCard = async () => {
    try {
      setIsSaving(true);
      setEditMode(false); // Hide edit handles
      await new Promise(r => setTimeout(r, 100)); // Wait for re-render

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed'); setIsSaving(false); setEditMode(true); return; }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('StriveApp', asset, false);
      Alert.alert('Saved!', 'Share card saved to gallery');
    } catch (e) {
      try {
        const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } catch (_) { Alert.alert('Error', 'Could not save'); }
    } finally { setIsSaving(false); setEditMode(true); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.screen}>
        {/* Header — Preview mode */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { onClose(); setShowEditor(false); }}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>SHARE CARD</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditor(true)}>
              <Ionicons name="create-outline" size={14} color="#FFF" />
              <Text style={styles.editBtnText}>EDIT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveCard} disabled={isSaving}>
              <Ionicons name="download-outline" size={14} color="#000" />
              <Text style={styles.saveBtnText}>{isSaving ? '...' : 'SAVE'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Preview (centered, clean, no edit borders) */}
        <View style={styles.previewCenter}>
          <View ref={cardRef} collapsable={false} style={[styles.card, { backgroundColor: bgColor }]}>
            {bgImage && <Image source={{ uri: bgImage }} style={styles.bgImg} resizeMode="cover" blurRadius={bgBlur} />}
            {bgImage && <View style={styles.bgOverlay} />}
            <View style={[styles.badge, { borderColor: routeColor + '80', backgroundColor: routeColor + '20' }]}>
              <Text style={[styles.badgeText, { color: routeColor }]}>{activity.type.toUpperCase()}</Text>
            </View>
            <View style={[styles.statsBlock, { transform: [{ translateX: statsPos.x }, { translateY: statsPos.y }, { scale: statsScale }] }]}>
              {isGym ? (
                <><CardStat label="Time" value={duration} /><CardStat label="Calories" value={`${Math.round(activity.caloriesBurned)} kcal`} /><CardStat label="Exercises" value={`${activity.gymExercises?.length || 0}`} /></>
              ) : (
                <><CardStat label="Distance" value={`${distKm} km`} /><CardStat label="Pace" value={pace} /><CardStat label="Time" value={duration} /></>
              )}
            </View>
            {hasRoute && (
              <View style={[styles.routeBlock, { transform: [{ translateX: routePos.x }, { translateY: routePos.y }, { scale: routeScale }] }]}>
                <RouteSvg routePoints={activity.routePoints} color={routeColor} />
              </View>
            )}
            {watermark ? <Text style={styles.watermark}>{watermark}</Text> : null}
          </View>
        </View>
      </View>

      {/* ─── FULL SCREEN EDITOR (nested modal) ─── */}
      <Modal visible={showEditor} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.screen}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setShowEditor(false); setSelectedElement(null); }}><Ionicons name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>
            <Text style={styles.headerTitle}>EDIT CARD</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => { setShowEditor(false); setSelectedElement(null); }}>
              <Ionicons name="checkmark" size={14} color="#000" />
              <Text style={styles.doneBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>

          {/* Card — no scroll, fixed */}
          <View style={styles.editorCardArea}>
            <View style={[styles.card, { backgroundColor: bgColor }]}>
              {bgImage && <Image source={{ uri: bgImage }} style={styles.bgImg} resizeMode="cover" blurRadius={bgBlur} />}
              {bgImage && <View style={styles.bgOverlay} />}
              <View style={[styles.badge, { borderColor: routeColor + '80', backgroundColor: routeColor + '20' }]}>
                <Text style={[styles.badgeText, { color: routeColor }]}>{activity.type.toUpperCase()}</Text>
              </View>

              {/* Stats — tap to select, drag to move */}
              <View {...statsPan.panHandlers} style={[styles.statsBlock, { transform: [{ translateX: statsPos.x }, { translateY: statsPos.y }, { scale: statsScale }] }, selectedElement === 'stats' && styles.editBorder]}>
                {isGym ? (
                  <><CardStat label="Time" value={duration} /><CardStat label="Calories" value={`${Math.round(activity.caloriesBurned)} kcal`} /><CardStat label="Exercises" value={`${activity.gymExercises?.length || 0}`} /></>
                ) : (
                  <><CardStat label="Distance" value={`${distKm} km`} /><CardStat label="Pace" value={pace} /><CardStat label="Time" value={duration} /></>
                )}
              </View>

              {/* Route — tap to select, drag to move */}
              {hasRoute && (
                <View {...routePan.panHandlers} style={[styles.routeBlock, { transform: [{ translateX: routePos.x }, { translateY: routePos.y }, { scale: routeScale }] }, selectedElement === 'route' && styles.editBorder]}>
                  <RouteSvg routePoints={activity.routePoints} color={routeColor} />
                </View>
              )}

              {watermark ? <Text style={styles.watermark}>{watermark}</Text> : null}
            </View>
          </View>

          {/* Bottom toolbar — contextual */}
          <View style={styles.editorToolbar}>
            {selectedElement === null && (
              <View style={styles.toolbarHint}>
                <Text style={styles.toolbarHintText}>Tap an element to edit</Text>
              </View>
            )}

            {selectedElement === 'stats' && (
              <SizeControl label="STATS" value={statsScale} onChange={setStatsScale} onReset={() => setStatsScale(1)} />
            )}

            {selectedElement === 'route' && (
              <View>
                <SizeControl label="ROUTE" value={routeScale} onChange={setRouteScale} onReset={() => setRouteScale(1)} />
                <View style={[styles.colorRow, { marginTop: 10 }]}>
                  {ROUTE_COLORS.map((c) => (
                    <TouchableOpacity key={c} style={[styles.colorDotSm, { backgroundColor: c, borderColor: routeColor === c ? '#FFF' : '#FFF2' }]} onPress={() => setRouteColor(c)} />
                  ))}
                </View>
              </View>
            )}

            {/* Always-visible bottom row: BG + Watermark + Blur */}
            <View style={styles.toolbarBottom}>
              <View style={[styles.colorRow, { marginTop: 8 }]}>
                {BG_COLORS.map((c) => (
                  <TouchableOpacity key={c} style={[styles.colorDotSm, { backgroundColor: c, borderColor: bgColor === c && !bgImage ? '#FFF' : '#FFF2' }]} onPress={() => { setBgColor(c); setBgImage(null); }} />
                ))}
                <TouchableOpacity style={[styles.colorDotSm, { backgroundColor: '#FFF1', borderColor: bgImage ? '#FFF' : '#FFF2' }]} onPress={pickImage}>
                  <Ionicons name="image-outline" size={12} color="#FFF8" />
                </TouchableOpacity>
              </View>
              {bgImage && (
                <View style={styles.blurSlider}>
                  <Ionicons name="water-outline" size={14} color="#FFF6" />
                  <TouchableOpacity onPress={() => setBgBlur(Math.max(0, bgBlur - 2))} style={styles.blurBtn}><Ionicons name="remove" size={14} color="#FFF" /></TouchableOpacity>
                  <View style={styles.blurBarOuter}>
                    <View style={[styles.blurBarInner, { width: `${(bgBlur / 20) * 100}%` }]} />
                  </View>
                  <TouchableOpacity onPress={() => setBgBlur(Math.min(20, bgBlur + 2))} style={styles.blurBtn}><Ionicons name="add" size={14} color="#FFF" /></TouchableOpacity>
                  <Text style={styles.blurValue}>{bgBlur === 0 ? 'OFF' : bgBlur}</Text>
                </View>
              )}
              <TextInput style={styles.tagInputSm} value={watermark} onChangeText={(t) => setWatermark(t.toUpperCase())} placeholder="TAG" placeholderTextColor="#FFF3" maxLength={20} autoCapitalize="characters" />
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function CardStat({ label, value }) {
  return (
    <View style={styles.cardStat}>
      <Text style={styles.cardStatValue}>{value}</Text>
      <Text style={styles.cardStatLabel}>{label}</Text>
    </View>
  );
}

function SizeControl({ label, value, onChange, onReset }) {
  return (
    <View style={styles.sizeSection}>
      <Text style={styles.sizeLabel}>{label}</Text>
      <View style={styles.sizeRow}>
        <TouchableOpacity style={styles.sizeBtn} onPress={() => onChange(Math.max(0.4, value - 0.1))}><Ionicons name="remove" size={16} color="#FFF" /></TouchableOpacity>
        <Text style={styles.sizeValue}>{Math.round(value * 100)}%</Text>
        <TouchableOpacity style={styles.sizeBtn} onPress={() => onChange(Math.min(2.5, value + 0.1))}><Ionicons name="add" size={16} color="#FFF" /></TouchableOpacity>
        <TouchableOpacity style={styles.sizeBtn} onPress={onReset}><Ionicons name="refresh" size={14} color="#FFF8" /></TouchableOpacity>
      </View>
    </View>
  );
}

function RouteSvg({ routePoints, color }) {
  const w = CARD_W - 40;
  const h = CARD_H * 0.35;
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of routePoints) { if (p[0] < minLat) minLat = p[0]; if (p[0] > maxLat) maxLat = p[0]; if (p[1] < minLng) minLng = p[1]; if (p[1] > maxLng) maxLng = p[1]; }
  const latR = maxLat - minLat || 0.001;
  const lngR = maxLng - minLng || 0.001;
  const pad = 12;
  const sampled = routePoints.length > 100 ? routePoints.filter((_, i) => i % Math.ceil(routePoints.length / 100) === 0) : routePoints;
  const pointsStr = sampled.map((p) => `${pad + ((p[1] - minLng) / lngR) * (w - pad * 2)},${pad + ((maxLat - p[0]) / latR) * (h - pad * 2)}`).join(' ');
  const s = sampled[0], e = sampled[sampled.length - 1];
  const sx = pad + ((s[1] - minLng) / lngR) * (w - pad * 2), sy = pad + ((maxLat - s[0]) / latR) * (h - pad * 2);
  const ex = pad + ((e[1] - minLng) / lngR) * (w - pad * 2), ey = pad + ((maxLat - e[0]) / latR) * (h - pad * 2);

  return (
    <Svg width={w} height={h}>
      <SvgPolyline points={pointsStr} fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <SvgPolyline points={pointsStr} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={sx} cy={sy} r="4" fill={color} />
      <Circle cx={ex} cy={ey} r="4" fill="#FFF" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D0D0D', paddingTop: 54 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  headerTitle: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#30D158', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, gap: 5 },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, gap: 5, borderWidth: 1, borderColor: '#FFF2' },
  editBtnText: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  doneBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A84FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, gap: 5 },
  doneBtnText: { color: '#000', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  scroll: { paddingHorizontal: 20 },
  previewCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardWrapper: { alignItems: 'center', marginVertical: 14 },
  card: { width: CARD_W, height: CARD_H, borderRadius: 20, padding: 18, overflow: 'hidden' },
  bgImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  statsBlock: { marginTop: 12 },
  cardStat: { marginBottom: 5 },
  cardStatValue: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  cardStatLabel: { color: '#FFF6', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 1 },
  routeBlock: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  editBorder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderStyle: 'dashed', borderRadius: 8, padding: 4 },
  watermark: { color: '#FFF3', fontSize: 9, fontWeight: '900', letterSpacing: 2, position: 'absolute', bottom: 14, left: 18 },
  // Controls
  sizeSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  sizeLabel: { color: '#FFF5', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sizeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF1', borderWidth: 1, borderColor: '#FFF2', alignItems: 'center', justifyContent: 'center' },
  sizeValue: { color: '#FFF', fontWeight: '900', fontSize: 13, width: 44, textAlign: 'center' },
  hint: { color: '#FFF3', fontSize: 10, marginTop: 4 },
  sectionLabel: { color: '#FFF5', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 20, marginBottom: 10 },
  tagInput: { backgroundColor: '#FFF1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  colorRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  dotImg: { width: 32, height: 32, borderRadius: 16 },
  blurRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  blurTrack: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  blurBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF1', alignItems: 'center', justifyContent: 'center' },
  blurValue: { color: '#FFF6', fontSize: 12, fontWeight: '900', width: 30, textAlign: 'center' },
  bgToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#FFF08', borderRadius: 12, borderWidth: 1, borderColor: '#FFF1' },
  bgToggleText: { flex: 1, color: '#FFF8', fontSize: 13, fontWeight: '700' },
  editorCardArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  editorToolbar: { paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 40, backgroundColor: '#1C1C1E', borderTopWidth: 1, borderTopColor: '#FFF1' },
  toolbarHint: { alignItems: 'center', paddingVertical: 8 },
  toolbarHintText: { color: '#FFF4', fontSize: 12 },
  toolbarBottom: { marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#FFF1', paddingTop: 10 },
  colorDotSm: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tagInputSm: { backgroundColor: '#FFF1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#FFF', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 10 },
  blurSlider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  blurBarOuter: { flex: 1, height: 4, backgroundColor: '#FFF1', borderRadius: 2 },
  blurBarInner: { height: 4, backgroundColor: '#FFF', borderRadius: 2 },
});
