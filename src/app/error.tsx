'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container-content flex items-center justify-center min-h-screen">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          Something Went Wrong
        </h1>
        <p className="text-text-secondary mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        {error.message && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 text-sm text-red-700 max-h-32 overflow-auto">
            {error.message}
          </div>
        )}
        <div className="space-y-2">
          <button onClick={reset} className="btn-primary w-full">
            Try Again
          </button>
          <Link href="/" className="btn-secondary w-full block">
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
