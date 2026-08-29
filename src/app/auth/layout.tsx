import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - UAE Malayalees',
  description: 'Sign in to your UAE Malayalees account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">UAE Malayalees</h1>
          <p className="mt-2 text-text-secondary">
            Connect with the Malayalee community
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
