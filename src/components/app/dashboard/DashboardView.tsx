"use client"

import React, from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppData } from '@/contexts/AppContext';
import { ShoppingCart, PackagePlus, FilePlus2, BookText, IndianRupee, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ModalType } from '../MainLayout';

interface DashboardViewProps {
  openModal: (type: ModalType, data?: any) => void;
}

export default function DashboardView({ openModal }: DashboardViewProps) {
  const { appData } = useAppData();

  const today = new Date().toISOString().split('T')[0];
  const todaysSales = appData.sales.filter(s => new Date(s.date).toISOString().split('T')[0] === today);
  const todaysExpenses = appData.expenses.filter(e => e.date === today);

  const todayRevenue = todaysSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const grossProfit = todaysSales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalTodaysExpenses = todaysExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalTodaysExpenses;
  const totalDues = appData.customers.reduce((sum, cust) => sum + cust.due, 0);
  const stockValue = appData.stock.reduce((sum, item) => sum + (item.salePrice * item.stock), 0);

  const recentSales = appData.sales.slice(0, 5);
  const lowStockItems = appData.stock.filter(item => item.stock <= item.reorderLevel);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 md:gap-4">
        <Button onClick={() => openModal('newSale')}><ShoppingCart className="mr-2 h-4 w-4" /> New Sale</Button>
        <Button variant="secondary" onClick={() => openModal('addProduct')}><PackagePlus className="mr-2 h-4 w-4" /> Add Product</Button>
        <Button variant="secondary" onClick={() => openModal('addExpense')}><FilePlus2 className="mr-2 h-4 w-4" /> Add Expense</Button>
        <Button variant="outline"><BookText className="mr-2 h-4 w-4" /> Day-End Report</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Revenue" value={todayRevenue} />
        <StatCard title="Today's Net Profit" value={netProfit} />
        <StatCard title="Total Dues" value={totalDues} isNegative={totalDues > 0} />
        <StatCard title="Stock Value" value={stockValue} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {lowStockItems.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold text-lg flex items-center mb-2 text-yellow-500">
              <AlertTriangle className="mr-2 h-5 w-5" /> Low Stock Alerts
            </h3>
            <ul className="space-y-1 list-disc list-inside text-sm">
              {lowStockItems.map(item => (
                <li key={item.sku}>{item.name} (Stock: <span className="font-bold">{item.stock}</span>)</li>
              ))}
            </ul>
          </Card>
        )}
        
        <Card className="p-4 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-2">Recent Sales</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.length > 0 ? recentSales.map(sale => {
                const customer = appData.customers.find(c => c.id === sale.customerId);
                return (
                  <TableRow key={sale.id}>
                    <TableCell>#{sale.id}</TableCell>
                    <TableCell>{customer?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right">₹{sale.grandTotal.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-semibold ${sale.due > 0 ? 'text-destructive' : ''}`}>
                      ₹{sale.due.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No recent sales.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
