import React, { useEffect, useMemo, useRef, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Upload, CheckCircle2, AlertTriangle, FileText, BarChart2, Brain, Folder, Trash2 } from 'lucide-react'

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
  await sleep(700)
  return {
    label: '수능수학',
    confidence: 0.86,
    decision: 'auto',
    scope: ['확률과통계','수학Ⅱ'],
    alternatives: [
      { label: '공무원(국가직)', confidence: 0.61 },
      { label: 'SQLD', confidence: 0.34 }
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
    accuracy: 65,
    weakConcepts: ['분수 나눗셈','속력 공식','확률 기초','도형의 성질','비와 비율'],
    mistakes: [
      {num:5, text:'분수 나눗셈'},
      {num:8, text:'속력 vs 시간 혼동'},
      {num:11, text:'확률 계산 오류'}
    ]
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
  handoff:  { tip:'이제 챗봇으로 넘어가 세부 질문/업데이트를 진행합니다.', cta:'LLM 챗봇으로 이동' },
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
  const [domains, setDomains] = useState([
    { id: 'toeic', name: '토익 RC/LC', tag: 'study', progress: 0 },
    { id: 'speaking', name: '영어 회화', tag: 'study', progress: 0 },
    { id: 'workout', name: '근력/유산소', tag: 'workout', progress: 0 },
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
        const r = await apiIdentifyExam()
        setExamInfo(r)
        log(`시험 자동 인식: ${r.label} (신뢰도 ${Math.round(r.confidence*100)}%)`)
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
        log('LLM 챗봇으로 이동')
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
    setWarmSuggestion(`${dom.name} 학습을 시작합니다. 10~15분 코스를 제안할게요.`)
    setTab('chatbot')
  }

  const sendToChatbot = () => {
    if (!diag) return
    const top = (diag.weakConcepts || []).slice(0, 2)
    const plan = coach?.plan || []
    const first = plan[0]?.title || (top[0] || '핵심 개념')
    const firstTime = plan[0]?.time || '15분'
    setChatContext({ weakConcepts: diag.weakConcepts, priority: top, plan })
    setWarmSuggestion(`오늘은 ${first}(${firstTime})부터 시작해볼까요?`)
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
          <TabsTrigger value="chatbot">LLM 챗봇</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="p-0">
          <div className="mb-3 text-xs text-gray-600 bg-white border rounded-md p-3">
            <div><b>대상</b>: 시험지(모의고사 포함)·필기 이미지/PDF/텍스트</div>
            <div className="mt-1"><b>목적</b>: OCR → 채점/메모 분석 → 개념 정렬 → 개인화 추천/코스 파일 생성</div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-4 gap-y-4 items-stretch">
            {/* 좌: 업로드 */}
            <Card className="col-span-1 h-full min-h-[260px]">
              <CardHeader>
                <CardTitle>업로드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.md" multiple onChange={onFiles} style={{display:'none'}} />
                <Button variant="outline" onClick={requestUpload}>
                  <Upload className="mr-2" size={16}/> PDF/이미지 업로드
                </Button>
                <div className="text-[11px] text-gray-500">텍스트(.txt/.md)도 업로드 가능해요.</div>
                <div className="text-xs text-gray-600">최근 업로드</div>
                <ul className="text-xs text-gray-700 list-disc list-inside">
                  {(uploaded.length? uploaded : [
                    {name:'2025-08-20 중간고사.pdf'},
                    {name:'모의고사_07.png'},
                  ]).slice(0,5).map((f,i)=>(
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 중앙: 2x2 컨테이너 */}
            <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
              {/* 인식 */}
              <Card className="min-h-[260px]">
                <CardHeader>
                  <CardTitle>시험 자동 인식</CardTitle>
                </CardHeader>
                <CardContent>
                  {!examInfo && <div className="text-sm text-gray-500">업로드 후 자동 판별됩니다.</div>}
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
                  <div className="mt-3"><Button variant="outline" size="sm" title="헤더/로고/형식 등을 바탕으로 자동 판별" onClick={async()=>{ await runStep('identify'); setCurrent('scope') }}>자동 인식 결과 확인</Button></div>
                </CardContent>
              </Card>

              {/* 진단 */}
              <Card className="min-h-[260px]">
                <CardHeader>
                  <CardTitle>진단 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  {!diag && <div className="text-sm text-gray-500">OCR 처리 후 자동 분석됩니다.</div>}
                  {diag && (
                    <div className="space-y-2">
                      <div>점수: <b>{diag.score}점</b></div>
                      <div className="text-sm">평균 정답률: {diag.accuracy}%</div>
                      <Progress value={diag.accuracy}/>
                    </div>
                  )}
                  <div className="mt-3"><Button size="sm" title="OCR 완료 후 점수/정답률/취약개념 계산" onClick={async()=>{ if(!ocrInfo){ await runStep('scope'); await runStep('ocr'); } await runStep('diagnose') }}>진단 실행</Button></div>
                </CardContent>
              </Card>

              {/* 개념 맵 & Heatmap (중앙 하단) */}
              <Card className="min-h-[260px]">
                <CardHeader>
                  <CardTitle>세그먼트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-600 mb-2">제목 · 카테고리 · 분량(분) · 완료</div>
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-12 px-3 py-2 text-sm border-b bg-gray-50">
                      <div className="col-span-5">RC 문장 구조 & 어휘</div>
                      <div className="col-span-3">기타</div>
                      <div className="col-span-2">5</div>
                      <div className="col-span-2 text-rose-600">미완</div>
                    </div>
                    <div className="grid grid-cols-12 px-3 py-2 text-sm border-b">
                      <div className="col-span-5">LC Part 2 응답 패턴</div>
                      <div className="col-span-3">기타</div>
                      <div className="col-span-2">5</div>
                      <div className="col-span-2 text-rose-600">미완</div>
                    </div>
                    <div className="grid grid-cols-12 px-3 py-2 text-sm border-b">
                      <div className="col-span-5">실전 모의 RC 20문</div>
                      <div className="col-span-3">관계사</div>
                      <div className="col-span-2">5</div>
                      <div className="col-span-2 text-rose-600">미완</div>
                    </div>
                    <div className="grid grid-cols-12 px-3 py-2 text-sm">
                      <div className="col-span-5">실전 모의 LC 15문</div>
                      <div className="col-span-3">기타</div>
                      <div className="col-span-2">5</div>
                      <div className="col-span-2 text-rose-600">미완</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 코칭 */}
              <Card className="min-h-[260px]">
                <CardHeader>
                  <CardTitle>코칭 제안</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!coach && <div className="text-sm text-gray-500">진단 완료 후 플랜이 생성됩니다.</div>}
                  {coach && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">범위: {coach.scope?.join(', ')}</div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {coach.plan.map((p,idx)=> (
                          <div key={idx} className="p-3 rounded-xl border bg-white">
                            <div className="font-medium">{p.title}</div>
                            <div className="text-xs text-gray-600">소요 {p.time}</div>
                            <div className="text-sm mt-1">{p.details}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button onClick={async()=>{ await runStep('coach') }} title="취약 개념 보완 코스 구성">코칭 플랜 생성</Button>
                    <Button variant="outline" onClick={async()=>{ await runStep('coach'); await runStep('export'); setCurrent('handoff') }} title="PDF/요약노트/보완문제 생성">파일 생성</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 우: 내보내기 */}
            <Card className="col-span-1 h-full min-h-[260px]">
              <CardHeader>
                <CardTitle>내보내기</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" onClick={()=>window.dispatchEvent(new CustomEvent('open-right-panel',{ detail: { type: 'pdf' } }))}><FileText className="mr-2" size={16}/> PDF</Button>
                <Button variant="outline" className="w-full" onClick={()=>window.dispatchEvent(new CustomEvent('open-right-panel',{ detail: { type: 'report' } }))}>리포트</Button>
                <Button variant="outline" className="w-full" onClick={()=>window.dispatchEvent(new CustomEvent('open-right-panel',{ detail: { type: 'wrong-note' } }))}>오답노트</Button>
                <Button variant="outline" className="w-full" onClick={()=>window.dispatchEvent(new CustomEvent('open-right-panel',{ detail: { type: 'quiz-set' } }))}>보완문제</Button>
              </CardContent>
            </Card>
          </div>

          {/* 하단 액션 바: LLM 챗봇으로 보내기 */}
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={sendToChatbot} title="취약개념/우선순위/코칭 플랜을 챗봇 세션으로 전송">LLM 챗봇으로 보내기</Button>
          </div>
        </TabsContent>

        <TabsContent value="chatbot" className="p-0">
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
                    <Button variant="outline" size="sm" onClick={()=>{
                      const name = prompt('세션 이름을 입력하세요 (예: 토익 RC/LC)')
                      if (!name) return
                      const tag = prompt('태그를 입력하세요 (study/workout 등)', 'study') || 'study'
                      setDomains(prev => [...prev, { id: `dom-${Date.now()}`, name, tag, progress: 0 }])
                    }}>추가</Button>
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
          <div key={i} className={`${m.role==='assistant'?'bg-purple-100 ml-auto':'bg-gray-100'} p-2 rounded-lg max-w-md`}>{m.text}</div>
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


