import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MAX_COMMENT_LENGTH = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const body = await request.json();
    const { authorId, content, parentCommentId } = body;

    if (!authorId || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less` },
        { status: 400 }
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

    // If replying to a comment, verify parent comment exists
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId, deletedAt: null },
      });

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
        parentCommentId: parentCommentId || null,
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
        replies: { select: { id: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: comment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Comment creation error:', error);
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
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId,
          deletedAt: null,
          parentCommentId: null, // Only top-level comments
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
          replies: {
            where: { deletedAt: null },
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
          },
          reactions: { select: { id: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: { postId, deletedAt: null, parentCommentId: null },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
