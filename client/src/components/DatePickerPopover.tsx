/**
 * [역할] 연/월/일 단위 날짜 선택 팝오버
 * - day view:   미니 캘린더, 일 선택 → day-level 필터
 * - month view: 12개월 그리드, 월 선택 → month-level 필터 (day=null)
 * - year view:  연도 그리드, 연도 선택 → month view로 이동
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface DatePickerPopoverProps {
  year: number;
  month: number;
  day: number | null;
  onChange: (year: number, month: number, day: number | null) => void;
}

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DAY_LABELS   = ['일','월','화','수','목','금','토'];

export function DatePickerPopover({ year, month, day, onChange }: DatePickerPopoverProps) {
  const [open, setOpen]           = useState(false);
  const [view, setView]           = useState<'day' | 'month' | 'year'>('day');
  const [pickerYear, setPickerYear]   = useState(year);
  const [pickerMonth, setPickerMonth] = useState(month);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 props 변경 시 picker 초기화
  useEffect(() => {
    setPickerYear(year);
    setPickerMonth(month);
  }, [year, month]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const openPicker = () => {
    setPickerYear(year);
    setPickerMonth(month);
    setView('day');
    setOpen(o => !o);
  };

  // ── 페이지 이동 ──────────────────────────────
  const prevPage = () => {
    if (view === 'day') {
      if (pickerMonth === 1) { setPickerYear(y => y - 1); setPickerMonth(12); }
      else setPickerMonth(m => m - 1);
    } else if (view === 'month') {
      setPickerYear(y => y - 1);
    } else {
      setPickerYear(y => y - 12);
    }
  };

  const nextPage = () => {
    if (view === 'day') {
      if (pickerMonth === 12) { setPickerYear(y => y + 1); setPickerMonth(1); }
      else setPickerMonth(m => m + 1);
    } else if (view === 'month') {
      setPickerYear(y => y + 1);
    } else {
      setPickerYear(y => y + 12);
    }
  };

  // ── 선택 핸들러 ──────────────────────────────
  const handleDayClick = (d: number) => {
    onChange(pickerYear, pickerMonth, d);
    setOpen(false);
  };

  const handleMonthClick = (m: number) => {
    onChange(pickerYear, m, null);   // 월 선택 → day 초기화
    setOpen(false);
  };

  const handleYearClick = (y: number) => {
    setPickerYear(y);
    setView('month');
  };

  const cycleView = () => {
    setView(v => v === 'day' ? 'month' : v === 'month' ? 'year' : 'day');
  };

  // ── 달력 그리드 계산 ──────────────────────────
  const firstDay    = new Date(pickerYear, pickerMonth - 1, 1).getDay();
  const daysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
  const calDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calDays.push(i);
  while (calDays.length % 7 !== 0) calDays.push(null);

  // 연도 그리드 (12개)
  const startYear = Math.floor(pickerYear / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => startYear + i);

  const today = new Date();

  const headerLabel =
    view === 'day'   ? `${pickerYear}년 ${pickerMonth}월` :
    view === 'month' ? `${pickerYear}년` :
                       `${startYear} – ${startYear + 11}`;

  return (
    <div ref={ref} className="relative">
      {/* 아이콘 버튼 */}
      <button
        onClick={openPicker}
        className={`p-1.5 rounded-lg transition-colors ${open ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100 text-gray-500'}`}
      >
        <CalendarDays className="w-4 h-4" />
      </button>

      {/* 팝오버 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-black/5 p-4 w-68">

          {/* 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevPage} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              onClick={cycleView}
              className="text-sm font-black hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
            >
              {headerLabel}
            </button>
            <button onClick={nextPage} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          {/* 일 뷰 */}
          {view === 'day' && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((d, i) => (
                  <div
                    key={d}
                    className={`text-center text-[10px] font-black py-1
                      ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calDays.map((d, idx) => {
                  if (!d) return <div key={`e-${idx}`} className="aspect-square" />;
                  const isToday    = d === today.getDate() && pickerMonth === today.getMonth() + 1 && pickerYear === today.getFullYear();
                  const isSelected = d === day && pickerMonth === month && pickerYear === year;
                  const dow = idx % 7;
                  return (
                    <button
                      key={d}
                      onClick={() => handleDayClick(d)}
                      className={`aspect-square rounded-lg text-[11px] font-bold transition-colors
                        ${isSelected
                          ? 'bg-emerald-500 text-white'
                          : isToday
                          ? 'bg-emerald-50 text-emerald-600 font-black'
                          : dow === 0
                          ? 'text-red-400 hover:bg-red-50'
                          : dow === 6
                          ? 'text-blue-400 hover:bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* 월 뷰 */}
          {view === 'month' && (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_LABELS.map((m, i) => {
                const isSelected = i + 1 === month && pickerYear === year;
                return (
                  <button
                    key={m}
                    onClick={() => handleMonthClick(i + 1)}
                    className={`py-2 rounded-xl text-sm font-bold transition-colors
                      ${isSelected ? 'bg-emerald-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* 연도 뷰 */}
          {view === 'year' && (
            <div className="grid grid-cols-3 gap-1.5">
              {years.map(y => {
                const isSelected = y === year;
                return (
                  <button
                    key={y}
                    onClick={() => handleYearClick(y)}
                    className={`py-2 rounded-xl text-sm font-bold transition-colors
                      ${isSelected ? 'bg-emerald-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
