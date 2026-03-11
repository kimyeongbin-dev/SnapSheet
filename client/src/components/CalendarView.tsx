/**
 * [역할] 달력 뷰 컴포넌트
 * - 날짜별 지출 금액을 달력 형태로 시각화
 * - 지출이 많은 날일수록 셀 색상이 진해짐
 */

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ExpenseItem } from '../types/expense';
import { isIncomeCategory } from '../utils/expense';

interface CalendarViewProps {
  transactions: ExpenseItem[];
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarView({ transactions }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  // 해당 월의 날짜별 지출 합계
  const dailyExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      if (!t.date || isIncomeCategory(t.category)) return;
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        const key = t.date;
        map[key] = (map[key] || 0) + t.spent;
      }
    });
    return map;
  }, [transactions, year, month]);

  // 선택된 날짜의 거래 내역
  const selectedTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate]);

  // 최대 지출액 (색상 강도 계산용)
  const maxExpense = useMemo(() => {
    const values = Object.values(dailyExpenses);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [dailyExpenses]);

  // 달력 그리드 계산
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    // 6줄 맞추기
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  const getIntensity = (amount: number) => {
    if (!maxExpense || amount === 0) return 0;
    return amount / maxExpense;
  };

  const getCellStyle = (intensity: number) => {
    if (intensity === 0) return '';
    if (intensity < 0.25) return 'bg-emerald-50 border-emerald-100';
    if (intensity < 0.5) return 'bg-emerald-100 border-emerald-200';
    if (intensity < 0.75) return 'bg-emerald-200 border-emerald-300';
    return 'bg-emerald-400 border-emerald-500';
  };

  const getTextStyle = (intensity: number) => {
    if (intensity >= 0.75) return 'text-white';
    if (intensity >= 0.5) return 'text-emerald-900';
    return 'text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h3 className="text-xl font-black tracking-tight">
          {year}년 {month}월
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day, i) => (
          <div
            key={day}
            className={`text-center text-[10px] font-black uppercase tracking-widest py-2
              ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const expense = dailyExpenses[dateStr] || 0;
          const intensity = getIntensity(expense);
          const isToday = dateStr === today.toISOString().split('T')[0];
          const isSelected = selectedDate === dateStr;
          const dayOfWeek = (idx) % 7;

          return (
            <motion.button
              key={day}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`relative aspect-square rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-all
                ${isSelected
                  ? 'ring-2 ring-emerald-500 ring-offset-1'
                  : ''
                }
                ${expense > 0
                  ? `${getCellStyle(intensity)} border`
                  : 'border-transparent hover:bg-gray-50'
                }
                ${isToday && !expense ? 'border-emerald-300 border' : ''}
              `}
            >
              <span className={`text-sm font-black
                ${isToday ? 'text-emerald-600' : ''}
                ${expense > 0 ? getTextStyle(intensity) : dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-700'}
              `}>
                {day}
              </span>
              {expense > 0 && (
                <span className={`text-[9px] font-black leading-none ${getTextStyle(intensity)}`}>
                  {expense >= 10000 ? `${(expense / 10000).toFixed(0)}만` : expense.toLocaleString()}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 선택된 날짜 상세 */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-2xl p-5 space-y-3"
        >
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
            {selectedDate} 내역
          </p>
          {selectedTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium">내역이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {selectedTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-black/5">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.description || '(내용 없음)'}</p>
                    <p className="text-[10px] text-gray-400">{t.category} · {t.sub_category}</p>
                  </div>
                  <p className={`text-sm font-black ${isIncomeCategory(t.category) ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {isIncomeCategory(t.category) ? '+' : '-'}{t.spent.toLocaleString()}원
                  </p>
                </div>
              ))}
              <div className="flex justify-end pt-1">
                <p className="text-xs font-black text-gray-500">
                  합계: {selectedTransactions.reduce((acc, t) => acc + t.spent, 0).toLocaleString()}원
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 범례 */}
      <div className="flex items-center gap-3 justify-end">
        <p className="text-[10px] font-bold text-gray-400">지출 강도</p>
        <div className="flex gap-1">
          {['bg-emerald-50', 'bg-emerald-100', 'bg-emerald-200', 'bg-emerald-400'].map((cls, i) => (
            <div key={i} className={`w-5 h-5 rounded-md ${cls} border border-black/5`} />
          ))}
        </div>
      </div>
    </div>
  );
}