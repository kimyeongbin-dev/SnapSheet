from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="SnapSheet API")

# 프론트엔드(React, 보통 5173 포트 사용)와의 통신을 위한 CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def parse_uploaded_image(file: UploadFile = File(...)):
    # 1. 파일 확장자 검증 (보안 및 AI 모델 호환성)
    allowed_extensions = (".jpg", ".jpeg", ".png")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail="지원하지 않는 파일 형식입니다. JPG 또는 PNG 파일만 올려주세요."
        )

    # 2. 파일 읽기 (비동기 처리)
    file_content = await file.read()
    
    # 향후 이 file_content를 협업자가 만든 PP-StructureV3 함수로 넘기게 됩니다.

    # 3. 프론트엔드로 응답 (스네이크 케이스 규칙 준수)
    return {
        "file_name": file.filename,
        "file_size_bytes": len(file_content),
        "message": "이미지가 서버에 안전하게 도착했습니다."
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)