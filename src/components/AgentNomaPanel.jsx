import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AgentNomaPanel({ onAccept, onClose }) {
  const [step, setStep] = useState('form') // 'form' | 'qa' | 'loading' | 'result'
  const [voiceActive, setVoiceActive] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [results, setResults] = useState([]) // [{category, label, time?}]
  const [error, setError] = useState('')
  const [qa, setQa] = useState({
    amount: '', // 분량/난이도
    deadline: '', // 언제까지
    timeOfDay: '', // 어느 시간대
    duration: '' // 몇 분 정도
  })
  const recognitionRef = useRef(null)

  const ensureRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null
    const rec = new SR()
    rec.lang = 'ko-KR'
    rec.interimResults = true
    rec.continuous = true
    rec.onresult = (e) => {
      let finalText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += chunk
      }
      if (finalText) setPrompt(prev => (prev ? prev + ' ' : '') + finalText.trim())
    }
    rec.onend = () => {
      if (voiceActive) {
        try { rec.start() } catch (_) {}
      }
    }
    recognitionRef.current = rec
    return rec
  }

  const toggleVoice = () => {
    const rec = ensureRecognition()
    if (!rec) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.')
      return
    }
    setVoiceActive(v => {
      const next = !v
      try {
        if (next) rec.start(); else rec.stop()
      } catch (_) {}
      return next
    })
  }

  const callLLM = async (userPrompt) => {
    const endpoint = import.meta.env.VITE_LLM_ENDPOINT
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
    // 1) 커스텀 엔드포인트 우선 (권장: 백엔드 프록시)
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt })
      })
      if (!res.ok) throw new Error('LLM 엔드포인트 호출 실패')
      return await res.json() // 기대 형태: { items: [{category,label,time?}] }
    }
    // 2) 데모용 OpenAI 직접 호출 (프론트 노출 위험)
    if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '당신은 학습/운동 스케줄러입니다. JSON만 반환하세요.' },
            { role: 'user', content: `${userPrompt}\n한국어로, 다음 JSON 형식으로 2~5개 제안만:
{"items":[{"category":"toeic|workout|기타","label":"문장 그대로의 일정 설명 (예: 매일 RC 속독 복습 - 10:00 ~ 13:00)"}]}` }
          ],
          temperature: 0.2
        })
      })
      if (!res.ok) throw new Error('OpenAI 호출 실패')
      const data = await res.json()
      const content = data.choices?.[0]?.message?.content || '{}'
      try {
        return JSON.parse(content)
      } catch (_) {
        return { items: [] }
      }
    }
    // 3) 폴백: 하드코딩 예시
    return {
      items: [
        { category: 'toeic', label: '매일 RC 속독 유형 복습 - 10:00 ~ 13:00' },
        { category: 'toeic', label: 'LC 파트별 10분 미니테스트 - 10:00 ~ 13:00' },
      ]
    }
  }

  const generate = async () => {
    setError('')
    setStep('loading')
    try {
      const enriched = `${prompt}\n요구사항: 분량=${qa.amount||'보통'}, 마감=${qa.deadline||'이번 주'}, 시간대=${qa.timeOfDay||'오전'}, 소요시간=${qa.duration||'25분'}`
      const r = await callLLM(enriched || '토익 고득점 계획')
      const items = Array.isArray(r?.items) ? r.items : []
      setResults(items)
      setStep('result')
    } catch (e) {
      setError(e.message || '생성 중 오류가 발생했습니다.')
      setResults([])
      setStep('result')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="card"
          >
            <div className="card-content">
              <div className="mb-2" style={{ fontSize: 16, fontWeight: 600 }}>무엇을 하고 싶으신가요?</div>
              <textarea
                value={prompt}
                onChange={e=>setPrompt(e.target.value)}
                placeholder="예: 토익 고득점, 영어 회화 실력 향상 등"
                rows={3}
                style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:10, resize:'none' }}
              />

              <div className="small" style={{color:'#64748b', marginTop:8}}>전송 후 NOMA가 세부 질문을 추가로 드려요: 분량, 마감, 시간대, 소요시간 등</div>

              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                <button className={`btn ${voiceActive ? 'btn-dark' : ''}`} onClick={toggleVoice}>
                  {voiceActive ? '음성 인식 중지' : '음성 인식 시작'}
                </button>
                <span className="small">{voiceActive ? '음성을 수집 중입니다...' : '클릭하여 음성 인식'}</span>
              </div>

              <div style={{ marginTop:12 }}>
                <button className="btn btn-dark" style={{ width:'100%' }} onClick={()=>setStep('qa')}>전송</button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'qa' && (
          <motion.div
            key="qa"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="card"
          >
            <div className="card-content">
              <div className="mb-2" style={{ fontSize: 16, fontWeight: 600 }}>몇 가지만 더 알려주세요</div>
              <div className="grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                <input className="input" placeholder="분량/난이도 (예: 보통)" value={qa.amount} onChange={e=>setQa(prev=>({...prev, amount: e.target.value}))} />
                <input className="input" placeholder="언제까지? (예: 이번 주)" value={qa.deadline} onChange={e=>setQa(prev=>({...prev, deadline: e.target.value}))} />
                <input className="input" placeholder="어느 시간대? (예: 오전)" value={qa.timeOfDay} onChange={e=>setQa(prev=>({...prev, timeOfDay: e.target.value}))} />
                <input className="input" placeholder="몇 분 정도? (예: 25분)" value={qa.duration} onChange={e=>setQa(prev=>({...prev, duration: e.target.value}))} />
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
                <button className="btn" onClick={()=>setStep('form')}>이전</button>
                <button className="btn btn-dark" onClick={generate}>추천 일정 생성</button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="card"
          >
            <div className="card-content" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div className="mb-2" style={{ width:48, height:48, borderRadius:'9999px', border:'3px solid #e5e7eb', borderTopColor:'#0ea5e9', animation:'spin 1s linear infinite' }} />
              <p>일정을 생성 중입니다...</p>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="card"
          >
            <div className="card-content">
              <div className="mb-2" style={{ fontSize: 15, fontWeight: 600 }}>생성된 일정</div>
              {error && <div className="mb-2 small" style={{ color:'#dc2626' }}>{error}</div>}
              <ul className="list mb-2">
                {results.length === 0 && (
                  <li className="item" style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:10 }}>결과가 없습니다.</li>
                )}
                {results.map((it, idx) => (
                  <li key={idx} className="item" style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:10 }}>
                    {it.label}
                  </li>
                ))}
              </ul>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button className="btn" onClick={() => setStep('form')}>Retry</button>
                <button className="btn btn-dark" onClick={() => { if (onAccept) onAccept(results); if (onClose) onClose(); }}>Accept</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}


