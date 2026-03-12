"""
[역할] Google Gemini Vision API 연동 서비스
- 이미지를 Gemini에 전달하여 표 데이터 추출
- Gemini 원본 응답(items 배열)을 카테고리별 grouped_items 구조로 변환

[추가 예정]
- AI 엔진 추상화 인터페이스 (다른 모델로 교체 가능하도록)
- 프롬프트 버전 관리
- 응답 캐싱
"""
import os
import json
import re

from google import genai
from PIL import Image

from models.expense import GeminiRawResult, AnalysisResult, GroupedCategory


GEMINI_PROMPT = """
이미지 속 표 데이터를 분석하여 아래의 JSON 구조로만 응답해줘.
참고사항:
1. 모든 금액은 콤마(,)와 기호(▲, ▼, +, - 등)를 제거하고 오직 정수(integer)로만 변환해줘.
2. 잉여/초과 구분: 잉여(금액이 남은 경우)는 양수, 초과(지출이 더 많은 경우)는 음수로 표현해줘.
3. 데이터가 비어있으면 0으로 처리해줘.
4. 지출, 고정 지출, 투자&저축 등 카테고리 구분이 명확하지 않으면 모두 "유동비"로 통일하고 있다면 나눠서 표현해줘.
5. 계획 금액은 표에 반영하지 않고, 실제 수입 혹은 지출만 계산에 활용해줘.
6. 소득, 수입 등의 항목은 예산 금액에 추가하고 실 지출 금액 계산에는 당연히 제외 대상이야.
7. 마크다운 기호 없이 순수 JSON만 반환해줘.
8. 날짜는 정보가 일 정보만 있다면 년, 월은 현재 날짜로 채워줘. 일, 월 정보만 있다면 년도는 현재 년도로 채워줘. 날짜 정보가 없다면 빈 문자열로 처리해줘.

JSON 구조:
{
  "title": "표의 전체 제목",
  "items": [
    {
      "category": "항목명 (string)",
      "sub_category": "세부 항목명 (string, 없으면 빈 문자열)",
      "description": "추가 설명 (string, 없으면 빈 문자열)",
      "budget": "월 예산 금액 (int)",
      "date": "지출 발생 날짜 (YYYY-MM-DD, 없으면 빈 문자열)",
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


def _init_client() -> genai.Client:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")
    return genai.Client(api_key=api_key)


client = _init_client()


def _group_by_category(raw: GeminiRawResult) -> AnalysisResult:
    groups: dict[str, GroupedCategory] = {}
    for item in raw.items:
        cat = item.category or "기타"
        if cat not in groups:
            groups[cat] = GroupedCategory(total_spent=0, items=[])
        groups[cat].items.append(item)
        groups[cat].total_spent += item.spent

    return AnalysisResult(
        title=raw.title,
        grouped_items=groups,
        total=raw.total,
    )


def parse_image_to_expenses(img: Image.Image) -> tuple[dict, AnalysisResult]:
    """
    이미지를 분석하여 가계부 데이터 추출

    Returns:
        tuple[dict, AnalysisResult]: (원본 JSON dict, 카테고리별 그룹화된 결과)
    """
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=[GEMINI_PROMPT, img],
    )

    json_match = re.search(r"\{.*\}", response.text, re.DOTALL)
    if not json_match:
        raise ValueError("Gemini가 유효한 JSON을 생성하지 못했습니다.")

    raw_json = json.loads(json_match.group())
    raw = GeminiRawResult(**raw_json)
    return raw_json, _group_by_category(raw)
