'use client';

import { useEffect, useState } from 'react';

interface VerificationStatus {
  type: 'EMAIL' | 'PHONE' | 'TRADELIT';
  verified: boolean;
  verifiedAt: string | null;
}

export default function VerificationPage() {
  const [status, setStatus] = useState<VerificationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // TODO: Get userId from session
  const userId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('userId')
    : null;

  const [tradelicenseForm, setTradelicenseForm] = useState({
    licenseNumber: '',
    licenseExpiryDate: '',
    businessName: '',
  });

  useEffect(() => {
    if (!userId) return;

    const fetchStatus = async () => {
      try {
        // TODO: Create GET endpoint to fetch all verifications for user
        setStatus([
          { type: 'EMAIL', verified: true, verifiedAt: new Date().toISOString() },
          { type: 'PHONE', verified: true, verifiedAt: new Date().toISOString() },
          {
            type: 'TRADELIT',
            verified: false,
            verifiedAt: null,
          },
        ]);
      } catch (err) {
        setError('Failed to load verification status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [userId]);

  const handleSubmitTradelicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/verify/tradelicense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...tradelicenseForm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit trade license');
        return;
      }

      alert('Trade license submitted for verification!');
      setTradelicenseForm({
        licenseNumber: '',
        licenseExpiryDate: '',
        businessName: '',
      });

      // Refresh status
      setStatus(status =>
        status.map(s =>
          s.type === 'TRADELIT' ? { ...s, verified: false } : s
        )
      );
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <main className="container-content max-w-2xl">
        <div className="card text-center py-8">
          <p className="text-text-secondary">
            Please sign in to manage verification
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container-content max-w-3xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">Verification</h1>

        {error && (
          <div className="card rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Verification Status */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-primary">
            Status
          </h2>

          {loading ? (
            <p className="text-text-secondary">Loading...</p>
          ) : (
            <div className="space-y-3">
              {status.map(v => (
                <div
                  key={v.type}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <h3 className="font-medium text-text">
                      {v.type === 'EMAIL' && '📧 Email Address'}
                      {v.type === 'PHONE' && '📱 Phone Number'}
                      {v.type === 'TRADELIT' && '🏢 Trade License'}
                    </h3>
                    {v.verifiedAt && (
                      <p className="text-sm text-text-secondary">
                        Verified on{' '}
                        {new Date(v.verifiedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div>
                    {v.verified ? (
                      <span className="badge">✓ Verified</span>
                    ) : (
                      <span className="text-sm text-text-secondary">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trade License Form */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-primary">
            Trade License Verification
          </h2>

          <form onSubmit={handleSubmitTradelicense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text">
                License Number *
              </label>
              <input
                type="text"
                value={tradelicenseForm.licenseNumber}
                onChange={e =>
                  setTradelicenseForm({
                    ...tradelicenseForm,
                    licenseNumber: e.target.value,
                  })
                }
                className="input mt-1 w-full"
                placeholder="e.g., 123456789"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                Business Name
              </label>
              <input
                type="text"
                value={tradelicenseForm.businessName}
                onChange={e =>
                  setTradelicenseForm({
                    ...tradelicenseForm,
                    businessName: e.target.value,
                  })
                }
                className="input mt-1 w-full"
                placeholder="e.g., ABC Trading LLC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                License Expiry Date
              </label>
              <input
                type="date"
                value={tradelicenseForm.licenseExpiryDate}
                onChange={e =>
                  setTradelicenseForm({
                    ...tradelicenseForm,
                    licenseExpiryDate: e.target.value,
                  })
                }
                className="input mt-1 w-full"
              />
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              ℹ️ Your trade license information will be verified by our team.
              You'll receive a notification once verified.
            </div>

            <button
              type="submit"
              disabled={submitting || !tradelicenseForm.licenseNumber}
              className="btn-primary w-full"
            >
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </form>
        </div>

        {/* Note about verification badges */}
        <div className="card border-l-4 border-l-primary">
          <h3 className="font-semibold text-text mb-2">About Verification</h3>
          <p className="text-sm text-text-secondary">
            Verification badges (✓) help other users trust your profile and
            business information. We verify email, phone, and trade licenses to
            ensure authenticity.
          </p>
        </div>
      </div>
    </main>
  );
}
