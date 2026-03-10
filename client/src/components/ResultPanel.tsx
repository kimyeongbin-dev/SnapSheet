/**
 * [역할] 분석 결과 패널 (우측)
 * - 카테고리 선택 버튼 및 총액 표시
 * - 선택된 카테고리의 세부 항목 표시 (sub_category별 그룹화)
 * - 결과 없을 때 빈 상태(Empty State) UI
 *
 * [추가 예정]
 * - 데이터 내보내기 (CSV, Excel)
 * - 카테고리별 차트 시각화
 */

import { useState, useMemo, useEffect } from 'react';
import { DollarSign, LayoutGrid, Layers, Search, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResponse, ExpenseItem } from '../types/expense';
import ExpenseCard from './ExpenseCard';

const CATEGORY_COLORS: Record<string, string> = {
  '식비': 'bg-orange-100 text-orange-600 border-orange-200',
  '교통': 'bg-blue-100 text-blue-600 border-blue-200',
  '쇼핑': 'bg-pink-100 text-pink-600 border-pink-200',
  '의료': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  '주거': 'bg-indigo-100 text-indigo-600 border-indigo-200',
  '교육': 'bg-purple-100 text-purple-600 border-purple-200',
  '기타': 'bg-gray-100 text-gray-600 border-gray-200',
};

const getCategoryStyle = (category: string) =>
  CATEGORY_COLORS[category] || 'bg-emerald-100 text-emerald-600 border-emerald-200';

interface ResultPanelProps {
  result: AnalysisResponse | null;
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">{result.title || '추출된 데이터'}</h2>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString()} 분석 완료
          </p>
        </div>
        <div className="bg-white px-8 py-4 rounded-3xl shadow-xl shadow-black/5 border border-black/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Value</p>
            <p className="text-2xl font-black">{result.total.spent_sum.toLocaleString()}원</p>
          </div>
        </div>
      </div>

      {/* Category Selector */}
      <div className="flex flex-wrap gap-3">
        {Object.keys(result.grouped_items).map((category) => (
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
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">{sub}</h4>
                      <div className="h-px flex-1 bg-black/5" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item, idx) => (
                        <ExpenseCard key={idx} item={item} />
                      ))}
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
