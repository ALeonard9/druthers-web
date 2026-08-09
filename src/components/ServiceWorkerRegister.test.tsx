/** @vitest-environment happy-dom */
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceWorkerRegister } from './ServiceWorkerRegister';

describe('ServiceWorkerRegister', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('removes stale Druthers PWA state during local development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister }]);
    const register = vi.fn();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations, register },
    });
    const deleteCache = vi.fn().mockResolvedValue(true);
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        keys: vi.fn().mockResolvedValue(['druthers-shell-v2', 'unrelated-cache']),
        delete: deleteCache,
      },
    });

    render(<ServiceWorkerRegister />);

    await waitFor(() => expect(unregister).toHaveBeenCalled());
    expect(deleteCache).toHaveBeenCalledWith('druthers-shell-v2');
    expect(deleteCache).not.toHaveBeenCalledWith('unrelated-cache');
    expect(register).not.toHaveBeenCalled();
  });
});
