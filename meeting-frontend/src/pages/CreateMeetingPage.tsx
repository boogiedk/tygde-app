import React, { useState } from 'react';
import { YMaps, Map, Placemark, GeolocationControl, ZoomControl } from 'react-yandex-maps';
import { useNavigate, Link } from 'react-router-dom';
import { CreateMeetingRequest } from '../types/meeting';
import { API_ENDPOINTS, YANDEX_MAPS_API_KEY } from '../config/api';
import './CreateMeetingPage.css';

const CreateMeetingPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
  });
  const [coordinates, setCoordinates] = useState<[number, number]>([55.751244, 37.618423]);
  const [address, setAddress] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapInstance, setMapInstance] = useState<any>(null);

  const handleMapClick = async (e: any) => {
    const coords = e.get('coords');
    setCoordinates(coords);

    // Используем глобальный объект ymaps
    if (window.ymaps) {
      try {
        const geoObjects = await window.ymaps.geocode(coords);
        const firstGeoObject = geoObjects.geoObjects.get(0);
        const newAddress = firstGeoObject.getAddressLine();
        setAddress(newAddress);
      } catch (err) {
        console.error('Ошибка геокодирования:', err);
        setAddress('Адрес не определен');
      }
    } else {
      // Если геокодирование недоступно, просто показываем координаты
      setAddress(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
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

    setLoading(true);

    try {
      const request: CreateMeetingRequest = {
        title: formData.title,
        description: formData.description || undefined,
        dateTime: new Date(formData.dateTime).toISOString(),
        location: {
          latitude: coordinates[0],
          longitude: coordinates[1],
          address: address,
        },
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

      const meeting = await response.json();
      navigate(`/meeting/${meeting.id}`);
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
              <YMaps query={{ apikey: YANDEX_MAPS_API_KEY, lang: 'ru_RU' }}>
                <Map
                  state={{ center: coordinates, zoom: 12 }}
                  width="100%"
                  height="300px"
                  onClick={handleMapClick}
                  instanceRef={(ref) => setMapInstance(ref)}
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
