import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('omniattend_admin_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
    
    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify current admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { role: true }
    });

    if (!adminUser || adminUser.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Remove password hashes for security before returning
    const safeUsers = users.map((u: any) => {
      const { password, ...safe } = u;
      return safe;
    });

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
