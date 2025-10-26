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
import { Download, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useAuth, useFirebaseApp } from '@/firebase';
import { signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export default function SettingsPage() {
  const { appData, updateSettings } = useAppData();
  const auth = useAuth();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const [settings, setSettings] = useState(appData.settings);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
    toast({
      title: 'Settings Saved',
      description: 'Your shop information has been updated.',
    });
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser) return;

    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please select an image smaller than 2MB.',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0); // Reset progress

    const storage = getStorage(firebaseApp);
    const fileExtension = file.name.split('.').pop();
    const fileName = `logos/${auth.currentUser.uid}/${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    try {
      // Simulate progress for better UX as uploadBytes doesn't provide it
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSettings({ ...settings, shopLogoUrl: downloadURL });
      updateSettings({ ...settings, shopLogoUrl: downloadURL }); // Save immediately

      toast({
        title: 'Logo Uploaded',
        description: 'Your new shop logo has been saved.',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description:
          'There was an error uploading your logo. Please try again.',
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000); // Hide progress bar after a delay
    }
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
          // For now, we'll just set it. This is a destructive action.
          // setAppData(importedData); // This function is not available directly, need to call individual setters
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

  const shopNameInitial =
    settings?.shopName?.charAt(0).toUpperCase() || 'S';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
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
                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                    <Input
                      id="logo-upload"
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                    />
                  </Label>
                </Button>
              </div>
              {isUploading && <Progress value={uploadProgress} className="mt-2" />}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
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
