'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Report {
  id: string;
  reporterId: string;
  reason: string;
  message: string | null;
  status: 'NEW' | 'REVIEWING' | 'ACTIONED' | 'DISMISSED';
  createdAt: string;
  targetPersonalProfileId: string | null;
  targetBusinessPageId: string | null;
  reporter: { email: string };
  targetPersonalProfile: {
    userId: string;
    name: string;
    username: string;
  } | null;
  targetBusinessPage: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('NEW');
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`/api/reports?status=${filterStatus}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load reports');
          return;
        }

        setReports(data.data || []);
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchReports();
  }, [filterStatus]);

  const handleAction = async (reportId: string, action: 'approve' | 'suspend') => {
    setActingOn(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIONED',
          action: action === 'suspend' ? 'suspend' : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Action failed');
        return;
      }

      setReports(reports.filter(r => r.id !== reportId));
    } catch (err) {
      alert('Network error');
    } finally {
      setActingOn(null);
    }
  };

  return (
    <main className="container-content">
      <h1 className="text-3xl font-bold text-primary mb-8">
        Moderation Queue
      </h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {['NEW', 'REVIEWING', 'ACTIONED', 'DISMISSED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filterStatus === status
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">
          Loading reports...
        </div>
      ) : error ? (
        <div className="card rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary">No reports in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="card">
              <div className="grid gap-4 md:grid-cols-4">
                {/* Target Info */}
                <div>
                  <h3 className="font-semibold text-sm text-text mb-1">
                    Target
                  </h3>
                  {report.targetPersonalProfile ? (
                    <Link
                      href={`/profile/${report.targetPersonalProfile.username}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {report.targetPersonalProfile.name}
                    </Link>
                  ) : (
                    <Link
                      href={`/business/${report.targetBusinessPage?.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {report.targetBusinessPage?.name}
                    </Link>
                  )}
                </div>

                {/* Report Details */}
                <div>
                  <h3 className="font-semibold text-sm text-text mb-1">
                    Reason
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {report.reason.replace(/_/g, ' ')}
                  </p>
                </div>

                {/* Reporter */}
                <div>
                  <h3 className="font-semibold text-sm text-text mb-1">
                    Reported By
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {report.reporter.email}
                  </p>
                </div>

                {/* Actions */}
                <div>
                  <h3 className="font-semibold text-sm text-text mb-1">
                    Actions
                  </h3>
                  {filterStatus === 'NEW' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAction(report.id, 'approve')}
                        disabled={actingOn === report.id}
                        className="btn-secondary py-1 px-2 text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'suspend')}
                        disabled={actingOn === report.id}
                        className="btn-primary py-1 px-2 text-xs"
                      >
                        Suspend
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {report.message && (
                <div className="mt-4 p-3 rounded-lg bg-bg-secondary text-sm">
                  <p className="font-medium text-text-secondary mb-1">
                    Message:
                  </p>
                  <p className="text-text">{report.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
