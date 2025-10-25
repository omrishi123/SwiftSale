"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  const [scanner, setScanner] = useState<any>(null);
  const [message, setMessage] = useState("Initializing scanner...");
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'ready' && isOpen && !scanner) {
      if(window.Html5Qrcode) {
        const qrScanner = new window.Html5Qrcode("scanner-container");
        setScanner(qrScanner);
      }
    }
  }, [status, isOpen, scanner]);

  useEffect(() => {
    if (scanner && isOpen) {
      setMessage("Requesting camera access...");
      
      const onScanSuccess = (decodedText: string, decodedResult: any) => {
        onScan(decodedText);
        handleClose();
      };
      
      const onScanFailure = (error: any) => {
        // This can be noisy, so we'll just log it for debugging.
        // console.warn(`QR code scan failed: ${error}`);
      };

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      window.Html5Qrcode.getCameras().then((cameras: any[]) => {
        if (cameras && cameras.length) {
          setMessage("Starting camera...");
          const cameraId = cameras.find((c: any) => c.label.toLowerCase().includes('back'))?.id || cameras[0].id;
          scanner.start({ deviceId: { exact: cameraId } }, config, onScanSuccess, onScanFailure)
            .catch((err: any) => {
              setMessage("Error starting camera. Please grant permissions.");
              console.error(err);
            });
        } else {
            setMessage("No cameras found.");
        }
      }).catch((err: any) => {
        setMessage("Could not get camera permissions.");
        console.error(err);
      });

    }

    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch((err: any) => console.error("Failed to stop scanner", err));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanner, isOpen, onScan]);

  const handleClose = () => {
    if (scanner && scanner.isScanning) {
      scanner.stop().then(() => {
        onClose();
      }).catch((err: any) => {
        console.error("Failed to stop scanner cleanly", err);
        onClose();
      });
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
        <div id="scanner-container" ref={scannerRef} className="w-full aspect-square bg-muted rounded-md overflow-hidden"></div>
      </DialogContent>
    </Dialog>
  );
}
