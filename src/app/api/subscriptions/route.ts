import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TIER_PRICING, TIER_FEATURES } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscriptionTier.findUnique({
      where: { userId },
    });

    const tier = subscription?.tier || 'free';
    const features = TIER_FEATURES[tier as keyof typeof TIER_FEATURES];

    return NextResponse.json({
      success: true,
      data: {
        subscription: subscription || { userId, tier: 'free', status: 'active' },
        features,
        pricing: TIER_PRICING,
      },
    });
  } catch (error) {
    console.error('Fetch subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tier, returnUrl } = body;

    if (!userId || !tier) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!TIER_PRICING[tier as keyof typeof TIER_PRICING]) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Free tier doesn't need payment
    if (tier === 'free') {
      const subscription = await prisma.subscriptionTier.upsert({
        where: { userId },
        update: { tier, status: 'active' },
        create: { userId, tier, status: 'active' },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'downgrade_subscription',
          resource: 'subscription',
          resourceId: subscription.id,
          changes: { tier },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Downgraded to free tier',
        data: subscription,
      });
    }

    // TODO: Create Stripe checkout session for paid tiers
    // For now, simulate the upgrade
    const priceId = TIER_PRICING[tier as keyof typeof TIER_PRICING].stripePriceId;
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: 'Tier not available for purchase' },
        { status: 400 }
      );
    }

    // Mock checkout session creation
    const sessionId = 'mock_session_' + Date.now();

    return NextResponse.json({
      success: true,
      message: 'Checkout session created',
      data: {
        sessionId,
        // In production, this would be a real Stripe URL:
        // checkoutUrl: `https://checkout.stripe.com/pay/${sessionId}`
        checkoutUrl: `/payment/pending?sessionId=${sessionId}&tier=${tier}`,
      },
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
