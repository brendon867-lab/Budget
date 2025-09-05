import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, CheckCircle, AlertCircle } from '@phosphor-icons/react';
import { ImportedFile, Transaction } from '@/types';
import { parseCSV, parseOFX, parseQIF } from '@/lib/parsers';

interface ImportWizardProps {
  onImportComplete: (transactions: Transaction[]) => void;
}

export function ImportWizard({ onImportComplete }: ImportWizardProps) {
  const [step, setStep] = useState<'select' | 'mapping' | 'preview' | 'complete'>('select');
  const [importedFile, setImportedFile] = useState<ImportedFile | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const content = await file.text();
      const format = detectFileFormat(file.name, content);
      let transactions: Partial<Transaction>[] = [];

      switch (format) {
        case 'csv':
          const lines = content.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          setImportedFile({
            name: file.name,
            format,
            transactions: [], // Will be populated after mapping
          });
          setColumnMapping(suggestColumnMapping(headers));
          setStep('mapping');
          break;
        case 'ofx':
        case 'qfx':
          transactions = parseOFX(content);
          setImportedFile({
            name: file.name,
            format,
            transactions,
          });
          setStep('preview');
          break;
        case 'qif':
          transactions = parseQIF(content);
          setImportedFile({
            name: file.name,
            format,
            transactions,
          });
          setStep('preview');
          break;
        default:
          throw new Error('Unsupported file format');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error processing file. Please check the format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingComplete = async () => {
    if (!importedFile) return;

    setIsProcessing(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const content = await file.text();
        const transactions = parseCSV(content, columnMapping);
        setImportedFile({
          ...importedFile,
          transactions,
          columnMapping,
        });
        setStep('preview');
      }
    } catch (error) {
      console.error('Mapping error:', error);
      alert('Error processing column mapping.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportConfirm = () => {
    if (!importedFile?.transactions) return;

    const validTransactions = importedFile.transactions
      .filter((t): t is Transaction => 
        t.id !== undefined && 
        t.date !== undefined && 
        t.amount !== undefined && 
        !isNaN(t.amount)
      )
      .map(t => ({
        ...t,
        description: t.description || 'Unknown Transaction',
        merchant: t.merchant || t.description || 'Unknown Merchant',
      }));

    onImportComplete(validTransactions);
    setStep('complete');
  };

  const resetWizard = () => {
    setStep('select');
    setImportedFile(null);
    setColumnMapping({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (step === 'select') {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Transactions
          </CardTitle>
          <CardDescription>
            Upload CSV, OFX, QFX, or QIF files from your bank or financial institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Drag and drop your file here, or click to browse
              </p>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Choose File'}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.ofx,.qfx,.qif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">CSV</p>
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">OFX/QFX</p>
              <p className="text-xs text-muted-foreground">Open Financial</p>
            </div>
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">QIF</p>
              <p className="text-xs text-muted-foreground">Quicken</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'mapping') {
    const file = fileInputRef.current?.files?.[0];
    const headers = file ? [] : []; // Would extract from CSV

    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Map Columns</CardTitle>
          <CardDescription>
            Match your CSV columns to transaction fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {Object.entries(columnMapping).map(([csvColumn, mappedField]) => (
              <div key={csvColumn} className="grid grid-cols-2 gap-4 items-center">
                <Label className="font-medium">{csvColumn}</Label>
                <Select
                  value={mappedField}
                  onValueChange={(value) => 
                    setColumnMapping(prev => ({ ...prev, [csvColumn]: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Skip --</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="merchant">Merchant</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={resetWizard} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleMappingComplete} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'preview') {
    const transactions = importedFile?.transactions || [];
    const validCount = transactions.filter(t => t.date && !isNaN(t.amount as number)).length;

    return (
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle>Preview Import</CardTitle>
          <CardDescription>
            Review {validCount} transactions from {importedFile?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <CheckCircle className="w-5 h-5 text-secondary" />
            <div className="flex-1">
              <p className="font-medium">{validCount} valid transactions found</p>
              <p className="text-sm text-muted-foreground">
                {transactions.length - validCount} transactions will be skipped due to missing required fields
              </p>
            </div>
          </div>
          
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 20).map((transaction, index) => {
                  const isValid = transaction.date && !isNaN(transaction.amount as number);
                  return (
                    <TableRow key={index}>
                      <TableCell>{transaction.date || 'Missing'}</TableCell>
                      <TableCell>{transaction.description || 'Missing'}</TableCell>
                      <TableCell>
                        {transaction.amount ? `$${Math.abs(transaction.amount).toFixed(2)}` : 'Missing'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isValid ? 'default' : 'destructive'}>
                          {isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {transactions.length > 20 && (
              <p className="text-sm text-muted-foreground text-center p-4">
                ... and {transactions.length - 20} more transactions
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={resetWizard} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleImportConfirm} disabled={validCount === 0}>
              Import {validCount} Transactions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6 text-secondary" />
            Import Complete
          </CardTitle>
          <CardDescription>
            Your transactions have been imported successfully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetWizard} className="w-full">
            Import More Transactions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}

const detectFileFormat = (filename: string, content: string): 'csv' | 'ofx' | 'qfx' | 'qif' => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (extension === 'ofx' || content.includes('<OFX>')) return 'ofx';
  if (extension === 'qfx' || content.includes('<QFX>')) return 'qfx';
  if (extension === 'qif' || content.startsWith('!')) return 'qif';
  
  return 'csv';
};

const suggestColumnMapping = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase();
    
    if (lowerHeader.includes('date')) {
      mapping[header] = 'date';
    } else if (lowerHeader.includes('description') || lowerHeader.includes('memo')) {
      mapping[header] = 'description';
    } else if (lowerHeader.includes('amount') || lowerHeader.includes('debit') || lowerHeader.includes('credit')) {
      mapping[header] = 'amount';
    } else if (lowerHeader.includes('merchant') || lowerHeader.includes('payee')) {
      mapping[header] = 'merchant';
    } else if (lowerHeader.includes('account')) {
      mapping[header] = 'account';
    } else if (lowerHeader.includes('category')) {
      mapping[header] = 'category';
    }
  });
  
  return mapping;
};