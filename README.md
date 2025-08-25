# Noma Heatmap Calendar (AI 진단 · LLM 허브)

React + Vite 기반의 일정/투두 캘린더에 AI 기능(진단/파일 기반 트래킹/챗봇)을 결합한 데모입니다.

## 주요 기능
- 캘린더/히트맵 달력(TUI Calendar)
- 오늘의 투두 토글(우측 고정 버튼 “오늘의 투두”로 접기/펼치기)
- AI 진단 탭: 코칭/플랜/인사이트 등
- LLM 허브(좌측 메뉴 LLM):
  - 분야 리스트(토익 RC/LC, 영어 회화, 근력/유산소) · 추가/삭제 · 진행률 배지
  - 분야별 독립 상태 저장(목표/마감, 학습자료, 챗 이력, 첨부 이미지)
  - Library/Tracker/Chat 서브탭
  - 텍스트/마크다운 업로드 → 세그먼트 자동 분할 → 완료 체크 시 일자별 학습량 누적
  - 근거 필수 챗봇: 업로드 텍스트에서 근거가 없으면 답변 거절(할루시네이션 방지)
  - 근력/유산소 Library에서 이미지(인바디/식단표) 첨부 및 미리보기

## 실행
```bash
npm ci
npm run dev
# http://localhost:5173 접속
```

## 빌드
```bash
npm run build
npm run preview
```

## 폴더 구조
```
Noma-heatmap-calendar/
├─ src/
│  ├─ components/
│  │  ├─ TuiCalendar.jsx              # TUI Calendar 연동
│  │  └─ ui/                          # 경량 Card/Tab 컴포넌트
│  ├─ pages/
│  │  ├─ AICoachShell.jsx             # AI 진단(코칭/플랜/인사이트)
│  │  ├─ AICoachFilesTrackingChat.jsx # 단일 도메인 파일 트래킹 & 챗봇
│  │  └─ MultiDomainCoachHub.jsx      # 분야 리스트 ←→ Pane (Library/Tracker/Chat)
│  ├─ App.jsx                         # 좌측 메뉴(홈/AI 진단/LLM/인사이트)
│  └─ styles.css
└─ README.md
```

## 사용법
### 1) 오늘의 투두 토글
- 화면 우측 상단 고정 버튼 “오늘의 투두 (▶/◀)”를 눌러 우측 투두 영역을 접었다/펼칩니다.

### 2) LLM(분야 리스트)
- 좌측 메뉴에서 LLM 진입 → 좌측 카드에서 분야 선택
- 기본 제공: 토익 RC/LC, 영어 회화, 근력/유산소
- 우측 Pane에서 Library/Tracker/Chat 전환
- Library
  - 텍스트/마크다운 업로드 → 세그먼트 자동 생성
  - 근력/유산소 등에서 이미지(인바디/식단표) 첨부 가능(썸네일 클릭 시 확대)
- Tracker
  - 완료/잔여 바차트, 도넛, 일자별 라인 차트
- Chat
  - 업로드 텍스트에서만 근거를 추출해 답변(근거 없으면 거절)

### 3) 분야 추가/삭제
- LLM 좌측 상단 “추가” → 새 분야명 입력 → 분야별 상태가 자동 생성됩니다.
- 🗑️ 아이콘으로 해당 분야 삭제(저장 상태도 함께 제거).

## Git (처음 푸시 시)
```bash
printf "node_modules/\ndist/\n.vite/\n.DS_Store\n.env\n.env.local\n" >> .gitignore
git rm -r --cached node_modules || true
git init
git add .
git commit -m "feat: AI 진단/LLM 허브/도메인별 트래킹 + 투두 토글"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 기술 스택
- React 18, Vite 5
- Recharts(Bar/Pie/Line), framer-motion(애니메이션)
- TUI Calendar
- lucide-react(아이콘)

## 라이선스
- 데모 용도. 필요 시 자유롭게 수정/확장하세요.
