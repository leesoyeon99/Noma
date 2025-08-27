import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, Brain, Sparkles, Loader2, FileText, Calendar, CheckCircle2, AlertTriangle, Edit3, Trash2, Plus } from "lucide-react";

// 제공 코드의 타입 표기는 제거하고 동일한 로직/레이아웃으로 구성합니다.

const SAMPLE_QUESTIONS = [
  {
    id: "q1",
    number: 5,
    prompt: "동사 시제 일치 (현재완료 vs 과거)",
    userAnswer: "went",
    correctAnswer: "has gone",
    status: "wrong",
    concepts: ["시제", "현재완료", "일치"],
    note: "문장에 since가 있는데 시제 혼동 표시( ? )",
  },
  {
    id: "q2",
    number: 8,
    prompt: "부정사 vs 동명사 (목적어 형태)",
    userAnswer: "to study",
    correctAnswer: "studying",
    status: "wrong",
    concepts: ["부정사", "동명사", "목적어"],
    note: "동사 뒤 목적어 형태 밑줄, '헷갈림' 표시",
  },
  {
    id: "q3",
    number: 12,
    prompt: "관계대명사 that/which 선택",
    userAnswer: "which",
    correctAnswer: "that",
    status: "confused",
    concepts: ["관계대명사"],
    note: "두 선택지에 물음표",
  },
  {
    id: "q4",
    number: 14,
    prompt: "어휘 - 빈칸 추론 (collocation)",
    userAnswer: "strong rain",
    correctAnswer: "heavy rain",
    status: "confused",
    concepts: ["어휘", "연어(colla)", "빈칸"],
    note: "'강한/무거운' 표시와 동그라미",
  },
  {
    id: "q5",
    number: 20,
    prompt: "접속사 vs 전치사 (because of / because)",
    userAnswer: "because the traffic",
    correctAnswer: "because of the traffic",
    status: "wrong",
    concepts: ["접속사", "전치사"],
    note: "of 빠뜨림 체크",
  },
];

function useAggregatedConcepts(items) {
  return useMemo(() => {
    const map = new Map();
    items.forEach((q) => {
      q.concepts.forEach((c) => {
        const cur = map.get(c) || { count: 0, wrong: 0, confused: 0 };
        cur.count += 1;
        if (q.status === "wrong") cur.wrong += 1;
        if (q.status === "confused") cur.confused += 1;
        map.set(c, cur);
      });
    });
    const rows = Array.from(map.entries()).map(([concept, v]) => ({ concept, ...v }));
    rows.sort((a, b) => b.wrong + b.confused - (a.wrong + a.confused));
    return rows;
  }, [items]);
}

function Chip({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-full border text-xs bg-white/60">{children}</span>
  );
}

