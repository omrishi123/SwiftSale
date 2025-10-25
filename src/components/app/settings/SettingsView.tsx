"use client";

import React, { useState } from 'react';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CloudUpload, CloudDownload, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function SettingsView() {
  const { appData, setAppData, updateSettings } = useAppData();
  const { toast } = useToast();
  const [settings, setSettings] = useState(appData.settings);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
    toast({ title: "Settings Saved", description: "Your shop information has been updated." });
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swiftsalepro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Data Exported", description: "A backup file has been downloaded." });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result as string);
        if (confirm("This will overwrite all current data. Are you sure?")) {
          setAppData(importedData);
          setSettings(importedData.settings);
          toast({ title: "Data Imported", description: "Your data has been restored from the backup." });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: "Import Failed", description: "The selected file is not a valid backup." });
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
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input id="shopName" value={settings.shopName || ''} onChange={e => setSettings({ ...settings, shopName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopGstin">GSTIN</Label>
                <Input id="shopGstin" value={settings.shopGstin || ''} onChange={e => setSettings({ ...settings, shopGstin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopPhone">Phone Number</Label>
                <Input id="shopPhone" value={settings.shopPhone || ''} onChange={e => setSettings({ ...settings, shopPhone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopDefaultTax">Default GST Rate (%)</Label>
                <Input type="number" id="shopDefaultTax" value={settings.defaultTax || 0} onChange={e => setSettings({ ...settings, defaultTax: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopAddress">Shop Address</Label>
              <Textarea id="shopAddress" value={settings.shopAddress || ''} onChange={e => setSettings({ ...settings, shopAddress: e.target.value })} />
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Cloud Sync (Google Drive)</CardTitle>
          <CardDescription>Sign in to save & load your app data to/from your Google Drive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-md bg-muted text-muted-foreground text-center text-sm">
            Initializing Google Sync...
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled>Sign In with Google</Button>
            <Button variant="destructive" disabled><CloudUpload className="mr-2 h-4 w-4" /> Save to Drive</Button>
            <Button variant="secondary" disabled><CloudDownload className="mr-2 h-4 w-4" /> Load from Drive</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Local Data Management</CardTitle>
          <CardDescription>Backup all your data to a file, or restore it from a backup.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={handleExportData}><Download className="mr-2 h-4 w-4" /> Export Data</Button>
          <Button asChild variant="outline">
            <Label htmlFor="import-file">
              <Upload className="mr-2 h-4 w-4" /> Import Data
              <Input id="import-file" type="file" className="hidden" accept=".json" onChange={handleImportData} />
            </Label>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
