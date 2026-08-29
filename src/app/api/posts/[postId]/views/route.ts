import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const body = await request.json();
    const { viewerId } = body; // can be null for anonymous

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

    // Check if already viewed today (deduplicate daily)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingView = await prisma.postView.findFirst({
      where: {
        postId,
        viewerId,
        createdAt: { gte: today },
      },
    });

    if (existingView) {
      return NextResponse.json({
        success: true,
        message: 'Already counted today',
      });
    }

    // Record view
    const view = await prisma.postView.create({
      data: {
        postId,
        viewerId: viewerId || null,
      },
    });

    return NextResponse.json(
      { success: true, data: view },
      { status: 201 }
    );
  } catch (error) {
    console.error('View creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;

    const viewCount = await prisma.postView.count({
      where: { postId },
    });

    // Get top viewers
    const viewers = await prisma.postView.findMany({
      where: { postId, viewerId: { not: null } },
      select: {
        viewerId: true,
        viewer: {
          include: {
            personalProfile: {
              select: { username: true, name: true, photoUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      distinct: ['viewerId'],
    });

    return NextResponse.json({
      success: true,
      data: {
        viewCount,
        topViewers: viewers.map(v => ({
          userId: v.viewerId,
          profile: v.viewer?.personalProfile,
        })),
      },
    });
  } catch (error) {
    console.error('Fetch views error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
