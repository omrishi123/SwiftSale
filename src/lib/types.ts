export interface StockItem {
  sku: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  reorderLevel: number;
  category?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  due: number;
}

export interface SaleItem extends StockItem {
  quantity: number;
}

export interface Sale {
  id: number;
  customerId: number;
  items: SaleItem[];
  profit: number;
  subtotal: number;
  discount: number;
  taxRate: number;
  gstAmount: number;
  grandTotal: number;
  amountPaid: number;
  due: number;
  paymentMode: 'Cash' | 'Card' | 'UPI';
  date: string; // ISO string
}

export interface Expense {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  category: string;
  amount: number;
}

export interface AppSettings {
  shopName?: string;
  shopGstin?: string;
  shopPhone?: string;
  shopAddress?: string;
  defaultTax?: number;
}

export interface AppData {
  settings: AppSettings;
  stock: StockItem[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  nextIds: {
    sale: number;
    customer: number;
    expense: number;
  };
}
