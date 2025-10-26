'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { QrCode, Plus, Minus, Trash2 } from 'lucide-react';
import type { Customer, SaleItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { ModalType } from '../MainLayout';
import ScannerModal from './ScannerModal';
import { useRouter } from 'next/navigation';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  openModal: (type: ModalType, data?: any) => void;
}

export default function NewSaleModal({
  isOpen,
  onClose,
  openModal,
}: NewSaleModalProps) {
  const { appData, addSale, addCustomer } = useAppData();
  const router = useRouter();
  const { toast } = useToast();
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [selectedProductSku, setSelectedProductSku] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(appData.settings?.defaultTax || 0);
  const [amountPaid, setAmountPaid] = useState<number | string>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'UPI'>(
    'Cash'
  );
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTaxRate(appData.settings?.defaultTax || 0);
    } else {
      // Reset state on close
      setSaleItems([]);
      setIsNewCustomer(true);
      setSelectedCustomerId('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setSelectedProductSku('');
      setQuantity(1);
      setDiscount(0);
      setAmountPaid('');
      setPaymentMode('Cash');
    }
  }, [isOpen, appData.settings]);

  const availableProducts = useMemo(
    () => appData.stock.filter((p) => p.stock > 0),
    [appData.stock]
  );

  const updateItemQuantity = useCallback((sku: string, change: number) => {
    const itemInCart = saleItems.find((i) => i.sku === sku);
    const productInStock = appData.stock.find((p) => p.sku === sku);
    if (!productInStock) return;

    const currentQuantity = itemInCart?.quantity || 0;
    const newQuantity = currentQuantity + change;

    if (newQuantity > productInStock.stock) {
      toast({
        variant: 'destructive',
        title: 'Not enough stock',
        description: `Only ${productInStock.stock} units of ${productInStock.name} available.`,
      });
      return;
    }

    if (newQuantity <= 0) {
      setSaleItems((prev) => prev.filter((i) => i.sku !== sku));
    } else {
      if (itemInCart) {
        setSaleItems((prev) =>
          prev.map((i) =>
            i.sku === sku ? { ...i, quantity: newQuantity } : i
          )
        );
      } else {
        const {id, stock, reorderLevel, ...productData} = productInStock;
        setSaleItems((prev) => [...prev, { ...productData, quantity: newQuantity, id: productInStock.id }]);
      }
    }
  }, [saleItems, appData.stock, toast]);
  

  const handleAddItem = () => {
    if (!selectedProductSku) return;
    updateItemQuantity(selectedProductSku, quantity);
    setSelectedProductSku('');
    setQuantity(1);
  };


  const handleScanSku = useCallback(
    (sku: string) => {
      const product = appData.stock.find((p) => p.sku === sku);
      if (!product) {
        toast({
          variant: 'destructive',
          title: 'Product not found',
          description: `SKU ${sku} not in inventory.`,
        });
        setIsScannerOpen(false);
        return;
      }
      updateItemQuantity(sku, 1);
      setIsScannerOpen(false);
      toast({
        title: 'Product Added',
        description: `${product.name} added to cart.`,
      });
    },
    [appData.stock, toast, updateItemQuantity]
  );

  const financialSummary = useMemo(() => {
    const subtotal = saleItems.reduce(
      (sum, i) => sum + i.salePrice * i.quantity,
      0
    );
    const taxable = subtotal - discount;
    const gstAmount = taxable * (taxRate / 100);
    const grandTotal = taxable + gstAmount;
    const finalAmountPaid =
      typeof amountPaid === 'number' ? amountPaid : grandTotal;
    const due = grandTotal - finalAmountPaid;
    return { subtotal, taxable, gstAmount, grandTotal, due };
  }, [saleItems, discount, taxRate, amountPaid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let customer: Customer | null = null;
    if (isNewCustomer) {
      if (!newCustomerName) {
        toast({
          variant: 'destructive',
          title: 'Customer name is required for new customers.',
        });
        return;
      }
      customer = await addCustomer({
        name: newCustomerName,
        phone: newCustomerPhone,
        address: newCustomerAddress,
      });
    } else {
      if (!selectedCustomerId) {
        toast({
          variant: 'destructive',
          title: 'Please select an existing customer.',
        });
        return;
      }
      const existingCustomer = appData.customers.find((c) => c.id === selectedCustomerId);
      if(existingCustomer) customer = existingCustomer;
    }
    if (!customer) {
      toast({
        variant: 'destructive',
        title: 'Could not find or create customer.',
      });
      return;
    }
    if (saleItems.length === 0) {
      toast({ variant: 'destructive', title: 'Please add items to the sale.' });
      return;
    }

    const newSale = await addSale({
      customerId: customer.id,
      items: saleItems,
      subtotal: financialSummary.subtotal,
      discount,
      taxRate,
      gstAmount: financialSummary.gstAmount,
      grandTotal: financialSummary.grandTotal,
      amountPaid:
        typeof amountPaid === 'number'
          ? amountPaid
          : financialSummary.grandTotal,
      due: financialSummary.due < 0 ? 0 : financialSummary.due,
      paymentMode,
      date: new Date().toISOString(),
    });

    if (newSale) {
      toast({
        title: 'Sale Completed!',
        description: `Sale #${newSale.id} has been recorded.`,
      });
      onClose();
      router.push(`/sales/${newSale.id}`);
    } else {
      toast({ variant: 'destructive', title: 'Failed to complete sale.' });
    }
  };

  const handleOpenScanner = useCallback(() => {
    setIsScannerOpen(true);
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Sale</DialogTitle>
            <DialogDescription>
              Record a new transaction and generate a bill.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Customer Section */}
              <div className="space-y-2">
                <h4 className="font-semibold">Customer Details</h4>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    size="sm"
                    variant={isNewCustomer ? 'default' : 'outline'}
                    onClick={() => setIsNewCustomer(true)}
                  >
                    New
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!isNewCustomer ? 'default' : 'outline'}
                    onClick={() => setIsNewCustomer(false)}
                  >
                    Existing
                  </Button>
                </div>
                {isNewCustomer ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Customer Name (Required)"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Customer Phone"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                    />
                    <Textarea
                      placeholder="Customer Address"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                    />
                  </div>
                ) : (
                  <Select
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {appData.customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Separator />
              {/* Product Section */}
              <div className="space-y-2">
                <h4 className="font-semibold">Add Products</h4>
                <div className="flex gap-2">
                  <Select
                    value={selectedProductSku}
                    onValueChange={setSelectedProductSku}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((p) => (
                        <SelectItem key={p.sku} value={p.sku}>
                          {p.name} (In Stock: {p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-20"
                  />
                  <Button type="button" onClick={handleAddItem}>
                    Add
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenScanner}
                >
                  <QrCode className="mr-2 h-4 w-4" /> Scan Product & Add
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Sale Items</h4>
              <div className="border rounded-md p-2 h-48 overflow-y-auto space-y-2 bg-muted/50">
                {saleItems.length > 0 ? (
                  saleItems.map((item) => (
                    <div
                      key={item.sku}
                      className="flex items-center justify-between text-sm bg-background p-2 rounded-md"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">
                          ₹{item.salePrice.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          ₹{(item.salePrice * item.quantity).toFixed(2)}
                        </span>
                        <div className="flex items-center border rounded-md">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateItemQuantity(item.sku, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-1 text-xs">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateItemQuantity(item.sku, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => setSaleItems(prev => prev.filter(i => i.sku !== item.sku))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground pt-16">
                    No items added.
                  </p>
                )}
              </div>

              <div className="space-y-1 text-sm border rounded-md p-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{financialSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Discount (₹)</span>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(parseFloat(e.target.value) || 0)
                    }
                    className="h-7 w-24 text-right"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxable Amt</span>
                  <span>₹{financialSummary.taxable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">GST (%)</span>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(parseFloat(e.target.value) || 0)
                    }
                    className="h-7 w-24 text-right"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST Amount</span>
                  <span>₹{financialSummary.gstAmount.toFixed(2)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-bold text-base">
                  <span>Grand Total</span>
                  <span>₹{financialSummary.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Paid Amount</span>
                  <Input
                    type="number"
                    placeholder={financialSummary.grandTotal.toFixed(2)}
                    value={amountPaid}
                    onChange={(e) =>
                      setAmountPaid(
                        e.target.value === ''
                          ? ''
                          : parseFloat(e.target.value)
                      )
                    }
                    className="h-7 w-24 text-right"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Mode</span>
                  <Select
                    value={paymentMode}
                    onValueChange={(v: 'Cash' | 'Card' | 'UPI') =>
                      setPaymentMode(v)
                    }
                  >
                    <SelectTrigger className="h-7 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div
                  className={`flex justify-between font-bold text-base ${
                    financialSummary.due > 0 ? 'text-destructive' : ''
                  }`}
                >
                  <span>Amount Due</span>
                  <span>₹{financialSummary.due.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit}>
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanSku}
      />
    </>
  );
}
