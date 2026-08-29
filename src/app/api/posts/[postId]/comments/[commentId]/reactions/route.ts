import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID_REACTION_TYPES = ['like', 'heart', 'laugh', 'thinking', 'clapping', 'fire', 'rocket'];

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const { postId, commentId } = params;
    const body = await request.json();
    const { authorId, type } = body;

    if (!authorId || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!VALID_REACTION_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid reaction type` },
        { status: 400 }
      );
    }

    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId, deletedAt: null },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check existing reaction
    const existing = await prisma.reaction.findFirst({
      where: { commentId, authorId },
    });

    if (existing) {
      if (existing.type === type) {
        await prisma.reaction.delete({ where: { id: existing.id } });
        return NextResponse.json({
          success: true,
          message: 'Reaction removed',
        });
      } else {
        const updated = await prisma.reaction.update({
          where: { id: existing.id },
          data: { type },
        });
        return NextResponse.json({
          success: true,
          data: updated,
          message: 'Reaction updated',
        });
      }
    }

    const reaction = await prisma.reaction.create({
      data: {
        commentId,
        authorId,
        type,
      },
    });

    return NextResponse.json(
      { success: true, data: reaction },
      { status: 201 }
    );
  } catch (error) {
    console.error('Comment reaction error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const { commentId } = params;

    const reactions = await prisma.reaction.findMany({
      where: { commentId },
      include: {
        author: {
          select: {
            personalProfile: {
              select: { username: true, name: true, photoUrl: true },
            },
          },
        },
      },
    });

    const grouped = reactions.reduce(
      (acc: Record<string, any>, reaction) => {
        if (!acc[reaction.type]) {
          acc[reaction.type] = { count: 0, reactors: [] };
        }
        acc[reaction.type].count++;
        acc[reaction.type].reactors.push({
          id: reaction.authorId,
          profile: reaction.author.personalProfile,
        });
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: Object.entries(grouped).map(([type, data]) => ({
          type,
          count: (data as any).count,
          reactors: (data as any).reactors.slice(0, 5),
        })),
        total: reactions.length,
      },
    });
  } catch (error) {
    console.error('Fetch comment reactions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
