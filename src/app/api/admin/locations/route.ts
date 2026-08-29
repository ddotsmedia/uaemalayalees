import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// TODO: Add authentication middleware

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: [{ emirate: 'asc' }, { city: 'asc' }, { area: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Fetch locations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emirate, city, area, centerLat, centerLng } = body;

    if (!emirate || !city || !area) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.location.findUnique({
      where: { emirate_city_area: { emirate, city, area } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Location already exists' },
        { status: 409 }
      );
    }

    const location = await prisma.location.create({
      data: {
        emirate,
        city,
        area,
        centerLat: centerLat || null,
        centerLng: centerLng || null,
      },
    });

    return NextResponse.json(
      { success: true, data: location },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create location error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
