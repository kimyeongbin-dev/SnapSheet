/**
 * [역할] 분석 결과 패널 (Scanner 페이지 우측)
 * - 카테고리 선택 버튼 및 총액 표시
 * - 선택된 카테고리의 세부 항목 표시 (sub_category별 그룹화)
 * - 결과 없을 때 빈 상태(Empty State) UI
 */

import { useState, useMemo, useEffect } from 'react';
import { DollarSign, LayoutGrid, Layers, Search, Plus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResponse, ExpenseItem } from '../types/expense';
import { getCategoryStyle } from '../constants/categories';
import { isIncomeCategory } from '../utils/expense';

interface ResultPanelProps {
  result: AnalysisResponse | null;
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    if (result) {
      const categories = Object.keys(result.grouped_items);
      setSelectedCategory(categories.length > 0 ? categories[0] : null);
    } else {
      setSelectedCategory(null);
    }
  }, [result]);

  const subGroupedItems = useMemo(() => {
    if (!result || !selectedCategory) return null;
    const categoryData = result.grouped_items[selectedCategory];
    if (!categoryData) return null;

    const groups: Record<string, ExpenseItem[]> = {};
    categoryData.items.forEach((item) => {
      const sub = item.sub_category || '기타';
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(item);
    });
    return groups;
  }, [result, selectedCategory]);

  const categoryMetadata = useMemo(() => {
    if (!result) return { roots: [], leaves: [], all: [] };

    const categories = Object.keys(result.grouped_items);
    const roots: string[] = [];
    const leaves: string[] = [];

    categories.forEach(cat => {
      const data = result.grouped_items[cat];
      const isSummary = data.items.length > 0 && data.items.every(item => !item.description && item.sub_category);
      if (isSummary) {
        roots.push(cat);
      } else {
        leaves.push(cat);
      }
    });

    return { roots, leaves, all: categories };
  }, [result]);

  const calculatedTotals = useMemo(() => {
    if (!result) return { income: 0, expense: 0, savings: 0 };

    let income = 0;
    let expense = 0;
    let savings = 0;

    categoryMetadata.all.forEach(cat => {
      const data = result.grouped_items[cat];
      if (categoryMetadata.roots.includes(cat)) return;

      if (isIncomeCategory(cat)) {
        income += data.total_spent;
      } else if (cat.includes('저축') || cat.includes('투자') || cat.includes('청약')) {
        savings += data.total_spent;
        expense += data.total_spent;
      } else {
        expense += data.total_spent;
      }
    });

    return { income, expense, savings };
  }, [result, categoryMetadata]);

  const filteredCategories = useMemo(() => {
    if (!result) return [];
    return categoryMetadata.all.filter(cat => {
      const isInc = isIncomeCategory(cat);
      return viewMode === 'income' ? isInc : !isInc;
    });
  }, [result, categoryMetadata, viewMode]);

  if (!result) {
    return (
      <motion.div
        key="empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center text-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100"
      >
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
          <Layers className="w-12 h-12 text-gray-200" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-3">Ready to Digitalize?</h3>
        <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
          왼쪽 패널에 이미지를 업로드하고 분석을 시작하세요. <br />
          SnapSheet가 아날로그 데이터를 디지털로 바꿔드립니다.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white px-8 py-6 rounded-3xl shadow-xl shadow-black/5 border border-black/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Income</p>
            <p className="text-2xl font-black text-emerald-600">{calculatedTotals.income.toLocaleString()}원</p>
          </div>
        </div>
        <div className="bg-white px-8 py-6 rounded-3xl shadow-xl shadow-black/5 border border-black/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Expense</p>
            <p className="text-2xl font-black text-red-600">{calculatedTotals.expense.toLocaleString()}원</p>
          </div>
        </div>
        <div className="bg-white px-8 py-6 rounded-3xl shadow-xl shadow-black/5 border border-black/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Net Balance</p>
            <p className="text-2xl font-black text-blue-600">
              {(calculatedTotals.income - calculatedTotals.expense).toLocaleString()}원
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle & Category Selector */}
      <div className="space-y-6">
        <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
          <button
            onClick={() => { setViewMode('expense'); setSelectedCategory(null); }}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'expense' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            지출 내역
          </button>
          <button
            onClick={() => { setViewMode('income'); setSelectedCategory(null); }}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'income' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            수입 내역
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {filteredCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2 flex items-center gap-2
                ${selectedCategory === category
                  ? `${getCategoryStyle(category)} border-current shadow-lg`
                  : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              {category}
              <span className="ml-1 opacity-50">({result.grouped_items[category].items.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Detail */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/5 overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          {selectedCategory && subGroupedItems ? (
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
                    {result.grouped_items[selectedCategory].total_spent.toLocaleString()}원
                  </p>
                </div>
              </div>

              <div className="space-y-10">
                {(Object.entries(subGroupedItems) as [string, ExpenseItem[]][]).map(([sub, items]) => (
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
                            <th className="pb-3 text-right pr-2">Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {items.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 pl-2 text-xs font-medium text-gray-400 tabular-nums">
                                {item.date || '-'}
                              </td>
                              <td className="py-4">
                                <p className="text-sm font-bold text-gray-900">{item.description}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{item.sub_category}</p>
                              </td>
                              <td className="py-4 text-right text-xs font-bold text-gray-400 tabular-nums">
                                {item.budget > 0 ? `${item.budget.toLocaleString()}원` : '-'}
                              </td>
                              <td className="py-4 text-right pr-2">
                                <span className="text-sm font-black text-gray-900 tabular-nums">
                                  {item.spent.toLocaleString()}원
                                </span>
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
            <div className="h-full flex flex-col items-center justify-center text-center p-20">
              <Search className="w-16 h-16 text-gray-100 mb-6" />
              <p className="text-gray-400 font-medium">카테고리를 선택하여 상세 내역을 확인하세요.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
