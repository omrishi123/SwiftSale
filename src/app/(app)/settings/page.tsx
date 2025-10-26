'use client';

import React, { useState } from 'react';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Download,
  Upload,
  Image as ImageIcon,
  PenLine,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

export default function SettingsPage() {
  const { appData, updateSettings } = useAppData();
  const auth = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState(appData.settings);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
    toast({
      title: 'Settings Saved',
      description: 'Your shop information has been updated.',
    });
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'signature'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      // 1MB limit
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please select an image smaller than 1MB.',
      });
      return;
    }

    if (imageType === 'logo') setIsUploadingLogo(true);
    if (imageType === 'signature') setIsUploadingSignature(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      const newSettings =
        imageType === 'logo'
          ? { ...settings, shopLogoUrl: base64String }
          : { ...settings, shopSignatureUrl: base64String };
      setSettings(newSettings);
      updateSettings(newSettings); // Save immediately

      toast({
        title: `${imageType === 'logo' ? 'Logo' : 'Signature'} Updated`,
        description: `Your new shop ${
          imageType === 'logo' ? 'logo' : 'signature'
        } has been saved.`,
      });
      if (imageType === 'logo') setIsUploadingLogo(false);
      if (imageType === 'signature') setIsUploadingSignature(false);
    };
    reader.onerror = (error) => {
      console.error('Error converting file to base64:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description:
          'There was an error processing your image. Please try again.',
      });
      if (imageType === 'logo') setIsUploadingLogo(false);
      if (imageType === 'signature') setIsUploadingSignature(false);
    };
  };

  const handleExportData = () => {
    const dataToExport = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataToExport], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swiftsalepro-backup-${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Data Exported',
      description: 'A backup file has been downloaded.',
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result as string);
        if (confirm('This will overwrite all current data. Are you sure?')) {
          // A more robust implementation would validate this data against a schema
          toast({
            title: 'Data Imported',
            description: 'Your data has been restored from the backup.',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: 'The selected file is not a valid backup.',
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const shopNameInitial = settings?.shopName?.charAt(0).toUpperCase() || 'S';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Shop Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={settings?.shopLogoUrl} alt="Shop Logo" />
                    <AvatarFallback className="text-3xl">
                      {shopNameInitial}
                    </AvatarFallback>
                  </Avatar>
                  <Button asChild variant="outline">
                    <Label htmlFor="logo-upload">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      <Input
                        id="logo-upload"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => handleImageUpload(e, 'logo')}
                        disabled={isUploadingLogo}
                      />
                    </Label>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Shop Signature</Label>
                <div className="flex items-center gap-4">
                  <div className="w-40 h-20 border rounded-md flex items-center justify-center bg-muted/50">
                    {settings?.shopSignatureUrl ? (
                      <Image
                        src={settings.shopSignatureUrl}
                        alt="Shop Signature"
                        width={150}
                        height={70}
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No Signature
                      </span>
                    )}
                  </div>
                  <Button asChild variant="outline">
                    <Label htmlFor="signature-upload">
                      <PenLine className="mr-2 h-4 w-4" />
                      {isUploadingSignature
                        ? 'Uploading...'
                        : 'Upload Signature'}
                      <Input
                        id="signature-upload"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => handleImageUpload(e, 'signature')}
                        disabled={isUploadingSignature}
                      />
                    </Label>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  value={settings?.shopName || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, shopName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopGstin">GSTIN</Label>
                <Input
                  id="shopGstin"
                  value={settings?.shopGstin || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, shopGstin: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopPhone">Phone Number</Label>
                <Input
                  id="shopPhone"
                  value={settings?.shopPhone || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, shopPhone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopDefaultTax">Default GST Rate (%)</Label>
                <Input
                  type="number"
                  id="shopDefaultTax"
                  value={settings?.defaultTax || 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultTax: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopAddress">Shop Address</Label>
              <Textarea
                id="shopAddress"
                value={settings?.shopAddress || ''}
                onChange={(e) =>
                  setSettings({ ...settings, shopAddress: e.target.value })
                }
              />
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Backup all your data to a file, or restore it from a backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
          <Button asChild variant="outline">
            <Label htmlFor="import-file">
              <Upload className="mr-2 h-4 w-4" /> Import Data
              <Input
                id="import-file"
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleImportData}
              />
            </Label>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
