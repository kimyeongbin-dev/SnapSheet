"""
[역할] 이미지 업로드 및 분석 엔드포인트
- POST /api/upload : 이미지를 받아 Gemini 분석 후 결과 반환
- [A] 원본 JSON → gemini_raw_data 테이블 저장
- [C] 후처리 데이터 → expenses 테이블 저장

[추가 예정]
- 사용자 인증 검증 (JWT)
- 파일 형식 및 크기 유효성 검사
"""
import os
import uuid
import shutil

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image

from models.expense import UploadResponse
from models.db_models import GeminiRawData, Expense
from services.gemini_service import parse_image_to_expenses
from services.correction_service import apply_corrections_to_result
from database import get_db


router = APIRouter()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def parse_uploaded_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
) -> UploadResponse:
    temp_file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")

    try:
        # 1. 임시 파일 저장
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Gemini 분석
        img = Image.open(temp_file_path).convert("RGB")
        raw_json, analysis_result = parse_image_to_expenses(img)

        # 3. [B] 오독 사전 기반 후처리 적용
        analysis_result = await apply_corrections_to_result(analysis_result, db)

        # 4. [A] 원본 JSON → gemini_raw_data 저장
        raw_data = GeminiRawData(
            image_filename=file.filename or "unknown",
            raw_json=raw_json,
        )
        db.add(raw_data)
        await db.flush()  # raw_data.id 생성을 위해 flush

        # 5. [C] 후처리 데이터 → expenses 저장
        for category, group in analysis_result.grouped_items.items():
            for item in group.items:
                expense = Expense(
                    raw_data_id=raw_data.id,
                    date=item.date or None,
                    category=item.category,
                    sub_category=item.sub_category or None,
                    description=item.description or None,
                    budget=item.budget,
                    spent=item.spent,
                    diff=item.diff,
                )
                db.add(expense)

        # 6. 트랜잭션 커밋
        await db.commit()

        return UploadResponse(status="success", analysis_result=analysis_result)

    except Exception as e:
        # 에러 발생 시 롤백
        await db.rollback()
        print(f"서버 내부 에러 발생: {str(e)}")
        return UploadResponse(status="error", message=str(e))

    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
