"""
[역할] 이미지 업로드 및 분석 엔드포인트
- POST /api/upload   : 이미지 분석 후 raw_data 임시 저장, raw_data_id 반환
- DELETE /api/upload/{raw_data_id} : 다시 스캔 시 임시 저장된 raw_data 삭제 (롤백)

[DB 저장 흐름]
- upload  : gemini_raw_data 임시 저장 (expenses는 저장 안 함)
- confirm : expenses 영구 저장 + 오독 사전 피드백
- rollback: raw_data 삭제 (다시 스캔)

[성능 최적화]
- Gemini API 호출: asyncio.to_thread로 비동기화
- 파일 I/O: aiofiles로 비동기화
"""
import os
import uuid
import asyncio
import aiofiles

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from PIL import Image

from models.expense import UploadResponse
from models.db_models import GeminiRawData
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
        # 1. 임시 파일 저장 (비동기 I/O)
        async with aiofiles.open(temp_file_path, "wb") as buffer:
            content = await file.read()
            await buffer.write(content)

        # 2. Gemini 분석 (동기 함수를 비동기로 실행)
        def _sync_parse():
            img = Image.open(temp_file_path).convert("RGB")
            return parse_image_to_expenses(img)

        raw_json, analysis_result = await asyncio.to_thread(_sync_parse)

        # 3. 오독 사전 기반 후처리 적용 (DB 읽기만)
        analysis_result = await apply_corrections_to_result(analysis_result, db)

        # 4. raw_data 임시 저장 (expenses는 사용자 확인 후 /api/confirm 에서 저장)
        raw_data = GeminiRawData(
            image_filename=file.filename or "unknown",
            raw_json=raw_json,
        )
        db.add(raw_data)
        await db.commit()
        await db.refresh(raw_data)

        return UploadResponse(
            status="success",
            analysis_result=analysis_result,
            raw_data_id=str(raw_data.id),
        )

    except Exception as e:
        await db.rollback()
        print(f"서버 내부 에러 발생: {str(e)}")
        return UploadResponse(status="error", message=str(e))

    finally:
        # 임시 파일 삭제 (비동기)
        if os.path.exists(temp_file_path):
            await asyncio.to_thread(os.remove, temp_file_path)


@router.delete("/upload/{raw_data_id}")
async def rollback_upload(
    raw_data_id: str,
    db: AsyncSession = Depends(get_db)
):
    """다시 스캔 시 임시 저장된 raw_data 삭제 (롤백)"""
    try:
        stmt = delete(GeminiRawData).where(GeminiRawData.id == raw_data_id)
        result = await db.execute(stmt)
        await db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="해당 raw_data를 찾을 수 없습니다.")

        return {"status": "success", "message": "임시 저장 데이터가 삭제되었습니다."}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
