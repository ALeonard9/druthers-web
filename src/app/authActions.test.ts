import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshAuthState } from './authActions';

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock('next/cache', () => ({ refresh: mocks.refresh }));

describe('refreshAuthState', () => {
  beforeEach(() => mocks.refresh.mockReset());

  it('refreshes the client router after an auth route writes cookies', async () => {
    await refreshAuthState();

    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
