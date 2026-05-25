/**
 * iOS-native color system (SwiftUI style)
 * Uses Apple's Human Interface Guidelines colors
 */
export const Colors = {
  // ─── DARK MODE (Default — iOS style) ───
  dark: {
    background: '#000000',
    secondaryBackground: '#1C1C1E',
    tertiaryBackground: '#2C2C2E',
    surface: '#1C1C1E',
    groupedBackground: '#000000',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    primary: '#0A84FF',       // iOS Blue
    onPrimary: '#FFFFFF',
    secondary: '#48484A',
    onSecondary: '#FFFFFF',
    outline: '#38383A',
    card: '#1C1C1E',
    modal: '#1C1C1E',
    divider: '#38383A',
    textPrimary: '#FFFFFF',
    textSecondary: '#EBEBF5',  // 60% opacity white
    textMuted: '#8E8E93',      // iOS systemGray
    inputFill: '#2C2C2E',
    separator: '#38383A',
    // iOS System Colors
    systemRed: '#FF453A',
    systemOrange: '#FF9F0A',
    systemYellow: '#FFD60A',
    systemGreen: '#30D158',
    systemTeal: '#64D2FF',
    systemBlue: '#0A84FF',
    systemIndigo: '#5E5CE6',
    systemPurple: '#BF5AF2',
    systemPink: '#FF375F',
  },

  // ─── LIGHT MODE ───
  light: {
    background: '#F2F2F7',
    secondaryBackground: '#FFFFFF',
    tertiaryBackground: '#F2F2F7',
    surface: '#FFFFFF',
    groupedBackground: '#F2F2F7',
    onBackground: '#000000',
    onSurface: '#000000',
    primary: '#007AFF',
    onPrimary: '#FFFFFF',
    secondary: '#8E8E93',
    onSecondary: '#FFFFFF',
    outline: '#C6C6C8',
    card: '#FFFFFF',
    modal: '#FFFFFF',
    divider: '#C6C6C8',
    textPrimary: '#000000',
    textSecondary: '#3C3C43',
    textMuted: '#8E8E93',
    inputFill: '#E5E5EA',
    separator: '#C6C6C8',
    systemRed: '#FF3B30',
    systemOrange: '#FF9500',
    systemYellow: '#FFCC00',
    systemGreen: '#34C759',
    systemTeal: '#5AC8FA',
    systemBlue: '#007AFF',
    systemIndigo: '#5856D6',
    systemPurple: '#AF52DE',
    systemPink: '#FF2D55',
  },

  // ─── SHARED (accent) ───
  accent: '#30D158', // iOS Green for workout/fitness
};
