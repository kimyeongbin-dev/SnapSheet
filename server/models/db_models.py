"""
[역할] SQLModel 기반 DB 모델 정의 (PostgreSQL/Supabase)

SQLModel = Pydantic + SQLAlchemy 통합
- table=True: DB 테이블 모델
- table=False: API 스키마용 모델 (기본값)

테이블 구조:
1. gemini_raw_data    : Gemini 원본 응답 저장 (JSONB)
2. expenses           : 후처리된 가계부 데이터
3. ocr_corrections    : 오독 사전 (오탈자 → 정답 매핑)
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Index, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB


# ============================================================
# [A] Gemini 원본 데이터 테이블
# ============================================================
class GeminiRawData(SQLModel, table=True):
    """Gemini API 원본 응답 저장"""
    __tablename__ = "gemini_raw_data"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    image_filename: str = Field(max_length=255)
    raw_json: dict = Field(sa_column=Column(JSONB, nullable=False))
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")}
    )

    # 관계: 하나의 원본 데이터 → 여러 가계부 항목
    expenses: list["Expense"] = Relationship(back_populates="raw_data")


# ============================================================
# [C] 가계부 항목 테이블
# ============================================================
class ExpenseBase(SQLModel):
    """가계부 항목 공통 필드 (API/DB 공유)"""
    date: Optional[str] = Field(default=None, max_length=10)
    category: str = Field(max_length=50)
    sub_category: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None)
    budget: int = Field(default=0)
    spent: int = Field(default=0)
    diff: int = Field(default=0)


class Expense(ExpenseBase, table=True):
    """후처리된 가계부 항목 (DB 테이블)"""
    __tablename__ = "expenses"
    __table_args__ = (
        Index("ix_expenses_category", "category"),
        Index("ix_expenses_date", "date"),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    raw_data_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("gemini_raw_data.id"), nullable=False)
    )
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")}
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={
            "server_default": text("CURRENT_TIMESTAMP"),
            "onupdate": datetime.now
        }
    )

    # 관계
    raw_data: Optional[GeminiRawData] = Relationship(back_populates="expenses")


class ExpenseCreate(ExpenseBase):
    """가계부 항목 생성용 스키마 (API 요청)"""
    pass


class ExpenseRead(ExpenseBase):
    """가계부 항목 조회용 스키마 (API 응답)"""
    id: uuid.UUID
    raw_data_id: uuid.UUID
    created_at: Optional[datetime] = None


# ============================================================
# [E] 오독 사전 테이블
# ============================================================
class OcrCorrectionBase(SQLModel):
    """오독 사전 공통 필드"""
    wrong_text: str = Field(max_length=255)
    correct_text: str = Field(max_length=255)
    category_hint: Optional[str] = Field(default=None, max_length=50)


class OcrCorrection(OcrCorrectionBase, table=True):
    """오독 사전 (DB 테이블)

    검증 로직:
    - occurrence_count >= threshold 이면 is_verified=True
    - is_verified=True인 항목만 자동 후처리에 적용
    """
    __tablename__ = "ocr_corrections"
    __table_args__ = (
        Index("ix_ocr_wrong_text", "wrong_text"),
        Index("ix_ocr_verified", "is_verified"),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    occurrence_count: int = Field(default=1)
    is_verified: bool = Field(default=False)
    threshold: int = Field(default=3)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")}
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={
            "server_default": text("CURRENT_TIMESTAMP"),
            "onupdate": datetime.now
        }
    )


class OcrCorrectionCreate(OcrCorrectionBase):
    """오독 사전 생성용 스키마 (API 요청)"""
    pass
