/**
 * Model representing a single workout activity.
 */
export class ActivityModel {
  constructor({
    id,
    type,
    distanceMeters = 0,
    durationSeconds = 0,
    routePoints = [],
    routeSpeeds = [],
    startTime,
    endTime,
    avgPaceSecondsPerKm = 0,
    caloriesBurned = 0,
    avgHeartRate = 0,
    maxHeartRate = 0,
    steps = 0,
    title = null,
    description = null,
    imagePath = null,
    gymExercises = null,
  }) {
    this.id = id;
    this.type = type;
    this.distanceMeters = distanceMeters;
    this.durationSeconds = durationSeconds;
    this.routePoints = routePoints;
    this.routeSpeeds = routeSpeeds;
    this.startTime = startTime;
    this.endTime = endTime;
    this.avgPaceSecondsPerKm = avgPaceSecondsPerKm;
    this.caloriesBurned = caloriesBurned;
    this.avgHeartRate = avgHeartRate;
    this.maxHeartRate = maxHeartRate;
    this.steps = steps;
    this.title = title;
    this.description = description;
    this.imagePath = imagePath;
    this.gymExercises = gymExercises;
  }

  /** Create from JSON (AsyncStorage) */
  static fromJSON(json) {
    return new ActivityModel({
      ...json,
      startTime: new Date(json.startTime),
      endTime: new Date(json.endTime),
    });
  }

  /** Convert to JSON for storage */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      distanceMeters: this.distanceMeters,
      durationSeconds: this.durationSeconds,
      routePoints: this.routePoints,
      routeSpeeds: this.routeSpeeds,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime.toISOString(),
      avgPaceSecondsPerKm: this.avgPaceSecondsPerKm,
      caloriesBurned: this.caloriesBurned,
      avgHeartRate: this.avgHeartRate,
      maxHeartRate: this.maxHeartRate,
      steps: this.steps,
      title: this.title,
      description: this.description,
      imagePath: this.imagePath,
      gymExercises: this.gymExercises,
    };
  }

  /** Friendly type label */
  get typeLabel() {
    const labels = { walk: 'Walking', run: 'Running', cycle: 'Cycling', gym: 'Gym Workout' };
    return labels[this.type] || 'Workout';
  }

  /** Emoji for type */
  get typeEmoji() {
    const emojis = { walk: '🚶', run: '🏃', cycle: '🚴', gym: '🏋️' };
    return emojis[this.type] || '💪';
  }
}
