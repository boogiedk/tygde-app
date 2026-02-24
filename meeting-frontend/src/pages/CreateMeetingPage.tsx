import React, { useState } from 'react';
import { YMaps, Map, Placemark, GeolocationControl, ZoomControl } from 'react-yandex-maps';
import { useNavigate, Link } from 'react-router-dom';
import { CreateMeetingRequest } from '../types/meeting';
import { API_ENDPOINTS, YANDEX_MAPS_API_KEY } from '../config/api';
import { setParticipantToken } from '../utils/cookies';
import './CreateMeetingPage.css';

const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const CreateMeetingPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    pin: generatePin(),
  });
  const [coordinates, setCoordinates] = useState<[number, number]>([55.751244, 37.618423]);
  const [address, setAddress] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ymapsRef = React.useRef<any>(null);

  const handleYmapsLoad = (ymaps: any) => {
    ymapsRef.current = ymaps;
  };

  const geocodeCoords = async (coords: [number, number]) => {
    const ymaps = ymapsRef.current;
    if (!ymaps) return;
    try {
      const geoObjects = await ymaps.geocode(coords);
      const firstGeoObject = geoObjects.geoObjects.get(0);
      if (firstGeoObject) {
        setAddress(firstGeoObject.getAddressLine());
      }
    } catch {
      setAddress('Адрес не определён');
    }
  };

  const handleMapClick = async (e: any) => {
    const coords = e.get('coords') as [number, number];
    setCoordinates(coords);

    if (ymapsRef.current) {
      await geocodeCoords(coords);
    } else {
      // ymaps ещё не загружен — показываем временный текст и ждём
      setAddress('Определяем адрес...');
      const interval = setInterval(async () => {
        if (ymapsRef.current) {
          clearInterval(interval);
          await geocodeCoords(coords);
        }
      }, 300);
      // Таймаут: если ymaps так и не загрузится за 5 секунд
      setTimeout(() => {
        clearInterval(interval);
        setAddress(prev => prev === 'Определяем адрес...' ? 'Адрес не определён' : prev);
      }, 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Введите название встречи');
      return;
    }

    if (!formData.dateTime) {
      setError('Укажите дату и время встречи');
      return;
    }

    if (!address) {
      setError('Выберите место на карте');
      return;
    }

    if (!acceptPolicy) {
      setError('Необходимо принять правила использования');
      return;
    }

    if (!formData.pin || !/^\d{4}$/.test(formData.pin)) {
      setError('PIN-код должен содержать ровно 4 цифры');
      return;
    }

    setLoading(true);

    try {
      // Получаем геолокацию создателя
      let creatorLat: number | undefined;
      let creatorLng: number | undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        creatorLat = position.coords.latitude;
        creatorLng = position.coords.longitude;
      } catch {
        // Геолокация недоступна — не критично
      }

      const request: CreateMeetingRequest = {
        title: formData.title,
        description: formData.description || undefined,
        dateTime: new Date(formData.dateTime).toISOString(),
        location: {
          latitude: coordinates[0],
          longitude: coordinates[1],
          address: address,
        },
        pin: formData.pin,
        latitude: creatorLat,
        longitude: creatorLng,
      };

      const response = await fetch(API_ENDPOINTS.CREATE_MEETING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании встречи');
      }

      const data = await response.json();
      // Сохраняем токен участника в cookie
      setParticipantToken(data.meeting.id, data.token);
      navigate(`/meeting/${data.meeting.id}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании встречи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-meeting-page">
      <div className="container">
        <h1>Создать новую встречу</h1>

        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label htmlFor="title">Название встречи *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Например: Встреча с друзьями"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Дополнительная информация о встрече"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateTime">Дата и время *</label>
            <input
              type="datetime-local"
              id="dateTime"
              value={formData.dateTime}
              onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Место встречи *</label>
            <div className="map-info">
              Кликните на карту, чтобы выбрать место встречи
            </div>
            <div className="map-container">
              <YMaps query={{ apikey: YANDEX_MAPS_API_KEY, lang: 'ru_RU', load: 'package.full' }} onLoad={handleYmapsLoad}>
                <Map
                  state={{ center: coordinates, zoom: 12 }}
                  width="100%"
                  height="300px"
                  onClick={handleMapClick}
                  modules={['geocode']}
                  options={{
                    suppressMapOpenBlock: true,
                  }}
                >
                  {address && <Placemark geometry={coordinates} />}
                  <GeolocationControl options={{ float: 'left' }} />
                  <ZoomControl options={{ float: 'right' }} />
                </Map>
              </YMaps>
            </div>
            {address && (
              <div className="selected-address">
                <strong>Выбранный адрес:</strong> {address}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pin">PIN-код для входа *</label>
            <div className="pin-field">
              <input
                type="text"
                id="pin"
                inputMode="numeric"
                maxLength={4}
                value={formData.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData({ ...formData, pin: value });
                }}
                placeholder="4 цифры"
                required
              />
              <button
                type="button"
                className="generate-pin-button"
                onClick={() => setFormData({ ...formData, pin: generatePin() })}
                title="Сгенерировать новый PIN"
              >
                🎲
              </button>
            </div>
            <div className="pin-hint">
              Этот PIN-код понадобится участникам для входа на встречу
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={acceptPolicy}
                onChange={(e) => setAcceptPolicy(e.target.checked)}
                required
              />
              <span>
                Я принимаю <Link to="/terms" className="terms-link">правила использования</Link> сервиса
              </span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Создание...' : 'Создать встречу'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingPage;
