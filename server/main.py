"""
[역할] FastAPI 애플리케이션 진입점
- CORS 미들웨어 설정
- 라우터 등록 (/api/upload)
- 루트 .env 환경변수 로드
- PostgreSQL(Supabase) DB 연결 (lifespan 이벤트)

[추가 예정]
- 사용자 인증 미들웨어 (JWT)
- 전역 에러 핸들러
"""
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.upload import router as upload_router
from database import init_db, engine
# ORM 모델 import (테이블 생성을 위해 필요)
from models.db_models import GeminiRawData, Expense, OcrCorrection  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작/종료 시 실행되는 lifespan 이벤트"""
    # 시작 시: DB 테이블 생성
    print("DB 연결 및 테이블 초기화 중...")
    await init_db()
    print("DB 초기화 완료!")
    yield
    # 종료 시: DB 연결 정리
    await engine.dispose()
    print("DB 연결 종료")


app = FastAPI(title="SnapSheet API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
