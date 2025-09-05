import { Transaction, CategoryRule } from '@/types';

export const parseCSV = (content: string, columnMapping: Record<string, string>): Partial<Transaction>[] => {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line);
    const transaction: Partial<Transaction> = {
      id: `csv-${Date.now()}-${index}`,
    };

    Object.entries(columnMapping).forEach(([csvColumn, transactionField]) => {
      const columnIndex = headers.indexOf(csvColumn);
      if (columnIndex >= 0 && values[columnIndex]) {
        const value = values[columnIndex].trim().replace(/"/g, '');
        
        switch (transactionField) {
          case 'date':
            transaction.date = parseDate(value);
            break;
          case 'amount':
            transaction.amount = parseAmount(value);
            break;
          case 'description':
          case 'merchant':
          case 'account':
            transaction[transactionField as keyof Transaction] = value;
            break;
        }
      }
    });

    return transaction;
  }).filter(t => t.date && !isNaN(t.amount as number));
};

export const parseOFX = (content: string): Partial<Transaction>[] => {
  const transactions: Partial<Transaction>[] = [];
  const stmtTrns = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g) || [];
  
  stmtTrns.forEach((trn, index) => {
    const fitid = extractOFXField(trn, 'FITID');
    const date = extractOFXField(trn, 'DTPOSTED');
    const amount = extractOFXField(trn, 'TRNAMT');
    const memo = extractOFXField(trn, 'MEMO') || extractOFXField(trn, 'NAME');
    
    if (date && amount && memo) {
      transactions.push({
        id: fitid || `ofx-${Date.now()}-${index}`,
        fitid,
        date: parseOFXDate(date),
        amount: parseFloat(amount),
        description: memo,
        merchant: memo,
      });
    }
  });
  
  return transactions;
};

export const parseQIF = (content: string): Partial<Transaction>[] => {
  const transactions: Partial<Transaction>[] = [];
  const entries = content.split('^').filter(e => e.trim());
  
  entries.forEach((entry, index) => {
    const lines = entry.trim().split('\n');
    const transaction: Partial<Transaction> = {
      id: `qif-${Date.now()}-${index}`,
    };
    
    lines.forEach(line => {
      const code = line.charAt(0);
      const value = line.substring(1).trim();
      
      switch (code) {
        case 'D':
          transaction.date = parseDate(value);
          break;
        case 'T':
          transaction.amount = parseAmount(value);
          break;
        case 'P':
          transaction.description = value;
          transaction.merchant = value;
          break;
        case 'M':
          transaction.description = (transaction.description || '') + ' ' + value;
          break;
        case 'L':
          transaction.category = value;
          break;
      }
    });
    
    if (transaction.date && !isNaN(transaction.amount as number)) {
      transactions.push(transaction);
    }
  });
  
  return transactions;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

const parseDate = (value: string): string => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    // Try different date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,   // MM-DD-YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
    ];
    
    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        if (format === formats[2]) {
          // YYYY-MM-DD
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3])).toISOString().split('T')[0];
        } else {
          // MM/DD/YYYY or MM-DD-YYYY
          return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2])).toISOString().split('T')[0];
        }
      }
    }
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
};

const parseOFXDate = (value: string): string => {
  // OFX date format: YYYYMMDD or YYYYMMDDHHMMSS
  const dateStr = value.substring(0, 8);
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day).toISOString().split('T')[0];
};

const parseAmount = (value: string): number => {
  // Remove currency symbols and commas
  const cleaned = value.replace(/[$,\s]/g, '');
  return parseFloat(cleaned) || 0;
};

const extractOFXField = (content: string, field: string): string | null => {
  const match = content.match(new RegExp(`<${field}>([^<]+)`));
  return match ? match[1].trim() : null;
};

export const detectDuplicates = (transactions: Transaction[]): Transaction[] => {
  const duplicateMap = new Map<string, Transaction[]>();
  
  transactions.forEach(transaction => {
    // First try FITID matching
    if (transaction.fitid) {
      const fitidKey = `fitid-${transaction.fitid}`;
      if (!duplicateMap.has(fitidKey)) {
        duplicateMap.set(fitidKey, []);
      }
      duplicateMap.get(fitidKey)!.push(transaction);
    } else {
      // Fall back to date + amount + merchant matching
      const key = `${transaction.date}-${Math.abs(transaction.amount)}-${transaction.merchant?.toLowerCase().trim()}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key)!.push(transaction);
    }
  });
  
  // Mark duplicates
  duplicateMap.forEach(group => {
    if (group.length > 1) {
      // Keep the first one, mark others as duplicates
      group.slice(1).forEach(transaction => {
        transaction.isDuplicate = true;
      });
    }
  });
  
  return transactions;
};

export const detectTransfers = (transactions: Transaction[]): Transaction[] => {
  const transferCandidates = new Map<string, Transaction[]>();
  
  transactions.forEach(transaction => {
    if (transaction.description?.toLowerCase().includes('transfer') || 
        transaction.category?.toLowerCase().includes('transfer')) {
      transaction.isTransfer = true;
      return;
    }
    
    // Look for matching amounts within 2 days
    const dateKey = transaction.date;
    const amountKey = Math.abs(transaction.amount);
    const key = `${dateKey}-${amountKey}`;
    
    if (!transferCandidates.has(key)) {
      transferCandidates.set(key, []);
    }
    transferCandidates.get(key)!.push(transaction);
  });
  
  // Find matching pairs
  transferCandidates.forEach(group => {
    if (group.length === 2) {
      const [t1, t2] = group;
      if (Math.abs(t1.amount + t2.amount) < 0.01 && t1.account !== t2.account) {
        t1.isTransfer = true;
        t2.isTransfer = true;
      }
    }
  });
  
  return transactions;
};

export const applyCategoryRules = (transaction: Transaction, rules: CategoryRule[]): Transaction => {
  for (const rule of rules.sort((a, b) => b.confidence - a.confidence)) {
    if (matchesRule(transaction, rule)) {
      return {
        ...transaction,
        category: rule.action.category,
        subcategory: rule.action.subcategory,
        needWantSaving: rule.action.needWantSaving,
      };
    }
  }
  return transaction;
};

const matchesRule = (transaction: Transaction, rule: CategoryRule): boolean => {
  const { condition } = rule;
  const fieldValue = transaction[condition.field as keyof Transaction]?.toString().toLowerCase() || '';
  
  switch (condition.type) {
    case 'contains':
      return fieldValue.includes(condition.value.toString().toLowerCase());
    case 'equals':
      return fieldValue === condition.value.toString().toLowerCase();
    case 'regex':
      try {
        const regex = new RegExp(condition.value.toString(), 'i');
        return regex.test(fieldValue);
      } catch {
        return false;
      }
    case 'mcc':
      return transaction.mcc === condition.value.toString();
    case 'amount_range':
      const amount = Math.abs(transaction.amount);
      return amount >= (condition.value as number) && amount <= (condition.value2 || Infinity);
    default:
      return false;
  }
};