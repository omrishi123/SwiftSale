"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useScript from '@/hooks/use-script';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Html5Qrcode: any;
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
  const { toast } = useToast();
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'loading' | 'scanning' | 'permission-denied' | 'error'>('idle');
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      // If modal is closed, ensure scanner is stopped and resources are released.
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err: any) => {
          console.error("Failed to stop scanner on close:", err);
        });
      }
      scannerRef.current = null;
      setScannerStatus('idle'); // Reset status when closed
      return;
    }

    if (isOpen && scriptStatus === 'ready' && scannerStatus === 'idle') {
      const startScanner = async () => {
        const container = document.getElementById(SCANNER_REGION_ID);
        if (!container) {
          console.error("Scanner container not found in DOM.");
          setScannerStatus('error');
          return;
        }

        // Only create a new scanner if one doesn't already exist.
        if (!scannerRef.current) {
          scannerRef.current = new window.Html5Qrcode(SCANNER_REGION_ID, false);
        }
        
        const html5Qrcode = scannerRef.current;

        try {
          setScannerStatus('loading');
          await html5Qrcode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText: string, decodedResult: any) => {
              // success callback
              onScan(decodedText);
              onClose();
            },
            (errorMessage: string) => {
              // ignore 'Code not found' errors
            }
          );
          setScannerStatus('scanning');
        } catch (err: any) {
          console.error("Scanner start error:", err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setScannerStatus('permission-denied');
          } else {
            setScannerStatus('error');
          }
        }
      };
      
      startScanner();
    }
    
    // Cleanup function for when the component unmounts or isOpen changes
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err: any) => {
          console.error("Failed to stop scanner on cleanup:", err);
        });
      }
    };
  }, [isOpen, scriptStatus, onScan, onClose, scannerStatus]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>Place a code inside the frame. The scanner will detect it automatically.</DialogDescription>
        </DialogHeader>
        <div id={SCANNER_REGION_ID} className="w-full min-h-[300px]" />
        {scannerStatus === 'loading' && <p className="text-center text-muted-foreground">Requesting Camera Access...</p>}
        {scannerStatus === 'permission-denied' && (
          <Alert variant="destructive">
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>
              Please enable camera permissions in your browser settings to use the scanner.
            </AlertDescription>
          </Alert>
        )}
         {scannerStatus === 'error' && (
          <Alert variant="destructive">
            <AlertTitle>Scanner Error</AlertTitle>
            <AlertDescription>
              Failed to start the scanner. Please ensure your browser supports this feature and has access to a camera.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
