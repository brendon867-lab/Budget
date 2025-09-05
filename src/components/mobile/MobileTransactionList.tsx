import { useState } from 'react';
import { Transaction, Category } from '@/types';
import { MobileTransactionCard } from './MobileTransactionCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  MagnifyingGlass, 
  FunnelSimple,
  SortAscending
} from '@phosphor-icons/react';

interface MobileTransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  showTransfers: boolean;
}

export function MobileTransactionList({
  transactions,
  categories,
  onUpdateTransaction,
  onDeleteTransaction,
  showTransfers
}: MobileTransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTransactions = transactions
    .filter(transaction => {
      if (!showTransfers && transaction.isTransfer) return false;
      
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || 
        transaction.category === filterCategory ||
        transaction.category?.startsWith(filterCategory + '>');
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount':
          return Math.abs(b.amount) - Math.abs(a.amount);
        case 'description':
          return a.description.localeCompare(b.description);
        default:
          return 0;
      }
    });

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold mb-2">No transactions found</h2>
        <p className="text-muted-foreground">
          Import your bank statements to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filter header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <FunnelSimple className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Sort by</label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Results summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredTransactions.length} of {transactions.length} transactions
          </span>
          {(searchTerm || filterCategory !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
              }}
              className="text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="space-y-3 pb-20"> {/* Extra bottom padding for mobile nav */}
        {filteredTransactions.map((transaction) => (
          <MobileTransactionCard
            key={transaction.id}
            transaction={transaction}
            categories={categories}
            onUpdate={onUpdateTransaction}
            onDelete={onDeleteTransaction}
          />
        ))}
      </div>
    </div>
  );
}