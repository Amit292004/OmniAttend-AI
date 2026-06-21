import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('omniattend_session')?.value;
    if (!token) return NextResponse.json({ user: null });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
    
    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (err) {
      // Invalid or expired token
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null });
  }
}
