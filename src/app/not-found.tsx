import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container-content flex items-center justify-center min-h-screen">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          Page Not Found
        </h1>
        <p className="text-text-secondary mb-6">
          The page you're looking for doesn't exist or has been removed.
        </p>
        <div className="space-y-2">
          <Link href="/" className="btn-primary w-full block">
            Go Home
          </Link>
          <Link href="/search" className="btn-secondary w-full block">
            Search Profiles
          </Link>
        </div>
      </div>
    </main>
  );
}
