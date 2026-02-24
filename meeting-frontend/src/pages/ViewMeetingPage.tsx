import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { YMaps, Map, Placemark, ZoomControl } from 'react-yandex-maps';
import { MeetingFull, MeetingPreview, Participant, LocationMode, LocationSource, ParticipantEta } from '../types/meeting';
import { API_ENDPOINTS, YANDEX_MAPS_API_KEY } from '../config/api';
import { getParticipantToken, setParticipantToken, removeParticipantToken } from '../utils/cookies';
import { openRouteToLocation } from '../utils/maps';
import { getLocationWithFallback } from '../utils/geolocation';
import PinModal from '../components/PinModal';
import ParticipantsList from '../components/ParticipantsList';
import './ViewMeetingPage.css';

type PageState = 'loading' | 'pin' | 'meeting' | 'error';

const ViewMeetingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [meeting, setMeeting] = useState<MeetingFull | null>(null);
  const [preview, setPreview] = useState<MeetingPreview | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>('auto');
  const [locationSource, setLocationSource] = useState<LocationSource>('none');
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showManualPrompt, setShowManualPrompt] = useState(false);
  const [participantEtas, setParticipantEtas] = useState<Record<string, ParticipantEta>>({});
  const ymapsRef = useRef<any>(null);
  const participantsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Отправка координат на сервер
  const sendLocation = useCallback(async (lat: number, lng: number) => {
    if (!id) return;
    const token = getParticipantToken(id);
    if (!token) return;

    try {
      await fetch(API_ENDPOINTS.UPDATE_LOCATION(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, latitude: lat, longitude: lng }),
      });
    } catch {
      // Тихая ошибка
    }
  }, [id]);

  // Обновление геолокации (автоматический режим)
  const updateLocation = useCallback(async () => {
    if (!id) return;
    const token = getParticipantToken(id);
    if (!token) return;
    if (locationMode === 'manual') return;

    try {
      const geoResult = await getLocationWithFallback(10000);
      if (!geoResult) return;

      setMyLocation({ lat: geoResult.latitude, lng: geoResult.longitude });
      setLocationSource(geoResult.source);

      await sendLocation(geoResult.latitude, geoResult.longitude);
    } catch {
      // Геолокация недоступна — не критично
    }
  }, [id, locationMode, sendLocation]);

  // Загрузка списка участников
  const fetchParticipants = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(API_ENDPOINTS.PARTICIPANTS(id));
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch {
      // Тихая ошибка
    }
  }, [id]);

  // Запуск интервалов после входа на встречу
  const startPolling = useCallback(async () => {
    await fetchParticipants();

    // Поллинг участников каждые 10 секунд
    if (participantsIntervalRef.current) clearInterval(participantsIntervalRef.current);
    participantsIntervalRef.current = setInterval(fetchParticipants, 10000);
  }, [fetchParticipants]);

  // Очистка интервалов
  useEffect(() => {
    return () => {
      if (participantsIntervalRef.current) clearInterval(participantsIntervalRef.current);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, []);

  // Инициализация: проверяем cookie → verify → или показываем PIN
  useEffect(() => {
    const initialize = async () => {
      if (!id) return;

      const token = getParticipantToken(id);

      if (token) {
        // Есть токен — проверяем
        try {
          const response = await fetch(API_ENDPOINTS.VERIFY_TOKEN(id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          if (response.ok) {
            const data = await response.json();
            setMeeting(data.meeting);
            setParticipants(data.meeting.participants);
            setCurrentParticipantId(data.participant.id);
            // Восстановить позицию из данных участника
            if (data.participant.latitude != null && data.participant.longitude != null) {
              setMyLocation({ lat: data.participant.latitude, lng: data.participant.longitude });
            }
            setPageState('meeting');
            return;
          }
        } catch {
          // Токен невалидный — удаляем
        }
        removeParticipantToken(id);
      }

      // Нет валидного токена — загружаем превью и показываем PIN
      try {
        const response = await fetch(API_ENDPOINTS.MEETING_PREVIEW(id));
        if (!response.ok) {
          throw new Error('Встреча не найдена');
        }
        const data = await response.json();
        setPreview(data);
        setPageState('pin');
      } catch (err: any) {
        setError(err.message || 'Ошибка при загрузке встречи');
        setPageState('error');
      }
    };

    initialize();
  }, [id]);

  // Запуск поллинга участников когда вошли на встречу
  useEffect(() => {
    if (pageState === 'meeting') {
      startPolling();
    }
  }, [pageState, startPolling]);

  // Управление поллингом геолокации (зависит от locationMode)
  useEffect(() => {
    if (pageState !== 'meeting') return;

    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);

    if (locationMode === 'auto') {
      updateLocation();
      locationIntervalRef.current = setInterval(updateLocation, 30000);
    }

    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [locationMode, pageState, updateLocation]);

  // Вход по PIN
  const handlePinSubmit = async (pin: string) => {
    if (!id) return;
    setPinLoading(true);
    setPinError(null);

    try {
      // Получаем геолокацию через цепочку фоллбэков: GPS → IP
      const geoResult = await getLocationWithFallback(5000);

      let lat: number | undefined;
      let lng: number | undefined;

      if (geoResult) {
        lat = geoResult.latitude;
        lng = geoResult.longitude;
        setMyLocation({ lat: geoResult.latitude, lng: geoResult.longitude });
        setLocationSource(geoResult.source);
        // IP-геолокация неточная — сразу ручной режим, чтобы пользователь уточнил
        setLocationMode(geoResult.source === 'ip' ? 'manual' : 'auto');
      } else {
        setShowManualPrompt(true);
        setLocationSource('none');
        setLocationMode('manual');
      }

      const response = await fetch(API_ENDPOINTS.JOIN_MEETING(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, latitude: lat, longitude: lng }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Неверный PIN-код');
      }

      const data = await response.json();
      setParticipantToken(id, data.token);
      setMeeting(data.meeting);
      setParticipants(data.meeting.participants);
      setCurrentParticipantId(data.participant.id);
      setPageState('meeting');
    } catch (err: any) {
      setPinError(err.message || 'Ошибка при входе');
    } finally {
      setPinLoading(false);
    }
  };

  // Покинуть встречу
  const handleLeave = async () => {
    if (!id) return;
    const token = getParticipantToken(id);
    if (!token) return;

    try {
      await fetch(API_ENDPOINTS.LEAVE_MEETING(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch {
      // Тихая ошибка
    }

    removeParticipantToken(id);
    setCurrentParticipantId(null);
    setMeeting(null);

    // Перезагружаем превью и показываем PIN
    try {
      const response = await fetch(API_ENDPOINTS.MEETING_PREVIEW(id));
      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      }
    } catch {
      // Тихая ошибка
    }

    // Останавливаем интервалы
    if (participantsIntervalRef.current) clearInterval(participantsIntervalRef.current);
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);

    setPageState('pin');
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Проверяем, выглядит ли адрес как координаты (например "55.764796, 37.600914")
  const isCoordinateAddress = (addr: string) => /^\d+\.\d+,\s*\d+\.\d+$/.test(addr.trim());

  // Сохраняем ссылку на ymaps API при загрузке
  const handleYmapsLoad = useCallback((ymaps: any) => {
    ymapsRef.current = ymaps;
  }, []);

  // Обратное геокодирование — запускается когда и ymaps загружен, и meeting есть
  useEffect(() => {
    if (!meeting || !isCoordinateAddress(meeting.location.address)) return;

    const tryGeocode = () => {
      const ymaps = ymapsRef.current;
      if (!ymaps) return;

      ymaps.geocode([meeting.location.latitude, meeting.location.longitude])
        .then((result: any) => {
          const firstGeoObject = result.geoObjects.get(0);
          if (firstGeoObject) {
            setResolvedAddress(firstGeoObject.getAddressLine());
          }
        })
        .catch(() => { /* не критично */ });
    };

    // Пробуем сразу (ymaps мог уже загрузиться)
    if (ymapsRef.current) {
      tryGeocode();
    } else {
      // Если ymaps ещё не загружен, ждём с интервалом
      const interval = setInterval(() => {
        if (ymapsRef.current) {
          clearInterval(interval);
          tryGeocode();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [meeting]);

  // Расчёт ETA для всех участников с координатами (пешком)
  useEffect(() => {
    if (!meeting || pageState !== 'meeting') return;

    const ymaps = ymapsRef.current;
    if (!ymaps) return;

    const dest: [number, number] = [meeting.location.latitude, meeting.location.longitude];

    // Собираем участников для расчёта: другие + текущий (из myLocation)
    const toCalculate: { id: string; coords: [number, number] }[] = [];

    participants.forEach(p => {
      if (!p.isActive) return;
      if (p.id === currentParticipantId) {
        if (myLocation) {
          toCalculate.push({ id: p.id, coords: [myLocation.lat, myLocation.lng] });
        }
      } else if (p.latitude != null && p.longitude != null) {
        toCalculate.push({ id: p.id, coords: [p.latitude, p.longitude] });
      }
    });

    if (toCalculate.length === 0) return;

    const newEtas: Record<string, ParticipantEta> = {};
    let completed = 0;

    toCalculate.forEach(({ id: pId, coords }) => {
      ymaps.route([coords, dest], { routingMode: 'pedestrian' })
        .then((route: any) => {
          const durationSec = route.getTime();
          const distanceM = route.getLength();
          newEtas[pId] = {
            durationMinutes: Math.round(durationSec / 60),
            distanceKm: Math.round(distanceM / 100) / 10, // округление до 0.1 км
          };
        })
        .catch(() => {
          // Не удалось рассчитать маршрут — пропускаем
        })
        .finally(() => {
          completed++;
          if (completed === toCalculate.length) {
            setParticipantEtas(prev => ({ ...prev, ...newEtas }));
          }
        });
    });
  }, [meeting, participants, myLocation, currentParticipantId, pageState]);

  const handleBuildRoute = () => {
    if (!meeting) return;
    openRouteToLocation(meeting.location.latitude, meeting.location.longitude);
  };

  // Клик по карте — установка/перемещение своего маркера
  const handleMapClickForLocation = useCallback((e: any) => {
    if (!currentParticipantId) return;
    const coords = e.get('coords') as [number, number];
    setMyLocation({ lat: coords[0], lng: coords[1] });
    setLocationMode('manual');
    setLocationSource('manual');
    setShowManualPrompt(false);
    sendLocation(coords[0], coords[1]);
  }, [currentParticipantId, sendLocation]);

  // Состояние: загрузка
  if (pageState === 'loading') {
    return (
      <div className="view-meeting-page">
        <div className="container">
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  // Состояние: ошибка
  if (pageState === 'error') {
    return (
      <div className="view-meeting-page">
        <div className="container">
          <div className="error-box">
            <h2>Ошибка</h2>
            <p>{error || 'Встреча не найдена'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Состояние: PIN-модальное окно
  if (pageState === 'pin') {
    return (
      <PinModal
        meetingTitle={preview?.title || 'Встреча'}
        onSubmit={handlePinSubmit}
        isLoading={pinLoading}
        error={pinError}
      />
    );
  }

  // Участники с известными координатами (для отображения на карте), кроме текущего
  const otherParticipantsWithLocation = participants.filter(
    p => p.isActive && p.latitude != null && p.longitude != null && p.id !== currentParticipantId
  );
  const currentParticipant = participants.find(p => p.id === currentParticipantId);

  // Состояние: встреча
  if (!meeting) return null;

  const coordinates: [number, number] = [meeting.location.latitude, meeting.location.longitude];

  // Вычисляем границы карты: точка встречи + свой маркер + остальные участники
  const allPoints: [number, number][] = [coordinates];
  if (myLocation) {
    allPoints.push([myLocation.lat, myLocation.lng]);
  }
  otherParticipantsWithLocation.forEach(p => {
    allPoints.push([p.latitude!, p.longitude!]);
  });

  // Рассчитываем bounds для автоподстройки зума
  const getBounds = (): [[number, number], [number, number]] | null => {
    if (allPoints.length <= 1) return null;
    const lats = allPoints.map(p => p[0]);
    const lngs = allPoints.map(p => p[1]);
    return [
      [Math.min(...lats) - 0.002, Math.min(...lngs) - 0.002],
      [Math.max(...lats) + 0.002, Math.max(...lngs) + 0.002],
    ];
  };

  const mapBounds = getBounds();

  return (
    <div className="view-meeting-page">
      <div className="container">
        <div className="meeting-details">
          <h1 className="meeting-title">{meeting.title}</h1>

          <div className="meeting-info">
            <div className="info-item">
              <span className="info-label">📅 Дата и время:</span>
              <span className="info-value">{formatDateTime(meeting.dateTime)}</span>
            </div>

            <div className="info-item">
              <span className="info-label">📍 Адрес:</span>
              <span className="info-value">{resolvedAddress || meeting.location.address}</span>
            </div>

            {meeting.description && (
              <div className="info-item description">
                <span className="info-label">📝 Описание:</span>
                <p className="info-value">{meeting.description}</p>
              </div>
            )}
          </div>

          <button onClick={handleBuildRoute} className="route-button">
            🗺️ Проложить маршрут
          </button>

          <div className="map-section">
            <h3>Место встречи</h3>
            <div className="map-container">
              <YMaps query={{ apikey: YANDEX_MAPS_API_KEY, lang: 'ru_RU', load: 'package.full' }} onLoad={handleYmapsLoad}>
                <Map
                  defaultState={{ center: coordinates, zoom: 15 }}
                  state={mapBounds ? { bounds: mapBounds } : undefined}
                  width="100%"
                  height="400px"
                  modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
                  onClick={handleMapClickForLocation}
                >
                  {/* Маркер точки встречи */}
                  <Placemark
                    geometry={coordinates}
                    options={{
                      preset: 'islands#greenCircleDotIcon',
                    }}
                    properties={{
                      hintContent: 'Точка встречи',
                      balloonContent: resolvedAddress || meeting.location.address,
                    }}
                  />

                  {/* Маркеры других участников */}
                  {otherParticipantsWithLocation.map(participant => (
                    <Placemark
                      key={participant.id}
                      geometry={[participant.latitude!, participant.longitude!]}
                      options={{
                        preset: 'islands#circleDotIcon',
                        iconColor: participant.color,
                      }}
                      properties={{
                        hintContent: participant.displayName,
                        balloonContent: participant.displayName,
                      }}
                    />
                  ))}

                  {/* Маркер текущего пользователя — перетаскиваемый */}
                  {myLocation && currentParticipant && (
                    <Placemark
                      geometry={[myLocation.lat, myLocation.lng]}
                      options={{
                        preset: 'islands#circleDotIcon',
                        iconColor: currentParticipant.color,
                        draggable: true,
                      }}
                      properties={{
                        hintContent: `${currentParticipant.displayName} (вы) — перетащите для изменения`,
                        balloonContent: `${currentParticipant.displayName} (вы)`,
                      }}
                      onDragEnd={(e: any) => {
                        const newCoords = e.get('target').geometry.getCoordinates();
                        setMyLocation({ lat: newCoords[0], lng: newCoords[1] });
                        setLocationMode('manual');
                        setLocationSource('manual');
                        sendLocation(newCoords[0], newCoords[1]);
                      }}
                    />
                  )}

                  <ZoomControl options={{ float: 'right' }} />
                </Map>
              </YMaps>
            </div>
            {(otherParticipantsWithLocation.length > 0 || myLocation) && (
              <div className="map-legend">
                <span className="legend-item">
                  <span className="legend-dot legend-dot--meeting"></span>
                  Точка встречи
                </span>
                {myLocation && currentParticipant && (
                  <span className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: currentParticipant.color }}
                    ></span>
                    {currentParticipant.displayName} (вы)
                  </span>
                )}
                {otherParticipantsWithLocation.map(p => (
                  <span key={p.id} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: p.color }}
                    ></span>
                    {p.displayName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Блок управления геолокацией */}
          {currentParticipantId && (
            <div className="location-control">
              <div className="location-status">
                <span className="location-status-icon">
                  {locationSource === 'gps' && '\u{1F4E1}'}
                  {locationSource === 'ip' && '\u{1F310}'}
                  {locationSource === 'manual' && '\u{1F4CC}'}
                  {locationSource === 'none' && '\u2753'}
                </span>
                <span className="location-status-text">
                  {locationSource === 'gps' && 'Местоположение по GPS'}
                  {locationSource === 'ip' && 'Примерное местоположение по IP'}
                  {locationSource === 'manual' && 'Местоположение указано вручную'}
                  {locationSource === 'none' && 'Местоположение не определено'}
                </span>
              </div>

              {showManualPrompt && (
                <div className="location-manual-prompt">
                  Нажмите на карту, чтобы указать своё местоположение
                </div>
              )}

              {locationSource === 'ip' && (
                <div className="location-ip-hint">
                  Местоположение определено приблизительно. Нажмите на карту или перетащите маркер для уточнения.
                </div>
              )}

              {locationMode === 'manual' && locationSource !== 'none' && (
                <button
                  className="location-auto-button"
                  onClick={() => {
                    setLocationMode('auto');
                    setShowManualPrompt(false);
                  }}
                >
                  Вернуть автоопределение
                </button>
              )}
            </div>
          )}

          <ParticipantsList
            participants={participants}
            currentParticipantId={currentParticipantId}
            meetingLocation={meeting.location}
            onLeave={handleLeave}
            participantEtas={participantEtas}
          />

          <div className="share-section">
            <h3>Поделиться встречей</h3>
            <p className="share-text">
              Отправьте эту ссылку и PIN-код участникам встречи:
            </p>
            <div className="share-link">
              <input
                type="text"
                value={window.location.href}
                readOnly
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Ссылка скопирована!');
                }}
                className="copy-button"
              >
                Копировать
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMeetingPage;
