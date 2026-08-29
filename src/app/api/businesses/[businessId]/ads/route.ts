import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const AD_TYPES = ['sponsored_post', 'featured_placement'];
const SPONSORED_POST_PRICE = 50; // AED/day
const FEATURED_PLACEMENT_PRICE = 100; // AED/day

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const body = await request.json();
    const { type, postId, duration, budget, dailyCap } = body;

    if (!type || !postId || !duration || !budget) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!AD_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ad type' },
        { status: 400 }
      );
    }

    // Verify business exists
    const business = await prisma.businessPage.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Create ad (pending approval)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const ad = await prisma.sponsoredPost.create({
      data: {
        businessId,
        postId,
        campaignId: `campaign_${Date.now()}`,
        budget,
        dailyBudget: dailyCap || budget,
        status: 'pending', // Awaiting admin approval
        startDate,
        endDate,
      },
    });

    // Log for audit
    await prisma.auditLog.create({
      data: {
        userId: business.ownerId,
        action: 'create_ad',
        resource: 'sponsored_post',
        resourceId: ad.id,
        changes: { type, budget, duration },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Ad created, awaiting approval',
        data: ad,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ad creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    const ads = await prisma.sponsoredPost.findMany({
      where: { businessId },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            authorId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: ads.map(ad => ({
        ...ad,
        roi:
          ad.clicks > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0,
        spent: ad.budget * (ad.status === 'active' ? 1 : 0),
      })),
    });
  } catch (error) {
    console.error('Fetch ads error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
