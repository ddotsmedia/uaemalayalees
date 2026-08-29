'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PERSONAL_CATEGORIES, KERALA_DISTRICTS } from '@/lib/constants';

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const [step, setStep] = useState<'profile' | 'complete'>(
    'profile'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    bio: '',
    nativePlace: '',
    offersServices: false,
    categoryId: '',
  });

  useEffect(() => {
    if (!userId) {
      router.push('/auth/login');
    }
  }, [userId, router]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create profile');
        return;
      }

      setStep('complete');
      setTimeout(() => {
        router.push(`/profile/${data.data.username}`);
      }, 1500);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <div className="container-content text-center">Loading...</div>;
  }

  return (
    <div className="container-content max-w-2xl">
      <div className="card">
        {step === 'profile' ? (
          <form onSubmit={handleCreateProfile} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary">
                Create Your Profile
              </h2>
              <p className="mt-2 text-text-secondary">
                Tell us about yourself to get started
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input mt-1 w-full"
                placeholder="e.g., Ahmed Al Mansouri"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                Headline (Job Title / Role)
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) =>
                  setFormData({ ...formData, headline: e.target.value })
                }
                className="input mt-1 w-full"
                placeholder="e.g., Software Engineer at TechCorp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="input mt-1 w-full min-h-24"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text">
                  Native Place (Kerala)
                </label>
                <select
                  value={formData.nativePlace}
                  onChange={(e) =>
                    setFormData({ ...formData, nativePlace: e.target.value })
                  }
                  className="input mt-1 w-full"
                >
                  <option value="">Select district...</option>
                  {KERALA_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text">
                  Professional Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="input mt-1 w-full"
                >
                  <option value="">Select category...</option>
                  {PERSONAL_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="offers-services"
                checked={formData.offersServices}
                onChange={(e) =>
                  setFormData({ ...formData, offersServices: e.target.checked })
                }
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="offers-services" className="text-sm text-text">
                I offer services/consulting (makes you visible in professional
                directory)
              </label>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.name}
              className="btn-primary w-full"
            >
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-primary">
              Profile Created!
            </h2>
            <p className="mt-2 text-text-secondary">
              Redirecting to your profile...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
