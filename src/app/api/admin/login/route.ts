import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    // For now, use hardcoded admin credentials
    // TODO: Implement proper admin user table with hashed passwords
    if (email === 'admin' && password === 'admin@123') {
      return NextResponse.json({
        success: true,
        data: {
          id: 'admin-1',
          email: 'admin',
          role: 'ADMIN',
        },
      });
    }

    // Optional: Try to find admin user in User table with ADMIN role
    // This requires the user to exist in the database with proper role
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, active: true },
      });

      if (!user || user.role !== 'ADMIN' || !user.active) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials or insufficient permissions' },
          { status: 401 }
        );
      }

      // In production, verify hashed password here
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (_dbError) {
      // Fall back to hardcoded credentials if database lookup fails
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
