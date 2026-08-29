'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'profile_update' | 'connection' | 'follow';
  user?: {
    username: string;
    name: string;
    photoUrl: string | null;
  };
  users?: Array<{
    username: string;
    name: string;
    photoUrl: string | null;
  }>;
  createdAt: string;
  description: string;
}

export default function FeedPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // TODO: Get userId from session
  const userId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('userId')
    : null;

  useEffect(() => {
    if (!userId) return;

    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/activity?userId=${userId}&limit=20`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load feed');
          return;
        }

        setActivity(data.data || []);
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (!userId) {
    return (
      <main className="container-content max-w-2xl">
        <div className="card text-center py-12">
          <p className="text-text-secondary">
            Please sign in to view your feed
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container-content max-w-2xl">
      <h1 className="text-3xl font-bold text-primary mb-8">
        Activity Feed
      </h1>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">
          Loading feed...
        </div>
      ) : error ? (
        <div className="card rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : activity.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary mb-4">
            Your feed is empty. Follow more people to see activity!
          </p>
          <Link href="/discover" className="btn-primary inline-block">
            Discover People
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activity.map(item => (
            <div key={item.id} className="card">
              {item.type === 'profile_update' && item.user && (
                <Link
                  href={`/profile/${item.user.username}`}
                  className="flex items-center gap-3 hover:opacity-75 transition-opacity"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.user.photoUrl ? (
                      <img
                        src={item.user.photoUrl}
                        alt={item.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text">
                      <span className="font-semibold">{item.user.name}</span>{' '}
                      <span className="text-text-secondary">{item.description}</span>
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </Link>
              )}

              {item.type === 'connection' && item.users && item.users.length >= 2 && (
                <div className="flex items-center gap-3">
                  <div className="flex">
                    <Link href={`/profile/${item.users[0].username}`}>
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-bg">
                        {item.users[0].photoUrl ? (
                          <img
                            src={item.users[0].photoUrl}
                            alt={item.users[0].name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">👤</span>
                        )}
                      </div>
                    </Link>
                    <Link href={`/profile/${item.users[1].username}`}>
                      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border-2 border-bg -ml-3">
                        {item.users[1].photoUrl ? (
                          <img
                            src={item.users[1].photoUrl}
                            alt={item.users[1].name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">👤</span>
                        )}
                      </div>
                    </Link>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text">
                      <Link
                        href={`/profile/${item.users[0].username}`}
                        className="text-primary hover:underline"
                      >
                        {item.users[0].name}
                      </Link>
                      {' and '}
                      <Link
                        href={`/profile/${item.users[1].username}`}
                        className="text-primary hover:underline"
                      >
                        {item.users[1].name}
                      </Link>
                      {' '}
                      <span className="text-text-secondary">
                        {item.description}
                      </span>
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Coming Soon Placeholder */}
      <div className="card mt-8 border-l-4 border-l-accent">
        <h3 className="font-semibold text-text mb-2">✨ Coming Soon in Phase 3</h3>
        <p className="text-sm text-text-secondary">
          Posts, reactions, and comments - stay tuned!
        </p>
      </div>
    </main>
  );
}
