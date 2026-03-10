"""
[역할] 오독 사전 기반 텍스트 교정 서비스
- [B] 검증된 오독 사전을 불러와 텍스트 후처리
- Gemini 응답의 오탈자를 자동 교정

[사용 시점]
- Gemini 원본 저장 후, expenses 테이블 저장 전에 적용
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.db_models import OcrCorrection
from models.expense import AnalysisResult, ExpenseItem, GroupedCategory


async def load_verified_corrections(db: AsyncSession) -> dict[str, str]:
    """
    검증된 오독 사전을 딕셔너리로 로드

    Returns:
        dict[str, str]: {잘못된_텍스트: 정답_텍스트} 매핑
    """
    stmt = select(OcrCorrection).where(OcrCorrection.is_verified == True)
    result = await db.execute(stmt)
    corrections = result.scalars().all()

    return {c.wrong_text: c.correct_text for c in corrections}


def apply_correction(text: str, corrections: dict[str, str]) -> str:
    """단일 텍스트에 오독 사전 적용"""
    if not text:
        return text
    return corrections.get(text.strip(), text)


def apply_corrections_to_item(item: ExpenseItem, corrections: dict[str, str]) -> ExpenseItem:
    """ExpenseItem의 텍스트 필드에 오독 사전 적용"""
    return ExpenseItem(
        id=item.id,
        date=item.date,
        category=apply_correction(item.category, corrections),
        sub_category=apply_correction(item.sub_category, corrections),
        description=apply_correction(item.description, corrections),
        budget=item.budget,
        spent=item.spent,
        diff=item.diff,
    )


async def apply_corrections_to_result(
    result: AnalysisResult,
    db: AsyncSession
) -> AnalysisResult:
    """
    AnalysisResult 전체에 오독 사전 적용

    Args:
        result: Gemini 분석 결과
        db: DB 세션

    Returns:
        AnalysisResult: 교정된 분석 결과
    """
    corrections = await load_verified_corrections(db)

    # 오독 사전이 비어있으면 원본 그대로 반환
    if not corrections:
        return result

    # 새로운 grouped_items 생성
    corrected_groups: dict[str, GroupedCategory] = {}

    for category, group in result.grouped_items.items():
        # 카테고리명도 교정
        corrected_category = apply_correction(category, corrections)

        corrected_items = [
            apply_corrections_to_item(item, corrections)
            for item in group.items
        ]

        # 같은 카테고리로 교정된 경우 병합
        if corrected_category in corrected_groups:
            corrected_groups[corrected_category].items.extend(corrected_items)
            corrected_groups[corrected_category].total_spent += group.total_spent
        else:
            corrected_groups[corrected_category] = GroupedCategory(
                total_spent=group.total_spent,
                items=corrected_items,
            )

    return AnalysisResult(
        title=apply_correction(result.title, corrections),
        grouped_items=corrected_groups,
        total=result.total,
    )
