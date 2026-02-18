/**
 * Утилиты для работы с cookie.
 * Используются для хранения participantToken по каждой встрече.
 * Формат: tygde_{meetingId} = participantToken (GUID)
 */

const COOKIE_PREFIX = 'tygde_';
const COOKIE_MAX_AGE_DAYS = 30;

/**
 * Получить токен участника для конкретной встречи.
 */
export function getParticipantToken(meetingId: string): string | null {
  const name = `${COOKIE_PREFIX}${meetingId}=`;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name)) {
      return trimmed.substring(name.length);
    }
  }
  return null;
}

/**
 * Сохранить токен участника для конкретной встречи.
 */
export function setParticipantToken(meetingId: string, token: string): void {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_PREFIX}${meetingId}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Удалить токен участника для конкретной встречи.
 */
export function removeParticipantToken(meetingId: string): void {
  document.cookie = `${COOKIE_PREFIX}${meetingId}=; path=/; max-age=0; SameSite=Lax`;
}
