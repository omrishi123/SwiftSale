'use client';

import React from 'react';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer } from 'lucide-react';
import type { ModalType } from '@/components/app/MainLayout';
import { Sale } from '@/lib/types';
import Link from 'next/link';

interface SalesViewProps {
  openModal: (type: ModalType, data?: any) => void;
}

export default function SalesPage({ openModal }: SalesViewProps) {
  const { appData } = useAppData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Full Sales History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appData.sales.length > 0 ? (
                appData.sales.map((sale) => {
                  const customer = appData.customers.find(
                    (c) => c.id === sale.customerId
                  );
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>#{sale.id}</TableCell>
                      <TableCell>{customer?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(sale.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{sale.grandTotal.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          sale.due > 0 ? 'text-destructive' : ''
                        }`}
                      >
                        ₹{sale.due.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/sales/${sale.id}`} passHref>
                          <Button variant="ghost" size="icon">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No sales recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
