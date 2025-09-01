import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { X, Edit3, Eye, Share2, Download, Globe, FileText, BookOpen, TrendingUp, Target } from 'lucide-react'

const BlogExportModal = ({ isOpen, onClose, learningData, chatMessages = [], onExport }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('learning-review')
  const [selectedPlatform, setSelectedPlatform] = useState('tistory')
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestedModules, setSuggestedModules] = useState([])
  const [aiStyleGuide, setAiStyleGuide] = useState('')
  const [chatHistory, setChatHistory] = useState([])

  const templates = [
    {
      id: 'learning-review',
      name: '학습 후기형',
      description: '오늘의 학습 내용과 개선점을 정리',
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'problem-solving',
      name: '문제 해결형',
      description: '어려웠던 문제와 해결 과정을 기록',
      icon: Target,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'concept-summary',
      name: '개념 정리형',
      description: '핵심 개념을 체계적으로 정리',
      icon: FileText,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'progress-review',
      name: '성과 리뷰형',
      description: '학습 성과와 다음 계획을 점검',
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'natural-blog',
      name: '자연스러운 블로그형',
      description: '개인적인 느낀점과 경험을 포함한 자연스러운 글',
      icon: Edit3,
      color: 'bg-pink-100 text-pink-800'
    }
  ]

  const platforms = [
    { id: 'tistory', name: '티스토리', icon: Globe, color: 'bg-orange-100 text-orange-800' },
    { id: 'naver', name: '네이버블로그', icon: FileText, color: 'bg-green-100 text-green-800' },
    { id: 'notion', name: '노션', icon: BookOpen, color: 'bg-black text-white' },
    { id: 'develog', name: 'develog', icon: Share2, color: 'bg-blue-100 text-blue-800' }
  ]

  useEffect(() => {
    if (isOpen && learningData) {
      generateSuggestedModules()
      generateBlogContent()
    }
  }, [isOpen, selectedTemplate, learningData])

  useEffect(() => {
    if (isOpen && learningData && (suggestedModules.length > 0 || aiStyleGuide || chatHistory.length > 0)) {
      generateBlogContent()
    }
  }, [suggestedModules, aiStyleGuide, chatHistory])

  const generateSuggestedModules = () => {
    if (!learningData) return
    
    const modules = []
    
    // 학습 주제에 따른 모듈 제안
    if (learningData.subject?.includes('수학')) {
      modules.push(
        { id: 'math-basics', name: '기초 수학', description: '기본 개념과 공식 정리' },
        { id: 'math-problem-solving', name: '문제 해결 전략', description: '단계별 접근법과 팁' },
        { id: 'math-practice', name: '실전 연습', description: '다양한 유형의 문제 풀이' }
      )
    } else if (learningData.subject?.includes('토익')) {
      modules.push(
        { id: 'toeic-vocab', name: '어휘 마스터', description: '토익 필수 어휘 정리' },
        { id: 'toeic-grammar', name: '문법 정리', description: '토익 문법 포인트' },
        { id: 'toeic-strategy', name: '전략 가이드', description: '파트별 풀이 전략' }
      )
    } else if (learningData.subject?.includes('영어')) {
      modules.push(
        { id: 'english-conversation', name: '회화 표현', description: '일상 회화 필수 표현' },
        { id: 'english-grammar', name: '문법 기초', description: '실용 영어 문법' },
        { id: 'english-listening', name: '청취 연습', description: '듣기 실력 향상' }
      )
    } else {
      // 기본 모듈
      modules.push(
        { id: 'concept-review', name: '개념 복습', description: '핵심 개념 정리' },
        { id: 'practice-test', name: '실전 연습', description: '문제 풀이 연습' },
        { id: 'improvement-plan', name: '개선 계획', description: '약점 보완 전략' }
      )
    }
    
    // 정답률에 따른 추가 모듈
    if (learningData.accuracy < 70) {
      modules.push({ id: 'basic-foundation', name: '기초 다지기', description: '기본 개념부터 차근차근' })
    } else if (learningData.accuracy > 85) {
      modules.push({ id: 'advanced-challenge', name: '고급 도전', description: '더 어려운 문제에 도전' })
    }
    
    setSuggestedModules(modules)
  }

  const generateBlogContent = async () => {
    if (!learningData) return
    
    setIsGenerating(true)
    
    // AI 기반 블로그 콘텐츠 생성 (시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const template = templates.find(t => t.id === selectedTemplate)
    const date = new Date().toLocaleDateString('ko-KR')
    
    let title = ''
    let content = ''
    
    switch (selectedTemplate) {
      case 'learning-review':
        title = `오늘의 학습 정리 - ${learningData.subject || '수학'} (${date})`
        
        // AI 스타일 가이드 적용
        let reviewStyle = ''
        if (aiStyleGuide) {
          if (aiStyleGuide.includes('전문적') || aiStyleGuide.includes('학술')) {
            reviewStyle = '\n\n본 학습 후기는 체계적인 분석과 객관적 데이터를 바탕으로 작성되었습니다.'
          } else if (aiStyleGuide.includes('친근') || aiStyleGuide.includes('편안')) {
            reviewStyle = '\n\n오늘 공부하면서 느낀 점들을 정리해봤어요. 여러분도 비슷한 경험이 있으신가요?'
          }
        }
        
        content = `## 📚 오늘의 학습 요약

**학습 주제**: ${learningData.subject || '수학'}
**학습 시간**: ${learningData.timeSpent || 0}분
**정답률**: ${learningData.accuracy || 0}%

${aiStyleGuide ? `**AI 프롬프트**: ${aiStyleGuide}\n` : ''}${reviewStyle}

### 🎯 주요 성과
- 총 ${learningData.totalQuestions || 0}문제 중 ${learningData.correctAnswers || 0}문제 정답
- ${learningData.weakConcepts?.length || 0}개 영역에서 개선 필요

### ❌ 개선이 필요한 영역
${(learningData.weakConcepts || []).map(concept => 
  `- **${concept.name}**: ${concept.description} (${concept.count}문제)`
).join('\n')}

### 💡 오늘의 깨달음
${(learningData.handwritingNotes || []).map(note => 
  `- **${note.concept}**: ${note.userNote}\n  → AI 해설: ${note.aiExplanation}`
).join('\n\n')}

### 📚 추천 학습 모듈
${suggestedModules.map(module => 
  `- **${module.name}**: ${module.description}`
).join('\n')}

### 🚀 다음 학습 계획
- ${learningData.weakConcepts?.[0]?.name || '핵심 개념'} 복습 및 보충 문제 풀이
- 실수 패턴 분석을 통한 정확도 향상

---
*NOMA AI가 생성한 학습 후기입니다.*`
        break
        
      case 'problem-solving':
        title = `어려웠던 문제 해결 과정 - ${learningData.subject || '수학'} (${date})`
        content = `## 🎯 문제 해결 과정 기록

**학습 주제**: ${learningData.subject || '수학'}
**총 문제 수**: ${learningData.totalQuestions || 0}문제
**정답률**: ${learningData.accuracy || 0}%

${aiStyleGuide ? `**AI 프롬프트**: ${aiStyleGuide}\n\n` : ''}

### ❌ 오답 분석
${(learningData.mistakes || []).map(mistake => 
  `#### 문제 ${mistake.num}: ${mistake.text}
**개념**: ${mistake.concept}
**오답 원인**: ${mistake.note}
**해결 방법**: ${mistake.concept} 개념을 다시 정리하고 유사 문제 연습 필요`
).join('\n\n')}

### 💡 문제 해결 전략
1. **개념 이해**: 각 문제의 핵심 개념을 명확히 파악
2. **단계별 접근**: 복잡한 문제는 작은 단위로 분해
3. **오답 노트**: 실수한 부분을 체계적으로 기록

### 🔍 개선 방향
${(learningData.weakConcepts || []).map(concept => 
  `- **${concept.name}**: ${concept.description}`
).join('\n')}

### 📚 추천 학습 모듈
${suggestedModules.map(module => 
  `- **${module.name}**: ${module.description}`
).join('\n')}

---
*NOMA AI가 생성한 문제 해결 과정입니다.*`
        break
        
      case 'concept-summary':
        title = `${learningData.subject || '수학'} 핵심 개념 완벽 정리 (${date})`
        content = `## 📖 핵심 개념 정리

**학습 주제**: ${learningData.subject || '수학'}
**학습 시간**: ${learningData.timeSpent || 0}분

### 🎯 주요 개념 요약
${(learningData.weakConcepts || []).map(concept => 
  `#### ${concept.name}
**정의**: ${concept.description}
**중요도**: ${concept.count}문제에서 출제
**학습 포인트**: 기본 원리부터 응용까지 단계별 학습 필요`
).join('\n\n')}

### 📝 핵심 공식 및 원리
${(learningData.handwritingNotes || []).map(note => 
  `#### ${note.concept}
**사용자 질문**: ${note.userNote}
**AI 해설**: ${note.aiExplanation}`
).join('\n\n')}

### 🧠 학습 방법론
1. **개념 이해**: 정의와 원리를 명확히 파악
2. **예제 연습**: 다양한 유형의 문제로 적용 연습
3. **오답 분석**: 실수한 부분을 통해 약점 파악
4. **반복 학습**: 취약한 영역 집중 공부

---
*NOMA AI가 생성한 개념 정리입니다.*`
        break
        
      case 'progress-review':
        title = `학습 성과 리뷰 및 다음 계획 - ${learningData.subject || '수학'} (${date})`
        content = `## 📊 학습 성과 리뷰

**학습 주제**: ${learningData.subject || '수학'}
**학습 기간**: ${date}
**총 투자 시간**: ${learningData.timeSpent || 0}분

### 📈 성과 지표
- **정답률**: ${learningData.accuracy || 0}% (목표: 90%+)
- **문제 해결**: ${learningData.correctAnswers || 0}/${learningData.totalQuestions || 0}문제
- **개선 영역**: ${learningData.weakConcepts?.length || 0}개

### 🎯 주요 성과
✅ ${learningData.correctAnswers || 0}문제 정답으로 기본 개념 이해도 확인
✅ ${learningData.weakConcepts?.length || 0}개 취약 영역 식별로 집중 학습 방향 설정
✅ AI 분석을 통한 객관적인 학습 진단

### 🚧 개선 필요 영역
${(learningData.weakConcepts || []).map(concept => 
  `- **${concept.name}**: ${concept.description} (${concept.count}문제)`
).join('\n')}

### 📋 다음 학습 계획
1. **단기 목표 (1주일)**: ${learningData.weakConcepts?.[0]?.name || '핵심 개념'} 완벽 정리
2. **중기 목표 (1개월)**: 전체 정답률 85% 달성
3. **장기 목표 (3개월)**: ${learningData.subject || '수학'} 영역 마스터

---
*NOMA AI가 생성한 학습 성과 리뷰입니다.*`
                break
        
      case 'natural-blog':
        title = `오늘 ${learningData.subject || '수학'} 공부하면서 느낀 점들 (${date})`
        
        // AI 스타일 가이드 적용
        let naturalStyleIntro = '안녕하세요! 오늘은'
        let naturalStyleTone = '느낀 점들을 정리해보려고 해요.'
        
        if (aiStyleGuide) {
          if (aiStyleGuide.includes('친근') || aiStyleGuide.includes('편안')) {
            naturalStyleIntro = '안녕하세요! 오늘은'
            naturalStyleTone = '느낀 점들을 정리해보려고 해요.'
          } else if (aiStyleGuide.includes('전문적') || aiStyleGuide.includes('학술')) {
            naturalStyleIntro = '본 포스팅에서는'
            naturalStyleTone = '학습 과정에서 발견한 인사이트를 정리합니다.'
          } else if (aiStyleGuide.includes('유머') || aiStyleGuide.includes('재미')) {
            naturalStyleIntro = '안녕하세요 여러분! 😊 오늘은'
            naturalStyleTone = '재미있게 공부하면서 느낀 점들을 정리해볼게요!'
          }
        }
        
        content = `${naturalStyleIntro} ${learningData.subject || '수학'} 공부를 하면서 ${naturalStyleTone}

## 🎯 오늘 공부한 내용

**학습 주제**: ${learningData.subject || '수학'}
**공부 시간**: ${learningData.timeSpent || 0}분
**정답률**: ${learningData.accuracy || 0}%

${aiStyleGuide ? `**AI 프롬프트**: ${aiStyleGuide}\n\n` : ''}## 💭 개인적인 느낀점

### 1. 가장 어려웠던 부분
${(learningData.weakConcepts || []).map((concept, index) => 
  `${index + 1}. **${concept.name}**\n   - ${concept.description}\n   - ${concept.count}문제를 틀렸는데, 정말 헷갈렸어요.\n   - 이 부분은 더 연습이 필요할 것 같아요.`
).join('\n\n')}

### 2. 오늘 새롭게 알게 된 것
${(learningData.handwritingNotes || []).map(note => 
  `- **${note.concept}**: ${note.userNote}\n  → ${note.aiExplanation}\n  → 이걸 알게 되니까 훨씬 이해가 잘 되더라고요!`
).join('\n\n')}

### 3. 다음에 더 잘하고 싶은 부분
${learningData.weakConcepts?.[0] ? 
  `- **${learningData.weakConcepts[0].name}**: 이번에는 ${learningData.weakConcepts[0].description} 때문에 많이 틀렸는데, 다음에는 꼭 맞출 수 있을 것 같아요!` : 
  '- 기본 개념을 더 탄탄하게 다지고 싶어요.'
}

## 🚀 앞으로의 계획

${suggestedModules.map((module, index) => 
  `${index + 1}. **${module.name}**: ${module.description}\n   - 이 모듈을 통해 부족한 부분을 채워나가고 싶어요.`
).join('\n\n')}

${chatHistory.length > 0 ? `## 💬 AI 코치와의 대화

오늘 공부하면서 AI 코치에게 궁금한 점들을 물어봤어요. 정말 도움이 많이 됐답니다!

${chatHistory.map((msg, index) => 
  msg.role === 'user' ? 
    `**나**: ${msg.text}` : 
    `**AI 코치**: ${msg.text}`
).join('\n\n')}

이런 대화를 통해 더 깊이 이해할 수 있었어요! 😊

` : ''}## 마무리

오늘 ${learningData.timeSpent || 0}분 동안 ${learningData.subject || '수학'} 공부를 했는데, 생각보다 많은 걸 배웠어요. 특히 ${learningData.handwritingNotes?.[0]?.concept || '새로운 개념'}을 이해하게 된 게 가장 큰 성취였던 것 같아요.

${learningData.accuracy < 70 ? '아직 부족한 부분이 많지만, 차근차근 하나씩 채워나가면 될 것 같아요!' : 
  learningData.accuracy > 85 ? '예상보다 잘했어서 뿌듯해요! 하지만 더 높은 목표를 향해 나아가고 싶어요.' : 
  '괜찮은 성과였지만, 더 나은 결과를 위해 노력하고 싶어요.'}

다음 포스팅에서는 더 좋은 결과와 함께 돌아올게요! 😊

---
*NOMA AI가 생성한 자연스러운 블로그 포스트입니다.*`
        break
      }
      
      setPostTitle(title)
      setPostContent(content)
      setIsGenerating(false)
    }

  const handleExport = () => {
    if (onExport) {
      onExport({
        template: selectedTemplate,
        platform: selectedPlatform,
        title: postTitle,
        content: postContent,
        learningData
      })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">📝 블로그 내보내기</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - 설정 */}
          <div className="w-1/3 border-r p-6 space-y-6 overflow-y-auto">
            {/* 필드 설명 헬프 */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-800">
                <div className="font-medium mb-1">💡 각 필드의 역할</div>
                <div className="space-y-1">
                  <div>• <strong>AI 블로그 프롬프트</strong>: AI에게 블로그 작성을 어떻게 해달라고 요청</div>
                  <div>• <strong>추천 학습 모듈</strong>: AI가 제안하는 다음 학습 방향</div>
                </div>
              </div>
            </div>
            {/* 템플릿 선택 */}
            <div>
              <h3 className="font-semibold mb-3">📋 템플릿 선택</h3>
              <div className="grid grid-cols-2 gap-2">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-center ${
                      selectedTemplate === template.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <template.icon size={14} />
                      <div className="text-xs font-medium">{template.name}</div>
                      <div className="text-xs text-gray-600 leading-tight">{template.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>



            {/* 제목 편집 */}
            <div>
              <h3 className="font-semibold mb-3">✏️ 제목 편집</h3>
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="블로그 제목을 입력하세요"
              />
            </div>



            {/* 추천 학습 모듈 */}
            <div>
              <h3 className="font-semibold mb-3">📚 추천 학습 모듈</h3>
              <div className="text-xs text-gray-600 mb-2">
                AI가 학습 상황을 분석해서 제안하는 다음 학습 방향입니다
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {suggestedModules.map(module => (
                  <div key={module.id} className="p-2 bg-gray-50 rounded-lg border">
                    <div className="font-medium text-sm">{module.name}</div>
                    <div className="text-xs text-gray-600">{module.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI 블로그 프롬프트 */}
            <div>
              <h3 className="font-semibold mb-3">🤖 AI 블로그 프롬프트</h3>
              <div className="text-xs text-gray-600 mb-2">
                AI에게 블로그 작성을 어떻게 해달라고 요청할지 구체적으로 작성하세요
              </div>
              <textarea
                value={aiStyleGuide}
                onChange={(e) => setAiStyleGuide(e.target.value)}
                className="w-full p-2 border rounded-lg h-20 resize-none text-sm"
                placeholder="예시:&#10;- 친근하고 편안한 톤으로 작성해줘&#10;- 개인적인 경험과 느낀점을 포함해서&#10;- 실용적인 팁과 조언을 제공해줘&#10;- 독자와 공감할 수 있는 내용으로&#10;- 전문적이고 학술적인 스타일로&#10;- 유머러스하고 재미있게 작성해줘&#10;- 초보자도 이해할 수 있게 설명해줘..."
              />
            </div>

            {/* 챗봇 대화 내보내기 */}
            <div>
              <h3 className="font-semibold mb-3">💬 챗봇 대화 포함</h3>
              <div className="text-xs text-gray-600 mb-2">
                AI 코치와 나눈 대화 내용을 블로그에 포함할지 선택하세요
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={chatHistory.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setChatHistory(chatMessages)
                      } else {
                        setChatHistory([])
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">챗봇 대화 내용 포함</span>
                </label>
                {chatHistory.length > 0 && (
                  <div className="text-xs text-green-600">
                    ✓ {chatHistory.length}개의 대화가 포함됩니다
                  </div>
                )}
                {chatMessages.length > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    💬 {chatMessages.length}개의 대화 기록이 있습니다
                  </div>
                )}
                
                {/* 챗봇 대화 범위 선택 및 편집 */}
                {chatHistory.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-700 mb-2">📝 블로그용 대화 편집</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {chatHistory.map((msg, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={(e) => {
                              if (!e.target.checked) {
                                setChatHistory(prev => prev.filter((_, i) => i !== index))
                              }
                            }}
                            className="mt-1 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-600">
                              {msg.role === 'user' ? '나' : 'AI 코치'}
                            </div>
                            <textarea
                              value={msg.text}
                              onChange={(e) => {
                                const newHistory = [...chatHistory]
                                newHistory[index] = { ...msg, text: e.target.value }
                                setChatHistory(newHistory)
                              }}
                              className="w-full p-2 border rounded text-xs resize-none h-16"
                              placeholder="대화 내용을 편집하세요"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      ✓ 체크박스 해제로 대화 제외, 텍스트 편집으로 내용 수정 가능
                    </div>
                  </div>
                )}

                {/* 발행 플랫폼 선택 */}
                <div>
                  <h3 className="font-semibold mb-3">🌐 발행 플랫폼</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {platforms.map(platform => (
                      <div
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-center ${
                          selectedPlatform === platform.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <platform.icon size={14} />
                          <span className="text-xs font-medium">{platform.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - 미리보기 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">👁️ 미리보기</h3>
              <div className="flex gap-2">
                <button
                  onClick={generateBlogContent}
                  disabled={isGenerating}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm hover:bg-purple-200 disabled:opacity-50"
                >
                  {isGenerating ? '생성 중...' : '🔄 재생성'}
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Share2 size={16} />
                  {selectedPlatform === 'tistory' ? '티스토리 발행' :
                   selectedPlatform === 'naver' ? '네이버블로그 발행' :
                   selectedPlatform === 'notion' ? '노션 저장' :
                   'develog 업로드'}
                </button>
              </div>
            </div>

            {/* 콘텐츠 미리보기 */}
            <div className="bg-gray-50 rounded-lg p-4 h-full overflow-y-auto">
              {isGenerating ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">AI가 블로그 콘텐츠를 생성하고 있습니다...</div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <h1 className="text-2xl font-bold mb-4">{postTitle}</h1>
                  <div className="whitespace-pre-line text-gray-800">{postContent}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogExportModal
