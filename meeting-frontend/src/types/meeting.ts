export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Participant {
  id: string;
  displayName: string;
  color: string;
  latitude?: number;
  longitude?: number;
  joinedAt: string;
  isActive: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  dateTime: string;
  location: Location;
  createdAt: string;
}

export interface MeetingFull extends Meeting {
  participants: Participant[];
}

export interface MeetingPreview {
  id: string;
  title: string;
  dateTime: string;
  participantCount: number;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  dateTime: string;
  location: Location;
  pin: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateMeetingResponse {
  meeting: MeetingFull;
  participant: Participant;
  token: string;
}

export interface JoinMeetingRequest {
  pin: string;
  latitude?: number;
  longitude?: number;
}

export interface JoinMeetingResponse {
  participant: Participant;
  meeting: MeetingFull;
  token: string;
}

export interface VerifyTokenResponse {
  participant: Participant;
  meeting: MeetingFull;
}

export type LocationMode = 'auto' | 'manual';
export type LocationSource = 'gps' | 'ip' | 'manual' | 'none';

export interface ParticipantEta {
  durationMinutes: number;
  distanceKm: number;
}
