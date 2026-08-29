import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const { connectionId } = params;
    const body = await request.json();
    const { action } = body; // 'accept' or 'reject' or 'block'

    if (!action || !['accept', 'reject', 'block'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : action === 'block' ? 'BLOCKED' : 'PENDING',
      },
      include: {
        initiator: true,
        receiver: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: connection,
    });
  } catch (error) {
    console.error('Update connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
