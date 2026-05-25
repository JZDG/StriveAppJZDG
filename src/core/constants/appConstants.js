/**
 * App-wide constants for StriveApp
 */
export const AppConstants = {
  // App Info
  APP_NAME: 'STRIVE',
  APP_VERSION: '1.1.0',

  // Layout constraints
  HORIZONTAL_PADDING: 16,
  VERTICAL_PADDING: 12,
  CARD_BORDER_RADIUS: 16,
  SMALL_BORDER_RADIUS: 8,

  // Font sizes
  FONT_SIZE_TITLE: 20,
  FONT_SIZE_SUBTITLE: 16,
  FONT_SIZE_BODY: 14,
  FONT_SIZE_CAPTION: 12,
  FONT_SIZE_STAT: 32,
  FONT_SIZE_STAT_LABEL: 11,

  // Tracking
  LOCATION_UPDATE_INTERVAL_MS: 1000,
  MIN_DISTANCE_FILTER_METERS: 3.0,
  GPS_SPIKE_VELOCITY_THRESHOLD: 45.0, // m/s (~162 km/h)

  // Database
  DB_NAME: 'striveapp_activities',
  DB_VERSION: 1,

  // Workout Types
  WORKOUT_TYPES: {
    RUN: 'run',
    WALK: 'walk',
    CYCLE: 'cycle',
    GYM: 'gym',
  },

  // Workout States
  WORKOUT_STATES: {
    IDLE: 'idle',
    ACTIVE: 'active',
    PAUSED: 'paused',
    FINISHED: 'finished',
  },
};
