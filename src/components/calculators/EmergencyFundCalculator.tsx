import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  DollarSign, 
  TrendUp, 
  Calendar,
  Calculator,
  Target
} from '@phosphor-icons/react';
import { Transaction, Goal } from '@/types';

interface EmergencyFundCalculatorProps {
  transactions: Transaction[];
  onCreateGoal: (goal: Omit<Goal, 'id'>) => void;
  onClose: () => void;
}

export function EmergencyFundCalculator({ 
  transactions, 
  onCreateGoal, 
  onClose 
}: EmergencyFundCalculatorProps) {
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [targetMonths, setTargetMonths] = useState<number[]>([6]);
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);

  // Calculate average monthly expenses from transactions
  useEffect(() => {
    if (transactions.length === 0) return;

    // Get expenses from last 6 months (excluding transfers and income)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentExpenses = transactions.filter(t => 
      !t.isTransfer && 
      t.amount < 0 && // Only expenses (negative amounts)
      new Date(t.date) >= sixMonthsAgo
    );

    if (recentExpenses.length === 0) {
      setMonthlyExpenses(3000); // Default estimate
      return;
    }

    const totalExpenses = recentExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const monthsOfData = Math.max(1, 
      (new Date().getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    const avgMonthly = Math.round(totalExpenses / monthsOfData);
    setMonthlyExpenses(avgMonthly);
  }, [transactions]);

  const targetAmount = monthlyExpenses * targetMonths[0];
  const remainingAmount = Math.max(0, targetAmount - currentSavings);
  const monthsToGoal = monthlyContribution > 0 ? Math.ceil(remainingAmount / monthlyContribution) : 0;
  const progressPercentage = Math.min((currentSavings / targetAmount) * 100, 100);

  const handleCreateGoal = () => {
    onCreateGoal({
      name: `Emergency Fund (${targetMonths[0]} months)`,
      type: 'emergency_fund',
      targetAmount: targetAmount,
      currentAmount: currentSavings,
      monthlyContribution: monthlyContribution,
      description: `Emergency fund covering ${targetMonths[0]} months of expenses (${formatCurrency(monthlyExpenses)}/month)`,
      isCompleted: false
    });
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Emergency Fund Basics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            An emergency fund is a financial safety net that covers 3-6 months of your essential expenses. 
            It helps protect you from unexpected events like job loss, medical bills, or major repairs.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-semibold text-green-600">3 months</div>
              <div className="text-xs text-muted-foreground">Minimum recommended</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-blue-600">6 months</div>
              <div className="text-xs text-muted-foreground">Ideal target</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-purple-600">12 months</div>
              <div className="text-xs text-muted-foreground">Extra security</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Parameters */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Monthly Expenses</CardTitle>
            <CardDescription>
              {transactions.length > 0 ? 
                "Calculated from your recent transaction history" : 
                "Enter your average monthly expenses"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-expenses">Monthly Expenses</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="monthly-expenses"
                  type="number"
                  step="100"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Number(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="3000"
                />
              </div>
              {transactions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  💡 Auto-calculated from your last 6 months of spending
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Target Coverage: {targetMonths[0]} months</Label>
              <Slider
                value={targetMonths}
                onValueChange={setTargetMonths}
                min={3}
                max={12}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>3 months</span>
                <span>6 months</span>
                <span>12 months</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Situation</CardTitle>
            <CardDescription>
              How much do you already have saved?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-savings">Current Emergency Savings</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="current-savings"
                  type="number"
                  step="100"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-contribution">Monthly Contribution</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="monthly-contribution"
                  type="number"
                  step="50"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="500"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                How much can you save each month?
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Your Emergency Fund Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(targetAmount)}
              </div>
              <div className="text-sm text-muted-foreground">Target Amount</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(currentSavings)}
              </div>
              <div className="text-sm text-muted-foreground">Current Savings</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(remainingAmount)}
              </div>
              <div className="text-sm text-muted-foreground">Still Needed</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {monthsToGoal > 0 ? `${monthsToGoal} mo` : 'Complete!'}
              </div>
              <div className="text-sm text-muted-foreground">Time to Goal</div>
            </div>
          </div>

          {/* Progress Visualization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress to Goal</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h4 className="font-medium">💡 Recommendations</h4>
            <div className="grid gap-2">
              {progressPercentage < 25 && (
                <Badge variant="outline" className="justify-start text-orange-700 bg-orange-50">
                  Start with a smaller goal of $1,000 for immediate emergencies
                </Badge>
              )}
              {monthsToGoal > 24 && monthlyContribution > 0 && (
                <Badge variant="outline" className="justify-start text-blue-700 bg-blue-50">
                  Consider increasing monthly contribution to reach goal faster
                </Badge>
              )}
              {targetMonths[0] < 6 && (
                <Badge variant="outline" className="justify-start text-purple-700 bg-purple-50">
                  6 months coverage provides better security for most people
                </Badge>
              )}
            </div>
          </div>

          {/* Timeline */}
          {monthsToGoal > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline
              </h4>
              <div className="text-sm space-y-1">
                <p>At {formatCurrency(monthlyContribution)} per month:</p>
                <p className="text-muted-foreground">
                  • You'll reach your goal in <span className="font-medium">{monthsToGoal} months</span>
                </p>
                <p className="text-muted-foreground">
                  • Target completion: <span className="font-medium">
                    {new Date(Date.now() + monthsToGoal * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button onClick={handleCreateGoal} className="flex-1 gap-2">
          <Target className="w-4 h-4" />
          Create This Goal
        </Button>
      </div>
    </div>
  );
}