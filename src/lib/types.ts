export interface StockItem {
  id: string; // Document ID from Firestore
  sku: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  reorderLevel: number;
  category?: string;
}

export interface Customer {
  id: string; // Document ID from Firestore
  name: string;
  phone: string;
  address: string;
  due: number;
}

export interface SaleItem extends Omit<StockItem, 'stock' | 'reorderLevel'> {
  quantity: number;
}

export interface Sale {
  id:string; // Document ID from Firestore
  customerId: string;
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
  id: string; // Document ID from Firestore
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
  shopLogoUrl?: string;
}

export interface AppData {
  settings: AppSettings | null;
  stock: StockItem[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
}
