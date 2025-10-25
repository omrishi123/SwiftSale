"use client";

import React, { useEffect, useState, useRef } from 'react';
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

  useEffect(() => {
    if (status !== 'ready' || !isOpen) {
      return;
    }

    if (!scannerRef.current) {
        scannerRef.current = new window.Html5Qrcode("scanner-container");
    }
    const scanner = scannerRef.current;
    let isMounted = true;

    const onScanSuccess = (decodedText: string) => {
        if(isMounted) {
            onScan(decodedText);
            handleClose();
        }
    };
    
    const onScanFailure = (error: any) => {
        // This is expected to be called frequently, so we don't log it.
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const startScanner = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            setHasPermission(true);
            setMessage("Starting camera...");
            const cameras = await window.Html5Qrcode.getCameras();
            if (isMounted && cameras && cameras.length) {
                const cameraId = cameras.find((c: any) => c.label.toLowerCase().includes('back'))?.id || cameras[0].id;
                await scanner.start({ deviceId: { exact: cameraId } }, config, onScanSuccess, onScanFailure);
            } else if (isMounted) {
                setMessage("No cameras found.");
                setHasPermission(false);
            }
        } catch (err) {
            if (isMounted) {
                setMessage("Camera permission denied.");
                setHasPermission(false);
                console.error("Camera permission error:", err);
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
      if (scanner && scanner.isScanning) {
        scanner.stop().catch((err: any) => console.error("Failed to stop scanner", err));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, status, onScan]);

  const handleClose = () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
            .then(() => onClose())
            .catch(() => onClose());
      } else {
          onClose();
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div id="scanner-container" className="w-full aspect-square bg-muted rounded-md overflow-hidden"></div>
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
