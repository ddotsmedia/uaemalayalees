'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BUSINESS_CATEGORIES, PERSONAL_CATEGORIES, EMIRATES } from '@/lib/constants';

interface SearchResult {
  profiles: any[];
  businesses: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    emirate: searchParams.get('emirate') || '',
    type: (searchParams.get('type') as 'personal' | 'business') || '',
  });

  useEffect(() => {
    if (!query && !filters.category && !filters.emirate) {
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (filters.category) params.set('category', filters.category);
        if (filters.emirate) params.set('emirate', filters.emirate);
        if (filters.type) params.set('type', filters.type);

        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        setResults(data.data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, filters]);

  return (
    <main className="container-content">
      <h1 className="text-3xl font-bold text-primary mb-8">
        Search Profiles & Businesses
      </h1>

      <div className="grid gap-8 md:grid-cols-4">
        {/* Filters */}
        <div className="md:col-span-1">
          <div className="card sticky top-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Search
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input w-full"
                placeholder="Name, business, skill..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value as any })
                }
                className="input w-full"
              >
                <option value="">All Types</option>
                <option value="personal">Profiles</option>
                <option value="business">Businesses</option>
              </select>
            </div>

            {filters.type !== 'personal' && (
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Business Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className="input w-full"
                >
                  <option value="">All Categories</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filters.type !== 'business' && filters.type !== '' && (
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Professional Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className="input w-full"
                >
                  <option value="">All Categories</option>
                  {PERSONAL_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Emirate
              </label>
              <select
                value={filters.emirate}
                onChange={(e) =>
                  setFilters({ ...filters, emirate: e.target.value })
                }
                className="input w-full"
              >
                <option value="">All Emirates</option>
                {EMIRATES.map((em) => (
                  <option key={em.slug} value={em.name}>
                    {em.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="card text-center py-12">
              <p className="text-text-secondary">Searching...</p>
            </div>
          ) : results && results.pagination.total > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Found {results.pagination.total} results
              </p>

              {/* Profiles */}
              {results.profiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.username}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {profile.photoUrl ? (
                        <img
                          src={profile.photoUrl}
                          alt={profile.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text">
                          {profile.name}
                        </h3>
                        {profile.verified && (
                          <span className="text-sm text-primary">✓</span>
                        )}
                      </div>
                      {profile.headline && (
                        <p className="text-sm text-text-secondary">
                          {profile.headline}
                        </p>
                      )}
                      {profile.category && (
                        <p className="text-xs text-text-secondary">
                          {profile.category.name}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Businesses */}
              {results.businesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/business/${business.slug}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {business.logoUrl ? (
                        <img
                          src={business.logoUrl}
                          alt={business.name}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-2xl">🏢</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text">
                          {business.name}
                        </h3>
                        {business.verified && (
                          <span className="text-sm text-primary">✓</span>
                        )}
                      </div>
                      {business.category && (
                        <p className="text-sm text-text-secondary">
                          {business.category.name}
                        </p>
                      )}
                      {business.description && (
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {business.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-text-secondary">
                {query || Object.values(filters).some(v => v)
                  ? 'No results found'
                  : 'Search or browse profiles and businesses'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
