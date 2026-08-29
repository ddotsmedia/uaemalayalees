import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MAX_POST_LENGTH = 500;
const EDIT_WINDOW_MINUTES = 15;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const body = await request.json();
    const { content, authorId } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > MAX_POST_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Post must be ${MAX_POST_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Get post
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (post.authorId !== authorId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check edit window (15 minutes)
    const minutesElapsed = Math.floor(
      (Date.now() - post.createdAt.getTime()) / 60000
    );
    if (minutesElapsed > EDIT_WINDOW_MINUTES) {
      return NextResponse.json(
        { success: false, error: `Posts can only be edited within ${EDIT_WINDOW_MINUTES} minutes of creation` },
        { status: 403 }
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content },
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

    return NextResponse.json({ success: true, data: updatedPost });
  } catch (error) {
    console.error('Post update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const body = await request.json();
    const { authorId, isAdmin } = body;

    // Get post
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check authorization (author or admin)
    if (post.authorId !== authorId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft delete
    const deletedPost = await prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Post deleted',
      data: deletedPost,
    });
  } catch (error) {
    console.error('Post delete error:', error);
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

    const post = await prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
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
        comments: {
          where: { deletedAt: null },
          include: {
            author: {
              include: {
                personalProfile: {
                  select: { username: true, name: true, photoUrl: true },
                },
              },
            },
          },
        },
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

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Fetch post error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
