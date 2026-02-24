import React from 'react';
import { Participant, Location, ParticipantEta } from '../types/meeting';
import { openRouteFromTo } from '../utils/maps';
import './ParticipantsList.css';

interface ParticipantsListProps {
  participants: Participant[];
  currentParticipantId: string | null;
  meetingLocation: Location;
  onLeave: () => void;
  participantEtas?: Record<string, ParticipantEta>;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  currentParticipantId,
  meetingLocation,
  onLeave,
  participantEtas = {},
}) => {
  const activeParticipants = participants.filter(p => p.isActive);

  const handleLocationClick = (participant: Participant) => {
    if (participant.latitude != null && participant.longitude != null) {
      openRouteFromTo(
        participant.latitude,
        participant.longitude,
        meetingLocation.latitude,
        meetingLocation.longitude
      );
    }
  };

  return (
    <div className="participants-section">
      <div className="participants-header">
        <h3 className="participants-title">Участники</h3>
        <span className="participants-count">
          {activeParticipants.length}
        </span>
      </div>

      <ul className="participants-list">
        {activeParticipants.map(participant => {
          const isYou = participant.id === currentParticipantId;
          const hasLocation = participant.latitude != null && participant.longitude != null;

          const eta = participantEtas[participant.id];

          return (
            <li key={participant.id} className="participant-item">
              <div
                className="participant-color"
                style={{ backgroundColor: participant.color }}
              />
              <div className="participant-info">
                <div className="participant-name">
                  {participant.displayName}
                </div>
                <div className={`participant-status ${isYou ? 'is-you' : ''}`}>
                  {isYou ? 'Это вы' : ''}
                </div>
                {eta && (
                  <div className="participant-eta">
                    ~{eta.durationMinutes} мин ({eta.distanceKm} км)
                  </div>
                )}
              </div>
              <button
                className="participant-location-button"
                onClick={() => handleLocationClick(participant)}
                disabled={!hasLocation}
                title={hasLocation ? 'Открыть на карте' : 'Местоположение недоступно'}
              >
                📍 Где?
              </button>
            </li>
          );
        })}
      </ul>

      {currentParticipantId && (
        <button className="leave-button" onClick={onLeave}>
          Покинуть встречу
        </button>
      )}
    </div>
  );
};

export default ParticipantsList;
