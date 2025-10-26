'use client';

import React, { useEffect, useRef } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/app/MainLayout';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isUserLoading || hasRedirected.current) {
      return;
    }

    if (!user) {
      router.push('/auth');
      return;
    }

    // Check if the user is new. A new user's creation time and last sign-in time are very close.
    // This is a reliable way to detect the first session.
    const creationTime = user.metadata.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : 0;
    const lastSignInTime = user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).getTime()
      : 0;

    // If the account was created in the last 60 seconds, redirect to settings
    if (lastSignInTime - creationTime < 60000) {
      hasRedirected.current = true;
      router.push('/settings');
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
