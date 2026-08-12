/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from './page';

const mocks = vi.hoisted(() => ({ getSessionUser: vi.fn() }));

vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock('@/components/ApiKeysManager', () => ({ ApiKeysManager: () => null }));
vi.mock('@/components/PrivacySettings', () => ({ PrivacySettings: () => null }));
vi.mock('@/components/SoundPicker', () => ({ SoundPicker: () => null }));
vi.mock('@/components/TimeZonePicker', () => ({ TimeZonePicker: () => null }));
vi.mock('@/components/ShelfManager', () => ({ ShelfManager: () => null }));

describe('settings page', () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({ user_id: 'viewer', email: 'viewer@example.com' });
  });

  afterEach(cleanup);

  it('links the sharing settings to follower tracking', async () => {
    render(await SettingsPage());

    expect(screen.getByRole('link', { name: 'Track your followers' }).getAttribute('href')).toBe('/followers');
  });
});
