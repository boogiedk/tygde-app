const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const API_ENDPOINTS = {
  CREATE_MEETING: `${API_BASE_URL}/api/meetings`,
  GET_MEETING: (id: string) => `${API_BASE_URL}/api/meetings/${id}`,
};

export const YANDEX_MAPS_API_KEY = process.env.REACT_APP_YANDEX_MAPS_KEY || '';
