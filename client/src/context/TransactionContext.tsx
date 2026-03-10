import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ExpenseItem } from '../types/expense';
import { isIncomeCategory } from '../utils/expense';

interface TransactionContextType {
  transactions: ExpenseItem[];
  setTransactions: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  addTransaction: (item: ExpenseItem) => void;
  updateTransaction: (item: ExpenseItem) => void;
  deleteTransaction: (id: string) => void;
  totals: { income: number; expense: number; balance: number };
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<ExpenseItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('snapsheet_transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('snapsheet_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (item: ExpenseItem) => {
    setTransactions(prev => [...prev, item]);
  };

  const updateTransaction = (item: ExpenseItem) => {
    setTransactions(prev => prev.map(t => t.id === item.id ? item : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (isIncomeCategory(t.category)) {
        income += t.spent;
      } else {
        expense += t.spent;
      }
    });
    return { income, expense, balance: income - expense };
  }, [transactions]);

  return (
    <TransactionContext.Provider value={{
      transactions,
      setTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      totals,
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
