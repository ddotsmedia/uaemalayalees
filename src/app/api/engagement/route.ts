import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');

    if (postId) {
      return getPostEngagement(postId);
    }

    if (userId) {
      return getUserEngagement(userId);
    }

    return NextResponse.json(
      { success: false, error: 'Missing postId or userId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Engagement error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getPostEngagement(postId: string) {
  // Get post with all engagement data
  const post = await prisma.post.findUnique({
    where: { id: postId, deletedAt: null },
    include: {
      comments: { where: { deletedAt: null } },
      reactions: true,
      views: true,
    },
  });

  if (!post) {
    return NextResponse.json(
      { success: false, error: 'Post not found' },
      { status: 404 }
    );
  }

  // Count nested replies
  const replyCount = await prisma.comment.count({
    where: {
      parentCommentId: { in: post.comments.map(c => c.id) },
      deletedAt: null,
    },
  });

  // Calculate engagement score
  const likes = post.reactions.filter(r => r.type === 'like').length;
  const comments = post.comments.length;
  const views = post.views.length;
  const replies = replyCount;

  const engagementScore =
    likes * 1 + comments * 2 + replies * 1.5 + views * 0.1;

  return NextResponse.json({
    success: true,
    data: {
      postId,
      metrics: {
        likes,
        comments,
        replies,
        views,
      },
      engagementScore: Math.round(engagementScore * 100) / 100,
      engagementLevel: getEngagementLevel(engagementScore),
    },
  });
}

async function getUserEngagement(userId: string) {
  // Get all user's posts
  const posts = await prisma.post.findMany({
    where: { authorId: userId, deletedAt: null },
    include: {
      comments: { where: { deletedAt: null } },
      reactions: true,
      views: true,
    },
  });

  if (posts.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        userId,
        posts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalViews: 0,
        totalScore: 0,
        engagementLevel: 'new',
      },
    });
  }

  // Aggregate metrics
  let totalLikes = 0,
    totalComments = 0,
    totalViews = 0,
    totalReplies = 0;

  for (const post of posts) {
    totalLikes += post.reactions.filter(r => r.type === 'like').length;
    totalComments += post.comments.length;
    totalViews += post.views.length;

    const replyCount = await prisma.comment.count({
      where: {
        parentCommentId: { in: post.comments.map(c => c.id) },
        deletedAt: null,
      },
    });
    totalReplies += replyCount;
  }

  const totalScore =
    totalLikes * 1 +
    totalComments * 2 +
    totalReplies * 1.5 +
    totalViews * 0.1;

  return NextResponse.json({
    success: true,
    data: {
      userId,
      posts: posts.length,
      metrics: {
        likes: totalLikes,
        comments: totalComments,
        replies: totalReplies,
        views: totalViews,
      },
      totalScore: Math.round(totalScore * 100) / 100,
      engagementLevel: getEngagementLevel(totalScore),
      averagePerPost:
        posts.length > 0
          ? Math.round((totalScore / posts.length) * 100) / 100
          : 0,
    },
  });
}

function getEngagementLevel(score: number): string {
  if (score >= 1000) return 'highly_engaged';
  if (score >= 500) return 'active';
  if (score >= 100) return 'regular';
  return 'new';
}
