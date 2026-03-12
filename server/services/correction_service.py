"""
[역할] 오독 사전 기반 텍스트 교정 서비스
- [B] 검증된 오독 사전을 불러와 텍스트 후처리
- Gemini 응답의 오탈자를 자동 교정

[사용 시점]
- Gemini 원본 저장 후, expenses 테이블 저장 전에 적용
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.db_expense import OcrCorrection
from models.expense import AnalysisResult, ExpenseItem, GroupedCategory


# field_scope 값 → ExpenseItem 필드명 매핑
_FIELD_SCOPES = ("category", "sub_category", "description")


async def load_verified_corrections(db: AsyncSession) -> list["OcrCorrection"]:
    """검증된 오독 사전 항목 리스트 로드"""
    stmt = select(OcrCorrection).where(OcrCorrection.is_verified == True)
    result = await db.execute(stmt)
    return list(result.scalars().all())


def _build_field_map(corrections: list, field: str) -> dict[str, str]:
    """특정 필드에 적용 가능한 교정 매핑 반환.
    field_scope가 None이거나 해당 필드명이면 적용."""
    return {
        c.wrong_text: c.correct_text
        for c in corrections
        if c.field_scope is None or c.field_scope == field
    }


def apply_correction(text: str, corrections: dict[str, str]) -> str:
    """단일 텍스트에 오독 사전 적용"""
    if not text:
        return text
    return corrections.get(text.strip(), text)


def apply_corrections_to_item(
    item: ExpenseItem,
    corrections_by_field: dict[str, dict[str, str]],
) -> ExpenseItem:
    """ExpenseItem의 텍스트 필드에 field_scope를 고려한 오독 사전 적용"""
    return ExpenseItem(
        id=item.id,
        date=item.date,
        category=apply_correction(item.category, corrections_by_field["category"]),
        sub_category=apply_correction(item.sub_category, corrections_by_field["sub_category"]),
        description=apply_correction(item.description, corrections_by_field["description"]),
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
    correction_list = await load_verified_corrections(db)

    # 오독 사전이 비어있으면 원본 그대로 반환
    if not correction_list:
        return result

    # 필드별 교정 맵 미리 빌드 (O(n) 전처리)
    corrections_by_field = {
        field: _build_field_map(correction_list, field)
        for field in _FIELD_SCOPES
    }

    # 새로운 grouped_items 생성
    corrected_groups: dict[str, GroupedCategory] = {}

    for category, group in result.grouped_items.items():
        # 카테고리명도 교정 (field_scope="category" 또는 None인 항목만 적용)
        corrected_category = apply_correction(category, corrections_by_field["category"])

        corrected_items = [
            apply_corrections_to_item(item, corrections_by_field)
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

    # title은 category 스코프 교정 적용 (또는 scope=None)
    corrected_title = apply_correction(result.title, corrections_by_field["category"])

    return AnalysisResult(
        title=corrected_title,
        grouped_items=corrected_groups,
        total=result.total,
    )
