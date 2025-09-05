import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChartLine, 
  FileArrowUp, 
  Wallet, 
  Target,
  House,
  Plus
} from '@phosphor-icons/react';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  transactionCount: number;
  budgetCount: number;
}

export function MobileNavigation({ 
  activeTab, 
  onTabChange, 
  transactionCount, 
  budgetCount 
}: MobileNavigationProps) {
  const navItems = [
    { id: 'dashboard', icon: House, label: 'Home' },
    { id: 'transactions', icon: Wallet, label: 'Transactions', count: transactionCount },
    { id: 'import', icon: Plus, label: 'Import' },
    { id: 'budgets', icon: Target, label: 'Budgets', count: budgetCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map(({ id, icon: Icon, label, count }) => (
          <Button
            key={id}
            variant={activeTab === id ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-1 h-14 relative ${
              activeTab === id ? "bg-primary text-primary-foreground" : ""
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
            {count && count > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center"
              >
                {count > 99 ? '99+' : count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </nav>
  );
}