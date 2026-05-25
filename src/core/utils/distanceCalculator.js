/**
 * Utility class for GPS distance calculations using the Haversine formula.
 */
const EARTH_RADIUS_KM = 6371.0;

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate distance between two GPS coordinates in meters.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c * 1000; // meters
}

/**
 * Calculate total distance from a list of coordinate points in meters.
 */
export function calculateTotalDistance(points) {
  if (points.length < 2) return 0.0;
  let total = 0.0;
  for (let i = 1; i < points.length; i++) {
    total += calculateDistance(
      points[i - 1][0], points[i - 1][1],
      points[i][0], points[i][1]
    );
  }
  return total;
}

/**
 * Format meters to a human-readable string.
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${meters.toFixed(0)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format duration in seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Calculate pace in min/km from distance (meters) and duration (seconds).
 */
export function formatPace(distanceMeters, durationSeconds) {
  if (distanceMeters <= 0) return '--:--';
  const paceSeconds = durationSeconds / (distanceMeters / 1000);
  const paceMinutes = Math.floor(paceSeconds / 60);
  const paceRemainder = Math.floor(paceSeconds % 60);
  return `${paceMinutes}:${String(paceRemainder).padStart(2, '0')} /km`;
}

/**
 * Calories per second based on heart rate (Keytel formula for male, ~70kg, age 25)
 */
export function caloriesPerSecond(heartRate) {
  const kcalPerMin = (-55.0969 + 0.6309 * heartRate + 0.1988 * 70 + 0.2017 * 25) / 4.184;
  return (kcalPerMin > 0 ? kcalPerMin : 0) / 60.0;
}

/**
 * Estimate calories from distance (fallback when no HR)
 */
export function estimateCalories(distanceMeters, activityType, durationSeconds) {
  const distanceKm = distanceMeters / 1000;
  switch (activityType) {
    case 'run': return distanceKm * 70;
    case 'walk': return distanceKm * 49;
    case 'cycle': return distanceKm * 35;
    case 'gym': return durationSeconds * (400 / 3600);
    default: return distanceKm * 60;
  }
}
