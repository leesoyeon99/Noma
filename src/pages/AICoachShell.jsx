import React, { useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Brain, Sparkles, ClipboardList, MessageSquareText, Compass, BarChart3, Upload, Image as ImageIcon, Loader2, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AgentNomaPanel from '../components/AgentNomaPanel'
import AICoachRag, { createDefaultMaterial } from './AICoachRag'
import AICoachFilesTrackingChat from './AICoachFilesTrackingChat'

function DiagnoseCoach({ onUpdate }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(null)
  const inputRef = useRef(null)

  const SAMPLE = [
    { id: 'q1', number: 5, prompt: '동사 시제 일치 (현재완료 vs 과거)', userAnswer: 'went', correctAnswer: 'has gone', status: 'wrong', concepts: ['시제','현재완료','일치'], note: 'since 존재' },
    { id: 'q2', number: 8, prompt: '부정사 vs 동명사 (목적어 형태)', userAnswer: 'to study', correctAnswer: 'studying', status: 'wrong', concepts: ['부정사','동명사','목적어'], note: '목적어 형태 혼동' },
    { id: 'q3', number: 12, prompt: '관계대명사 that/which 선택', userAnswer: 'which', correctAnswer: 'that', status: 'confused', concepts: ['관계대명사'], note: '선택지 혼동' },
  ]

  const aggregate = useMemo(() => {
    const map = new Map()
    ;(analyzed || []).forEach(q => {
      (q.concepts||[]).forEach(c => {
        const v = map.get(c) || { concept:c, wrong:0, confused:0 }
        if (q.status==='wrong') v.wrong += 1
        if (q.status==='confused') v.confused += 1
        map.set(c, v)
      })
    })
    return Array.from(map.values()).sort((a,b)=> (b.wrong+b.confused)-(a.wrong+a.confused))
  }, [analyzed])

  const suggestions = useMemo(()=>{
    if (!aggregate.length) return []
    const top = aggregate.slice(0,3)
    return top.map((w,i)=>({ id:'s'+(i+1), text:`${w.concept} 보강을 위해 오늘 20분 연습 세션을 추가하세요`, reason:`오답 ${w.wrong} · 헷갈림 ${w.confused}` }))
  }, [aggregate])

  const onPick = () => inputRef.current && inputRef.current.click()
  const onFile = f => {
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(String(reader.result))
    reader.readAsDataURL(f)
  }

  const handleAnalyze = async () => {
    if (!file && !notes.trim()) { alert('사진 업로드 또는 메모 입력이 필요합니다.'); return }
    setLoading(true)
    await new Promise(r=>setTimeout(r,900))
    let result = [...SAMPLE]
    if (notes.toLowerCase().includes('시제')) {
      result = result.map(q => (q.concepts.includes('시제') && q.status!=='wrong') ? { ...q, status:'confused' } : q)
    }
    setAnalyzed(result)
    setLoading(false)
    onUpdate && onUpdate({ analyzed: result, aggregate, suggestions })
  }

  return (
    <div className="ai-grid">
      <Card>
        <CardHeader>
          <CardTitle style={{display:'flex',alignItems:'center',gap:6}}><Brain size={16}/> 시험지·노트 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{display:'flex', gap:8, marginBottom:8}}>
            <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={(e)=>onFile(e.target.files?.[0]||undefined)} />
            <button className="btn" onClick={onPick}><Upload size={14}/> 사진 업로드</button>
            <button className="btn" onClick={()=>{setFile(null);setPreview(null);setNotes('시제, 관계대명사 헷갈림')}}><FileText size={14}/> 샘플 메모</button>
          </div>
          <div className="ai-two-col">
            <div className="ai-preview">
              {preview ? (<img src={preview} alt="preview" style={{maxHeight:220, objectFit:'contain', borderRadius:8}} />) : (
                <div className="small" style={{textAlign:'center'}}><ImageIcon size={24} style={{display:'block',margin:'0 auto 8px'}}/>업로드한 사진 미리보기</div>
              )}
            </div>
            <div>
              <div className="small" style={{fontWeight:600, marginBottom:6}}>필기/메모 (선택)</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={8} className="input" style={{width:'100%'}} placeholder="예: '시제?' 표시가 많고, 관계대명사 자주 혼동" />
            </div>
          </div>
          <div style={{display:'flex', justifyContent:'flex-end', marginTop:10}}>
            <button className="btn btn-dark" onClick={handleAnalyze}>{loading ? <Loader2 size={14} className="spin"/> : <Sparkles size={14}/>} {loading ? '분석 중...' : 'AI로 분석하기'}</button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{display:'flex',alignItems:'center',gap:6}}><Sparkles size={16}/> 결과</CardTitle>
        </CardHeader>
        <CardContent>
          {!analyzed ? (
            <div className="small">왼쪽에서 분석을 실행하면 결과가 여기에 표시됩니다.</div>
          ) : (
            <div className="table-like">
              <div className="t-head"><div>문항</div><div>상태</div><div>개념</div><div>정답/내답</div><div>메모</div></div>
              {(analyzed||[]).map(q=> (
                <div key={q.id} className="t-row">
                  <div className="t-cell name">#{q.number} {q.prompt}</div>
                  <div className="t-cell">
                    {q.status==='wrong' && (<span style={{color:'#dc2626', display:'inline-flex',alignItems:'center',gap:6}}><AlertTriangle size={14}/>오답</span>)}
                    {q.status==='confused' && (<span style={{color:'#d97706', display:'inline-flex',alignItems:'center',gap:6}}><AlertTriangle size={14}/>헷갈림</span>)}
                    {q.status==='correct' && (<span style={{color:'#16a34a', display:'inline-flex',alignItems:'center',gap:6}}><CheckCircle2 size={14}/>정답</span>)}
                  </div>
                  <div className="t-cell">{(q.concepts||[]).join(', ')}</div>
                  <div className="t-cell">{q.correctAnswer} / {q.userAnswer}</div>
                  <div className="t-cell">{q.note}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AICoachShell(){
  const [session, setSession] = useState('toeic') // 'toeic' | 'workout'
  const [tab, setTab] = useState('diagnose') // 'overview' | 'diagnose' | 'coach' | 'plan' | 'insights'
  const [insights, setInsights] = useState({ aggregate: [], suggestions: [] })
  const [showAgent, setShowAgent] = useState(false)
  const [sessions, setSessions] = useState({
    toeic: {
      title: '토익 800+ 목표',
      goal: '10월 모의고사까지 RC/LC 약점 보완',
      deadline: '2025-10-15',
    },
    workout: {
      title: '주 3회 근력 + 유산소',
      goal: '벤치 1RM 80kg, 체지방 -3%',
      deadline: '2025-11-30',
    },
  })
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formGoal, setFormGoal] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [materialsBySession, setMaterialsBySession] = useState({
    toeic: createDefaultMaterial(),
    workout: createDefaultMaterial(),
  })
  const sessionLabel = session==='toeic' ? '토익' : '운동'

  const handleUpdate = ({ aggregate, suggestions }) => {
    setInsights({ aggregate: aggregate || [], suggestions: suggestions || [] })
  }

  const openSessionModal = () => {
    const cur = sessions[session] || { title:'', goal:'', deadline:'' }
    setFormTitle(cur.title)
    setFormGoal(cur.goal)
    setFormDeadline(cur.deadline)
    setShowSessionModal(true)
  }

  const saveSession = () => {
    setSessions(prev => ({
      ...prev,
      [session]: { title: formTitle, goal: formGoal, deadline: formDeadline },
    }))
    setShowSessionModal(false)
  }

  // 해시로 탭 전환 지원 (#files 등)
  React.useEffect(()=>{
    const onHash = () => {
      const h = window.location.hash
      if (h === '#files') setTab('files')
      if (h === '#diagnose') setTab('diagnose')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      {/* 상단 세션 선택 + 탭 네비 */}
      <div className="card mb-3">
        <div className="card-content">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div>
              <div className="title" style={{fontSize:16}}>{sessions[session]?.title}</div>
              <div className="small">목표: {sessions[session]?.goal} · 마감: {sessions[session]?.deadline}</div>
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <button className={session==='toeic'? 'btn btn-dark':'btn'} onClick={()=>setSession('toeic')}>토익</button>
              <button className={session==='workout'? 'btn btn-dark':'btn'} onClick={()=>setSession('workout')}>운동</button>
              <button className="btn" onClick={openSessionModal}>세션 설정</button>
            </div>
          </div>
          <div className="tabs tabs-inline" style={{marginTop:12}}>
            <div className={tab==='overview'?'tab-btn active':'tab-btn'} onClick={()=>setTab('overview')}><Compass size={14} style={{verticalAlign:'middle'}}/> Overview</div>
            <div className={tab==='diagnose'?'tab-btn active':'tab-btn'} onClick={()=>setTab('diagnose')}><ClipboardList size={14} style={{verticalAlign:'middle'}}/> Diagnose</div>
            <div className={tab==='coach'?'tab-btn active':'tab-btn'} onClick={()=>setTab('coach')}><MessageSquareText size={14} style={{verticalAlign:'middle'}}/> Coach</div>
            <div className={tab==='plan'?'tab-btn active':'tab-btn'} onClick={()=>setTab('plan')}><Sparkles size={14} style={{verticalAlign:'middle'}}/> Plan</div>
            <div className={tab==='insights'?'tab-btn active':'tab-btn'} onClick={()=>setTab('insights')}><BarChart3 size={14} style={{verticalAlign:'middle'}}/> Insights</div>
          </div>
        </div>
      </div>

      {tab==='overview' && (
        <Card>
          <CardContent>
            <div className="small">세션: {sessionLabel}. 탭을 이동하여 진단, 코칭, 계획, 인사이트를 확인하세요.</div>
          </CardContent>
        </Card>
      )}

      {tab==='diagnose' && (
        <DiagnoseCoach onUpdate={handleUpdate} />
      )}

      {tab==='coach' && (
        <Card>
          <CardHeader>
            <CardTitle>코칭</CardTitle>
          </CardHeader>
          <CardContent>
            <CoachPanel session={session} suggestions={insights.suggestions} />
          </CardContent>
        </Card>
      )}

      {tab==='plan' && (
        <Card>
          <CardHeader>
            <CardTitle>계획 · 루틴 생성</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <button className="btn btn-dark" onClick={()=>setShowAgent(true)}><Sparkles size={14}/> Agent 열기</button>
            </div>
            <AnimatePresence>
              {showAgent && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                  <AgentNomaPanel onClose={()=>setShowAgent(false)} onAccept={()=>setShowAgent(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {tab==='insights' && (
        <Card>
          <CardHeader>
            <CardTitle>취약 개념 요약</CardTitle>
          </CardHeader>
          <CardContent>
            {(!insights.aggregate || insights.aggregate.length===0) ? (
              <div className="small" style={{display:'flex',alignItems:'center',gap:8}}>
                진단 결과가 필요합니다. Diagnose 탭에서 분석을 먼저 실행하세요.
                <button className="btn btn-dark" onClick={()=>{
                  const exampleAgg = [
                    { concept:'시제', wrong:3, confused:2 },
                    { concept:'관계대명사', wrong:1, confused:3 },
                    { concept:'어휘(collocation)', wrong:2, confused:1 },
                  ]
                  const exampleSug = [
                    { text:'RC 속독 복습 20분' },
                    { text:'LC 파트별 10분 미니테스트' },
                    { text:'문장 구조 분석 15분' },
                  ]
                  setInsights({ aggregate: exampleAgg, suggestions: exampleSug })
                }}>분석결과</button>
              </div>
            ) : (
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                {insights.aggregate.slice(0,8).map((r,idx)=> (
                  <div key={idx} className="chip">{r.concept} · 오답 {r.wrong} · 헷갈림 {r.confused}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}


      <AnimatePresence>
        {showSessionModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'fixed', inset:0, background:'rgba(0,0,0,.3)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:70}}>
            <div className="card" style={{width:420}}>
              <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div className="card-title">세션 설정</div>
                <button className="btn" onClick={()=>setShowSessionModal(false)}>닫기</button>
              </div>
              <div className="card-content">
                <div className="mb-3">
                  <div className="small" style={{marginBottom:6}}>제목</div>
                  <input className="input" value={formTitle} onChange={e=>setFormTitle(e.target.value)} placeholder="세션 제목" />
                </div>
                <div className="mb-3">
                  <div className="small" style={{marginBottom:6}}>목표</div>
                  <input className="input" value={formGoal} onChange={e=>setFormGoal(e.target.value)} placeholder="예: 10월 모의고사까지 RC/LC 약점 보완" />
                </div>
                <div className="mb-3">
                  <div className="small" style={{marginBottom:6}}>마감일 (YYYY-MM-DD)</div>
                  <input className="input" value={formDeadline} onChange={e=>setFormDeadline(e.target.value)} placeholder="예: 2025-10-15" />
                </div>
                <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                  <button className="btn" onClick={()=>setShowSessionModal(false)}>취소</button>
                  <button className="btn btn-dark" onClick={saveSession}>저장</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CoachPanel({ session, suggestions }){
  const [tone, setTone] = useState('encouraging')
  const [format, setFormat] = useState('checklist')
  const headline = session==='toeic' ? '영어 학습 코칭' : '운동 루틴 코칭'

  const sampleText = useMemo(()=>{
    const base = tone==='encouraging' ? '좋아요! 어제보다 한 걸음 나아가고 있어요.' : '목표에 비해 부족합니다. 지금 바로 보강하세요.'
    if (format==='checklist') {
      const items = (suggestions && suggestions.length ? suggestions : [
        {text: session==='toeic' ? 'LC 파트별 10분 미니테스트' : '유산소 20분'},
        {text: session==='toeic' ? 'RC 속독 복습 20분' : '스트레칭 10분'}
      ]).map(s=>`- ${s.text}`)
      return [base, ...items].join('\n')
    }
    return base + ' 핵심 1-2개 활동에 집중하세요.'
  }, [tone, format, suggestions, session])

  return (
    <div>
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        <select className="input" value={tone} onChange={e=>setTone(e.target.value)} style={{maxWidth:180}}>
          <option value="encouraging">톤: encouraging</option>
          <option value="strict">톤: strict</option>
        </select>
        <select className="input" value={format} onChange={e=>setFormat(e.target.value)} style={{maxWidth:180}}>
          <option value="checklist">형식: checklist</option>
          <option value="paragraph">형식: paragraph</option>
        </select>
      </div>
      <pre style={{whiteSpace:'pre-wrap', fontFamily:'inherit', background:'#f8fafc', padding:12, borderRadius:8, border:'1px solid #e2e8f0'}}>{sampleText}</pre>
    </div>
  )
}


