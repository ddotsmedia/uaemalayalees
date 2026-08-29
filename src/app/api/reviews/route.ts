import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MAX_REVIEW_LENGTH = 1000;
const MIN_RATING = 1;
const MAX_RATING = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetId, targetType, authorId, rating, content } = body;

    // Validate required fields
    if (!targetId || !targetType || !authorId || rating === undefined || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < MIN_RATING || rating > MAX_RATING) {
      return NextResponse.json(
        { success: false, error: `Rating must be between ${MIN_RATING} and ${MAX_RATING}` },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > MAX_REVIEW_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Review must be ${MAX_REVIEW_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Check if author is verified (both email and phone)
    const author = await prisma.user.findUnique({
      where: { id: authorId },
    });

    if (!author || !author.emailVerified || !author.phoneVerified) {
      return NextResponse.json(
        { success: false, error: 'Only verified users can write reviews' },
        { status: 403 }
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

    // Check if user already reviewed this target
    const existing = await prisma.review.findFirst({
      where: {
        targetId,
        targetType,
        authorId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this' },
        { status: 409 }
      );
    }

    // Create review (pending approval)
    const review = await prisma.review.create({
      data: {
        targetId,
        targetType,
        authorId,
        rating,
        content,
        approved: false, // Manual review required
      },
      include: {
        author: {
          include: {
            personalProfile: {
              select: { name: true, photoUrl: true, verified: true },
            },
          },
        },
      },
    });

    // Log for compliance
    await prisma.auditLog.create({
      data: {
        userId: authorId,
        action: 'create_review',
        resource: 'review',
        resourceId: review.id,
        changes: { targetId, targetType, rating, approved: false },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Review submitted for moderation',
        data: review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');
    const approved = searchParams.get('approved') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    if (!targetId || !targetType) {
      return NextResponse.json(
        { success: false, error: 'Missing targetId or targetType' },
        { status: 400 }
      );
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          targetId,
          targetType,
          approved: true, // Only show approved reviews publicly
        },
        include: {
          author: {
            include: {
              personalProfile: {
                select: { name: true, photoUrl: true, verified: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: { targetId, targetType, approved: true },
      }),
    ]);

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return NextResponse.json({
      success: true,
      data: reviews,
      stats: {
        totalReviews: total,
        averageRating: parseFloat(avgRating as string),
        ratingDistribution: await getRatingDistribution(targetId, targetType),
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getRatingDistribution(
  targetId: string,
  targetType: string
): Promise<Record<number, number>> {
  const reviews = await prisma.review.findMany({
    where: { targetId, targetType, approved: true },
    select: { rating: true },
  });

  return {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };
}
