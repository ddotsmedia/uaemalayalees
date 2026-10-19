import type { Metadata } from 'next';

import './globals.css';

// Every page reads from Postgres/Redis, so render per request instead of prerendering at build time
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'UAE Malayalees - Connect with Malayalees in UAE',
  description: 'Discover and connect with Malayalee individuals and businesses across UAE',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-text transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
