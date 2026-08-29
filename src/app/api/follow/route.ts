import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, targetId, targetType } = body;

    if (!followerId || !targetId || !targetType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_targetPersonalProfileId_targetBusinessPageId: {
          followerId,
          targetPersonalProfileId: targetType === 'personal' ? targetId : null,
          targetBusinessPageId: targetType === 'business' ? targetId : null,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already following' },
        { status: 409 }
      );
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        targetPersonalProfileId: targetType === 'personal' ? targetId : null,
        targetBusinessPageId: targetType === 'business' ? targetId : null,
      },
    });

    return NextResponse.json(
      { success: true, data: follow },
      { status: 201 }
    );
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const followerId = searchParams.get('followerId');
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');

    if (!followerId || !targetId || !targetType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const follow = await prisma.follow.deleteMany({
      where: {
        followerId,
        ...(targetType === 'personal' && { targetPersonalProfileId: targetId }),
        ...(targetType === 'business' && { targetBusinessPageId: targetId }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: follow.count },
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');

    if (!targetId || !targetType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get follower profiles
    const follows = await prisma.follow.findMany({
      where: {
        ...(targetType === 'personal' && { targetPersonalProfileId: targetId }),
        ...(targetType === 'business' && { targetBusinessPageId: targetId }),
      },
    });

    // Fetch follower profiles separately
    const followers = await Promise.all(
      follows.map(async f => ({
        id: f.id,
        followerId: f.followerId,
        profile: await prisma.personalProfile.findUnique({
          where: { userId: f.followerId },
          select: {
            userId: true,
            username: true,
            name: true,
            photoUrl: true,
            headline: true,
            verified: true,
          },
        }),
      }))
    );

    return NextResponse.json({
      success: true,
      data: followers,
    });
  } catch (error) {
    console.error('Fetch followers error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
