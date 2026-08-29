import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = params;
    const body = await request.json();
    const { approved, reviewerId } = body;

    if (approved === undefined || !reviewerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Add admin authentication check

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        approved,
        approvedBy: reviewerId,
        approvedAt: new Date(),
      },
      include: {
        author: {
          select: { personalProfile: { select: { name: true } } },
        },
      },
    });

    // Log compliance action
    await prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: approved ? 'approve_review' : 'reject_review',
        resource: 'review',
        resourceId: reviewId,
        changes: { approved, targetId: review.targetId },
      },
    });

    return NextResponse.json({
      success: true,
      message: approved ? 'Review approved' : 'Review rejected',
      data: updatedReview,
    });
  } catch (error) {
    console.error('Review approval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
