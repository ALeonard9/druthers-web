import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deviceTimeZone } from './deviceTimeZone';
import { fillDeviceTimeZoneIfUnset } from './deviceTimeZoneDetection';

vi.mock('./deviceTimeZone', () => ({ deviceTimeZone: vi.fn() }));

describe('fillDeviceTimeZoneIfUnset', () => {
  beforeEach(() => {
    vi.mocked(deviceTimeZone).mockReset().mockReturnValue('America/Los_Angeles');
    vi.unstubAllGlobals();
  });

  it('detects and saves the browser zone when the account has none', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal('fetch', fetchMock);

    await fillDeviceTimeZoneIfUnset(null);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time_zone: 'America/Los_Angeles' }),
    });
  });

  it('does not detect or overwrite a zone the account already chose', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await fillDeviceTimeZoneIfUnset('America/New_York');

    expect(deviceTimeZone).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not reject the completed sign-in when the API rejects the detected zone', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: 'Unknown zone' }, { status: 422 })),
    );

    await expect(fillDeviceTimeZoneIfUnset(null)).resolves.toBeUndefined();
  });
});
