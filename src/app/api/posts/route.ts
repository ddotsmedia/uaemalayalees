import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MAX_POST_LENGTH = 500;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorId, content, media } = body;

    if (!authorId || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (content.length > MAX_POST_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Post must be ${MAX_POST_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Validate media (max 3 images)
    if (media && Array.isArray(media) && media.length > 3) {
      return NextResponse.json(
        { success: false, error: 'Maximum 3 images per post' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        authorId,
        content,
        media: media || null,
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
      },
    });

    return NextResponse.json(
      { success: true, data: post },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authorId = searchParams.get('authorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    if (!authorId) {
      return NextResponse.json(
        { success: false, error: 'Missing authorId' },
        { status: 400 }
      );
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId, deletedAt: null },
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
          comments: { select: { id: true } },
          reactions: { select: { id: true } },
          views: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where: { authorId, deletedAt: null } }),
    ]);

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
