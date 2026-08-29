import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, licenseNumber, licenseExpiryDate, businessName } = body;

    if (!userId || !licenseNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Store license file in Cloudflare R2
    // For now, store metadata only
    const verification = await prisma.verification.upsert({
      where: { userId_type: { userId, type: 'TRADELIT' } },
      update: {
        verified: false, // Pending admin review
        token: licenseNumber,
        // Store additional data as JSON via model update
      },
      create: {
        userId,
        type: 'TRADELIT',
        verified: false, // Requires admin approval
        token: licenseNumber,
      },
    });

    // Store trade license metadata in a notes/metadata field
    // TODO: Add metadata column to Verification model in future
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'submit_verification',
        resource: 'verification',
        resourceId: verification.id,
        changes: {
          type: 'TRADELIT',
          licenseNumber,
          licenseExpiryDate,
          businessName,
          status: 'PENDING',
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Trade license submitted for verification',
        data: verification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Trade license submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Admin endpoint to approve trade license
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationId, approved } = body;

    if (!verificationId || approved === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check for admin

    const verification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        verified: approved,
        verifiedAt: approved ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: verification,
    });
  } catch (error) {
    console.error('Verification approval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
