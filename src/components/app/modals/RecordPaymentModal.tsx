"use client";

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppData } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export default function RecordPaymentModal({ isOpen, onClose, sale }: RecordPaymentModalProps) {
  const { recordPayment } = useAppData();
  const { toast } = useToast();
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (sale) {
      setAmount(sale.due);
    }
  }, [sale]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;
    if (amount <= 0 || amount > sale.due) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: `Payment must be between ₹0.01 and ₹${sale.due.toFixed(2)}`});
      return;
    }
    recordPayment(sale.id, amount);
    toast({ title: "Payment Recorded", description: `₹${amount.toFixed(2)} recorded for sale #${sale.id}.`});
    onClose();
  };

  if (!isOpen || !sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Due Payment</DialogTitle>
          {sale && (
            <DialogDescription>
              Record a payment for Sale ID <strong>#{sale.id}</strong> with a current due of <strong className="text-destructive">₹{sale.due.toFixed(2)}</strong>.
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <Input 
              id="paymentAmount" 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              max={sale.due}
              step="0.01"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Record Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
