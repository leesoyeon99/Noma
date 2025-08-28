import React, { useState, useMemo, useEffect } from 'react'
import AgentNomaPanel from './components/AgentNomaPanel'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { CalendarDays, Sparkles, Percent, AlertTriangle, TrendingUp, Lightbulb, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import AICoachShell from './pages/AICoachShell'
import TuiCalendar from './components/TuiCalendar'
import AICoachFilesTrackingChat from './pages/AICoachFilesTrackingChat'
import MultiDomainCoachHub from './pages/MultiDomainCoachHub'
import GuidedJourneyDemo from './pages/GuidedJourneyDemo'

// 기본 투두
const DEFAULT_WORKOUT = [
  { id: 'wdef1', label: '유산소 30분', done: false },
  { id: 'wdef2', label: '스트레칭 10분', done: false },
]
const DEFAULT_TOEIC = [
  { id: 'tdef1', label: '실전 어휘 체크', done: false },
  { id: 'tdef2', label: '오답노트 복습', done: false },
]

// KPI 대시보드용 데이터
const RAW = [
  { category: '유산소', progress: 62, target: 70, delta: 8 },
  { category: '상체운동', progress: 54, target: 65, delta: 3 },
  { category: '하체운동', progress: 41, target: 60, delta: -4 },
  { category: '어휘', progress: 72, target: 75, delta: 5 },
  { category: '오답노트', progress: 39, target: 55, delta: -6 },
  { category: '모의고사', progress: 58, target: 70, delta: 2 },
]

const INIT_SUGGESTIONS = [
  {
    id: 'sg_01',
    category: '어휘',
    severity: 'high',
    title: '운동 직후 15분 어휘 복습 블록 추가',
    rationale: '최근 2주 어휘 진도 10%p 미달 + 운동 직후 집중도 상승 패턴',
    action: { type: 'schedule_add', label: '어휘 15분 블록 추가 (운동 후)' },
    status: 'open',
  },
  {
    id: 'sg_02',
    category: '오답노트',
    severity: 'medium',
    title: '일일 10분 오답 체크리스트',
    rationale: '동일 오답 태그 2회 이상 반복',
    action: { type: 'checklist', label: '오답 체크리스트 시작' },
    status: 'open',
  },
  {
    id: 'sg_03',
    category: '유산소',
    severity: 'low',
    title: '수요일 충돌로 유산소를 화/목로 이동',
    rationale: 'PT와 시간 겹침 → 충돌 해소 필요',
    action: { type: 'reorder', label: '유산소 일정 이동' },
    status: 'open',
  },
]

// Heat level by value (purple opacity)
const valueToHeatClass = (v) => {
  if (v >= 85) return 'purple-85'
  if (v >= 70) return 'purple-70'
  if (v >= 50) return 'purple-50'
  if (v >= 30) return 'purple-30'
  if (v > 0) return 'purple-10'
  return 'purple-00'
}

const formatDateKey = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}${m}${day}`
}

const Checklist = ({ items, onToggle }) => (
  <ul className="list">
    {items.map(it => (
      <li
        key={it.id}
        className={'item ' + (it.done ? 'strike' : '')}
        onClick={() => onToggle(it.id)}
      >
        <input
          type="checkbox"
          className="checkbox"
          checked={it.done}
          onChange={() => onToggle(it.id)}
          onClick={(e)=>e.stopPropagation()}
        />
        <span>{it.label}</span>
      </li>
    ))}
  </ul>
)

export default function App(){
  const [date, setDate] = useState(new Date())
  const [calendarType, setCalendarType] = useState('calendar')
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState(null)
  const [activeView, setActiveView] = useState('home')
  const [showRightAside, setShowRightAside] = useState(true)
  const [showCoaching, setShowCoaching] = useState(false)
  const [fabImgOk, setFabImgOk] = useState(true)
  const [timeline, setTimeline] = useState([])
  const [coachTab, setCoachTab] = useState('coaching')
  const [nomaMessages, setNomaMessages] = useState([{ role: 'assistant', text: '무엇을 도와드릴까요?' }])
  const [nomaInput, setNomaInput] = useState('')
  const [suggestions, setSuggestions] = useState(INIT_SUGGESTIONS)
  const [panelOpen, setPanelOpen] = useState(false)
  const [workoutTodosByDate, setWorkoutTodosByDate] = useState({})
  const [toeicTodosByDate, setToeicTodosByDate] = useState({})
  const [englishConversationTodosByDate, setEnglishConversationTodosByDate] = useState({})
  const [studyTodosByDate, setStudyTodosByDate] = useState({})
  const [showAddInput, setShowAddInput] = useState({ workout:false, toeic:false, englishConversation:false, study:false })
  const [newTodoText, setNewTodoText] = useState('')
  const [extraCategories, setExtraCategories] = useState([])
  const [extraTodosByDate, setExtraTodosByDate] = useState({}) // { [catId]: { [dateKey]: Todo[] } }
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showAddInputExtra, setShowAddInputExtra] = useState({}) // { [catId]: bool }
  const [newTodoTextExtra, setNewTodoTextExtra] = useState({}) // { [catId]: string }
  const [rightPanel, setRightPanel] = useState({ type: 'todo', payload: null })
  const parseTimeRange = (label) => {
    if (!label) return null
    const m = label.match(/(\d{1,2}):(\d{2})\s*[~–-]\s*(\d{1,2}):(\d{2})/)
    if (!m) return null
    return { sH: parseInt(m[1],10), sM: parseInt(m[2],10), eH: parseInt(m[3],10), eM: parseInt(m[4],10) }
  }

  const keyToDate = (key) => {
    const y = Number(key.slice(0,4))
    const m = Number(key.slice(4,6)) - 1
    const d = Number(key.slice(6,8))
    return new Date(y, m, d)
  }

  const calendarEvents = useMemo(() => {
    const events = []
    const pushEvent = (calendarId, dateKey, todo) => {
      const base = keyToDate(dateKey)
      const tr = parseTimeRange(todo.label)
      if (tr) {
        const start = new Date(base)
        start.setHours(tr.sH, tr.sM, 0, 0)
        const end = new Date(base)
        end.setHours(tr.eH, tr.eM, 0, 0)
        events.push({ id: todo.id, calendarId, title: todo.label, start, end, isAllday: false })
      } else {
        const start = new Date(base)
        const end = new Date(base)
        end.setHours(23, 59, 59, 999)
        events.push({ id: todo.id, calendarId, title: todo.label, start, end, isAllday: true })
      }
    }
    Object.entries(workoutTodosByDate).forEach(([dk, list]) => {
      (list||[]).forEach(it => pushEvent('근력/유산소', dk, it))
    })
    Object.entries(toeicTodosByDate).forEach(([dk, list]) => {
      (list||[]).forEach(it => pushEvent('토익 RC/LC', dk, it))
    })
    Object.entries(englishConversationTodosByDate).forEach(([dk, list]) => {
      (list||[]).forEach(it => pushEvent('영어 회화', dk, it))
    })
    Object.entries(studyTodosByDate).forEach(([dk, list]) => {
      (list||[]).forEach(it => pushEvent('study', dk, it))
    })
    Object.entries(extraTodosByDate).forEach(([catId, byDate]) => {
      Object.entries(byDate||{}).forEach(([dk, list]) => {
        (list||[]).forEach(it => pushEvent('etc', dk, it))
      })
    })
    return events
  }, [workoutTodosByDate, toeicTodosByDate, englishConversationTodosByDate, studyTodosByDate, extraTodosByDate])

  const kpis = useMemo(() => {
    const total = RAW.length || 1
    const avgProgress = Math.round(RAW.reduce((a,b)=>a+b.progress,0)/total)
    const avgTarget = Math.round(RAW.reduce((a,b)=>a+b.target,0)/total)
    const riskCnt = RAW.filter(r=>r.progress < r.target - 10).length
    const improving = RAW.filter(r=>r.delta > 0).length
    const openSuggestions = suggestions.filter(s=>s.status==='open')
    const highCount = openSuggestions.filter(s=>s.severity==='high').length
    return { avgProgress, avgTarget, riskCnt, improving, coachCount: openSuggestions.length, highCount }
  }, [suggestions])

  const progressData = [
    { week: '1주', Mon: 30, Tue: 60, Wed: 80, Thu: 50, Fri: 20, Sat: 70, Sun: 90 },
    { week: '2주', Mon: 40, Tue: 55, Wed: 75, Thu: 65, Fri: 25, Sat: 50, Sun: 85 },
    { week: '3주', Mon: 20, Tue: 45, Wed: 60, Thu: 70, Fri: 35, Sat: 40, Sun: 65 },
    { week: '4주', Mon: 50, Tue: 65, Wed: 85, Thu: 75, Fri: 45, Sat: 55, Sun: 95 },
  ]
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  const [leftTodos, setLeftTodos] = useState([
    { id: 'todo1', label: '11:30 – 1박 2일 크로스핏 캠프', done: false },
    { id: 'todo2', label: '13:22 – 유산소 30분', done: false },
  ])
  const [workoutTodos, setWorkoutTodos] = useState([
    { id: 'w1', label: '1박 2일 크로스핏 캠프', done: false },
    { id: 'w2', label: '유산소 30분', done: false },
  ])
  const [toeicTodos, setToeicTodos] = useState([
    { id: 't1', label: '실전 어휘 체크', done: false },
    { id: 't2', label: '오답노트 복습', done: false },
  ])
  const [englishConversationTodos, setEnglishConversationTodos] = useState([
    { id: 'ec1', label: '일상 회화 연습', done: false },
    { id: 'ec2', label: '비즈니스 영어', done: false },
  ])
  const [studyTodos, setStudyTodos] = useState([
    { id: 's1', label: '수학 공부', done: false },
    { id: 's2', label: '과학 실험', done: false },
  ])

  const toggleItem = (id, list, setter) => {
    setter(list.map(it => it.id === id ? { ...it, done: !it.done } : it))
  }

  const addTimelineEntry = (entry) => {
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (typeof entry === 'string') {
      setTimeline(prev => [...prev, { text: entry, time }])
    } else {
      const { category, label, todoId, dateKey } = entry
      setTimeline(prev => [
        ...prev,
        { text: `${category} - ${label}`, category, label, todoId, dateKey, time }
      ])
    }
  }

  const handleToggleWorkout = (id) => {
    setWorkoutTodos(prev => {
      const updated = prev.map(it => it.id === id ? { ...it, done: !it.done } : it)
      const before = prev.find(it => it.id === id)
      const after = updated.find(it => it.id === id)
      if (before && after && !before.done && after.done) {
        addTimelineEntry(`운동 - ${after.label}`)
      }
      return updated
    })
  }

  const handleToggleToeic = (id) => {
    setToeicTodos(prev => {
      const updated = prev.map(it => it.id === id ? { ...it, done: !it.done } : it)
      const before = prev.find(it => it.id === id)
      const after = updated.find(it => it.id === id)
      if (before && after && !before.done && after.done) {
        addTimelineEntry(`토익 - ${after.label}`)
      }
      return updated
    })
  }

  const computeChecklistCompletion = () => {
    const total = workoutList.length + toeicList.length
    if (total === 0) return 0
    const done = workoutList.filter(it => it.done).length + toeicList.filter(it => it.done).length
    return Math.round((done / total) * 100)
  }

  const computeListCompletion = (list) => {
    if (!list || list.length === 0) return 0
    const done = list.filter(it => it.done).length
    return Math.round((done / list.length) * 100)
  }

  const computeTimeBasedProgress = (list) => {
    if (!list || list.length === 0) return 0
    const totalTime = list.reduce((sum, item) => sum + (item.time || 0), 0)
    const completedTime = list.filter(item => item.done).reduce((sum, item) => sum + (item.time || 0), 0)
    if (totalTime === 0) return 0
    return Math.round((completedTime / totalTime) * 100)
  }

  const sendNomaMessage = () => {
    const text = nomaInput.trim()
    if (!text) return
    setNomaMessages(prev => [...prev, { role: 'user', text }, { role: 'assistant', text: '답변을 준비 중입니다…' }])
    setNomaInput('')
  }

  const openSidePanel = (type, payload=null) => {
    setRightPanel({ type, payload })
    setShowRightAside(true)
  }

  const selectedDateKey = formatDateKey(date)
  const workoutList = workoutTodosByDate[selectedDateKey] ?? []
  const toeicList = toeicTodosByDate[selectedDateKey] ?? []
  const englishConversationList = englishConversationTodosByDate[selectedDateKey] ?? []
  const studyList = studyTodosByDate[selectedDateKey] ?? []

  useEffect(()=>{
    const key = selectedDateKey
    setWorkoutTodosByDate(prev => {
      if (prev[key]) return prev
      return { ...prev, [key]: DEFAULT_WORKOUT.map(x=>({ ...x, id: `w-${key}-${x.id}` })) }
    })
    setToeicTodosByDate(prev => {
      if (prev[key]) return prev
      return { ...prev, [key]: DEFAULT_TOEIC.map(x=>({ ...x, id: `t-${key}-${x.id}` })) }
    })
    setEnglishConversationTodosByDate(prev => {
      if (prev[key]) return prev
      return { ...prev, [key]: englishConversationTodos.map(x=>({ ...x, id: `ec-${key}-${x.id}` })) }
    })
    setStudyTodosByDate(prev => {
      if (prev[key]) return prev
      return { ...prev, [key]: studyTodos.map(x=>({ ...x, id: `s-${key}-${x.id}` })) }
    })
  }, [selectedDateKey])

  const addTodo = (category) => {
    const text = newTodoText.trim()
    if (!text) return
    const timeInput = document.getElementById(`${category}-time-input`)
    const timeValue = timeInput ? parseInt(timeInput.value) || 0 : 0
    const newItem = { 
      id: `${category}-${Date.now()}`, 
      label: text, 
      time: timeValue, // 분 단위로 저장
      done: false 
    }
    if (category === '근력/유산소') {
      setWorkoutTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] ?? []), newItem]
      }))
    } else if (category === '토익 RC/LC') {
      setToeicTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] ?? []), newItem]
      }))
    } else if (category === '영어 회화') {
      setEnglishConversationTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] ?? []), newItem]
      }))
    } else if (category === 'study') {
      setStudyTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] ?? []), newItem]
      }))
    }
    setNewTodoText('')
    setShowAddInput({ workout:false, toeic:false, englishConversation:false, study:false })
  }

  const deleteTodo = (category, id) => {
    if (category === '근력/유산소') {
      setWorkoutTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: (prev[selectedDateKey] ?? []).filter(it=>it.id!==id)
      }))
    } else if (category === '토익 RC/LC') {
      setToeicTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: (prev[selectedDateKey] ?? []).filter(it=>it.id!==id)
      }))
    } else if (category === '영어 회화') {
      setEnglishConversationTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: (prev[selectedDateKey] ?? []).filter(it=>it.id!==id)
      }))
    } else if (category === 'study') {
      setStudyTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: (prev[selectedDateKey] ?? []).filter(it=>it.id!==id)
      }))
    }
    // 타임라인에서 동일 todoId & dateKey 기록 제거
    setTimeline(prev => prev.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
  }

  const toggleTodo = (category, id) => {
    if (category === '근력/유산소') {
      setWorkoutTodosByDate(prev => {
        const prevList = prev[selectedDateKey] ?? []
        const before = prevList.find(it => it.id === id)
        const updatedList = prevList.map(it=> it.id===id?{...it,done:!it.done}:it)
        const after = updatedList.find(it => it.id === id)
        if (before && after) {
          if (!before.done && after.done) {
            addTimelineEntry({ category: '근력/유산소', label: after.label, todoId: id, dateKey: selectedDateKey })
          }
          if (before.done && !after.done) {
            setTimeline(prev => prev.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
          }
        }
        return { ...prev, [selectedDateKey]: updatedList }
      })
    } else if (category === '토익 RC/LC') {
      setToeicTodosByDate(prev => {
        const prevList = prev[selectedDateKey] ?? []
        const before = prevList.find(it => it.id === id)
        const updatedList = prevList.map(it=> it.id===id?{...it,done:!it.done}:it)
        const after = updatedList.find(it => it.id === id)
        if (before && after) {
          if (!before.done && after.done) {
            addTimelineEntry({ category: '토익 RC/LC', label: after.label, todoId: id, dateKey: selectedDateKey })
          }
          if (before.done && !after.done) {
            setTimeline(prev => prev.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
          }
        }
        return { ...prev, [selectedDateKey]: updatedList }
      })
    } else if (category === '영어 회화') {
      setEnglishConversationTodosByDate(prev => {
        const prevList = prev[selectedDateKey] ?? []
        const before = prevList.find(it => it.id === id)
        const updatedList = prevList.map(it=> it.id===id?{...it,done:!it.done}:it)
        const after = updatedList.find(it => it.id === id)
        if (before && after) {
          if (!before.done && after.done) {
            addTimelineEntry({ category: '영어 회화', label: after.label, todoId: id, dateKey: selectedDateKey })
          }
          if (before.done && !after.done) {
            setTimeline(prev => prev.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
          }
        }
        return { ...prev, [selectedDateKey]: updatedList }
      })
    } else if (category === 'study') {
      setStudyTodosByDate(prev => {
        const prevList = prev[selectedDateKey] ?? []
        const before = prevList.find(it => it.id === id)
        const updatedList = prevList.map(it=> it.id===id?{...it,done:!it.done}:it)
        const after = updatedList.find(it => it.id === id)
        if (before && after) {
          if (!before.done && after.done) {
            addTimelineEntry({ category: 'study', label: after.label, todoId: id, dateKey: selectedDateKey })
          }
          if (before.done && !after.done) {
            setTimeline(prev => prev.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
          }
        }
        return { ...prev, [selectedDateKey]: updatedList }
      })
    }
  }

  // 간단 차트용 데이터 (시간 기준)
  const categorySeries = [
    { category: '근력/유산소', progress: computeTimeBasedProgress(workoutList), target: 100 },
    { category: '토익 RC/LC', progress: computeTimeBasedProgress(toeicList), target: 100 },
    { category: '영어 회화', progress: computeTimeBasedProgress(englishConversationList), target: 100 },
    { category: 'study', progress: computeTimeBasedProgress(studyList), target: 100 },
    ...extraCategories.map(cat => ({
      category: cat.name,
      progress: computeTimeBasedProgress((extraTodosByDate[cat.id]?.[selectedDateKey]) ?? []),
      target: 100,
    })),
  ]
  // weeklySeries는 헬퍼들이 정의된 이후에 계산해야 합니다.
  // 아래 computeWeeklyDeltaPoints 정의 이후로 이동했습니다.

  const BarChart = ({ data }) => (
    <div className="bar-chart">
      <div className="bars">
        {data.map((r) => {
          const progressH = Math.max(2, Math.min(100, r.progress))
          const targetH = Math.max(2, Math.min(100, r.target))
          return (
            <div key={r.category} className="bar-col">
              <div className="bar-pair">
                <div className="bar target" style={{ height: targetH + '%' }} title={`목표 ${r.target}%`} />
                <div className="bar progress" style={{ height: progressH + '%' }} title={`진도 ${r.progress}%`} />
              </div>
              <div className="x-label">{r.category}</div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const LineChart = ({ points }) => {
    const width = 360
    const height = 200
    const padding = 28
    const maxAbs = Math.max(...points.map(p=>Math.abs(p.value)), 1)
    const maxVal = Math.ceil(maxAbs)
    const stepX = (width - padding*2) / (points.length - 1)
    const toXY = (i, v) => [padding + i*stepX, height - padding - ((v + maxVal) / (2*maxVal)) * (height - padding*2)]
    const poly = points.map((p,i)=>toXY(i,p.value).join(',')).join(' ')
    const ticks = [-maxVal, -Math.round(maxVal*0.5), 0, Math.round(maxVal*0.5), maxVal]
    return (
      <svg className="line-svg" viewBox={`0 0 ${width} ${height}`}> 
        <g stroke="#e5e7eb">
          <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} />
          <line x1={padding} y1={padding} x2={padding} y2={height-padding} />
          {ticks.map((t,idx)=>{
            const y = toXY(0, t)[1]
            return <g key={idx}><line x1={padding} y1={y} x2={width-padding} y2={y} stroke="#f1f5f9" /><text x={padding-6} y={y+3} fontSize="10" fill="#64748b" textAnchor="end">{t}</text></g>
          })}
        </g>
        <polyline fill="none" stroke="#0ea5e9" strokeWidth="2" points={poly} />
        {points.map((p,i)=>{
          const [x,y] = toXY(i,p.value)
          return <circle key={i} cx={x} cy={y} r="3" fill="#0ea5e9" >
            <title>{`${p.label} 주간 변화(회): ${p.value}`}</title>
          </circle>
        })}
        {points.map((p,i)=>{
          const x = padding + i*stepX
          return (
            <text key={'lbl-'+i} x={x} y={height - 6} textAnchor="middle" fontSize="10" fill="#64748b">{p.label}</text>
          )
        })}
      </svg>
    )
  }

  const addCategory = () => {
    const name = newCategoryName.trim()
    if (!name) return
    const id = 'cat-' + Date.now()
    setExtraCategories(prev => [...prev, { id, name }])
    setShowAddCategory(false)
    setNewCategoryName('')
  }

  const getExtraList = (catId) => (extraTodosByDate[catId]?.[selectedDateKey]) ?? []

  const addExtraTodo = (catId) => {
    const text = (newTodoTextExtra[catId] || '').trim()
    if (!text) return
    const timeInput = document.getElementById(`extra-${catId}-time-input`)
    const timeValue = timeInput ? parseInt(timeInput.value) || 0 : 0
    const newItem = { id: `${catId}-${Date.now()}`, label: text, time: timeValue, done: false }
    setExtraTodosByDate(prev => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || {}),
        [selectedDateKey]: [...(prev[catId]?.[selectedDateKey] || []), newItem]
      }
    }))
    setNewTodoTextExtra(prev => ({ ...prev, [catId]: '' }))
    setShowAddInputExtra(prev => ({ ...prev, [catId]: false }))
  }

  const toggleExtraTodo = (catId, id) => {
    setExtraTodosByDate(prev => {
      const list = (prev[catId]?.[selectedDateKey] || [])
      const before = list.find(it=>it.id===id)
      const updated = list.map(it=> it.id===id?{...it,done:!it.done}:it)
      const after = updated.find(it=>it.id===id)
      if (before && after) {
        if (!before.done && after.done) addTimelineEntry({ category: catId, label: after.label, todoId: id, dateKey: selectedDateKey })
        if (before.done && !after.done) setTimeline(prevT => prevT.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
      }
      return {
        ...prev,
        [catId]: { ...(prev[catId] || {}), [selectedDateKey]: updated }
      }
    })
  }

  const deleteExtraTodo = (catId, id) => {
    setExtraTodosByDate(prev => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || {}),
        [selectedDateKey]: (prev[catId]?.[selectedDateKey] || []).filter(it=>it.id!==id)
      }
    }))
    setTimeline(prevT => prevT.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
  }

  const deleteCategory = (catId) => {
    setExtraCategories(prev => prev.filter(c => c.id !== catId))
    setExtraTodosByDate(prev => {
      const next = { ...prev }
      delete next[catId]
      return next
    })
    // 해당 카테고리 관련 타임라인 모두 제거
    setTimeline(prev => prev.filter(t => t.category !== catId))
  }

  const getWeekDateKeys = (baseDate, weekOffset = 0) => {
    const base = new Date(baseDate)
    const day = base.getDay() // 0=Sun ... 6=Sat
    const mondayOffset = (day + 6) % 7
    const start = new Date(base)
    start.setDate(base.getDate() - mondayOffset + weekOffset * 7)
    const keys = []
    for (let i = 0; i < 7; i++) {
      const di = new Date(start)
      di.setDate(start.getDate() + i)
      keys.push(formatDateKey(di))
    }
    return keys
  }

  const countDoneInMap = (map, dateKeys) => {
    return dateKeys.reduce((acc, k) => acc + ((map[k] || []).filter(it => it.done).length), 0)
  }

  const sumDoneForCategory = (catId, dateKeys) => {
    if (catId === '근력/유산소') return countDoneInMap(workoutTodosByDate, dateKeys)
    if (catId === '토익 RC/LC') return countDoneInMap(toeicTodosByDate, dateKeys)
    if (catId === '영어 회화') return countDoneInMap(englishConversationTodosByDate, dateKeys)
    if (catId === 'study') return countDoneInMap(studyTodosByDate, dateKeys)
    const catMap = extraTodosByDate[catId] || {}
    return dateKeys.reduce((acc, k) => acc + ((catMap[k] || []).filter(it => it.done).length), 0)
  }

  const getCategoryLabel = (catId) => {
    if (catId === '근력/유산소') return '근력/유산소'
    if (catId === '토익 RC/LC') return '토익 RC/LC'
    if (catId === '영어 회화') return '영어 회화'
    if (catId === 'study') return 'study'
    const cat = extraCategories.find(c => c.id === catId)
    return cat ? cat.name : catId
  }

  const computeWeeklyDeltaPoints = () => {
    const thisWeekKeys = getWeekDateKeys(date, 0)
    const lastWeekKeys = getWeekDateKeys(date, -1)
    const catIds = ['근력/유산소', '토익 RC/LC', '영어 회화', 'study', ...extraCategories.map(c => c.id)]
    return catIds.map(id => ({ label: getCategoryLabel(id), value: sumDoneForCategory(id, thisWeekKeys) - sumDoneForCategory(id, lastWeekKeys) }))
  }

  const weeklySeries = computeWeeklyDeltaPoints()

  const ensureExtraCategoryByName = (name) => {
    const found = extraCategories.find(c => c.name === name)
    if (found) return found.id
    const id = 'cat-' + Date.now()
    setExtraCategories(prev => [...prev, { id, name }])
    return id
  }

  const resolveCategoryIdForSuggestion = (s) => {
    const cat = s.category || ''
    if (cat.includes('유산소') || cat.includes('운동')) return '근력/유산소'
    if (cat.includes('토익')) return '토익 RC/LC'
    if (cat.includes('회화') || cat.includes('영어')) return '영어 회화'
    if (cat.includes('공부') || cat.includes('학습')) return 'study'
    // 나머지는 추가 카테고리로 관리
    return ensureExtraCategoryByName(cat)
  }

  const addTodoForCategory = (catId, label) => {
    const item = { id: `${catId}-${Date.now()}`, label, time: 0, done: false }
    if (catId === '근력/유산소') {
      setWorkoutTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] || []), item]
      }))
    } else if (catId === '토익 RC/LC') {
      setToeicTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] || []), item]
      }))
    } else if (catId === '영어 회화') {
      setEnglishConversationTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] || []), item]
      }))
    } else if (catId === 'study') {
      setStudyTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] || []), item]
      }))
    } else {
      setExtraTodosByDate(prev => ({
        ...prev,
        [catId]: {
          ...(prev[catId] || {}),
          [selectedDateKey]: [...(prev[catId]?.[selectedDateKey] || []), item]
        }
      }))
    }
  }

  const handleApplySuggestion = (s) => {
    setSuggestions(prev => prev.map(x => (x.id === s.id ? { ...x, status: 'applied' } : x)))
    const label = (s.action && s.action.label) ? s.action.label : s.title
    const catId = resolveCategoryIdForSuggestion(s)
    addTodoForCategory(catId, label)
  }

  // Bridge: open right panel from child pages (e.g., GuidedJourneyDemo)
  useEffect(() => {
    const handler = (e) => {
      const t = e.detail?.type || 'todo'
      openSidePanel(t)
    }
    window.addEventListener('open-right-panel', handler)
    return () => window.removeEventListener('open-right-panel', handler)
  }, [])
  // right sidebar visibility handled via isRightAllowed/isRightOpen

  const isRightAllowed = (activeView === 'home') || (rightPanel.type !== 'todo')
  const isRightOpen = showRightAside && isRightAllowed

  return (
    <div className="container" style={{ gridTemplateColumns: isRightOpen ? '256px 1fr 360px' : '256px 1fr 0px', transition: 'grid-template-columns 200ms ease' }}>

      {/* Left Sidebar */}
      <aside className="sidebar">
                            <h2 style={{fontSize: '18px', fontWeight: 700, marginBottom: 12}}>
                      <span style={{display: 'inline-block', width: '24px', height: '24px', marginRight: '8px', verticalAlign: 'middle'}}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      </span>
                      noma
                    </h2>
                            <nav className="nav">
                      <p className={activeView==='home' ? 'bold nav-link active' : 'nav-link'} onClick={()=>setActiveView('home')}>Home/Calendar</p>
                      <p className={activeView==='journey' ? 'bold nav-link active' : 'nav-link'} onClick={()=>setActiveView('journey')}>NOMA lab</p>
                      <p className={activeView==='insight' ? 'bold nav-link active' : 'nav-link'} onClick={()=>setActiveView('insight')}>Insights</p>
                    </nav>
        <div style={{marginTop: 24}}>
          <Card>
            <CardHeader>
              <CardTitle>🕒 타임라인</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="small">아직 기록이 없습니다. 우측 체크리스트를 체크해보세요.</p>
              ) : (
                <ul className="list">
                  {timeline.map((t, idx) => (
                    <li key={idx} className="item" style={{justifyContent:'space-between'}}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {t.category ? (
                          <>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex-shrink-0">
                              {t.category}
                            </span>
                            <span className="text-sm truncate">{t.label}</span>
                          </>
                        ) : (
                          <span className="text-sm truncate">{t.text}</span>
                        )}
                      </div>
                      <span className="small" style={{color:'#64748b'}}>{t.time}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {activeView === 'home' ? (
          <div style={{paddingRight:16}}>
            <div className="row mb-4">
              <h1 className="title"><CalendarDays size={18}/> 2025.07</h1>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div className="flex items-center bg-gray-200 rounded-lg p-1" style={{height: '36px'}}>
                  <button
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                      calendarType === 'calendar' 
                        ? 'bg-white text-gray-800 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setCalendarType('calendar')}
                    style={{minWidth: '60px'}}
                  >
                    달력
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                      calendarType === 'heatmap' 
                        ? 'bg-white text-gray-800 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setCalendarType('heatmap')}
                    style={{minWidth: '80px'}}
                  >
                    히트맵 달력
                  </button>
                </div>
                <button
                  className={`btn ${showRightAside ? 'btn-dark' : ''}`}
                  onClick={() => setShowRightAside(v => !v)}
                  style={{minWidth: '120px', height: '36px', fontSize: '14px'}}
                  aria-label="오늘의 투두 토글"
                >
                  <span style={{display: 'flex', alignItems: 'center', gap: '2px'}}>
                    오늘의 할 일
                    {showRightAside ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
                  </span>
                </button>
              </div>
            </div>

            <Card>
              <CardContent>
                {calendarType === 'calendar' ? (
                  <div className="p-8">
                    <TuiCalendar
                      schedules={calendarEvents}
                      onSelectDate={(d)=> setDate(new Date(d))}
                      onCreate={(sch)=>{
                        const label = `${sch.title}`
                        const makeKey = (dt) => {
                          const dd = (dt && dt.toDate) ? dt.toDate() : new Date(dt)
                          return formatDateKey(dd)
                        }
                        const dateKey = makeKey(sch.start)
                        const category = sch.calendarId === 'workout' ? 'workout' : sch.calendarId === 'toeic' ? 'toeic' : 'toeic'
                        const newItem = { id: `${category}-${Date.now()}`, label, done:false }
                        if (category === 'workout') {
                          setWorkoutTodosByDate(prev => ({
                            ...prev,
                            [dateKey]: [...(prev[dateKey] ?? []), newItem]
                          }))
                        } else {
                          setToeicTodosByDate(prev => ({
                            ...prev,
                            [dateKey]: [...(prev[dateKey] ?? []), newItem]
                          }))
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <p>현재 선택된 탭: {calendarType}</p>
                    <div className="scroll-x">
                      <div className="minw">
                        <div className="grid grid-heatmap">
                          <div className="cell header">Week/Day</div>
                          {days.map(d => <div key={d} className="cell header">{d}</div>)}
                          {progressData.map(row => (
                            <React.Fragment key={row.week}>
                              <div className="week">{row.week}</div>
                              {days.map(d => {
                                let v = row[d]
                                // 7/1을 1주 화요일로 가정하여 값 대체
                                if (row.week === '1주' && d === 'Tue') {
                                  v = computeChecklistCompletion()
                                }
                                return (
                                  <div
                                    key={row.week + '-' + d}
                                    className={'cell ' + valueToHeatClass(v)}
                                    title={`${row.week} ${d}: ${v}%`}
                                    onClick={() => setSelectedHeatmapDate({ week: row.week, day: d, value: v })}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {v}%
                                  </div>
                                )
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                        
                        {selectedHeatmapDate && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">
                              📅 {selectedHeatmapDate.week} {selectedHeatmapDate.day}
                            </h3>
                            <p className="text-2xl font-bold text-purple-600">
                              진행률: {selectedHeatmapDate.value}%
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              이 날의 학습 진도를 확인하세요
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mb-4" />

            {showCoaching && (
              <div className="coach-modal">
                <div className="coach-modal-card">
                  <div className="coach-modal-header">
                    <div className={coachTab==='coaching' ? 'coach-tab active' : 'coach-tab'} onClick={()=>setCoachTab('coaching')}>오늘의 코칭</div>
                    <div className={coachTab==='noma' ? 'coach-tab active' : 'coach-tab'} onClick={()=>setCoachTab('noma')}>NOMA LLM</div>
                    <button className="coach-close" aria-label="닫기" onClick={()=>setShowCoaching(false)}>✕</button>
                  </div>
                  <div className="coach-modal-content">
                    {coachTab === 'coaching' ? (
                      <div>
                        <p>📅 {date.toLocaleDateString()}</p>
                        <p className="mt-2">오늘은 오전에 유산소 30분과 어휘 복습 일정이 있습니다. 운동 후 바로 복습을 연결하면 집중력이 유지됩니다.</p>
                        <p className="small">행운 포인트: 운동 직후 복습하기 / 피해야 할 것: 운동 후 긴 휴식</p>
                      </div>
                    ) : coachTab === 'noma' ? (
                      <AgentNomaPanel
                        onClose={()=>setShowCoaching(false)}
                        onAccept={(items)=>{
                          try{
                            const arr = Array.isArray(items)?items:[]
                            // 라벨 내 키워드로 카테고리 추정
                            arr.forEach(it=>{
                              const label = String(it?.label||'').trim()
                              if(!label) return
                              const lower = label.toLowerCase()
                              let category = it.category || (
                                lower.includes('lc') || lower.includes('rc') || lower.includes('토익') ? 'toeic' :
                                lower.includes('운동') || lower.includes('유산소') ? 'workout' : 'toeic'
                              )
                              const newItem = { id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, label, done:false }
                              if (category === 'workout') {
                                setWorkoutTodosByDate(prev => ({
                                  ...prev,
                                  [selectedDateKey]: [...(prev[selectedDateKey] ?? []), newItem]
                                }))
                              } else if (category === 'toeic') {
                                setToeicTodosByDate(prev => ({
                                  ...prev,
                                  [selectedDateKey]: [...(prev[selectedDateKey] ?? []), newItem]
                                }))
                              } else {
                                const catId = ensureExtraCategoryByName(category)
                                setExtraTodosByDate(prev => ({
                                  ...prev,
                                  [catId]: {
                                    ...(prev[catId]||{}),
                                    [selectedDateKey]: [...(prev[catId]?.[selectedDateKey] || []), newItem]
                                  }
                                }))
                              }
                            })
                          }catch(e){/* noop */}
                        }}
                      />
                    ) : (
                      <div className="noma-messages">
                        {suggestions.filter(s=>s.status==='open').map(s => (
                          <div key={s.id} className="msg bot" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                            <div>
                              <div style={{fontWeight:600,fontSize:13}}>[{s.category}] {s.title}</div>
                              <div className="small" style={{color:'#64748b'}}>{s.rationale}</div>
                            </div>
                            <button className="btn btn-dark" onClick={()=>handleApplySuggestion(s)}>적용</button>
                          </div>
                        ))}
                        {suggestions.filter(s=>s.status==='open').length===0 && (
                          <div className="msg bot">이번 기간에는 추가 코칭 제안이 없습니다.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button className="fab" aria-label="오늘의 코칭 토글" onClick={()=>setShowCoaching(v=>!v)}>
              {fabImgOk ? (
                <img src="/coach.png" alt="coaching" width="20" height="20" onError={()=>setFabImgOk(false)} />
              ) : (
                <Sparkles size={20} />
              )}
            </button>
          </div>
        ) : activeView === 'insight' ? (
          <div style={{paddingRight:16}}>
            <div className="row mb-4">
              <h1 className="title">카테고리별 진도관리 대시보드</h1>
            </div>

            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-title" style={{display:'flex',alignItems:'center',gap:6}}><Percent size={14}/> 평균 진도율</div>
                <div className="kpi-value">{kpis.avgProgress}% <span className="kpi-sub">/ 목표 {kpis.avgTarget}%</span></div>
              </div>
              <div className="kpi">
                <div className="kpi-title" style={{display:'flex',alignItems:'center',gap:6}}><AlertTriangle size={14}/> 실적 부진 카테고리</div>
                <div className="kpi-value">{kpis.riskCnt}</div>
              </div>
              <div className="kpi">
                <div className="kpi-title" style={{display:'flex',alignItems:'center',gap:6}}><TrendingUp size={14}/> 개선 중 카테고리</div>
                <div className="kpi-value">{kpis.improving}</div>
              </div>
              <div className="kpi">
                <div className="kpi-title" style={{display:'flex',alignItems:'center',gap:6}}><Lightbulb size={14}/> 코칭 제안</div>
                <button className="kpi-value" style={{all:'unset',cursor:'pointer'}} onClick={()=>{setPanelOpen(true)}}>
                  {kpis.coachCount}<span className="kpi-sub"> · 우선 {kpis.highCount}</span>
                </button>
              </div>
            </div>

            <div className="insight-grid">
              <Card>
                <CardHeader>
                  <CardTitle>카테고리별 진도 vs 목표</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart data={categorySeries} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>주간 변화</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart points={weeklySeries} />
                </CardContent>
              </Card>
            </div>

            <div className="insight-grid">
              <Card>
                <CardHeader>
                  <CardTitle>카테고리 리스트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="table-like">
                    <div className="t-head">
                      <div>카테고리</div><div>목표</div><div>진도(시간)</div><div>완료시간</div><div>상태</div>
                    </div>
                    {[
                      { category: '운동', list: workoutList },
                      { category: '토익', list: toeicList },
                      ...extraCategories.map(cat => ({
                        category: cat.name,
                        list: getExtraList(cat.id)
                      }))
                    ].map(r => {
                      const totalTime = r.list.reduce((sum, item) => sum + (item.time || 0), 0)
                      const completedTime = r.list.filter(item => item.done).reduce((sum, item) => sum + (item.time || 0), 0)
                      const progress = totalTime > 0 ? Math.round((completedTime / totalTime) * 100) : 0
                      const risk = progress < 50
                      const onTrack = progress >= 80
                      return (
                        <div key={r.category} className="t-row">
                          <div className="t-cell name">{r.category}</div>
                          <div className="t-cell">100%</div>
                          <div className="t-cell">
                            <div className="progress-track"><div className="progress-fill" style={{width: progress + '%'}} /></div>
                            <span className="small" style={{marginLeft:8}}>{progress}%</span>
                          </div>
                          <div className="t-cell">
                            <span className="small">{completedTime}분 / {totalTime}분</span>
                          </div>
                          <div className="t-cell">
                            {onTrack ? (
                              <span className="badge badge-green" title="목표 달성">목표 달성</span>
                            ) : risk ? (
                              <span className="badge badge-rose" title="목표치 대비 50%p 이상 미달">미달 위험</span>
                            ) : (
                              <span className="badge badge-amber" title="목표 대비 약간 부족 (추가 보강 필요)">보강 필요</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>AI 인사이트(요약)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="insight-list">
                    {(() => {
                      const categories = [
                        { name: '운동', list: workoutList },
                        { name: '토익', list: toeicList },
                        ...extraCategories.map(cat => ({
                          name: cat.name,
                          list: getExtraList(cat.id)
                        }))
                      ]
                      
                      const timeBasedCategories = categories.map(cat => {
                        const totalTime = cat.list.reduce((sum, item) => sum + (item.time || 0), 0)
                        const completedTime = cat.list.filter(item => item.done).reduce((sum, item) => sum + (item.time || 0), 0)
                        const progress = totalTime > 0 ? Math.round((completedTime / totalTime) * 100) : 0
                        return { ...cat, totalTime, completedTime, progress }
                      })
                      
                      const lowestCategory = timeBasedCategories.reduce((lowest, cat) => 
                        cat.progress < lowest.progress ? cat : lowest
                      )
                      
                      const totalCompletedTime = timeBasedCategories.reduce((sum, cat) => sum + cat.completedTime, 0)
                      const totalPlannedTime = timeBasedCategories.reduce((sum, cat) => sum + cat.totalTime, 0)
                      
                      return (
                        <>
                          {/* 시간 기준 진도율 */}
                          <li className="mb-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-blue-600">⏱️</span>
                                <span className="font-semibold text-blue-800">시간 기준 진도율</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-900 mb-1">
                                {totalCompletedTime}분 / {totalPlannedTime}분
                              </div>
                              <div className="text-sm text-blue-700 mb-2">
                                {Math.round((totalCompletedTime / totalPlannedTime) * 100)}% 완료
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{width: `${Math.min(100, Math.round((totalCompletedTime / totalPlannedTime) * 100))}%`}}
                                ></div>
                              </div>
                              <div className="text-xs text-blue-600 mt-2">
                                → 계획된 시간 대비 실제 완료된 시간을 기준으로 진도를 측정합니다.
                              </div>
                            </div>
                          </li>

                          {/* 가장 낮은 카테고리 */}
                          <li className="mb-4">
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-amber-600">⚠️</span>
                                <span className="font-semibold text-amber-800">가장 낮은 카테고리</span>
                              </div>
                              <div className="text-lg font-bold text-amber-900 mb-1">
                                "{lowestCategory.name}" (진도 {lowestCategory.progress}%)
                              </div>
                              <div className="text-sm text-amber-700 mb-2">
                                {lowestCategory.totalTime}분 중 {lowestCategory.completedTime}분 완료
                              </div>
                              <div className="text-xs text-amber-600">
                                → 단기 테스크(10~15분)를 정해 꾸준히 수행하는 습관을 들이세요.
                              </div>
                            </div>
                          </li>

                          {/* 시간 관리 팁 */}
                          <li className="mb-4">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-600">💡</span>
                                <span className="font-semibold text-green-800">시간 관리 팁</span>
                              </div>
                              <div className="text-sm text-green-700">
                                → 각 todo에 현실적인 시간을 설정하고, 완료 후 실제 소요 시간을 기록하여 더 정확한 계획 수립에 활용하세요.
                              </div>
                            </div>
                          </li>

                          {/* 권장 보강 루틴 */}
                          <li className="mb-4">
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-purple-600">🎯</span>
                                <span className="font-semibold text-purple-800">권장 보강 루틴</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded border border-purple-100">
                                  <div className="font-medium text-purple-800 mb-1">근력/유산소</div>
                                  <div className="text-sm text-purple-600">30분 단위로 분할하여 지속 가능한 루틴 구성</div>
                                </div>
                                <div className="bg-white p-3 rounded border border-purple-100">
                                  <div className="font-medium text-purple-800 mb-1">토익 RC/LC</div>
                                  <div className="text-sm text-purple-600">20분 집중 학습 + 10분 복습으로 효율성 극대화</div>
                                </div>
                                <div className="bg-white p-3 rounded border border-purple-100">
                                  <div className="font-medium text-purple-800 mb-1">영어 회화</div>
                                  <div className="text-sm text-purple-600">15분씩 하루 2-3회로 자연스러운 대화 연습</div>
                                </div>
                                <div className="bg-white p-3 rounded border border-purple-100">
                                  <div className="font-medium text-purple-800 mb-1">study</div>
                                  <div className="text-sm text-purple-600">25분 집중 + 5분 휴식으로 효율적인 학습 진행</div>
                                </div>
                              </div>
                            </div>
                          </li>
                        </>
                      )
                    })()}

                  </ul>
                </CardContent>
              </Card>
            </div>

            {panelOpen && (
              <div className="drawer">
                <div className="drawer-mask" onClick={()=>setPanelOpen(false)} />
                <div className="drawer-panel">
                  <div className="drawer-header">
                    <div>
                      <div className="small" style={{color:'#64748b'}}>오늘의 코칭 제안</div>
                      <div className="title">{suggestions.filter(s=>s.status==='open').length}건</div>
                    </div>
                    <button className="btn" onClick={()=>setPanelOpen(false)}>닫기</button>
                  </div>
                  <div className="drawer-body">
                    {suggestions.filter(s=>s.status==='open').map(s=> (
                      <Card key={s.id} className="mb-3">
                        <CardHeader>
                          <CardTitle>
                            <span className={"dot " + (s.severity==='high'?'dot-rose':s.severity==='medium'?'dot-amber':'dot-gray')} /> [{s.category}]
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div style={{fontSize:13, fontWeight:600, marginBottom:6}}>{s.title}</div>
                          <div className="small" style={{color:'#64748b', marginBottom:12}}>{s.rationale}</div>
                          <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            <button className="btn btn-dark" onClick={()=>handleApplySuggestion(s)}>적용</button>
                            <button className="btn" onClick={()=>setSuggestions(prev=>prev.map(x=>x.id===s.id?{...x,status:'dismissed'}:x))}>나중에</button>
                            <span className="small" style={{color:'#94a3b8'}}>· {s.action.label}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeView === 'files' ? (
          <div style={{padding: 8}}>
            <MultiDomainCoachHub />
          </div>
        ) : activeView === 'journey' ? (
          <div style={{padding: 8}}>
            <GuidedJourneyDemo onOpenSidePanel={openSidePanel} />
          </div>
        ) : (
          <div style={{padding: 8}}>
            {/* AI 코칭 인포그래픽 */}
            <div className="mb-6 text-center">
              <img 
                src="../ai-coaching-infographic.svg" 
                alt="AI 코칭 프로세스" 
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onLoad={() => console.log('AI 코칭 이미지 로드 성공')}
                onError={(e) => console.error('AI 코칭 이미지 로드 실패:', e)}
              />
              <p style={{marginTop: '8px', fontSize: '12px', color: '#666'}}>
                AI 코칭 프로세스: 데이터 입력 → AI 분석 → 맞춤 코칭 제공
              </p>
            </div>
            <AICoachShell />
          </div>
        )}
      </main>

      {/* Right Aside: 항상 렌더링 (열림 시 360px, 닫힘 시 0px) */}
      <aside className="aside" style={{ padding: isRightOpen ? 16 : 0, overflow: 'hidden', transition: 'padding 200ms ease' }}>

        {isRightAllowed ? (
        rightPanel.type === 'todo' ? (
        <>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}} className="mb-3">
                      <h2 style={{fontSize: '18px', fontWeight: 700}}>오늘의 할 일</h2>
                      <button className="btn btn-xs" onClick={()=>setShowAddCategory(s=>!s)}>카테고리 추가</button>
                    </div>
                    {showAddCategory && (
                      <div style={{display:'flex', gap:8, marginBottom: 16}}>
                        <input className="input" value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} placeholder="카테고리명 입력" />
                        <button className="btn btn-dark" onClick={addCategory}>추가</button>
                      </div>
                    )}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>근력/유산소 <button className="btn btn-xs" style={{marginLeft:8}} onClick={()=>{setShowAddInput(s=>({...s,workout:!s.workout})); setNewTodoText('')}}>+</button></CardTitle>
          </CardHeader>
          <CardContent>
            {showAddInput.workout && (
              <div style={{display:'flex', gap:8, marginBottom:8}}>
                <input value={newTodoText} onChange={e=>setNewTodoText(e.target.value)} placeholder={`${date.toLocaleDateString()} 일정 입력`} className="input" />
                <input 
                  id="workout-time-input"
                  type="number" 
                  min="0" 
                  placeholder="분" 
                  className="input" 
                  style={{width: '80px'}}
                />
                <button className="btn btn-dark" onClick={()=>addTodo('근력/유산소')}>추가</button>
              </div>
            )}
            <ul className="list">
              {workoutList.map(it=> (
                <li key={it.id} className={'item ' + (it.done?'strike':'')} onClick={()=>toggleTodo('근력/유산소', it.id)} style={{justifyContent:'space-between'}}>
                  <span>{it.label} {it.time > 0 && <span className="text-xs text-gray-500">({it.time}분)</span>}</span>
                  <span>
                    <input type="checkbox" className="checkbox" checked={it.done} onChange={()=>toggleTodo('근력/유산소', it.id)} onClick={e=>e.stopPropagation()} />
                    <button className="btn btn-xs" style={{marginLeft:8}} onClick={(e)=>{e.stopPropagation(); deleteTodo('근력/유산소', it.id)}}>삭제</button>
                  </span>
                </li>
              ))}
              {workoutList.length===0 && <li className="small" style={{color:'#64748b'}}>선택한 날짜에 일정이 없습니다.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>토익 RC/LC <button className="btn btn-xs" style={{marginLeft:8}} onClick={()=>{setShowAddInput(s=>({...s,toeic:!s.toeic})); setNewTodoText('')}}>+</button></CardTitle>
          </CardHeader>
          <CardContent>
            {showAddInput.toeic && (
              <div style={{display:'flex', gap:8, marginBottom:8}}>
                <input value={newTodoText} onChange={e=>setNewTodoText(e.target.value)} placeholder={`${date.toLocaleDateString()} 일정 입력`} className="input" />
                <input 
                  id="toeic-time-input"
                  type="number" 
                  min="0" 
                  placeholder="분" 
                  className="input" 
                  style={{width: '80px'}}
                />
                <button className="btn btn-dark" onClick={()=>addTodo('토익 RC/LC')}>추가</button>
              </div>
            )}
            <ul className="list">
              {toeicList.map(it=> (
                <li key={it.id} className={'item ' + (it.done?'strike':'')} onClick={()=>toggleTodo('토익 RC/LC', it.id)} style={{justifyContent:'space-between'}}>
                  <span>{it.label} {it.time > 0 && <span className="text-xs text-gray-500">({it.time}분)</span>}</span>
                  <span>
                    <input type="checkbox" className="checkbox" checked={it.done} onChange={()=>toggleTodo('토익 RC/LC', it.id)} onClick={e=>e.stopPropagation()} />
                    <button className="btn btn-xs" style={{marginLeft:8}} onClick={(e)=>{e.stopPropagation(); deleteTodo('토익 RC/LC', it.id)}}>삭제</button>
                  </span>
                </li>
              ))}
              {toeicList.length===0 && <li className="small" style={{color:'#64748b'}}>선택한 날짜에 일정이 없습니다.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>영어 회화 <button className="btn btn-xs" style={{marginLeft:8}} onClick={()=>{setShowAddInput(s=>({...s,englishConversation:!s.englishConversation})); setNewTodoText('')}}>+</button></CardTitle>
          </CardHeader>
          <CardContent>
            {showAddInput.englishConversation && (
              <div style={{display:'flex', gap:8, marginBottom:8}}>
                <input value={newTodoText} onChange={e=>setNewTodoText(e.target.value)} placeholder={`${date.toLocaleDateString()} 일정 입력`} className="input" />
                <input 
                  id="englishConversation-time-input"
                  type="number" 
                  min="0" 
                  placeholder="분" 
                  className="input" 
                  style={{width: '80px'}}
                />
                <button className="btn btn-dark" onClick={()=>addTodo('영어 회화')}>추가</button>
              </div>
            )}
            <ul className="list">
              {englishConversationList.map(it=> (
                <li key={it.id} className={'item ' + (it.done?'strike':'')} onClick={()=>toggleTodo('영어 회화', it.id)} style={{justifyContent:'space-between'}}>
                  <span>{it.label} {it.time > 0 && <span className="text-xs text-gray-500">({it.time}분)</span>}</span>
                  <span>
                    <input type="checkbox" className="checkbox" checked={it.done} onChange={()=>toggleTodo('영어 회화', it.id)} onClick={e=>e.stopPropagation()} />
                    <button className="btn btn-xs" style={{marginLeft:8}} onClick={(e)=>{e.stopPropagation(); deleteTodo('영어 회화', it.id)}}>삭제</button>
                  </span>
                </li>
              ))}
              {englishConversationList.length===0 && <li className="small" style={{color:'#64748b'}}>선택한 날짜에 일정이 없습니다.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>study <button className="btn btn-xs" style={{marginLeft:8}} onClick={()=>{setShowAddInput(s=>({...s,study:!s.study})); setNewTodoText('')}}>+</button></CardTitle>
          </CardHeader>
          <CardContent>
            {showAddInput.study && (
              <div style={{display:'flex', gap:8, marginBottom:8}}>
                <input value={newTodoText} onChange={e=>setNewTodoText(e.target.value)} placeholder={`${date.toLocaleDateString()} 일정 입력`} className="input" />
                <input 
                  id="study-time-input"
                  type="number" 
                  min="0" 
                  placeholder="분" 
                  className="input" 
                  style={{width: '80px'}}
                />
                <button className="btn btn-dark" onClick={()=>addTodo('study')}>추가</button>
              </div>
            )}
            <ul className="list">
              {studyList.map(it=> (
                <li key={it.id} className={'item ' + (it.done?'strike':'')} onClick={()=>toggleTodo('study', it.id)} style={{justifyContent:'space-between'}}>
                  <span>{it.label} {it.time > 0 && <span className="text-xs text-gray-500">({it.time}분)</span>}</span>
                  <span>
                    <input type="checkbox" className="checkbox" checked={it.done} onChange={()=>toggleTodo('study', it.id)} onClick={e=>e.stopPropagation()} />
                    <button className="btn btn-xs" style={{marginLeft:8}} onClick={(e)=>{e.stopPropagation(); deleteTodo('study', it.id)}}>삭제</button>
                  </span>
                </li>
              ))}
              {studyList.length===0 && <li className="small" style={{color:'#64748b'}}>선택한 날짜에 일정이 없습니다.</li>}
            </ul>
          </CardContent>
        </Card>

        {extraCategories.map(cat => {
          const list = getExtraList(cat.id)
          return (
            <Card key={cat.id} className="mb-3">
              <CardHeader>
                <CardTitle>{cat.name} 
                  <button className="btn btn-xs" style={{marginLeft:8}} onClick={()=>setShowAddInputExtra(prev=>({...prev, [cat.id]: !prev[cat.id]}))}>+</button>
                  <button className="btn btn-xs" style={{marginLeft:8}} onClick={()=>deleteCategory(cat.id)}>🗑️</button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showAddInputExtra[cat.id] && (
                  <div style={{display:'flex', gap:8, marginBottom:8}}>
                    <input className="input" value={newTodoTextExtra[cat.id]||''} onChange={e=>setNewTodoTextExtra(prev=>({...prev, [cat.id]: e.target.value}))} placeholder={`${date.toLocaleDateString()} 일정 입력`} />
                    <input 
                      id={`extra-${cat.id}-time-input`}
                      type="number" 
                      min="0" 
                      placeholder="분" 
                      className="input" 
                      style={{width: '80px'}}
                    />
                    <button className="btn btn-dark" onClick={()=>addExtraTodo(cat.id)}>추가</button>
                  </div>
                )}
                <ul className="list">
                  {list.map(it => (
                    <li key={it.id} className={'item ' + (it.done?'strike':'')} onClick={()=>toggleExtraTodo(cat.id, it.id)} style={{justifyContent:'space-between'}}>
                      <span>{it.label} {it.time > 0 && <span className="text-xs text-gray-500">({it.time}분)</span>}</span>
                      <span>
                        <input type="checkbox" className="checkbox" checked={it.done} onChange={()=>toggleExtraTodo(cat.id, it.id)} onClick={e=>e.stopPropagation()} />
                        <button className="btn btn-xs" style={{marginLeft:8}} onClick={(e)=>{e.stopPropagation(); deleteExtraTodo(cat.id, it.id)}}>삭제</button>
                      </span>
                    </li>
                  ))}
                  {list.length===0 && <li className="small" style={{color:'#64748b'}}>선택한 날짜에 일정이 없습니다.</li>}
                </ul>
              </CardContent>
            </Card>
          )
        })}

        
        </>
        ) : (
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}} className="mb-3">
            <h2 style={{fontSize: '18px', fontWeight: 700}}>
              {
              rightPanel.type === 'pdf-report' ? 'PDF 리포트' :
              rightPanel.type === 'wrong-note' ? '오답노트' :
              rightPanel.type === 'supplementary-quiz' ? '보충문제' : '내보내기'
              }
            </h2>
          </div>
          <Card className="mb-3">
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              {rightPanel.type === 'pdf-report' && (
                <div className="small">
                  <p><b>PDF 리포트 미리보기</b></p>
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                      <h4 className="font-semibold text-blue-800 mb-2">점수 요약</h4>
                      <p className="text-sm text-blue-700">점수: 78점 (13/20), 평균 정답률: 65%</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                      <h4 className="font-semibold text-green-800 mb-2">개념 분석</h4>
                      <p className="text-sm text-green-700">수와 연산, 기하, 확률과 통계, 문자와 식</p>
                      <p className="text-sm text-red-600">취약: 분수 나눗셈, 속력 공식</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                      <h4 className="font-semibold text-yellow-800 mb-2">그래프/시각화</h4>
                      <p className="text-sm text-yellow-700">정답률 그래프, 개념별 취약도 차트</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
                      <h4 className="font-semibold text-purple-800 mb-2">피드백 코멘트</h4>
                      <p className="text-sm text-purple-700">수학의 기초 개념들은 잘 이해하고 있으나, 분수 나눗셈과 속력 공식에서 단위 변환에 어려움을 보입니다.</p>
                    </div>
                  </div>
                </div>
              )}
              {rightPanel.type === 'wrong-note' && (
                <div className="small">
                  <p><b>오답노트 미리보기</b></p>
                  <div className="space-y-3">
                    <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                      <h4 className="font-semibold text-red-800 mb-2">틀린 문제 원문</h4>
                      <p className="text-sm text-red-700">5번: 분수 나눗셈 문제</p>
                      <p className="text-sm text-red-700">8번: 속력 계산 문제</p>
                      <p className="text-sm text-red-700">11번: 확률 계산 문제</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                      <h4 className="font-semibold text-orange-800 mb-2">내 풀이 흔적</h4>
                      <p className="text-sm text-orange-700">"역수? 어떻게?" (5번)</p>
                      <p className="text-sm text-orange-700">"단위 변환 복잡함" (8번)</p>
                      <p className="text-sm text-orange-700">"표본공간이 뭐지?" (11번)</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                      <h4 className="font-semibold text-blue-800 mb-2">정답/해설</h4>
                      <p className="text-sm text-blue-700">5번: 역수 곱하기를 깜빡함</p>
                      <p className="text-sm text-blue-700">8번: km/h → m/s 변환 오류</p>
                      <p className="text-sm text-blue-700">11번: 표본공간 설정 안됨</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                      <h4 className="font-semibold text-green-800 mb-2">비고란</h4>
                      <p className="text-sm text-green-700">학생이 직접 메모할 수 있는 공간</p>
                    </div>
                  </div>
                </div>
              )}
              {rightPanel.type === 'supplementary-quiz' && (
                <div className="small">
                  <p><b>보충문제 미리보기</b></p>
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                      <h4 className="font-semibold text-blue-800 mb-2">자동 생성 문제</h4>
                      <p className="text-sm text-blue-700">틀린 개념 위주로 난이도 조정</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                      <h4 className="font-semibold text-green-800 mb-2">개념별 문제</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• 분수 나눗셈: 2문항 (쉬움)</li>
                        <li>• 속력 공식: 2문항 (보통)</li>
                        <li>• 확률 기초: 2문항 (보통)</li>
                        <li>• 도형의 성질: 1문항 (어려움)</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
                      <h4 className="font-semibold text-purple-800 mb-2">추천 학습 루트</h4>
                      <p className="text-sm text-purple-700">1. 분수 나눗셈 → 2. 속력 공식 → 3. 확률 기초 → 4. 도형의 성질</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                      <h4 className="font-semibold text-yellow-800 mb-2">정답 및 해설</h4>
                      <p className="text-sm text-yellow-700">모든 문제에 상세한 해설 포함</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {rightPanel.type === 'pdf-report' && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 AI 코치 연동 안내</strong><br/>
                이 버튼을 클릭하면 시험지 메타데이터가 AI 코치에 자동으로 전송되어, 
                정밀한 학습 경험과 상세한 코칭을 받을 수 있습니다.
              </p>
            </div>
          )}
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-dark">다운로드</button>
            {rightPanel.type === 'wrong-note' && (
              <button 
                className="btn btn-outline" 
                title="오답노트 새로고침"
                onClick={() => {
                  // 오답노트 새로고침 로직
                  console.log('오답노트 새로고침')
                }}
              >
                <RefreshCw size={16} />
              </button>
            )}
            {rightPanel.type === 'pdf-report' && (
              <button 
                className="btn btn-dark" 
                onClick={() => {
                  // 시험지 메타데이터를 LLM 챗봇에 전송
                  const examData = {
                    score: 78,
                    totalQuestions: 20,
                    correctAnswers: 13,
                    weakConcepts: ['분수 나눗셈', '속력 공식', '확률 기초'],
                    coveredConcepts: ['수와 연산', '기하', '확률과 통계', '문자와 식'],
                    summaryComment: '수학의 기초 개념들은 잘 이해하고 있으나, 분수 나눗셈과 속력 공식에서 단위 변환에 어려움을 보입니다.'
                  }
                  
                  // AI 코치로 전송하는 이벤트 발생
                  window.dispatchEvent(new CustomEvent('send-to-llm', { 
                    detail: { 
                      type: 'exam-metadata', 
                      data: examData,
                      message: `시험지 분석 결과가 AI 코치에 전송되었습니다. 이제 AI 코치에서 정밀한 학습 경험과 상세한 코칭을 받을 수 있습니다.`
                    } 
                  }))
                  
                  // NOMA lab 탭으로 이동
                  setActiveView('journey')
                }}
                              >
                  AI 코치로 보내기
                </button>
            )}
            <button className="btn" onClick={()=>setRightPanel({ type: 'todo', payload: null })}>닫기</button>
          </div>
        </>
        ) ) : null}
      </aside>
    </div>
  )
}
