/**
 * Утилиты для работы с картами.
 * Кроссплатформенное открытие маршрута:
 * - Desktop: Яндекс.Карты (веб)
 * - Mobile: yandexmaps:// deep link (приложение Яндекс.Карт)
 */

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Открывает маршрут до указанных координат.
 * На мобильных — через deep link Яндекс.Карт (приложение).
 * На десктопе — через веб-версию Яндекс.Карт.
 */
export function openRouteToLocation(latitude: number, longitude: number): void {
  if (isMobile()) {
    // Deep link для приложения Яндекс.Карт
    const deepLink = `yandexmaps://maps.yandex.ru/?rtext=~${latitude},${longitude}&rtt=auto`;
    const webFallback = `https://yandex.ru/maps/?rtext=~${latitude},${longitude}&rtt=auto`;

    // Пробуем открыть приложение, при неудаче — веб-версию
    const start = Date.now();
    window.location.href = deepLink;

    setTimeout(() => {
      // Если прошло мало времени — приложение не открылось
      if (Date.now() - start < 2000) {
        window.open(webFallback, '_blank');
      }
    }, 1500);
  } else {
    // Desktop — Яндекс.Карты веб-версия
    const url = `https://yandex.ru/maps/?rtext=~${latitude},${longitude}&rtt=auto`;
    window.open(url, '_blank');
  }
}

/**
 * Открывает карту с точкой участника.
 * На мобильных — через deep link Яндекс.Карт.
 * На десктопе — через веб-версию Яндекс.Карт.
 */
export function openParticipantLocation(latitude: number, longitude: number): void {
  if (isMobile()) {
    const deepLink = `yandexmaps://maps.yandex.ru/?pt=${longitude},${latitude}&z=15`;
    const webFallback = `https://yandex.ru/maps/?pt=${longitude},${latitude}&z=15`;

    const start = Date.now();
    window.location.href = deepLink;

    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(webFallback, '_blank');
      }
    }, 1500);
  } else {
    const url = `https://yandex.ru/maps/?pt=${longitude},${latitude}&z=15`;
    window.open(url, '_blank');
  }
}

/**
 * Открывает маршрут от точки участника до точки встречи.
 * На мобильных — через deep link Яндекс.Карт (приложение).
 * На десктопе — через веб-версию Яндекс.Карт.
 */
export function openRouteFromTo(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): void {
  // rtext=lat1,lng1~lat2,lng2 — маршрут от точки до точки
  const routeParams = `rtext=${fromLat},${fromLng}~${toLat},${toLng}&rtt=auto`;

  if (isMobile()) {
    const deepLink = `yandexmaps://maps.yandex.ru/?${routeParams}`;
    const webFallback = `https://yandex.ru/maps/?${routeParams}`;

    const start = Date.now();
    window.location.href = deepLink;

    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(webFallback, '_blank');
      }
    }, 1500);
  } else {
    const url = `https://yandex.ru/maps/?${routeParams}`;
    window.open(url, '_blank');
  }
}
