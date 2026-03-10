import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid,
  ChevronRight,
  Wallet,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { ExpenseItem } from '../types/expense';
import { TransactionModal } from '../components/TransactionModal';
import { getCategoryStyle } from '../constants/categories';
import { isIncomeCategory } from '../utils/expense';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { transactions, totals, deleteTransaction, updateTransaction } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'expense' | 'income'>('expense');
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(transactions.map(t => t.category)));
    return cats.sort();
  }, [transactions]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const isInc = isIncomeCategory(cat);
      return viewMode === 'income' ? isInc : !isInc;
    });
  }, [categories, viewMode]);

  const displayItems = useMemo(() => {
    if (!selectedCategory) return [];
    return transactions.filter(t => t.category === selectedCategory);
  }, [transactions, selectedCategory]);

  const groupedDisplayItems = useMemo(() => {
    const groups: Record<string, ExpenseItem[]> = {};
    displayItems.forEach(item => {
      const sub = item.sub_category || '기타';
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(item);
    });
    return groups;
  }, [displayItems]);

  const handleEdit = (item: ExpenseItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteTransaction(id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateTransaction(editingItem);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10"
    >
      {/* Left: Stats & Categories */}
      <div className="lg:col-span-4 space-y-8">
        <section className="bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Quick Overview</h3>
          <div className="space-y-4">
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <ArrowUpRight className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider">Total Income</span>
              </div>
              <p className="text-2xl font-black text-emerald-900">{totals.income.toLocaleString()}원</p>
            </div>
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <ArrowDownRight className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider">Total Expense</span>
              </div>
              <p className="text-2xl font-black text-red-900">{totals.expense.toLocaleString()}원</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Categories</h3>
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => { setViewMode('expense'); setSelectedCategory(null); }}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'expense' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
              >
                지출
              </button>
              <button
                onClick={() => { setViewMode('income'); setSelectedCategory(null); }}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'income' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
              >
                수입
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredCategories.length > 0 ? filteredCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group
                  ${selectedCategory === category
                    ? `${getCategoryStyle(category)} shadow-md`
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-4 h-4 opacity-50" />
                  {category}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black opacity-50">
                    {transactions.filter(t => t.category === category).length}
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedCategory === category ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </div>
              </button>
            )) : (
              <div className="text-center py-10">
                <p className="text-xs font-bold text-gray-300 uppercase">No Data Found</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right: Main Content */}
      <div className="lg:col-span-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Finance Manager</h2>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> {transactions.length}개의 내역이 관리되고 있습니다.
            </p>
          </div>
          <div className="bg-white px-8 py-4 rounded-3xl shadow-xl shadow-black/5 border border-black/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Net Balance</p>
              <p className={`text-2xl font-black ${totals.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totals.balance.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/5 overflow-hidden min-h-[500px]">
          <AnimatePresence mode="wait">
            {selectedCategory ? (
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <span className={`w-3 h-8 rounded-full ${getCategoryStyle(selectedCategory).split(' ')[0]}`} />
                    {selectedCategory} 상세 내역
                  </h3>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase">Category Total</p>
                    <p className="text-xl font-black">
                      {transactions
                        .filter(t => t.category === selectedCategory)
                        .reduce((acc, curr) => acc + curr.spent, 0)
                        .toLocaleString()}원
                    </p>
                  </div>
                </div>

                <div className="space-y-12">
                  {(Object.entries(groupedDisplayItems) as [string, ExpenseItem[]][]).map(([sub, items]) => (
                    <div key={sub} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">{sub}</h4>
                          <div className="h-px w-24 bg-black/5" />
                        </div>
                        <span className="text-xs font-bold text-gray-400">{items.length} items</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-black/5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <th className="pb-3 pl-2">Date</th>
                              <th className="pb-3">Description</th>
                              <th className="pb-3 text-right">Budget</th>
                              <th className="pb-3 text-right">Spent</th>
                              <th className="pb-3 text-right pr-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5">
                            {items.map((item) => (
                              <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 pl-2 text-xs font-medium text-gray-400 tabular-nums">
                                  {item.date || '-'}
                                </td>
                                <td className="py-4">
                                  <p className="text-sm font-bold text-gray-900">{item.description || '(내용 없음)'}</p>
                                  <p className="text-[10px] text-gray-400 font-medium">{item.sub_category}</p>
                                </td>
                                <td className="py-4 text-right text-xs font-bold text-gray-400 tabular-nums">
                                  {item.budget > 0 ? `${item.budget.toLocaleString()}원` : '-'}
                                </td>
                                <td className="py-4 text-right">
                                  <span className="text-sm font-black text-gray-900 tabular-nums">
                                    {item.spent.toLocaleString()}원
                                  </span>
                                </td>
                                <td className="py-4 text-right pr-2">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-20 py-40">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                  <Search className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-bold mb-2">데이터를 선택하세요</h3>
                <p className="text-gray-400 max-w-xs mx-auto">좌측 카테고리를 선택하여 상세 내역을 확인하거나, AI 스캐너로 새로운 데이터를 추가하세요.</p>
                <Link
                  to="/scanner"
                  className="mt-8 text-emerald-600 font-bold flex items-center gap-2 hover:underline"
                >
                  AI 스캐너로 이동하기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        item={editingItem}
        isNew={false}
        transactions={transactions}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        onChange={setEditingItem}
      />
    </motion.div>
  );
};