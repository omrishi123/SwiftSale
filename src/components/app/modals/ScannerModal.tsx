"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import useScript from '@/hooks/use-script';
import { CameraOff } from 'lucide-react';

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

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const scriptStatus = useScript("https://unpkg.com/html5-qrcode/html5-qrcode.min.js");
  const scannerRef = useRef<any>(null);
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [message, setMessage] = useState("Requesting camera permission...");

  useEffect(() => {
    if (!isOpen) {
      // Stop scanner and stream when modal is closed
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err: any) => console.error("Error stopping the scanner: ", err));
      }
      return;
    }

    if (scriptStatus !== 'ready') {
      setMessage("Scanner library is loading...");
      return;
    }

    if (!scannerRef.current) {
      scannerRef.current = new window.Html5Qrcode("scanner-container", false);
    }
    const html5Qrcode = scannerRef.current;
    
    const startScanner = async () => {
      try {
        const cameras = await window.Html5Qrcode.getCameras();
        setHasPermission(true);
        if (cameras && cameras.length) {
          setMessage("Place a barcode inside the box.");
          
          const onScanSuccess = (decodedText: string, decodedResult: any) => {
            if (html5Qrcode.isScanning) {
              html5Qrcode.stop();
            }
            onScan(decodedText);
            onClose();
          };

          const onScanFailure = (error: any) => {
             // ignore, this is called frequently
          };
          
          html5Qrcode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [0] },
            onScanSuccess,
            onScanFailure
          );
        } else {
           setMessage("No camera found on this device.");
           setHasPermission(false);
        }
      } catch (err) {
        console.error("Camera permission error:", err);
        setMessage("Camera permission was denied. Please enable it in your browser settings.");
        setHasPermission(false);
      }
    };

    startScanner();
    
    // Cleanup function
    return () => {
      if (html5Qrcode && html5Qrcode.isScanning) {
        html5Qrcode.stop().catch((err: any) => console.error("Error stopping the scanner on cleanup: ", err));
      }
    };
    
  }, [isOpen, scriptStatus, onClose, onScan, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div id="scanner-container" className="w-full aspect-video bg-muted rounded-md overflow-hidden relative">
          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
              <CameraOff className="h-16 w-16 text-destructive mb-4" />
              <Alert variant="destructive" className="max-w-sm">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Please enable camera permissions in your browser settings to use the scanner.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
