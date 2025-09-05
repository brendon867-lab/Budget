import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileArrowUp, 
  FileCsv,
  FileText,
  Upload,
  CheckCircle,
  Warning
} from '@phosphor-icons/react';
import { Transaction } from '@/types';

interface MobileImportWizardProps {
  onImportComplete: (transactions: Transaction[]) => void;
}

export function MobileImportWizard({ onImportComplete }: MobileImportWizardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const supportedFormats = [
    { icon: FileCsv, name: 'CSV', description: 'Comma-separated values' },
    { icon: FileText, name: 'OFX/QFX', description: 'Open Financial Exchange' },
    { icon: FileText, name: 'QIF', description: 'Quicken Interchange Format' },
  ];

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate processing steps
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock transactions for demo
      const mockTransactions: Transaction[] = [
        {
          id: `tx-${Date.now()}-1`,
          date: '2024-01-15',
          amount: -45.67,
          description: 'GROCERY STORE',
          account: 'Checking',
          category: 'Food & Dining>Groceries',
          isTransfer: false,
          isDuplicate: false
        },
        {
          id: `tx-${Date.now()}-2`,
          date: '2024-01-14',
          amount: -12.50,
          description: 'COFFEE SHOP',
          account: 'Checking',
          category: 'Food & Dining>Restaurants',
          isTransfer: false,
          isDuplicate: false
        }
      ];
      
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onImportComplete(mockTransactions);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  if (isProcessing) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center">
              <Upload className="w-5 h-5 animate-pulse" />
              Processing File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {progress < 25 && 'Reading file...'}
              {progress >= 25 && progress < 50 && 'Parsing transactions...'}
              {progress >= 50 && progress < 75 && 'Detecting duplicates...'}
              {progress >= 75 && progress < 100 && 'Categorizing transactions...'}
              {progress === 100 && 'Complete!'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Supported formats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supported Formats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {supportedFormats.map(({ icon: Icon, name, description }) => (
            <div key={name} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Icon className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-secondary" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upload area */}
      <Card>
        <CardContent className="p-0">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.ofx,.qfx,.qif"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <FileArrowUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              Drop your file here
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              or tap to browse your files
            </p>
            
            <Button variant="outline" className="pointer-events-none">
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Warning className="w-5 h-5 text-accent" />
            Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Export transactions from your bank in CSV or OFX format</p>
          <p>• Include at least date, amount, and description columns</p>
          <p>• Files are processed locally - no data leaves your device</p>
          <p>• Duplicates and transfers will be automatically detected</p>
        </CardContent>
      </Card>
    </div>
  );
}