'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { AppProvider } from '@/contexts/AppContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { usePathname } from 'next/navigation';
import AppShell from '@/components/app/AppShell';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<{
    firebaseApp: any;
    auth: any;
    firestore: any;
  } | null>(null);

  useEffect(() => {
    // This effect runs only once on the client after the component mounts
    if (typeof window !== 'undefined') {
      setFirebaseServices(initializeFirebase());
    }
  }, []);

  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');

  if (!firebaseServices) {
    // Render a loading state or null on the server and during initial client render
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <AppProvider>
        <ModalProvider>
          {isAuthPage ? children : <AppShell>{children}</AppShell>}
        </ModalProvider>
      </AppProvider>
    </FirebaseProvider>
  );
}
