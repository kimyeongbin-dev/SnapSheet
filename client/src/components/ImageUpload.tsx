import React, { useState } from 'react';

export default function ImageUpload() {
  // 상태 관리 (카멜 케이스)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 파일 선택 이벤트 처리 (handle 접두사)
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // 서버로 업로드 이벤트 처리 (handle 접두사)
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      alert("이미지를 먼저 선택해주세요.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile); // 백엔드에서 받을 파라미터 이름과 동일해야 함

    try {
      // 백엔드 API 호출
      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      console.log("서버 응답:", data);
      alert("업로드 성공: " + data.message);
      
    } catch (error) {
      console.error("업로드 실패:", error);
      alert("서버와 통신 중 에러가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', width: '300px' }}>
      <h3>영수증/근무표 업로드</h3>
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/jpg" 
        onChange={handleFileChange} 
      />
      <button 
        onClick={handleUploadSubmit} 
        disabled={isUploading}
        style={{ marginTop: '10px', display: 'block' }}
      >
        {isUploading ? "처리 중..." : "AI 변환 시작"}
      </button>
    </div>
  );
}