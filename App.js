import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/core/theme/ThemeContext';
import { WorkoutProvider } from './src/domain/providers/WorkoutContext';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <WorkoutProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </WorkoutProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
