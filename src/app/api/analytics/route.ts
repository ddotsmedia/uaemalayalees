import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const businessId = searchParams.get('businessId');
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90);

    if (!userId && !businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or businessId' },
        { status: 400 }
      );
    }

    if (userId) {
      return getUserAnalytics(userId, days);
    } else {
      return getBusinessAnalytics(businessId!, days);
    }
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getUserAnalytics(userId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get daily analytics data
  const dailyData = await prisma.dailyAnalytics.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });

  // Calculate totals
  const followerCount = await prisma.follow.count({
    where: {
      targetPersonalProfileId: userId,
    },
  });

  const totalViews = await prisma.postView.count({
    where: {
      post: { authorId: userId },
    },
  });

  const totalPosts = await prisma.post.count({
    where: { authorId: userId, deletedAt: null },
  });

  // Calculate engagement
  const posts = await prisma.post.findMany({
    where: { authorId: userId, deletedAt: null },
    include: {
      reactions: { select: { id: true } },
      comments: { where: { deletedAt: null }, select: { id: true } },
    },
  });

  const totalEngagement = posts.reduce(
    (sum, p) => sum + p.reactions.length + p.comments.length * 2,
    0
  );

  return NextResponse.json({
    success: true,
    data: {
      userId,
      period: `Last ${days} days`,
      summary: {
        followers: followerCount,
        totalViews,
        totalPosts,
        totalEngagement,
        averageEngagementPerPost:
          posts.length > 0 ? (totalEngagement / posts.length).toFixed(1) : 0,
      },
      dailyData: dailyData.map(d => ({
        date: d.date.toISOString().split('T')[0],
        followers: d.followers,
        newFollowers: d.newFollowers,
        views: d.views,
        engagement: d.engagementScore,
      })),
    },
  });
}

async function getBusinessAnalytics(businessId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

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

  // Get daily analytics
  const dailyData = await prisma.dailyAnalytics.findMany({
    where: {
      businessId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });

  const followerCount = await prisma.follow.count({
    where: {
      targetBusinessPageId: businessId,
    },
  });

  const sponsoredPosts = await prisma.sponsoredPost.findMany({
    where: {
      businessId,
      status: 'active',
    },
  });

  const totalImpressions = sponsoredPosts.reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = sponsoredPosts.reduce((sum, p) => sum + p.clicks, 0);

  return NextResponse.json({
    success: true,
    data: {
      businessId,
      period: `Last ${days} days`,
      summary: {
        followers: followerCount,
        activeAds: sponsoredPosts.length,
        totalImpressions,
        totalClicks,
        clickThroughRate:
          totalImpressions > 0
            ? ((totalClicks / totalImpressions) * 100).toFixed(2)
            : 0,
      },
      dailyData: dailyData.map(d => ({
        date: d.date.toISOString().split('T')[0],
        followers: d.followers,
        newFollowers: d.newFollowers,
        engagement: d.engagementScore,
      })),
      ads: sponsoredPosts.map(ad => ({
        id: ad.id,
        status: ad.status,
        impressions: ad.impressions,
        clicks: ad.clicks,
        budget: ad.budget,
        ctr:
          ad.impressions > 0
            ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
            : 0,
      })),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, businessId, date, followers, views, engagement } = body;

    if (!date || (!userId && !businessId)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analytics = await prisma.dailyAnalytics.upsert({
      where: {
        userId_date: userId ? { userId, date: new Date(date) } : undefined,
        businessId_date: businessId
          ? { businessId, date: new Date(date) }
          : undefined,
      } as any,
      update: {
        followers: followers || 0,
        views: views || 0,
        engagementScore: engagement || 0,
      },
      create: {
        userId: userId || undefined,
        businessId: businessId || undefined,
        date: new Date(date),
        followers: followers || 0,
        views: views || 0,
        engagementScore: engagement || 0,
      },
    });

    return NextResponse.json(
      { success: true, data: analytics },
      { status: 201 }
    );
  } catch (error) {
    console.error('Analytics creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
