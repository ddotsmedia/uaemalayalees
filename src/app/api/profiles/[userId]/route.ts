import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();

    const profile = await prisma.personalProfile.update({
      where: { userId },
      data: {
        name: body.name || undefined,
        headline: body.headline || undefined,
        bio: body.bio || undefined,
        nativePlace: body.nativePlace || undefined,
        offersServices: body.offersServices !== undefined ? body.offersServices : undefined,
        photoUrl: body.photoUrl || undefined,
        links: body.links || undefined,
        categoryId: body.categoryId || undefined,
        locationId: body.locationId || undefined,
      },
      include: {
        user: true,
        category: true,
        location: true,
      },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const profile = await prisma.personalProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        category: true,
        location: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
