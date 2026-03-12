"""
[역할] 사용자 피드백 처리 엔드포인트
- POST /api/feedback : 사용자가 수정한 오탈자 데이터 수신
- [D] 피드백 데이터를 바탕으로 오독 사전 업데이트 트리거
- [E] 검증 로직을 거쳐 오독 사전에 반영
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database import get_db
from models.db_expense import OcrCorrection


router = APIRouter()


class CorrectionItem(BaseModel):
    """단일 오탈자 수정 항목"""
    wrong_text: str      # 원래 잘못 인식된 텍스트
    correct_text: str    # 사용자가 수정한 정답 텍스트
    category_hint: str | None = None  # 문맥 힌트 (카테고리)
    # 적용 대상 필드 제한: None이면 모든 필드, 아니면 "category"/"sub_category"/"description"
    field_scope: str | None = None


class FeedbackRequest(BaseModel):
    """피드백 요청 본문"""
    corrections: list[CorrectionItem]


class FeedbackResponse(BaseModel):
    """피드백 응답"""
    status: str
    processed_count: int
    message: str | None = None


# 오독 사전 등록 기준 횟수 (이 횟수 이상이면 검증 완료)
VERIFICATION_THRESHOLD = 3


@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    db: AsyncSession = Depends(get_db)
) -> FeedbackResponse:
    """
    [D] 사용자 피드백 처리 + [E] 오독 사전 자동화

    검증 로직:
    - 동일한 (wrong_text, correct_text) 쌍이 이미 존재하면 occurrence_count 증가
    - occurrence_count >= threshold 이면 is_verified = True로 설정
    - 신규 항목은 occurrence_count=1로 등록 (아직 미검증)
    """
    try:
        processed_count = 0

        for item in request.corrections:
            # 빈 문자열이거나 동일한 경우 스킵
            if not item.wrong_text or not item.correct_text:
                continue
            if item.wrong_text.strip() == item.correct_text.strip():
                continue

            # 기존 항목 조회 (wrong_text + correct_text 쌍으로)
            stmt = select(OcrCorrection).where(
                OcrCorrection.wrong_text == item.wrong_text.strip(),
                OcrCorrection.correct_text == item.correct_text.strip(),
            )
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()

            if existing:
                # 기존 항목: 발생 횟수 증가
                existing.occurrence_count += 1

                # 검증 기준 도달 시 검증 완료 처리
                if existing.occurrence_count >= existing.threshold:
                    existing.is_verified = True

                # 카테고리 힌트 업데이트 (있으면)
                if item.category_hint and not existing.category_hint:
                    existing.category_hint = item.category_hint
            else:
                # 신규 항목 등록
                new_correction = OcrCorrection(
                    wrong_text=item.wrong_text.strip(),
                    correct_text=item.correct_text.strip(),
                    category_hint=item.category_hint,
                    field_scope=item.field_scope,
                    occurrence_count=1,
                    is_verified=False,
                    threshold=VERIFICATION_THRESHOLD,
                )
                db.add(new_correction)

            processed_count += 1

        await db.commit()

        return FeedbackResponse(
            status="success",
            processed_count=processed_count,
            message=f"{processed_count}개의 피드백이 처리되었습니다."
        )

    except Exception as e:
        await db.rollback()
        return FeedbackResponse(
            status="error",
            processed_count=0,
            message=str(e)
        )
