import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface SearchQuery {
  q?: string;
  category?: string;
  emirate?: string;
  type?: 'personal' | 'business';
  verified?: boolean;
  page?: number;
  limit?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query: SearchQuery = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      emirate: searchParams.get('emirate') || undefined,
      type: (searchParams.get('type') as 'personal' | 'business') || undefined,
      verified: searchParams.get('verified') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
    };

    const skip = (query.page! - 1) * query.limit!;

    const results: any = {
      profiles: [],
      businesses: [],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 0,
        pages: 0,
      },
    };

    // Search profiles
    if (query.type !== 'business') {
      const profileWhere: any = {
        active: true,
        verified: query.verified ? true : undefined,
      };

      if (query.q) {
        profileWhere.OR = [
          { name: { contains: query.q, mode: 'insensitive' } },
          { headline: { contains: query.q, mode: 'insensitive' } },
          { bio: { contains: query.q, mode: 'insensitive' } },
        ];
      }

      if (query.category) {
        profileWhere.category = { slug: query.category };
      }

      if (query.emirate) {
        profileWhere.location = { emirate: query.emirate };
      }

      const [profiles, profileCount] = await Promise.all([
        prisma.personalProfile.findMany({
          where: profileWhere,
          include: {
            category: true,
            location: true,
          },
          skip,
          take: query.limit,
        }),
        prisma.personalProfile.count({ where: profileWhere }),
      ]);

      results.profiles = profiles;
      results.pagination.total += profileCount;
    }

    // Search businesses
    if (query.type !== 'personal') {
      const businessWhere: any = {
        active: true,
        verified: query.verified ? true : undefined,
      };

      if (query.q) {
        businessWhere.OR = [
          { name: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
        ];
      }

      if (query.category) {
        businessWhere.category = { slug: query.category };
      }

      const [businesses, businessCount] = await Promise.all([
        prisma.businessPage.findMany({
          where: businessWhere,
          include: {
            category: true,
            owner: {
              select: { id: true, email: true },
            },
          },
          skip,
          take: query.limit,
        }),
        prisma.businessPage.count({ where: businessWhere }),
      ]);

      results.businesses = businesses;
      results.pagination.total += businessCount;
    }

    results.pagination.pages = Math.ceil(results.pagination.total / query.limit!);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
