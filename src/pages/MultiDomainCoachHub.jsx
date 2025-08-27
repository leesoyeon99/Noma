import React, { useMemo, useRef, useState, useEffect } from 'react'
import { FolderOpen, Plus, Trash2, Upload, Database, BookOpen, BarChart3, MessageCircle, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart as RLineChart, Line } from 'recharts'

// -------- Utils --------
const SAMPLE_TEXT = `# Gerunds and Infinitives\nGerunds (-ing forms) function as nouns; infinitives (to + verb) often mark purpose or preference.\nPatterns: enjoy -ing, avoid -ing, decide to, plan to.\nEdge: remember to do vs remember doing.\n\n# Tenses\nPresent perfect: has/have + p.p.; with since/for, just/already/yet.\nVs simple past: time reference and relevance.\n\n# Relative Clauses\nThat/which: restrictive vs non-restrictive; tests prefer that in restrictive without commas.`

// Domain-tailored default texts
const TOEIC_TEXT = `# RC 문장 구조 & 어휘
파트5·6 핵심 문장 구조와 품사 판별, 빈출 어휘/동사구 정리

# LC Part 2 응답 패턴
의문사/부정문/제안 응답 패턴과 함정 유형(연음/유사발음)

# 실전 모의 RC 20문
오답 포인트 기록: 접속사/전치사, 수동태, 관계대명사

# 실전 모의 LC 15문
오답 포인트 기록: 숫자/시간, 장소/직책, 의문사 혼동`

const CONVO_TEXT = `# 패턴 1: 제안/권유
Why don't we ~ / How about ~ / Let's ~ 패턴으로 10문장 생성·암기

# 패턴 2: 요청/도움
Could you ~ / Do you mind ~ / Would it be possible to ~

# 데일리 스몰톡 주제
날씨/점심/주말 계획/취미 3문장씩 말하기

# 롤플레이
카페 주문 / 길 묻기 / 병원 예약`

const WORKOUT_TEXT = `# 주간 루틴(근력)
월 하체(스쿼트·런지·레그프레스) / 화 상체(벤치·로우·풀업 보조)
목 전신(버피·푸시업·플랭크) / 금 코어(크런치·레그레이즈·러시안트위스트)

# 유산소
수 수영 30분 / 토 가벼운 러닝 30분 + 스트레칭

# 식단 기본
아침 현미+계란+토마토 / 점심 잡곡+닭가슴살+샐러드 / 저녁 귀리밥+연어+시금치`

