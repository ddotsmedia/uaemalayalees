import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { timeAgo } from '@/lib/utils';

export const revalidate = 60; // ISR: revalidate every 60 seconds

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await prisma.personalProfile.findUnique({
    where: { username: params.username },
    include: { user: true },
  });

  if (!profile) {
    return {
      title: 'Profile Not Found - UAE Malayalees',
    };
  }

  return {
    title: `${profile.name} - UAE Malayalees`,
    description: profile.headline || profile.bio || `Connect with ${profile.name}`,
    openGraph: {
      title: profile.name,
      description: profile.headline || profile.bio,
      images: profile.photoUrl ? [profile.photoUrl] : [],
      url: `https://uaemalayalees.com/profile/${profile.username}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: profile.name,
      description: profile.headline || profile.bio,
      images: profile.photoUrl ? [profile.photoUrl] : [],
    },
  };
}

async function getProfileData(username: string) {
  return prisma.personalProfile.findUnique({
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
      followers: {
        select: { followerId: true },
      },
      following: {
        select: { followerId: true },
      },
    },
  });
}

export default async function ProfilePage({ params }: Props) {
  const profile = await getProfileData(params.username);

  if (!profile) {
    notFound();
  }

  const followersCount = profile.followers.length;
  const followingCount = profile.following.length;

  return (
    <main className="container-content">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Profile */}
        <div className="md:col-span-2 space-y-6">
          {/* Hero Section */}
          <div className="card relative overflow-hidden">
            {/* Cover placeholder */}
            <div className="h-32 bg-gradient-to-r from-primary to-accent" />

            {/* Profile Info */}
            <div className="relative -mt-16 px-6 pb-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
                {/* Avatar */}
                <div className="h-32 w-32 rounded-lg border-4 border-bg bg-bg-secondary overflow-hidden flex items-center justify-center">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>

                {/* Name & Badge */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-text">{profile.name}</h1>
                    {profile.verified && (
                      <span
                        className="flex items-center gap-1 text-sm font-medium text-primary"
                        title="Verified email & phone"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  {profile.headline && (
                    <p className="text-lg text-text-secondary">{profile.headline}</p>
                  )}
                </div>
              </div>

              {/* About */}
              {profile.bio && (
                <div className="mt-4 text-text">
                  <p>{profile.bio}</p>
                </div>
              )}

              {/* Meta Info */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-secondary">
                {profile.nativePlace && (
                  <span>📍 From {profile.nativePlace}</span>
                )}
                {profile.location && (
                  <span>🌍 Based in {profile.location.area}</span>
                )}
                {profile.category && (
                  <span>💼 {profile.category.name}</span>
                )}
                <span>📅 Joined {timeAgo(profile.user.createdAt)}</span>
              </div>

              {/* Stats */}
              <div className="mt-4 flex gap-6 border-t border-border pt-4">
                <div>
                  <div className="text-xl font-bold text-primary">
                    {followersCount}
                  </div>
                  <div className="text-sm text-text-secondary">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-primary">
                    {followingCount}
                  </div>
                  <div className="text-sm text-text-secondary">Following</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed (Empty for Phase 1) */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Activity</h2>
            <div className="text-center py-8 text-text-secondary">
              <p>No activity yet. Coming soon in Phase 3!</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="card space-y-2">
            <button className="btn-primary w-full">Follow</button>
            <button className="btn-secondary w-full">Send Message</button>
            <button className="btn-secondary w-full">Connect</button>
          </div>

          {/* Suggested Profiles (Empty for Phase 1) */}
          <div className="card">
            <h3 className="font-semibold mb-4">Suggested Connections</h3>
            <p className="text-sm text-text-secondary">
              Coming in Phase 2
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
