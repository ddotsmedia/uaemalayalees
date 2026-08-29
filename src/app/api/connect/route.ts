import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initiatorId, receiverId } = body;

    if (!initiatorId || !receiverId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (initiatorId === receiverId) {
      return NextResponse.json(
        { success: false, error: 'Cannot connect to yourself' },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existing = await prisma.connection.findUnique({
      where: { initiatorId_receiverId: { initiatorId, receiverId } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Connection request already sent' },
        { status: 409 }
      );
    }

    const connection = await prisma.connection.create({
      data: {
        initiatorId,
        receiverId,
        status: 'PENDING',
      },
      include: {
        initiator: true,
        receiver: true,
      },
    });

    return NextResponse.json(
      { success: true, data: connection },
      { status: 201 }
    );
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'PENDING';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get pending connection requests (where user is receiver)
    const connections = await prisma.connection.findMany({
      where: {
        receiverId: userId,
        status: status as any,
      },
      include: {
        initiator: {
          include: {
            personalProfile: {
              select: {
                username: true,
                name: true,
                photoUrl: true,
                headline: true,
                verified: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    console.error('Fetch connections error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
