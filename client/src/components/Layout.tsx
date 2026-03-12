import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Wallet, LayoutGrid, Camera, TrendingUp, TrendingDown } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { ExpenseItem } from '../types/expense';
import { TransactionModal } from './TransactionModal';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { addTransaction, updateTransaction, transactions } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);

  const openModal = (defaultCategory: string) => {
    setEditingItem({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      category: defaultCategory,
      sub_category: '',
      description: '',
      budget: 0,
      spent: 0,
      diff: 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const exists = transactions.find(t => t.id === editingItem.id);
    if (exists) {
      updateTransaction(editingItem);
    } else {
      addTransaction(editingItem);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SnapSheet</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <Link
                to="/"
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${location.pathname === '/' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">대시보드</span>
              </Link>
              <Link
                to="/scanner"
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${location.pathname === '/scanner' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">AI 스캐너</span>
              </Link>
            </div>

            {/* 수입 추가 버튼 */}
            <button
              onClick={() => openModal('수입')}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-100 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">수입 추가</span>
            </button>

            {/* 지출 추가 버튼 */}
            <button
              onClick={() => openModal('식비')}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-all"
            >
              <TrendingDown className="w-4 h-4" />
              <span className="hidden sm:inline">지출 추가</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <Outlet />
      </main>

      <footer className="max-w-6xl mx-auto p-10 mt-10 border-t border-black/5 text-center">
        <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">Powered by SnapSheet AI Engine</p>
      </footer>

      <TransactionModal
        isOpen={isModalOpen}
        item={editingItem}
        isNew={!transactions.find(t => t.id === editingItem?.id)}
        transactions={transactions}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        onChange={setEditingItem}
      />
    </div>
  );
};