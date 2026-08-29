import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// TODO: Add authentication middleware to verify admin role

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { ordering: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, name, icon, type, active, ordering } = body;

    if (!slug || !name || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        slug,
        name,
        icon: icon || null,
        type,
        active: active !== undefined ? active : true,
        ordering: ordering || 0,
      },
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
