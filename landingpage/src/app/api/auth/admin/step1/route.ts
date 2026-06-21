import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing username/email or password' }, { status: 400 });
    }

    // Check if there are any users in the DB with an ADMIN role (case-insensitive)
    const adminCount = await prisma.user.count({
      where: {
        role: {
          mode: 'insensitive',
          equals: 'admin'
        }
      }
    });

    let user;

    if (adminCount === 0) {
      // If no admin exists in the database, this first user becomes the default admin
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN'
        }
      });
      console.log('Created default admin user:', email);
    } else {
      // Admin exists, fetch the user with the entered email
      user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
      }

      // Ensure their role is indeed ADMIN
      if (user.role?.toUpperCase() !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Access restricted to administrators.' }, { status: 403 });
      }

      // Check if their password is a placeholder (i.e. registered via Google and has a plain random string)
      // Standard bcrypt hashes start with '$2a$' or '$2b$'
      const isPlaceholderPassword = !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$');

      if (isPlaceholderPassword) {
        // First credentials login for a Google-registered admin: set their password
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log('Set password for Google-registered admin:', email);
      } else {
        // Compare password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
        }
      }
    }

    // Credentials verified! Sign a short-lived token (10 minutes) for Step 1
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
    const step1Token = await new SignJWT({ email: user.email, step1: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10m')
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set('admin_step1_token', step1Token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60, // 10 minutes
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Step 1 Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
