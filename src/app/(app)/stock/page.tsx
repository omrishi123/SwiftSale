'use client';

import React, { useState } from 'react';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePenLine, Trash2 } from 'lucide-react';
import type { ModalType } from '@/components/app/MainLayout';
import { useToast } from '@/hooks/use-toast';

interface StockViewProps {
  openModal: (type: ModalType, data?: any) => void;
}

export default function StockPage({ openModal }: StockViewProps) {
  const { appData, deleteStockItem } = useAppData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStock =
    appData.stock?.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleDelete = (sku: string) => {
    if (
      confirm(
        'Are you sure you want to delete this product? This action cannot be undone.'
      )
    ) {
      deleteStockItem(sku);
      toast({
        title: 'Product Deleted',
        description: 'The product has been removed from your stock.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Stock List</CardTitle>
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.length > 0 ? (
                filteredStock.map((item) => (
                  <TableRow
                    key={item.sku}
                    className={
                      item.stock <= item.reorderLevel
                        ? 'bg-destructive/10 hover:bg-destructive/20'
                        : ''
                    }
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell className="text-right">{item.stock}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal('editProduct', item)}
                      >
                        <FilePenLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.sku)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No products found.
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
