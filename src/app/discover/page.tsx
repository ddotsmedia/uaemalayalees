'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Suggestion {
  userId: string;
  username: string;
  name: string;
  headline: string | null;
  photoUrl: string | null;
  verified: boolean;
  category?: { name: string } | null;
  location?: { emirate: string; city: string; area: string } | null;
  nativePlace: string | null;
}

export default function DiscoverPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState<Set<string>>(new Set());

  // TODO: Get userId from session
  const userId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('userId')
    : null;

  useEffect(() => {
    if (!userId) return;

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/discover/suggestions?userId=${userId}&limit=20`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load suggestions');
          return;
        }

        setSuggestions(data.data || []);
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [userId]);

  const handleFollow = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: userId,
          targetId: targetUserId,
          targetType: 'personal',
        }),
      });

      if (res.ok) {
        setFollowing(new Set([...following, targetUserId]));
      }
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  if (!userId) {
    return (
      <main className="container-content max-w-2xl">
        <div className="card text-center py-8">
          <p className="text-text-secondary">
            Please sign in to discover people
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container-content">
      <h1 className="text-3xl font-bold text-primary mb-8">
        Discover People
      </h1>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">
          Loading suggestions...
        </div>
      ) : error ? (
        <div className="card rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary">
            No suggestions at the moment. Try searching!
          </p>
          <Link href="/search" className="btn-primary mt-4 inline-block">
            Search Profiles
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((person) => (
            <div key={person.userId} className="card">
              <Link href={`/profile/${person.username}`}>
                <div className="text-center mb-4">
                  <div className="h-24 w-24 rounded-full mx-auto mb-3 bg-primary/20 flex items-center justify-center overflow-hidden">
                    {person.photoUrl ? (
                      <img
                        src={person.photoUrl}
                        alt={person.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">👤</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <h3 className="font-semibold text-text">{person.name}</h3>
                    {person.verified && (
                      <span className="text-sm text-primary">✓</span>
                    )}
                  </div>
                  {person.headline && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {person.headline}
                    </p>
                  )}
                </div>
              </Link>

              <div className="text-center text-xs text-text-secondary mb-4 space-y-1">
                {person.category && <div>📊 {person.category.name}</div>}
                {person.location && (
                  <div>📍 {person.location.area}, {person.location.emirate}</div>
                )}
                {person.nativePlace && (
                  <div>🏠 From {person.nativePlace}</div>
                )}
              </div>

              <button
                onClick={() => handleFollow(person.userId)}
                disabled={following.has(person.userId)}
                className="btn-primary w-full"
              >
                {following.has(person.userId) ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
