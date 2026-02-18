const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const API_ENDPOINTS = {
  CREATE_MEETING: `${API_BASE_URL}/api/meetings`,
  GET_MEETING: (id: string) => `${API_BASE_URL}/api/meetings/${id}`,
  MEETING_PREVIEW: (id: string) => `${API_BASE_URL}/api/meetings/${id}/preview`,
  JOIN_MEETING: (id: string) => `${API_BASE_URL}/api/meetings/${id}/join`,
  VERIFY_TOKEN: (id: string) => `${API_BASE_URL}/api/meetings/${id}/verify`,
  PARTICIPANTS: (id: string) => `${API_BASE_URL}/api/meetings/${id}/participants`,
  UPDATE_LOCATION: (id: string) => `${API_BASE_URL}/api/meetings/${id}/participants/location`,
  LEAVE_MEETING: (id: string) => `${API_BASE_URL}/api/meetings/${id}/leave`,
};

export const YANDEX_MAPS_API_KEY = process.env.REACT_APP_YANDEX_MAPS_KEY || '';
