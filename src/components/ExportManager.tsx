import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  ChartBar,
  Calendar,
  Filter,
  CheckCircle
} from '@phosphor-icons/react';
import { Transaction, Category, Budget } from '@/types';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

interface ExportManagerProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}

type ExportFormat = 'csv' | 'json' | 'pdf-summary';
type ExportType = 'transactions' | 'spending-report' | 'budget-summary' | 'category-breakdown';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  dateRange?: DateRange;
  includeTransfers: boolean;
  includeDuplicates: boolean;
  selectedCategories: string[];
  groupBy: 'none' | 'category' | 'month' | 'merchant';
}

export function ExportManager({ transactions, categories, budgets }: ExportManagerProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    type: 'transactions',
    includeTransfers: false,
    includeDuplicates: false,
    selectedCategories: [],
    groupBy: 'none'
  });

  const [isExporting, setIsExporting] = useState(false);

  // Filter transactions based on options
  const filteredTransactions = transactions.filter(transaction => {
    // Date range filter
    if (options.dateRange?.from && options.dateRange?.to) {
      const transactionDate = new Date(transaction.date);
      if (transactionDate < options.dateRange.from || transactionDate > options.dateRange.to) {
        return false;
      }
    }

    // Transfer filter
    if (!options.includeTransfers && transaction.isTransfer) {
      return false;
    }

    // Duplicate filter
    if (!options.includeDuplicates && transaction.isDuplicate) {
      return false;
    }

    // Category filter
    if (options.selectedCategories.length > 0 && transaction.category) {
      if (!options.selectedCategories.includes(transaction.category)) {
        return false;
      }
    }

    return true;
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let data: any;
      let filename: string;

      switch (options.type) {
        case 'transactions':
          data = await exportTransactions();
          filename = `transactions_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'spending-report':
          data = await exportSpendingReport();
          filename = `spending_report_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'budget-summary':
          data = await exportBudgetSummary();
          filename = `budget_summary_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'category-breakdown':
          data = await exportCategoryBreakdown();
          filename = `category_breakdown_${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      // Download the file
      await downloadFile(data, filename, options.format);
      
      toast.success(`Export completed successfully! ${filteredTransactions.length} transactions included.`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportTransactions = async () => {
    const transactionsToExport = filteredTransactions.map(transaction => ({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category || 'Uncategorized',
      subcategory: transaction.subcategory || '',
      type: transaction.needWantSaving || '',
      account: transaction.account || '',
      merchant: transaction.merchant || '',
      mcc: transaction.mcc || '',
      isTransfer: transaction.isTransfer || false,
      isDuplicate: transaction.isDuplicate || false,
      notes: transaction.notes || '',
      tags: transaction.tags?.join(', ') || ''
    }));

    if (options.groupBy !== 'none') {
      return groupTransactions(transactionsToExport);
    }

    return transactionsToExport;
  };

  const exportSpendingReport = async () => {
    const expenses = filteredTransactions.filter(t => t.amount < 0 && !t.isTransfer);
    const income = filteredTransactions.filter(t => t.amount > 0 && !t.isTransfer);
    
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    // Category breakdown
    const categorySpending = expenses.reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    // Need/Want/Saving breakdown
    const typeBreakdown = expenses.reduce((acc, transaction) => {
      const type = transaction.needWantSaving || 'Uncategorized';
      acc[type] = (acc[type] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    // Monthly breakdown
    const monthlySpending = expenses.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    // Top merchants
    const merchantSpending = expenses.reduce((acc, transaction) => {
      const merchant = transaction.merchant || transaction.description;
      acc[merchant] = (acc[merchant] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    const topMerchants = Object.entries(merchantSpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([merchant, amount]) => ({ merchant, amount }));

    return {
      summary: {
        totalIncome,
        totalExpenses,
        netIncome,
        transactionCount: filteredTransactions.length,
        dateRange: options.dateRange ? {
          from: options.dateRange.from?.toISOString().split('T')[0],
          to: options.dateRange.to?.toISOString().split('T')[0]
        } : 'All time'
      },
      categoryBreakdown: Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: (amount / totalExpenses * 100).toFixed(1)
        })),
      typeBreakdown: Object.entries(typeBreakdown)
        .map(([type, amount]) => ({
          type,
          amount,
          percentage: (amount / totalExpenses * 100).toFixed(1)
        })),
      monthlySpending: Object.entries(monthlySpending)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount })),
      topMerchants
    };
  };

  const exportBudgetSummary = async () => {
    // Calculate current spending for each budget
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyTransactions = filteredTransactions.filter(t => 
      t.date.startsWith(currentMonth) && t.amount < 0 && !t.isTransfer
    );

    return budgets.map(budget => {
      const category = categories.find(c => c.id === budget.categoryId);
      const spent = monthlyTransactions
        .filter(t => t.category === category?.name)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const remaining = Math.max(0, budget.monthlyAmount - spent);
      const overBudget = spent > budget.monthlyAmount;
      const percentUsed = (spent / budget.monthlyAmount * 100).toFixed(1);

      return {
        category: category?.name || 'Unknown',
        budgetAmount: budget.monthlyAmount,
        spent,
        remaining,
        percentUsed,
        overBudget,
        rollover: budget.rollover,
        rolloverAmount: budget.rolloverAmount || 0
      };
    });
  };

  const exportCategoryBreakdown = async () => {
    const expenses = filteredTransactions.filter(t => t.amount < 0 && !t.isTransfer);
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));

    // Group by category and subcategory
    const breakdown = expenses.reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      const subcategory = transaction.subcategory || 'Other';
      
      if (!acc[category]) {
        acc[category] = {
          category,
          total: 0,
          subcategories: {},
          transactionCount: 0
        };
      }
      
      if (!acc[category].subcategories[subcategory]) {
        acc[category].subcategories[subcategory] = {
          subcategory,
          amount: 0,
          transactionCount: 0,
          avgTransaction: 0
        };
      }
      
      const amount = Math.abs(transaction.amount);
      acc[category].total += amount;
      acc[category].transactionCount += 1;
      acc[category].subcategories[subcategory].amount += amount;
      acc[category].subcategories[subcategory].transactionCount += 1;
      
      return acc;
    }, {} as any);

    // Convert to array and calculate percentages
    return Object.values(breakdown).map((category: any) => {
      const subcategoriesArray = Object.values(category.subcategories).map((sub: any) => ({
        ...sub,
        avgTransaction: sub.amount / sub.transactionCount,
        percentage: (sub.amount / category.total * 100).toFixed(1)
      }));

      return {
        ...category,
        percentage: (category.total / totalExpenses * 100).toFixed(1),
        avgTransaction: category.total / category.transactionCount,
        subcategories: subcategoriesArray.sort((a: any, b: any) => b.amount - a.amount)
      };
    }).sort((a: any, b: any) => b.total - a.total);
  };

  const groupTransactions = (transactions: any[]) => {
    switch (options.groupBy) {
      case 'category':
        return groupBy(transactions, 'category');
      case 'month':
        return groupBy(transactions, t => new Date(t.date).toISOString().substring(0, 7));
      case 'merchant':
        return groupBy(transactions, 'merchant');
      default:
        return transactions;
    }
  };

  const groupBy = (array: any[], key: string | ((item: any) => string)) => {
    const groups = array.reduce((acc, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key] || 'Other';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    return Object.entries(groups).map(([groupKey, items]: [string, any]) => ({
      group: groupKey,
      count: items.length,
      total: items.reduce((sum: number, item: any) => sum + item.amount, 0),
      items
    }));
  };

  const downloadFile = async (data: any, filename: string, format: ExportFormat) => {
    let blob: Blob;
    let extension: string;

    switch (format) {
      case 'csv':
        const csv = convertToCSV(data);
        blob = new Blob([csv], { type: 'text/csv' });
        extension = 'csv';
        break;
      case 'json':
        const json = JSON.stringify(data, null, 2);
        blob = new Blob([json], { type: 'application/json' });
        extension = 'json';
        break;
      case 'pdf-summary':
        // For now, export as JSON. In a real app, you'd use a PDF library
        const pdfData = JSON.stringify(data, null, 2);
        blob = new Blob([pdfData], { type: 'application/json' });
        extension = 'json'; // Would be 'pdf' in production
        break;
      default:
        throw new Error('Unsupported format');
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any): string => {
    if (!Array.isArray(data)) {
      // Handle non-array data (like spending reports)
      if (typeof data === 'object') {
        // Convert object to CSV format
        const headers = Object.keys(data).join(',');
        const values = Object.values(data).map(v => 
          typeof v === 'object' ? JSON.stringify(v) : v
        ).join(',');
        return `${headers}\n${values}`;
      }
      return JSON.stringify(data);
    }

    if (data.length === 0) return '';

    const firstItem = data[0];
    if (firstItem.items) {
      // Grouped data
      let csv = 'Group,Count,Total,Items\n';
      csv += data.map((group: any) => 
        `"${group.group}",${group.count},${group.total},"${JSON.stringify(group.items).replace(/"/g, '""')}"`
      ).join('\n');
      return csv;
    }

    // Regular transaction data
    const headers = Object.keys(firstItem).join(',');
    const rows = data.map((item: any) =>
      Object.values(item).map((value: any) =>
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export Data</h2>
          <p className="text-muted-foreground">Export your financial data for analysis or backup</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Type */}
            <div className="space-y-3">
              <Label>What to Export</Label>
              <Select 
                value={options.type} 
                onValueChange={(value: ExportType) => setOptions(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Raw Transactions
                    </div>
                  </SelectItem>
                  <SelectItem value="spending-report">
                    <div className="flex items-center gap-2">
                      <ChartBar className="w-4 h-4" />
                      Spending Report
                    </div>
                  </SelectItem>
                  <SelectItem value="budget-summary">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Budget Summary
                    </div>
                  </SelectItem>
                  <SelectItem value="category-breakdown">
                    <div className="flex items-center gap-2">
                      <ChartBar className="w-4 h-4" />
                      Category Breakdown
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format */}
            <div className="space-y-3">
              <Label>Format</Label>
              <Select 
                value={options.format} 
                onValueChange={(value: ExportFormat) => setOptions(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                  <SelectItem value="json">JSON (Structured Data)</SelectItem>
                  <SelectItem value="pdf-summary">PDF Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label>Date Range (Optional)</Label>
              <DatePickerWithRange
                date={options.dateRange}
                onDateChange={(dateRange) => setOptions(prev => ({ ...prev, dateRange }))}
              />
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <Label>Include</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-transfers"
                    checked={options.includeTransfers}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeTransfers: !!checked }))
                    }
                  />
                  <Label htmlFor="include-transfers" className="text-sm font-normal">
                    Account Transfers
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-duplicates"
                    checked={options.includeDuplicates}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeDuplicates: !!checked }))
                    }
                  />
                  <Label htmlFor="include-duplicates" className="text-sm font-normal">
                    Duplicate Transactions
                  </Label>
                </div>
              </div>
            </div>

            {/* Group By (for transactions only) */}
            {options.type === 'transactions' && (
              <div className="space-y-3">
                <Label>Group By</Label>
                <Select 
                  value={options.groupBy} 
                  onValueChange={(value: any) => setOptions(prev => ({ ...prev, groupBy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="merchant">Merchant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Export Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Transactions</div>
                <div className="text-lg font-semibold">{filteredTransactions.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Format</div>
                <div className="text-lg font-semibold uppercase">{options.format}</div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Date Range</div>
                <div className="text-lg font-semibold">
                  {options.dateRange?.from && options.dateRange?.to
                    ? `${options.dateRange.from.toLocaleDateString()} - ${options.dateRange.to.toLocaleDateString()}`
                    : 'All Time'
                  }
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">Includes:</div>
              <div className="flex flex-wrap gap-1">
                {!options.includeTransfers && (
                  <Badge variant="outline">Excludes Transfers</Badge>
                )}
                {!options.includeDuplicates && (
                  <Badge variant="outline">Excludes Duplicates</Badge>
                )}
                {options.selectedCategories.length > 0 && (
                  <Badge variant="outline">{options.selectedCategories.length} Categories</Badge>
                )}
                {options.groupBy !== 'none' && (
                  <Badge variant="outline">Grouped by {options.groupBy}</Badge>
                )}
              </div>
            </div>

            <Button 
              onClick={handleExport} 
              className="w-full gap-2" 
              disabled={isExporting || filteredTransactions.length === 0}
            >
              {isExporting ? (
                'Exporting...'
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {options.type.replace('-', ' ')}
                </>
              )}
            </Button>

            {filteredTransactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                No transactions match your current filters
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Exports</CardTitle>
          <CardDescription>Common export formats for immediate download</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setOptions({
                  format: 'csv',
                  type: 'transactions',
                  includeTransfers: false,
                  includeDuplicates: false,
                  selectedCategories: [],
                  groupBy: 'none'
                });
                setTimeout(handleExport, 100);
              }}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              All Transactions
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setOptions({
                  format: 'json',
                  type: 'spending-report',
                  includeTransfers: false,
                  includeDuplicates: false,
                  selectedCategories: [],
                  groupBy: 'none',
                  dateRange: {
                    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    to: new Date()
                  }
                });
                setTimeout(handleExport, 100);
              }}
              className="gap-2"
            >
              <ChartBar className="w-4 h-4" />
              This Month
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setOptions({
                  format: 'csv',
                  type: 'budget-summary',
                  includeTransfers: false,
                  includeDuplicates: false,
                  selectedCategories: [],
                  groupBy: 'none'
                });
                setTimeout(handleExport, 100);
              }}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Budget Status
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                setOptions({
                  format: 'json',
                  type: 'category-breakdown',
                  includeTransfers: false,
                  includeDuplicates: false,
                  selectedCategories: [],
                  groupBy: 'none',
                  dateRange: {
                    from: threeMonthsAgo,
                    to: new Date()
                  }
                });
                setTimeout(handleExport, 100);
              }}
              className="gap-2"
            >
              <ChartBar className="w-4 h-4" />
              Quarterly Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}