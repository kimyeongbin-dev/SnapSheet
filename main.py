from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import shutil
import uuid
# ocr_engine.py에서 만든 함수를 가져옵니다.
from ocr_engine import process_document

app = FastAPI(title="SnapSheet API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 임시 파일 저장소 설정
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload")
async def parse_uploaded_image(file: UploadFile = File(...)):
    # 1. 파일 확장자 검증
    allowed_extensions = (".jpg", ".jpeg", ".png")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail="지원하지 않는 파일 형식입니다. JPG 또는 PNG 파일만 올려주세요."
        )

    # 2. 고유 파일명 생성 및 저장
    # 파일명이 중복되지 않도록 UUID를 사용합니다.
    file_extension = os.path.splitext(file.filename)[1]
    temp_file_name = f"{uuid.uuid4()}{file_extension}"
    temp_file_path = os.path.join(UPLOAD_DIR, temp_file_name)

    try:
        # 비동기로 파일을 읽어 로컬에 저장 (OCR 엔진은 파일 경로를 필요로 함)
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. [핵심] OCR 엔진 가동 (ocr_engine.py의 함수 호출)
        ocr_result = process_document(temp_file_path)

        # 4. 분석 완료 후 임시 파일 삭제 (서버 용량 관리)
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        # 5. 결과 반환
        return {
            "status": "success",
            "file_name": file.filename,
            "analysis_result": ocr_result
        }

    except Exception as e:
        # 에러 발생 시 파일 삭제 시도 후 에러 반환
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"OCR 분석 중 오류 발생: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)