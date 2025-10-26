"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'scanning' | 'denied' | 'error'>('idle');

  useEffect(() => {
    if (!isOpen) return;

    const codeReader = new BrowserMultiFormatReader();
    let selectedDeviceId: string;

    const startScanner = async () => {
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          throw new Error("No video input devices found");
        }
        
        // Prefer the rear camera
        const rearCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        );

        selectedDeviceId = rearCamera ? rearCamera.deviceId : videoInputDevices[0].deviceId;
        
        setHasCameraPermission(true);
        setScannerStatus('scanning');

        if (videoRef.current) {
          codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
            if (result) {
              onScan(result.getText());
              onClose();
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error('Zxing-js scan error:', err);
              setScannerStatus('error');
            }
          });
        }
      } catch (error) {
        console.error('Error accessing camera or starting scanner:', error);
        setHasCameraPermission(false);
        setScannerStatus('denied');
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };
    
    startScanner();

    return () => {
      codeReader.reset();
      setScannerStatus('idle');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Barcode/QR Code</DialogTitle>
          <DialogDescription>Place a code inside the frame to scan it.</DialogDescription>
        </DialogHeader>
        <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" />
          
          {scannerStatus === 'denied' && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <Alert variant="destructive">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  You need to grant camera permission to use the scanner. Please check your browser settings.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {scannerStatus === 'idle' && hasCameraPermission === null && (
             <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">Requesting camera permission...</p>
             </div>
          )}
          
           {scannerStatus === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <Alert variant="destructive">
                <AlertTitle>Scanner Error</AlertTitle>
                <AlertDescription>
                  An unexpected error occurred with the scanner.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
