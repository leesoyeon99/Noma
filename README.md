<<<<<<< HEAD
# Noma Heatmap Calendar (AI 진단 · 가이드 여정 · LLM 허브)

React + Vite 기반의 일정/투두 캘린더에 AI 기능(진단/가이드 여정/LLM 챗봇)을 결합한 데모입니다.

## 주요 기능
- **홈/캘린더**: TUI Calendar 기반 일정 관리 + 히트맵 달력
- **오늘의 투두**: 우측 사이드바 토글(접기/펼치기) + 카테고리별 투두 관리
- **AI 진단**: AI 코칭 인포그래픽 + 코칭/플랜/인사이트
- **가이드 여정**: AI 진단 + 코칭 워크플로우 + LLM 챗봇 연동
- **인사이트**: 카테고리별 진도 관리 대시보드 + KPI 차트
- **LLM 허브**: 분야별 학습 자료 관리 + RAG 기반 챗봇

## 새로운 기능 (최근 업데이트)
- **AI 코칭 인포그래픽**: 진단코칭 탭 상단에 시각적 프로세스 설명
- **가이드 여정 데모**: 파일 업로드 → AI 인식 → 진단 → 코칭 → 내보내기 워크플로우
- **LLM 챗봇 인포그래픽**: 친근한 AI 코치와 사용자 상호작용 시각화
- **접을 수 있는 우측 사이드바**: 360px ↔ 0px 애니메이션 전환
- **간소화된 네비게이션**: AI 진단, LLM, 가이드 여정으로 메뉴 정리
=======

# NOMA  
AI 진단 · 학습 여정 · LLM 허브  

**NOMA**는 교재/시험지/학습자료를 기반으로 AI가 학습자의 상태를 분석하고, 맞춤형 코칭과 학습 여정을 설계해주는 **AI 학습 코치 플랫폼**입니다.  
단순한 일정 관리나 투두앱을 넘어, **AI 진단 → 코칭 → NOMA Compass(가이드 여정) → LLM 챗봇**까지 연결된 통합 학습 경험을 제공합니다.  
>>>>>>> d09d25446de2df9a29d0d7b8c152c4b2c25ebe0b

