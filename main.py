import os
import uuid
import shutil
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import re

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ 에러: GOOGLE_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash-lite')

app = FastAPI(title="SnapSheet API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 테스트를 위해 일시적으로 전체 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload")
async def parse_uploaded_image(file: UploadFile = File(...)):
    temp_file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 이미지 전처리 (RGBA -> RGB)
        img = Image.open(temp_file_path).convert("RGB")

        prompt = """
        이미지 속 표 데이터를 분석하여 아래의 JSON 구조로만 응답해줘. 
        참고사항:
        1. 모든 금액은 콤마(,)와 기호(▲, ▼, +, - 등)를 제거하고 오직 정수(integer)로만 변환해줘.
        2. 잉여/초과 구분: 잉여(금액이 남은 경우)는 양수, 초과(지출이 더 많은 경우)는 음수로 표현해줘.
        3. 데이터가 비어있으면 0으로 처리해줘.
        4. 지출, 고정 지출, 투자&저축 등 카테고리 구분이 명확하지 않으면 모두 "유동비"로 통일하고 있다면 나눠서 표현해줘.
        4. 마크다운 기호 없이 순수 JSON만 반환해줘.

        JSON 구조:
        {
          "title": "표의 전체 제목",
          "items": [
            {
              "category": "항목명 (string)",
              "sub_category": "세부 항목명 (string, 없으면 빈 문자열)",
              "description": "추가 설명 (string, 없으면 빈 문자열)",
              "budget": "월 예산 금액 (int)",
              "spent": "실 지출액 (int)",
              "diff": "잉여 또는 초과 금액 (int)"
            }
          ],
          "total": {
            "budget_sum": "예산 합계 (int)",
            "spent_sum": "지출 합계 (int)",
            "diff_sum": "차이 합계 (int)"
          }
        }
        """

        response = model.generate_content([prompt, img])
        
        # JSON 블록만 추출하는 정규식
        json_match = re.search(r"\{.*\}", response.text, re.DOTALL)
        if json_match:
            final_json = json.loads(json_match.group())
        else:
            raise ValueError("Gemini가 유효한 JSON을 생성하지 못했습니다.")

        return {
            "status": "success",
            "analysis_result": final_json
        }

    except Exception as e:
        print(f"❌ 서버 내부 에러 발생: {str(e)}") # 터미널에서 에러 확인용
        return {"status": "error", "message": str(e)}
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)