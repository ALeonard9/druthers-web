/** @vitest-environment happy-dom */
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRankedListLength } from './rankedListLength';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('useRankedListLength hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
  });

  it('fetches server preference and updates state & localStorage', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ranked_list_length: '100' }),
    });

    const { result } = renderHook(() => useRankedListLength());

    await waitFor(() => {
      expect(result.current[0]).toBe('100');
    });
    expect(window.localStorage.getItem('druthers:ranked-list-length')).toBe('100');
  });

  it('updates preference via API and state on update call', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ranked_list_length: '25' }),
    });

    const { result } = renderHook(() => useRankedListLength());

    await waitFor(() => {
      expect(result.current[0]).toBe('25');
    });

    await act(async () => {
      result.current[1]('all');
    });

    expect(result.current[0]).toBe('all');
    expect(window.localStorage.getItem('druthers:ranked-list-length')).toBe('all');
  });
});
