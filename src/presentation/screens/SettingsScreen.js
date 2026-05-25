import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { AppConstants } from '../../core/constants/appConstants';
import { GlassCard } from '../widgets/GlassCard';

export function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme, glassMode, setGlass } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Appearance */}
      <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>APPEARANCE</Text>
      <GlassCard style={styles.group}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: '#5E5CE620' }]}>
            <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={18} color={isDarkMode ? '#5E5CE6' : '#FF9F0A'} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ true: '#30D158', false: '#E5E5EA' }}
            thumbColor="#FFF"
          />
        </View>
      </GlassCard>

      {/* Liquid Glass Design */}
      <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>DESIGN STYLE</Text>
      <GlassCard style={styles.group}>
        <TouchableOpacity
          style={[styles.row, glassMode === 'off' && { backgroundColor: theme.primary + '15' }]}
          onPress={() => setGlass('off')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#8E8E9320' }]}>
            <Ionicons name="square" size={18} color="#8E8E93" />
          </View>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Solid</Text>
          {glassMode === 'off' && <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />}
        </TouchableOpacity>
        <View style={[styles.separator, { backgroundColor: theme.separator }]} />
        <TouchableOpacity
          style={[styles.row, glassMode === 'clear' && { backgroundColor: theme.primary + '15' }]}
          onPress={() => setGlass('clear')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#64D2FF20' }]}>
            <Ionicons name="water-outline" size={18} color="#64D2FF" />
          </View>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Liquid Glass (Clear)</Text>
          {glassMode === 'clear' && <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />}
        </TouchableOpacity>
        <View style={[styles.separator, { backgroundColor: theme.separator }]} />
        <TouchableOpacity
          style={[styles.row, glassMode === 'tinted' && { backgroundColor: theme.primary + '15' }]}
          onPress={() => setGlass('tinted')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#BF5AF220' }]}>
            <Ionicons name="color-palette-outline" size={18} color="#BF5AF2" />
          </View>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Liquid Glass (Tinted)</Text>
          {glassMode === 'tinted' && <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />}
        </TouchableOpacity>
      </GlassCard>

      {/* About */}
      <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>ABOUT</Text>
      <GlassCard style={styles.group}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: '#30D15820' }]}>
            <Ionicons name="fitness" size={18} color="#30D158" />
          </View>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Version</Text>
          <Text style={[styles.rowValue, { color: theme.textMuted }]}>{AppConstants.APP_VERSION}</Text>
        </View>
        <View style={[styles.separator, { backgroundColor: theme.separator }]} />
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: '#0A84FF20' }]}>
            <Ionicons name="code-slash" size={18} color="#0A84FF" />
          </View>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Built with</Text>
          <Text style={[styles.rowValue, { color: theme.textMuted }]}>Expo + React Native</Text>
        </View>
      </GlassCard>

      {/* Workout */}
      <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>WORKOUT</Text>
      <GlassCard style={styles.group}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: '#FF453A20' }]}>
            <Ionicons name="location" size={18} color="#FF453A" />
          </View>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>GPS Accuracy</Text>
          <Text style={[styles.rowValue, { color: theme.textMuted }]}>Best</Text>
        </View>
        <View style={[styles.separator, { backgroundColor: theme.separator }]} />
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: '#FFD60A20' }]}>
            <Ionicons name="notifications" size={18} color="#FFD60A" />
          </View>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Auto-Pause</Text>
          <Text style={[styles.rowValue, { color: theme.textMuted }]}>Coming Soon</Text>
        </View>
      </GlassCard>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: { fontSize: 13, fontWeight: '400', marginTop: 28, marginBottom: 8, marginLeft: 20, letterSpacing: 0.3 },
  group: { marginHorizontal: 16, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14, gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16 },
  rowValue: { fontSize: 15 },
  separator: { height: 0.5, marginLeft: 58 },
});
