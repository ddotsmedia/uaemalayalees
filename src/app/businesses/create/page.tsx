'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUSINESS_CATEGORIES, EMIRATES } from '@/lib/constants';

export default function CreateBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // TODO: Get userId from session
  const userId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('userId') : null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    contact: {
      phone: '',
      email: '',
      whatsapp: '',
      website: '',
    },
    locations: [
      {
        emirate: '',
        city: '',
        area: '',
        address: '',
        coordinates: { lat: 0, lng: 0 },
      },
    ],
  });

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!userId) {
      setError('Please sign in first');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: userId,
          name: formData.name,
          categoryId: formData.categoryId,
          description: formData.description,
          contact: formData.contact,
          locations: formData.locations,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create business');
        return;
      }

      router.push(`/business/${data.data.slug}`);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-content max-w-2xl">
      <div className="card">
        <h2 className="text-2xl font-bold text-primary mb-6">
          Create Business Page
        </h2>

        <form onSubmit={handleCreateBusiness} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-text">
              Business Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input mt-1 w-full"
                  placeholder="e.g., TechCorp UAE"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="input mt-1 w-full"
                  required
                >
                  <option value="">Select category...</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input mt-1 w-full min-h-24"
                  placeholder="Tell us about your business..."
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-text">
              Contact Information
            </h3>

            <div className="space-y-4">
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, phone: e.target.value },
                  })
                }
                className="input w-full"
                placeholder="Phone number"
              />
              <input
                type="email"
                value={formData.contact.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, email: e.target.value },
                  })
                }
                className="input w-full"
                placeholder="Email address"
              />
              <input
                type="tel"
                value={formData.contact.whatsapp}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, whatsapp: e.target.value },
                  })
                }
                className="input w-full"
                placeholder="WhatsApp number"
              />
              <input
                type="url"
                value={formData.contact.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, website: e.target.value },
                  })
                }
                className="input w-full"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-text">
              Main Location
            </h3>

            <div className="space-y-4">
              <select
                value={formData.locations[0].emirate}
                onChange={(e) => {
                  const newLocs = [...formData.locations];
                  newLocs[0].emirate = e.target.value;
                  setFormData({ ...formData, locations: newLocs });
                }}
                className="input w-full"
              >
                <option value="">Select emirate...</option>
                {EMIRATES.map((em) => (
                  <option key={em.slug} value={em.name}>
                    {em.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={formData.locations[0].city}
                onChange={(e) => {
                  const newLocs = [...formData.locations];
                  newLocs[0].city = e.target.value;
                  setFormData({ ...formData, locations: newLocs });
                }}
                className="input w-full"
                placeholder="City"
              />

              <input
                type="text"
                value={formData.locations[0].area}
                onChange={(e) => {
                  const newLocs = [...formData.locations];
                  newLocs[0].area = e.target.value;
                  setFormData({ ...formData, locations: newLocs });
                }}
                className="input w-full"
                placeholder="Area / District"
              />

              <textarea
                value={formData.locations[0].address}
                onChange={(e) => {
                  const newLocs = [...formData.locations];
                  newLocs[0].address = e.target.value;
                  setFormData({ ...formData, locations: newLocs });
                }}
                className="input w-full"
                placeholder="Full address"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.name || !formData.categoryId}
            className="btn-primary w-full"
          >
            {loading ? 'Creating...' : 'Create Business Page'}
          </button>
        </form>
      </div>
    </div>
  );
}
