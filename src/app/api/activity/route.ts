import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = parseInt(searchParams.get('page') || '1');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Get activity from followed profiles and accepted connections
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { targetPersonalProfileId: true },
    });

    const followingIds = following
      .map(f => f.targetPersonalProfileId)
      .filter(Boolean) as string[];

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { initiatorId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
      select: { initiatorId: true, receiverId: true },
    });

    const connectedUserIds = connections.flatMap(c =>
      [c.initiatorId, c.receiverId].filter(id => id !== userId)
    );

    const allActivityUserIds = [...new Set([...followingIds, ...connectedUserIds])];

    if (allActivityUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    }

    // Get recent profile updates (profile edits)
    const profileUpdates = await prisma.auditLog.findMany({
      where: {
        userId: { in: allActivityUserIds },
        action: 'update',
        resource: 'profile',
      },
      include: {
        user: {
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get recent connections
    const recentConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { initiatorId: { in: allActivityUserIds }, status: 'ACCEPTED' },
          { receiverId: { in: allActivityUserIds }, status: 'ACCEPTED' },
        ],
      },
      include: {
        initiator: {
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
        receiver: {
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
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Format activity items
    const activity = [
      ...profileUpdates.map(log => ({
        id: log.id,
        type: 'profile_update',
        user: log.user.personalProfile,
        createdAt: log.createdAt,
        description: 'Updated their profile',
      })),
      ...recentConnections
        .filter(c => c.status === 'ACCEPTED')
        .map(c => ({
          id: c.id,
          type: 'connection',
          users: [c.initiator.personalProfile, c.receiver.personalProfile],
          createdAt: c.createdAt,
          description: 'Made a new connection',
        })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: activity,
      pagination: { page, limit, total: activity.length, pages: 1 },
    });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
