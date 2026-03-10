"""
[역할] 비동기 PostgreSQL(Supabase) 데이터베이스 연결 설정
- AsyncEngine: 비동기 DB 엔진
- async_session_maker: 비동기 세션 팩토리
- get_db: FastAPI 의존성 주입용 세션 제공 함수
- init_db: 테이블 생성 (개발용)

[사용법]
    from database import get_db

    @router.post("/example")
    async def example(db: AsyncSession = Depends(get_db)):
        ...
"""
import os
import ssl
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL이 설정되지 않았습니다. .env 파일을 확인하세요.")

# Supabase SSL 설정
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# 비동기 엔진 생성
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # True로 설정 시 SQL 쿼리 로깅
    pool_pre_ping=True,  # 연결 유효성 검사
    connect_args={"ssl": ssl_context},
)

# 비동기 세션 팩토리
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# ORM 모델 베이스 클래스
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 의존성 주입용 DB 세션 제공"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """테이블 생성 (개발 환경용)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
