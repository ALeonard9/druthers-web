import { FALLBACK_TIME_ZONE } from './viewerTime';

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE;
}
