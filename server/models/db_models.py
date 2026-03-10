"""
[역할] SQLAlchemy ORM 모델 정의 (PostgreSQL/Supabase)

테이블 구조:
1. gemini_raw_data    : Gemini 원본 응답 저장 (JSONB)
2. expenses           : 후처리된 가계부 데이터
3. ocr_corrections    : 오독 사전 (오탈자 → 정답 매핑)

[설계 원칙]
- 정형 데이터: 일반 컬럼 (user_id, created_at 등)
- 비정형 데이터: JSONB 컬럼 (raw_json, items 등)
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base


class GeminiRawData(Base):
    """[A. 원본 저장] Gemini API 원본 응답"""
    __tablename__ = "gemini_raw_data"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)  # 추후 인증 추가 시
    image_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_json: Mapped[dict] = mapped_column(JSONB, nullable=False)  # Gemini 원본 응답 전체
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # 관계: 하나의 원본 데이터 → 여러 가계부 항목
    expenses: Mapped[list["Expense"]] = relationship(back_populates="raw_data")


class Expense(Base):
    """[C. 최종 저장] 후처리된 가계부 항목"""
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    raw_data_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("gemini_raw_data.id"), nullable=False
    )
    # user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)  # 추후 인증 추가 시

    date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # YYYY-MM-DD
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    sub_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    budget: Mapped[int] = mapped_column(Integer, default=0)
    spent: Mapped[int] = mapped_column(Integer, default=0)
    diff: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # 관계
    raw_data: Mapped["GeminiRawData"] = relationship(back_populates="expenses")

    __table_args__ = (
        Index("ix_expenses_category", "category"),
        Index("ix_expenses_date", "date"),
    )


class OcrCorrection(Base):
    """[E. 오독 사전] OCR 오탈자 → 정답 매핑

    검증 로직:
    - occurrence_count가 threshold(기본 3) 이상이면 is_verified=True
    - is_verified=True인 항목만 자동 후처리에 적용
    """
    __tablename__ = "ocr_corrections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    wrong_text: Mapped[str] = mapped_column(String(255), nullable=False)  # 오독된 텍스트
    correct_text: Mapped[str] = mapped_column(String(255), nullable=False)  # 정답 텍스트
    category_hint: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # 문맥 힌트 (카테고리)

    occurrence_count: Mapped[int] = mapped_column(Integer, default=1)  # 발생 횟수
    is_verified: Mapped[bool] = mapped_column(default=False)  # 검증 완료 여부
    threshold: Mapped[int] = mapped_column(Integer, default=3)  # 검증 기준 횟수

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("ix_ocr_wrong_text", "wrong_text"),
        Index("ix_ocr_verified", "is_verified"),
    )