function makeDefaultMaterialForDomain(dom){
  const name = (dom?.name || '').toLowerCase()
  if (name.includes('토익') || name.includes('rc') || name.includes('lc')) {
    return { id: uid('mat'), name: '토익_RC-LC.txt', text: TOEIC_TEXT, segments: parseTextToSegments(TOEIC_TEXT) }
  }
  if (name.includes('회화')) {
    return { id: uid('mat'), name: '영어_회화.txt', text: CONVO_TEXT, segments: parseTextToSegments(CONVO_TEXT) }
  }
  if (name.includes('근력') || name.includes('유산소')) {
    return { id: uid('mat'), name: '근력_유산소_루틴.txt', text: WORKOUT_TEXT, segments: parseTextToSegments(WORKOUT_TEXT) }
  }
  return { id: uid('mat'), name: '샘플 교재.txt', text: SAMPLE_TEXT, segments: parseTextToSegments(SAMPLE_TEXT) }
}
const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`

function parseTextToSegments(text) {
  const parts = text
    .split(/\n(?=#|\d+\.|\*|\-|\+\s)/g)
    .map((s) => s.trim())
    .filter(Boolean)
  const segs = parts.map((p, i) => {
    const title = p.split('\n')[0].replace(/^#+\s*/, '').slice(0, 80) || `섹션 ${i + 1}`
    const length = Math.max(5, Math.round((p.length / 900) * 10))
    const cat = /gerund|동명사|infinitive|부정사/i.test(p)
      ? '부정사·동명사'
      : /tense|시제|perfect/i.test(p)
      ? '시제'
      : /relative|관계대명사|that|which/i.test(p)
      ? '관계사'
      : '기타'
    return { id: uid('seg'), title, length, completed: false, category: cat }
  })
  return segs.length
    ? segs
    : [
        {
          id: uid('seg'),
          title: '전체 요약',
          length: Math.max(10, Math.round((text.length / 900) * 10)),
          completed: false,
          category: '기타',
        },
      ]
}

function rankChunks(question, text) {
  const chunks = text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const qTerms = question.toLowerCase().split(/[^a-z가-힣0-9]+/).filter((w) => w.length > 1)
  const scored = chunks.map((c, idx) => ({
    idx,
    text: c,
    score: qTerms.reduce((a, t) => a + (c.toLowerCase().includes(t) ? 1 : 0), 0) + Math.min(2, c.length / 200),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 5)
}

function useChartsData(material) {
  return useMemo(() => {
    if (!material) return { summary: null, byCategory: [], line: [] }
    const total = material.segments.reduce((s, x) => s + x.length, 0)
    const done = material.segments.filter((s) => s.completed).reduce((s, x) => s + x.length, 0)
    const summary = { total, done, rate: total ? Math.round((done / total) * 100) : 0 }
    const catMap = new Map()
    material.segments.forEach((s) => {
      const k = s.category || '기타'
      const v = catMap.get(k) || { cat: k, total: 0, done: 0 }
      v.total += s.length
      if (s.completed) v.done += s.length
      catMap.set(k, v)
    })
    const byCategory = Array.from(catMap.values()).map((r) => ({ ...r, remain: Math.max(0, r.total - r.done) }))
    const days = new Map()
    material.segments.forEach((s) => {
      if (s.completed && s.doneAt) {
        const d = new Date(s.doneAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        days.set(key, (days.get(key) || 0) + s.length)
      }
    })
    const line = Array.from(days.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, minutes]) => ({ date, minutes }))
    return { summary, byCategory, line }
  }, [material])
}

// -------- Pane (Library / Tracker / Chat) --------
function AICoachPane({ material, setMaterial, goal, setGoal, qa, setQa, attachments, setAttachments }) {
  const [activeTab, setActiveTab] = useState('Tracker') // 'Library' | 'Tracker' | 'Chat'
  const [pending, setPending] = useState(false)
  const fileRef = useRef(null)
  const charts = useChartsData(material)
  const summary = charts.summary
  const remain = summary ? Math.max(0, summary.total - summary.done) : 0
  const daysLeft = useMemo(() => {
    if (!goal?.deadline) return undefined
    const now = new Date()
    const end = new Date(goal.deadline + 'T00:00:00')
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24))
  }, [goal?.deadline])
  const dailyTarget = summary && daysLeft && daysLeft > 0 ? Math.ceil(remain / daysLeft) : undefined

  const handleUpload = (f) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setMaterial({ ...material, name: f.name, text, segments: parseTextToSegments(text) })
    }
    reader.readAsText(f)
  }

  // image attachments (for InBody, 식단표 등)
  const imgInputRef = useRef(null)
  const [previewSrc, setPreviewSrc] = useState(null)
  const addImage = (f) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : ''
      setAttachments((prev) => ([...(prev || []), { id: uid('att'), name: f.name, url }]))
    }
    reader.readAsDataURL(f)
  }

  const markComplete = (segId, done) => {
    setMaterial({
      ...material,
      segments: material.segments.map((s) => (s.id === segId ? { ...s, completed: done, doneAt: done ? Date.now() : undefined } : s)),
    })
  }

  const ask = async (question) => {
    setQa((prev) => [...prev, { id: uid('qa'), role: 'user', text: question }])
    setPending(true)
    await new Promise((r) => setTimeout(r, 450))
    const top = rankChunks(question, material.text)
    const strong = top.filter((t) => t.score >= 2)
    if (strong.length === 0) {
      setQa((prev) => [...prev, { id: uid('qa'), role: 'assistant', text: '자료에서 답변 근거를 찾지 못했습니다. 관련 텍스트를 업로드해 주세요.' }])
      setPending(false)
      return
    }
    const bullets = strong.slice(0, 3).map((s) => `• ${s.text}`)
    const answer = [`질문 요지: ${question}`, '핵심 근거:', ...bullets].join('\n')
    setQa((prev) => [...prev, { id: uid('qa'), role: 'assistant', text: answer, citations: strong.slice(0, 3) }])
    setPending(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><BookOpen className="w-5 h-5"/><div className="text-lg font-semibold">파일 기반 학습 트래킹 & 챗봇</div></div>
          <div className="flex gap-2 text-sm">
            <button onClick={() => setActiveTab('Library')} className={`px-3 py-2 rounded-xl border ${activeTab === 'Library' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}><Database className="w-4 h-4 mr-1 inline"/>Library</button>
            <button onClick={() => setActiveTab('Tracker')} className={`px-3 py-2 rounded-xl border ${activeTab === 'Tracker' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}><BarChart3 className="w-4 h-4 mr-1 inline"/>Tracker</button>
            <button onClick={() => setActiveTab('Chat')} className={`px-3 py-2 rounded-xl border ${activeTab === 'Chat' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}><MessageCircle className="w-4 h-4 mr-1 inline"/>Chat</button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-600">학습 목표</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2" value={goal?.description || ''} onChange={(e) => setGoal({ ...goal, description: e.target.value })} placeholder="예: 교재 100% 완주"/>
          </div>
          <div>
            <label className="text-xs text-slate-600">마감일</label>
            <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2" value={goal?.deadline || ''} onChange={(e) => setGoal({ ...goal, deadline: e.target.value })}/>
          </div>
          <div className="flex items-end">
            {summary && (
              <div className="w-full text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">진행률 <b>{summary.rate}%</b> · 남은 {Math.max(0, summary.total - summary.done)}분 {dailyTarget !== undefined && <span>· 일일 {dailyTarget}분</span>}</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {activeTab === 'Library' && (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4 border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3"><Database className="w-4 h-4"/><div className="font-medium">자료 업로드</div></div>
              <input ref={fileRef} type="file" accept=".txt,.md,.csv,.json" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0] || undefined)}/>
              <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-xl border inline-flex items-center gap-2 hover:bg-slate-50"><Upload className="w-4 h-4"/>파일 선택</button>
              <div className="mt-3 text-xs text-slate-600">텍스트/마크다운 기반 데모 (PDF는 추후 OCR 연동)</div>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 text-sm"><div className="font-medium">현재 자료</div><div className="text-slate-700">{material.name}</div><div className="text-slate-600">세그먼트 {material.segments.length}개</div></div>

              <div className="mt-4">
                <div className="font-medium mb-2">첨부 이미지(인바디/식단표 등)</div>
                <div className="mb-2">
                  <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e)=>addImage(e.target.files?.[0]||undefined)} />
                  <button onClick={()=>imgInputRef.current?.click()} className="btn">이미지 추가</button>
                </div>
                <div className="grid" style={{gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:8}}>
                  {(attachments||[]).map(att => (
                    <div key={att.id} className="border rounded-lg p-2 bg-white">
                      <img src={att.url} alt={att.name} style={{width:'100%', height:100, objectFit:'cover', borderRadius:6, cursor:'pointer'}} onClick={()=>setPreviewSrc(att.url)} />
                      <div className="small" style={{marginTop:4, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={att.name}>{att.name}</span>
                        <button className="btn btn-xs" onClick={()=> setAttachments((prev)=> (prev||[]).filter(x=>x.id!==att.id))}>삭제</button>
                      </div>
                    </div>
                  ))}
                  {(!attachments || attachments.length===0) && (
                    <div className="small" style={{color:'#64748b'}}>첨부된 이미지가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4"/><div className="font-medium">세그먼트</div></div>
              <div className="overflow-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="text-left p-2">제목</th><th className="text-left p-2">카테고리</th><th className="text-right p-2">분량(분)</th><th className="text-right p-2">완료</th></tr></thead>
                  <tbody>
                    {material.segments.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-2">{s.title}</td>
                        <td className="p-2">{s.category || '기타'}</td>
                        <td className="p-2 text-right">{s.length}</td>
                        <td className="p-2 text-right">
                          <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={s.completed} onChange={(e) => markComplete(s.id, e.target.checked)}/>
                            {s.completed ? (
                              <span className="text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>완료</span>
                            ) : (
                              <span className="text-slate-500 inline-flex items-center gap-1"><AlertTriangle className="w-4 h-4"/>미완</span>
                            )}
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Tracker' && (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4 border rounded-2xl p-4">
              <div className="font-medium mb-2">진행 요약</div>
              <div className="text-sm text-slate-700">총 {summary?.total ?? 0}분 · 완료 {summary?.done ?? 0}분</div>
              <div className="mt-4" style={{ height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie dataKey="value" data={[{ name: '완료', value: summary?.done ?? 0 }, { name: '남음', value: remain }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                      <Cell fill="#22c55e" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-lg font-semibold">{summary?.rate ?? 0}%</div>
            </div>
            <div className="lg:col-span-8 border rounded-2xl p-4">
              <div className="font-medium mb-3">카테고리별 완료/잔여</div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <RBarChart data={charts.byCategory} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cat" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="done" stackId="a" name="완료" fill="#22c55e" />
                    <Bar dataKey="remain" stackId="a" name="남음" fill="#94a3b8" />
                  </RBarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <div className="text-sm text-slate-700">일자별 학습(분)</div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer>
                    <RLineChart data={charts.line} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </RLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Chat' && (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7 border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><MessageCircle className="w-4 h-4"/><div className="font-medium">파일 기반 챗봇</div></div>
              <ChatBox qa={qa} pending={pending} onAsk={ask} materialName={material.name} />
            </div>
            <div className="lg:col-span-5 p-4 border rounded-2xl">
              <div className="text-xs text-slate-600">※ 업로드 텍스트에서 근거가 없으면 답변을 거절합니다. (할루시네이션 방지)</div>
            </div>
          </div>
        )}
      </div>

      {previewSrc && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:80}} onClick={()=>setPreviewSrc(null)}>
          <img src={previewSrc} alt="preview" style={{maxWidth:'92vw', maxHeight:'92vh', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,.4)'}} />
        </div>
      )}
    </div>
  )
}

function ChatBox({ qa, pending, onAsk, materialName }) {
  const [q, setQ] = useState('')
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qa, pending])
  return (
    <div className="flex flex-col h-[420px]">
      <div className="flex-1 overflow-auto rounded-xl border p-3 bg-white">
        {qa.length === 0 && <div className="text-sm text-slate-500">예: "현재완료와 과거의 차이를 예시로 설명해줘"</div>}
        {qa.map((m, idx) => (
          <div key={idx} className={`my-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>{m.text}</div>
            {m.citations && (
              <div className="mt-1 flex flex-wrap gap-1">
                {(m.citations || []).map((c, i) => (
                  <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-white border">근거 {i + 1}: {materialName}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {pending && (
          <div className="my-2 inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 text-slate-800 text-sm"><Loader2 className="w-4 h-4 animate-spin"/>생각 중…</div>
        )}
        <div ref={endRef} />
      </div>
      <div className="mt-2 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { onAsk(q.trim()); setQ('') } }} className="flex-1 border rounded-xl px-3 py-2" placeholder="파일 기반으로 질문하기" />
        <button onClick={() => { if (q.trim()) { onAsk(q.trim()); setQ('') } }} className="px-3 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center gap-2"><Sparkles className="w-4 h-4"/>질문</button>
      </div>
    </div>
  )
}

// -------- Hub (Left: Domains / Right: Pane) --------
export default function MultiDomainCoachHub() {
  const initial = [
    { id: uid('dom'), name: '토익 RC/LC', category: 'study' },
    { id: uid('dom'), name: '영어 회화', category: 'study' },
    { id: uid('dom'), name: '근력/유산소', category: 'workout' },
  ]
  const [domains, setDomains] = useState(initial)
  const [activeId, setActiveId] = useState(initial[0].id)
  const [materialsBy, setMaterialsBy] = useState(() => Object.fromEntries(initial.map((d) => [d.id, makeDefaultMaterialForDomain(d)])))
  const [goalsBy, setGoalsBy] = useState(() => ({
    [initial[0].id]: { description: 'RC/LC 약점 보완 · 800+ 목표', deadline: '2025-10-15' },
    [initial[1].id]: { description: '일상 회화 15분/일 · 패턴 3개 암기', deadline: '2025-11-01' },
    [initial[2].id]: { description: '주 3회 근력 + 2회 유산소', deadline: '2025-11-30' },
  }))
  const [qaBy, setQaBy] = useState(() => Object.fromEntries(initial.map((d) => [d.id, []])))
  const [attachmentsBy, setAttachmentsBy] = useState(() => Object.fromEntries(initial.map((d) => [d.id, []])))

  const progressOf = (dom) => {
    const m = materialsBy[dom.id]
    if (!m) return 0
    const total = m.segments.reduce((s, x) => s + x.length, 0)
    const done = m.segments.filter((s) => s.completed).reduce((s, x) => s + x.length, 0)
    return total ? Math.round((done / total) * 100) : 0
  }

  const addDomain = () => {
    const name = window.prompt('추가할 분야 이름을 입력하세요 (예: 수학 미적분)')
    if (!name) return
    const dom = { id: uid('dom'), name, category: 'custom' }
    setDomains((prev) => [...prev, dom])
    setMaterialsBy((prev) => ({ ...prev, [dom.id]: makeDefaultMaterialForDomain(dom) }))
    setGoalsBy((prev) => ({ ...prev, [dom.id]: { description: `${name} 완주`, deadline: '' } }))
    setQaBy((prev) => ({ ...prev, [dom.id]: [] }))
    setActiveId(dom.id)
  }

  const removeDomain = (id) => {
    if (!window.confirm('이 분야를 삭제할까요?')) return
    setDomains((prev) => prev.filter((d) => d.id !== id))
    setMaterialsBy(({ [id]: _, ...rest }) => rest)
    setGoalsBy(({ [id]: _, ...rest }) => rest)
    setQaBy(({ [id]: _, ...rest }) => rest)
    if (activeId === id && domains.length > 1) {
      const next = domains.find((d) => d.id !== id)?.id
      if (next) setActiveId(next)
    }
  }

  const activeMaterial = materialsBy[activeId]
  const activeGoal = goalsBy[activeId]
  const activeQa = qaBy[activeId] || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><FolderOpen className="w-5 h-5"/><h2 className="text-lg font-semibold">분야 리스트</h2></div>
            <button onClick={addDomain} className="px-3 py-2 rounded-xl border inline-flex items-center gap-2 hover:bg-slate-50"><Plus className="w-4 h-4"/>추가</button>
          </div>
          <div className="space-y-2">
            {domains.map((d) => (
              <div key={d.id} className={`rounded-xl border p-3 cursor-pointer ${activeId === d.id ? 'bg-slate-50 border-indigo-200' : 'hover:bg-slate-50'}`} onClick={() => setActiveId(d.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-slate-600">{d.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-600">{progressOf(d)}%</div>
                    <button className="p-1 rounded-lg hover:bg-rose-50 text-rose-600" onClick={(e) => { e.stopPropagation(); removeDomain(d.id) }} title="삭제"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            ))}
            {domains.length === 0 && <div className="text-sm text-slate-500">분야가 없습니다. 추가 버튼으로 만들어 주세요.</div>}
          </div>
        </div>

        <div className="lg:col-span-8">
          {activeId && activeMaterial && activeGoal ? (
            <AICoachPane
              material={activeMaterial}
              setMaterial={(m) => setMaterialsBy((prev) => ({ ...prev, [activeId]: m }))}
              goal={activeGoal}
              setGoal={(g) => setGoalsBy((prev) => ({ ...prev, [activeId]: g }))}
              qa={activeQa}
              setQa={(updater) => setQaBy((prev) => ({ ...prev, [activeId]: updater(prev[activeId] || []) }))}
              attachments={attachmentsBy[activeId]}
              setAttachments={(next) => setAttachmentsBy((prev) => ({ ...prev, [activeId]: typeof next === 'function' ? next(prev[activeId] || []) : next }))}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow p-10 text-center text-slate-500">오른쪽에 표시할 분야를 선택하거나 추가해 주세요.</div>
          )}
        </div>
      </div>
    </div>
  )
}


