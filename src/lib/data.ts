import type { AppData } from './types';

// This data is now used as a fallback and for initializing new user accounts.
export const initialData: AppData = {
  settings: {
    shopName: 'My SwiftSale Shop',
    shopAddress: '123 Main Street',
    shopPhone: '555-123-4567',
    shopGstin: 'YOUR_GSTIN_HERE',
    defaultTax: 5,
  },
  stock: [],
  customers: [],
  sales: [],
  expenses: [],
  nextIds: {
    sale: '',
    customer: '',
    expense: '',
  },
};
