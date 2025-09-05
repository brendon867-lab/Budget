import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  ChartPie, 
  Target, 
  TrendUp, 
  Plus, 
  Settings,
  Calendar,
  DollarSign 
} from '@phosphor-icons/react';
import { Budget, Category, Transaction } from '@/types';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  categories: Category[];
  onUpdateBudget: (budget: Budget) => void;
  onCreateBudget: (budget: Omit<Budget, 'id' | 'currentSpent'>) => void;
  onDeleteBudget: (id: string) => void;
}

export function BudgetManager({
  budgets,
  transactions,
  categories = DEFAULT_CATEGORIES,
  onUpdateBudget,
  onCreateBudget,
  onDeleteBudget,
}: BudgetManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const currentMonth = new Date().toISOString().substring(0, 7);
  
  const monthlySpending = transactions
    .filter(t => 
      !t.isTransfer && 
      t.date?.startsWith(currentMonth) && 
      t.amount < 0
    )
    .reduce((acc, t) => {
      if (!t.category) return acc;
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyAmount, 0);
  const totalSpent = Object.values(monthlySpending).reduce((sum, amount) => sum + amount, 0);

  const applyPreset = (preset: string) => {
    const income = 5000; // Would get from user input
    
    const presets = {
      '50/30/20': [
        { category: 'housing', percentage: 25, name: 'Housing' },
        { category: 'groceries', percentage: 15, name: 'Groceries' },
        { category: 'transportation', percentage: 10, name: 'Transportation' },
        { category: 'dining', percentage: 15, name: 'Dining Out' },
        { category: 'entertainment', percentage: 15, name: 'Entertainment' },
        { category: 'savings', percentage: 20, name: 'Savings' },
      ],
      envelope: [
        { category: 'housing', percentage: 30, name: 'Housing' },
        { category: 'groceries', percentage: 12, name: 'Groceries' },
        { category: 'transportation', percentage: 15, name: 'Transportation' },
        { category: 'healthcare', percentage: 8, name: 'Healthcare' },
        { category: 'dining', percentage: 10, name: 'Dining Out' },
        { category: 'entertainment', percentage: 5, name: 'Entertainment' },
        { category: 'savings', percentage: 20, name: 'Savings' },
      ],
    };

    const selectedPresetData = presets[preset as keyof typeof presets];
    if (selectedPresetData) {
      selectedPresetData.forEach(item => {
        onCreateBudget({
          categoryId: item.category,
          monthlyAmount: income * (item.percentage / 100),
          rollover: true,
        });
      });
    }
    setSelectedPreset('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartPie className="w-5 h-5" />
              Budget Overview
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">${totalBudget.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Total Budget</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendUp className="w-8 h-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold">${totalSpent.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold">${(totalBudget - totalSpent).toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>

          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateBudgetForm
                  categories={categories}
                  onCreateBudget={(budget) => {
                    onCreateBudget(budget);
                    setShowCreateForm(false);
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Category Budgets</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('50/30/20')}
                >
                  50/30/20 Rule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('envelope')}
                >
                  Envelope Method
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {budgets.map(budget => {
                const category = categories.find(c => c.id === budget.categoryId);
                const spent = monthlySpending[budget.categoryId] || 0;
                const remaining = budget.monthlyAmount - spent;
                const percentage = budget.monthlyAmount > 0 ? (spent / budget.monthlyAmount) * 100 : 0;

                return (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    category={category}
                    spent={spent}
                    remaining={remaining}
                    percentage={percentage}
                    onUpdate={onUpdateBudget}
                    onDelete={() => onDeleteBudget(budget.id)}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface BudgetCardProps {
  budget: Budget;
  category?: Category;
  spent: number;
  remaining: number;
  percentage: number;
  onUpdate: (budget: Budget) => void;
  onDelete: () => void;
}

function BudgetCard({
  budget,
  category,
  spent,
  remaining,
  percentage,
  onUpdate,
  onDelete,
}: BudgetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(budget.monthlyAmount.toString());

  const handleSave = () => {
    const newAmount = parseFloat(editAmount) || 0;
    onUpdate({
      ...budget,
      monthlyAmount: newAmount,
    });
    setIsEditing(false);
  };

  const isOverBudget = percentage > 100;

  return (
    <Card className={cn(
      "transition-colors",
      isOverBudget && "border-destructive bg-destructive/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: category?.color || 'oklch(0.7 0.02 0)' }}
            />
            <h4 className="font-medium">{category?.name || 'Unknown Category'}</h4>
            {budget.rollover && (
              <Badge variant="outline" className="text-xs">
                Rollover
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-24 h-8"
                  type="number"
                />
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditAmount(budget.monthlyAmount.toString());
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Spent: ${spent.toFixed(2)}</span>
            <span>Budget: ${budget.monthlyAmount.toFixed(2)}</span>
          </div>
          <Progress
            value={Math.min(percentage, 100)}
            className={cn(
              "h-2",
              isOverBudget && "bg-destructive/20"
            )}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{percentage.toFixed(0)}% used</span>
            <span
              className={cn(
                "font-medium",
                remaining >= 0 ? "text-secondary" : "text-destructive"
              )}
            >
              {remaining >= 0 ? '+' : ''}${remaining.toFixed(2)} remaining
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreateBudgetFormProps {
  categories: Category[];
  onCreateBudget: (budget: Omit<Budget, 'id' | 'currentSpent'>) => void;
  onCancel: () => void;
}

function CreateBudgetForm({ categories, onCreateBudget, onCancel }: CreateBudgetFormProps) {
  const [categoryId, setCategoryId] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [rollover, setRollover] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !monthlyAmount) return;

    onCreateBudget({
      categoryId,
      monthlyAmount: parseFloat(monthlyAmount),
      rollover,
    });

    setCategoryId('');
    setMonthlyAmount('');
    setRollover(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Select category...</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="amount">Monthly Budget</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="rollover"
          checked={rollover}
          onCheckedChange={setRollover}
        />
        <Label htmlFor="rollover">Enable rollover (unused budget carries to next month)</Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Create Budget</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}