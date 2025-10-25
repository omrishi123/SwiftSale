"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import useScript from '@/hooks/use-script';

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
  const status = useScript("https://unpkg.com/html5-qrcode/html5-qrcode.min.js");
  const scannerRef = useRef<any>(null);
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [message, setMessage] = useState("Initializing scanner...");
  const [isScannerRunning, setIsScannerRunning] = useState(false);

  const stopScanner = async () => {
    if (scannerRef.current && isScannerRunning) {
      try {
        await scannerRef.current.stop();
        setIsScannerRunning(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  useEffect(() => {
    if (!isOpen || status !== 'ready') {
      return;
    }

    if (!scannerRef.current) {
      scannerRef.current = new window.Html5Qrcode("scanner-container");
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        const cameras = await window.Html5Qrcode.getCameras();
        if (!isMounted || !cameras || cameras.length === 0) {
          setMessage("No cameras found.");
          setHasPermission(false);
          return;
        }
        setHasPermission(true);

        const onScanSuccess = (decodedText: string) => {
          if (isMounted) {
            onScan(decodedText);
            handleClose();
          }
        };

        const onScanFailure = (error: any) => {
          // Continuous scan, so failure is expected. No need to log.
        };

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        const cameraId = cameras.find((c: any) => c.label.toLowerCase().includes('back'))?.id || cameras[0].id;
        
        await scannerRef.current.start(
          { deviceId: { exact: cameraId } },
          config,
          onScanSuccess,
          onScanFailure
        );
        setIsScannerRunning(true);
        setMessage("Place a barcode inside the box.");

      } catch (err) {
        if (isMounted) {
          console.error("Camera permission error:", err);
          setMessage("Camera permission denied.");
          setHasPermission(false);
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings.",
          });
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, status]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div id="scanner-container" className="w-full aspect-square bg-muted rounded-md overflow-hidden" />
        {hasPermission === false && (
          <Alert variant="destructive">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              Please allow camera access in your browser settings to use this feature.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
