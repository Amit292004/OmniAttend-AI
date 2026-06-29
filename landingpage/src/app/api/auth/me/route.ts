import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Allow portal (port 3001) to call this endpoint with credentials for SSO
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:3001',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('omniattend_session')?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { headers: CORS_HEADERS });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
    
    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (err) {
      // Invalid or expired token
      return NextResponse.json({ user: null }, { headers: CORS_HEADERS });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true }
    });

    return NextResponse.json({ user }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null }, { headers: CORS_HEADERS });
  }
}
