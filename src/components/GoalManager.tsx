import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  Plus, 
  Calculator, 
  TrendUp, 
  Calendar,
  DollarSign,
  Trash2,
  Edit3,
  CheckCircle,
  Clock
} from '@phosphor-icons/react';
import { Goal, DebtAccount, EmergencyFundSettings, Transaction } from '@/types';
import { EmergencyFundCalculator } from './calculators/EmergencyFundCalculator';
import { DebtPayoffCalculator } from './calculators/DebtPayoffCalculator';

interface GoalManagerProps {
  goals: Goal[];
  transactions: Transaction[];
  onCreateGoal: (goal: Omit<Goal, 'id'>) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
}

export function GoalManager({
  goals,
  transactions,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal
}: GoalManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEmergencyCalculator, setShowEmergencyCalculator] = useState(false);
  const [showDebtCalculator, setShowDebtCalculator] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleCreateGoal = useCallback((goalData: Omit<Goal, 'id'>) => {
    onCreateGoal(goalData);
    setShowCreateDialog(false);
  }, [onCreateGoal]);

  const handleUpdateGoal = useCallback((goal: Goal) => {
    onUpdateGoal(goal);
    setEditingGoal(null);
  }, [onUpdateGoal]);

  const toggleGoalCompletion = useCallback((goal: Goal) => {
    const updatedGoal = {
      ...goal,
      isCompleted: !goal.isCompleted,
      completedDate: !goal.isCompleted ? new Date().toISOString() : undefined
    };
    onUpdateGoal(updatedGoal);
  }, [onUpdateGoal]);

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getTimeToGoal = (goal: Goal) => {
    if (!goal.monthlyContribution || goal.monthlyContribution <= 0) return null;
    const remaining = goal.targetAmount - goal.currentAmount;
    const months = Math.ceil(remaining / goal.monthlyContribution);
    return months;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getGoalTypeIcon = (type: Goal['type']) => {
    switch (type) {
      case 'emergency_fund':
        return <Target className="w-4 h-4" />;
      case 'debt_snowball':
      case 'debt_avalanche':
        return <TrendUp className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getGoalTypeBadgeColor = (type: Goal['type']) => {
    switch (type) {
      case 'emergency_fund':
        return 'bg-blue-100 text-blue-800';
      case 'debt_snowball':
      case 'debt_avalanche':
        return 'bg-red-100 text-red-800';
      case 'trip_fund':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Goals</h2>
          <p className="text-muted-foreground">Track and achieve your financial objectives</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEmergencyCalculator(true)}
            className="gap-2"
          >
            <Calculator className="w-4 h-4" />
            Emergency Fund
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDebtCalculator(true)}
            className="gap-2"
          >
            <Calculator className="w-4 h-4" />
            Debt Payoff
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <CreateGoalForm onSubmit={handleCreateGoal} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Set financial goals to track your progress and stay motivated
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id} className={`relative ${goal.isCompleted ? 'opacity-75' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getGoalTypeIcon(goal.type)}
                    <Badge 
                      variant="secondary" 
                      className={getGoalTypeBadgeColor(goal.type)}
                    >
                      {goal.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingGoal(goal)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="flex items-center gap-2">
                  {goal.name}
                  {goal.isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </CardTitle>
                {goal.description && (
                  <CardDescription>{goal.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <Progress value={getProgressPercentage(goal)} className="h-2" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{Math.round(getProgressPercentage(goal))}% complete</span>
                    {goal.targetDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Time to Goal */}
                {goal.monthlyContribution && goal.monthlyContribution > 0 && !goal.isCompleted && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly contribution:</span>
                    <span className="font-medium">{formatCurrency(goal.monthlyContribution)}</span>
                  </div>
                )}

                {getTimeToGoal(goal) && !goal.isCompleted && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {getTimeToGoal(goal)} months to goal
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant={goal.isCompleted ? "outline" : "default"}
                    onClick={() => toggleGoalCompletion(goal)}
                    className="flex-1"
                  >
                    {goal.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Calculator Dialogs */}
      <Dialog open={showEmergencyCalculator} onOpenChange={setShowEmergencyCalculator}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Emergency Fund Calculator</DialogTitle>
          </DialogHeader>
          <EmergencyFundCalculator 
            transactions={transactions}
            onCreateGoal={handleCreateGoal}
            onClose={() => setShowEmergencyCalculator(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDebtCalculator} onOpenChange={setShowDebtCalculator}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Debt Payoff Calculator</DialogTitle>
          </DialogHeader>
          <DebtPayoffCalculator 
            onCreateGoal={handleCreateGoal}
            onClose={() => setShowDebtCalculator(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <EditGoalForm
              goal={editingGoal}
              onSubmit={handleUpdateGoal}
              onCancel={() => setEditingGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Goal Form Component
function CreateGoalForm({ onSubmit }: { onSubmit: (goal: Omit<Goal, 'id'>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom' as Goal['type'],
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: '',
    monthlyContribution: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      type: formData.type,
      targetAmount: parseFloat(formData.targetAmount) || 0,
      currentAmount: parseFloat(formData.currentAmount) || 0,
      targetDate: formData.targetDate || undefined,
      description: formData.description || undefined,
      monthlyContribution: parseFloat(formData.monthlyContribution) || undefined,
      isCompleted: false
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-name">Goal Name</Label>
        <Input
          id="goal-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Emergency Fund"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-type">Goal Type</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value: Goal['type']) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="emergency_fund">Emergency Fund</SelectItem>
            <SelectItem value="trip_fund">Trip Fund</SelectItem>
            <SelectItem value="debt_snowball">Debt Snowball</SelectItem>
            <SelectItem value="debt_avalanche">Debt Avalanche</SelectItem>
            <SelectItem value="custom">Custom Goal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target-amount">Target Amount</Label>
          <Input
            id="target-amount"
            type="number"
            step="0.01"
            value={formData.targetAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
            placeholder="10000"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current-amount">Current Amount</Label>
          <Input
            id="current-amount"
            type="number"
            step="0.01"
            value={formData.currentAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthly-contribution">Monthly Contribution</Label>
          <Input
            id="monthly-contribution"
            type="number"
            step="0.01"
            value={formData.monthlyContribution}
            onChange={(e) => setFormData(prev => ({ ...prev, monthlyContribution: e.target.value }))}
            placeholder="500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-date">Target Date</Label>
          <Input
            id="target-date"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Additional details about this goal..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">Create Goal</Button>
      </div>
    </form>
  );
}

// Edit Goal Form Component
function EditGoalForm({ 
  goal, 
  onSubmit, 
  onCancel 
}: { 
  goal: Goal; 
  onSubmit: (goal: Goal) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: goal.name,
    type: goal.type,
    targetAmount: goal.targetAmount.toString(),
    currentAmount: goal.currentAmount.toString(),
    targetDate: goal.targetDate || '',
    description: goal.description || '',
    monthlyContribution: goal.monthlyContribution?.toString() || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...goal,
      name: formData.name,
      type: formData.type,
      targetAmount: parseFloat(formData.targetAmount) || 0,
      currentAmount: parseFloat(formData.currentAmount) || 0,
      targetDate: formData.targetDate || undefined,
      description: formData.description || undefined,
      monthlyContribution: parseFloat(formData.monthlyContribution) || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-goal-name">Goal Name</Label>
        <Input
          id="edit-goal-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-target-amount">Target Amount</Label>
          <Input
            id="edit-target-amount"
            type="number"
            step="0.01"
            value={formData.targetAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-current-amount">Current Amount</Label>
          <Input
            id="edit-current-amount"
            type="number"
            step="0.01"
            value={formData.currentAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-monthly-contribution">Monthly Contribution</Label>
          <Input
            id="edit-monthly-contribution"
            type="number"
            step="0.01"
            value={formData.monthlyContribution}
            onChange={(e) => setFormData(prev => ({ ...prev, monthlyContribution: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-target-date">Target Date</Label>
          <Input
            id="edit-target-date"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">Update Goal</Button>
      </div>
    </form>
  );
}