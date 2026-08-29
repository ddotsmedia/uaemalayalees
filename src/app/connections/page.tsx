'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Connection {
  id: string;
  initiatorId: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  createdAt: string;
  initiator: {
    personalProfile: {
      username: string;
      name: string;
      photoUrl: string | null;
      headline: string | null;
      verified: boolean;
    };
  };
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  // TODO: Get userId from session
  const userId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('userId')
    : null;

  useEffect(() => {
    if (!userId) return;

    const fetchConnections = async () => {
      try {
        const res = await fetch(`/api/connect?userId=${userId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load connection requests');
          return;
        }

        setConnections(data.data || []);
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [userId]);

  const handleAction = async (connectionId: string, action: 'accept' | 'reject') => {
    setActingOn(connectionId);
    try {
      const res = await fetch(`/api/connect/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Action failed');
        return;
      }

      setConnections(connections.filter(c => c.id !== connectionId));
    } catch (err) {
      alert('Network error');
    } finally {
      setActingOn(null);
    }
  };

  if (!userId) {
    return (
      <main className="container-content max-w-2xl">
        <div className="card text-center py-8">
          <p className="text-text-secondary">Please sign in to view connection requests</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container-content max-w-2xl">
      <div className="card">
        <h1 className="text-2xl font-bold text-primary mb-6">
          Connection Requests
        </h1>

        {loading ? (
          <div className="text-center py-8 text-text-secondary">
            Loading...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No pending connection requests
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border"
              >
                <Link
                  href={`/profile/${conn.initiator.personalProfile.username}`}
                  className="flex items-center gap-3 flex-1 hover:opacity-75"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {conn.initiator.personalProfile.photoUrl ? (
                      <img
                        src={conn.initiator.personalProfile.photoUrl}
                        alt={conn.initiator.personalProfile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-text">
                        {conn.initiator.personalProfile.name}
                      </h3>
                      {conn.initiator.personalProfile.verified && (
                        <span className="text-sm text-primary">✓</span>
                      )}
                    </div>
                    {conn.initiator.personalProfile.headline && (
                      <p className="text-sm text-text-secondary truncate">
                        {conn.initiator.personalProfile.headline}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAction(conn.id, 'accept')}
                    disabled={actingOn === conn.id}
                    className="btn-primary py-1 px-3 text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(conn.id, 'reject')}
                    disabled={actingOn === conn.id}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
