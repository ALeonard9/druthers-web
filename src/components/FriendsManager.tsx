'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Follow, Friend, FriendRequest, PendingFriendRequests, RelatedUser } from '@/lib/types';

function displayName(user: RelatedUser): string {
  return user.display_name || user.handle || 'that user';
}

async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(path);
  return res.ok ? ((await res.json()) as T) : null;
}

async function callJson(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

// #120: send/accept/decline/cancel/unfriend, plus the read-only follow
// lists. Friends and follows are rendered as visibly separate sections -
// blurring them would let someone misjudge who can see their friends-only
// shelves.
export function FriendsManager() {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [requests, setRequests] = useState<PendingFriendRequests | null>(null);
  const [following, setFollowing] = useState<Follow[] | null>(null);
  const [followers, setFollowers] = useState<Follow[] | null>(null);

  const [handle, setHandle] = useState('');
  const [sendBusy, setSendBusy] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmUnfriend, setConfirmUnfriend] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const refreshFriends = useCallback(async () => {
    setFriends((await getJson<Friend[]>('/api/friends')) ?? []);
  }, []);
  const refreshRequests = useCallback(async () => {
    setRequests(
      (await getJson<PendingFriendRequests>('/api/friends/requests')) ?? {
        incoming: [],
        outgoing: [],
      },
    );
  }, []);
  const refreshFollows = useCallback(async () => {
    setFollowing((await getJson<Follow[]>('/api/follows/following')) ?? []);
    setFollowers((await getJson<Follow[]>('/api/follows/followers')) ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getJson<Friend[]>('/api/friends'),
      getJson<PendingFriendRequests>('/api/friends/requests'),
      getJson<Follow[]>('/api/follows/following'),
      getJson<Follow[]>('/api/follows/followers'),
    ]).then(([f, r, fo, fw]) => {
      if (cancelled) return;
      setFriends(f ?? []);
      setRequests(r ?? { incoming: [], outgoing: [] });
      setFollowing(fo ?? []);
      setFollowers(fw ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendRequest(e: FormEvent) {
    e.preventDefault();
    const target = handle.trim();
    if (!target) return;
    setSendBusy(true);
    setSendError(null);
    setSendMessage(null);
    try {
      const { ok, data } = await callJson('/api/friends/requests', 'POST', {
        handle: target,
      });
      if (!ok) {
        setSendError(data.error ?? 'Could not send that request.');
        return;
      }
      setSendMessage(data.message ?? 'Friend request sent');
      setHandle('');
      await refreshRequests();
    } finally {
      setSendBusy(false);
    }
  }

  async function accept(req: FriendRequest) {
    setBusyId(req.id);
    setListError(null);
    try {
      const { ok, data } = await callJson(
        `/api/friends/requests/${req.id}/accept`,
        'PUT',
      );
      if (!ok) {
        setListError(data.error ?? 'Could not accept that request.');
        return;
      }
      await Promise.all([refreshFriends(), refreshRequests()]);
    } finally {
      setBusyId(null);
    }
  }

  async function decline(req: FriendRequest) {
    setBusyId(req.id);
    setListError(null);
    try {
      const { ok, data } = await callJson(
        `/api/friends/requests/${req.id}/decline`,
        'PUT',
      );
      if (!ok) {
        setListError(data.error ?? 'Could not decline that request.');
        return;
      }
      await refreshRequests();
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(req: FriendRequest) {
    setBusyId(req.id);
    setListError(null);
    try {
      const { ok, data } = await callJson(
        `/api/friends/requests/${req.id}`,
        'DELETE',
      );
      if (!ok) {
        setListError(data.error ?? 'Could not cancel that request.');
        return;
      }
      await refreshRequests();
    } finally {
      setBusyId(null);
    }
  }

  async function unfriend(friend: Friend) {
    setBusyId(friend.id);
    setConfirmUnfriend(null);
    setListError(null);
    try {
      const { ok, data } = await callJson(`/api/friends/${friend.id}`, 'DELETE');
      if (!ok) {
        setListError(data.error ?? 'Could not unfriend.');
        return;
      }
      await refreshFriends();
    } finally {
      setBusyId(null);
    }
  }

  async function unfollow(follow: Follow) {
    setBusyId(follow.id);
    setListError(null);
    try {
      const { ok, data } = await callJson(
        `/api/follows/${follow.user.handle}`,
        'DELETE',
      );
      if (!ok) {
        setListError(data.error ?? 'Could not unfollow.');
        return;
      }
      await refreshFollows();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <form onSubmit={sendRequest} className="flex gap-2">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="their-handle"
            maxLength={30}
            className="flex-1 rounded border border-neutral-700 bg-panel px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:border-brass"
          />
          <button
            type="submit"
            disabled={sendBusy || !handle.trim()}
            className="shrink-0 rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
          >
            Send request
          </button>
        </form>
        {sendMessage && <p className="text-xs text-moss">{sendMessage}</p>}
        {sendError && <p className="text-xs text-red-400">{sendError}</p>}
      </div>

      {listError && <p className="text-xs text-red-400">{listError}</p>}

      {requests && (requests.incoming.length > 0 || requests.outgoing.length > 0) && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-neutral-200">Requests</h3>
          {requests.incoming.length > 0 && (
            <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
              {requests.incoming.map((req) => (
                <li key={req.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm text-paper">
                    {req.user.handle ? (
                      <Link href={`/u/${req.user.handle}`} className="hover:text-brass font-medium">
                        {displayName(req.user)}
                      </Link>
                    ) : (
                      displayName(req.user)
                    )}
                    <span className="ml-2 text-xs text-neutral-500">wants to be friends</span>
                  </span>
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    onClick={() => void decline(req)}
                    className="shrink-0 rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    onClick={() => void accept(req)}
                    className="shrink-0 rounded bg-brass px-2.5 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
                  >
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          )}
          {requests.outgoing.length > 0 && (
            <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
              {requests.outgoing.map((req) => (
                <li key={req.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-300">
                    {req.user.handle ? (
                      <Link href={`/u/${req.user.handle}`} className="hover:text-brass font-medium">
                        {displayName(req.user)}
                      </Link>
                    ) : (
                      displayName(req.user)
                    )}
                    <span className="ml-2 text-xs text-neutral-500">request sent - waiting</span>
                  </span>
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    onClick={() => void cancel(req)}
                    className="shrink-0 rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-neutral-200">Friends</h3>
        <p className="text-xs text-neutral-500">
          Mutual - you both accepted. Friends see anything you&apos;ve set to
          the Friends tier.
        </p>
        {friends === null ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : friends.length === 0 ? (
          <p className="text-sm text-neutral-500">No friends yet - send a request above.</p>
        ) : (
          <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
            {friends.map((friend) => (
              <li key={friend.id} className="px-4 py-2.5">
                {confirmUnfriend === friend.id ? (
                  <div className="flex items-center gap-2 rounded bg-red-950/70 px-2 py-1.5 text-xs text-red-200 ring-1 ring-red-800">
                    <span className="flex-1">
                      Unfriend {displayName(friend.user)}? They&apos;ll lose
                      access to anything set to Friends.
                    </span>
                    <button
                      onClick={() => setConfirmUnfriend(null)}
                      className="rounded px-2 py-0.5 text-neutral-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void unfriend(friend)}
                      disabled={busyId === friend.id}
                      className="rounded bg-red-600 px-2 py-0.5 font-medium text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      Unfriend
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm text-paper">
                      {friend.user.handle ? (
                        <Link href={`/u/${friend.user.handle}`} className="hover:text-brass font-medium">
                          {displayName(friend.user)}
                        </Link>
                      ) : (
                        displayName(friend.user)
                      )}
                    </span>
                    {friend.user.handle && (
                      <Link
                        href={`/u/${friend.user.handle}/compare`}
                        className="shrink-0 rounded border border-line px-2 py-1 text-xs text-neutral-300 hover:border-brass hover:text-brass"
                      >
                        Compare
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmUnfriend(friend.id)}
                      className="shrink-0 rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400"
                    >
                      Unfriend
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-neutral-200">Following</h3>
        <p className="text-xs text-neutral-500">
          One-way, no approval needed - but only for public profiles, and it
          doesn&apos;t unlock anything private. Follow from someone&apos;s
          profile page.
        </p>
        {following === null ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : following.length === 0 ? (
          <p className="text-sm text-neutral-500">Not following anyone yet.</p>
        ) : (
          <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
            {following.map((follow) => (
              <li key={follow.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm text-paper">
                  {follow.user.handle ? (
                    <Link href={`/u/${follow.user.handle}`} className="hover:text-brass font-medium">
                      {displayName(follow.user)}
                    </Link>
                  ) : (
                    displayName(follow.user)
                  )}
                </span>
                {follow.user.handle && (
                  <Link
                    href={`/u/${follow.user.handle}/compare`}
                    className="shrink-0 rounded border border-line px-2 py-1 text-xs text-neutral-300 hover:border-brass hover:text-brass"
                  >
                    Compare
                  </Link>
                )}
                <button
                  type="button"
                  disabled={busyId === follow.id}
                  onClick={() => void unfollow(follow)}
                  className="shrink-0 rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
                >
                  Unfollow
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-neutral-200">Followers</h3>
        <p className="text-xs text-neutral-500">
          People following your public profile. They see only what&apos;s
          public - following grants nothing extra.
        </p>
        {followers === null ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : followers.length === 0 ? (
          <p className="text-sm text-neutral-500">No followers yet.</p>
        ) : (
          <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
            {followers.map((follow) => (
              <li key={follow.id} className="px-4 py-2.5 text-sm text-paper">
                {follow.user.handle ? (
                  <Link href={`/u/${follow.user.handle}`} className="hover:text-brass font-medium">
                    {displayName(follow.user)}
                  </Link>
                ) : (
                  displayName(follow.user)
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
