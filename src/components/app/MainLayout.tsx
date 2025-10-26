'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AreaChart,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings as SettingsIcon,
  ShoppingCart,
  Users,
  Wallet,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/contexts/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

import CustomersPage from '@/app/(app)/customers/page';
import ExpensesPage from '@/app/(app)/expenses/page';
import ReportsPage from '@/app/(app)/reports/page';
import SalesPage from '@/app/(app)/sales/page';
import SettingsPage from '@/app/(app)/settings/page';
import StockPage from '@/app/(app)/stock/page';
import DashboardPage from '@/app/(app)/page';

import NewSaleModal from '@/components/app/modals/NewSaleModal';
import AddProductModal from '@/components/app/modals/AddProductModal';
import AddExpenseModal from '@/components/app/modals/AddExpenseModal';
import EditProductModal from '@/components/app/modals/EditProductModal';
import EditCustomerModal from '@/components/app/modals/EditCustomerModal';
import RecordPaymentModal from '@/components/app/modals/RecordPaymentModal';
import { ThemeToggle } from './ThemeToggle';
import type { StockItem, Customer, Sale } from '@/lib/types';
import type { User } from 'firebase/auth';

export type ModalType =
  | 'newSale'
  | 'addProduct'
  | 'addExpense'
  | 'editProduct'
  | 'editCustomer'
  | 'recordPayment';

export interface ModalState {
  type: ModalType | null;
  data?: any;
}

export default function MainLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const { appData, isLoaded } = useAppData();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });

  const openModal = (type: ModalType, data?: any) =>
    setModalState({ type, data });
  const closeModal = () => setModalState({ type: null, data: null });

  const navItems = useMemo(
    () => [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/stock', label: 'Stock', icon: Package },
      { href: '/sales', label: 'Sales', icon: ReceiptText },
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/expenses', label: 'Expenses', icon: Wallet },
      { href: '/reports', label: 'Reports', icon: AreaChart },
    ],
    []
  );
  
  const settingsNav = { href: '/settings', label: 'Settings', icon: SettingsIcon };


  const activePage =
    [...navItems, settingsNav].find((item) => item.href === pathname)?.label || 'Dashboard';

  const pageContent = React.useMemo(() => {
    // Check for loading state first to ensure hooks are called unconditionally
    if (!isLoaded || !user) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-xl font-semibold">Loading SwiftSale Pro...</div>
        </div>
      );
    }

    switch (pathname) {
      case '/customers':
        return <CustomersPage openModal={openModal} />;
      case '/expenses':
        return <ExpensesPage />;
      case '/reports':
        return <ReportsPage />;
      case '/sales':
        return <SalesPage openModal={openModal} />;
      case '/settings':
        return <SettingsPage />;
      case '/stock':
        return <StockPage openModal={openModal} />;
      case '/':
        return <DashboardPage openModal={openModal} />;
      default:
        // This will render the content for routes like /sales/[saleId]
        // We pass the user prop down to children that might need it
        return React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // @ts-ignore
            return React.cloneElement(child, { user });
          }
          return child;
        });
    }
  }, [pathname, openModal, children, isLoaded, user]);

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-xl font-semibold">Loading SwiftSale Pro...</div>
      </div>
    );
  }

  const shopNameInitial = appData.settings?.shopName
    ? appData.settings.shopName.charAt(0).toUpperCase()
    : 'S';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <h2 className="text-2xl font-bold text-primary px-2">
            SwiftSale<span className="text-foreground">Pro</span>
          </h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right' }}
                    className="justify-start"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarHeader>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href={settingsNav.href}>
                    <SidebarMenuButton
                        isActive={pathname === settingsNav.href}
                        tooltip={{ children: settingsNav.label, side: 'right' }}
                        className="justify-start mt-auto"
                    >
                        <settingsNav.icon />
                        <span>{settingsNav.label}</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-2xl font-bold hidden sm:block">{activePage}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => openModal('addProduct')}>
              Add Product
            </Button>
            <Button size="sm" onClick={() => openModal('newSale')}>
              <ShoppingCart className="mr-2 h-4 w-4" /> New Sale
            </Button>
            <ThemeToggle />
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={appData.settings?.shopLogoUrl} alt={appData.settings?.shopName} />
                    <AvatarFallback>{shopNameInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{appData.settings?.shopName || "Shop"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut(auth)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{pageContent}</main>
      </SidebarInset>

      {/* Modals */}
      <NewSaleModal
        isOpen={modalState.type === 'newSale'}
        onClose={closeModal}
        openModal={openModal}
      />
      <AddProductModal
        isOpen={modalState.type === 'addProduct'}
        onClose={closeModal}
      />
      <AddExpenseModal
        isOpen={modalState.type === 'addExpense'}
        onClose={closeModal}
      />
      <EditProductModal
        isOpen={modalState.type === 'editProduct'}
        onClose={closeModal}
        product={modalState.data as StockItem}
      />
      <EditCustomerModal
        isOpen={modalState.type === 'editCustomer'}
        onClose={closeModal}
        customer={modalState.data as Customer}
      />
      <RecordPaymentModal
        isOpen={modalState.type === 'recordPayment'}
        onClose={closeModal}
        sale={modalState.data as Sale}
      />
    </SidebarProvider>
  );
}