export default function AIWrongConceptCoachPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  const aggregate = useAggregatedConcepts(analyzed || []);

  const onPick = () => inputRef.current?.click();

  const onFile = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const handleAnalyze = async () => {
    if (!file && !notes.trim()) {
      // 파일이나 노트 중 하나는 있어야 분석 시작 (데모)
      alert("사진을 업로드하거나 노트를 입력해 주세요.");
      return;
    }
    setLoading(true);

    // TODO: 실제 구현 시
    // 1) 업로드된 이미지를 백엔드에 전송 → OCR(문항 영역 감지) → 답/정답 추출
    // 2) 필기 이미지에서 강조/물음표/밑줄 등 신호 탐지 (Vision 모델)
    // 3) LLM으로 문항 → 개념 태그 매핑
    // 4) 사용자 답안 비교로 wrong/confused 결정

    // 데모: 샘플 데이터 + 노트 키워드에 따라 살짝 가중치 조정
    await new Promise((r) => setTimeout(r, 1200));

    let result = [...SAMPLE_QUESTIONS];

    if (notes.toLowerCase().includes("시제")) {
      result = result.map((q) =>
        q.concepts.includes("시제") && q.status !== "wrong"
          ? { ...q, status: "confused" }
          : q
      );
    }

    setAnalyzed(result);

    // (데모) 제안 생성
    const weakTop = useAggregatedConcepts(result).slice(0, 3);
    const sug = weakTop.map((w, i) => ({
      id: `s${i + 1}`,
      text: `${w.concept} 보강을 위해 오늘 20분 단기 연습 세션을 추가하세요`,
      reason: `최근 문항 중 오답/혼동 비율이 높음 (오답 ${w.wrong}, 혼동 ${w.confused})`,
    }));

    // 추가 제안: 루틴 반영
    sug.push({
      id: "sPlan",
      text: "이번 주 월/수/금에 '부정사·동명사' 집중 블록(각 30분)을 생성합니다",
      reason: "마감 2주 전, 개념 갭 해소를 위한 주3회 반복 권장",
    });

    setSuggestions(sug);
    setLoading(false);
  };

  const handleUseSample = () => {
    // 샘플만으로도 분석 진행 (파일 없이)
    setFile(null);
    setPreview(null);
    setNotes("시제, 부정사/동명사, 관계대명사 헷갈림");
  };

  const handleCreatePlan = () => {
    // TODO: 실제 구현 시 캘린더/Agent 모달로 전송
    alert("학습 계획이 생성되었다고 가정합니다. (데모)");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      {/* 상단 세션 헤더 */}
      <div className="card mb-3">
        <div className="card-content">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div>
              <div className="title" style={{fontSize:16}}>토익 800+ 목표</div>
              <div className="small">목표: 10월 모의고사까지 RC/LC 약점 보완 · 마감: 2025-10-15</div>
            </div>
            <button className="btn">세션 설정</button>
          </div>
          <div className="tabs" style={{marginTop:12}}>
            <div className="tab-btn">Overview</div>
            <div className="tab-btn active">Diagnose</div>
            <div className="tab-btn">Coach</div>
            <div className="tab-btn">Plan</div>
            <div className="tab-btn">Insights</div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1" style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
        {/* 업로드 & 노트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 bg-white rounded-2xl shadow p-5"
        >
          <div className="flex items-center gap-2 mb-2"><Brain className="w-5 h-5"/><h2 className="text-lg font-semibold">시험지·노트 분석</h2></div>

          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || undefined)}
            />
            <button
              onClick={onPick}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-slate-50"
            >
              <Upload className="w-4 h-4" /> 사진 업로드
            </button>
            <button
              onClick={handleUseSample}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-slate-50"
            >
              <FileText className="w-4 h-4" /> 샘플 사용
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border rounded-xl p-3 min-h-[180px] flex items-center justify-center bg-slate-50">
              {preview ? (
                // 미리보기
                <img src={preview} alt="preview" className="max-h-56 object-contain rounded-lg" />
              ) : (
                <div className="text-slate-500 text-sm flex flex-col items-center">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  업로드한 사진 미리보기
                </div>
              )}
            </div>
            <div className="">
              <label className="text-sm font-medium">필기/메모 (선택)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="예: '시제?' 표시가 많고, 부정사/동명사 자꾸 혼동함"
                rows={7}
                className="mt-2 w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? "분석 중..." : "AI로 분석하기"}
            </button>
          </div>
        </motion.div>

        {/* 분석 결과 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 bg-white rounded-2xl shadow p-5"
        >
          <div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5"/><h2 className="text-lg font-semibold">결과</h2></div>

          {!analyzed ? (
            <div className="text-slate-500 text-sm">분석 결과가 여기 나타납니다. 샘플을 사용하거나 이미지를 업로드한 뒤 분석을 실행하세요.</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2">문항</th>
                      <th className="text-left p-2">상태</th>
                      <th className="text-left p-2">개념</th>
                      <th className="text-left p-2">정답/내답</th>
                      <th className="text-left p-2">메모</th>
                      <th className="p-2 text-right">수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyzed.map((q) => (
                      <tr key={q.id} className="border-t">
                        <td className="p-2 whitespace-nowrap">#{q.number} {q.prompt}</td>
                        <td className="p-2">
                          {q.status === "wrong" && (
                            <span className="inline-flex items-center gap-1 text-red-600"><AlertTriangle className="w-4 h-4"/>오답</span>
                          )}
                          {q.status === "confused" && (
                            <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="w-4 h-4"/>헷갈림</span>
                          )}
                          {q.status === "correct" && (
                            <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4"/>정답</span>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {q.concepts.map((c, i) => (
                              <Chip key={c + i}>{c}</Chip>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 text-slate-600">{q.correctAnswer} / {q.userAnswer}</td>
                        <td className="p-2 text-slate-600">{q.note}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2 justify-end text-slate-500">
                            <button className="hover:text-indigo-600" title="수정"><Edit3 className="w-4 h-4"/></button>
                            <button className="hover:text-rose-600" title="삭제"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 개념 집계 */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium mb-2">취약 개념 상위</h3>
                <div className="flex flex-wrap gap-2">
                  {aggregate.slice(0, 6).map((r) => (
                    <div key={r.concept} className="border rounded-xl bg-white px-3 py-2 text-sm">
                      <div className="font-semibold">{r.concept}</div>
                      <div className="text-slate-600">오답 {r.wrong} · 헷갈림 {r.confused}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 제안 */}
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4"/><h3 className="font-medium">맞춤 제안</h3></div>
                {suggestions.length === 0 ? (
                  <div className="text-sm text-slate-500">분석 이후 제안이 표시됩니다.</div>
                ) : (
                  <ul className="space-y-2">
                    {suggestions.map((s) => (
                      <li key={s.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                        <div className="pt-0.5"><Sparkles className="w-4 h-4"/></div>
                        <div className="flex-1">
                          <div className="font-medium">{s.text}</div>
                          <div className="text-xs text-slate-600">근거: {s.reason}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  <button className="px-3 py-2 rounded-xl border inline-flex items-center gap-2"><Plus className="w-4 h-4"/>제안 추가</button>
                  <button onClick={handleCreatePlan} className="px-3 py-2 rounded-xl bg-emerald-600 text-white inline-flex items-center gap-2 hover:bg-emerald-700"><Calendar className="w-4 h-4"/>일정으로 반영</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 하단 안내 */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="mb-6 w-full bg-white rounded-2xl shadow p-4"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <div className="text-sm">이미지에서 문항과 필기 신호를 인식하고 개념을 매핑하는 중…</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
