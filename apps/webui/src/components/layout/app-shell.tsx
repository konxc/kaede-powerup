'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 1. Auth routes and Protected Console routes have their own dedicated group layouts
  const isDedicatedLayout =
    pathname.startsWith('/app') ||
    pathname.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/register';

  if (isDedicatedLayout) {
    return <>{children}</>;
  }

  // 2. Public Marketing & Documentation pages
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
