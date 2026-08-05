import { ApiError, apiFetch } from './api';
import type { UserComparison } from './types';

export async function fetchComparison(handle: string): Promise<UserComparison | null> {
  try {
    return await apiFetch<UserComparison>(
      `/v1/users/me/comparison/${encodeURIComponent(handle)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
