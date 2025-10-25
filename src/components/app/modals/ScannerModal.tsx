"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useScript from '@/hooks/use-script';
import { useToast } from '@/hooks/use-toast';

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

const SCANNER_REGION_ID = "html5-qrcode-scanner-region";

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const scriptStatus = useScript("https://unpkg.com/html5-qrcode/html5-qrcode.min.js");
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && scriptStatus === 'ready' && !scannerRef.current) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      };

      const onScanSuccess = (decodedText: string, decodedResult: any) => {
        onScan(decodedText);
        onClose();
      };

      const onScanFailure = (error: any) => {
        // ignore 'Code not found' errors
      };
      
      const scanner = new window.Html5QrcodeScanner(
        SCANNER_REGION_ID,
        config,
        false // verbose
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    // Cleanup
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isOpen, scriptStatus, onScan, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>Place a code inside the frame. The scanner will detect it automatically.</DialogDescription>
        </DialogHeader>
        {scriptStatus === 'loading' && <p>Loading scanner...</p>}
        {scriptStatus === 'error' && (
           <Alert variant="destructive">
            <AlertTitle>Scanner Error</AlertTitle>
            <AlertDescription>
              Could not load the scanner library. Please check your internet connection.
            </AlertDescription>
          </Alert>
        )}
        <div id={SCANNER_REGION_ID} className="w-full min-h-[300px]" />
      </DialogContent>
    </Dialog>
  );
}
