"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import useScript from '@/hooks/use-script';

declare global {
  interface Window {
    Html5Qrcode: any;
    Html5QrcodeScanner: any;
  }
}

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const status = useScript("https://unpkg.com/html5-qrcode/html5-qrcode.min.js");
  const scannerRef = useRef<any>(null);
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [message, setMessage] = useState("Initializing scanner...");

  // This effect will run when the modal is opened and the script is ready
  useEffect(() => {
    if (!isOpen || status !== 'ready') {
      return;
    }

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
      onScan(decodedText);
      onClose(); // Close the modal on successful scan
    };

    const onScanFailure = (error: any) => {
      // This is called frequently, so we don't do anything here to avoid spamming logs.
    };

    // We instantiate the scanner here, which will also handle the permission request.
    const html5QrcodeScanner = new window.Html5QrcodeScanner(
      "scanner-container",
      { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [0] }, // 0 for QR/Barcode
      false // verbose
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = html5QrcodeScanner;

    // The library itself will handle the permission prompt.
    // We can't reliably track permission status from here,
    // so we'll just let the user see the scanner UI or the permission prompt.
    setMessage("Place a barcode inside the box.");

    // Cleanup function when the component unmounts or the modal closes
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: any) => {
          console.error("Failed to clear scanner.", error);
        });
        scannerRef.current = null;
      }
    };
  }, [isOpen, status, onScan, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div id="scanner-container" className="w-full aspect-video bg-muted rounded-md overflow-hidden" />
      </DialogContent>
    </Dialog>
  );
}