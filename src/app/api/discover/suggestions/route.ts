import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get user's profile
    const userProfile = await prisma.personalProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        categoryId: true,
        locationId: true,
        nativePlace: true,
        offersServices: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get user's existing connections
    const existingConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          { receiverId: userId },
        ],
      },
      select: { initiatorId: true, receiverId: true },
    });

    const connectedUserIds = new Set(
      existingConnections.flatMap(c => [c.initiatorId, c.receiverId])
    );

    // Get following/followers
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { targetPersonalProfileId: true },
    });

    const followers = await prisma.follow.findMany({
      where: { targetPersonalProfileId: userId },
      select: { followerId: true },
    });

    const relatedUserIds = new Set([
      ...following.map(f => f.targetPersonalProfileId).filter(Boolean) as string[],
      ...followers.map(f => f.followerId),
    ]);

    // Find similar profiles (same category, location, or native place)
    const suggestions = await prisma.personalProfile.findMany({
      where: {
        active: true,
        verified: true,
        userId: { not: userId },
        OR: [
          { categoryId: userProfile.categoryId || undefined },
          { locationId: userProfile.locationId || undefined },
          { nativePlace: userProfile.nativePlace || undefined },
        ],
      },
      select: {
        id: true,
        userId: true,
        username: true,
        name: true,
        headline: true,
        photoUrl: true,
        verified: true,
        category: { select: { name: true } },
        location: { select: { emirate: true, city: true, area: true } },
        nativePlace: true,
      },
      take: limit * 3, // Get more, then deduplicate
    });

    // Filter out already connected/following
    const filtered = suggestions
      .filter(
        s =>
          !connectedUserIds.has(s.userId) &&
          !relatedUserIds.has(s.userId)
      )
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
