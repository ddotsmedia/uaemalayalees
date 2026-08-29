import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';

export const revalidate = 60; // ISR: revalidate every 60 seconds

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const business = await prisma.businessPage.findUnique({
    where: { slug: params.slug },
  });

  if (!business) {
    return {
      title: 'Business Not Found - UAE Malayalees',
    };
  }

  return {
    title: `${business.name} - UAE Malayalees`,
    description: business.description || `Connect with ${business.name}`,
    openGraph: {
      title: business.name,
      description: business.description,
      images: business.logoUrl ? [business.logoUrl] : [],
      url: `https://uaemalayalees.com/business/${business.slug}`,
      type: 'business.business',
    },
    twitter: {
      card: 'summary',
      title: business.name,
      description: business.description,
      images: business.logoUrl ? [business.logoUrl] : [],
    },
  };
}

async function getBusinessData(slug: string) {
  return prisma.businessPage.findUnique({
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
      followers: {
        select: { followerId: true },
      },
    },
  });
}

export default async function BusinessPage({ params }: Props) {
  const business = await getBusinessData(params.slug);

  if (!business) {
    notFound();
  }

  const followersCount = business.followers.length;

  return (
    <main className="container-content">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Business */}
        <div className="md:col-span-2 space-y-6">
          {/* Hero Section */}
          <div className="card relative overflow-hidden">
            {/* Cover */}
            <div className="h-48 bg-gradient-to-r from-primary to-accent" />

            {/* Logo & Info */}
            <div className="relative -mt-12 px-6 pb-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                {/* Logo */}
                <div className="h-24 w-24 rounded-lg border-4 border-bg bg-bg-secondary overflow-hidden flex items-center justify-center flex-shrink-0">
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt={business.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🏢</span>
                  )}
                </div>

                {/* Name & Badge */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-text">
                      {business.name}
                    </h1>
                    {business.verified && (
                      <span
                        className="flex items-center gap-1 text-sm font-medium text-primary"
                        title="Verified business"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  {business.category && (
                    <p className="text-lg text-text-secondary">
                      {business.category.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {business.description && (
                <div className="mt-4 text-text">
                  <p>{business.description}</p>
                </div>
              )}

              {/* Contact & Hours */}
              <div className="mt-4 grid gap-4 md:grid-cols-2 py-4 border-t border-b border-border">
                {/* Contact */}
                {business.contact && (
                  <div>
                    <h3 className="font-semibold text-text mb-2">Contact</h3>
                    <div className="space-y-1 text-sm text-text-secondary">
                      {typeof business.contact === 'object' &&
                        business.contact &&
                        Object.entries(business.contact).map(
                          ([key, value]: [string, any]) =>
                            value && <div key={key}>{value}</div>
                        )}
                    </div>
                  </div>
                )}

                {/* Hours */}
                {business.hours && (
                  <div>
                    <h3 className="font-semibold text-text mb-2">Hours</h3>
                    <div className="space-y-1 text-sm text-text-secondary">
                      {typeof business.hours === 'object' &&
                        Object.entries(business.hours).slice(0, 3).map(
                          ([day, times]: [string, any]) =>
                            times && (
                              <div key={day}>
                                {day}: {times.open} - {times.close}
                              </div>
                            )
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4">
                <div className="text-lg font-bold text-primary">
                  {followersCount}
                </div>
                <div className="text-sm text-text-secondary">Followers</div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          {business.teamMembers.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Team</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {business.teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <div className="font-medium text-text">
                        {member.user.email.split('@')[0]}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {member.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {business.locations && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Locations</h2>
              <div className="space-y-3">
                {Array.isArray(business.locations) &&
                  business.locations.map((loc: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-bg-secondary">
                      <div className="font-medium text-text">{loc.address}</div>
                      <div className="text-sm text-text-secondary">
                        {loc.area}, {loc.city}, {loc.emirate}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="card space-y-2">
            <button className="btn-primary w-full">Follow</button>
            <button className="btn-secondary w-full">Call</button>
            <button className="btn-secondary w-full">WhatsApp</button>
            <button className="btn-accent w-full">Get Quote</button>
          </div>

          {/* Similar Businesses (Empty for Phase 1) */}
          <div className="card">
            <h3 className="font-semibold mb-4">Similar Businesses</h3>
            <p className="text-sm text-text-secondary">
              Coming in Phase 2
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
