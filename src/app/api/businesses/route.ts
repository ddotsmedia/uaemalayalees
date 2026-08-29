import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerId, name, categoryId, description } = body;

    if (!ownerId || !name || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(name);
    let attempts = 0;

    while (attempts < 10) {
      const existing = await prisma.businessPage.findUnique({
        where: { slug },
      });
      if (!existing) break;
      slug = generateSlug(name);
      attempts++;
    }

    const business = await prisma.businessPage.create({
      data: {
        slug,
        name,
        ownerId,
        categoryId,
        description: description || null,
        verified: false,
      },
      include: {
        owner: true,
        category: true,
      },
    });

    // Add owner as team member
    await prisma.businessTeamMember.create({
      data: {
        businessId: business.id,
        userId: ownerId,
        role: 'admin',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: business,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Business creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (slug) {
      const business = await prisma.businessPage.findUnique({
        where: { slug },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
            },
          },
          category: true,
          teamMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!business) {
        return NextResponse.json(
          { success: false, error: 'Business not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: business });
    }

    return NextResponse.json(
      { success: false, error: 'Missing query parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Business fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
