import { redirect } from 'next/navigation';

// Sound settings moved into /settings — keep old links working.
export default function SoundsPage() {
  redirect('/settings');
}
