'use server';

import { refresh } from 'next/cache';

// Auth cookies are written by route handlers, outside the Server Component
// tree. Refresh through a Server Action so the shared root layout has merged
// its signed-in result before the caller continues with a soft navigation.
export async function refreshAuthState() {
  refresh();
}
