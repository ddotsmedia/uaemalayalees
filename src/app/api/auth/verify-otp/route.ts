import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { get, delete_key, checkRateLimit } from '@/lib/redis';
import { OTP_MAX_ATTEMPTS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, otp } = body;
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!email || !phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Rate limit: max 5 failed attempts per hour
    const attemptKey = `otp_attempts:${email}:${phone}`;
    const attemptExceeded = !(await checkRateLimit(attemptKey, OTP_MAX_ATTEMPTS, 3600));

    if (attemptExceeded) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // Verify OTP from Redis
    const storedOtp = await get(`otp:${email}:${phone}`);

    if (!storedOtp || storedOtp !== otp) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Clear OTP
    await delete_key(`otp:${email}:${phone}`);
    await delete_key(attemptKey);

    // Create or update user with verified email/phone
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        phoneVerified: true,
      },
      create: {
        email,
        phone,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    // TODO: Create session via Auth.js (set httpOnly cookie)
    return NextResponse.json(
      {
        success: true,
        message: 'Verified successfully',
        data: { userId: user.id, email: user.email },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
