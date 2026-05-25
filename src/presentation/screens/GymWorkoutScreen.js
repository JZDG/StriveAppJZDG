import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../core/theme/ThemeContext';
import { useWorkout } from '../../domain/providers/WorkoutContext';
import { formatDuration } from '../../core/utils/distanceCalculator';

export function GymWorkoutScreen({ navigation }) {
  const { theme } = useTheme();
  const workout = useWorkout();
  const [showAddModal, setShowAddModal] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const restTimerRef = useRef(null);

  // Add exercise form
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');

  const startRest = (seconds) => {
    setRestSeconds(seconds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    restTimerRef.current = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const addExercise = () => {
    if (!exerciseName.trim()) return;
    workout.addGymExercise(
      exerciseName.trim(),
      parseInt(sets) || 3,
      parseInt(reps) || 10,
      parseFloat(weight) || 0
    );
    setExerciseName('');
    setSets('3');
    setReps('10');
    setWeight('0');
    setShowAddModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleStop = () => {
    Alert.alert('FINISH WORKOUT?', 'End this gym session?', [
      { text: 'CANCEL', style: 'cancel' },
      { text: 'DISCARD', style: 'destructive', onPress: () => { workout.stopAndDiscardWorkout(); navigation.goBack(); }},
      { text: 'SAVE', onPress: async () => { await workout.stopAndSaveWorkout({ title: 'Gym Session' }); navigation.goBack(); }},
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <View>
          <Text style={[styles.headerLabel, { color: theme.textMuted }]}>ELAPSED TIME</Text>
          <Text style={[styles.timer, { color: theme.textPrimary }]}>
            {formatDuration(workout.elapsedSeconds)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.headerLabel, { color: theme.textMuted }]}>EXERCISES</Text>
          <Text style={[styles.exerciseCount, { color: theme.textPrimary }]}>
            {workout.gymExercises.length}
          </Text>
        </View>
      </View>

      {/* Rest Timer */}
      {restSeconds > 0 && (
        <View style={[styles.restBanner, { borderColor: '#1DB954' }]}>
          <Text style={styles.restLabel}>⏱️ RESTING</Text>
          <Text style={styles.restTimer}>{restSeconds}s</Text>
          <TouchableOpacity onPress={() => { clearInterval(restTimerRef.current); setRestSeconds(0); }}>
            <Text style={styles.skipBtn}>SKIP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercises List */}
      <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
        {workout.gymExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40 }}>🏋️</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No exercises yet.{'\n'}Tap "ADD EXERCISE" below.
            </Text>
          </View>
        ) : (
          workout.gymExercises.map((ex, i) => (
            <View key={i} style={[styles.exerciseCard, { backgroundColor: theme.card, borderColor: theme.outline }]}>
              <Text style={[styles.exerciseName, { color: theme.textPrimary }]}>
                {ex.name.toUpperCase()}
              </Text>
              <Text style={styles.exerciseDetail}>
                {ex.sets} SETS × {ex.reps} REPS{ex.weight > 0 ? ` · ${ex.weight} KG` : ''}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Exercise Form (Inline) */}
      {showAddModal && (
        <View style={[styles.addForm, { backgroundColor: theme.card, borderColor: theme.outline }]}>
          <TextInput
            style={[styles.input, { color: theme.textPrimary, borderColor: theme.outline }]}
            placeholder="Exercise name"
            placeholderTextColor={theme.textMuted}
            value={exerciseName}
            onChangeText={setExerciseName}
            autoFocus
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.smallInput, { color: theme.textPrimary, borderColor: theme.outline }]}
              placeholder="Sets"
              placeholderTextColor={theme.textMuted}
              value={sets}
              onChangeText={setSets}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.smallInput, { color: theme.textPrimary, borderColor: theme.outline }]}
              placeholder="Reps"
              placeholderTextColor={theme.textMuted}
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.smallInput, { color: theme.textPrimary, borderColor: theme.outline }]}
              placeholder="KG"
              placeholderTextColor={theme.textMuted}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addExercise}>
            <Text style={styles.addBtnText}>ADD</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        {/* Rest Timer Buttons */}
        <View style={styles.restButtons}>
          {[30, 60, 90, 120].map((sec) => (
            <TouchableOpacity
              key={sec}
              style={[styles.restBtn, { borderColor: theme.outline }]}
              onPress={() => startRest(sec)}
            >
              <Text style={[styles.restBtnText, { color: theme.textPrimary }]}>{sec}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.outline }]}
            onPress={() => setShowAddModal(!showAddModal)}
          >
            <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
              {showAddModal ? '✕ CLOSE' : '+ ADD EXERCISE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.finishBtn} onPress={handleStop}>
            <Text style={styles.finishBtnText}>FINISH</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 20, padding: 20, marginBottom: 12 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  timer: { fontSize: 32, fontWeight: '900', marginTop: 4 },
  exerciseCount: { fontSize: 28, fontWeight: '900', marginTop: 4 },
  restBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, backgroundColor: 'rgba(29,185,84,0.1)', marginBottom: 12 },
  restLabel: { fontSize: 12, fontWeight: '900', color: '#1DB954', flex: 1 },
  restTimer: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginRight: 12 },
  skipBtn: { fontSize: 11, fontWeight: '900', color: '#888' },
  exerciseList: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { textAlign: 'center', marginTop: 12, fontSize: 14 },
  exerciseCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  exerciseName: { fontSize: 16, fontWeight: '900' },
  exerciseDetail: { fontSize: 12, fontWeight: '700', color: '#1DB954', marginTop: 4 },
  addForm: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
  input: { borderBottomWidth: 1, paddingVertical: 10, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 10 },
  smallInput: { flex: 1, borderBottomWidth: 1, paddingVertical: 8, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  addBtn: { backgroundColor: '#1DB954', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 14 },
  addBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  bottomBar: { paddingTop: 12 },
  restButtons: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 },
  restBtn: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  restBtnText: { fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1 },
  actionBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  finishBtn: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', backgroundColor: '#EF4444' },
  finishBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});
