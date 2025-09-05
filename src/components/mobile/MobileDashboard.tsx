import { Transaction, Budget, Category } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendUp, 
  TrendDown, 
  Wallet,
  Target,
  CurrencyDollar,
  Calendar
} from '@phosphor-icons/react';
import { formatCurrency } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface MobileDashboardProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}

export function MobileDashboard({ transactions, categories, budgets }: MobileDashboardProps) {
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const thisMonthTransactions = transactions.filter(t => 
    !t.isTransfer && 
    isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
  );
  
  const totalIncome = thisMonthTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = Math.abs(thisMonthTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));
  
  const netAmount = totalIncome - totalExpenses;
  
  // Top spending categories
  const categorySpending = thisMonthTransactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => {
      const category = t.category?.split('>')[0] || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);
  
  const topCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4);
  
  // Budget progress
  const budgetProgress = budgets.map(budget => {
    const categoryTransactions = thisMonthTransactions.filter(t => 
      t.category?.startsWith(budget.category) && t.amount < 0
    );
    const spent = Math.abs(categoryTransactions.reduce((sum, t) => sum + t.amount, 0));
    const progress = (spent / budget.limit) * 100;
    
    return {
      ...budget,
      spent,
      progress: Math.min(progress, 100),
      isOverBudget: spent > budget.limit
    };
  });

  return (
    <div className="space-y-4 pb-20"> {/* Extra padding for mobile nav */}
      {/* Month overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-secondary/10 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendUp className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium">Income</span>
              </div>
              <p className="text-lg font-bold text-secondary">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            
            <div className="text-center p-3 bg-destructive/10 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendDown className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium">Expenses</span>
              </div>
              <p className="text-lg font-bold text-destructive">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">Net</span>
            </div>
            <p className={`text-xl font-bold ${
              netAmount >= 0 ? 'text-secondary' : 'text-destructive'
            }`}>
              {formatCurrency(netAmount)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top categories */}
      {topCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCategories.map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="font-medium">{category}</span>
                </div>
                <span className="font-semibold">{formatCurrency(amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Budget progress */}
      {budgetProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5" />
              Budget Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetProgress.map((budget) => (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{budget.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </span>
                    {budget.isOverBudget && (
                      <Badge variant="destructive" className="text-xs">
                        Over budget
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress 
                  value={budget.progress} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {budget.progress.toFixed(1)}% used
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{transactions.length}</p>
            <p className="text-sm text-muted-foreground">Total Transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{budgets.length}</p>
            <p className="text-sm text-muted-foreground">Active Budgets</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}