import type { AppData } from './types';

export const initialData: AppData = {
  settings: {
    shopName: 'SwiftSale Pro',
    shopAddress: '123 Business Avenue, Commerce City',
    shopPhone: '+1 (555) 123-4567',
    shopGstin: '27ABCDE1234F1Z5',
    defaultTax: 5,
  },
  stock: [
    {
      sku: 'SS-TS-M-BLK',
      name: 'Black T-Shirt (M)',
      costPrice: 8,
      salePrice: 20,
      stock: 50,
      reorderLevel: 10,
      category: 'Apparel'
    },
    {
      sku: 'SS-MUG-WHT-01',
      name: 'Ceramic Coffee Mug',
      costPrice: 4,
      salePrice: 12,
      stock: 4,
      reorderLevel: 5,
      category: 'Homeware'
    },
    {
      sku: 'SS-NB-LG-RUL',
      name: 'Large Ruled Notebook',
      costPrice: 3,
      salePrice: 7,
      stock: 100,
      reorderLevel: 20,
      category: 'Stationery'
    },
  ],
  customers: [
    { id: 1, name: 'John Doe (Sample)', phone: '555-0101', address: '123 Oak St', due: 0 },
    { id: 2, name: 'Jane Smith (Sample)', phone: '555-0102', address: '456 Pine St', due: 25.50 },
  ],
  sales: [],
  expenses: [
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      title: 'Monthly Rent',
      category: 'Utilities',
      amount: 1500,
    },
  ],
  nextIds: {
    sale: 1,
    customer: 3,
    expense: 2,
  },
};
