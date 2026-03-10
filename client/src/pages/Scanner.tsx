import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Upload, 
  Loader2, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Plus 
} from 'lucide-react';
import { uploadReceipt } from '../services/api';
import { useTransactions } from '../context/TransactionContext';
import { ExpenseItem } from '../types/expense';

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const { setTransactions } = useTransactions();
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const analysisResult = await uploadReceipt(file);
      
      const newItems: ExpenseItem[] = [];
      Object.values(analysisResult.grouped_items).forEach(group => {
        group.items.forEach(item => {
          if (item.description || item.sub_category) {
            newItems.push({
              ...item,
              id: crypto.randomUUID(),
              date: item.date || new Date().toISOString().split('T')[0]
            });
          }
        });
      });

      setTransactions(prev => [...prev, ...newItems]);
      
      setImage(null);
      setFile(null);
      
      // Navigate to dashboard after success
      navigate('/');
    } catch (err: any) {
      setError(err.message || "분석 중 오류가 발생했습니다. 백엔드 서버 연결을 확인해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
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
          <input 
            id="fileInput"
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
          
          {image ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
              <img src={image} alt="Preview" className="w-full h-full object-contain max-h-[400px]" referrerPolicy="no-referrer" />
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
            <>
              <Loader2 className="w-8 h-8 animate-spin" />
              AI 분석 중...
            </>
          ) : (
            <>
              <Layers className="w-8 h-8" />
              데이터 추출하기
            </>
          )}
        </button>
      </div>
      
      <div className="mt-10 grid grid-cols-3 gap-6">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">자동 분류</p>
        </div>
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">날짜 인식</p>
        </div>
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">금액 추출</p>
        </div>
      </div>
    </motion.div>
  );
};
