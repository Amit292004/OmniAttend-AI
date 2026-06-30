import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    const redirectDest = state === 'admin' ? '/admin' : '/';
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${redirectDest}?error=${error}`);
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token error:', tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?error=google_auth_failed`);
    }

    // 2. Fetch user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error('Profile error:', profileData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?error=google_profile_failed`);
    }

    const email = profileData.email;
    const firstName = profileData.given_name || null;
    const lastName = profileData.family_name || null;

    if (state === 'admin') {
      const cookieStore = await cookies();
      const step1Token = cookieStore.get('admin_step1_token')?.value;

      if (!step1Token) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?error=credentials_expired`);
      }

      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
      let step1Payload;
      try {
        const verified = await jose.jwtVerify(step1Token, secret);
        step1Payload = verified.payload;
      } catch (err) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?error=credentials_expired`);
      }

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.role?.toUpperCase() !== 'ADMIN') {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?error=not_an_admin`);
      }

      // If the Google email doesn't match the Step 1 username/email, ensure both are registered admins
      const step1Email = step1Payload.email as string;
      if (step1Email !== email) {
        const step1User = await prisma.user.findUnique({ where: { email: step1Email } });
        if (!step1User || step1User.role?.toUpperCase() !== 'ADMIN') {
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?error=email_mismatch`);
        }
      }

      const adminSessionToken = await new jose.SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1d')
        .sign(secret);

      cookieStore.set('omniattend_admin_session', adminSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      cookieStore.delete('admin_step1_token');

      const sessionToken = await new jose.SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);

      cookieStore.set('omniattend_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`);
    }

    // 3. Find or create user in Prisma
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Check if this is the first user
      const userCount = await prisma.user.count();
      const finalRole = userCount === 0 ? 'ADMIN' : null;

      // Create new user (generate random password since it's required in schema, but not used for OAuth login)
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
          role: finalRole, // role is null for standard users so we can prompt them, ADMIN for the first user
        },
      });
    }

    // 4. Create session token (reusing the same logic from verify-otp)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
    const sessionToken = await new jose.SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // 5. Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('omniattend_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // 6. Redirect to homepage
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/`);

  } catch (err) {
    console.error('OAuth processing error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?error=internal_server_error`);
  }
}
