import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, ChevronRight, Wallet, DollarSign,
  ArrowUpRight, ArrowDownRight, Search, Edit2, Trash2,
  BarChart2, Calendar, TrendingUp,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { ExpenseItem } from '../types/expense';
import { TransactionModal } from '../components/TransactionModal';
import { getCategoryStyle } from '../constants/categories';
import { isIncomeCategory } from '../utils/expense';
import { CategoryPieChart, DailyBarChart, MonthlyBarChart } from '../components/Charts';
import { CalendarView } from '../components/CalendarView';
import { Link } from 'react-router-dom';

type TabType = 'transactions' | 'overview' | 'calendar';

export const Dashboard: React.FC = () => {
  const { transactions, totals, deleteTransaction, updateTransaction } = useTransactions();
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'expense' | 'income'>('expense');
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = new Date();
  const [chartYear] = useState(today.getFullYear());
  const [chartMonth] = useState(today.getMonth() + 1);

  // 이번 달 / 지난 달 지출 계산
  const monthlyStats = useMemo(() => {
    const thisMonth = { income: 0, expense: 0 };
    const lastMonth = { income: 0, expense: 0 };

    transactions.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const isInc = isIncomeCategory(t.category);

      if (y === today.getFullYear() && m === today.getMonth() + 1) {
        if (isInc) thisMonth.income += t.spent;
        else thisMonth.expense += t.spent;
      }

      const lastDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      if (y === lastDate.getFullYear() && m === lastDate.getMonth() + 1) {
        if (isInc) lastMonth.income += t.spent;
        else lastMonth.expense += t.spent;
      }
    });

    const expenseChange = lastMonth.expense > 0
      ? ((thisMonth.expense - lastMonth.expense) / lastMonth.expense) * 100
      : 0;

    return { thisMonth, lastMonth, expenseChange };
  }, [transactions]);

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
    if (confirm('정말 삭제하시겠습니까?')) deleteTransaction(id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateTransaction(editingItem);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const tabs = [
    { id: 'transactions' as TabType, label: '내역', icon: LayoutGrid },
    { id: 'overview' as TabType, label: '분석', icon: BarChart2 },
    { id: 'calendar' as TabType, label: '달력', icon: Calendar },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
          <div className="flex items-center gap-2 text-emerald-600 mb-3">
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-wider">이번 달 수입</span>
          </div>
          <p className="text-3xl font-black text-emerald-900">{monthlyStats.thisMonth.income.toLocaleString()}원</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
          <div className="flex items-center gap-2 text-red-500 mb-3">
            <ArrowDownRight className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-wider">이번 달 지출</span>
          </div>
          <p className="text-3xl font-black text-red-900">{monthlyStats.thisMonth.expense.toLocaleString()}원</p>
          {monthlyStats.expenseChange !== 0 && (
            <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${monthlyStats.expenseChange > 0 ? 'text-red-400' : 'text-emerald-500'}`}>
              <TrendingUp className="w-3 h-3" />
              전월 대비 {monthlyStats.expenseChange > 0 ? '+' : ''}{monthlyStats.expenseChange.toFixed(1)}%
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
          <div className="flex items-center gap-2 text-blue-500 mb-3">
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-wider">순 잔액</span>
          </div>
          <p className={`text-3xl font-black ${totals.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {totals.balance.toLocaleString()}원
          </p>
          <p className="text-xs font-bold text-gray-400 mt-1">
            총 {transactions.length}건
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                ${activeTab === tab.id ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <AnimatePresence mode="wait">

        {/* 내역 탭 */}
        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* 카테고리 사이드바 */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Categories</h3>
                  <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button
                      onClick={() => { setViewMode('expense'); setSelectedCategory(null); }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'expense' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                    >
                      지출
                    </button>
                    <button
                      onClick={() => { setViewMode('income'); setSelectedCategory(null); }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'income' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
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
                      className={`w-full px-4 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group
                        ${selectedCategory === category
                          ? `${getCategoryStyle(category)} shadow-md`
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-3.5 h-3.5 opacity-50" />
                        <span className="truncate">{category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-black opacity-50">
                          {transactions.filter(t => t.category === category).length}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedCategory === category ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                      </div>
                    </button>
                  )) : (
                    <p className="text-center py-8 text-xs font-bold text-gray-300 uppercase">No Data</p>
                  )}
                </div>
              </div>
            </div>

            {/* 내역 테이블 */}
            <div className="lg:col-span-9">
              <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/5 border border-black/5 overflow-hidden min-h-[400px]">
                <AnimatePresence mode="wait">
                  {selectedCategory ? (
                    <motion.div
                      key={selectedCategory}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-8"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                          <span className={`w-2.5 h-7 rounded-full ${getCategoryStyle(selectedCategory).split(' ')[0]}`} />
                          {selectedCategory}
                        </h3>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">합계</p>
                          <p className="text-lg font-black">
                            {transactions.filter(t => t.category === selectedCategory).reduce((acc, curr) => acc + curr.spent, 0).toLocaleString()}원
                          </p>
                        </div>
                      </div>

                      <div className="space-y-10">
                        {(Object.entries(groupedDisplayItems) as [string, ExpenseItem[]][]).map(([sub, items]) => (
                          <div key={sub} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{sub}</h4>
                                <div className="h-px w-16 bg-black/5" />
                              </div>
                              <span className="text-[10px] font-bold text-gray-400">{items.length} items</span>
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
                                      <td className="py-3.5 pl-2 text-xs font-medium text-gray-400 tabular-nums">{item.date || '-'}</td>
                                      <td className="py-3.5">
                                        <p className="text-sm font-bold text-gray-900">{item.description || '(내용 없음)'}</p>
                                        <p className="text-[10px] text-gray-400">{item.sub_category}</p>
                                      </td>
                                      <td className="py-3.5 text-right text-xs font-bold text-gray-400 tabular-nums">
                                        {item.budget > 0 ? `${item.budget.toLocaleString()}원` : '-'}
                                      </td>
                                      <td className="py-3.5 text-right">
                                        <span className="text-sm font-black text-gray-900 tabular-nums">{item.spent.toLocaleString()}원</span>
                                      </td>
                                      <td className="py-3.5 text-right pr-2">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
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
                    <div className="h-full flex flex-col items-center justify-center text-center p-20 py-32">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-9 h-9 text-gray-200" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">카테고리를 선택하세요</h3>
                      <p className="text-gray-400 text-sm max-w-xs mx-auto">좌측에서 카테고리를 선택하거나, AI 스캐너로 새로운 데이터를 추가하세요.</p>
                      <Link to="/scanner" className="mt-6 text-emerald-600 font-bold flex items-center gap-2 text-sm hover:underline">
                        AI 스캐너로 이동하기 <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* 분석 탭 */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {transactions.length === 0 ? (
              <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-black/5 flex flex-col items-center justify-center text-center p-20 gap-6">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                  <BarChart2 className="w-9 h-9 text-gray-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">분석할 데이터가 없습니다</h3>
                  <p className="text-gray-400 text-sm">AI 스캐너로 데이터를 추가하면 차트가 표시됩니다.</p>
                </div>
                <Link to="/scanner" className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                  AI 스캐너로 이동하기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">카테고리별 지출 비중</h3>
                  <CategoryPieChart transactions={transactions} />
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">
                    {chartYear}년 {chartMonth}월 일별 지출
                  </h3>
                  <DailyBarChart transactions={transactions} year={chartYear} month={chartMonth} />
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5 lg:col-span-2">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">
                    {chartYear}년 월별 수입/지출
                  </h3>
                  <MonthlyBarChart transactions={transactions} year={chartYear} />
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* 달력 탭 */}
        {activeTab === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {transactions.length === 0 ? (
              <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-black/5 flex flex-col items-center justify-center text-center p-20 gap-6">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                  <Calendar className="w-9 h-9 text-gray-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">표시할 데이터가 없습니다</h3>
                  <p className="text-gray-400 text-sm">AI 스캐너로 데이터를 추가하면 달력에 표시됩니다.</p>
                </div>
                <Link to="/scanner" className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                  AI 스캐너로 이동하기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">달력으로 보기</h3>
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
                    <span className="flex items-center gap-1.5"><Wallet className="w-4 h-4" /> 총 {transactions.length}건</span>
                  </div>
                </div>
                <CalendarView transactions={transactions} />
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

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