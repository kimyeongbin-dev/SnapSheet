"""
[역할] 분석 결과 확인 및 영구 저장 엔드포인트
- POST /api/confirm : 사용자가 확인/수정한 항목을 DB에 영구 저장

[트랜잭션 보장]
단일 트랜잭션 내에서 처리:
  - [C] 사용자 선택/수정 항목 → expenses 저장 (raw_data는 upload 시 이미 저장됨)
  - [D/E] 오독 사전 피드백 처리 (수정 내역 있을 경우)
실패 시 전체 롤백.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.db_models import GeminiRawData, Expense, OcrCorrection
from models.expense import ConfirmRequest, ConfirmResponse

router = APIRouter()

VERIFICATION_THRESHOLD = 3


@router.post("/confirm")
async def confirm_save(
    request: ConfirmRequest,
    db: AsyncSession = Depends(get_db)
) -> ConfirmResponse:
    """
    upload 시 임시 저장된 raw_data를 기반으로 expenses를 영구 저장하고
    오독 사전 피드백을 처리합니다. 모든 작업은 하나의 트랜잭션으로 처리됩니다.
    """
    try:
        # raw_data_id로 기존 임시 저장 데이터 조회
        stmt = select(GeminiRawData).where(GeminiRawData.id == request.raw_data_id)
        result = await db.execute(stmt)
        raw_data = result.scalar_one_or_none()

        if not raw_data:
            raise HTTPException(status_code=404, detail="분석 데이터를 찾을 수 없습니다. 다시 스캔해 주세요.")

        # [C] 사용자 선택/수정 항목 → expenses 영구 저장
        expenses_to_add = [
            Expense(
                raw_data_id=raw_data.id,
                date=item.date or None,
                category=item.category,
                sub_category=item.sub_category or None,
                description=item.description or None,
                budget=item.budget,
                spent=item.spent,
                diff=item.diff,
            )
            for item in request.items
        ]
        db.add_all(expenses_to_add)

        # [D/E] 오독 사전 피드백 처리
        processed_corrections = 0
        for correction in request.corrections:
            if not correction.wrong_text or not correction.correct_text:
                continue
            if correction.wrong_text.strip() == correction.correct_text.strip():
                continue

            stmt = select(OcrCorrection).where(
                OcrCorrection.wrong_text == correction.wrong_text.strip(),
                OcrCorrection.correct_text == correction.correct_text.strip(),
            )
            ocr_result = await db.execute(stmt)
            existing = ocr_result.scalar_one_or_none()

            if existing:
                existing.occurrence_count += 1
                if existing.occurrence_count >= existing.threshold:
                    existing.is_verified = True
                if correction.category_hint and not existing.category_hint:
                    existing.category_hint = correction.category_hint
            else:
                db.add(OcrCorrection(
                    wrong_text=correction.wrong_text.strip(),
                    correct_text=correction.correct_text.strip(),
                    category_hint=correction.category_hint,
                    field_scope=correction.field_scope,
                    occurrence_count=1,
                    is_verified=False,
                    threshold=VERIFICATION_THRESHOLD,
                ))

            processed_corrections += 1

        await db.commit()

        return ConfirmResponse(
            status="success",
            saved_count=len(expenses_to_add),
            message=f"{len(expenses_to_add)}개 항목 저장 완료. 피드백 {processed_corrections}건 처리됨.",
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return ConfirmResponse(status="error", saved_count=0, message=str(e))
