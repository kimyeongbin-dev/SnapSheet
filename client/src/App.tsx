/**
 * [역할] 루트 컴포넌트 - 전역 상태 관리 및 레이아웃 구성
 * - 파일 선택, 분석 요청, 결과/에러 상태 관리
 * - UploadPanel과 ResultPanel을 조합하여 메인 화면 구성
 *
 * [추가 예정]
 * - 전역 상태 관리 도입 시 Context 또는 Zustand로 분리
 * - 분석 히스토리 목록 상태 관리
 */

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { uploadReceipt } from './services/api';
import { AnalysisResponse } from './types/expense';
import NavBar from './components/NavBar';
import UploadPanel from './components/UploadPanel';
import ResultPanel from './components/ResultPanel';


export default function App() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setError(null);
      setResult(null);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const analysisResult = await uploadReceipt(file);
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || '분석 중 오류가 발생했습니다. 백엔드 서버 연결을 확인해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans">
      <NavBar />

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <UploadPanel
              imagePreview={imagePreview}
              isAnalyzing={isAnalyzing}
              hasFile={!!file}
              error={error}
              onFileSelect={handleFileSelect}
              onAnalyze={handleAnalyze}
            />
          </div>

          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <ResultPanel result={result} />
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto p-10 mt-10 border-t border-black/5 text-center">
        <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">
          Powered by SnapSheet AI Engine
        </p>
      </footer>
    </div>
  );
}
