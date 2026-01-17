export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  dateTime: string;
  location: Location;
  createdAt: string;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  dateTime: string;
  location: Location;
}
