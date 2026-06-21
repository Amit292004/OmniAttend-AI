import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { sendOTP } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Send email via Nodemailer
    await sendOTP(email, otp);

    // 3. Create a stateless JWT containing the OTP (valid for 10 minutes)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
    const token = await new SignJWT({ email, otp })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10m')
      .sign(secret);

    // Return the token to the client (client will send this back to verify)
    return NextResponse.json({ success: true, token });

  } catch (error) {
    console.error('Failed to send OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
