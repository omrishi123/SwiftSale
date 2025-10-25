"use client";

import React from 'react';
import type { Sale } from '@/lib/types';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import type { View } from '../MainLayout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface BillViewProps {
  sale: Sale;
  changeView: (view: View, data?: any) => void;
}

export default function BillView({ sale, changeView }: BillViewProps) {
  const { appData } = useAppData();
  const customer = appData.customers.find(c => c.id === sale.customerId);
  const settings = appData.settings;

  const handlePrint = () => {
    document.body.classList.add('printing-bill');
    window.print();
    document.body.classList.remove('printing-bill');
  };
  
  const handleDownload = () => {
    const input = document.getElementById('bill-content');
    if (input) {
      // Temporarily apply print styles for PDF generation
      document.body.classList.add('printing-bill');

      html2canvas(input, {
        scale: 2, // Higher scale for better quality
        useCORS: true 
      }).then(canvas => {
        // Remove print styles right after canvas is created
        document.body.classList.remove('printing-bill');
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth;
        const height = width / ratio;
        
        if (height <= pdfHeight) {
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        } else {
            console.error("The bill content is too long to fit on a single PDF page.");
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        }

        pdf.save(`invoice-${sale.id}.pdf`);
      }).catch(err => {
        // Ensure styles are removed even if there's an error
        document.body.classList.remove('printing-bill');
        console.error("Error generating PDF:", err);
      });
    }
  };

  const handleBack = () => {
    changeView('sales');
  };

  return (
    <>
      <div className="flex justify-between items-center p-4 sm:p-8 print:hidden">
        <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2" /> Back to Sales</Button>
        <div className="flex gap-2">
          <Button onClick={handleDownload}><Download className="mr-2" /> Download</Button>
          <Button onClick={handlePrint}><Printer className="mr-2" /> Print Bill</Button>
        </div>
      </div>
      <div className="bill-container-wrapper">
        <div className="bill-container" id="bill-content">
          <header className="grid grid-cols-2 items-start pb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary">{settings.shopName || 'Your Shop'}</h1>
              <p className="text-muted-foreground text-sm">{settings.shopAddress}</p>
              <p className="text-muted-foreground text-sm">Phone: {settings.shopPhone}</p>
              {settings.shopGstin && <p className="text-muted-foreground text-sm">GSTIN: {settings.shopGstin}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold">Invoice</h2>
              <p className="text-muted-foreground">Invoice #: {sale.id}</p>
              <p className="text-muted-foreground">Date: {new Date(sale.date).toLocaleDateString()}</p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-4 py-4 border-y">
            <div>
              <h3 className="font-semibold mb-1">Bill To:</h3>
              <p>{customer?.name}</p>
              <p className="text-muted-foreground text-sm">{customer?.address}</p>
              <p className="text-muted-foreground text-sm">{customer?.phone}</p>
            </div>
          </div>
          
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map(item => (
                  <TableRow key={item.sku}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">₹{item.salePrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{(item.salePrice * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end pt-4">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span>- ₹{sale.discount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxable Value</span>
                <span>₹{(sale.subtotal - sale.discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({sale.taxRate}%)</span>
                <span>+ ₹{sale.gstAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span>₹{sale.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid ({sale.paymentMode})</span>
                <span>₹{sale.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-destructive">
                <span>Amount Due</span>
                <span>₹{sale.due.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <footer className="text-center text-xs text-muted-foreground pt-8 border-t mt-6">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice.</p>
          </footer>
        </div>
      </div>
    </>
  );
}
