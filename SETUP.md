# SnapSheet 환경 설정 가이드

## 사전 준비

아래 항목들이 설치되어 있어야 합니다.

- [Git](https://git-scm.com/downloads)
- [Anaconda 또는 Miniconda](https://docs.anaconda.com/miniconda/)
- [Node.js 18 이상](https://nodejs.org/)

---

## 1. 저장소 클론

터미널을 열고 프로젝트를 저장할 경로로 이동한 뒤 클론합니다.

```bash
git clone <저장소 URL>
cd SnapSheet
```

이후 모든 명령어는 특별한 언급이 없으면 **SnapSheet 루트 디렉토리**에서 실행합니다.

---

## 2. Google Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/apikey) 접속 (Google 계정 필요)
2. **Get API Key** → **Create API Key** 클릭
3. 생성된 키를 복사해둡니다

---

## 3. Supabase 프로젝트 설정

### 3-1. 프로젝트 생성 (최초 1회)

1. [Supabase](https://supabase.com/) 접속 후 로그인
2. **New Project** 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정 후 생성
4. 프로젝트 생성 완료까지 약 1-2분 대기

### 3-2. 연결 정보 확인

1. Supabase 대시보드 > **Project Settings** (좌측 하단 톱니바퀴)
2. **Database** 탭 > **Connection string** > **Session mode** 선택 후 URI 복사
3. **API** 탭 > **Project URL**과 **anon public** 키 복사

---

## 4. 환경변수 설정

루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 작성합니다.

> VS Code, 메모장 등 텍스트 에디터로 `SnapSheet/.env` 파일을 새로 만들면 됩니다.
> 파일명이 `.env`인지 확인하세요. (`.env.txt` 등이 되지 않도록 주의)

```
# Google Gemini API 키
GOOGLE_API_KEY="발급받은_API_키_입력"

# Supabase DB 연결 (Session Pooler 사용, 비동기 연결용)
DATABASE_URL="postgresql+asyncpg://postgres.프로젝트ID:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

# Supabase API (향후 확장용)
SUPABASE_URL="https://프로젝트ID.supabase.co"
SUPABASE_KEY="anon_public_키_입력"
```

> **주의:**
> - Connection string 복사 시 `postgresql://`을 `postgresql+asyncpg://`로 변경
> - `[YOUR-PASSWORD]`를 실제 비밀번호로 교체
> - Session Pooler 사용 시 username이 `postgres.프로젝트ID` 형태임

---

## 5. 서버 (Backend) 설정

> 이 과정은 서버 전용 터미널 1개에서 진행합니다.

### 가상환경 생성 및 활성화

> **Anaconda Prompt**를 열어서 실행합니다. (일반 터미널에서는 `conda` 명령어가 동작하지 않을 수 있습니다.)
> Windows 기준: 시작 메뉴 → **Anaconda Prompt** 검색 후 실행

```bash
conda create -n snapsheet python=3.10 -y
conda activate snapsheet
```

### 패키지 설치

가상환경이 활성화된 상태에서 **루트 디렉토리**에 있는지 확인 후 실행합니다.

```bash
pip install -r server/requirements.txt
```

### 서버 실행

```bash
cd server
python main.py
```

서버가 정상 실행되면 아래에서 확인할 수 있습니다.
- 서버 주소: `http://127.0.0.1:8000`
- API 명세 (Swagger): `http://127.0.0.1:8000/docs`

> 이 터미널은 서버가 실행되는 동안 **닫지 않습니다.**

---

## 6. 클라이언트 (Frontend) 설정

> 서버 터미널은 그대로 두고, **새 터미널**을 열어서 진행합니다.
> conda 가상환경은 불필요합니다. 일반 터미널에서 실행하세요.

### 패키지 설치

새 터미널에서 클론한 경로를 기준으로 `client` 폴더로 이동합니다.

```bash
cd 경로/SnapSheet/client
npm install
```

예시 (Windows):
```bash
cd C:/Users/username/Desktop/SnapSheet/client
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

---

## 폴더 구조

```
SnapSheet/
├── .env                  # 환경변수 (직접 생성 필요, git 미추적)
├── .env.example          # 환경변수 템플릿
├── server/               # FastAPI 백엔드
│   ├── main.py           # 서버 진입점
│   ├── models/           # Pydantic 데이터 모델
│   ├── services/         # Gemini AI 연동 서비스
│   ├── routers/          # API 엔드포인트
│   └── requirements.txt  # Python 패키지 목록
└── client/               # React 프론트엔드
    ├── src/
    │   ├── App.tsx
    │   ├── components/   # UI 컴포넌트
    │   ├── services/     # API 통신
    │   └── types/        # TypeScript 타입
    └── package.json
```