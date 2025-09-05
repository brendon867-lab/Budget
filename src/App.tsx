import { useState, useCallback } from 'react';
import { useKV } from '@github/spark/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileArrowUp, 
  ChartLine, 
  Wallet, 
  Target, 
  Settings,
  Eye,
  EyeSlash
} from '@phosphor-icons/react';
import { ImportWizard } from '@/components/ImportWizard';
import { TransactionList } from '@/components/TransactionList';
import { BudgetManager } from '@/components/BudgetManager';
import { InsightsDashboard } from '@/components/InsightsDashboard';
import { Transaction, Budget, CategoryRule, Category } from '@/types';
import { DEFAULT_CATEGORIES, DEFAULT_RULES, generateRuleFromEdit } from '@/lib/categories';
import { detectDuplicates, detectTransfers, applyCategoryRules } from '@/lib/parsers';
import { toast } from 'sonner';

function App() {
  const [transactions, setTransactions] = useKV<Transaction[]>('transactions', []);
  const [budgets, setBudgets] = useKV<Budget[]>('budgets', []);
  const [categories, setCategories] = useKV<Category[]>('categories', DEFAULT_CATEGORIES);
  const [rules, setRules] = useKV<CategoryRule[]>('category-rules', DEFAULT_RULES);
  const [showTransfers, setShowTransfers] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleImportComplete = useCallback((newTransactions: Transaction[]) => {
    setTransactions(currentTransactions => {
      // Apply categorization rules
      let processedTransactions = newTransactions.map(t => applyCategoryRules(t, rules));
      
      // Detect duplicates and transfers
      const allTransactions = [...currentTransactions, ...processedTransactions];
      const withDuplicates = detectDuplicates(allTransactions);
      const withTransfers = detectTransfers(withDuplicates);
      
      const finalTransactions = withTransfers.slice(currentTransactions.length);
      
      const duplicateCount = finalTransactions.filter(t => t.isDuplicate).length;
      const transferCount = finalTransactions.filter(t => t.isTransfer).length;
      const categorizedCount = finalTransactions.filter(t => t.category).length;
      
      toast.success(
        `Imported ${finalTransactions.length} transactions. ` +
        `${categorizedCount} categorized, ${transferCount} transfers detected, ${duplicateCount} duplicates found.`
      );
      
      return [...currentTransactions, ...finalTransactions];
    });
    setActiveTab('transactions');
  }, [rules, setTransactions]);

  const handleUpdateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(currentTransactions => {
      const updatedTransactions = currentTransactions.map(t => {
        if (t.id === id) {
          const originalTransaction = { ...t };
          const updatedTransaction = { ...t, ...updates };
          
          // Generate a rule if category was manually changed
          if (updates.category && updates.category !== originalTransaction.category) {
            const newRule = generateRuleFromEdit(originalTransaction, updatedTransaction);
            if (newRule) {
              setRules(currentRules => [...currentRules, newRule]);
              toast.success(`Created new rule: "${newRule.name}"`);
            }
          }
          
          return updatedTransaction;
        }
        return t;
      });
      
      return updatedTransactions;
    });
  }, [setTransactions, setRules]);

  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions(currentTransactions => 
      currentTransactions.filter(t => t.id !== id)
    );
    toast.success('Transaction deleted');
  }, [setTransactions]);

  const handleCreateBudget = useCallback((budgetData: Omit<Budget, 'id' | 'currentSpent'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: `budget-${Date.now()}`,
      currentSpent: 0,
    };
    
    setBudgets(currentBudgets => [...currentBudgets, newBudget]);
    toast.success('Budget created');
  }, [setBudgets]);

  const handleUpdateBudget = useCallback((budget: Budget) => {
    setBudgets(currentBudgets => 
      currentBudgets.map(b => b.id === budget.id ? budget : b)
    );
    toast.success('Budget updated');
  }, [setBudgets]);

  const handleDeleteBudget = useCallback((id: string) => {
    setBudgets(currentBudgets => currentBudgets.filter(b => b.id !== id));
    toast.success('Budget deleted');
  }, [setBudgets]);

  const handleClearData = useCallback(() => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setTransactions([]);
      setBudgets([]);
      setRules(DEFAULT_RULES);
      toast.success('All data cleared');
    }
  }, [setTransactions, setBudgets, setRules]);

  const nonTransferTransactions = transactions.filter(t => !t.isTransfer);
  const transferTransactions = transactions.filter(t => t.isTransfer);
  const visibleTransactions = showTransfers ? transactions : nonTransferTransactions;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Personal Finance Manager</h1>
                <p className="text-sm text-muted-foreground">
                  Track, categorize, and analyze your spending
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">
                  {transactions.length} transactions
                </Badge>
                <Badge variant="outline">
                  {budgets.length} budgets
                </Badge>
                <Badge variant="outline">
                  {rules.filter(r => r.learnedFromEdit).length} learned rules
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTransfers(!showTransfers)}
                className="gap-2"
              >
                {showTransfers ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showTransfers ? 'Hide' : 'Show'} Transfers
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="text-destructive hover:text-destructive"
              >
                Clear Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <ChartLine className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <FileArrowUp className="w-4 h-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Transactions
              {visibleTransactions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {visibleTransactions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Budgets
              {budgets.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {budgets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {transactions.length > 0 ? (
              <InsightsDashboard
                transactions={transactions}
                categories={categories}
                budgets={budgets}
              />
            ) : (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No data yet</h2>
                <p className="text-muted-foreground mb-4">
                  Import your first transactions to see insights and analytics
                </p>
                <Button onClick={() => setActiveTab('import')}>
                  <FileArrowUp className="w-4 h-4 mr-2" />
                  Import Transactions
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="flex justify-center">
            <ImportWizard onImportComplete={handleImportComplete} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-8">
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {showTransfers && transferTransactions.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <Badge variant="secondary" className="mr-2">
                        {transferTransactions.length}
                      </Badge>
                      account transfers detected and excluded from spending calculations
                    </p>
                  </div>
                )}
                <TransactionList
                  transactions={visibleTransactions}
                  categories={categories}
                  onUpdateTransaction={handleUpdateTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  showTransfers={showTransfers}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <FileArrowUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No transactions found</h2>
                <p className="text-muted-foreground mb-4">
                  Import your bank statements to get started
                </p>
                <Button onClick={() => setActiveTab('import')}>
                  Import Transactions
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="budgets" className="space-y-8">
            <BudgetManager
              budgets={budgets}
              transactions={nonTransferTransactions}
              categories={categories}
              onUpdateBudget={handleUpdateBudget}
              onCreateBudget={handleCreateBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;