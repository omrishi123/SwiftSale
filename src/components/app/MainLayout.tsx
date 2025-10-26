'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AreaChart,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings as SettingsIcon,
  ShoppingCart,
  Users,
  Wallet,
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
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useAppData();
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
      { href: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
    []
  );

  const activePage =
    navItems.find((item) => item.href === pathname)?.label || 'Dashboard';
    
  const pageContent = React.useMemo(() => {
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
        return children;
    }
  }, [pathname, openModal, children]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-xl font-semibold">Loading SwiftSale Pro...</div>
      </div>
    );
  }

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
