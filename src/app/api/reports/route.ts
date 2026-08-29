import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reporterId, targetId, targetType, reason, message } = body;

    if (!reporterId || !targetId || !targetType || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if target exists
    if (targetType === 'profile') {
      const profile = await prisma.personalProfile.findUnique({
        where: { userId: targetId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        );
      }
    } else if (targetType === 'business') {
      const business = await prisma.businessPage.findUnique({
        where: { id: targetId },
      });
      if (!business) {
        return NextResponse.json(
          { success: false, error: 'Business not found' },
          { status: 404 }
        );
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        reason: reason as any,
        message: message || null,
        targetPersonalProfileId: targetType === 'profile' ? targetId : null,
        targetBusinessPageId: targetType === 'business' ? targetId : null,
      },
    });

    return NextResponse.json(
      { success: true, data: report },
      { status: 201 }
    );
  } catch (error) {
    console.error('Report creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, email: true },
        },
        targetPersonalProfile: {
          select: { userId: true, name: true, username: true },
        },
        targetBusinessPage: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
