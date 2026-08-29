import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get followed user IDs
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { targetPersonalProfileId: true },
    });

    const followedUserIds = following
      .map(f => f.targetPersonalProfileId)
      .filter(Boolean) as string[];

    // Include user's own posts + followed users' posts
    const allUserIds = [...new Set([userId, ...followedUserIds])];

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: { in: allUserIds },
          deletedAt: null,
        },
        include: {
          author: {
            include: {
              personalProfile: {
                select: {
                  username: true,
                  name: true,
                  photoUrl: true,
                  verified: true,
                },
              },
            },
          },
          comments: { where: { deletedAt: null }, select: { id: true } },
          reactions: { select: { id: true, type: true, authorId: true } },
          views: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: { authorId: { in: allUserIds }, deletedAt: null },
      }),
    ]);

    // Enhance posts with counts and user reactions
    const enrichedPosts = posts.map(post => ({
      ...post,
      commentCount: post.comments.length,
      reactionCount: post.reactions.length,
      reactionsByType: post.reactions.reduce(
        (acc: Record<string, number>, r) => ({
          ...acc,
          [r.type]: (acc[r.type] || 0) + 1,
        }),
        {}
      ),
      userReaction: post.reactions.find(r => r.authorId === userId)?.type || null,
      viewCount: post.views.length,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedPosts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Feed fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
