/**
 * [역할] 거래 내역 추가/수정 모달 컴포넌트
 * - category, sub_category: 기존 목록 선택 + 직접 입력 모두 가능한 콤보박스
 * - transactions prop으로 기존에 사용된 카테고리/서브카테고리를 옵션에 포함
 */

import React, { useMemo } from 'react';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExpenseItem } from '../types/expense';
import { CATEGORY_COLORS } from '../constants/categories';

interface TransactionModalProps {
  isOpen: boolean;
  item: ExpenseItem | null;
  isNew?: boolean;
  transactions: ExpenseItem[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onChange: (item: ExpenseItem) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  item,
  isNew = false,
  transactions,
  onClose,
  onSave,
  onChange,
}) => {
  const categoryOptions = useMemo(() => {
    const base = Object.keys(CATEGORY_COLORS);
    const fromTransactions = transactions.map(t => t.category).filter(Boolean);
    return Array.from(new Set([...base, ...fromTransactions]));
  }, [transactions]);

  const subCategoryOptions = useMemo(() => {
    if (!item) return [];
    const fromTransactions = transactions
      .filter(t => t.category === item.category && t.sub_category)
      .map(t => t.sub_category);
    return Array.from(new Set(fromTransactions));
  }, [transactions, item?.category]);

  return (
    <AnimatePresence>
      {isOpen && item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-black/5 flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tight">
                {isNew ? '새 내역 추가' : '내역 수정'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={onSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
                  <input
                    type="date"
                    required
                    value={item.date}
                    onChange={e => onChange({ ...item, date: e.target.value })}
                    className="w-full bg-gray-50 border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Category <span className="normal-case font-medium text-gray-300 text-[9px]">선택 또는 직접 입력</span>
                  </label>
                  <input
                    list="category-options"
                    required
                    value={item.category}
                    onChange={e => onChange({ ...item, category: e.target.value, sub_category: '' })}
                    placeholder="카테고리"
                    className="w-full bg-gray-50 border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <datalist id="category-options">
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                <input
                  type="text"
                  placeholder="내역을 입력하세요"
                  value={item.description}
                  onChange={e => onChange({ ...item, description: e.target.value })}
                  className="w-full bg-gray-50 border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Sub Category <span className="normal-case font-medium text-gray-300 text-[9px]">선택 또는 직접 입력</span>
                  </label>
                  <input
                    list="sub-category-options"
                    value={item.sub_category}
                    onChange={e => onChange({ ...item, sub_category: e.target.value })}
                    placeholder="소분류"
                    className="w-full bg-gray-50 border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <datalist id="sub-category-options">
                    {subCategoryOptions.map(sub => (
                      <option key={sub} value={sub} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</label>
                  <input
                    type="number"
                    required
                    value={item.spent}
                    onChange={e => onChange({ ...item, spent: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95"
                >
                  <Save className="w-6 h-6" />
                  저장하기
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};