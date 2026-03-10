"""
[역할] FastAPI 애플리케이션 진입점
- CORS 미들웨어 설정
- 라우터 등록 (/api/upload)
- 루트 .env 환경변수 로드

[추가 예정]
- 사용자 인증 미들웨어 (JWT)
- PostgreSQL DB 연결 설정 (lifespan 이벤트)
- 전역 에러 핸들러
"""
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.upload import router as upload_router

app = FastAPI(title="SnapSheet API")

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
