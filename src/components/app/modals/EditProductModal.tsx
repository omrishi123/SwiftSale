"use client";

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppData } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StockItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: StockItem | null;
}

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sku: z.string(),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative"),
  salePrice: z.coerce.number().min(0, "Sale price must be non-negative"),
  reorderLevel: z.coerce.number().min(0, "Reorder level must be non-negative"),
  category: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const { updateStockItem } = useAppData();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (product) {
      reset(product);
    }
  }, [product, reset]);

  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    if (product) {
      updateStockItem({ ...product, ...data });
      toast({
        title: "Product Updated",
        description: `${data.name} has been successfully updated.`
      })
    }
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...register('category')} />
              </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (₹)</Label>
              <Input id="costPrice" type="number" step="0.01" {...register('costPrice')} />
              {errors.costPrice && <p className="text-destructive text-sm">{errors.costPrice.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price (₹)</Label>
              <Input id="salePrice" type="number" step="0.01" {...register('salePrice')} />
              {errors.salePrice && <p className="text-destructive text-sm">{errors.salePrice.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input id="reorderLevel" type="number" {...register('reorderLevel')} />
              {errors.reorderLevel && <p className="text-destructive text-sm">{errors.reorderLevel.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
