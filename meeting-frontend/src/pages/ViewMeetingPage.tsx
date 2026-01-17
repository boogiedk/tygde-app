import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { YMaps, Map, Placemark, ZoomControl } from 'react-yandex-maps';
import { Meeting } from '../types/meeting';
import { API_ENDPOINTS, YANDEX_MAPS_API_KEY } from '../config/api';
import './ViewMeetingPage.css';

const ViewMeetingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMeeting = async () => {
      if (!id) return;

      try {
        const response = await fetch(API_ENDPOINTS.GET_MEETING(id));

        if (!response.ok) {
          throw new Error('Встреча не найдена');
        }

        const data = await response.json();
        setMeeting(data);
      } catch (err: any) {
        setError(err.message || 'Ошибка при загрузке встречи');
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [id]);

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

    const { latitude, longitude } = meeting.location;

    // Получаем текущую геопозицию пользователя
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Успешно получили координаты
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          // Открываем Яндекс.Карты с маршрутом от текущей позиции до точки встречи
          const url = `https://yandex.ru/maps/?rtext=${userLat},${userLon}~${latitude},${longitude}&rtt=auto`;
          window.open(url, '_blank');
        },
        (error) => {
          // Ошибка получения геопозиции (пользователь отклонил или недоступно)
          console.error('Ошибка получения геопозиции:', error);
          // Открываем без точки старта (Яндекс попросит разрешение сам)
          const url = `https://yandex.ru/maps/?rtext=~${latitude},${longitude}&rtt=auto`;
          window.open(url, '_blank');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Geolocation API не поддерживается
      const url = `https://yandex.ru/maps/?rtext=~${latitude},${longitude}&rtt=auto`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="view-meeting-page">
        <div className="container">
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
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
              Отправьте эту ссылку участникам встречи:
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
