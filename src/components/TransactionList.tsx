import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Pencil, 
  Check, 
  X, 
  Tag, 
  Receipt, 
  ArrowRightLeft,
  TrendUp,
  TrendDown 
} from '@phosphor-icons/react';
import { Transaction, Category } from '@/types';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  showTransfers?: boolean;
}

export function TransactionList({
  transactions,
  categories = DEFAULT_CATEGORIES,
  onUpdateTransaction,
  onDeleteTransaction,
  showTransfers = false,
}: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredTransactions = transactions
    .filter(transaction => {
      if (!showTransfers && transaction.isTransfer) return false;
      
      const matchesSearch = !searchTerm || 
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.merchant?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
      
      const matchesType = typeFilter === 'all' || transaction.needWantSaving === typeFilter;
      
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
  };

  const handleSave = (transaction: Transaction, updates: Partial<Transaction>) => {
    onUpdateTransaction(transaction.id, updates);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Transactions
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {filteredTransactions.length} of {transactions.length}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="min-w-48">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-32">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="need">Needs</SelectItem>
                  <SelectItem value="want">Wants</SelectItem>
                  <SelectItem value="saving">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map(transaction => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    categories={categories}
                    isEditing={editingId === transaction.id}
                    onEdit={() => handleEdit(transaction)}
                    onSave={(updates) => handleSave(transaction, updates)}
                    onCancel={handleCancel}
                    onDelete={() => onDeleteTransaction(transaction.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Transaction>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function TransactionRow({
  transaction,
  categories,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: TransactionRowProps) {
  const [editData, setEditData] = useState({
    description: transaction.description || '',
    category: transaction.category || '',
    subcategory: transaction.subcategory || '',
    needWantSaving: transaction.needWantSaving || 'need',
    notes: transaction.notes || '',
  });

  const category = categories.find(c => c.id === transaction.category);
  const selectedCategory = categories.find(c => c.id === editData.category);

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <div className="text-sm font-medium">
            {new Date(transaction.date).toLocaleDateString()}
          </div>
        </TableCell>
        <TableCell className="space-y-2">
          <Input
            value={editData.description}
            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
          />
        </TableCell>
        <TableCell className="space-y-2">
          <Select
            value={editData.category}
            onValueChange={(value) => setEditData(prev => ({ 
              ...prev, 
              category: value,
              subcategory: '',
              needWantSaving: categories.find(c => c.id === value)?.defaultType || 'need'
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategory && (
            <Select
              value={editData.subcategory}
              onValueChange={(value) => setEditData(prev => ({ ...prev, subcategory: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {selectedCategory.subcategories.map(sub => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </TableCell>
        <TableCell>
          <div className={cn(
            "text-sm font-medium",
            transaction.amount >= 0 ? "text-secondary" : "text-foreground"
          )}>
            ${Math.abs(transaction.amount).toFixed(2)}
          </div>
        </TableCell>
        <TableCell>
          <Select
            value={editData.needWantSaving}
            onValueChange={(value) => setEditData(prev => ({ 
              ...prev, 
              needWantSaving: value as 'need' | 'want' | 'saving'
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="need">Need</SelectItem>
              <SelectItem value="want">Want</SelectItem>
              <SelectItem value="saving">Saving</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSave(editData)}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className={cn(
      transaction.isTransfer && "opacity-60",
      transaction.isDuplicate && "bg-destructive/10"
    )}>
      <TableCell>
        <div className="text-sm font-medium">
          {new Date(transaction.date).toLocaleDateString()}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium text-sm">
            {transaction.description}
          </div>
          {transaction.merchant && transaction.merchant !== transaction.description && (
            <div className="text-xs text-muted-foreground">
              {transaction.merchant}
            </div>
          )}
          {transaction.isTransfer && (
            <Badge variant="secondary" className="text-xs">
              <ArrowRightLeft className="w-3 h-3 mr-1" />
              Transfer
            </Badge>
          )}
          {transaction.isDuplicate && (
            <Badge variant="destructive" className="text-xs">
              Duplicate
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {category ? (
          <div className="space-y-1">
            <Badge 
              variant="outline"
              style={{ 
                borderColor: category.color,
                color: category.color 
              }}
            >
              {category.name}
            </Badge>
            {transaction.subcategory && (
              <div className="text-xs text-muted-foreground">
                {transaction.subcategory}
              </div>
            )}
          </div>
        ) : (
          <Badge variant="outline">Uncategorized</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className={cn(
          "font-medium flex items-center gap-1",
          transaction.amount >= 0 ? "text-secondary" : "text-foreground"
        )}>
          {transaction.amount >= 0 ? (
            <TrendUp className="w-4 h-4" />
          ) : (
            <TrendDown className="w-4 h-4" />
          )}
          ${Math.abs(transaction.amount).toFixed(2)}
        </div>
      </TableCell>
      <TableCell>
        {transaction.needWantSaving && (
          <Badge 
            variant={
              transaction.needWantSaving === 'need' ? 'default' :
              transaction.needWantSaving === 'want' ? 'secondary' :
              'outline'
            }
          >
            {transaction.needWantSaving}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}