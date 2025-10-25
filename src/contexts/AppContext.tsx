"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { AppData, AppSettings, Customer, Expense, Sale, StockItem } from '@/lib/types';
import { initialData } from '@/lib/data';

interface AppContextType {
  appData: AppData;
  setAppData: React.Dispatch<React.SetStateAction<AppData>>;
  isLoaded: boolean;
  updateSettings: (newSettings: AppSettings) => void;
  addStockItem: (item: StockItem, quantity: number) => void;
  updateStockItem: (updatedItem: StockItem) => void;
  deleteStockItem: (sku: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'profit'>) => Sale;
  addCustomer: (customer: Omit<Customer, 'id' | 'due'>) => Customer;
  updateCustomer: (updatedCustomer: Omit<Customer, 'due'>) => void;
  deleteCustomer: (customerId: number) => boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  recordPayment: (saleId: number, amount: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appData, setAppData] = useState<AppData>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('swiftSaleProData');
      if (savedData) {
        setAppData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setAppData(initialData);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('swiftSaleProData', JSON.stringify(appData));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
      }
    }
  }, [appData, isLoaded]);

  const updateSettings = useCallback((newSettings: AppSettings) => {
    setAppData(prev => ({ ...prev, settings: newSettings }));
  }, []);
  
  const addStockItem = useCallback((item: StockItem, quantity: number) => {
    setAppData(prev => {
      const existingItem = prev.stock.find(p => p.sku === item.sku);
      if (existingItem) {
        const updatedStock = prev.stock.map(p => 
          p.sku === item.sku ? { ...p, stock: p.stock + quantity } : p
        );
        return { ...prev, stock: updatedStock };
      } else {
        return { ...prev, stock: [...prev.stock, { ...item, stock: quantity }] };
      }
    });
  }, []);

  const updateStockItem = useCallback((updatedItem: StockItem) => {
    setAppData(prev => ({
      ...prev,
      stock: prev.stock.map(p => p.sku === updatedItem.sku ? { ...p, ...updatedItem } : p)
    }));
  }, []);
  
  const deleteStockItem = useCallback((sku: string) => {
    setAppData(prev => ({
      ...prev,
      stock: prev.stock.filter(p => p.sku !== sku)
    }));
  }, []);

  const addSale = useCallback((saleData: Omit<Sale, 'id' | 'profit'>): Sale => {
    let newSale: Sale | null = null;
    setAppData(prev => {
      const profit = saleData.items.reduce((sum, i) => sum + ((i.salePrice - i.costPrice) * i.quantity), 0);
      const saleId = prev.nextIds.sale;
      newSale = { ...saleData, id: saleId, profit };
      
      const updatedStock = [...prev.stock];
      newSale.items.forEach(item => {
        const stockIndex = updatedStock.findIndex(p => p.sku === item.sku);
        if (stockIndex !== -1) {
          updatedStock[stockIndex] = { ...updatedStock[stockIndex], stock: updatedStock[stockIndex].stock - item.quantity };
        }
      });

      const updatedCustomers = prev.customers.map(c => 
        c.id === newSale!.customerId ? { ...c, due: c.due + newSale!.due } : c
      );

      return {
        ...prev,
        sales: [newSale, ...prev.sales],
        stock: updatedStock,
        customers: updatedCustomers,
        nextIds: { ...prev.nextIds, sale: saleId + 1 }
      };
    });
    return newSale!;
  }, []);
  
  const addCustomer = useCallback((customerData: Omit<Customer, 'id' | 'due'>): Customer => {
    let newCustomer: Customer | null = null;
    setAppData(prev => {
      const customerId = prev.nextIds.customer;
      newCustomer = { ...customerData, id: customerId, due: 0 };
      return {
        ...prev,
        customers: [...prev.customers, newCustomer],
        nextIds: { ...prev.nextIds, customer: customerId + 1 }
      };
    });
    return newCustomer!;
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Omit<Customer, 'due'>) => {
    setAppData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c)
    }));
  }, []);

  const deleteCustomer = useCallback((customerId: number) => {
    let canDelete = false;
    setAppData(prev => {
      const customer = prev.customers.find(c => c.id === customerId);
      if (!customer) return prev;

      if (customer.due > 0) {
        if (!confirm(`WARNING: This customer has a due of ₹${customer.due.toFixed(2)}. Are you sure you want to delete?`)) {
          canDelete = false;
          return prev;
        }
      } else {
         if (!confirm(`Are you sure you want to delete ${customer.name}?`)) {
          canDelete = false;
          return prev;
        }
      }

      canDelete = true;
      return {
        ...prev,
        customers: prev.customers.filter(c => c.id !== customerId)
      }
    });
    return canDelete;
  }, []);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    setAppData(prev => {
      const expenseId = prev.nextIds.expense;
      const newExpense = { ...expenseData, id: expenseId };
      return {
        ...prev,
        expenses: [newExpense, ...prev.expenses],
        nextIds: { ...prev.nextIds, expense: expenseId + 1 }
      };
    });
  }, []);

  const recordPayment = useCallback((saleId: number, amount: number) => {
    setAppData(prev => {
      const sale = prev.sales.find(s => s.id === saleId);
      if (!sale || amount <= 0 || amount > sale.due) {
        alert("Invalid payment amount.");
        return prev;
      }
      
      const updatedSales = prev.sales.map(s => s.id === saleId ? { ...s, due: s.due - amount, amountPaid: s.amountPaid + amount } : s);
      const updatedCustomers = prev.customers.map(c => c.id === sale.customerId ? { ...c, due: c.due - amount } : c);

      return {
        ...prev,
        sales: updatedSales,
        customers: updatedCustomers
      };
    });
  }, []);

  return (
    <AppContext.Provider value={{ appData, setAppData, isLoaded, updateSettings, addStockItem, updateStockItem, deleteStockItem, addSale, addCustomer, updateCustomer, deleteCustomer, addExpense, recordPayment }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppProvider');
  }
  return context;
};
