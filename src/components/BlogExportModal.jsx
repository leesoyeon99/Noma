import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { X, Edit3, Eye, Copy, Download, Globe, FileText, BookOpen, TrendingUp, Target } from 'lucide-react'

const SNSExportModal = ({ isOpen, onClose, learningData, chatMessages = [], onExport }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('blog')
  const [selectedTemplate, setSelectedTemplate] = useState('learning-review')

  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiStyleGuide, setAiStyleGuide] = useState('')
  const [chatHistory, setChatHistory] = useState([])

  const platforms = [
    {
      id: 'blog',
      name: '블로그',
      description: '티스토리, 네이버블로그, 노션, velog',
      icon: Globe,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'instagram',
      name: '인스타그램',
      description: '피드, 스토리, 릴스 최적화',
      icon: Eye,
      color: 'bg-pink-100 text-pink-800'
    }
  ]

  const templates = {
    blog: [
      {
        id: 'learning-review',
        name: '학습 후기형',
        description: '개인적인 느낀점과 경험을 포함한 자연스러운 학습 후기',
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
      }
    ],
    instagram: [
      {
        id: 'daily-study',
        name: '일상 학습형',
        description: '짧고 임팩트 있는 학습 순간 공유',
        icon: BookOpen,
        color: 'bg-pink-100 text-pink-800'
      },
      {
        id: 'study-tip',
        name: '공부 꿀팁형',
        description: '핵심 포인트와 암기법 중심',
        icon: Target,
        color: 'bg-purple-100 text-purple-800'
      },
      {
        id: 'motivational',
        name: '동기부여형',
        description: '학습 성취감과 응원 메시지',
        icon: TrendingUp,
        color: 'bg-orange-100 text-orange-800'
      },
      {
        id: 'visual-summary',
        name: '비주얼 요약형',
        description: '이미지와 짧은 텍스트로 요약',
        icon: Eye,
        color: 'bg-green-100 text-green-800'
      }
    ]
  }



  useEffect(() => {
    if (isOpen && learningData) {
      generateBlogContent()
    }
  }, [isOpen, selectedTemplate, learningData])

  useEffect(() => {
    if (isOpen && learningData && (aiStyleGuide || chatHistory.length > 0)) {
      generateBlogContent()
    }
  }, [aiStyleGuide, chatHistory])



  const generateBlogContent = async () => {
    if (!learningData) return
    
    setIsGenerating(true)
    
    // AI 기반 SNS 콘텐츠 생성 (시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const template = templates[selectedPlatform].find(t => t.id === selectedTemplate)
    const date = new Date().toLocaleDateString('ko-KR')
    
    let title = ''
    let content = ''
    
    if (selectedPlatform === 'blog') {
      switch (selectedTemplate) {
      case 'learning-review':
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
        
        content = `${naturalStyleIntro} ${learningData.subject || '수학'} 공부를 했는데 ${naturalStyleTone}

오늘 ${learningData.timeSpent || 0}분 동안 ${learningData.subject || '수학'} 공부를 했어요. 

간단한 요약
• 학습 주제: ${learningData.subject || '수학'}
• 공부 시간: ${learningData.timeSpent || 0}분
• 정답률: ${learningData.accuracy || 0}%

${aiStyleGuide ? `AI 프롬프트: ${aiStyleGuide}\n\n` : ''}솔직한 후기

가장 어려웠던 부분
${(learningData.weakConcepts || []).map((concept, index) => 
  `${index + 1}. ${concept.name}\n   ${concept.description} 부분에서 ${concept.count}문제를 틀렸어요\n   처음에는 쉬워 보였는데 막상 풀어보니 헷갈렸어요\n   이 부분은 더 연습이 필요할 것 같아요`
).join('\n\n')}

새롭게 알게 된 것
${(learningData.handwritingNotes || []).map(note => 
  `• ${note.concept}: ${note.userNote}\n  → ${note.aiExplanation}\n  → 이걸 알게 되니까 이해가 잘 되더라고요`
).join('\n\n')}

다음에 더 잘하고 싶은 부분
${learningData.weakConcepts?.[0] ? 
  `• ${learningData.weakConcepts[0].name}: 이번에는 ${learningData.weakConcepts[0].description} 때문에 많이 틀렸는데, 다음에는 꼭 맞출 수 있을 것 같아요` : 
  '• 기본 개념을 더 탄탄하게 다지고 싶어요'
}

앞으로의 계획
• 기본 개념 복습: ${learningData.weakConcepts?.[0]?.name || '핵심 개념'}을 더 탄탄하게 다지기
• 실전 연습: 다양한 유형의 문제로 응용 능력 향상
• 오답 분석: 실수 패턴을 파악해서 개선점 찾기

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
*NOMA AI가 생성한 자연스러운 학습 후기입니다.*`
        break
        
      case 'problem-solving':
        title = `[${learningData.subject || '수학'}] 어려웠던 문제들, 이렇게 해결했어요 (${date})`
        content = `오늘 공부한 내용

오늘 ${learningData.subject || '수학'} 문제를 ${learningData.totalQuestions || 0}문제 풀었는데, 정말 헷갈리는 문제들이 많았어요. 

간단한 요약
• 도전한 문제: ${learningData.totalQuestions || 0}문제
• 성공률: ${learningData.accuracy || 0}%
• 학습 시간: ${learningData.timeSpent || 0}분

${aiStyleGuide ? `AI 프롬프트: ${aiStyleGuide}\n\n` : ''}어려웠던 문제들

문제 ${learningData.mistakes?.[0]?.num || '1'} - ${learningData.mistakes?.[0]?.text || '기본 개념 문제'}
${(learningData.mistakes || []).map((mistake, index) => 
  `${index + 1}. ${mistake.text}\n   핵심 개념: ${mistake.concept}\n   왜 틀렸을까?: ${mistake.note}\n   해결 방법: ${mistake.concept} 개념을 다시 정리하고 유사 문제 연습이 필요해요\n   학습 포인트: 이 문제는 ${mistake.concept}의 기본기를 테스트하는 문제였어요`
).join('\n\n')}

문제 해결을 위한 전략

1단계: 개념 이해
• 각 문제의 핵심 개념을 명확히 파악하기
• 기본 공식과 원리를 체득하기

2단계: 단계별 접근
• 복잡한 문제는 작은 단위로 분해하기
• 중간 과정을 꼼꼼히 체크하기

3단계: 오답 노트
• 실수한 부분을 체계적으로 기록하기
• 유사한 문제를 찾아서 연습하기

다음에 꼭 해보고 싶은 것

${(learningData.weakConcepts || []).map(concept => 
  `• ${concept.name}: ${concept.description} - 이 부분을 집중적으로 연습해서 다음에는 꼭 맞출 수 있을 거예요`
).join('\n')}

마무리

오늘 문제들이 생각보다 어려웠어요. 하지만 하나씩 차근차근 풀어보면서 많은 걸 배웠어요. 

가장 중요한 깨달음: 문제가 어려울수록 기본 개념이 중요하다는 걸 다시 한번 느꼈어요. 복잡해 보이는 문제도 결국 기본기를 바탕으로 해결할 수 있거든요.

다음 포스팅에서는 더 좋은 결과와 함께 돌아올게요.

---
*NOMA AI가 생성한 문제 해결 과정입니다.*`
        break
        
      case 'concept-summary':
        title = `[${learningData.subject || '수학'}] 핵심 개념 정리 (${date})`
        content = `${learningData.subject || '수학'} 핵심 개념 정리

오늘 ${learningData.subject || '수학'}을 ${learningData.timeSpent || 0}분 동안 공부하면서 중요한 개념들을 정리했어요. 

이 포스팅을 읽으면 얻을 수 있는 것
• ${learningData.subject || '수학'}의 핵심 개념 이해
• 실제 문제에 적용하는 방법
• 실수하기 쉬운 부분 체크
• 효율적인 학습 방법

${aiStyleGuide ? `AI 프롬프트: ${aiStyleGuide}\n\n` : ''}핵심 개념들

${learningData.weakConcepts?.[0]?.name || '기본 개념'}
${(learningData.weakConcepts || []).map(concept => 
  `${concept.name}\n   정의: ${concept.description}\n   중요도: ${concept.count}문제에서 출제\n   학습 포인트: 기본 원리부터 응용까지 단계별 학습이 필요해요\n   팁: 이 개념을 완벽하게 이해하면 관련 문제들이 훨씬 쉬워질 거예요`
).join('\n\n')}

핵심 공식과 원리

${(learningData.handwritingNotes || []).map(note => 
  `${note.concept}\n   내가 궁금했던 점: ${note.userNote}\n   AI가 알려준 핵심: ${note.aiExplanation}\n   실제 활용법: 이 개념을 이해하면 비슷한 문제들을 쉽게 풀 수 있어요`
).join('\n\n')}

학습 방법론

1단계: 개념 이해
• 정의와 원리를 명확히 파악하기
• 기본 공식의 의미를 이해하기

2단계: 예제 연습
• 다양한 유형의 문제로 적용 연습하기
• 쉬운 문제부터 차근차근 도전하기

3단계: 오답 분석
• 실수한 부분을 통해 약점 파악하기
• 유사한 실수를 방지하는 방법 찾기

4단계: 반복 학습
• 취약한 영역 집중 공부하기
• 정기적으로 복습하기

마무리

${learningData.subject || '수학'}은 체계적으로 학습해야 하는 과목이에요. 오늘 정리한 개념들을 바탕으로 차근차근 연습하다 보면 분명히 실력이 늘 거예요.

오늘의 다짐: ${learningData.weakConcepts?.[0]?.name || '핵심 개념'}을 완벽하게 마스터해서 다음에는 관련 문제들을 모두 맞출 수 있을 거예요.

다음 포스팅에서는 더 깊이 있는 개념 정리와 함께 돌아올게요.

---
*NOMA AI가 생성한 개념 정리입니다.*`
        break
        
      case 'progress-review':
        title = `[${learningData.subject || '수학'}] ${date} 학습 성과 리뷰 (${date})`
        content = `${learningData.subject || '수학'} 학습 성과 리뷰

오늘 ${date}에 ${learningData.subject || '수학'} 공부를 ${learningData.timeSpent || 0}분 동안 했어요. 솔직히 말하면 결과가 기대했던 것과는 조금 달랐지만, 그래도 많은 걸 배웠어요.

오늘의 성과 요약
• 학습 주제: ${learningData.subject || '수학'}
• 투자 시간: ${learningData.timeSpent || 0}분
• 도전한 문제: ${learningData.totalQuestions || 0}문제
• 성공률: ${learningData.accuracy || 0}%

${aiStyleGuide ? `AI 프롬프트: ${aiStyleGuide}\n\n` : ''}오늘의 주요 성과

잘한 부분들
• ${learningData.correctAnswers || 0}문제 정답: 기본 개념 이해도가 괜찮아요
• ${learningData.weakConcepts?.length || 0}개 취약 영역 식별: 이제 무엇을 더 공부해야 할지 명확해졌어요
• AI 분석 활용: 객관적인 진단으로 효율적인 학습 방향을 찾았어요

개선이 필요한 부분들
${(learningData.weakConcepts || []).map(concept => 
  `• ${concept.name}: ${concept.description} (${concept.count}문제 틀림)\n   → 이 부분을 집중적으로 공부하면 정답률이 크게 올라갈 거예요`
).join('\n')}

앞으로의 학습 계획

단기 목표 (1주일)
• ${learningData.weakConcepts?.[0]?.name || '핵심 개념'} 완벽 정리: 기본기를 탄탄하게 다지기
• 오답 노트 작성: 실수한 부분을 체계적으로 정리하기
• 유사 문제 연습: 같은 유형의 문제를 여러 번 풀어보기

중기 목표 (1개월)
• 전체 정답률 85% 달성: 꾸준한 연습으로 실력 향상하기
• 취약 영역 보완: 약한 부분을 강점으로 만들기
• 응용 문제 도전: 기본 개념을 바탕으로 어려운 문제에 도전하기

장기 목표 (3개월)
• ${learningData.subject || '수학'} 영역 마스터: 완벽한 이해와 응용 능력 갖추기
• 다른 학습자들에게 도움: 경험을 바탕으로 학습 팁 공유하기
• 지속적인 성장: 새로운 도전과 학습 동기 유지하기

오늘의 깨달음

가장 중요한 것: 학습은 단순히 문제를 푸는 것이 아니라, 자신을 이해하고 개선하는 과정이라는 걸 다시 한번 느꼈어요. 

${learningData.accuracy < 70 ? '정답률이 낮다고 해서 실망할 필요 없어요. 오히려 "이 부분을 더 공부해야겠다"는 명확한 방향을 찾은 거예요.' : 
  learningData.accuracy > 85 ? '정답률이 높아서 뿌듯하지만, 더 높은 목표를 향해 나아가고 싶어요. 완벽함에는 끝이 없거든요.' : 
  '괜찮은 성과였지만, 더 나은 결과를 위해 노력하고 싶어요. 작은 진전도 큰 성취예요.'}

마무리

오늘 ${learningData.subject || '수학'} 공부를 통해 많은 걸 배웠어요. 실수도 했고, 깨달음도 있었어요. 

내일의 다짐: 오늘 발견한 취약점들을 하나씩 채워나가면서, 더 나은 내가 되고 싶어요.

다음 포스팅에서는 더 좋은 결과와 함께 돌아올게요.

---
*NOMA AI가 생성한 학습 성과 리뷰입니다.*`
                break
        
        default:
          title = `${learningData.subject || '수학'} 학습 기록 (${date})`
          content = '학습 내용을 정리해보겠습니다.'
          break
      }
    } else if (selectedPlatform === 'instagram') {
      switch (selectedTemplate) {
        case 'daily-study':
          title = `📚 오늘의 ${learningData.subject || '수학'} 공부`
          content = `오늘 ${learningData.subject || '수학'} 공부 완료! ✨

📖 공부 시간: ${learningData.timeSpent || 0}분
📊 정답률: ${learningData.accuracy || 0}%
🎯 집중 영역: ${(learningData.weakConcepts || []).slice(0, 2).map(c => c.name).join(', ')}

${aiStyleGuide ? `💡 ${aiStyleGuide}\n\n` : ''}오늘의 한 줄 후기
"${learningData.accuracy >= 80 ? '생각보다 잘했다! 뿌듯 😊' : 
   learningData.accuracy >= 60 ? '조금 더 노력하면 될 것 같아' : 
   '어려웠지만 포기하지 않았다 💪'}"

내일도 화이팅! 🔥

#공부 #${learningData.subject || '수학'} #공부기록 #학습 #성장 #노마 #공부스타그램`
          break

        case 'study-tip':
          title = `💡 ${learningData.subject || '수학'} 공부 꿀팁`
          content = `${learningData.subject || '수학'} 공부할 때 이것만 기억하자! 📌

${(learningData.weakConcepts || []).slice(0, 3).map((concept, i) => 
  `${i + 1}️⃣ ${concept.name}\n${concept.description ? `   → ${concept.description.slice(0, 30)}...` : '   → 기본 개념부터 차근차근!'}`
).join('\n\n')}

${aiStyleGuide ? `\n🎯 ${aiStyleGuide}\n` : ''}
💪 핵심은 반복 학습!
🔥 매일 조금씩이라도 꾸준히

여러분도 이 방법으로 도전해보세요! 💫

#공부팁 #${learningData.subject || '수학'} #공부법 #학습팁 #공부스타그램 #성장 #노마`
          break

        case 'motivational':
          title = `🔥 ${learningData.subject || '수학'} 공부 성과`
          content = `오늘도 한 걸음 더 성장했다! 🌟

📈 나의 성과
• 정답률: ${learningData.accuracy || 0}%
• 공부 시간: ${learningData.timeSpent || 0}분
• 해결한 문제: ${learningData.totalQuestions || 0}개

${learningData.accuracy >= 80 ? 
  '🎉 목표를 달성했어요! 이 기세로 쭉!' : 
  learningData.accuracy >= 60 ? 
  '👍 괜찮은 성과! 조금만 더 노력하면 완벽!' : 
  '💪 어려웠지만 포기하지 않았어요. 내일은 더 잘할 수 있을 거예요!'
}

${aiStyleGuide ? `\n✨ ${aiStyleGuide}\n` : ''}
실패는 성공의 어머니라고 하잖아요
오늘의 경험이 내일의 밑거름이 될 거예요 🌱

함께 성장해요! 💫

#공부동기 #성장 #${learningData.subject || '수학'} #공부기록 #동기부여 #노마 #파이팅`
          break

        case 'visual-summary':
          title = `📊 ${learningData.subject || '수학'} 학습 요약`
          content = `📋 학습 요약 보고서

━━━━━━━━━━━━━━━━━
📚 과목: ${learningData.subject || '수학'}
⏰ 시간: ${learningData.timeSpent || 0}분
📊 정답률: ${learningData.accuracy || 0}%
━━━━━━━━━━━━━━━━━

🎯 오늘의 포커스
${(learningData.weakConcepts || []).slice(0, 2).map((concept, i) => 
  `${i + 1}. ${concept.name}`
).join('\n')}

${learningData.accuracy >= 80 ? '✅ 목표 달성!' : 
  learningData.accuracy >= 60 ? '⚡ 아슬아슬 성공' : '💪 다음엔 더 잘할 수 있어'}

${aiStyleGuide ? `\n💡 ${aiStyleGuide}\n` : ''}
📈 내일의 목표: 오늘보다 +10% 향상

#공부기록 #학습요약 #${learningData.subject || '수학'} #성과 #비주얼 #노마`
          break

        default:
          title = `📱 ${learningData.subject || '수학'} 학습 기록`
          content = '오늘도 열심히 공부했어요! 🔥'
          break
      }
    }
      
      setPostTitle(title)
      setPostContent(content)
      setIsGenerating(false)
    }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`제목: ${postTitle}\n\n${postContent}`)
      alert('블로그 콘텐츠가 클립보드에 복사되었습니다!')
    } catch (err) {
      console.error('복사 실패:', err)
      alert('복사에 실패했습니다.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">📱 SNS 내보내기</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - 설정 */}
          <div className="w-1/3 border-r p-6 space-y-6 overflow-y-auto">

            {/* 플랫폼 선택 */}
            <div>
              <h3 className="font-semibold mb-3">📱 플랫폼 선택</h3>
              <div className="space-y-3">
                {platforms.map(platform => {
                  const Icon = platform.icon
                  return (
                    <div
                      key={platform.id}
                      onClick={() => {
                        setSelectedPlatform(platform.id)
                        setSelectedTemplate(templates[platform.id][0].id)
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPlatform === platform.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${platform.color}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-sm text-gray-500">{platform.description}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 템플릿 선택 */}
            <div>
              <h3 className="font-semibold mb-3">📋 템플릿 선택</h3>
              <div className="grid grid-cols-2 gap-2">
                {templates[selectedPlatform].map(template => (
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





            {/* AI 프롬프트 */}
            <div>
              <h3 className="font-semibold mb-3">🤖 AI 프롬프트</h3>
              <div className="text-xs text-gray-600 mb-2">
                콘텐츠 작성 가이드라인을 작성하세요.
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

                {/* 토큰 소모 안내 */}
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-xs text-yellow-800">
                    <div className="font-medium mb-1">💰 토큰 사용 안내</div>
                    <div>블로그 콘텐츠 생성 시 약 {Math.floor(Math.random() * 50) + 100}토큰이 소모됩니다.</div>
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
                  onClick={handleCopy}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Copy size={16} />
                  콘텐츠 복사
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

export default SNSExportModal
