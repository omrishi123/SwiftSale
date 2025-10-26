'use client';

import React, { useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppData } from '@/contexts/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, QrCode } from 'lucide-react';
import { generateSkuAction } from '@/app/actions';
import ScannerModal from './ScannerModal';
import { useToast } from '@/hooks/use-toast';
import { StockItem } from '@/lib/types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().nonempty('SKU is required'),
  category: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'Cost price must be non-negative'),
  salePrice: z.coerce.number().min(0, 'Sale price must be non-negative'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  reorderLevel: z.coerce.number().min(0, 'Reorder level must be non-negative'),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AddProductModal({
  isOpen,
  onClose,
}: AddProductModalProps) {
  const { addStockItem } = useAppData();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      reorderLevel: 5,
      quantity: 1,
    },
  });

  const handleGenerateSku = async () => {
    setIsGenerating(true);
    const productName = getValues('name');
    const productCategory = getValues('category') || 'General';
    if (!productName) {
      toast({
        variant: 'destructive',
        title: 'Product name required',
        description: 'Please enter a product name to generate an SKU.',
      });
      setIsGenerating(false);
      return;
    }
    try {
      const sku = await generateSkuAction(productName, productCategory);
      setValue('sku', sku);
    } catch (error) {
      console.error('Failed to generate SKU', error);
      toast({
        variant: 'destructive',
        title: 'SKU Generation Failed',
        description:
          'Could not generate an AI-powered SKU. Please enter one manually.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onScan = useCallback(
    (decodedText: string) => {
      setValue('sku', decodedText);
      setIsScannerOpen(false); // Close scanner on successful scan
      toast({
        title: 'SKU Scanned',
        description: `SKU set to ${decodedText}`,
      });
    },
    [setValue, toast]
  );

  const handleScanSku = useCallback(() => {
    setIsScannerOpen(true);
  }, []);

  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    const { quantity, ...productData } = data;
    addStockItem(productData as Omit<StockItem, 'id'>, quantity);
    toast({
      title: 'Product Added',
      description: `${quantity} unit(s) of ${data.name} have been added to stock.`,
    });
    reset();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New Product / Stock</DialogTitle>
            <DialogDescription>
              Add a new product to your inventory or increase stock for an
              existing one by SKU.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Unique ID)</Label>
                <div className="flex gap-2">
                  <Input id="sku" {...register('sku')} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleScanSku}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateSku}
                    disabled={isGenerating}
                  >
                    <Sparkles
                      className={`h-4 w-4 ${
                        isGenerating ? 'animate-pulse' : ''
                      }`}
                    />
                  </Button>
                </div>
                {errors.sku && (
                  <p className="text-destructive text-sm">
                    {errors.sku.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (₹)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  {...register('costPrice')}
                />
                {errors.costPrice && (
                  <p className="text-destructive text-sm">
                    {errors.costPrice.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price (₹)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  {...register('salePrice')}
                />
                {errors.salePrice && (
                  <p className="text-destructive text-sm">
                    {errors.salePrice.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Apparel, Homeware"
                />
                {errors.category && (
                  <p className="text-destructive text-sm">
                    {errors.category.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity to Add</Label>
                <Input id="quantity" type="number" {...register('quantity')} />
                {errors.quantity && (
                  <p className="text-destructive text-sm">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  {...register('reorderLevel')}
                />
                {errors.reorderLevel && (
                  <p className="text-destructive text-sm">
                    {errors.reorderLevel.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={onScan}
      />
    </>
  );
}
