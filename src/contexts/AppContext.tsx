'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import type {
  AppData,
  AppSettings,
  Customer,
  Expense,
  Sale,
  StockItem,
} from '@/lib/types';
import {
  useUser,
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { initialData } from '@/lib/data';

interface AppContextType {
  appData: AppData;
  isLoaded: boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addStockItem: (item: Omit<StockItem, 'sku'>, quantity: number) => void;
  updateStockItem: (updatedItem: StockItem) => void;
  deleteStockItem: (sku: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'profit'>) => Promise<Sale | null>;
  addCustomer: (
    customer: Omit<Customer, 'id' | 'due'>
  ) => Promise<Customer | null>;
  updateCustomer: (updatedCustomer: Omit<Customer, 'due'>) => void;
  deleteCustomer: (customerId: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  recordPayment: (saleId: string, amount: number) => void;
  setAppData: React.Dispatch<React.SetStateAction<AppData>>; // Exposed for import
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(
    () => (user ? doc(firestore, `users/${user.uid}/appData/settings`) : null),
    [firestore, user]
  );
  const { data: settings, isLoading: settingsLoading } =
    useDoc<AppSettings>(settingsRef);

  const stockCol = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/stock`) : null),
    [firestore, user]
  );
  const { data: stock, isLoading: stockLoading } =
    useCollection<StockItem>(stockCol);

  const customersCol = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/customers`) : null),
    [firestore, user]
  );
  const { data: customers, isLoading: customersLoading } =
    useCollection<Customer>(customersCol);

  const salesCol = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/sales`) : null),
    [firestore, user]
  );
  const { data: sales, isLoading: salesLoading } =
    useCollection<Sale>(salesCol);

  const expensesCol = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/expenses`) : null),
    [firestore, user]
  );
  const { data: expenses, isLoading: expensesLoading } =
    useCollection<Expense>(expensesCol);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // We consider the app "loaded" when we have the user and their essential settings.
    // The other collections can continue to load in the background.
    if (user && !settingsLoading) {
      setIsLoaded(true);
    }
  }, [user, settingsLoading]);

  const appData = useMemo<AppData>(() => {
    return {
      settings: settings || initialData.settings,
      stock: stock || [],
      customers: customers || [],
      sales: sales || [],
      expenses: expenses || [],
      nextIds: { sale: '', customer: '', expense: '' }, // Not used with Firestore
    };
  }, [settings, stock, customers, sales, expenses]);

  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      if (settingsRef) {
        updateDocumentNonBlocking(settingsRef, newSettings);
      }
    },
    [settingsRef]
  );

  const addStockItem = useCallback(
    (item: StockItem, quantity: number) => {
      if (!stockCol) return;
      const existingItem = stock?.find((p) => p.sku === item.sku);
      if (existingItem) {
        const docRef = doc(stockCol, existingItem.id);
        updateDocumentNonBlocking(docRef, { stock: existingItem.stock + quantity });
      } else {
        addDocumentNonBlocking(stockCol, { ...item, stock: quantity });
      }
    },
    [stockCol, stock]
  );

  const updateStockItem = useCallback(
    (updatedItem: StockItem) => {
      if (!stockCol) return;
      const docRef = doc(stockCol, updatedItem.id);
      const { id, ...data } = updatedItem;
      updateDocumentNonBlocking(docRef, data);
    },
    [stockCol]
  );

  const deleteStockItem = useCallback(
    (itemId: string) => {
      if (!stockCol) return;
      deleteDocumentNonBlocking(doc(stockCol, itemId));
    },
    [stockCol]
  );

  const addSale = useCallback(
    async (saleData: Omit<Sale, 'id' | 'profit'>): Promise<Sale | null> => {
      if (!salesCol || !customersCol || !stockCol) return null;

      const profit = saleData.items.reduce(
        (sum, i) => sum + (i.salePrice - i.costPrice) * i.quantity,
        0
      );

      try {
        const batch = writeBatch(firestore);

        const newSaleRef = doc(salesCol);
        const newSale: Sale = { ...saleData, id: newSaleRef.id, profit };
        batch.set(newSaleRef, newSale);

        saleData.items.forEach((item) => {
          const stockDocRef = doc(stockCol, item.id);
          const newStockLevel = item.stock - item.quantity;
          batch.update(stockDocRef, { stock: newStockLevel });
        });

        const customerRef = doc(customersCol, saleData.customerId);
        const customer = customers?.find((c) => c.id === saleData.customerId);
        if (customer) {
          batch.update(customerRef, { due: customer.due + saleData.due });
        }

        await batch.commit();
        return newSale;
      } catch (error) {
        console.error('Error adding sale:', error);
        return null;
      }
    },
    [salesCol, customersCol, stockCol, firestore, customers]
  );

  const addCustomer = useCallback(
    async (
      customerData: Omit<Customer, 'id' | 'due'>
    ): Promise<Customer | null> => {
      if (!customersCol) return null;
      try {
        const newCustomerRef = doc(customersCol);
        const newCustomer = {
          ...customerData,
          id: newCustomerRef.id,
          due: 0,
        };
        await setDocumentNonBlocking(newCustomerRef, newCustomer, {});
        return newCustomer;
      } catch (error) {
        console.error('Error adding customer:', error);
        return null;
      }
    },
    [customersCol]
  );

  const updateCustomer = useCallback(
    (updatedCustomer: Omit<Customer, 'due'>) => {
      if (!customersCol) return;
      const { id, ...data } = updatedCustomer;
      updateDocumentNonBlocking(doc(customersCol, id), data);
    },
    [customersCol]
  );

  const deleteCustomer = useCallback(
    (customerId: string) => {
      if (!customersCol) return;
      deleteDocumentNonBlocking(doc(customersCol, customerId));
    },
    [customersCol]
  );

  const addExpense = useCallback(
    (expenseData: Omit<Expense, 'id'>) => {
      if (!expensesCol) return;
      addDocumentNonBlocking(expensesCol, expenseData);
    },
    [expensesCol]
  );

  const recordPayment = useCallback(
    (saleId: string, amount: number) => {
      if (!salesCol || !customersCol) return;
      const sale = sales?.find((s) => s.id === saleId);
      if (!sale) return;

      const batch = writeBatch(firestore);

      const saleRef = doc(salesCol, saleId);
      batch.update(saleRef, {
        due: sale.due - amount,
        amountPaid: sale.amountPaid + amount,
      });

      const customerRef = doc(customersCol, sale.customerId);
      const customer = customers?.find((c) => c.id === sale.customerId);
      if (customer) {
        batch.update(customerRef, { due: customer.due - amount });
      }

      batch.commit().catch((err) => console.error('Payment failed: ', err));
    },
    [salesCol, customersCol, firestore, sales, customers]
  );

  // Dummy setAppData for import functionality - a more robust solution would be needed
  const setAppData = (data: AppData) => {
    // This is a complex operation with Firestore and is not fully implemented for this MVP.
    // A full implementation would involve batch writing all the imported data to the user's collections.
    console.warn(
      'setAppData from import is not fully implemented for Firestore.'
    );
  };

  return (
    <AppContext.Provider
      value={{
        appData,
        isLoaded,
        updateSettings,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        addSale,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addExpense,
        recordPayment,
        setAppData,
      }}
    >
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
