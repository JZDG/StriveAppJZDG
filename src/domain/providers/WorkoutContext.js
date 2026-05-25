import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { AppConstants } from '../../core/constants/appConstants';
import { calculateDistance, estimateCalories } from '../../core/utils/distanceCalculator';
import { ActivityModel } from '../../data/models/ActivityModel';
import { ActivityRepository } from '../../data/repositories/activityRepository';

const { WORKOUT_STATES, WORKOUT_TYPES } = AppConstants;

const WorkoutContext = createContext();

export function WorkoutProvider({ children }) {
  // Workout State
  const [workoutState, setWorkoutState] = useState(WORKOUT_STATES.IDLE);
  const [activityType, setActivityType] = useState(WORKOUT_TYPES.RUN);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [routePoints, setRoutePoints] = useState([]);
  const [routeSpeeds, setRouteSpeeds] = useState([]);
  const [currentHeartRate, setCurrentHeartRate] = useState(0);
  const [maxHeartRate, setMaxHeartRate] = useState(0);
  const [realTimeCalories, setRealTimeCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [gymExercises, setGymExercises] = useState([]);

  // Refs for interval/subscription
  const timerRef = useRef(null);
  const locationSubRef = useRef(null);
  const startTimeRef = useRef(null);
  const routePointsRef = useRef([]);
  const routeSpeedsRef = useRef([]);
  const totalDistanceRef = useRef(0);
  const lastGpsTimeRef = useRef(null);
  const workoutActiveRef = useRef(false);
  const activityTypeRef = useRef(WORKOUT_TYPES.RUN);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    const activities = await ActivityRepository.getAllActivities();
    setHistory(activities);
    setIsLoadingHistory(false);
  }, []);

  const startWorkout = useCallback(async () => {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    // Reset state
    setWorkoutState(WORKOUT_STATES.ACTIVE);
    setElapsedSeconds(0);
    setTotalDistanceMeters(0);
    activityTypeRef.current = activityType;
    setCurrentSpeed(0);
    setRoutePoints([]);
    setRouteSpeeds([]);
    setCurrentHeartRate(0);
    setMaxHeartRate(0);
    setRealTimeCalories(0);
    setSteps(0);
    setGymExercises([]);
    setCurrentLocation(null);

    // Reset refs
    routePointsRef.current = [];
    routeSpeedsRef.current = [];
    totalDistanceRef.current = 0;
    lastGpsTimeRef.current = null;
    startTimeRef.current = new Date();
    workoutActiveRef.current = true;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Start 1-second timer
    timerRef.current = setInterval(() => {
      if (workoutActiveRef.current) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    // Start GPS tracking — real-time trail drawing (Strava-like)
    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1, // Update every 1 meter moved
        timeInterval: 500,   // Or every 500ms, whichever comes first
      },
      (location) => {
        if (!workoutActiveRef.current) return;

        const { latitude, longitude, speed, accuracy } = location.coords;
        const now = Date.now();
        const currentSpeed = Math.max(speed || 0, 0);

        // Always update current location (for camera and tail)
        setCurrentLocation({ latitude, longitude });
        setCurrentSpeed(currentSpeed);

        const points = routePointsRef.current;

        // First point — always add
        if (points.length === 0) {
          routePointsRef.current = [[latitude, longitude]];
          routeSpeedsRef.current = [currentSpeed];
          lastGpsTimeRef.current = now;
          setRoutePoints([[latitude, longitude]]);
          setRouteSpeeds([currentSpeed]);
          return;
        }

        const lastPoint = points[points.length - 1];
        const distance = calculateDistance(lastPoint[0], lastPoint[1], latitude, longitude);

        // GPS spike filter — reject impossibly fast movement
        if (lastGpsTimeRef.current) {
          const timeDiff = (now - lastGpsTimeRef.current) / 1000;
          if (timeDiff > 0) {
            const velocity = distance / timeDiff;
            if (velocity > AppConstants.GPS_SPIKE_VELOCITY_THRESHOLD && distance > 50) {
              return; // GPS spike — skip
            }
          }
        }

        // Accuracy filter — skip very inaccurate readings
        if (accuracy > 30 && currentSpeed > 0.5) return;

        // Add point if moved at least 1 meter (smooth trail drawing)
        if (distance >= 1.0) {
          const newPoints = [...routePointsRef.current, [latitude, longitude]];
          const newSpeeds = [...routeSpeedsRef.current, currentSpeed];
          const newTotal = totalDistanceRef.current + distance;

          routePointsRef.current = newPoints;
          routeSpeedsRef.current = newSpeeds;
          totalDistanceRef.current = newTotal;
          lastGpsTimeRef.current = now;

          // Update state — triggers polyline re-render
          setRoutePoints(newPoints);
          setRouteSpeeds(newSpeeds);
          setTotalDistanceMeters(newTotal);

          // Estimate steps from distance (walking ~1300/km, running ~1000/km)
          const stepsPerKm = activityTypeRef.current === 'walk' ? 1300 : activityTypeRef.current === 'run' ? 1000 : 800;
          setSteps(Math.round((newTotal / 1000) * stepsPerKm));
        }
      }
    );

    return true;
  }, []);

  const pauseWorkout = useCallback(() => {
    workoutActiveRef.current = false;
    setWorkoutState(WORKOUT_STATES.PAUSED);
    setCurrentSpeed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const resumeWorkout = useCallback(() => {
    workoutActiveRef.current = true;
    setWorkoutState(WORKOUT_STATES.ACTIVE);
    // Restart timer
    timerRef.current = setInterval(() => {
      if (workoutActiveRef.current) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const stopAndSaveWorkout = useCallback(async ({ title, description } = {}) => {
    workoutActiveRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (locationSubRef.current) locationSubRef.current.remove();

    const finalDistance = totalDistanceRef.current;
    const finalPoints = routePointsRef.current;
    const finalSpeeds = routeSpeedsRef.current;
    const distanceKm = finalDistance / 1000;
    const calories = estimateCalories(finalDistance, activityType, elapsedSeconds);
    const avgPace = finalDistance > 0 ? elapsedSeconds / distanceKm : 0;

    const activity = new ActivityModel({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      type: activityType,
      distanceMeters: finalDistance,
      durationSeconds: elapsedSeconds,
      routePoints: finalPoints,
      routeSpeeds: finalSpeeds,
      startTime: startTimeRef.current || new Date(),
      endTime: new Date(),
      avgPaceSecondsPerKm: avgPace,
      caloriesBurned: calories,
      avgHeartRate: 0,
      maxHeartRate: 0,
      steps: steps,
      title: title || null,
      description: description || null,
      gymExercises: gymExercises.length > 0 ? gymExercises : null,
    });

    await ActivityRepository.saveActivity(activity);

    // Reset
    setWorkoutState(WORKOUT_STATES.IDLE);
    setCurrentSpeed(0);
    routePointsRef.current = [];
    routeSpeedsRef.current = [];
    totalDistanceRef.current = 0;

    await loadHistory();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [activityType, elapsedSeconds, steps, gymExercises, loadHistory]);

  const stopAndDiscardWorkout = useCallback(() => {
    workoutActiveRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (locationSubRef.current) locationSubRef.current.remove();

    setWorkoutState(WORKOUT_STATES.IDLE);
    setCurrentSpeed(0);
    setRoutePoints([]);
    setRouteSpeeds([]);
    setTotalDistanceMeters(0);
    routePointsRef.current = [];
    routeSpeedsRef.current = [];
    totalDistanceRef.current = 0;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const addGymExercise = useCallback((name, sets, reps, weight) => {
    setGymExercises((prev) => [...prev, { name, sets, reps, weight }]);
  }, []);

  const deleteActivity = useCallback(async (id) => {
    await ActivityRepository.deleteActivity(id);
    await loadHistory();
  }, [loadHistory]);

  const value = {
    workoutState,
    activityType,
    elapsedSeconds,
    totalDistanceMeters,
    currentSpeed,
    routePoints,
    routeSpeeds,
    currentHeartRate,
    maxHeartRate,
    realTimeCalories,
    steps,
    currentLocation,
    history,
    isLoadingHistory,
    gymExercises,
    setActivityType,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopAndSaveWorkout,
    stopAndDiscardWorkout,
    loadHistory,
    addGymExercise,
    deleteActivity,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within WorkoutProvider');
  return context;
}
