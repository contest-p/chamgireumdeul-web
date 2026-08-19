# 참기름들

참기름·들기름 판매 사이트 — AI가 요리에 어울리는 기름을 추천해 드립니다.

🔗 **배포 URL**: https://chamgireumdeul-web-gold.vercel.app/

---

## 소개

집밥을 요리하는 소비자가 "이 요리엔 참기름이 나을까, 들기름이 나을까?" 고민할 때,
AI가 요리명 하나만으로 어울리는 기름과 그 기름을 활용한 개선 레시피를 알려주는 서비스입니다.

일반 참기름·들기름부터 저온압착, 볶지 않은 생참기름·들기름까지 다양한 제품 라인업을 소개하고,
본점에서만 만날 수 있는 계절 한정 메뉴(여름 참기름 소프트아이스크림 / 겨울 참기름·들기름 크림라떼)도 함께 소개합니다.

## 주요 기능

- **AI 기름 추천**: 요리명을 입력하면 Gemini API가 참기름·들기름 중 더 어울리는 쪽과 추천 이유, 활용 레시피를 생성
- **제품소개**: 참기름·들기름 라인업 및 본점 계절 메뉴 소개
- **문의하기**: 문의 폼 제출 시 Google Apps Script를 통해 Google Sheets에 자동 저장
- **반응형 디자인**: 모바일 / 태블릿 / 데스크톱 전 화면 대응

## 페이지 구성

상단 네비게이션으로 이동하는 4개 섹션(단일 페이지 스크롤 구조):

1. **메인** — 브랜드 소개
2. **제품소개** — 참기름·들기름 라인업 + 본점 계절 메뉴
3. **AI추천** — AI 기름 추천 기능
4. **문의** — 문의 폼

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프론트엔드 | HTML5, CSS3, Vanilla JavaScript |
| 백엔드 | Vercel Serverless Functions (Python) |
| AI API | Google Gemini API (`gemini-2.5-flash`) |
| 배포 | Vercel |
| 운영 자동화 | Google Apps Script + Google Sheets (문의 폼 자동 저장) |
| 저장소 | GitHub |

## 폴더 구조

```
chamgireumdeul-web/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── api/
│   └── recommend.py       # AI 추천 서버리스 함수
├── images/                 # 제품·브랜드 이미지
├── vercel.json              # 정적 파일 / Python 함수 라우팅 설정
├── requirements.txt
└── .env                     # 환경 변수 (git에 포함되지 않음)
```

## 실행 방법 (로컬)

이 프로젝트는 별도 빌드 과정 없이 정적 파일 + Vercel 서버리스 함수로 구성되어 있습니다.

1. 저장소 클론
   ```bash
   git clone https://github.com/contest-p/chamgireumdeul-web.git
   cd chamgireumdeul-web
   ```
2. 프로젝트 루트에 `.env` 파일 생성 후 환경 변수 설정 (아래 "환경 변수 설정" 참고)
3. `index.html`을 브라우저로 직접 열거나, VS Code의 Live Server 확장 등으로 실행
   - 단, AI 추천 기능(`/api/recommend`)은 Vercel 서버리스 함수이므로 로컬에서 온전히 테스트하려면 [Vercel CLI](https://vercel.com/docs/cli)의 `vercel dev` 사용을 권장합니다.

## 배포 방법 (Vercel)

1. GitHub 저장소를 [Vercel](https://vercel.com)에 Import
2. Vercel 프로젝트 설정 → Environment Variables에 `GEMINI_API_KEY` 등록 (아래 참고)
3. Deploy 클릭 → 자동 빌드 및 배포
4. 이후 `main` 브랜치에 push할 때마다 자동으로 재배포됩니다

## 환경 변수 설정

이 프로젝트는 아래 환경 변수 하나가 필요합니다.

| 변수명 | 설명 | 발급 위치 |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API 키 | [Google AI Studio](https://aistudio.google.com/apikey) |

**로컬 개발 시**: 프로젝트 루트에 `.env` 파일을 만들고 아래처럼 작성합니다. (`.env`는 `.gitignore`에 등록되어 있어 저장소에 올라가지 않습니다.)
```
GEMINI_API_KEY=your_api_key_here
```

**Vercel 배포 시**: Vercel 프로젝트 → Settings → Environment Variables에서 `GEMINI_API_KEY`를 등록합니다. 코드나 커밋 이력에 실제 키 값이 노출된 적이 없습니다.

## AI 기능 상세

- **입력**: 요리명 (텍스트)
- **출력**:
  1. 추천 기름 (참기름 / 들기름)
  2. 추천 이유
  3. 그 기름을 활용한 개선 레시피
- **실패 처리**:
  - 빈 입력 → "요리명을 입력해주세요 🙂" (400)
  - API 오류 → "잠시 후 다시 시도해주세요" (500)
  - 응답 지연 중 → "참기름 궁합을 확인하고 있어요..." 로딩 상태 표시