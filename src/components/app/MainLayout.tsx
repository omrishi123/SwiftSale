"use client";

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  BookText,
  FilePenLine,
  FilePlus2,
  LayoutDashboard,
  Package,
  PackagePlus,
  PanelLeft,
  ReceiptText,
  Settings as SettingsIcon,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/contexts/AppContext';

import DashboardView from '@/components/app/dashboard/DashboardView';
import StockView from '@/components/app/stock/StockView';
import SalesView from '@/components/app/sales/SalesView';
import CustomersView from '@/components/app/customers/CustomersView';
import ExpensesView from '@/components/app/expenses/ExpensesView';
import ReportsView from '@/components/app/reports/ReportsView';
import SettingsView from '@/components/app/settings/SettingsView';
import BillView from '@/components/app/sales/BillView';

import NewSaleModal from '@/components/app/modals/NewSaleModal';
import AddProductModal from '@/components/app/modals/AddProductModal';
import AddExpenseModal from '@/components/app/modals/AddExpenseModal';
import EditProductModal from '@/components/app/modals/EditProductModal';
import EditCustomerModal from '@/components/app/modals/EditCustomerModal';
import RecordPaymentModal from '@/components/app/modals/RecordPaymentModal';
import { ThemeToggle } from './ThemeToggle';
import type { StockItem, Customer, Sale } from '@/lib/types';


export type View = 'dashboard' | 'stock' | 'sales' | 'customers' | 'expenses' | 'reports' | 'settings' | 'bill';

export type ModalType = 'newSale' | 'addProduct' | 'addExpense' | 'editProduct' | 'editCustomer' | 'recordPayment';

export interface ModalState {
  type: ModalType | null;
  data?: any;
}

const MemoizedDashboardView = React.memo(DashboardView);
const MemoizedStockView = React.memo(StockView);
const MemoizedSalesView = React.memo(SalesView);
const MemoizedCustomersView = React.memo(CustomersView);
const MemoizedExpensesView = React.memo(ExpensesView);
const MemoizedReportsView = React.memo(ReportsView);
const MemoizedSettingsView = React.memo(SettingsView);


export default function MainLayout() {
  const { isLoaded } = useAppData();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [viewData, setViewData] = useState<any>(null);
  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });

  const openModal = (type: ModalType, data?: any) => setModalState({ type, data });
  const closeModal = () => setModalState({ type: null, data: null });

  const changeView = (view: View, data?: any) => {
    setActiveView(view);
    setViewData(data);
  };

  const viewConfig = useMemo(() => ({
    dashboard: { title: 'Dashboard', icon: LayoutDashboard, component: <MemoizedDashboardView openModal={openModal} /> },
    stock: { title: 'Stock', icon: Package, component: <MemoizedStockView openModal={openModal} /> },
    sales: { title: 'Sales', icon: ReceiptText, component: <MemoizedSalesView openModal={openModal} changeView={changeView}/> },
    customers: { title: 'Customers', icon: Users, component: <MemoizedCustomersView openModal={openModal} /> },
    expenses: { title: 'Expenses', icon: Wallet, component: <MemoizedExpensesView openModal={openModal} /> },
    reports: { title: 'Reports', icon: AreaChart, component: <MemoizedReportsView /> },
    settings: { title: 'Settings', icon: SettingsIcon, component: <MemoizedSettingsView /> },
    bill: { title: 'Sale Invoice', icon: ReceiptText, component: <BillView sale={viewData as Sale} changeView={changeView} /> },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [viewData]);

  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'sales', label: 'Sales', icon: ReceiptText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'reports', label: 'Reports', icon: AreaChart },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ], []);

  const ActiveComponent = React.useMemo(() => viewConfig[activeView].component, [activeView, viewConfig]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-xl font-semibold">Loading SwiftSale Pro...</div>
      </div>
    );
  }
  
  if (activeView === 'bill') {
    return ActiveComponent;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <h2 className="text-2xl font-bold text-primary px-2">SwiftSale<span className="text-foreground">Pro</span></h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton 
                  onClick={() => changeView(item.id as View)} 
                  isActive={activeView === item.id}
                  tooltip={{ children: item.label, side:'right' }}
                  className="justify-start"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-2xl font-bold hidden sm:block">{viewConfig[activeView].title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => openModal('newSale')}><ShoppingCart className="mr-2 h-4 w-4" /> New Sale</Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {ActiveComponent}
        </main>
      </SidebarInset>
      
      {/* Modals */}
      <NewSaleModal isOpen={modalState.type === 'newSale'} onClose={closeModal} openModal={openModal} changeView={changeView} />
      <AddProductModal isOpen={modalState.type === 'addProduct'} onClose={closeModal} openModal={openModal}/>
      <AddExpenseModal isOpen={modalState.type === 'addExpense'} onClose={closeModal} />
      <EditProductModal isOpen={modalState.type === 'editProduct'} onClose={closeModal} product={modalState.data as StockItem} />
      <EditCustomerModal isOpen={modalState.type === 'editCustomer'} onClose={closeModal} customer={modalState.data as Customer} />
      <RecordPaymentModal isOpen={modalState.type === 'recordPayment'} onClose={closeModal} sale={modalState.data as Sale} />
    </SidebarProvider>
  );
}
