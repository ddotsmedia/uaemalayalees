import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, otp } = body;

    if (!email || !phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Verify OTP against Redis cache
    // For now, create/update user if OTP is valid
    if (otp !== '000000') {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP' },
        { status: 401 }
      );
    }

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

    // TODO: Create session via Auth.js
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
