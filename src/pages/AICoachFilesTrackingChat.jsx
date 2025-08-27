import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Upload, FileText, Sparkles, CheckCircle2, AlertTriangle, Database, BookOpen, BarChart3, MessageCircle, Loader2 } from 'lucide-react'
import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart as RLineChart, Line } from 'recharts'

// 샘플 텍스트 (파일 없을 때 데모)
const SAMPLE_TEXT = `# Gerunds and Infinitives\nGerunds (-ing forms) often function as nouns, while infinitives (to + verb) express purpose or preference.\nCommon verb patterns: enjoy -ing, avoid -ing, decide to, plan to.\nEdge cases: remember to do vs remember doing.\n\n# Tenses\nPresent perfect links past and present: has/have + past participle.\nOften appears with since/for, just/already/yet. Difference with simple past depends on time relevance.\n\n# Relative Clauses\nThat/which: restrictive vs non-restrictive. In exams, prefer that in restrictive clauses without commas.`

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

// 간단한 텍스트 → 세그먼트 파서 (헤딩/빈줄 기준)
function parseTextToSegments(text) {
  const parts = text
    .split(/\n(?=#|\d+\.|\*)/g)
    .map((s) => s.trim())
    .filter(Boolean)
  const segments = parts.map((p, i) => {
    const title = p.split('\n')[0].replace(/^#+\s*/, '').slice(0, 80) || `섹션 ${i + 1}`
    // 글자수로 분량(분) 추정: 900자 ≈ 10분
    const length = Math.max(5, Math.round((p.length / 900) * 10))
    // 간단 카테고리 추정
    const category = /gerund|동명사|infinitive|부정사/i.test(p)
      ? '부정사·동명사'
      : /tense|시제|perfect/i.test(p)
      ? '시제'
      : /relative|관계대명사|that|which/i.test(p)
      ? '관계사'
      : '기타'
    return { id: uid('seg'), title, length, completed: false, category }
  })
  return segments.length
    ? segments
    : [
        { id: uid('seg'), title: '전체 요약', length: Math.max(10, Math.round((text.length / 900) * 10)), completed: false, category: '기타' },
      ]
}

// 간단 키워드 스코어 기반 검색 (RAG 흉내)
function rankChunks(question, text) {
  const chunks = text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const qTerms = question.toLowerCase().split(/[^a-z가-힣0-9]+/).filter((w) => w.length > 1)
  const scored = chunks.map((c, idx) => {
    const lc = c.toLowerCase()
    const score = qTerms.reduce((acc, t) => acc + (lc.includes(t) ? 1 : 0), 0) + Math.min(2, c.length / 200)
    return { idx, text: c, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 5)
}

function useChartsData(material, goal) {
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

    // 완료 시간대 기반 일자 라인 (데모: 세그먼트 완료 시 doneAt 기록)
    const days = new Map()
    material.segments.forEach((s) => {
      if (s.completed && s.doneAt) {
        const d = new Date(s.doneAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        days.set(key, (days.get(key) || 0) + s.length)
      }
    })
    const sorted = Array.from(days.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, minutes]) => ({ date, minutes }))

    return { summary, byCategory, line: sorted }
  }, [material, goal])
}

export default function AICoachFilesTrackingChat() {
  const [goal, setGoal] = useState({ description: '부정사·동명사/시제/관계사 보강', deadline: '2025-10-15' })
  const [material, setMaterial] = useState(() => ({ id: uid('mat'), name: '샘플 교재.txt', text: SAMPLE_TEXT, segments: parseTextToSegments(SAMPLE_TEXT) }))
  const [activeTab, setActiveTab] = useState('Tracker') // 'Library' | 'Tracker' | 'Chat'
  const [qa, setQa] = useState([])
  const [qPending, setQPending] = useState(false)

  const fileInput = useRef(null)
  const charts = useChartsData(material, goal)

  const handleUpload = (f) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const segs = parseTextToSegments(text)
      setMaterial({ id: uid('mat'), name: f.name, text, segments: segs })
    }
    reader.readAsText(f)
  }

  const markComplete = (segId, done) => {
    setMaterial((prev) => ({
      ...prev,
      segments: prev.segments.map((s) => (s.id === segId ? { ...s, completed: done, doneAt: done ? Date.now() : undefined } : s)),
    }))
  }

  const ask = async (question) => {
    const id = uid('qa')
    setQa((prev) => [...prev, { id, role: 'user', text: question }])
    setQPending(true)
    await new Promise((r) => setTimeout(r, 500))

    // 근거 검색
    const top = rankChunks(question, material.text)
    const strong = top.filter((t) => t.score >= 2)

    if (strong.length === 0) {
      setQa((prev) => [
        ...prev,
        { id: uid('qa'), role: 'assistant', text: '해당 질문에 답하기 위한 근거를 자료에서 찾지 못했어요. 관련 내용을 포함한 파일을 추가로 업로드해 주세요.' },
      ])
      setQPending(false)
      return
    }

    // 답변 생성(데모): 상위 근거 문장을 요약하여 bullet으로 제시 + 인용
    const bullets = strong.slice(0, 3).map((s) => `• ${s.text}`)
    const citations = strong.slice(0, 3).map((s) => ({ segId: String(s.idx), title: material.name, snippet: s.text.slice(0, 120) + (s.text.length > 120 ? '…' : '') }))

    const answer = [
      `질문 요지: ${question}`,
      '핵심 근거:',
      ...bullets,
      '\nTIP: 더 정확한 코칭을 위해 목표/마감을 설정하고 부족 카테고리에 집중 세션을 생성하세요.',
    ].join('\n')

    setQa((prev) => [...prev, { id: uid('qa'), role: 'assistant', text: answer, citations }])
    setQPending(false)
  }

  const summary = charts.summary
  const remain = summary ? Math.max(0, summary.total - summary.done) : 0
  const daysLeft = useMemo(() => {
    if (!goal.deadline) return undefined
    const now = new Date()
    const end = new Date(goal.deadline + 'T00:00:00')
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24))
    return diff
  }, [goal.deadline])

  const dailyTarget = summary && daysLeft && daysLeft > 0 ? Math.ceil(remain / daysLeft) : undefined

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="w-full bg-white rounded-2xl shadow">
        {/* 헤더 */}
        <div className="p-5 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <div className="text-lg font-semibold">AI 코치 · 파일 기반 학습 트래킹 & 챗봇</div>
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => setActiveTab('Library')} className={`px-3 py-2 rounded-xl border ${activeTab === 'Library' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}><Database className="w-4 h-4 mr-1 inline"/>Library</button>
              <button onClick={() => setActiveTab('Tracker')} className={`px-3 py-2 rounded-xl border ${activeTab === 'Tracker' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}><BarChart3 className="w-4 h-4 mr-1 inline"/>Tracker</button>
              <button onClick={() => setActiveTab('Chat')} className={`px-3 py-2 rounded-xl border ${activeTab === 'Chat' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}><MessageCircle className="w-4 h-4 mr-1 inline"/>Chat</button>
            </div>
          </div>

          {/* 목표/마감 입력 */}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div>
              <label className="text-xs text-slate-600">학습 목표</label>
              <input value={goal.description} onChange={(e) => setGoal((g) => ({ ...g, description: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="예: 부정사·동명사 100% 완주" />
            </div>
            <div>
              <label className="text-xs text-slate-600">마감일</label>
              <input type="date" value={goal.deadline || ''} onChange={(e) => setGoal((g) => ({ ...g, deadline: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex items-end gap-2">
              {summary && (
                <div className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 flex-1">
                  진행률 <b>{summary.rate}%</b> · 남은 분량 <b>{remain}분</b>
                  {dailyTarget !== undefined && (
                    <span className="ml-2">· 일일 목표 <b>{dailyTarget}분</b></span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-5">
          {activeTab === 'Library' && (
            <div className="grid gap-4 lg:grid-cols-12">
              {/* 업로드 */}
              <div className="lg:col-span-4 border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3"><Database className="w-4 h-4"/><div className="font-medium">자료 업로드</div></div>
                <input ref={fileInput} type="file" accept=".txt,.md,.csv,.json" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0] || undefined)} />
                <button onClick={() => fileInput.current?.click()} className="px-3 py-2 rounded-xl border inline-flex items-center gap-2 hover:bg-slate-50"><Upload className="w-4 h-4"/>파일 선택</button>
                <div className="mt-3 text-xs text-slate-600">텍스트/마크다운 기반 데모입니다. (PDF는 추후 OCR 연동)</div>
                <div className="mt-4 p-3 rounded-xl bg-slate-50 text-sm">
                  <div className="font-medium">현재 자료</div>
                  <div className="text-slate-700">{material.name}</div>
                  <div className="text-slate-600">세그먼트 {material.segments.length}개</div>
                </div>
              </div>

              {/* 세గ먼트 목록 */}
              <div className="lg:col-span-8 border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4"/><div className="font-medium">세그먼트</div></div>
                <div className="overflow-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-2">제목</th>
                        <th className="text-left p-2">카테고리</th>
                        <th className="text-right p-2">분량(분)</th>
                        <th className="text-right p-2">완료</th>
                      </tr>
                    </thead>
                    <tbody>
                      {material.segments.map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="p-2">{s.title}</td>
                          <td className="p-2">{s.category || '기타'}</td>
                          <td className="p-2 text-right">{s.length}</td>
                          <td className="p-2 text-right">
                            <label className="inline-flex items-center gap-2">
                              <input type="checkbox" checked={s.completed} onChange={(e) => markComplete(s.id, e.target.checked)} />
                              {s.completed ? <span className="text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>완료</span> : <span className="text-slate-500 inline-flex items-center gap-1"><AlertTriangle className="w-4 h-4"/>미완</span>}
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
              {/* 진행 요약 & 도넛 */}
              <div className="lg:col-span-4 border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4"/><div className="font-medium">진행 요약</div></div>
                <div className="text-sm text-slate-700">총 분량 {summary?.total ?? 0}분 · 완료 {summary?.done ?? 0}분</div>
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
                {dailyTarget !== undefined && (
                  <div className="mt-2 text-xs text-slate-600">마감까지 일일 목표: <b>{dailyTarget}분</b></div>
                )}
              </div>

              {/* 카테고리 진행 바차트 */}
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
              <div className="lg:col-span-5 border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3"><MessageCircle className="w-4 h-4"/><div className="font-medium">파일 기반 챗봇 (근거 필수)</div></div>
                <ChatBox qa={qa} pending={qPending} onAsk={ask} />
                <div className="mt-3 text-xs text-slate-600">※ 이 데모는 업로드한 자료의 문장 일부만을 증거로 사용합니다. 근거가 없으면 답변을 거절합니다(할루시네이션 방지).</div>
              </div>
              <div className="lg:col-span-7 border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4"/><div className="font-medium">현재 자료 미리보기</div></div>
                <pre className="text-sm whitespace-pre-wrap max-h-[440px] overflow-auto p-3 bg-slate-50 rounded-xl">{material.text.slice(0, 4000)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatBox({ qa, pending, onAsk }) {
  const [q, setQ] = useState('')
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [qa, pending])
  return (
    <div className="flex flex-col h-[460px]">
      <div className="flex-1 overflow-auto rounded-xl border p-3 bg-white">
        {qa.length === 0 && <div className="text-sm text-slate-500">파일과 목표를 바탕으로 질문해 보세요. 예: "현재완료와 과거의 차이를 예시로 설명해줘"</div>}
        {qa.map((m) => (
          <div key={m.id} className={`my-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>{m.text}</div>
            {m.citations && m.citations.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {m.citations.map((c, i) => (
                  <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-white border">근거 {i + 1}: {c.title}</span>
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
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { onAsk(q.trim()); setQ(''); } }} className="flex-1 border rounded-xl px-3 py-2" placeholder="파일 기반으로 질문하기" />
        <button onClick={() => { if (q.trim()) { onAsk(q.trim()); setQ(''); } }} className="px-3 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center gap-2"><Sparkles className="w-4 h-4"/>질문</button>
      </div>
    </div>
  )
}


