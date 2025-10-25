"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useScript from '@/hooks/use-script';
import { CameraOff, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const scriptStatus = useScript("https://unpkg.com/html5-qrcode/html5-qrcode.min.js");
  const scannerRef = useRef<any>(null);
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch((err: any) => {
        // This can sometimes throw an error if the camera is already stopped, so we can ignore it.
        console.warn("Scanner stop error (ignorable):", err);
      });
      scannerRef.current = null;
    }
  };
  
  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const startScanner = async () => {
    setStatus('requesting');
    
    // Ensure the container exists
    const scannerContainer = document.getElementById("scanner-container");
    if (!scannerContainer) {
        setStatus('error');
        setErrorMessage("Scanner container not found in the DOM.");
        return;
    }

    try {
        const cameras = await window.Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
            setStatus('error');
            setErrorMessage("No cameras found on this device.");
            return;
        }

        if (!scannerRef.current) {
            scannerRef.current = new window.Html5Qrcode("scanner-container", false);
        }
        const html5Qrcode = scannerRef.current;

        const onScanSuccess = (decodedText: string, decodedResult: any) => {
            if (html5Qrcode.isScanning) {
                onScan(decodedText);
                handleClose();
            }
        };

        const onScanFailure = (error: any) => {
            // This callback is called frequently, so we don't log anything here
            // to avoid spamming the console.
        };

        await html5Qrcode.start(
            { facingMode: "environment" },
            { 
                fps: 10, 
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                    const qrboxSize = Math.floor(minEdge * 0.8);
                    return { width: qrboxSize, height: qrboxSize };
                },
                supportedScanTypes: [0] // 0 for QR and Bar codes
            },
            onScanSuccess,
            onScanFailure
        );
        setStatus('scanning');

    } catch (err: any) {
        console.error("Scanner Error:", err);
        setStatus('error');
        if (err.name === 'NotAllowedError') {
            setErrorMessage("Camera permission was denied. Please enable it in your browser settings and try again.");
        } else {
            setErrorMessage(err.message || "An unexpected error occurred while starting the camera.");
        }
    }
  };


  useEffect(() => {
    if (isOpen && scriptStatus === 'ready' && status === 'idle') {
      startScanner();
    }
    
    // Cleanup on unmount or when modal is closed
    return () => {
      if(isOpen) {
         stopScanner();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, scriptStatus]);


  const getDialogContent = () => {
      let description = "Please wait...";
      let content = <div className="flex items-center justify-center h-full"><Loader className="h-12 w-12 animate-spin" /></div>;

      switch(status) {
        case 'requesting':
            description = "Requesting camera permissions...";
            break;
        case 'scanning':
            description = "Place a barcode inside the scanning area.";
            break;
        case 'error':
            description = "Scanner Error";
            content = (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4">
                  <CameraOff className="h-16 w-16 text-destructive mb-4" />
                  <Alert variant="destructive" className="max-w-sm text-center">
                    <AlertTitle>Camera Access Failed</AlertTitle>
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                   <Button variant="outline" onClick={startScanner} className="mt-4">Try Again</Button>
                </div>
            );
            break;
        case 'idle':
            if (scriptStatus === 'loading') description = "Loading scanner...";
            break;
      }
      
      return { description, content };
  };
  
  const { description, content } = getDialogContent();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={handleClose}>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div id="scanner-container" className="w-full aspect-video bg-muted rounded-md overflow-hidden relative">
          {status !== 'scanning' && content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
