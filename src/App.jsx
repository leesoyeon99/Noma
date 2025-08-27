import React, { useState, useMemo, useEffect } from 'react'
import AgentNomaPanel from './components/AgentNomaPanel'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { CalendarDays, Sparkles, Percent, AlertTriangle, TrendingUp, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [showAddInput, setShowAddInput] = useState({ workout:false, toeic:false })
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
      (list||[]).forEach(it => pushEvent('workout', dk, it))
    })
    Object.entries(toeicTodosByDate).forEach(([dk, list]) => {
      (list||[]).forEach(it => pushEvent('toeic', dk, it))
    })
    Object.entries(extraTodosByDate).forEach(([catId, byDate]) => {
      Object.entries(byDate||{}).forEach(([dk, list]) => {
        (list||[]).forEach(it => pushEvent('etc', dk, it))
      })
    })
    return events
  }, [workoutTodosByDate, toeicTodosByDate, extraTodosByDate])

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
  }, [selectedDateKey])

  const addTodo = (category) => {
    const text = newTodoText.trim()
    if (!text) return
    const newItem = { id: `${category}-${Date.now()}`, label: text, done: false }
    if (category === 'workout') {
      setWorkoutTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] ?? []), newItem]
      }))
    } else {
      setToeicTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] ?? []), newItem]
      }))
    }
    setNewTodoText('')
    setShowAddInput({ workout:false, toeic:false })
  }

  const deleteTodo = (category, id) => {
    if (category === 'workout') {
      setWorkoutTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: (prev[selectedDateKey] ?? []).filter(it=>it.id!==id)
      }))
    } else {
      setToeicTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: (prev[selectedDateKey] ?? []).filter(it=>it.id!==id)
      }))
    }
    // 타임라인에서 동일 todoId & dateKey 기록 제거
    setTimeline(prev => prev.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
  }

  const toggleTodo = (category, id) => {
    if (category === 'workout') {
      setWorkoutTodosByDate(prev => {
        const prevList = prev[selectedDateKey] ?? []
        const before = prevList.find(it => it.id === id)
        const updatedList = prevList.map(it=> it.id===id?{...it,done:!it.done}:it)
        const after = updatedList.find(it => it.id === id)
        if (before && after) {
          if (!before.done && after.done) {
            addTimelineEntry({ category: '운동', label: after.label, todoId: id, dateKey: selectedDateKey })
          }
          if (before.done && !after.done) {
            setTimeline(prev => prev.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
          }
        }
        return { ...prev, [selectedDateKey]: updatedList }
      })
    } else {
      setToeicTodosByDate(prev => {
        const prevList = prev[selectedDateKey] ?? []
        const before = prevList.find(it => it.id === id)
        const updatedList = prevList.map(it=> it.id===id?{...it,done:!it.done}:it)
        const after = updatedList.find(it => it.id === id)
        if (before && after) {
          if (!before.done && after.done) {
            addTimelineEntry({ category: '토익', label: after.label, todoId: id, dateKey: selectedDateKey })
          }
          if (before.done && !after.done) {
            setTimeline(prev => prev.filter(t => t.todoId !== id || t.dateKey !== selectedDateKey))
          }
        }
        return { ...prev, [selectedDateKey]: updatedList }
      })
    }
  }

  // 간단 차트용 데이터
  const categorySeries = [
    { category: '운동', progress: computeListCompletion(workoutList), target: 100 },
    { category: '토익', progress: computeListCompletion(toeicList), target: 100 },
    ...extraCategories.map(cat => ({
      category: cat.name,
      progress: computeListCompletion((extraTodosByDate[cat.id]?.[selectedDateKey]) ?? []),
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
    const newItem = { id: `${catId}-${Date.now()}`, label: text, done: false }
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
    if (catId === 'workout') return countDoneInMap(workoutTodosByDate, dateKeys)
    if (catId === 'toeic') return countDoneInMap(toeicTodosByDate, dateKeys)
    const catMap = extraTodosByDate[catId] || {}
    return dateKeys.reduce((acc, k) => acc + ((catMap[k] || []).filter(it => it.done).length), 0)
  }

  const getCategoryLabel = (catId) => {
    if (catId === 'workout') return '운동'
    if (catId === 'toeic') return '토익'
    const cat = extraCategories.find(c => c.id === catId)
    return cat ? cat.name : catId
  }

  const computeWeeklyDeltaPoints = () => {
    const thisWeekKeys = getWeekDateKeys(date, 0)
    const lastWeekKeys = getWeekDateKeys(date, -1)
    const catIds = ['workout', 'toeic', ...extraCategories.map(c => c.id)]
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
    if (cat.includes('유산소') || cat.includes('운동')) return 'workout'
    if (cat.includes('토익')) return 'toeic'
    // 나머지는 추가 카테고리로 관리
    return ensureExtraCategoryByName(cat)
  }

  const addTodoForCategory = (catId, label) => {
    const item = { id: `${catId}-${Date.now()}`, label, done: false }
    if (catId === 'workout') {
      setWorkoutTodosByDate(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] || []), item]
      }))
    } else if (catId === 'toeic') {
      setToeicTodosByDate(prev => ({
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
    <div className="container" style={{ gridTemplateColumns: isRightOpen ? '2fr 7fr 3fr' : '2fr 10fr 0fr', transition: 'grid-template-columns 200ms ease' }}>
      {/* 상단 우측 고정 토글 버튼: 홈/캘린더에서만 노출 */}
      {activeView === 'home' && (
        <button
          className="btn"
          onClick={()=>setShowRightAside(v=>!v)}
          style={{position:'fixed', top:12, right:12, zIndex:1000}}
          aria-label="오늘의 투두 토글"
        >
          오늘의 투두 {showRightAside ? (<ChevronRight size={14} style={{verticalAlign:'middle', marginLeft:6}}/>) : (<ChevronLeft size={14} style={{verticalAlign:'middle', marginLeft:6}}/>) }
        </button>
      )}
      {/* Left Sidebar */}
      <aside className="sidebar">
        <h2 style={{fontSize: '18px', fontWeight: 700, marginBottom: 12}}>Mswitch</h2>
        <nav className="nav">
          <p className={activeView==='home' ? 'bold nav-link active' : 'nav-link'} onClick={()=>setActiveView('home')}>홈/캘린더</p>
          <p className={activeView==='insight' ? 'bold nav-link active' : 'nav-link'} onClick={()=>setActiveView('insight')}>인사이트</p>
          <p className={activeView==='journey' ? 'bold nav-link active' : 'nav-link'} onClick={()=>setActiveView('journey')}>가이드 여정</p>
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
                      <span>{t.text}</span>
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
              <div>
                <Tabs value={calendarType} onValueChange={setCalendarType}>
                  <TabsList>
                    <TabsTrigger value="calendar" onValueChange={setCalendarType}>달력</TabsTrigger>
                    <TabsTrigger value="heatmap" onValueChange={setCalendarType}>히트맵 달력</TabsTrigger>
                  </TabsList>
                </Tabs>
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
                <div className="kpi-title" style={{display:'flex',alignItems:'center',gap:6}}><AlertTriangle size={14}/> 리스크 카테고리</div>
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
                      <div>카테고리</div><div>목표</div><div>진도</div><div>주간Δ</div><div>상태</div>
                    </div>
                    {RAW.map(r=>{
                      const risk = r.progress < r.target - 10
                      const onTrack = r.progress >= r.target
                      return (
                        <div key={r.category} className="t-row">
                          <div className="t-cell name">{r.category}</div>
                          <div className="t-cell">{r.target}%</div>
                          <div className="t-cell">
                            <div className="progress-track"><div className="progress-fill" style={{width: r.progress + '%'}} /></div>
                            <span className="small" style={{marginLeft:8}}>{r.progress}%</span>
                          </div>
                          <div className="t-cell" style={{color: r.delta>=0?'#16a34a':'#dc2626'}}>{r.delta>=0?`+${r.delta}`:r.delta}p</div>
                          <div className="t-cell">
                            {onTrack ? (
                              <span className="badge badge-green" title="목표 달성">목표 달성</span>
                            ) : risk ? (
                              <span className="badge badge-rose" title="목표치 대비 10%p 이상 미달">미달 위험</span>
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
                    <li><b>가장 낮은 카테고리</b> "오답노트"(진도 39%)<br/>→ 단기 테스크(10~15분)를 정해 꾸준히 기록·정리하는 습관을 들이세요. 단순히 틀린 문제를 모으는 데서 그치지 말고, 왜 틀렸는지 원인을 분석하고 보완 학습으로 연결하는 것이 중요합니다.</li>
                    <li><b>가장 개선된 카테고리</b> "유산소"(주간 변화 8p)<br/>→ 현재 루틴이 효과적이므로, 강도·시간을 조금씩 늘려 지속적인 성장을 유도하세요. 단, 과부하가 오지 않도록 회복일(휴식 or 저강도 활동)을 포함하는 주간 계획을 세우는 것이 좋습니다.</li>
                    <li><b>목표 미달 카테고리 3개</b>: 유산소, 상체운동, 하체운동<br/>→ 전반적으로 균형이 부족하므로 보강 루틴을 배치하세요.</li>
                    <li>
                      권장 보강 루틴
                      <ul>
                        <li>유산소: 루틴 다양화(예: 달리기 + 자전거 교차)</li>
                        <li>상체운동: 복합 운동(푸시업·풀업 등)으로 근지구력 강화</li>
                        <li>하체운동: 스쿼트·런지 중심으로 주 2~3회 규칙적 수행</li>
                      </ul>
                    </li>
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
                src="/ai-coaching-infographic.svg" 
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
        {isRightOpen && (
          <div style={{display:'flex',justifyContent:'flex-end'}} className="mb-3">
            <button className="btn btn-xs" onClick={()=>setShowRightAside(false)}>접기</button>
          </div>
        )}
        {isRightAllowed ? (
        rightPanel.type === 'todo' ? (
        <>
        <h2 style={{fontSize: '18px', fontWeight: 700}} className="mb-3">20250701 TODOLIST</h2>
        <Card className="mb-3">
          <CardHeader>
            <CardTitle>운동 <button className="btn btn-xs" style={{marginLeft:8}} onClick={()=>{setShowAddInput(s=>({...s,workout:!s.workout})); setNewTodoText('')}}>+</button></CardTitle>
          </CardHeader>
          <CardContent>
            {showAddInput.workout && (
              <div style={{display:'flex', gap:8, marginBottom:8}}>
                <input value={newTodoText} onChange={e=>setNewTodoText(e.target.value)} placeholder={`${date.toLocaleDateString()} 일정 입력`} className="input" />
                <button className="btn btn-dark" onClick={()=>addTodo('workout')}>추가</button>
              </div>
            )}
            <ul className="list">
              {workoutList.map(it=> (
                <li key={it.id} className={'item ' + (it.done?'strike':'')} onClick={()=>toggleTodo('workout', it.id)} style={{justifyContent:'space-between'}}>
                  <span>{it.label}</span>
                  <span>
                    <input type="checkbox" className="checkbox" checked={it.done} onChange={()=>toggleTodo('workout', it.id)} onClick={e=>e.stopPropagation()} />
                    <button className="btn btn-xs" style={{marginLeft:8}} onClick={(e)=>{e.stopPropagation(); deleteTodo('workout', it.id)}}>삭제</button>
                  </span>
                </li>
              ))}
              {workoutList.length===0 && <li className="small" style={{color:'#64748b'}}>선택한 날짜에 일정이 없습니다.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>토익 <button className="btn btn-xs" style={{marginLeft:8}} onClick={()=>{setShowAddInput(s=>({...s,toeic:!s.toeic})); setNewTodoText('')}}>+</button></CardTitle>
          </CardHeader>
          <CardContent>
            {showAddInput.toeic && (
              <div style={{display:'flex', gap:8, marginBottom:8}}>
                <input value={newTodoText} onChange={e=>setNewTodoText(e.target.value)} placeholder={`${date.toLocaleDateString()} 일정 입력`} className="input" />
                <button className="btn btn-dark" onClick={()=>addTodo('toeic')}>추가</button>
              </div>
            )}
            <ul className="list">
              {toeicList.map(it=> (
                <li key={it.id} className={'item ' + (it.done?'strike':'')} onClick={()=>toggleTodo('toeic', it.id)} style={{justifyContent:'space-between'}}>
                  <span>{it.label}</span>
                  <span>
                    <input type="checkbox" className="checkbox" checked={it.done} onChange={()=>toggleTodo('toeic', it.id)} onClick={e=>e.stopPropagation()} />
                    <button className="btn btn-xs" style={{marginLeft:8}} onClick={(e)=>{e.stopPropagation(); deleteTodo('toeic', it.id)}}>삭제</button>
                  </span>
                </li>
              ))}
              {toeicList.length===0 && <li className="small" style={{color:'#64748b'}}>선택한 날짜에 일정이 없습니다.</li>}
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
                    <button className="btn btn-dark" onClick={()=>addExtraTodo(cat.id)}>추가</button>
                  </div>
                )}
                <ul className="list">
                  {list.map(it => (
                    <li key={it.id} className={'item ' + (it.done?'strike':'')} onClick={()=>toggleExtraTodo(cat.id, it.id)} style={{justifyContent:'space-between'}}>
                      <span>{it.label}</span>
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

        <Card className="mb-3">
          <CardHeader>
            <CardTitle>카테고리 추가 <button className="btn btn-xs" style={{marginLeft:8}} onClick={()=>setShowAddCategory(s=>!s)}>+</button></CardTitle>
          </CardHeader>
          <CardContent>
            {showAddCategory && (
              <div style={{display:'flex', gap:8}}>
                <input className="input" value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} placeholder="카테고리명 입력" />
                <button className="btn btn-dark" onClick={addCategory}>추가</button>
              </div>
            )}
          </CardContent>
        </Card>
        </>
        ) : (
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}} className="mb-3">
            <h2 style={{fontSize: '18px', fontWeight: 700}}>
              {
              rightPanel.type === 'pdf' ? 'PDF' :
              rightPanel.type === 'report' ? '리포트' :
              rightPanel.type === 'wrong-note' ? '오답노트' :
              rightPanel.type === 'quiz-set' ? '보완문제' : '내보내기'
              }
            </h2>
          </div>
          <Card className="mb-3">
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              {rightPanel.type === 'pdf' && (
                <div className="small">
                  <p><b>제목</b>: 2025-08-모의고사 진단 리포트</p>
                  <p><b>요약</b>: 점수 78, 정답률 {computeListCompletion(workoutList)}% · 취약개념 5개 · 권장코스 3개</p>
                  <ul className="list" style={{marginTop:8}}>
                    <li className="item">1. 분수 나눗셈 원리 복습 – 25분</li>
                    <li className="item">2. 속력/거리/시간 단위 변환 – 20분</li>
                    <li className="item">3. 확률 기초 재훈련 – 30분</li>
                  </ul>
                </div>
              )}
              {rightPanel.type === 'report' && (
                <div className="small">
                  <p><b>리포트</b>: 진단 요약과 학습 계획</p>
                  <ul className="list" style={{marginTop:8}}>
                    <li className="item">요약 점수/정답률/취약개념</li>
                    <li className="item">주간 학습 계획(3모듈)</li>
                    <li className="item">추천 자료 및 링크</li>
                  </ul>
                </div>
              )}
              {rightPanel.type === 'wrong-note' && (
                <div className="small">
                  <p><b>오답노트</b>: 틀린 문제 정리와 원인 분석</p>
                  <ul className="list" style={{marginTop:8}}>
                    <li className="item">5번: 분수 나눗셈 – 역수 적용 누락</li>
                    <li className="item">8번: 속력 공식 – 단위 변환 오류</li>
                    <li className="item">11번: 확률 – 표본공간 설정 미흡</li>
                  </ul>
                </div>
              )}
              {rightPanel.type === 'quiz-set' && (
                <div className="small">
                  <p><b>보완문제 세트</b>: 취약 개념 기반 10문항</p>
                  <ul className="list" style={{marginTop:8}}>
                    <li className="item">Q1. 3/5 ÷ 2/3 = ?</li>
                    <li className="item">Q4. 54km/h는 m/s로?</li>
                    <li className="item">Q7. 주사위 2개 합이 9일 확률?</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-dark">다운로드</button>
            <button className="btn" onClick={()=>setRightPanel({ type: 'todo', payload: null })}>닫기</button>
          </div>
        </>
        ) ) : null}
      </aside>
    </div>
  )
}
