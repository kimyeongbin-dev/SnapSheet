/**
 * [역할] 차트 컴포넌트
 * - CategoryPieChart: 카테고리별 지출 비중 파이차트
 * - DailyBarChart: 일별 지출 추이 바차트
 * - MonthlyBarChart: 월별 지출/수입 비교 바차트
 */

import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { ExpenseItem } from '../types/expense';
import { isIncomeCategory } from '../utils/expense';

const CHART_COLORS = [
  '#10b981', '#f97316', '#3b82f6', '#ec4899',
  '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444',
  '#84cc16', '#6366f1',
];

const formatAmount = (value: number) =>
  value >= 10000 ? `${(value / 10000).toFixed(0)}만` : `${value.toLocaleString()}`;

// 커스텀 툴팁
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-black/5 rounded-2xl px-4 py-3 shadow-xl">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
          {payload[0].name}
        </p>
        <p className="text-lg font-black text-gray-900">
          {payload[0].value.toLocaleString()}원
        </p>
      </div>
    );
  }
  return null;
};

// 카테고리별 파이차트
interface CategoryPieChartProps {
  transactions: ExpenseItem[];
}

export function CategoryPieChart({ transactions }: CategoryPieChartProps) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      if (!isIncomeCategory(t.category)) {
        map[t.category] = (map[t.category] || 0) + t.spent;
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-300 text-sm font-bold">
        데이터가 없습니다
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs font-bold text-gray-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 일별 지출 바차트
interface DailyBarChartProps {
  transactions: ExpenseItem[];
  year: number;
  month: number;
}

export function DailyBarChart({ transactions, year, month }: DailyBarChartProps) {
  const data = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const map: Record<number, number> = {};

    transactions.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        if (!isIncomeCategory(t.category)) {
          map[d.getDate()] = (map[d.getDate()] || 0) + t.spent;
        }
      }
    });

    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: `${i + 1}일`,
      지출: map[i + 1] || 0,
    }));
  }, [transactions, year, month]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatAmount}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="지출" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 월별 수입/지출 비교 바차트
interface MonthlyBarChartProps {
  transactions: ExpenseItem[];
  year: number;
}

export function MonthlyBarChart({ transactions, year }: MonthlyBarChartProps) {
  const data = useMemo(() => {
    const map: Record<number, { 수입: number; 지출: number }> = {};
    for (let i = 1; i <= 12; i++) map[i] = { 수입: 0, 지출: 0 };

    transactions.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (d.getFullYear() !== year) return;
      const m = d.getMonth() + 1;
      if (isIncomeCategory(t.category)) {
        map[m].수입 += t.spent;
      } else {
        map[m].지출 += t.spent;
      }
    });

    return Object.entries(map).map(([month, values]) => ({
      month: `${month}월`,
      ...values,
    }));
  }, [transactions, year]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatAmount}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="수입" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="지출" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}