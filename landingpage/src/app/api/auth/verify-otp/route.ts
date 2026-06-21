import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, otp, token, password, firstName, lastName, phone, role } = await req.json();

    if (!email || !otp || !token || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the stateless OTP JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
    let payload;
    try {
      const { payload: jwtPayload } = await jwtVerify(token, secret);
      payload = jwtPayload;
    } catch (err) {
      return NextResponse.json({ error: 'OTP has expired or is invalid. Please request a new one.' }, { status: 400 });
    }

    // 2. Check if the email and OTP match the token's payload
    if (payload.email !== email || payload.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect OTP.' }, { status: 400 });
    }

    // 3. OTP is valid! Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400 });
    }

    // 3.5 Check if this is the first user
    const userCount = await prisma.user.count();
    const finalRole = userCount === 0 ? 'ADMIN' : role;

    // 4. Hash password and create user in Prisma DB
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: finalRole,
      },
    });

    // 5. Generate a session JWT cookie
    const sessionToken = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set('omniattend_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return NextResponse.json({ error: 'Internal server error during verification.' }, { status: 500 });
  }
}
