/**
 * [역할] SVG 기반 차트 컴포넌트 (recharts 제거 - React 19 호환)
 * - CategoryPieChart: 카테고리별 지출 도넛 차트
 * - DailyBarChart: 일별 지출 바차트
 * - MonthlyBarChart: 월별 수입/지출 비교 바차트
 */

import { useMemo } from 'react';
import { ExpenseItem } from '../types/expense';
import { isIncomeCategory } from '../utils/expense';

const CHART_COLORS = [
  '#10b981', '#f97316', '#3b82f6', '#ec4899',
  '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444',
  '#84cc16', '#6366f1',
];

const formatAmount = (value: number) =>
  value >= 10000 ? `${(value / 10000).toFixed(0)}만` : `${value.toLocaleString()}`;

// ─── 파이차트 ───────────────────────────────────────────
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

  const total = data.reduce((a, b) => a + b.value, 0);
  const cx = 140;
  const cy = 140;
  const outerR = 110;
  const innerR = 65;

  // 각 슬라이스 path 계산
  let currentAngle = -Math.PI / 2;
  const slices = data.map((item, i) => {
    const angle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

    return { ...item, path, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <svg width="280" height="280" viewBox="0 0 280 280" className="flex-shrink-0">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
            className="transition-opacity hover:opacity-80"
          />
        ))}
        {/* 중앙 텍스트 */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="text-xs" fill="#6b7280" fontSize="11" fontWeight="700">
          TOTAL
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#111827" fontSize="13" fontWeight="900">
          {formatAmount(total)}원
        </text>
      </svg>

      {/* 범례 */}
      <div className="flex flex-col gap-2 min-w-0 w-full">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-xs font-bold text-gray-700 truncate">{slice.name}</span>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs font-black text-gray-900">{formatAmount(slice.value)}원</span>
              <span className="text-[10px] text-gray-400 ml-1">({((slice.value / total) * 100).toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 일별 바차트 ─────────────────────────────────────────
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
      day: i + 1,
      value: map[i + 1] || 0,
    }));
  }, [transactions, year, month]);

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const svgW = 520;
  const svgH = 200;
  const padL = 48;
  const padR = 8;
  const padT = 10;
  const padB = 24;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const barW = Math.max(2, chartW / data.length - 2);

  // y축 눈금
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({
    y: padT + chartH * (1 - r),
    label: formatAmount(maxVal * r),
  }));

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="overflow-visible">
      {/* y축 그리드 */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={svgW - padR} y2={t.y} stroke="#f0f0f0" strokeWidth="1" />
          <text x={padL - 6} y={t.y + 4} textAnchor="end" fill="#9ca3af" fontSize="9" fontWeight="700">{t.label}</text>
        </g>
      ))}

      {/* 바 */}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = padL + (chartW / data.length) * i + (chartW / data.length - barW) / 2;
        const y = padT + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(barH, 0)} fill="#10b981" rx="2" className="transition-opacity hover:opacity-70" />
            {/* 5일마다 x축 레이블 */}
            {(d.day === 1 || d.day % 5 === 0) && (
              <text x={x + barW / 2} y={svgH - 6} textAnchor="middle" fill="#9ca3af" fontSize="9" fontWeight="700">{d.day}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── 월별 바차트 ─────────────────────────────────────────
interface MonthlyBarChartProps {
  transactions: ExpenseItem[];
  year: number;
}

export function MonthlyBarChart({ transactions, year }: MonthlyBarChartProps) {
  const data = useMemo(() => {
    const map: Record<number, { income: number; expense: number }> = {};
    for (let i = 1; i <= 12; i++) map[i] = { income: 0, expense: 0 };

    transactions.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (d.getFullYear() !== year) return;
      const m = d.getMonth() + 1;
      if (isIncomeCategory(t.category)) {
        map[m].income += t.spent;
      } else {
        map[m].expense += t.spent;
      }
    });

    return Object.entries(map).map(([month, v]) => ({ month: Number(month), ...v }));
  }, [transactions, year]);

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const svgW = 520;
  const svgH = 200;
  const padL = 48;
  const padR = 8;
  const padT = 10;
  const padB = 24;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const groupW = chartW / 12;
  const barW = groupW * 0.35;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({
    y: padT + chartH * (1 - r),
    label: formatAmount(maxVal * r),
  }));

  return (
    <div className="space-y-3">
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="overflow-visible">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={t.y} x2={svgW - padR} y2={t.y} stroke="#f0f0f0" strokeWidth="1" />
            <text x={padL - 6} y={t.y + 4} textAnchor="end" fill="#9ca3af" fontSize="9" fontWeight="700">{t.label}</text>
          </g>
        ))}

        {data.map((d) => {
          const gx = padL + groupW * (d.month - 1);
          const incomeH = (d.income / maxVal) * chartH;
          const expenseH = (d.expense / maxVal) * chartH;
          return (
            <g key={d.month}>
              {/* 수입 바 */}
              <rect
                x={gx + groupW * 0.1}
                y={padT + chartH - incomeH}
                width={barW}
                height={Math.max(incomeH, 0)}
                fill="#10b981"
                rx="2"
                className="transition-opacity hover:opacity-70"
              />
              {/* 지출 바 */}
              <rect
                x={gx + groupW * 0.1 + barW + 2}
                y={padT + chartH - expenseH}
                width={barW}
                height={Math.max(expenseH, 0)}
                fill="#ef4444"
                rx="2"
                className="transition-opacity hover:opacity-70"
              />
              {/* x축 레이블 */}
              <text x={gx + groupW / 2} y={svgH - 6} textAnchor="middle" fill="#9ca3af" fontSize="9" fontWeight="700">{d.month}월</text>
            </g>
          );
        })}
      </svg>

      {/* 범례 */}
      <div className="flex items-center gap-4 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-xs font-bold text-gray-500">수입</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-400" />
          <span className="text-xs font-bold text-gray-500">지출</span>
        </div>
      </div>
    </div>
  );
}