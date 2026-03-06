"""
[역할] 이미지 업로드 및 분석 엔드포인트
- POST /api/upload : 이미지를 받아 Gemini 분석 후 결과 반환
- 임시 파일 저장 및 처리 후 삭제

[추가 예정]
- 사용자 인증 검증 (JWT)
- 분석 결과 DB 저장
- 파일 형식 및 크기 유효성 검사
"""
import os
import uuid
import shutil

from fastapi import APIRouter, UploadFile, File
from PIL import Image

from models.expense import UploadResponse
from services.gemini_service import parse_image_to_expenses


router = APIRouter()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def parse_uploaded_image(file: UploadFile = File(...)) -> UploadResponse:
    temp_file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        img = Image.open(temp_file_path).convert("RGB")
        analysis_result = parse_image_to_expenses(img)

        return UploadResponse(status="success", analysis_result=analysis_result)

    except Exception as e:
        print(f"서버 내부 에러 발생: {str(e)}")
        return UploadResponse(status="error", message=str(e))

    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
