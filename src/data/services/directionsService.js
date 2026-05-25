/**
 * Directions Service using OSRM (free, no API key needed)
 * Returns road-snapped route polyline, distance, and duration
 */

const OSRM_BASE = 'https://router.project-osrm.org';

/**
 * Get walking directions between two coordinates
 * Returns { routeCoords, distanceMeters, durationSeconds, steps }
 */
export async function getWalkingDirections(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `${OSRM_BASE}/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const geometry = route.geometry;

    // GeoJSON coordinates are [lng, lat] — convert to [lat, lng] for react-native-maps
    const routeCoords = geometry.coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    // Extract turn-by-turn steps
    const steps = [];
    if (route.legs && route.legs[0] && route.legs[0].steps) {
      for (const step of route.legs[0].steps) {
        steps.push({
          instruction: step.maneuver?.type || '',
          modifier: step.maneuver?.modifier || '',
          distance: step.distance,
          duration: step.duration,
          name: step.name || '',
          location: {
            latitude: step.maneuver.location[1],
            longitude: step.maneuver.location[0],
          },
        });
      }
    }

    return {
      routeCoords,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      steps,
    };
  } catch (e) {
    console.log('OSRM Directions error:', e);
    return null;
  }
}

/**
 * Format distance to human readable
 */
export function formatRouteDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration to human readable
 */
export function formatRouteDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  const remaining = min % 60;
  return `${hrs}h ${remaining}m`;
}
