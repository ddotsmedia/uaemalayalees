import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUsername } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, headline, bio, nativePlace, offersServices } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique username
    const [firstName, ...lastNameParts] = name.trim().split(' ');
    const lastName = lastNameParts.join(' ') || 'user';
    let username = generateUsername(firstName, lastName);
    let attempts = 0;

    while (attempts < 10) {
      const existing = await prisma.personalProfile.findUnique({
        where: { username },
      });
      if (!existing) break;
      username = generateUsername(firstName, lastName);
      attempts++;
    }

    const profile = await prisma.personalProfile.create({
      data: {
        userId,
        username,
        name,
        headline: headline || null,
        bio: bio || null,
        nativePlace: nativePlace || null,
        offersServices: offersServices || false,
        verified: false,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const userId = searchParams.get('userId');

    if (username) {
      const profile = await prisma.personalProfile.findUnique({
        where: { username },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
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
    }

    if (userId) {
      const profile = await prisma.personalProfile.findUnique({
        where: { userId },
        include: {
          user: true,
          category: true,
          location: true,
        },
      });

      return NextResponse.json({ success: true, data: profile || null });
    }

    return NextResponse.json(
      { success: false, error: 'Missing query parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
