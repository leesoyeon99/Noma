import React, { useEffect, useMemo, useRef, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Upload, CheckCircle2, AlertTriangle, FileText, BarChart2, Brain, Folder, Trash2, RefreshCw } from 'lucide-react'

// Lightweight UI helpers for this demo
const Button = ({ children, variant = 'default', size = 'md', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-md border transition-colors'
  const sizes = size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-sm'
  const variants = variant === 'outline'
    ? 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
    : variant === 'dark'
      ? 'bg-gray-900 border-gray-900 text-white hover:bg-black'
      : 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700'
  return (
    <button className={[base, sizes, variants, className].join(' ')} {...props}>
      {children}
    </button>
  )
}

const Progress = ({ value = 0 }) => (
  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
    <div className="h-full bg-purple-600" style={{ width: Math.max(0, Math.min(100, value)) + '%' }} />
  </div>
)

const sleep = (ms) => new Promise((r)=>setTimeout(r, ms))

async function apiIdentifyExam() {
  await sleep(1500) // 1.5초로 증가
  return {
    label: '2024학년도 수학 수능 시험지',
    confidence: 0.86,
    decision: 'auto',
    scope: ['확률과통계','수학Ⅱ'],
    alternatives: [
      { label: '2025년 8월 30일자 인바디 측정표', confidence: 0.78 },
      { label: '5급 공개경쟁채용시험(행정) 상황판단영역 가', confidence: 0.72 },
      { label: '세법 모의고사 1회차', confidence: 0.65 },
      { label: 'SQDL', confidence: 0.58 }
    ],
    signals: { rule: 0.92, clf: 0.83, embed: 0.78 }
  }
}

async function apiProcessOCR(){
  await sleep(900)
  return { pages: 8, questions: 20, notesDetected: true }
}

async function apiDiagnose(){
  await sleep(800)
  return {
    score: 78,
    totalQuestions: 20,
    correctAnswers: 13,
    accuracy: 65,
    weakConcepts: [
      { name: '분수 나눗셈', description: '역수 적용 원리 미흡', count: 3 },
      { name: '속력 공식', description: '단위 변환 계산 오류', count: 2 },
      { name: '확률 기초', description: '표본공간 설정 부족', count: 2 },
      { name: '도형의 성질', description: '각도 관계 이해 부족', count: 1 },
      { name: '비와 비율', description: '비례식 변형 미숙', count: 1 }
    ],
    mistakes: [
      {num:5, text:'분수 나눗셈', concept:'분수 나눗셈', note:'역수 곱하기를 깜빡함'},
      {num:8, text:'속력 vs 시간 혼동', concept:'속력 공식', note:'km/h → m/s 변환 오류'},
      {num:11, text:'확률 계산 오류', concept:'확률 기초', note:'표본공간 설정 안됨'},
      {num:15, text:'도형 각도 계산', concept:'도형의 성질', note:'보조선 그리기 필요'},
      {num:18, text:'비례식 변형', concept:'비와 비율', note:'교차곱셈 공식 미숙'}
    ],
    handwritingNotes: [
      {
        concept: '분수 나눗셈', 
        userNote: '역수? 어떻게?', 
        type: 'confusion',
        aiAnalysis: '사용자가 분수 나눗셈에서 역수 개념을 정확히 이해하지 못함',
        aiExplanation: '역수는 분모와 분자를 바꾼 수입니다. 예를 들어, 2/3의 역수는 3/2입니다. 분수 나눗셈은 나누는 수의 역수를 곱하는 것과 같습니다.'
      },
      {
        concept: '속력 공식', 
        userNote: '단위 변환 복잡함', 
        type: 'difficulty',
        aiAnalysis: '사용자가 속력 공식에서 단위 변환 과정을 어려워함',
        aiExplanation: '속력은 거리를 시간으로 나눈 값입니다. km/h를 m/s로 변환할 때는 1000÷3600을 곱하면 됩니다. 1km/h = 0.278m/s입니다.'
      },
      {
        concept: '확률 기초', 
        userNote: '표본공간이 뭐지?', 
        type: 'question',
        aiAnalysis: '사용자가 확률의 기본 개념인 표본공간을 모르고 있음',
        aiExplanation: '표본공간은 실험에서 일어날 수 있는 모든 결과의 집합입니다. 주사위를 던질 때 표본공간은 {1,2,3,4,5,6}입니다.'
      },
      {
        concept: '도형의 성질', 
        userNote: '각도 관계 모르겠음', 
        type: 'confusion',
        aiAnalysis: '사용자가 도형에서 각도 간의 관계를 혼란스러워함',
        aiExplanation: '삼각형의 세 각의 합은 180도입니다. 평행선과 한 직선이 만날 때 생기는 동위각, 엇각은 서로 같습니다.'
      }
    ],
    coveredConcepts: [
      '수와 연산', '문자와 식', '함수', '기하', '확률과 통계'
    ],
    summaryComment: '수학의 기초 개념들은 잘 이해하고 있으나, 분수 나눗셈과 속력 공식에서 단위 변환에 어려움을 보입니다. 특히 역수 개념과 단위 변환 연습이 필요합니다.'
  }
}

async function apiCoaching(scope){
  await sleep(700)
  return {
    plan: [
      {title:'분수 나눗셈 원리 복습', time:'25분', details:'시각화 예제로 나눗셈=곱셈의 역수 연결'},
      {title:'속력/거리/시간 단위 변환', time:'20분', details:'km/h ↔ m/s 변환 퀴즈 10문항'},
      {title:'확률 기초 재훈련', time:'30분', details:'카드/주사위 표본공간 퀴즈'}
    ],
    scope
  }
}

async function apiExport(){
  await sleep(600)
  return { reportUrl: 'demo://report.pdf', noteUrl: 'demo://note.md', quizUrl: 'demo://quiz.pdf' }
}

const STEPS = [
  { key:'upload',   title:'업로드',        desc:'시험지 사진/파일 등록' },
  { key:'identify', title:'시험 자동 인식', desc:'수능/공무원/SQLD 등 판별' },
  { key:'scope',    title:'범위 지정',     desc:'과목·단원 스코프 확정' },
  { key:'ocr',      title:'OCR·분할',      desc:'문항/필기 추출' },
  { key:'diagnose', title:'진단',          desc:'점수·오답·개념 취약도' },
  { key:'coach',    title:'코칭',          desc:'개선 플랜·코스 생성' },
  { key:'export',   title:'내보내기',      desc:'리포트/노트/보완문제' },
  { key:'handoff',  title:'챗봇으로 이동', desc:'LLM에게 이어서 질문' },
]

const GUIDE = {
  upload:   { tip:'시험지 이미지를 업로드하면 다음 단계로 진행합니다.', cta:'샘플 업로드 실행' },
  identify: { tip:'헤더/문구/로고/형식으로 시험 종류를 자동 판별합니다.', cta:'자동 인식 결과 확인' },
  scope:    { tip:'인식된 시험에 맞춰 단원 범위를 지정합니다.', cta:'범위 확정' },
  ocr:      { tip:'문항과 필기를 추출해 분석 준비를 합니다.', cta:'OCR 처리 완료' },
  diagnose: { tip:'점수/정답률/취약 개념을 계산합니다.', cta:'진단 결과 보기' },
  coach:    { tip:'개선 플랜과 학습 코스를 생성합니다.', cta:'코칭 플랜 보기' },
  export:   { tip:'리포트/요약노트/보완문제를 파일로 만듭니다.', cta:'파일 생성' },
          handoff:  { tip:'이제 AI 코치로 넘어가 세부 질문/업데이트를 진행합니다.', cta:'AI 코치로 이동' },
}

export default function GuidedJourneyDemo(){
  const [tab, setTab] = useState('diagnosis')
  const [current, setCurrent] = useState('upload')
  const [logs, setLogs] = useState([])

  const [uploaded, setUploaded] = useState([]) // {name, size}
  const [examInfo, setExamInfo] = useState(null)
  const [ocrInfo, setOcrInfo] = useState(null)
  const [diag, setDiag] = useState(null)
  const [coach, setCoach] = useState(null)
  const [exported, setExported] = useState(null)
  const [chatContext, setChatContext] = useState(null)
  const [warmSuggestion, setWarmSuggestion] = useState('')
  const [evidences, setEvidences] = useState([])
  const [courseDone, setCourseDone] = useState(0)
  const [prevDiag, setPrevDiag] = useState(null)
  const [improvementNote, setImprovementNote] = useState(null)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDiagnosisDetail, setShowDiagnosisDetail] = useState(false)
  const [showTodoImportModal, setShowTodoImportModal] = useState(false)
  const [examOptions, setExamOptions] = useState([])
  const [domains, setDomains] = useState([
            { id: '토익 RC/LC', name: '실전 어휘 체크', tag: '토익 RC/LC', progress: 0 },
            { id: '영어 회화', name: '일상 회화 연습', tag: '영어 회화', progress: 0 },
            { id: '근력/유산소', name: '유산소 30분', tag: '근력/유산소', progress: 0 },
  ])

  const progress = useMemo(()=> {
    const idx = STEPS.findIndex(s=>s.key===current)
    return Math.round((idx/(STEPS.length-1))*100)
  },[current])

  const log = (text)=> setLogs(l=>[...l, {ts:new Date().toLocaleTimeString(), text}])

  const runStep = async (key) => {
    switch(key){
      case 'upload':
        log('샘플 시험지 업로드 완료')
        break
      case 'identify': {
        setShowLoadingModal(true)
        const r = await apiIdentifyExam()
        setShowLoadingModal(false)
        setExamInfo(r)
        setExamOptions([r.label, ...r.alternatives.map(alt => alt.label)])
        setShowConfirmModal(true)
        log(`시험 자동 인식: ${r.label} (신뢰도 ${Math.round(r.confidence*100)}%)`)
        
        // 자동으로 모든 후속 단계 실행
        setTimeout(async () => {
          // 범위 확정
          log(`범위 확정: ${(r.scope||[]).join(', ') || '(미정)'}`)
          
          // OCR 처리
          const ocrResult = await apiProcessOCR()
          setOcrInfo(ocrResult)
          log(`OCR 완료: ${ocrResult.pages}p / ${ocrResult.questions}문항 / 필기감지=${ocrResult.notesDetected}`)
          
          // 진단 실행
          const diagResult = await apiDiagnose()
          setPrevDiag(diag)
          const base = diagResult.accuracy
          const boosted = Math.min(95, base + courseDone*3 + evidences.length*2)
          const newDiag = { ...diagResult, accuracy: boosted }
          if (prevDiag) {
            const delta = boosted - (prevDiag.accuracy || base)
            setImprovementNote({ before: prevDiag.accuracy, after: boosted, delta })
          }
          setDiag(newDiag)
          log(`진단 완료: 점수 ${diagResult.score}, 정답률 ${diagResult.accuracy}%`)
          
          // 코칭 플랜 생성
          const coachResult = await apiCoaching(r.scope||[])
          setCoach(coachResult)
          log(`코칭 플랜 생성: ${coachResult.plan.length}개 모듈`)
          
          // 파일 생성
          const exportResult = await apiExport()
          setExported(exportResult)
          log('파일 생성 완료: report.pdf / note.md / quiz.pdf')
          
          log('🎉 원클릭 시험지 분석 완료! 모든 정보가 자동으로 채워졌습니다.')
        }, 2000) // 2초 후 자동 실행
        
        break }
      case 'scope':
        log(`범위 확정: ${(examInfo?.scope||[]).join(', ') || '(미정)'}`)
        break
      case 'ocr': {
        const r = await apiProcessOCR()
        setOcrInfo(r)
        log(`OCR 완료: ${r.pages}p / ${r.questions}문항 / 필기감지=${r.notesDetected}`)
        break }
      case 'diagnose': {
        const r = await apiDiagnose()
        setPrevDiag(diag)
        const base = r.accuracy
        const boosted = Math.min(95, base + courseDone*3 + evidences.length*2)
        const newDiag = { ...r, accuracy: boosted }
        if (prevDiag) {
          const delta = boosted - (prevDiag.accuracy || base)
          setImprovementNote({ before: prevDiag.accuracy, after: boosted, delta })
        }
        setDiag(newDiag)
        log(`진단 완료: 점수 ${r.score}, 정답률 ${r.accuracy}%`)
        break }
      case 'coach': {
        const r = await apiCoaching(examInfo?.scope||[])
        setCoach(r)
        log(`코칭 플랜 생성: ${r.plan.length}개 모듈`)
        break }
      case 'export': {
        const r = await apiExport()
        setExported(r)
        log('파일 생성 완료: report.pdf / note.md / quiz.pdf')
        break }
      case 'handoff':
        setTab('chatbot')
        log('AI 코치로 이동')
        break
    }
  }

  const timerRef = useRef(null)
  const nextKey = (k) => {
    const i = STEPS.findIndex(s=>s.key===k)
    return STEPS[Math.min(i+1, STEPS.length-1)].key
  }

  // 업로드 핸들러
  const fileInputRef = useRef(null)
  const requestUpload = () => fileInputRef.current && fileInputRef.current.click()
  const onFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploaded(prev => [
      ...files.map(f => ({ name: f.name, size: f.size })),
      ...prev,
    ].slice(0, 5))
    setCurrent('identify')
    log('샘플/사용자 파일 업로드 완료')
  }

  const setMessagesInChatFromDomain = (dom) => {
    setWarmSuggestion(`${dom.name} 학습을 시작합니다. 무엇이든 질문해 보세요.`)
    setTab('chatbot')
  }

  const sendToChatbot = () => {
    if (!diag) return
    const top = (diag.weakConcepts || []).slice(0, 2)
    const plan = coach?.plan || []
    const first = plan[0]?.title || (top[0] || '핵심 개념')
    const firstTime = plan[0]?.time || '15분'
    setChatContext({ weakConcepts: diag.weakConcepts, priority: top, plan })
    setWarmSuggestion(`${first} 학습을 시작합니다. 무엇이든 질문해 보세요.`)
    setTab('chatbot')
  }

  // Export된 산출물을 Evidence로 자동 반영
  useEffect(()=>{
    if (!exported) return
    const now = new Date()
    const mm = String(now.getMonth()+1).padStart(2,'0')
    const dd = String(now.getDate()).padStart(2,'0')
    const tag = `${mm}${dd}`
    const newFiles = [
      { name: `(AI) ${tag} 리포트` },
      { name: `(AI) ${tag} 요약노트` },
      { name: `(AI) ${tag} 보완문제` },
    ]
    setEvidences(prev=>{
      // 중복 방지 간단 체크
      const names = new Set(prev.map(x=>x.name))
      const add = newFiles.filter(f=>!names.has(f.name))
      return add.length ? [...add, ...prev] : prev
    })
  }, [exported])

  return (
    <AppLayout className="p-6 w-full min-h-screen bg-gray-50">
      <Tabs value={tab} onValueChange={setTab} className="w-full h-full flex flex-col gap-4">
        <TabsList className="grid grid-cols-2 w-full md:w-1/3 mx-auto">
          <TabsTrigger value="diagnosis">진단·코칭</TabsTrigger>
          <TabsTrigger value="chatbot">AI 코치</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="p-0">
          <div className="w-full mb-4">
            <img 
              src="img/ai-coaching-infographic.svg" 
              alt="AI 코칭 프로세스" 
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-4 gap-y-4 items-stretch">
            {/* 첫 번째 행: 업로드+인식, 시험지 분석, 코칭 제안 */}
            {/* 업로드 + 인식 */}
            <Card className="col-span-1 h-full min-h-[260px]">
              <CardHeader>
                <CardTitle>업로드 + 인식</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.md" multiple onChange={onFiles} style={{display:'none'}} />
                <Button variant="outline" onClick={requestUpload} className="w-full">
                  <Upload className="mr-2" size={16}/> PDF/이미지 업로드
                </Button>
                <div className="text-[11px] text-gray-500">텍스트(.txt/.md)도 업로드 가능해요.</div>
                
                {/* 업로드된 파일 */}
                <div className="text-xs text-gray-600">업로드된 파일</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  {(uploaded.length? uploaded : [
                    {name:'2025-08-20 중간고사.pdf'},
                    {name:'모의고사_07.png'},
                  ]).slice(0,3).map((f,i)=>(
                    <li key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                      <span className="flex-1">{f.name}</span>
                      <button 
                        className="text-red-500 hover:text-red-700 ml-2"
                        onClick={() => {
                          // 파일 삭제 로직
                          if (uploaded.length > 0) {
                            setUploaded(prev => prev.filter((_, index) => index !== i))
                          }
                        }}
                        title="파일 삭제"
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
                
                {/* 인식 결과 표시 */}
                {!examInfo && <div className="text-sm text-gray-500">업로드 후 원클릭으로 모든 분석을 자동 실행할 수 있습니다.</div>}
                {examInfo && (
                  <div className="text-sm">
                    {(examInfo.confidence>=0.8)?
                      <span className="inline-flex items-center gap-1 text-purple-700"><span>✔</span>자동 인식</span>
                      :
                      <span className="inline-flex items-center gap-1 text-amber-700"><span>!</span>확인 필요</span>
                    }
                    <span className="ml-2"><b>{examInfo.label}</b> · 신뢰도 {Math.round(examInfo.confidence*100)}%</span>
                    {examInfo.scope?.length>0 && <span className="ml-2 text-gray-600">범위: {examInfo.scope.join(', ')}</span>}
                  </div>
                )}
                
                {/* 원클릭 분석 버튼 */}
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    title="원클릭으로 모든 분석을 자동 실행합니다" 
                    onClick={async()=>{ await runStep('identify') }}
                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                  >
                    🚀 원클릭 전체 분석
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 시험지 분석 */}
            <Card className="col-span-1 h-full min-h-[260px]">
              <CardHeader>
                <CardTitle>시험지 분석</CardTitle>
              </CardHeader>
              <CardContent>
                {!diag ? (
                  <div className="text-sm text-gray-500">진단 완료 후 시험지 분석이 표시됩니다.</div>
                ) : (
                  <div className="space-y-3">
                    {/* 수와 연산 */}
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-blue-800">수와 연산</h5>
                        <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {diag.weakConcepts.find(c => c.name === '분수 나눗셈')?.count || 0}문제 오답
                        </span>
                      </div>
                      <div className="text-sm text-blue-700 mb-2">
                        분수 나눗셈, 비와 비율 등
                      </div>
                      <div className="flex items-center gap-4 text-xs text-blue-600">
                        <span>총 8문제</span>
                        <span>•</span>
                        <span>정답: {8 - (diag.weakConcepts.find(c => c.name === '분수 나눗셈')?.count || 0)}문제</span>
                      </div>
                    </div>

                    {/* 기하 */}
                    <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-green-800">기하</h5>
                        <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          {diag.weakConcepts.find(c => c.name === '도형의 성질')?.count || 0}문제 오답
                        </span>
                      </div>
                      <div className="text-sm text-green-700 mb-2">
                        도형의 성질, 각도 관계 등
                      </div>
                      <div className="flex items-center gap-4 text-xs text-green-600">
                        <span>총 5문제</span>
                        <span>•</span>
                        <span>정답: {5 - (diag.weakConcepts.find(c => c.name === '도형의 성질')?.count || 0)}문제</span>
                      </div>
                    </div>

                    {/* 확률과 통계 */}
                    <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-purple-800">확률과 통계</h5>
                        <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                          {diag.weakConcepts.find(c => c.name === '확률 기초')?.count || 0}문제 오답
                        </span>
                      </div>
                      <div className="text-sm text-purple-700 mb-2">
                        확률 기초, 표본공간 등
                      </div>
                      <div className="flex items-center gap-4 text-xs text-purple-600">
                        <span>총 4문제</span>
                        <span>•</span>
                        <span>정답: {4 - (diag.weakConcepts.find(c => c.name === '확률 기초')?.count || 0)}문제</span>
                      </div>
                    </div>

                    {/* 문자와 식 */}
                    <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-orange-800">문자와 식</h5>
                        <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          {diag.weakConcepts.find(c => c.name === '속력 공식')?.count || 0}문제 오답
                        </span>
                      </div>
                      <div className="text-sm text-orange-700 mb-2">
                        속력 공식, 단위 변환 등
                      </div>
                      <div className="flex items-center gap-4 text-xs text-orange-600">
                        <span>총 3문제</span>
                        <span>•</span>
                        <span>정답: {3 - (diag.weakConcepts.find(c => c.name === '속력 공식')?.count || 0)}문제</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 코칭 제안 */}
            <Card className="col-span-1 h-full min-h-[260px]">
              <CardHeader>
                <CardTitle>코칭 제안</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!coach && <div className="text-sm text-gray-500">진단 완료 후 플랜이 생성됩니다.</div>}
                {coach && (
                  <div className="space-y-3">
                    {/* 학습 범위 요약 */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-800 mb-2">📚 학습 범위</div>
                      <div className="text-sm text-blue-700">
                        {coach.scope?.map((item, idx) => (
                          <div key={idx} className="mb-1">• {item}</div>
                        ))}
                      </div>
                    </div>
                    
                    {/* 일정표 형태의 코칭 플랜 */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <div className="text-sm font-medium text-gray-700">📅 일정표 형태 코칭 플랜</div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="text-sm" style={{minWidth: '500px'}}>
                          <thead className="bg-gray-50">
                            <tr className="border-b">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600" style={{width: '80px', whiteSpace: 'nowrap'}}>시간대</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600" style={{width: '120px', whiteSpace: 'nowrap'}}>제목</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600" style={{width: '200px', whiteSpace: 'nowrap'}}>설명</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600" style={{width: '80px', whiteSpace: 'nowrap'}}>소요시간</th>
                            </tr>
                          </thead>
                          <tbody>
                            {coach.plan.map((p, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 text-xs text-gray-600" style={{whiteSpace: 'nowrap'}}>
                                  {p.scheduledTime || '자동'}
                                </td>
                                <td className="px-3 py-2 font-medium text-gray-800" style={{whiteSpace: 'nowrap'}}>
                                  {p.title}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600" style={{whiteSpace: 'nowrap'}}>
                                  {p.details}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600" style={{whiteSpace: 'nowrap'}}>
                                  {p.time}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* 일정 반영 옵션 */}
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-green-800 mb-2">⚙️ 일정 반영 설정</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-green-700 mb-1">주간 반복 횟수</label>
                          <select className="w-full p-1 border rounded text-xs">
                            <option>1회</option>
                            <option>2회</option>
                            <option>3회</option>
                            <option>4회</option>
                            <option>5회</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-green-700 mb-1">진행 기간</label>
                          <select className="w-full p-1 border rounded text-xs">
                            <option>1주</option>
                            <option>2주</option>
                            <option>3주</option>
                            <option>4주</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-3">
                  <div className="text-xs text-gray-500 text-center py-2">
                    🎯 시험 자동 인식 버튼을 누르면 자동으로 생성됩니다
                  </div>
                </div>
                
                {/* 일정에 바로 반영 버튼 */}
                {coach && (
                  <Button 
                    onClick={() => {
                      // 일정표에 코칭 플랜 반영 로직
                      alert('코칭 플랜이 일정표에 반영되었습니다! 📅')
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    📅 일정표에 바로 반영
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 두 번째 행: 진단 결과, 내보내기 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-4 items-stretch mt-4">
            {/* 진단 결과 */}
            <Card className="col-span-1 h-full min-h-[260px]">
              <CardHeader>
                <CardTitle>진단 결과</CardTitle>
              </CardHeader>
              <CardContent>
                {!diag && <div className="text-sm text-gray-500">OCR 처리 후 자동 분석됩니다.</div>}
                {diag && (
                  <div className="space-y-3">
                    {/* 점수 */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-800">
                        점수: {diag.score}점 ({diag.correctAnswers}/{diag.totalQuestions})
                      </div>
                    </div>

                    {/* 요약 코멘트 */}
                    <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                      <h4 className="font-semibold text-green-800 mb-2">요약 코멘트</h4>
                      <p className="text-sm text-green-700">{diag.summaryComment}</p>
                    </div>

                    {/* 세부 내용 보기 버튼 */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowDiagnosisDetail(true)}
                    >
                      세부 내용 보기
                    </Button>
                  </div>
                )}
                <div className="mt-3">
                  <div className="text-xs text-gray-500 text-center">
                    🎯 시험 자동 인식 버튼을 누르면 자동으로 실행됩니다
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 내보내기 */}
            <Card className="col-span-1 h-full min-h-[260px]">
              <CardHeader>
                <CardTitle>내보내기</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!exported ? (
                  <div className="text-xs text-gray-500 text-center py-2">
                    🎯 시험 자동 인식 버튼을 누르면 자동으로 생성됩니다
                  </div>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={()=>window.dispatchEvent(new CustomEvent('open-right-panel',{ detail: { type: 'pdf-report' } }))}>
                      <FileText className="mr-2" size={16}/> PDF 리포트
                    </Button>
                    <Button variant="outline" className="w-full" onClick={()=>window.dispatchEvent(new CustomEvent('open-right-panel',{ detail: { type: 'wrong-note' } }))}>
                      <FileText className="mr-2" size={16}/> 오답노트
                    </Button>
                    <Button variant="outline" className="w-full" onClick={()=>window.dispatchEvent(new CustomEvent('open-right-panel',{ detail: { type: 'supplementary-quiz' } }))}>
                      <FileText className="mr-2" size={16}/> 보충문제
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        <TabsContent value="chatbot" className="p-0">
          {/* AI 코치 인포그래픽 */}
          <div className="w-full mb-4">
            <img 
              src="img/ai-llm-chatbot-infographic.svg" 
              alt="AI 코치" 
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
          <div className="w-full mb-4 text-xs text-gray-600 bg-white border rounded-md p-3">
            <div><b>대상</b>: 세션(과목/분야)별 자료 업로드·관리</div>
            <div className="mt-1"><b>목적</b>: 업로드 자료 기반 질의응답·요약·퀴즈·노트/파일 생성·지식 업데이트·트래킹</div>
            {improvementNote && (
              <div className="mt-1 text-[11px] text-emerald-700">최근 변화: 정답률 {improvementNote.before}% → {improvementNote.after}% (Δ {improvementNote.delta}p)</div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4 items-stretch">
            {/* 좌측 컬럼: 분야 리스트 */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <Card className="h-[420px]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2"><Folder size={14}/> 세션</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={()=>{
                        const tag = prompt('카테고리를 선택하세요 (근력/유산소, 토익 RC/LC, 영어 회화, study)', '근력/유산소')
                        if (!tag) return
                        const name = prompt('Todo 항목을 입력하세요 (예: 실전 어휘 체크)', '새로운 Todo')
                        if (!name) return
                        setDomains(prev => [...prev, { id: `dom-${Date.now()}`, name, tag, progress: 0 }])
                      }}>직접 추가</Button>
                      <Button variant="outline" size="sm" onClick={()=>{
                        // Todo 체크리스트에서 불러오기 모달 표시
                        setShowTodoImportModal(true)
                      }}>Todo에서 불러오기</Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm h-[360px] overflow-y-auto">
                  <ul className="space-y-2">
                    {domains.map(d => (
                      <li key={d.id} className="flex items-center justify-between border rounded-md px-3 py-2 hover:bg-gray-50">
                        <button className="flex-1 text-left" onClick={()=> setMessagesInChatFromDomain(d)}>
                          <div className="font-medium">{d.name}</div>
                          <div className="text-[11px] text-gray-500">{d.tag}</div>
                        </button>
                        <button className="ml-2 text-gray-500 hover:text-rose-600" title="삭제" onClick={()=> setDomains(prev=> prev.filter(x=>x.id!==d.id))}>
                          <Trash2 size={14}/>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <div className="text-[12px] text-gray-600 mb-1">첨부된 파일</div>
                    <ul className="list-disc list-inside">
                      {(evidences.length? evidences : [
                        {name: '(AI) 0828 요약노트'},
                        {name: '(AI) 0828 리포트'},
                        {name: '(AI) 0828 보완문제'}
                      ]).slice(0,5).map((f,i)=>(<li key={i}>{f.name}</li>))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* 상단: 챗 영역 (고정 높이, 스크롤) */}
            <div className="md:col-span-9 min-h-[260px]">
              <ChatArea Button={Button} warmSuggestion={warmSuggestion} onCreateFile={(name)=>{ setEvidences(prev=>[...prev, { name, ts: Date.now() }]) }} onCompleteMicroCourse={()=> setCourseDone(v=>v+1)} chatContext={chatContext} />
            </div>
            {/* 우측 컬럼 제거: 중앙 9열로 확장 완료 */}
          </div>
        </TabsContent>
      </Tabs>

      {/* AI 인식 로딩바 모달 */}
      {showLoadingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">AI 인식 로딩바</h3>
              <p className="text-gray-600">시험지를 분석하고 있습니다...</p>
            </div>
          </div>
        </div>
      )}

      {/* 시험지 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium mb-4">AI가 인식한 시험지가 맞나요?</h3>
            <div className="space-y-3 mb-6">
              {examOptions.map((option, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="font-medium">{option}</div>
                  {index === 0 && <span className="text-sm text-purple-600">(가장 높은 신뢰도)</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfirmModal(false)
                  setCurrent('scope')
                }}
              >
                맞아요
              </Button>
              <Button 
                onClick={() => {
                  setShowConfirmModal(false)
                  const customName = prompt('시험지 정보를 입력해주세요:')
                  if (customName) {
                    setExamInfo(prev => ({ ...prev, label: customName }))
                    setCurrent('scope')
                  }
                }}
              >
                아니요
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Todo 불러오기 모달 */}
      {showTodoImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Todo 체크리스트에서 세션으로 불러오기</h3>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {/* 근력/유산소 Todo */}
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-gray-800 mb-2">근력/유산소</h4>
                <div className="space-y-2">
                  <button 
                    className="w-full text-left p-2 rounded hover:bg-gray-50 border"
                    onClick={() => {
                      setDomains(prev => [...prev, { 
                        id: `dom-${Date.now()}`, 
                        name: '유산소 30분', 
                        tag: '근력/유산소', 
                        progress: 0 
                      }])
                      setShowTodoImportModal(false)
                    }}
                  >
                    <div className="font-medium">유산소 30분</div>
                    <div className="text-sm text-gray-500">근력/유산소 카테고리</div>
                  </button>
                </div>
              </div>

              {/* 토익 RC/LC Todo */}
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-gray-800 mb-2">토익 RC/LC</h4>
                <div className="space-y-2">
                  <button 
                    className="w-full text-left p-2 rounded hover:bg-gray-50 border"
                    onClick={() => {
                      setDomains(prev => [...prev, { 
                        id: `dom-${Date.now()}`, 
                        name: '실전 어휘 체크', 
                        tag: '토익 RC/LC', 
                        progress: 0 
                      }])
                      setShowTodoImportModal(false)
                    }}
                  >
                    <div className="font-medium">실전 어휘 체크</div>
                    <div className="text-sm text-gray-500">토익 RC/LC 카테고리</div>
                  </button>
                </div>
              </div>

              {/* 영어 회화 Todo */}
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-gray-800 mb-2">영어 회화</h4>
                <div className="space-y-2">
                  <button 
                    className="w-full text-left p-2 rounded hover:bg-gray-50 border"
                    onClick={() => {
                      setDomains(prev => [...prev, { 
                        id: `dom-${Date.now()}`, 
                        name: '일상 회화 연습', 
                        tag: '영어 회화', 
                        progress: 0 
                      }])
                      setShowTodoImportModal(false)
                    }}
                  >
                    <div className="font-medium">일상 회화 연습</div>
                    <div className="text-sm text-gray-500">영어 회화 카테고리</div>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowTodoImportModal(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 진단 세부 내용 모달 */}
      {showDiagnosisDetail && diag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">진단 세부 분석 결과</h3>
                <p className="text-gray-600 text-sm">
                  사용자의 시험지와 필기 내용을 AI가 분석한 상세한 진단 정보입니다. 주요 오답 개념, 문항별 분석, 전체 개념 범위, AI 진단 분석을 확인할 수 있습니다.
                </p>
              </div>
              <button 
                onClick={() => setShowDiagnosisDetail(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* 새로운 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 왼쪽 컬럼 */}
              <div className="space-y-4">
                {/* 주요 오답 개념 */}
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                  <h4 className="font-semibold text-red-800 mb-3 text-lg">주요 오답 개념</h4>
                  <div className="space-y-3">
                    {diag.weakConcepts.map((concept, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-red-800">{concept.name}</span>
                          <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded-full">
                            {concept.count}회 오답
                          </span>
                        </div>
                        <p className="text-sm text-red-700">{concept.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 문항별 상세 분석 */}
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                  <h4 className="font-semibold text-green-800 mb-3 text-lg">문항별 상세 분석</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {diag.mistakes.map((mistake, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border text-sm">
                        <span className="font-medium text-green-800">#{mistake.num}</span>
                        <span className="text-green-700 ml-2">{mistake.text}</span>
                        <div className="text-xs text-green-600 mt-1">{mistake.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 전체 개념 */}
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <h4 className="font-semibold text-blue-800 mb-3 text-lg">전체 개념</h4>
                  <div className="flex flex-wrap gap-2">
                    {diag.coveredConcepts.map((concept, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-medium">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI 진단 분석 */}
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                  <h4 className="font-semibold text-purple-800 mb-3 text-lg">AI 진단 분석</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-purple-700 mb-2">
                        <strong>취약도 분석:</strong> 분수 나눗셈과 속력 공식에서 가장 높은 오답률
                      </div>
                      <div className="text-sm text-purple-700 mb-2">
                        <strong>개선 우선순위:</strong> 역수 개념 → 단위 변환 → 표본공간 이해
                      </div>
                      <div className="text-sm text-purple-700">
                        <strong>예상 학습 시간:</strong> 총 75분 (25분 + 20분 + 30분)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽 컬럼 */}
              <div className="space-y-4">
                {/* 잘못 이해한 부분 */}
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  <div className="mb-3">
                    <h4 className="font-semibold text-yellow-800 text-lg mb-2">잘못 이해한 부분</h4>
                    <p className="text-sm text-yellow-700 bg-yellow-100 px-3 py-2 rounded">
                      AI가 사용자의 필기와 메모를 분석하여 이해하지 못한 개념을 파악했습니다
                    </p>
                  </div>
                  <div className="space-y-3">
                    {diag.handwritingNotes.map((note, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <div className="space-y-2">
                          {/* 개념명과 사용자 필기 */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-yellow-800 mb-1">{note.concept}</div>
                              <div className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                사용자 필기: "{note.userNote}"
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              note.type === 'confusion' ? 'bg-red-100 text-red-600' :
                              note.type === 'difficulty' ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {note.type === 'confusion' ? '혼란' : 
                               note.type === 'difficulty' ? '어려움' : '질문'}
                            </span>
                          </div>
                          
                          {/* AI 분석 */}
                          <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                            <div className="text-sm font-medium text-blue-800 mb-1">AI 분석</div>
                            <div className="text-sm text-blue-700">{note.aiAnalysis}</div>
                          </div>
                          
                          {/* AI 해설 */}
                          <div className="bg-green-50 p-2 rounded border-l-4 border-green-400">
                            <div className="text-sm font-medium text-green-800 mb-1">AI 해설</div>
                            <div className="text-sm text-green-700">{note.aiExplanation}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <Button 
                variant="outline" 
                className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
                onClick={() => {
                  // 오답노트 생성 로직
                  console.log('오답노트 생성')
                  // TODO: 실제 오답노트 생성 기능 구현
                }}
              >
                📝 오답노트 생성
              </Button>
              <Button onClick={() => setShowDiagnosisDetail(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function ChatArea({ Button, warmSuggestion, onCreateFile, onCompleteMicroCourse, chatContext }){
  const [messages, setMessages] = useState([
    {role:'user', text:'📄 업로드된 교재 요약해줘'},
    {role:'assistant', text:'→ 3장: 속력·거리·시간 공식 설명, 예제 2개 추가'}
  ])
  const [text, setText] = useState('')

  useEffect(()=>{
    if (warmSuggestion) {
      setMessages(ms=>[...ms, { role:'assistant', text:`추천: ${warmSuggestion}` }])
    }
  }, [warmSuggestion])

  useEffect(() => {
    if (chatContext) {
      setMessages(ms => [...ms, { role: 'assistant', text: `오늘은 ${chatContext.priority[0]} 주제로 시작해볼까요?` }]);
      setText(''); // Clear input after showing warm suggestion
    }
  }, [chatContext]);

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl shadow p-4" style={{height: 420}}>
      <div className="flex items-center gap-2 mb-3 text-xs">
        <Button variant="outline" onClick={()=>{ const name = `note-${new Date().toISOString().slice(11,19)}.md`; onCreateFile && onCreateFile(name); setMessages(ms=>[...ms,{role:'assistant', text:`파일 생성됨: ${name} (세션 Evidence 반영)`}]) }}>노트 파일 생성</Button>
        <Button variant="outline" onClick={()=>{ onCompleteMicroCourse && onCompleteMicroCourse(); setMessages(ms=>[...ms,{role:'assistant', text:'마이크로 코스 1개 완료로 기록했습니다.'}]) }}>코스 완료 체크</Button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((m,i)=> (
          <div key={i} className={`${m.role==='assistant'?'bg-purple-100':'bg-blue-100 ml-auto'} p-2 rounded-lg max-w-md`}>{m.text}</div>
        ))}
      </div>
      <div className="flex mt-4 gap-2">
        <input className="flex-1 border rounded-lg px-3 py-2" placeholder="질문을 입력하세요" value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter' && text.trim()){ setMessages(ms=>[...ms,{role:'user',text:text.trim()},{role:'assistant', text:'(데모) 근거를 바탕으로 답변을 생성했습니다.'}]); setText('') } }} />
        <Button onClick={()=>{ if(!text.trim()) return; setMessages(ms=>[...ms,{role:'user',text:text.trim()},{role:'assistant', text:'(데모) 근거를 바탕으로 답변을 생성했습니다.'}]); setText('') }}>
          <Brain className="mr-2" size={16}/> 보내기
        </Button>
      </div>
    </div>
  )
}



