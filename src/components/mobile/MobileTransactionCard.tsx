import { Transaction, Category } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowRight, 
  ArrowLeft, 
  Trash,
  Tag,
  Calendar,
  CurrencyDollar
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface MobileTransactionCardProps {
  transaction: Transaction;
  categories: Category[];
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

export function MobileTransactionCard({ 
  transaction, 
  categories, 
  onUpdate, 
  onDelete 
}: MobileTransactionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isIncome = transaction.amount > 0;
  
  const categoryOptions = categories.flatMap(cat => [
    { value: cat.name, label: cat.name, type: 'category' },
    ...cat.subcategories.map(sub => ({
      value: `${cat.name}>${sub.name}`,
      label: `${cat.name} > ${sub.name}`,
      type: 'subcategory'
    }))
  ]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Main transaction row */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {transaction.isTransfer ? (
                  <ArrowRight className="w-4 h-4 text-accent flex-shrink-0" />
                ) : isIncome ? (
                  <ArrowLeft className="w-4 h-4 text-secondary flex-shrink-0" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <p className="font-medium truncate">
                  {transaction.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                {transaction.category && (
                  <>
                    <Tag className="w-3 h-3" />
                    <Badge variant="secondary" className="text-xs py-0">
                      {transaction.category}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-right ml-3">
              <p className={`font-semibold ${
                isIncome 
                  ? 'text-secondary' 
                  : transaction.isTransfer 
                    ? 'text-accent' 
                    : 'text-foreground'
              }`}>
                {formatCurrency(Math.abs(transaction.amount))}
              </p>
              {transaction.isDuplicate && (
                <Badge variant="outline" className="text-xs">
                  Duplicate
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="border-t bg-muted/30 p-4 space-y-4">
            {/* Account info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Account</p>
                <p className="font-medium">{transaction.account || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Type</p>
                <div className="flex items-center gap-1">
                  <CurrencyDollar className="w-3 h-3" />
                  <span className="font-medium">
                    {transaction.isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
                  </span>
                </div>
              </div>
            </div>

            {/* Category selection */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Category</p>
              <Select
                value={transaction.category || ''}
                onValueChange={(value) => onUpdate(transaction.id, { category: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
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

            {/* Transaction flags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {transaction.isTransfer && (
                <Badge variant="outline">Transfer</Badge>
              )}
              {transaction.isDuplicate && (
                <Badge variant="outline">Duplicate</Badge>
              )}
              {transaction.needsReview && (
                <Badge variant="outline">Needs Review</Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(transaction.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}