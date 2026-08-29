import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MAX_COMMENT_LENGTH = 300;
const EDIT_WINDOW_MINUTES = 15;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const { postId, commentId } = params;
    const body = await request.json();
    const { content, authorId } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.authorId !== authorId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const minutesElapsed = Math.floor(
      (Date.now() - comment.createdAt.getTime()) / 60000
    );
    if (minutesElapsed > EDIT_WINDOW_MINUTES) {
      return NextResponse.json(
        { success: false, error: `Comments can only be edited within ${EDIT_WINDOW_MINUTES} minutes of creation` },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          include: {
            personalProfile: {
              select: {
                username: true,
                name: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedComment });
  } catch (error) {
    console.error('Comment update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const { postId, commentId } = params;
    const body = await request.json();
    const { authorId, isAdmin } = body;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.authorId !== authorId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const deletedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted',
      data: deletedComment,
    });
  } catch (error) {
    console.error('Comment delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
