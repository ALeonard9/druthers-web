import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, USER_COOKIE } from '@/lib/session';

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(USER_COOKIE);
  return NextResponse.json({ ok: true });
}
