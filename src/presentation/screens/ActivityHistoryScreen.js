import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { useWorkout } from '../../domain/providers/WorkoutContext';
import { formatDistance, formatDuration } from '../../core/utils/distanceCalculator';
import { GlassCard } from '../widgets/GlassCard';

const ACTIVITY_CONFIG = {
  run: { icon: 'run-fast', color: '#30D158' },
  walk: { icon: 'walk', color: '#FFD60A' },
  cycle: { icon: 'bike', color: '#FF9F0A' },
  gym: { icon: 'dumbbell', color: '#BF5AF2' },
};

export function ActivityHistoryScreen({ navigation }) {
  const { theme } = useTheme();
  const { history, loadHistory, isLoadingHistory, deleteActivity } = useWorkout();

  useEffect(() => { loadHistory(); }, []);

  const handleDelete = (id) => {
    Alert.alert('Delete Activity', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteActivity(id) },
    ]);
  };

  const renderItem = ({ item }) => {
    const config = ACTIVITY_CONFIG[item.type] || ACTIVITY_CONFIG.run;
    return (
      <TouchableOpacity
        style={styles.rowTouch}
        onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.6}
      >
        <GlassCard style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: config.color + '20' }]}>
            <MaterialCommunityIcons name={config.icon} size={20} color={config.color} />
          </View>
          <View style={styles.rowContent}>
            <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
              {item.title || item.typeLabel}
            </Text>
            <Text style={[styles.rowSub, { color: theme.textMuted }]}>
              {formatDistance(item.distanceMeters)} · {Math.round(item.caloriesBurned)} kcal
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.rowDuration, { color: theme.textPrimary }]}>
              {formatDuration(item.durationSeconds)}
            </Text>
            <Text style={[styles.rowDate, { color: theme.textMuted }]}>
              {new Date(item.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* iOS Large Title + Settings button */}
      <View style={styles.headerRow}>
        <Text style={[styles.largeTitle, { color: theme.textPrimary }]}>History</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoadingHistory && (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No activities recorded</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 120 }} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
  largeTitle: { fontSize: 34, fontWeight: '700', marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 20 },
  list: { paddingBottom: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12,
  },
  rowTouch: { marginBottom: 0 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowDuration: { fontSize: 15, fontWeight: '600' },
  rowDate: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, marginTop: 12 },
});
