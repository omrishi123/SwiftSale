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
    if (isOpen && scriptStatus === 'ready' && window.Html5QrcodeScanner && !scannerRef.current) {
        
        const onScanSuccess = (decodedText: string, decodedResult: any) => {
            onScan(decodedText);
            onClose(); 
        };

        const onScanFailure = (error: any) => {
            // This can be noisy, so only log if needed for debugging.
            // console.warn(`Code scan error = ${error}`);
        };
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [0], // 0 represents all supported types (QR and Barcodes)
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

    return () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.getState() !== 1 /* NOT_STARTED */) {
                    scannerRef.current.clear();
                }
            } catch (error) {
                // This can happen if the component unmounts before the scanner is fully ready.
                // It's generally safe to ignore.
            }
            scannerRef.current = null;
        }
    };
  // eslint-disable--next-line react-hooks/exhaustive-deps
  }, [isOpen, scriptStatus, onScan, onClose, toast]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={onClose}>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>Place a code inside the frame. The scanner will detect it automatically.</DialogDescription>
        </DialogHeader>
        {scriptStatus === 'ready' && <div id={SCANNER_CONTAINER_ID} className="w-full" />}
        {scriptStatus === 'loading' && <p>Loading scanner...</p>}
        {scriptStatus === 'error' && <p className="text-destructive">Failed to load scanner script.</p>}
      </DialogContent>
    </Dialog>
  );
}
