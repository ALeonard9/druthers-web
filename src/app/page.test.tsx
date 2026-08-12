import { Suspense, type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: mocks.apiFetch,
}));
vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));

describe('home page critical path', () => {
  beforeEach(() => {
    mocks.apiFetch.mockReset();
    mocks.getSessionUser.mockResolvedValue({
      user_id: 'viewer',
      email: 'viewer@example.com',
      user_group: 'user',
    });
  });

  it('returns the signed-in shell within 50ms even when the primary request never resolves', async () => {
    mocks.apiFetch.mockImplementation(() => new Promise(() => {}));

    const page = (await Promise.race([
      HomePage(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('home shell was blocked by summary')), 50),
      ),
    ])) as ReactElement<{ children: ReactElement[] }>;
    const primaryBoundary = page.props.children[0] as ReactElement<{
      fallback: ReactElement<{ 'aria-label': string }>;
    }>;

    const renderFallback = primaryBoundary.props.fallback.type as () => ReactElement<{
      'aria-label': string;
    }>;
    const skeleton = renderFallback();
    expect(page.props.children).toHaveLength(3);
    expect(page.props.children.every((child) => child.type === Suspense)).toBe(true);
    expect(primaryBoundary.type).toBe(Suspense);
    expect(skeleton.props['aria-label']).toBe('Loading your home page');
    expect(mocks.apiFetch).toHaveBeenCalledOnce();
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/summary');
  });

  it('does not start signed-in API work for the public landing page', async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    const page = await HomePage();

    expect(page.type).not.toBe(Suspense);
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });
});