🔗 [데모 바로가기](https://leesoyeon99.github.io/Noma/)  

---

## 📦 실행 방법
```bash
npm ci
npm run dev
<<<<<<< HEAD
# http://localhost:5173 또는 5174 접속
```
=======
# 접속: http://localhost:5173

🔨 빌드
>>>>>>> d09d25446de2df9a29d0d7b8c152c4b2c25ebe0b

npm run build
npm run preview

<<<<<<< HEAD
## 폴더 구조
```
Noma-heatmap-calendar/
├─ public/
│  ├─ ai-coaching-infographic.svg      # AI 코칭 프로세스 인포그래픽
│  └─ ai-llm-chatbot-infographic.svg  # LLM 챗봇 인포그래픽
├─ src/
│  ├─ components/
│  │  ├─ AppLayout.jsx                 # 우측 여백 자동 보정
│  │  ├─ TuiCalendar.jsx               # TUI Calendar 연동
│  │  └─ ui/                           # 경량 Card/Tab 컴포넌트
│  ├─ pages/
│  │  ├─ AICoachShell.jsx              # AI 진단(코칭/플랜/인사이트)
│  │  ├─ GuidedJourneyDemo.jsx         # 가이드 여정 워크플로우
│  │  ├─ MultiDomainCoachHub.jsx       # 분야별 학습 관리
│  │  └─ AICoachFilesTrackingChat.jsx  # 단일 도메인 파일 트래킹
=======

⸻

🚀 현재 버전 기능
	•	홈 / 캘린더
		•	TUI Calendar 기반 일정 관리
		•	히트맵 달력으로 학습 패턴 시각화
		•	오늘의 투두
		•	우측 사이드바 토글 (360px ↔ 0px)
		•	카테고리별 투두 관리
	• NOMA AI 
		•	AI 진단
			•	업로드된 자료 기반 자동 분석
			•	AI 코칭 인포그래픽 제공
			•	개인 맞춤형 코칭/플랜/인사이트 제안
			•	가이드 여정 – NOMA Compass 🧭
			•	시험지/PDF 업로드 → AI 인식/진단 → 세그먼트 분석 → 코칭 → 내보내기
			•	4열 그리드 워크플로우로 직관적 표현
			•	LLM 기반 설명/가이드 연결
		•	LLM 허브
			•	분야별 학습 세션 관리 (토익, 영어회화, 운동 루틴 등)
			•	자료 업로드(텍스트/이미지/마크다운)
			•	RAG 기반 챗봇 → 업로드 자료 근거 기반 답변
			•	진행률 추적 차트
	•	인사이트
		•	카테고리별 진도 관리 대시보드
		•	KPI 차트(평균 진도율, 리스크, 개선 현황)
		•	AI 인사이트 기반 보강 루틴 제안

⸻

📂 폴더 구조

NOMA/
├─ public/
│  ├─ ai-coaching-infographic.svg       # AI 코칭 프로세스 인포그래픽
│  └─ ai-llm-chatbot-infographic.svg   # LLM 챗봇 인포그래픽
├─ src/
│  ├─ components/
│  │  ├─ AppLayout.jsx                  # 레이아웃 + 사이드바 보정
│  │  ├─ TuiCalendar.jsx                # TUI Calendar 연동
│  │  └─ ui/                            # 경량 UI 컴포넌트
│  ├─ pages/
│  │  ├─ AICoachShell.jsx               # AI 진단(코칭/플랜/인사이트)
│  │  ├─ GuidedJourneyDemo.jsx          # 가이드 여정(NOMA Compass)
│  │  ├─ MultiDomainCoachHub.jsx        # LLM 허브(분야별 관리)
│  │  └─ AICoachFilesTrackingChat.jsx   # 단일 도메인 파일 트래킹
>>>>>>> d09d25446de2df9a29d0d7b8c152c4b2c25ebe0b
│  ├─ App.jsx                           # 메인 앱 + 사이드바 토글
│  └─ styles.css
└─ README.md

<<<<<<< HEAD
## 사용법

### 1) 우측 사이드바 토글
- **홈/캘린더 탭에서만**: 우측 상단 "오늘의 투두" 버튼으로 접기/펼치기
- **다른 탭에서**: 내보내기 미리보기 등이 자동으로 우측에 표시
- **애니메이션**: 200ms ease 전환으로 부드러운 UX

### 2) 가이드 여정 (AI 진단 + 코칭)
- **진단 + 코칭 탭**: 
  - 파일 업로드 → AI 인식 → 진단 → 세그먼트 → 코칭 → 내보내기
  - 4열 그리드 레이아웃으로 직관적인 워크플로우
- **LLM 챗봇 탭**: 
  - 세션별 분야 관리 + RAG 기반 질의응답
  - 진단 결과를 챗봇 컨텍스트로 원클릭 전송

### 3) AI 진단
- **AI 코칭 인포그래픽**: 상단에 시각적 프로세스 설명
- **코칭 제안**: AI 기반 개인화 학습 계획 제안
- **NOMA LLM**: 음성 인식 + LLM API 연동

### 4) LLM 허브
- **분야 관리**: 토익 RC/LC, 영어 회화, 근력/유산소 등
- **자료 업로드**: 텍스트/마크다운/이미지 첨부
- **RAG 챗봇**: 업로드 자료 기반 근거 있는 답변
- **진행률 추적**: 일자별 학습량 누적 + 차트 시각화

### 5) 인사이트
- **KPI 대시보드**: 평균 진도율, 리스크 카테고리, 개선 현황
- **차트**: 카테고리별 진도 vs 목표, 주간 변화 추이
- **AI 인사이트**: 취약점 분석 + 보강 루틴 제안

## 기술 스택
- **Frontend**: React 18, Vite 5, Tailwind CSS
- **Charts**: Recharts (Bar/Pie/Line)
- **Calendar**: TUI Calendar
- **Icons**: lucide-react
- **Animations**: CSS transitions, framer-motion
- **Layout**: CSS Grid, Flexbox

## Git 명령어
```bash
# 변경사항 커밋 및 푸시
git add -A
git commit -m "feat: add new features"
git push

# 처음 설정 시
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 라이선스
- 데모 용도. 필요 시 자유롭게 수정/확장하세요.

## 최근 업데이트 내역
- **2025-08-27**: AI 코칭/LLM 챗봇 인포그래픽 추가
- **2025-08-27**: 가이드 여정 워크플로우 구현
- **2025-08-27**: 접을 수 있는 우측 사이드바 구현
- **2025-08-27**: 네비게이션 메뉴 간소화
=======

⸻

🧑‍💻 사용법

1) 우측 사이드바
	•	홈/캘린더 탭 → “오늘의 투두” 버튼으로 접기/펼치기
	•	다른 탭 → 자동으로 우측에 미리보기/내보내기 표시
	•	200ms ease 애니메이션으로 부드럽게 전환

2) NOMA 
	•	파일 업로드 → AI 분석 → 진단 → 코칭 → 내보내기
	•	학습자가 **“지금 어디에 있고, 어디로 가야 하는지”**를 AI가 나침반처럼 안내

3) AI 진단
	•	상단 인포그래픽으로 프로세스 시각화
	•	맞춤형 학습 플랜 제안
	•	음성 인식 + LLM API 연동

4) LLM 허브
	•	토익/영어회화/체력관리 등 분야별 세션 관리
	•	자료 업로드 후 RAG 챗봇으로 학습 기반 Q&A
	•	진행률 추적 차트

5) 인사이트
	•	KPI 대시보드로 진도율/리스크 파악
	•	주간 변화 추이 분석
	•	AI 기반 보강 루틴 추천

⸻

🛠 기술 스택
	•	Frontend: React 18, Vite 5, Tailwind CSS
	•	Charts: Recharts (Bar/Pie/Line)
	•	Calendar: TUI Calendar
	•	Icons: lucide-react
	•	Animations: CSS transitions, framer-motion
	•	Layout: CSS Grid, Flexbox

⸻

📄 서비스 철학
	•	교재/자료 기반 AI → “내 자료로 학습하는 AI”
	•	일방향 콘텐츠가 아닌, 상호작용 기반 루틴 설계
	•	진단/코칭/여정을 연결한 완주형 학습 에이전트

⸻

📌 Demo: https://leesoyeon99.github.io/Noma/

---
>>>>>>> d09d25446de2df9a29d0d7b8c152c4b2c25ebe0b
# Build trigger
