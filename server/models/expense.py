"""
[역할] API 요청/응답에 사용되는 Pydantic 데이터 모델
- ExpenseItem       : 개별 지출 항목
- ExpenseTotal      : 예산·지출·차이 합계
- GeminiRawResult   : Gemini 원본 응답 구조 (items 배열)
- GroupedCategory   : 카테고리별 그룹화된 항목
- AnalysisResult    : FE에 반환하는 최종 분석 결과
- UploadResponse    : /api/upload 엔드포인트 응답 래퍼

[추가 예정]
- DB 저장용 ORM 모델 (SQLAlchemy / SQLModel)
- User, Document 등 도메인 모델
"""
from typing import Optional
from pydantic import BaseModel


class ExpenseItem(BaseModel):
    id: str = ""
    date: str = ""
    category: str
    sub_category: str = ""
    description: str = ""
    budget: int = 0
    spent: int = 0
    diff: int = 0


class ExpenseTotal(BaseModel):
    budget_sum: int = 0
    spent_sum: int = 0
    diff_sum: int = 0


class GeminiRawResult(BaseModel):
    title: str
    items: list[ExpenseItem]
    total: ExpenseTotal


class GroupedCategory(BaseModel):
    total_spent: int
    items: list[ExpenseItem]


class AnalysisResult(BaseModel):
    title: str
    grouped_items: dict[str, GroupedCategory]
    total: ExpenseTotal


class UploadResponse(BaseModel):
    status: str
    analysis_result: Optional[AnalysisResult] = None
    message: Optional[str] = None
