"use client";

import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import useScript from '@/hooks/use-script';
import { useToast } from '@/hooks/use-toast';

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

const SCANNER_CONTAINER_ID = "html5-qrcode-scanner-container";

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const scriptStatus = useScript("https://unpkg.com/html5-qrcode/html5-qrcode.min.js");
  const scannerRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && scriptStatus === 'ready' && window.Html5QrcodeScanner) {
      
      const onScanSuccess = (decodedText: string, decodedResult: any) => {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        onScan(decodedText);
        onClose();
      };

      const onScanFailure = (error: any) => {
        // This is called frequently, so we don't toast here.
        // console.warn(`Code scan error = ${error}`);
      };

      // Ensure the container is present
      const container = document.getElementById(SCANNER_CONTAINER_ID);
      if (container && !scannerRef.current) {
        const scanner = new window.Html5QrcodeScanner(
          SCANNER_CONTAINER_ID,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
          },
          false // verbose
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      }
    }

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        // Use a try-catch block to handle potential errors during cleanup
        try {
           if (scannerRef.current.getState() === 2 /* SCANNING */) {
            scannerRef.current.clear();
           }
        } catch (error) {
          console.error("Failed to clear scanner on cleanup:", error);
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, scriptStatus, onScan, onClose, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={onClose}>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>Place a code inside the frame. The scanner will detect it automatically.</DialogDescription>
        </DialogHeader>
        {scriptStatus === 'loading' && <p>Loading scanner...</p>}
        {scriptStatus === 'error' && <p className="text-destructive">Failed to load scanner script.</p>}
        <div id={SCANNER_CONTAINER_ID} className="w-full min-h-[300px]" />
      </DialogContent>
    </Dialog>
  );
}
