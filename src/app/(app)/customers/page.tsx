'use client';

import React, { useState } from 'react';
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
import { CreditCard, Eye, FilePenLine, Trash2 } from 'lucide-react';
import type { ModalType } from '@/components/app/MainLayout';
import type { Customer, Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CustomersViewProps {
  openModal: (type: ModalType, data?: any) => void;
}

export default function CustomersPage({ openModal }: CustomersViewProps) {
  const { appData, deleteCustomer } = useAppData();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const handleSelectCustomer = (customer: Customer) => {
    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer(null);
    } else {
      setSelectedCustomer(customer);
    }
  };

  const handleDelete = (customerId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this customer? This action cannot be undone.'
      )
    ) {
      return;
    }
    deleteCustomer(customerId);
    toast({
      title: 'Customer Deleted',
      description: 'The customer has been successfully deleted.',
    });
  };

  const customerSales = selectedCustomer
    ? appData.sales.filter((s) => s.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appData.customers.map((cust) => (
                  <TableRow
                    key={cust.id}
                    className={
                      selectedCustomer?.id === cust.id ? 'bg-primary/10' : ''
                    }
                  >
                    <TableCell className="font-medium">{cust.name}</TableCell>
                    <TableCell>{cust.phone}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        cust.due > 0 ? 'text-destructive' : ''
                      }`}
                    >
                      ₹{cust.due.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSelectCustomer(cust)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal('editCustomer', cust)}
                      >
                        <FilePenLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(cust.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>Sales History for {selectedCustomer.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSales.length > 0 ? (
                    customerSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>#{sale.id}</TableCell>
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
                          {sale.due > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openModal('recordPayment', sale)}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No sales history for this customer.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
