"use client";

import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

const SCANNER_CONTAINER_ID = "html5-qrcode-scanner-container";

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const scriptStatus = useScript("https://unpkg.com/html5-qrcode/html5-qrcode.min.js");
  const scannerRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || scriptStatus !== 'ready' || !window.Html5QrcodeScanner) {
      return;
    }

    // If a scanner instance doesn't exist, create one.
    if (!scannerRef.current) {
      const onScanSuccess = (decodedText: string, decodedResult: any) => {
        onScan(decodedText);
        onClose(); // Close the modal on successful scan
      };

      const onScanFailure = (error: any) => {
        // This is called frequently, so we don't want to spam notifications.
        // It's useful for debugging but not for the user.
      };
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [0], // 0 for QR and Bar codes
      };

      try {
        const scanner = new window.Html5QrcodeScanner(
          SCANNER_CONTAINER_ID,
          config,
          /* verbose= */ false
        );
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      } catch (err: any) {
        toast({
            variant: "destructive",
            title: "Scanner Error",
            description: err.message || "Failed to initialize the scanner.",
        });
      }
    }

    // Cleanup function to run when the modal is closed or component unmounts
    return () => {
      if (scannerRef.current) {
        // The .clear() method stops the camera and cleans up the UI.
        // It can throw an error if the scanner is already cleared or not running,
        // so we wrap it in a try-catch block.
        try {
          scannerRef.current.clear();
        } catch (error) {
            // This error is generally safe to ignore as it just means
            // the scanner was already stopped.
        }
        scannerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, scriptStatus]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={onClose}>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>Place a code inside the frame. The scanner will detect it automatically.</DialogDescription>
        </DialogHeader>
        <div id={SCANNER_CONTAINER_ID} className="w-full" />
      </DialogContent>
    </Dialog>
  );
}
