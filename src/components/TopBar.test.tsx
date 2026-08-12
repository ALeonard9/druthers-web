import { describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';

const mocks = vi.hoisted(() => ({ getViewerTimeZone: vi.fn() }));

vi.mock('@/lib/viewerTimeZone', () => ({ getViewerTimeZone: mocks.getViewerTimeZone }));

describe('TopBar', () => {
  it('builds the interactive header without waiting for the preference API', () => {
    const header = TopBar({
      user: { user_id: 'viewer', email: 'viewer@example.com', user_group: 'user' },
    });

    expect(header.type).toBe('header');
    expect(mocks.getViewerTimeZone).not.toHaveBeenCalled();
  });
});
