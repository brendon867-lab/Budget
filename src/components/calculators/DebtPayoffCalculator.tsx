import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendUp, 
  TrendDown, 
  Plus, 
  Trash2, 
  DollarSign,
  Calendar,
  Calculator,
  Target,
  Snowflake,
  Mountain
} from '@phosphor-icons/react';
import { DebtAccount, Goal } from '@/types';

interface DebtPayoffCalculatorProps {
  onCreateGoal: (goal: Omit<Goal, 'id'>) => void;
  onClose: () => void;
}

interface PayoffPlan {
  debt: DebtAccount;
  payments: { month: number; payment: number; balance: number; interest: number }[];
  totalPayments: number;
  totalInterest: number;
  payoffMonth: number;
}

export function DebtPayoffCalculator({ onCreateGoal, onClose }: DebtPayoffCalculatorProps) {
  const [debts, setDebts] = useState<DebtAccount[]>([]);
  const [extraPayment, setExtraPayment] = useState<number>(0);
  const [showForm, setShowForm] = useState(false);
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('avalanche');

  // Add new debt
  const addDebt = (debt: Omit<DebtAccount, 'id'>) => {
    const newDebt: DebtAccount = {
      ...debt,
      id: `debt-${Date.now()}`
    };
    setDebts(prev => [...prev, newDebt]);
    setShowForm(false);
  };

  // Remove debt
  const removeDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  // Calculate payoff plans
  const payoffPlans = useMemo(() => {
    if (debts.length === 0) return { snowball: [], avalanche: [] };

    const calculatePlan = (strategy: 'snowball' | 'avalanche'): PayoffPlan[] => {
      // Sort debts based on strategy
      const sortedDebts = [...debts].sort((a, b) => {
        if (strategy === 'snowball') {
          return a.balance - b.balance; // Smallest balance first
        } else {
          return b.interestRate - a.interestRate; // Highest interest first
        }
      });

      const plans: PayoffPlan[] = [];
      const totalMinimumPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
      const totalExtraPayment = extraPayment;
      
      let remainingDebts = [...sortedDebts];
      let currentMonth = 1;
      let freedUpPayment = 0;

      // Track all debt payments simultaneously
      const debtStates = sortedDebts.map(debt => ({
        debt,
        currentBalance: debt.balance,
        payments: [] as { month: number; payment: number; balance: number; interest: number }[],
        isComplete: false
      }));

      while (remainingDebts.length > 0 && currentMonth <= 600) { // 50 year max
        // Calculate interest for all debts
        debtStates.forEach(state => {
          if (!state.isComplete && state.currentBalance > 0) {
            const monthlyInterest = (state.currentBalance * state.debt.interestRate / 100) / 12;
            
            let payment = state.debt.minimumPayment;
            
            // Add extra payment to the priority debt (first in sorted list)
            if (state.debt.id === remainingDebts[0].id) {
              payment += totalExtraPayment + freedUpPayment;
            }
            
            // Don't pay more than the balance
            payment = Math.min(payment, state.currentBalance + monthlyInterest);
            
            const principalPayment = payment - monthlyInterest;
            state.currentBalance = Math.max(0, state.currentBalance - principalPayment);
            
            state.payments.push({
              month: currentMonth,
              payment,
              balance: state.currentBalance,
              interest: monthlyInterest
            });

            // If debt is paid off, remove it from remaining debts and free up payment
            if (state.currentBalance <= 0.01) { // Small threshold for rounding
              state.isComplete = true;
              remainingDebts = remainingDebts.filter(d => d.id !== state.debt.id);
              freedUpPayment += state.debt.minimumPayment;
            }
          }
        });

        currentMonth++;
      }

      // Convert to PayoffPlan format
      return debtStates.map(state => ({
        debt: state.debt,
        payments: state.payments,
        totalPayments: state.payments.reduce((sum, p) => sum + p.payment, 0),
        totalInterest: state.payments.reduce((sum, p) => sum + p.interest, 0),
        payoffMonth: state.payments.length
      }));
    };

    return {
      snowball: calculatePlan('snowball'),
      avalanche: calculatePlan('avalanche')
    };
  }, [debts, extraPayment]);

  const currentPlans = strategy === 'snowball' ? payoffPlans.snowball : payoffPlans.avalanche;
  
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinPayments = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const weightedAvgRate = debts.length > 0 
    ? debts.reduce((sum, d) => sum + (d.interestRate * d.balance), 0) / totalDebt 
    : 0;
  
  const totalPayoffTime = currentPlans.length > 0 
    ? Math.max(...currentPlans.map(p => p.payoffMonth))
    : 0;
  
  const totalInterestSaved = useMemo(() => {
    if (currentPlans.length === 0 || extraPayment === 0) return 0;
    
    // Calculate interest with minimum payments only
    const minPaymentPlans = payoffPlans.avalanche.map(plan => {
      let balance = plan.debt.balance;
      let totalInterest = 0;
      let month = 0;
      
      while (balance > 0 && month < 600) {
        const monthlyInterest = (balance * plan.debt.interestRate / 100) / 12;
        const payment = Math.min(plan.debt.minimumPayment, balance + monthlyInterest);
        const principalPayment = payment - monthlyInterest;
        
        totalInterest += monthlyInterest;
        balance -= principalPayment;
        month++;
      }
      
      return totalInterest;
    });
    
    const minPaymentInterest = minPaymentPlans.reduce((sum, interest) => sum + interest, 0);
    const currentInterest = currentPlans.reduce((sum, p) => sum + p.totalInterest, 0);
    
    return minPaymentInterest - currentInterest;
  }, [currentPlans, payoffPlans, extraPayment]);

  const handleCreateGoal = () => {
    const goalName = strategy === 'snowball' ? 'Debt Snowball Plan' : 'Debt Avalanche Plan';
    const description = strategy === 'snowball' 
      ? 'Pay off smallest balances first for psychological wins'
      : 'Pay off highest interest debts first to save money';

    onCreateGoal({
      name: goalName,
      type: strategy === 'snowball' ? 'debt_snowball' : 'debt_avalanche',
      targetAmount: totalDebt,
      currentAmount: 0,
      monthlyContribution: totalMinPayments + extraPayment,
      description: `${description}. Total debt: ${formatCurrency(totalDebt)}, Monthly payment: ${formatCurrency(totalMinPayments + extraPayment)}`,
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

  const formatMonths = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${months} months`;
    if (remainingMonths === 0) return `${years} years`;
    return `${years}y ${remainingMonths}m`;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendUp className="w-5 h-5 text-green-600" />
            Debt Payoff Strategies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Two proven methods to eliminate debt faster and save money on interest.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Snowflake className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Debt Snowball</span>
              </div>
              <p className="text-sm text-blue-700">
                Pay minimums on all debts, then put extra money toward the smallest balance. 
                Provides psychological wins and momentum.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mountain className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Debt Avalanche</span>
              </div>
              <p className="text-sm text-green-700">
                Pay minimums on all debts, then put extra money toward the highest interest rate. 
                Saves the most money mathematically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Debts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Debts</CardTitle>
            <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Debt
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <AddDebtForm 
              onSubmit={addDebt}
              onCancel={() => setShowForm(false)}
            />
          )}
          
          {debts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Add your debts to see payoff strategies</p>
            </div>
          ) : (
            <div className="space-y-3">
              {debts.map((debt) => (
                <div key={debt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{debt.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Balance: {formatCurrency(debt.balance)} • Rate: {debt.interestRate}% • Min: {formatCurrency(debt.minimumPayment)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDebt(debt.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extra Payment */}
      {debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Extra Payment</CardTitle>
            <CardDescription>Additional amount to accelerate payoff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="extra-payment">Monthly Extra Payment</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="extra-payment"
                  type="number"
                  step="50"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(Number(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="200"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {debts.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Payoff Comparison
              </CardTitle>
              <Tabs value={strategy} onValueChange={(v) => setStrategy(v as 'snowball' | 'avalanche')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="snowball" className="gap-1">
                    <Snowflake className="w-3 h-3" />
                    Snowball
                  </TabsTrigger>
                  <TabsTrigger value="avalanche" className="gap-1">
                    <Mountain className="w-3 h-3" />
                    Avalanche
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {formatCurrency(totalDebt)}
                </div>
                <div className="text-sm text-muted-foreground">Total Debt</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatMonths(totalPayoffTime)}
                </div>
                <div className="text-sm text-muted-foreground">Payoff Time</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {formatCurrency(currentPlans.reduce((sum, p) => sum + p.totalInterest, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Interest</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(totalInterestSaved)}
                </div>
                <div className="text-sm text-muted-foreground">Interest Saved</div>
              </div>
            </div>

            {/* Payoff Order */}
            <div className="space-y-3">
              <h4 className="font-medium">
                Payoff Order ({strategy === 'snowball' ? 'Smallest Balance First' : 'Highest Interest First'})
              </h4>
              <div className="space-y-2">
                {currentPlans
                  .sort((a, b) => a.payoffMonth - b.payoffMonth)
                  .map((plan, index) => (
                    <div key={plan.debt.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{plan.debt.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(plan.debt.balance)} at {plan.debt.interestRate}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatMonths(plan.payoffMonth)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(plan.totalInterest)} interest
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Strategy Comparison */}
            {extraPayment > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Strategy Comparison</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Snowflake className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Snowball</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>Time: {formatMonths(Math.max(...(payoffPlans.snowball.map(p => p.payoffMonth))))}</div>
                      <div>Interest: {formatCurrency(payoffPlans.snowball.reduce((sum, p) => sum + p.totalInterest, 0))}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Mountain className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Avalanche</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>Time: {formatMonths(Math.max(...(payoffPlans.avalanche.map(p => p.payoffMonth))))}</div>
                      <div>Interest: {formatCurrency(payoffPlans.avalanche.reduce((sum, p) => sum + p.totalInterest, 0))}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
        {debts.length > 0 && (
          <Button onClick={handleCreateGoal} className="flex-1 gap-2">
            <Target className="w-4 h-4" />
            Create {strategy === 'snowball' ? 'Snowball' : 'Avalanche'} Goal
          </Button>
        )}
      </div>
    </div>
  );
}

// Add Debt Form Component
function AddDebtForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (debt: Omit<DebtAccount, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      balance: parseFloat(formData.balance) || 0,
      interestRate: parseFloat(formData.interestRate) || 0,
      minimumPayment: parseFloat(formData.minimumPayment) || 0,
      dueDate: parseInt(formData.dueDate) || undefined
    });
  };

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="debt-name">Debt Name</Label>
              <Input
                id="debt-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Credit Card, Student Loan, etc."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                placeholder="5000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate (%)</Label>
              <Input
                id="interest-rate"
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                placeholder="18.99"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimum-payment">Minimum Payment</Label>
              <Input
                id="minimum-payment"
                type="number"
                step="0.01"
                value={formData.minimumPayment}
                onChange={(e) => setFormData(prev => ({ ...prev, minimumPayment: e.target.value }))}
                placeholder="150"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date (Day of Month)</Label>
              <Input
                id="due-date"
                type="number"
                min="1"
                max="31"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                placeholder="15"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Debt
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}