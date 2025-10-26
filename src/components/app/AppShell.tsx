
'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/app/MainLayout';
import { useUser } from '@/firebase';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-xl font-semibold">Loading SwiftSale Pro...</div>
      </div>
    );
  }

  return <MainLayout user={user}>{children}</MainLayout>;
}
