import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { 
  TrendUp, 
  TrendDown, 
  Warning, 
  Target, 
  CalendarBlank,
  ChartLine,
  Wallet,
  Receipt 
} from '@phosphor-icons/react';
import { Transaction, Category, Budget } from '@/types';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface InsightsDashboardProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}

export function InsightsDashboard({ 
  transactions, 
  categories = DEFAULT_CATEGORIES, 
  budgets 
}: InsightsDashboardProps) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().substring(0, 7);

  const currentMonthTransactions = transactions.filter(t => 
    !t.isTransfer && t.date?.startsWith(currentMonth)
  );
  
  const lastMonthTransactions = transactions.filter(t => 
    !t.isTransfer && t.date?.startsWith(lastMonth)
  );

  const needsWantsData = calculateNeedsWants(currentMonthTransactions);
  const topMerchants = calculateTopMerchants(currentMonthTransactions);
  const monthlyTrend = calculateMonthlyTrend(transactions);
  const subscriptions = detectSubscriptions(transactions);
  const anomalies = detectAnomalies(transactions);
  const cashFlow = calculateCashFlow(transactions);

  const totalSpending = currentMonthTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const lastMonthSpending = lastMonthTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const spendingChange = lastMonthSpending > 0 
    ? ((totalSpending - lastMonthSpending) / lastMonthSpending) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spending</p>
                <p className="text-2xl font-bold">${totalSpending.toFixed(0)}</p>
              </div>
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {spendingChange >= 0 ? (
                <TrendUp className="w-4 h-4 text-destructive mr-1" />
              ) : (
                <TrendDown className="w-4 h-4 text-secondary mr-1" />
              )}
              <span className={cn(
                "font-medium",
                spendingChange >= 0 ? "text-destructive" : "text-secondary"
              )}>
                {Math.abs(spendingChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs vs Wants</p>
                <p className="text-2xl font-bold">
                  {needsWantsData.needsPercentage.toFixed(0)}% / {needsWantsData.wantsPercentage.toFixed(0)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-secondary" />
            </div>
            <Progress value={needsWantsData.needsPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{currentMonthTransactions.length}</p>
              </div>
              <Receipt className="w-8 h-8 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <p className="text-2xl font-bold">{anomalies.length}</p>
              </div>
              <Warning className="w-8 h-8 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Unusual transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Needs vs Wants Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Needs', value: needsWantsData.needs, color: 'oklch(0.5 0.12 150)' },
                      { name: 'Wants', value: needsWantsData.wants, color: 'oklch(0.7 0.15 50)' },
                      { name: 'Savings', value: needsWantsData.savings, color: 'oklch(0.45 0.15 240)' },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={[
                        'oklch(0.5 0.12 150)',
                        'oklch(0.7 0.15 50)', 
                        'oklch(0.45 0.15 240)'
                      ][index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Spending']} />
                  <Line 
                    type="monotone" 
                    dataKey="spending" 
                    stroke="oklch(0.45 0.15 240)" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Merchants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topMerchants.slice(0, 8).map((merchant, index) => (
              <div key={merchant.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{merchant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {merchant.count} transactions
                    </p>
                  </div>
                </div>
                <p className="font-medium">${merchant.total.toFixed(2)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Subscriptions & Recurring
              <Badge variant="outline">{subscriptions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptions.slice(0, 8).map((sub, index) => {
              const monthlyCost = sub.averageAmount;
              const annualCost = monthlyCost * 12;
              
              return (
                <div key={`${sub.merchant}-${index}`} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sub.merchant}</p>
                    <p className="text-sm text-muted-foreground">
                      Every {sub.frequency} days • ${annualCost.toFixed(0)}/year
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${monthlyCost.toFixed(2)}</p>
                    <Button variant="ghost" size="sm" className="text-xs p-0 h-auto text-muted-foreground">
                      Review
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-accent" />
              Spending Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.slice(0, 5).map((anomaly, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <div>
                    <p className="font-medium">{anomaly.transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(anomaly.transaction.date).toLocaleDateString()} • {anomaly.reason}
                    </p>
                  </div>
                  <p className="font-medium">${Math.abs(anomaly.transaction.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateNeedsWants(transactions: Transaction[]) {
  const spending = transactions.filter(t => t.amount < 0);
  const totalSpending = spending.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const needs = spending
    .filter(t => t.needWantSaving === 'need')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const wants = spending
    .filter(t => t.needWantSaving === 'want')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const savings = spending
    .filter(t => t.needWantSaving === 'saving')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    needs,
    wants,
    savings,
    needsPercentage: totalSpending > 0 ? (needs / totalSpending) * 100 : 0,
    wantsPercentage: totalSpending > 0 ? (wants / totalSpending) * 100 : 0,
    savingsPercentage: totalSpending > 0 ? (savings / totalSpending) * 100 : 0,
  };
}

function calculateTopMerchants(transactions: Transaction[]) {
  const merchantMap = new Map<string, { total: number; count: number }>();

  transactions
    .filter(t => t.amount < 0 && t.merchant)
    .forEach(transaction => {
      const merchant = transaction.merchant!;
      const current = merchantMap.get(merchant) || { total: 0, count: 0 };
      merchantMap.set(merchant, {
        total: current.total + Math.abs(transaction.amount),
        count: current.count + 1,
      });
    });

  return Array.from(merchantMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);
}

function calculateMonthlyTrend(transactions: Transaction[]) {
  const monthlyData = new Map<string, number>();
  
  transactions
    .filter(t => !t.isTransfer && t.amount < 0)
    .forEach(transaction => {
      const month = transaction.date?.substring(0, 7);
      if (month) {
        monthlyData.set(month, (monthlyData.get(month) || 0) + Math.abs(transaction.amount));
      }
    });

  return Array.from(monthlyData.entries())
    .map(([month, spending]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      spending,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months
}

function detectSubscriptions(transactions: Transaction[]) {
  const merchantPatterns = new Map<string, Transaction[]>();
  
  transactions
    .filter(t => t.amount < 0 && t.merchant)
    .forEach(transaction => {
      const merchant = transaction.merchant!.toLowerCase();
      if (!merchantPatterns.has(merchant)) {
        merchantPatterns.set(merchant, []);
      }
      merchantPatterns.get(merchant)!.push(transaction);
    });

  const subscriptions: Array<{
    merchant: string;
    frequency: number;
    averageAmount: number;
    transactions: Transaction[];
  }> = [];

  merchantPatterns.forEach((txns, merchant) => {
    if (txns.length >= 3) {
      // Sort by date
      txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate average frequency
      const intervals: number[] = [];
      for (let i = 1; i < txns.length; i++) {
        const days = Math.abs(
          (new Date(txns[i].date).getTime() - new Date(txns[i-1].date).getTime()) / (1000 * 60 * 60 * 24)
        );
        intervals.push(days);
      }
      
      const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
      const avgAmount = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txns.length;
      
      // Consider it a subscription if transactions are somewhat regular (25-35 days = monthly)
      if (avgInterval >= 25 && avgInterval <= 35) {
        subscriptions.push({
          merchant: txns[0].merchant || merchant,
          frequency: Math.round(avgInterval),
          averageAmount: avgAmount,
          transactions: txns,
        });
      }
    }
  });

  return subscriptions.sort((a, b) => b.averageAmount - a.averageAmount);
}

function detectAnomalies(transactions: Transaction[]) {
  const anomalies: Array<{
    transaction: Transaction;
    reason: string;
  }> = [];

  transactions
    .filter(t => !t.isTransfer && t.amount < 0)
    .forEach(transaction => {
      const amount = Math.abs(transaction.amount);
      
      // Find similar transactions from the same merchant
      const similarTransactions = transactions.filter(t => 
        t.merchant === transaction.merchant && 
        t.id !== transaction.id &&
        !t.isTransfer &&
        t.amount < 0
      );

      if (similarTransactions.length > 0) {
        const avgAmount = similarTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / similarTransactions.length;
        
        // Flag if this transaction is 2x higher than average
        if (amount > avgAmount * 2) {
          anomalies.push({
            transaction,
            reason: `${(amount / avgAmount).toFixed(1)}x higher than usual for ${transaction.merchant}`,
          });
        }
      } else if (amount > 500) {
        // Flag large transactions from new merchants
        anomalies.push({
          transaction,
          reason: 'Large transaction from new merchant',
        });
      }
    });

  return anomalies
    .sort((a, b) => Math.abs(b.transaction.amount) - Math.abs(a.transaction.amount))
    .slice(0, 10);
}

function calculateCashFlow(transactions: Transaction[]) {
  // This would calculate upcoming bills and cash flow predictions
  // For now, return empty data
  return [];
}