/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  ChevronRight, 
  DollarSign, 
  LayoutGrid, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus,
  Camera,
  Calendar,
  Layers,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadReceipt } from './services/api';
import { AnalysisResponse, ExpenseItem } from './types/expense';

// Category color mapping for consistency
const CATEGORY_COLORS: Record<string, string> = {
  '식비': 'bg-orange-100 text-orange-600 border-orange-200',
  '교통': 'bg-blue-100 text-blue-600 border-blue-200',
  '쇼핑': 'bg-pink-100 text-pink-600 border-pink-200',
  '의료': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  '주거': 'bg-indigo-100 text-indigo-600 border-indigo-200',
  '교육': 'bg-purple-100 text-purple-600 border-purple-200',
  '기타': 'bg-gray-100 text-gray-600 border-gray-200',
};

const getCategoryStyle = (category: string) => {
  return CATEGORY_COLORS[category] || 'bg-emerald-100 text-emerald-600 border-emerald-200';
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setError(null);
      setResult(null);
      setSelectedCategory(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const analysisResult = await uploadReceipt(file);
      setResult(analysisResult);
      // Select the first category by default if available
      const categories = Object.keys(analysisResult.grouped_items);
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
    } catch (err: any) {
      setError(err.message || "분석 중 오류가 발생했습니다. 백엔드 서버 연결을 확인해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, []);

  // Group items by sub_category for the selected category
  const subGroupedItems = useMemo(() => {
    if (!result || !selectedCategory) return null;
    
    const categoryData = result.grouped_items[selectedCategory];
    if (!categoryData) return null;

    const groups: Record<string, ExpenseItem[]> = {};
    categoryData.items.forEach(item => {
      const sub = item.sub_category || '기타';
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(item);
    });
    return groups;
  }, [result, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SnapSheet</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="text-emerald-600">Dashboard</a>
            <a href="#" className="hover:text-gray-900 transition-colors">History</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Settings</a>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Input Panel */}
          <div className="lg:col-span-4 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-2">Digitalize</h2>
              <p className="text-gray-500 text-sm mb-6">손글씨, 달력, 영수증 등 무엇이든 찍어서 디지털 데이터로 변환하세요.</p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-6 shadow-xl shadow-black/5 border border-black/5"
              >
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[300px]
                    ${image ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/10'}`}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input 
                    id="fileInput"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  
                  {image ? (
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <img src={image} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <Plus className="w-5 h-5" /> 이미지 변경
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                        <Upload className="w-10 h-10 text-gray-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">이미지 업로드</p>
                        <p className="text-sm text-gray-400 mt-1">드래그하거나 클릭하여 시작</p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  disabled={!file || isAnalyzing}
                  onClick={handleAnalyze}
                  className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                    ${!file || isAnalyzing 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200 active:scale-95'}`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Layers className="w-6 h-6" />
                      데이터 추출하기
                    </>
                  )}
                </button>
              </motion.div>
            </section>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl flex items-start gap-3 shadow-sm"
              >
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold">분석 실패</p>
                  <p className="mt-1 opacity-80">{error}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Output Panel */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {result ? (
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
                      <h2 className="text-3xl font-black tracking-tight">{result.title || "추출된 데이터"}</h2>
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

                  {/* Category Selector (Buttons) */}
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(result.grouped_items).map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2 flex items-center gap-2
                          ${selectedCategory === category 
                            ? `${getCategoryStyle(category)} border-current shadow-lg` 
                            : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        {category}
                        <span className="ml-1 opacity-50">({result.grouped_items[category].items.length})</span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Category Content */}
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
                              <span className={`w-3 h-8 rounded-full ${getCategoryStyle(selectedCategory).split(' ')[0]}`}></span>
                              {selectedCategory} 상세 내역
                            </h3>
                            <div className="text-right">
                              <p className="text-xs font-bold text-gray-400 uppercase">Category Total</p>
                              <p className="text-xl font-black">{result.grouped_items[selectedCategory].total_spent.toLocaleString()}원</p>
                            </div>
                          </div>

                          <div className="space-y-10">
                            {(Object.entries(subGroupedItems) as [string, ExpenseItem[]][]).map(([sub, items]) => (
                              <div key={sub} className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">{sub}</h4>
                                  <div className="h-px flex-1 bg-black/5"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {items.map((item, idx) => (
                                    <motion.div 
                                      key={idx}
                                      whileHover={{ y: -4 }}
                                      className="bg-gray-50/50 p-5 rounded-2xl border border-black/5 flex items-center justify-between group transition-all hover:bg-white hover:shadow-xl hover:shadow-black/5"
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-50 transition-colors">
                                          <CheckCircle2 className="w-5 h-5 text-gray-300 group-hover:text-emerald-500" />
                                        </div>
                                        <div>
                                          <p className="font-bold text-gray-900">{item.description}</p>
                                          <p className="text-xs text-gray-500">{item.sub_category}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-black text-lg">{item.spent.toLocaleString()}원</p>
                                        {item.budget > 0 && (
                                          <p className="text-[10px] font-bold text-gray-400">Budget: {item.budget.toLocaleString()}</p>
                                        )}
                                      </div>
                                    </motion.div>
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
              ) : (
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
                    왼쪽 패널에 이미지를 업로드하고 분석을 시작하세요. <br/>
                    SnapSheet가 아날로그 데이터를 디지털로 바꿔드립니다.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto p-10 mt-10 border-t border-black/5 text-center">
        <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">Powered by SnapSheet AI Engine</p>
      </footer>
    </div>
  );
}
