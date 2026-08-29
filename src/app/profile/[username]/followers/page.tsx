'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Follower {
  id: string;
  followerProfile: {
    userId: string;
    username: string;
    name: string;
    photoUrl: string | null;
    headline: string | null;
    verified: boolean;
  };
}

export default function FollowersPage() {
  const params = useParams();
  const username = params.username as string;

  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        // TODO: Get profile by username to get userId
        // const profile = await fetch(`/api/profiles?username=${username}`)
        const res = await fetch(
          `/api/follow?targetId=${username}&targetType=personal`
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load followers');
          return;
        }

        setFollowers(data.data || []);
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [username]);

  return (
    <main className="container-content max-w-2xl">
      <div className="card">
        <h1 className="text-2xl font-bold text-primary mb-6">
          Followers
        </h1>

        {loading ? (
          <div className="text-center py-8 text-text-secondary">
            Loading...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No followers yet
          </div>
        ) : (
          <div className="space-y-3">
            {followers.map((follow) => (
              <Link
                key={follow.id}
                href={`/profile/${follow.followerProfile.username}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-secondary transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {follow.followerProfile.photoUrl ? (
                    <img
                      src={follow.followerProfile.photoUrl}
                      alt={follow.followerProfile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold text-text">
                      {follow.followerProfile.name}
                    </h3>
                    {follow.followerProfile.verified && (
                      <span className="text-sm text-primary">✓</span>
                    )}
                  </div>
                  {follow.followerProfile.headline && (
                    <p className="text-sm text-text-secondary truncate">
                      {follow.followerProfile.headline}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
