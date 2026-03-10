/**
 * [역할] 이미지 업로드 패널 (좌측)
 * - 드래그 앤 드롭 / 클릭 파일 선택
 * - 이미지 미리보기
 * - 분석 버튼 및 에러 메시지 표시
 *
 * [추가 예정]
 * - 파일 형식 및 크기 유효성 검사
 * - 카메라 촬영 기능
 */

import { useCallback } from 'react';
import { Upload, Plus, Layers, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface UploadPanelProps {
  imagePreview: string | null;
  isAnalyzing: boolean;
  hasFile: boolean;
  error: string | null;
  onFileSelect: (file: File) => void;
  onAnalyze: () => void;
}

export default function UploadPanel({
  imagePreview,
  isAnalyzing,
  hasFile,
  error,
  onFileSelect,
  onAnalyze,
}: UploadPanelProps) {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <section>
      <h2 className="text-2xl font-bold mb-2">Digitalize</h2>
      <p className="text-gray-500 text-sm mb-6">
        손글씨, 달력, 영수증 등 무엇이든 찍어서 디지털 데이터로 변환하세요.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-6 shadow-xl shadow-black/5 border border-black/5"
      >
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[300px]
            ${imagePreview
              ? 'border-emerald-200 bg-emerald-50/20'
              : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/10'
            }`}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input
            id="fileInput"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          {imagePreview ? (
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
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
          disabled={!hasFile || isAnalyzing}
          onClick={onAnalyze}
          className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
            ${!hasFile || isAnalyzing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200 active:scale-95'
            }`}
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

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl flex items-start gap-3 shadow-sm"
        >
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-bold">분석 실패</p>
            <p className="mt-1 opacity-80">{error}</p>
          </div>
        </motion.div>
      )}
    </section>
  );
}
