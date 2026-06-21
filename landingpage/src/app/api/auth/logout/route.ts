import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('omniattend_session');
  cookieStore.delete('omniattend_admin_session');
  return NextResponse.json({ success: true });
}
