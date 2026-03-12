import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, Loader2, Layers, AlertCircle, Plus,
  CheckCircle2, Trash2, Save, X
} from 'lucide-react';
import { uploadReceipt, rollbackUpload, confirmSave, type CorrectionItem } from '../services/api';
import { useTransactions } from '../context/TransactionContext';
import { ExpenseItem, AnalysisResponse } from '../types/expense';
import { getCategoryStyle } from '../constants/categories';
import { isIncomeCategory } from '../utils/expense';

// 날짜 정규화: 년월 없이 일만 있으면 현재 년월 붙이기
const normalizeDate = (dateStr: string | undefined): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');

  if (!dateStr) return `${yyyy}-${mm}-${String(today.getDate()).padStart(2, '0')}`;

  // 이미 yyyy-MM-dd 형식이면 그대로
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // 일만 있는 경우: "25", "3" 등
  if (/^\d{1,2}$/.test(dateStr.trim())) {
    const day = String(parseInt(dateStr)).padStart(2, '0');
    return `${yyyy}-${mm}-${day}`;
  }

  // MM-dd 또는 MM/dd 형식
  const mmdd = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})$/);
  if (mmdd) {
    return `${yyyy}-${String(mmdd[1]).padStart(2, '0')}-${String(mmdd[2]).padStart(2, '0')}`;
  }

  // 파싱 가능한 날짜면 변환
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];

  // 파싱 실패 시 오늘 날짜
  return `${yyyy}-${mm}-${String(today.getDate()).padStart(2, '0')}`;
};

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  // 분석 결과에서 편집 가능한 아이템 목록
  const [editableItems, setEditableItems] = useState<ExpenseItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [rawDataId, setRawDataId] = useState<string | null>(null);
  // 원본 AI 추출 값 저장 (오독 사전 피드백 비교용)
  const originalItemsRef = useRef<Map<string, Pick<ExpenseItem, 'category' | 'sub_category' | 'description'>>>(new Map());

  const processFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setError(null);
      setAnalysisResult(null);
      setEditableItems([]);
      setCheckedIds(new Set());
    };
    reader.readAsDataURL(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) processFile(f);
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await uploadReceipt(file);
      setAnalysisResult(result.analysis_result);
      setRawDataId(result.raw_data_id);

      const items: ExpenseItem[] = [];
      Object.values(result.analysis_result.grouped_items).forEach(group => {
        group.items.forEach(item => {
          if (item.description || item.sub_category) {
            items.push({
              ...item,
              id: crypto.randomUUID(),
              date: normalizeDate(item.date),
            });
          }
        });
      });

      setEditableItems(items);
      setCheckedIds(new Set(items.map(i => i.id)));

      // 원본 AI 텍스트 필드 저장 (오독 사전 피드백 비교용)
      originalItemsRef.current = new Map(
        items.map(item => [
          item.id,
          { category: item.category, sub_category: item.sub_category, description: item.description },
        ])
      );
    } catch (err: any) {
      setError(err.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteItem = (id: string) => {
    setEditableItems(prev => prev.filter(i => i.id !== id));
    setCheckedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleEditItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    setEditableItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleConfirm = async () => {
    if (!rawDataId) return;

    const toSave = editableItems.filter(i => checkedIds.has(i.id));

    // 원본 AI 값과 비교하여 수정된 텍스트 필드 → 오독 사전 피드백
    const corrections: CorrectionItem[] = [];
    const textFields = ['category', 'sub_category', 'description'] as const;
    for (const item of toSave) {
      const original = originalItemsRef.current.get(item.id);
      if (!original) continue;
      for (const field of textFields) {
        const before = original[field]?.trim();
        const after = item[field]?.trim();
        if (before && after && before !== after) {
          corrections.push({
            wrong_text: before,
            correct_text: after,
            category_hint: item.category,
            field_scope: field,
          });
        }
      }
    }

    try {
      await confirmSave(rawDataId, toSave, corrections);
      toSave.forEach(item => addTransaction(item));
      navigate('/');
    } catch (err: any) {
      setError(err.message || '저장 중 오류가 발생했습니다.');
    }
  };

  const checkedCount = checkedIds.size;

  const totalSummary = useMemo(() => {
    const checked = editableItems.filter(i => checkedIds.has(i.id));
    return {
      income: checked.filter(i => isIncomeCategory(i.category)).reduce((a, b) => a + b.spent, 0),
      expense: checked.filter(i => !isIncomeCategory(i.category)).reduce((a, b) => a + b.spent, 0),
    };
  }, [editableItems, checkedIds]);

  // 결과가 없으면 업로드 화면
  if (!analysisResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black tracking-tight mb-4">AI Receipt Scanner</h2>
          <p className="text-gray-500">영수증이나 가계부 이미지를 업로드하면 AI가 자동으로 내역을 추출합니다.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-black/5 border border-black/5">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={`relative border-2 border-dashed rounded-[2rem] p-10 transition-all flex flex-col items-center justify-center gap-6 cursor-pointer min-h-[300px]
              ${image ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/10'}`}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input id="fileInput" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />

            {image ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg">
                <img src={image} alt="Preview" className="w-full object-contain max-h-[400px]" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-bold flex items-center gap-2">
                    <Plus className="w-6 h-6" /> 이미지 변경하기
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
                  <Upload className="w-12 h-12 text-emerald-300" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">이미지를 여기에 놓으세요</p>
                  <p className="text-sm text-gray-400 mt-2">또는 클릭하여 파일 선택 (JPG, PNG)</p>
                </div>
              </>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-bold">분석 실패</p>
                <p className="mt-1 opacity-80">{error}</p>
              </div>
            </motion.div>
          )}

          <button
            disabled={!file || isAnalyzing}
            onClick={handleAnalyze}
            className={`w-full mt-10 py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all
              ${!file || isAnalyzing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xl shadow-emerald-200 active:scale-95'}`}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-8 h-8 animate-spin" /> AI 분석 중...</>
            ) : (
              <><Layers className="w-8 h-8" /> 데이터 추출하기</>
            )}
          </button>
        </div>
      </motion.div>
    );
  }

  // 스플릿 뷰 - 분석 결과 확인
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">분석 결과 확인</h2>
          <p className="text-gray-500 mt-1">저장할 항목을 선택하고 내용을 수정한 후 저장하세요.</p>
        </div>
        <button
          onClick={() => {
            if (rawDataId) rollbackUpload(rawDataId).catch(() => {});
            setAnalysisResult(null); setImage(null); setFile(null);
            setRawDataId(null); originalItemsRef.current.clear();
          }}
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" /> 다시 스캔
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽 - 원본 이미지 */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-black/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">원본 이미지</p>
          </div>
          <div className="p-4">
            <img
              src={image!}
              alt="원본"
              className="w-full object-contain max-h-[600px] rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* 오른쪽 - 편집 가능한 테이블 */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-black/5 flex flex-col">
          <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              추출된 내역 ({checkedCount}/{editableItems.length} 선택)
            </p>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-600">+{totalSummary.income.toLocaleString()}원</span>
              <span className="text-red-500">-{totalSummary.expense.toLocaleString()}원</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[500px]">
            <AnimatePresence>
              {editableItems.map(item => {
                const isChecked = checkedIds.has(item.id);
                const isIncome = isIncomeCategory(item.category);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`rounded-2xl border p-4 transition-all ${isChecked ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 bg-gray-50/50 opacity-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 체크박스 */}
                      <button
                        onClick={() => handleToggleCheck(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'}`}
                      >
                        {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>

                      <div className="flex-1 space-y-2 min-w-0">
                        {/* 날짜 + 카테고리 */}
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={item.date}
                            onChange={e => handleEditItem(item.id, 'date', e.target.value)}
                            className="w-36 bg-white border border-black/5 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <input
                            value={item.category}
                            onChange={e => handleEditItem(item.id, 'category', e.target.value)}
                            className={`flex-1 border rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${getCategoryStyle(item.category)}`}
                          />
                        </div>

                        {/* 설명 */}
                        <input
                          value={item.description}
                          onChange={e => handleEditItem(item.id, 'description', e.target.value)}
                          placeholder="내역"
                          className="w-full bg-white border border-black/5 rounded-xl px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />

                        {/* 서브카테고리 + 금액 */}
                        <div className="flex gap-2">
                          <input
                            value={item.sub_category}
                            onChange={e => handleEditItem(item.id, 'sub_category', e.target.value)}
                            placeholder="소분류"
                            className="flex-1 bg-white border border-black/5 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <div className="relative">
                            <input
                              type="number"
                              value={item.spent}
                              onChange={e => handleEditItem(item.id, 'spent', Number(e.target.value))}
                              className={`w-28 border border-black/5 rounded-xl px-2 py-1.5 text-xs font-black text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                                ${isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-gray-900'}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="mt-0.5 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* 저장 버튼 */}
          <div className="p-4 border-t border-black/5">
            <button
              onClick={handleConfirm}
              disabled={checkedCount === 0 || !rawDataId}
              className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all
                ${checkedCount === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100 active:scale-95'}`}
            >
              <Save className="w-6 h-6" />
              {checkedCount}개 항목 저장하기
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};