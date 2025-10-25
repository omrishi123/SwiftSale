"use client";

import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useScript from '@/hooks/use-script';

declare global {
  interface Window {
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
      const onScanSuccess = (decodedText: string, decodedResult: any) => {
        onScan(decodedText);
        onClose();
      };

      const onScanFailure = (error: any) => {
        // This callback is required but we can ignore failures.
      };

      // Ensure the container element exists before creating the scanner
      if (document.getElementById(SCANNER_REGION_ID)) {
        const html5QrcodeScanner = new window.Html5QrcodeScanner(
          SCANNER_REGION_ID,
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            // Important: This tells the scanner to use the camera directly
            // and not show the file upload option.
            rememberLastUsedCamera: true,
          },
          /* verbose= */ false
        );
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = html5QrcodeScanner;
      }
    }

    // Cleanup function to clear the scanner
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: any) => {
          console.error("Failed to clear html5QrcodeScanner.", error);
        });
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
        {/* The div for the scanner to attach to */}
        <div id={SCANNER_REGION_ID} className="w-full min-h-[300px]" />
      </DialogContent>
    </Dialog>
  );
}
