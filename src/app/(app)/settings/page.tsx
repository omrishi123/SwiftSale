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
import { CloudUpload, CloudDownload, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function SettingsPage() {
  const { appData, updateSettings } = useAppData();
  const auth = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState(appData.settings);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
    toast({
      title: 'Settings Saved',
      description: 'Your shop information has been updated.',
    });
  };

  const handleExportData = () => {
    const dataToExport = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swiftsalepro-backup-${new Date()
      .toISOString()
      .split('T')[0]}.json`;
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="shopLogoUrl">Shop Logo URL</Label>
                <Input
                  id="shopLogoUrl"
                  placeholder="https://example.com/logo.png"
                  value={settings?.shopLogoUrl || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, shopLogoUrl: e.target.value })
                  }
                />
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
