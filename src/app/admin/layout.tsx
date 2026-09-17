'use client';

import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Logout failed');
        return;
      }

      // Redirect to home or login page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Network error during logout');
    }
  };

  return (
    <>
      {/* Admin Header */}
      <header className="border-b border-border bg-bg-secondary sticky top-0 z-10">
        <div className="container-content py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>

          {/* Logout Form */}
          <form onSubmit={handleLogout}>
            <button
              type="submit"
              className="btn-primary py-2 px-4 text-sm"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* Admin Content */}
      <div className="bg-bg">
        {children}
      </div>
    </>
  );
}
