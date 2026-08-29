import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// TODO: npm install jsonwebtoken
// import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-key';
const JWT_EXPIRY = '24h';
const REFRESH_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

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

    // Verify OTP (same as web login)
    // TODO: Check Redis for OTP validity
    const user = await prisma.user.findFirst({
      where: { email, phone, emailVerified: true, phoneVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials or unverified account' },
        { status: 401 }
      );
    }

    // TODO: In production, use real JWT signing
    // const token = jwt.sign(
    //   { userId: user.id, email: user.email },
    //   JWT_SECRET,
    //   { expiresIn: JWT_EXPIRY }
    // );

    // Mock JWT token
    const token = Buffer.from(
      JSON.stringify({ userId: user.id, iat: Date.now() })
    ).toString('base64');

    // Create refresh token (store in DB)
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRY * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken: token,
        refreshToken: refreshTokenRecord.token,
        user: {
          id: user.id,
          email: user.email,
          verified: user.emailVerified && user.phoneVerified,
        },
        expiresIn: JWT_EXPIRY,
      },
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
