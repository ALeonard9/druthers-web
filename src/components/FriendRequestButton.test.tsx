/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FriendRequestButton } from './FriendRequestButton';

describe('FriendRequestButton', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders Add friend immediately with no fetch if initialReqId is missing', () => {
    render(<FriendRequestButton handle="john" />);
    expect(screen.getByRole('button', { name: 'Add friend' })).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders Request sent immediately with no fetch if initialReqId is provided', () => {
    render(<FriendRequestButton handle="john" initialReqId="req-123" />);
    expect(screen.getByRole('button', { name: 'Request sent' })).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a friend request and updates state', async () => {
    render(<FriendRequestButton handle="john" />);
    const button = screen.getByRole('button', { name: 'Add friend' });

    // 1. POST to send request
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Friend request sent' }), { status: 200 }));
    // 2. GET after POST to find the new request ID
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          incoming: [],
          outgoing: [{ id: 'req-2', user: { handle: 'john', display_name: 'John' }, requested_at: '2026-08-12T00:00:00Z' }],
        }),
        { status: 200 }
      )
    );

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Request sent' })).toBeDefined();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, postReq] = fetchMock.mock.calls[0];
    expect(postReq).toMatchObject({ method: 'POST' });
    expect(JSON.parse((postReq as RequestInit).body as string)).toEqual({ handle: 'john' });
  });

  it('cancels a friend request and updates state', async () => {
    render(<FriendRequestButton handle="john" initialReqId="req-1" />);
    const button = screen.getByRole('button', { name: 'Request sent' });

    // 1. DELETE to cancel
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Request cancelled' }), { status: 200 }));

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add friend' })).toBeDefined();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [deleteUrl, deleteReq] = fetchMock.mock.calls[0];
    expect(deleteUrl).toContain('/api/friends/requests/req-1');
    expect(deleteReq).toMatchObject({ method: 'DELETE' });
  });

  it('displays an error if the request fails', async () => {
    render(<FriendRequestButton handle="john" />);
    const button = screen.getByRole('button', { name: 'Add friend' });

    // 1. POST fails
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Already requested.' }), { status: 400 })
    );

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Already requested.')).toBeDefined();
    });
    expect(screen.getByRole('button', { name: 'Add friend' })).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
