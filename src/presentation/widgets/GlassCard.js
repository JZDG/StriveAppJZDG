import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../core/theme/ThemeContext';

/**
 * GlassCard — silver gradient background card
 * Lighter gray at top, darker at bottom
 * Supports onPress for tappable cards
 */
export function GlassCard({ children, style, onPress }) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode
    ? ['#333336', '#1C1C1E']
    : ['#FFFFFF', '#F0F0F5'];

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={onPress} activeOpacity={0.7} style={[styles.outer, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
});
