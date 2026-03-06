from paddleocr import PPStructureV3
import os

# 파이프라인 초기화
pipeline = PPStructureV3(
    lang="en",
    use_doc_orientation_classify=True,
    use_doc_unwarping=True,
    device="gpu"
)

def process_document(image_path):
    try:
        # 예측 실행
        output = pipeline.predict(image_path)
        
        results = []
        for res in output:
            # V3 결과 객체에서 필요한 데이터 추출
            # res.html: 표의 HTML 구조
            # res.layout_res: 레이아웃(텍스트, 표, 그림 등) 정보
            # res.res: 내부 OCR 결과물(있을 경우)
            results.append({
                "html": getattr(res, 'html', None),
                "layout": getattr(res, 'layout_res', []),
                "text_data": getattr(res, 'res', []) # V3에서 텍스트 정보가 담긴 곳
            })
        return results
    except Exception as e:
        return {"error": f"엔진 처리 중 오류: {str(e)}"}