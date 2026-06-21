import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as jose from 'jose';

async function getUserFromRequest() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('omniattend_session')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
    const { payload } = await jose.jwtVerify(token, secret);
    
    if (!payload.userId) return null;
    return payload.userId as string;
  } catch (err) {
    return null;
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserFromRequest();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, role } = await request.json();

    if (!phone || !role) {
      return NextResponse.json({ error: 'Phone and role are required' }, { status: 400 });
    }

    const normalizedRole = role?.toLowerCase() === 'admin' ? 'ADMIN' : role;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        role: normalizedRole
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
