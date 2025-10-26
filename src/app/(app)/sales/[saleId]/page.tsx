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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Link from 'next/link';

interface BillPageProps {
  params: {
    saleId: string;
  };
}

export default function BillPage({ params }: BillPageProps) {
  const { appData } = useAppData();
  const sale = appData.sales.find((s) => s.id === params.saleId);
  const customer = sale
    ? appData.customers.find((c) => c.id === sale.customerId)
    : null;
  const settings = appData.settings;

  const handlePrint = () => {
    document.body.classList.add('printing-bill');
    window.print();
    document.body.classList.remove('printing-bill');
  };

  const handleDownload = () => {
    const input = document.getElementById('bill-content');
    if (input) {
      document.body.classList.add('printing-bill');

      setTimeout(() => {
        html2canvas(input, {
          scale: 3,
          useCORS: true,
          logging: false,
          width: input.offsetWidth,
          height: input.offsetHeight,
        })
          .then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const canvasAspectRatio = canvasWidth / canvasHeight;

            let imgWidth = pdfWidth;
            let imgHeight = pdfWidth / canvasAspectRatio;

            if (imgHeight > pdfHeight) {
              imgHeight = pdfHeight;
              imgWidth = pdfHeight * canvasAspectRatio;
            }

            const xOffset = (pdfWidth - imgWidth) / 2;
            const yOffset = 0;

            pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
            pdf.save(`invoice-${sale?.id}.pdf`);
          })
          .catch((err) => {
            console.error('Error generating PDF:', err);
          })
          .finally(() => {
            document.body.classList.remove('printing-bill');
          });
      }, 100);
    }
  };

  if (!sale || !customer) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Sale Not Found</h1>
        <p>The requested sale could not be found.</p>
        <Link href="/sales" passHref>
          <Button className="mt-4">
            <ArrowLeft className="mr-2" /> Back to Sales
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center p-4 sm:p-8 print:hidden">
        <Link href="/sales" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2" /> Back to Sales
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button onClick={handleDownload}>
            <Download className="mr-2" /> Download
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2" /> Print Bill
          </Button>
        </div>
      </div>
      <div className="bill-container-wrapper">
        <div className="bill-container" id="bill-content">
          <header className="grid grid-cols-2 items-start pb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {settings?.shopName || 'Your Shop'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {settings?.shopAddress}
              </p>
              <p className="text-muted-foreground text-sm">
                Phone: {settings?.shopPhone}
              </p>
              {settings?.shopGstin && (
                <p className="text-muted-foreground text-sm">
                  GSTIN: {settings.shopGstin}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold">Invoice</h2>
              <p className="text-muted-foreground">Invoice #: {sale.id}</p>
              <p className="text-muted-foreground">
                Date: {new Date(sale.date).toLocaleDateString()}
              </p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-4 py-4 border-y">
            <div>
              <h3 className="font-semibold mb-1">Bill To:</h3>
              <p>{customer?.name}</p>
              <p className="text-muted-foreground text-sm">
                {customer?.address}
              </p>
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
                {sale.items.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      ₹{item.salePrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(item.salePrice * item.quantity).toFixed(2)}
                    </TableCell>
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
                <span className="text-muted-foreground">
                  GST ({sale.taxRate}%)
                </span>
                <span>+ ₹{sale.gstAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span>₹{sale.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Amount Paid ({sale.paymentMode})
                </span>
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
