import { Category, CategoryRule } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'groceries',
    name: 'Groceries',
    subcategories: ['Supermarkets', 'Organic/Health Food', 'Convenience Stores'],
    defaultType: 'need',
    color: 'oklch(0.6 0.15 120)',
  },
  {
    id: 'dining',
    name: 'Dining Out',
    subcategories: ['Restaurants', 'Fast Food', 'Coffee Shops', 'Bars'],
    defaultType: 'want',
    color: 'oklch(0.65 0.15 30)',
  },
  {
    id: 'transportation',
    name: 'Transportation',
    subcategories: ['Gas', 'Public Transit', 'Rideshare', 'Parking', 'Car Maintenance'],
    defaultType: 'need',
    color: 'oklch(0.55 0.12 200)',
  },
  {
    id: 'housing',
    name: 'Housing',
    subcategories: ['Rent/Mortgage', 'Utilities', 'Internet', 'Home Maintenance', 'Insurance'],
    defaultType: 'need',
    color: 'oklch(0.5 0.1 280)',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    subcategories: ['Doctor Visits', 'Pharmacy', 'Dental', 'Vision', 'Insurance'],
    defaultType: 'need',
    color: 'oklch(0.7 0.12 340)',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    subcategories: ['Movies', 'Streaming', 'Games', 'Concerts', 'Hobbies'],
    defaultType: 'want',
    color: 'oklch(0.65 0.18 320)',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    subcategories: ['Clothing', 'Electronics', 'Home Goods', 'Books', 'Gifts'],
    defaultType: 'want',
    color: 'oklch(0.6 0.14 60)',
  },
  {
    id: 'savings',
    name: 'Savings & Investments',
    subcategories: ['Emergency Fund', 'Retirement', 'Investments', 'Savings Account'],
    defaultType: 'saving',
    color: 'oklch(0.5 0.12 150)',
  },
  {
    id: 'transfers',
    name: 'Transfers',
    subcategories: ['Account Transfer', 'Payment', 'Refund'],
    defaultType: 'saving',
    color: 'oklch(0.7 0.02 0)',
  },
  {
    id: 'income',
    name: 'Income',
    subcategories: ['Salary', 'Freelance', 'Side Hustle', 'Interest', 'Dividends'],
    defaultType: 'saving',
    color: 'oklch(0.5 0.12 150)',
  },
];

export const DEFAULT_RULES: CategoryRule[] = [
  // Groceries
  {
    id: 'rule-grocery-1',
    name: 'Grocery Stores',
    condition: {
      type: 'contains',
      field: 'description',
      value: 'safeway|kroger|walmart|target|costco|whole foods|trader joe|publix|food lion|harris teeter',
    },
    action: {
      category: 'groceries',
      subcategory: 'Supermarkets',
      needWantSaving: 'need',
    },
    confidence: 0.9,
  },
  // Dining Out
  {
    id: 'rule-dining-1',
    name: 'Fast Food',
    condition: {
      type: 'contains',
      field: 'description',
      value: 'mcdonalds|burger king|taco bell|kfc|subway|chipotle|panera|starbucks',
    },
    action: {
      category: 'dining',
      subcategory: 'Fast Food',
      needWantSaving: 'want',
    },
    confidence: 0.95,
  },
  {
    id: 'rule-dining-2',
    name: 'Coffee Shops',
    condition: {
      type: 'contains',
      field: 'description',
      value: 'starbucks|dunkin|coffee|cafe',
    },
    action: {
      category: 'dining',
      subcategory: 'Coffee Shops',
      needWantSaving: 'want',
    },
    confidence: 0.85,
  },
  // Transportation
  {
    id: 'rule-transport-1',
    name: 'Gas Stations',
    condition: {
      type: 'contains',
      field: 'description',
      value: 'shell|exxon|bp|chevron|mobil|gas|fuel',
    },
    action: {
      category: 'transportation',
      subcategory: 'Gas',
      needWantSaving: 'need',
    },
    confidence: 0.9,
  },
  {
    id: 'rule-transport-2',
    name: 'Rideshare',
    condition: {
      type: 'contains',
      field: 'description',
      value: 'uber|lyft|taxi',
    },
    action: {
      category: 'transportation',
      subcategory: 'Rideshare',
      needWantSaving: 'need',
    },
    confidence: 0.95,
  },
  // Housing
  {
    id: 'rule-housing-1',
    name: 'Utilities',
    condition: {
      type: 'contains',
      field: 'description',
      value: 'electric|gas company|water|sewer|utility|pge|con edison|comcast|verizon',
    },
    action: {
      category: 'housing',
      subcategory: 'Utilities',
      needWantSaving: 'need',
    },
    confidence: 0.9,
  },
  // Healthcare
  {
    id: 'rule-health-1',
    name: 'Pharmacy',
    condition: {
      type: 'contains',
      field: 'description',
      value: 'cvs|walgreens|rite aid|pharmacy',
    },
    action: {
      category: 'healthcare',
      subcategory: 'Pharmacy',
      needWantSaving: 'need',
    },
    confidence: 0.85,
  },
  // Entertainment
  {
    id: 'rule-entertainment-1',
    name: 'Streaming Services',
    condition: {
      type: 'contains',
      field: 'description',
      value: 'netflix|hulu|disney|amazon prime|spotify|apple music|hbo',
    },
    action: {
      category: 'entertainment',
      subcategory: 'Streaming',
      needWantSaving: 'want',
    },
    confidence: 0.95,
  },
  // Transfers
  {
    id: 'rule-transfer-1',
    name: 'Bank Transfers',
    condition: {
      type: 'contains',
      field: 'description',
      value: 'transfer|payment|deposit|withdrawal',
    },
    action: {
      category: 'transfers',
      subcategory: 'Account Transfer',
      needWantSaving: 'saving',
    },
    confidence: 0.8,
  },
  // Amount-based rules
  {
    id: 'rule-large-amount',
    name: 'Large Transactions',
    condition: {
      type: 'amount_range',
      field: 'amount',
      value: 1000,
    },
    action: {
      category: 'housing',
      subcategory: 'Rent/Mortgage',
      needWantSaving: 'need',
    },
    confidence: 0.6,
  },
];

export const generateRuleFromEdit = (
  originalTransaction: any,
  editedTransaction: any
): CategoryRule | null => {
  if (!editedTransaction.category || !editedTransaction.needWantSaving) {
    return null;
  }

  const merchant = editedTransaction.merchant?.trim().toLowerCase();
  if (!merchant || merchant.length < 3) {
    return null;
  }

  return {
    id: `learned-${Date.now()}`,
    name: `Learned: ${merchant}`,
    condition: {
      type: 'contains',
      field: 'description',
      value: merchant,
    },
    action: {
      category: editedTransaction.category,
      subcategory: editedTransaction.subcategory,
      needWantSaving: editedTransaction.needWantSaving,
    },
    confidence: 0.8,
    learnedFromEdit: true,
  };
};