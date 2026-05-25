import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../core/theme/ThemeContext';
import { CustomTabBar } from '../widgets/CustomTabBar';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { NavigationScreen } from '../screens/NavigationScreen';
import { CountdownScreen } from '../screens/CountdownScreen';
import { WorkoutSelectScreen } from '../screens/WorkoutSelectScreen';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import { GymWorkoutScreen } from '../screens/GymWorkoutScreen';
import { ActivityHistoryScreen } from '../screens/ActivityHistoryScreen';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';
import { StatsDetailScreen } from '../screens/StatsDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        contentStyle: { backgroundColor: '#000000' },
        headerShadowVisible: false,
        headerLargeTitle: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StatsDetail" component={StatsDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Countdown" component={CountdownScreen} options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="GymWorkout" component={GymWorkoutScreen} options={{ title: 'Strength Training', gestureEnabled: false }} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}

function WorkoutStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        contentStyle: { backgroundColor: '#000000' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="WorkoutSelect" component={WorkoutSelectScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Countdown" component={CountdownScreen} options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="GymWorkout" component={GymWorkoutScreen} options={{ title: 'Strength Training', gestureEnabled: false }} />
    </Stack.Navigator>
  );
}

function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
      <Stack.Screen name="MapMain" component={MapScreen} />
      <Stack.Screen name="Navigation" component={NavigationScreen} options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        contentStyle: { backgroundColor: '#000000' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="HistoryMain" component={ActivityHistoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const navigationRef = React.useRef();

  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
        sceneContainerStyle={{ backgroundColor: '#000000' }}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Explore" component={ExploreStack} />
        <Tab.Screen name="Workout" component={WorkoutStack} />
        <Tab.Screen name="History" component={HistoryStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
