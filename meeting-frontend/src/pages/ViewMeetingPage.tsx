import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { YMaps, Map, Placemark, ZoomControl } from 'react-yandex-maps';
import { MeetingFull, MeetingPreview, Participant } from '../types/meeting';
import { API_ENDPOINTS, YANDEX_MAPS_API_KEY } from '../config/api';
import { getParticipantToken, setParticipantToken, removeParticipantToken } from '../utils/cookies';
import { openRouteToLocation } from '../utils/maps';
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
  const participantsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Обновление геолокации
  const updateLocation = useCallback(async () => {
    if (!id) return;
    const token = getParticipantToken(id);
    if (!token) return;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        });
      });

      await fetch(API_ENDPOINTS.UPDATE_LOCATION(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });
    } catch {
      // Геолокация недоступна — не критично
    }
  }, [id]);

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
  const startPolling = useCallback(() => {
    // Поллинг участников каждые 10 секунд
    if (participantsIntervalRef.current) clearInterval(participantsIntervalRef.current);
    participantsIntervalRef.current = setInterval(fetchParticipants, 10000);

    // Обновление геолокации при входе + каждые 30 секунд
    updateLocation();
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    locationIntervalRef.current = setInterval(updateLocation, 30000);
  }, [fetchParticipants, updateLocation]);

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

  // Запуск поллинга когда вошли на встречу
  useEffect(() => {
    if (pageState === 'meeting') {
      startPolling();
    }
  }, [pageState, startPolling]);

  // Вход по PIN
  const handlePinSubmit = async (pin: string) => {
    if (!id) return;
    setPinLoading(true);
    setPinError(null);

    try {
      // Получаем геолокацию для входа
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch {
        // Не критично
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

  const handleBuildRoute = () => {
    if (!meeting) return;
    openRouteToLocation(meeting.location.latitude, meeting.location.longitude);
  };

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

  // Состояние: встреча
  if (!meeting) return null;

  const coordinates: [number, number] = [meeting.location.latitude, meeting.location.longitude];

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
              <span className="info-value">{meeting.location.address}</span>
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

          <ParticipantsList
            participants={participants}
            currentParticipantId={currentParticipantId}
            onLeave={handleLeave}
          />

          <div className="map-section">
            <h3>Место встречи</h3>
            <div className="map-container">
              <YMaps query={{ apikey: YANDEX_MAPS_API_KEY, lang: 'ru_RU' }}>
                <Map
                  defaultState={{ center: coordinates, zoom: 15 }}
                  width="100%"
                  height="400px"
                >
                  <Placemark
                    geometry={coordinates}
                    options={{
                      preset: 'islands#greenDotIcon',
                    }}
                  />
                  <ZoomControl options={{ float: 'right' }} />
                </Map>
              </YMaps>
            </div>
          </div>

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
