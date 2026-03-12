# SnapSheet 팀 개발 가이드라인

## 1. 기술 스택 및 환경 (Tech Stack)
* **OS:** Windows 기반 환경
* **Frontend:** React (Vite 빌드 도구 사용), TypeScript (.tsx, .ts)
* **Backend:** Python (Miniconda 가상환경 관리), FastAPI, Pydantic (데이터 검증)
* **AI Pipeline:** Google Gemini 2.0 Flash (이미지 내 표 구조 인식 및 텍스트 추출)
* **Database:** Supabase (클라우드 PostgreSQL, Session Pooler 사용)

## 2. Git 브랜치 및 커밋 전략 (GitHub Flow)
안정적인 메인 코드 유지와 명확한 역할 분담을 위해 GitHub Flow 전략을 사용합니다.

**브랜치 운영 규칙**
* `main` 브랜치: 항상 에러 없이 실행 가능한 배포 대기 상태여야 합니다. **직접 Push는 엄격히 금지**합니다.
* `작업` 브랜치: 새로운 기능이나 수정 시 `main`에서 분기하여 작업합니다.
* **브랜치 네이밍:** `유형/파트/작업내용` 구조를 따릅니다.
  * 프론트엔드 예시: `feat/client/upload-button`
  * 백엔드 예시: `fix/server/db-connection`
* **병합(Merge) 규칙:** 작업이 완료되면 Pull Request(PR)를 생성합니다. 프론트와 백엔드 개발자가 서로 파싱 구조와 변수명 규칙이 맞는지 리뷰하고 승인(Approve)한 후 `main`에 병합합니다.

**커밋 메시지 규칙**
작업 내용의 목적을 명확히 알 수 있도록 아래 포맷을 준수합니다.
* 명령어 포맷: `git commit -m "타입: 제목" -m "상세 내용"`
* 타입(Type) 종류:
  * `feat:` 새로운 기능 추가
  * `fix:` 버그 수정
  * `docs:` 문서 수정 (README 등)
  * `style:` 코드 포맷팅 (로직 변경 없음)
  * `refactor:` 코드 리팩토링

## 3. 명명 규칙 (Naming Conventions)
프론트엔드와 백엔드 간의 데이터 파싱 오류를 원천 차단하기 위해 아래 규칙을 엄격히 적용합니다.

**영역별 네이밍 케이스**
| 영역 | 적용 대상 | 케이스(Case) 규칙 | 예시 |
| :--- | :--- | :--- | :--- |
| **공통 (API)** | 프론트-백엔드 통신용 JSON 데이터 Key | 스네이크 케이스 | `user_name`, `table_data` |
| **Backend** | 일반 변수명, 함수명 | 스네이크 케이스 | `extract_table()`, `raw_image` |
| **Backend** | 클래스명 (Pydantic 모델 등) | 파스칼 케이스 | `DocumentParser`, `UserRequest` |
| **Backend** | 환경변수 및 상수 | 어퍼 스네이크 케이스 | `DB_PASSWORD`, `MAX_RETRIES` |
| **Frontend** | 일반 변수명, 함수명, 일반 설정 파일(`.ts`) | 카멜 케이스 | `isUploading`, `fetchData.ts` |
| **Frontend** | 컴포넌트명, 인터페이스(Type), 리액트 파일(`.tsx`) | 파스칼 케이스 | `UploadArea.tsx`, `TableProps` |

**동사 접두사 (Prefix) 규칙**
함수의 목적을 직관적으로 파악할 수 있도록 접두사를 통일합니다.
* 데이터를 가져올 때: `get...` / `get_...`
* 데이터를 가공 및 처리할 때: `parse...` / `parse_...`
* 상태(참/거짓)를 나타낼 때: `is...` / `is_...`
* 사용자의 행동 이벤트를 처리할 때 (프론트엔드 전용): `handle...` (예: `handleDrop`, `onClick`)

## 4. 데이터베이스 설계 원칙 (Database Strategy)
문서 종류(가계부, 근무표 등)마다 달라지는 표 구조를 유연하게 처리하기 위해 관계형 모델과 NoSQL 방식을 혼합하여 사용합니다.
* **정형 데이터 (관계형 테이블):** 사용자 정보, 문서의 메타데이터(업로드 시간, 파일명 등)는 일반적인 RDBMS 테이블 구조로 단단하게 설계하여 무결성을 보장합니다.
* **비정형 데이터 (JSONB 활용):** Gemini가 추출한 가변적이고 복잡한 표 내부 데이터는 PostgreSQL의 `JSONB` 데이터 타입 컬럼에 통째로 저장하여 유연성과 검색 속도를 확보합니다.