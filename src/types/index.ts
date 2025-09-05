export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  subcategory?: string;
  needWantSaving?: 'need' | 'want' | 'saving';
  account?: string;
  merchant?: string;
  mcc?: string;
  fitid?: string;
  isTransfer?: boolean;
  isDuplicate?: boolean;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
}

export interface ImportedFile {
  name: string;
  format: 'csv' | 'ofx' | 'qfx' | 'qif';
  transactions: Partial<Transaction>[];
  columnMapping?: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
  defaultType: 'need' | 'want' | 'saving';
  color: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyAmount: number;
  rollover: boolean;
  currentSpent: number;
  rolloverAmount?: number;
}

export interface CategoryRule {
  id: string;
  name: string;
  condition: {
    type: 'contains' | 'equals' | 'regex' | 'mcc' | 'amount_range';
    field: 'description' | 'merchant' | 'amount' | 'mcc';
    value: string | number;
    value2?: number; // for amount_range
  };
  action: {
    category: string;
    subcategory?: string;
    needWantSaving: 'need' | 'want' | 'saving';
  };
  confidence: number;
  learnedFromEdit?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  type: 'emergency_fund' | 'trip_fund' | 'debt_snowball' | 'debt_avalanche' | 'custom';
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  description?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance?: number;
  isActive: boolean;
}