"""
[역할] 인증 관련 DB 모델 (SQLModel)

테이블 구조:
1. users          : 사용자 계정
2. refresh_tokens : JWT 리프레시 토큰
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Index, text, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID


# ============================================================
# [1] 사용자 테이블
# ============================================================
class User(SQLModel, table=True):
    """사용자 계정 테이블"""
    __tablename__ = "users"
    __table_args__ = (
        # 활성 계정(is_deleted=False)에만 이메일 유니크 적용 → 탈퇴 후 재가입 허용
        Index("ix_users_email_active", "email", unique=True, postgresql_where=text("is_deleted = FALSE")),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    email: str = Field(sa_column=Column(String(255), nullable=False))
    hashed_password: str = Field(sa_column=Column(String(255), nullable=False))
    username: Optional[str] = Field(default=None, max_length=50)
    login_failed_count: int = Field(default=0)
    login_locked_until: Optional[datetime] = Field(default=None)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
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
    refresh_tokens: list["RefreshToken"] = Relationship(back_populates="user")


# ============================================================
# [2] 리프레시 토큰 테이블
# ============================================================
class RefreshToken(SQLModel, table=True):
    """리프레시 토큰 저장 테이블"""
    __tablename__ = "refresh_tokens"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    )
    token_hash: str = Field(sa_column=Column(String(255), nullable=False))
    expires_at: datetime = Field(nullable=False)
    is_revoked: bool = Field(default=False)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")}
    )

    # 관계
    user: Optional[User] = Relationship(back_populates="refresh_tokens")
