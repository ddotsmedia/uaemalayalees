import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// TODO: Add authentication middleware

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = params;
    const body = await request.json();
    const { status, action } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Missing status' },
        { status: 400 }
      );
    }

    // Get report
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Update report
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as any,
        actionTakenAt: status === 'ACTIONED' ? new Date() : undefined,
      },
    });

    // Take action if specified
    if (action === 'suspend' && report.targetPersonalProfileId) {
      await prisma.personalProfile.update({
        where: { userId: report.targetPersonalProfileId },
        data: { active: false },
      });
    } else if (action === 'suspend' && report.targetBusinessPageId) {
      await prisma.businessPage.update({
        where: { id: report.targetBusinessPageId },
        data: { active: false },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedReport,
    });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
