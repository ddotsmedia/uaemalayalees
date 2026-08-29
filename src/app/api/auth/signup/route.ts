import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isValidEmail, isValidPhone } from '@/lib/utils';
import { checkRateLimit, setWithExpiry } from '@/lib/redis';
import { OTP_EXPIRY_MINUTES, RATE_LIMIT_WINDOW } from '@/lib/constants';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone } = body;
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limit: 1 signup per IP per 5 sec, max 10 per 24h
    const signupLimitKey = `signup:${ip}`;
    const signupLimitExceeded = !(await checkRateLimit(signupLimitKey, 10, 86400));

    if (signupLimitExceeded) {
      return NextResponse.json(
        { success: false, error: 'Too many signup attempts. Try again later.' },
        { status: 429 }
      );
    }

    // Validate inputs
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email or phone' },
        { status: 409 }
      );
    }

    // Generate and store OTP
    const otp = generateOTP();
    const otpKey = `otp:${email}:${phone}`;
    await setWithExpiry(otpKey, otp, OTP_EXPIRY_MINUTES * 60);

    // TODO: Send OTP via Resend (email) and Twilio (phone)
    // For now, log OTP (development only - remove in production)
    console.log(`[DEV] OTP for ${email}/${phone}: ${otp}`);

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent to email and phone',
        data: { email, phone },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
