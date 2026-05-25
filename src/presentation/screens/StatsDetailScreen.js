import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { useWorkout } from '../../domain/providers/WorkoutContext';
import { formatDuration } from '../../core/utils/distanceCalculator';

const { width } = Dimensions.get('window');
const CHART_W = width - 64;
const CHART_H = 180;

export function StatsDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { history } = useWorkout();
  const { statType, color } = route.params; // 'steps' | 'distance' | 'sessions' | 'duration'
  const [period, setPeriod] = useState('D');

  const periods = ['D', 'W', 'M', 'Y'];

  // Build real chart data from history based on period
  const chartData = useMemo(() => {
    const now = new Date();

    if (period === 'D') {
      // Group by hour (24 bars)
      const hours = Array(24).fill(0);
      history.forEach((a) => {
        const d = new Date(a.startTime);
        if (d.toDateString() === now.toDateString()) {
          const h = d.getHours();
          if (statType === 'steps') hours[h] += a.steps || 0;
          else if (statType === 'distance') hours[h] += a.distanceMeters;
          else if (statType === 'sessions') hours[h] += 1;
          else if (statType === 'duration') hours[h] += a.durationSeconds;
        }
      });
      return { values: hours, labels: ['12AM', '6AM', '12PM', '6PM', ''] };
    } else if (period === 'W') {
      // Group by day of week (7 bars)
      const days = Array(7).fill(0);
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
      history.forEach((a) => {
        const d = new Date(a.startTime);
        if (d >= weekStart) {
          const day = d.getDay();
          if (statType === 'steps') days[day] += a.steps || 0;
          else if (statType === 'distance') days[day] += a.distanceMeters;
          else if (statType === 'sessions') days[day] += 1;
          else if (statType === 'duration') days[day] += a.durationSeconds;
        }
      });
      return { values: days, labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
    } else if (period === 'M') {
      // Group by week (4 bars)
      const weeks = Array(4).fill(0);
      history.forEach((a) => {
        const d = new Date(a.startTime);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          const week = Math.min(3, Math.floor(d.getDate() / 7));
          if (statType === 'steps') weeks[week] += a.steps || 0;
          else if (statType === 'distance') weeks[week] += a.distanceMeters;
          else if (statType === 'sessions') weeks[week] += 1;
          else if (statType === 'duration') weeks[week] += a.durationSeconds;
        }
      });
      return { values: weeks, labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] };
    } else {
      // Year — group by month (12 bars)
      const months = Array(12).fill(0);
      history.forEach((a) => {
        const d = new Date(a.startTime);
        if (d.getFullYear() === now.getFullYear()) {
          const m = d.getMonth();
          if (statType === 'steps') months[m] += a.steps || 0;
          else if (statType === 'distance') months[m] += a.distanceMeters;
          else if (statType === 'sessions') months[m] += 1;
          else if (statType === 'duration') months[m] += a.durationSeconds;
        }
      });
      return { values: months, labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] };
    }
  }, [history, period, statType]);

  // Calculate totals and display value
  const total = chartData.values.reduce((s, v) => s + v, 0);
  const maxVal = Math.max(...chartData.values, 1);

  const displayValue = () => {
    if (statType === 'steps') return total.toLocaleString();
    if (statType === 'distance') return (total / 1000).toFixed(2);
    if (statType === 'sessions') return total.toString();
    if (statType === 'duration') return formatDuration(total);
    return '0';
  };

  const displayUnit = () => {
    if (statType === 'distance') return 'KM';
    if (statType === 'steps') return '';
    if (statType === 'duration') return '';
    return '';
  };

  const titles = { steps: 'Steps', distance: 'Distance', sessions: 'Sessions', duration: 'Duration' };

  // Chart rendering
  const barCount = chartData.values.length;
  const barGap = 2;
  const barWidth = Math.max(4, (CHART_W - 40) / barCount - barGap);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color={theme.primary || '#0A84FF'} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.textPrimary }]}>{titles[statType]}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        {period === 'D' ? 'Today' : period === 'W' ? 'This Week' : period === 'M' ? 'This Month' : 'This Year'}
      </Text>

      {/* Period selector */}
      <View style={[styles.periodRow, { backgroundColor: theme.card }]}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart Card */}
      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        <Text style={styles.chartLabel}>{statType === 'distance' ? 'DISTANCE' : statType.toUpperCase()}</Text>
        <Text style={[styles.chartValue, { color }]}>
          {displayValue()}
          {displayUnit() ? <Text style={styles.chartUnit}>{displayUnit()}</Text> : null}
        </Text>

        {/* SVG Bar chart */}
        <View style={styles.chartArea}>
          <Svg width={CHART_W} height={CHART_H}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Line
                key={i}
                x1={0} y1={CHART_H - 20 - ratio * (CHART_H - 40)}
                x2={CHART_W - 30} y2={CHART_H - 20 - ratio * (CHART_H - 40)}
                stroke="#3A3A3C" strokeWidth={0.5} strokeDasharray="4,4"
              />
            ))}

            {/* Bars */}
            {chartData.values.map((val, i) => {
              const barH = maxVal > 0 ? (val / maxVal) * (CHART_H - 50) : 0;
              const x = 10 + i * (barWidth + barGap);
              return (
                <Rect
                  key={i}
                  x={x}
                  y={CHART_H - 20 - barH}
                  width={barWidth}
                  height={Math.max(barH, 1)}
                  rx={barWidth / 2}
                  fill={val > 0 ? color : '#3A3A3C'}
                  opacity={val > 0 ? 1 : 0.3}
                />
              );
            })}

            {/* Y-axis labels */}
            <SvgText x={CHART_W - 5} y={25} fontSize={9} fill="#8E8E93" textAnchor="end">
              {statType === 'distance' ? (maxVal / 1000).toFixed(1) : maxVal.toLocaleString()}
            </SvgText>
            <SvgText x={CHART_W - 5} y={CHART_H / 2} fontSize={9} fill="#8E8E93" textAnchor="end">
              {statType === 'distance' ? (maxVal / 2000).toFixed(1) : Math.round(maxVal / 2).toLocaleString()}
            </SvgText>
            <SvgText x={CHART_W - 5} y={CHART_H - 15} fontSize={9} fill="#8E8E93" textAnchor="end">
              0
            </SvgText>
          </Svg>
        </View>

        {/* X-axis labels */}
        <View style={styles.xLabels}>
          {chartData.labels.map((label, i) => (
            <Text key={i} style={styles.xLabel}>{label}</Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  backBtn: { marginTop: 8, marginBottom: 8, width: 40 },
  title: { fontSize: 34, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 2, marginBottom: 16 },
  periodRow: { flexDirection: 'row', borderRadius: 8, padding: 3, marginBottom: 20 },
  periodBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  periodBtnActive: { backgroundColor: '#3A3A3C' },
  periodText: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
  periodTextActive: { color: '#FFF' },
  chartCard: { borderRadius: 16, padding: 16 },
  chartLabel: { fontSize: 12, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5 },
  chartValue: { fontSize: 28, fontWeight: '700', marginTop: 4, marginBottom: 8 },
  chartUnit: { fontSize: 14, fontWeight: '500' },
  chartArea: { marginTop: 4 },
  xLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 8 },
  xLabel: { fontSize: 9, color: '#8E8E93' },
});
