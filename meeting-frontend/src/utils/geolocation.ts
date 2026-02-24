export interface GeoResult {
  latitude: number;
  longitude: number;
  source: 'gps' | 'ip';
  accuracy?: number;
}

/**
 * Попытка получить геолокацию: GPS → IP → null.
 * Возвращает null если оба метода не сработали.
 */
export async function getLocationWithFallback(
  gpsTimeoutMs: number = 5000
): Promise<GeoResult | null> {
  // 1. Попытка GPS
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: gpsTimeoutMs,
        maximumAge: 30000,
      });
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      source: 'gps',
      accuracy: position.coords.accuracy,
    };
  } catch {
    // GPS не сработал — пробуем IP
  }

  // 2. Попытка IP-геолокации
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'ip',
        };
      }
    }
  } catch {
    // IP-геолокация тоже не сработала
  }

  return null;
}
