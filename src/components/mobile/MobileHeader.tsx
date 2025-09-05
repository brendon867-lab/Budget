import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Eye, 
  EyeSlash,
  DotsThree 
} from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileHeaderProps {
  activeTab: string;
  transactionCount: number;
  budgetCount: number;
  ruleCount: number;
  showTransfers: boolean;
  onToggleTransfers: () => void;
  onClearData: () => void;
}

export function MobileHeader({
  activeTab,
  transactionCount,
  budgetCount,
  ruleCount,
  showTransfers,
  onToggleTransfers,
  onClearData
}: MobileHeaderProps) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'transactions':
        return 'Transactions';
      case 'import':
        return 'Import';
      case 'budgets':
        return 'Budgets';
      default:
        return 'Finance Manager';
    }
  };

  return (
    <header className="sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95 border-b border-border z-40 md:relative md:bg-card/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary md:w-8 md:h-8" />
          <div>
            <h1 className="text-lg font-bold md:text-2xl">{getTabTitle()}</h1>
            <p className="text-xs text-muted-foreground hidden md:block">
              Track, categorize, and analyze your spending
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile stats and menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <DotsThree className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-3 space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {transactionCount} transactions
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {budgetCount} budgets
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {ruleCount} rules
                    </Badge>
                  </div>
                </div>
                <DropdownMenuItem onClick={onToggleTransfers}>
                  {showTransfers ? (
                    <>
                      <EyeSlash className="w-4 h-4 mr-2" />
                      Hide Transfers
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Transfers
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onClearData}
                  className="text-destructive focus:text-destructive"
                >
                  Clear All Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">
                {transactionCount} transactions
              </Badge>
              <Badge variant="outline">
                {budgetCount} budgets
              </Badge>
              <Badge variant="outline">
                {ruleCount} learned rules
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTransfers}
              className="gap-2"
            >
              {showTransfers ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showTransfers ? 'Hide' : 'Show'} Transfers
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearData}
              className="text-destructive hover:text-destructive"
            >
              Clear Data
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}