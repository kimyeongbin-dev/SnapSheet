import React, { useState, useRef, useEffect } from 'react';

export default function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 미리보기 URL 메모리 누수 방지 (cleanup)
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 파일 선택/드롭 처리 함수
  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const newUrl = URL.createObjectURL(file);
      setPreviewUrl(newUrl);
    } else if (file) {
      alert("이미지 파일만 업로드할 수 있습니다.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return alert("이미지를 먼저 선택해주세요.");
    
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      alert("분석 완료: " + data.message);
    } catch (error) {
      alert("서버 연결 실패. 백엔드를 확인하세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 삭제 기능 함수 (X 버튼 클릭 시 호출)
  const handleDeleteFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Input 값 초기화
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    // backdrop-blur, ring-1: 세련된 카드 디자인 요소
    <div className="w-full max-w-xl p-8 bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-zinc-800 ring-1 ring-zinc-700/50">
      <h2 className="text-2xl font-bold text-white tracking-tight mb-6">이미지 분석 업로드</h2>
      
      {/* 업로드/미리보기 영역 */}
      <div 
        className={`relative group w-full h-80 bg-zinc-950 border-2 border-dashed rounded-xl overflow-hidden flex flex-col items-center justify-center mb-6 cursor-pointer transition-all
          ${isDragActive ? 'border-sky-500 bg-sky-950/20' : previewUrl ? 'border-zinc-700' : 'border-zinc-700 hover:border-zinc-500'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
            
            {/* 세련된 삭제 버튼 (X) */}
            <button 
              onClick={handleDeleteFile}
              disabled={isProcessing}
              className={`absolute top-3 right-3 p-1.5 rounded-full text-white transition-opacity shadow-md
                ${isProcessing ? 'bg-zinc-700 cursor-not-allowed opacity-100' : 'bg-red-600 hover:bg-red-700 opacity-0 group-hover:opacity-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </>
        ) : (
          <div className="text-center text-zinc-600 flex flex-col items-center gap-4 p-4">
            <svg className="w-16 h-16 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="text-lg font-medium text-zinc-300">영수증 또는 근무표 사진 업로드</p>
            <p className="text-sm opacity-80">파일을 클릭하거나 여기에 드래그하세요</p>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />
      </div>

      {/* 세련된 버튼 영역 */}
      <button 
        onClick={handleUploadSubmit}
        disabled={isProcessing || !selectedFile}
        className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg
          ${isProcessing || !selectedFile ? 'bg-zinc-700 cursor-not-allowed opacity-70' : 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/20'}`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>분석 중...</span>
          </>
        ) : (
          "변환 시작"
        )}
      </button>

      {selectedFile && !isProcessing && (
        <p className="text-sm text-zinc-600 mt-4 text-center font-mono truncate px-4">파일명: {selectedFile.name}</p>
      )}
    </div>
  );
}