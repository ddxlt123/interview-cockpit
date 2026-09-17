import { useMemo, useRef, useState } from 'react'
import { FileText, Lightbulb, RotateCcw, Upload } from 'lucide-react'
import seedQuestions from './data/questions.json'
import { parseQuestionFile, shuffleQuestions } from './lib/questionBank'
import Sidebar from './components/Sidebar'
import RevealPanel from './components/RevealPanel'
import QuestionLibrary from './components/QuestionLibrary'
import MethodologyQuickReference from './components/MethodologyQuickReference'
import methodologies from './data/methodologies.json'
import { ArrowRight } from './components/Icons'

const STORAGE_KEY = 'interview-cockpit-bank-v1'
const VIEW_COPY = {
  practice: ['模拟面试', '从题库随机抽题，先独立作答，再按需查看提示与参考答案。'],
  library: ['全部题目', '浏览、搜索全部题目，选择任意一题开始练习。'],
  methodology: ['方法论速查', '按领域查找方法论，按需查看速记概要或完整记忆句。'],
}

function loadSavedBank() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.questions?.length) return saved
  } catch { /* ignore invalid local state */ }
  return { name: '七大方法论面试题库', questions: seedQuestions }
}

export default function App() {
  const initialBank = useMemo(loadSavedBank, [])
  const [bank, setBank] = useState(initialBank)
  const [activeView, setActiveView] = useState('practice')
  const [deck, setDeck] = useState(() => shuffleQuestions(initialBank.questions))
  const [index, setIndex] = useState(0)
  const [reveal, setReveal] = useState(() => new URLSearchParams(window.location.search).get('reveal'))
  const [message, setMessage] = useState('')
  const fileInput = useRef(null)
  const question = deck[index]
  const [viewTitle, viewDescription] = VIEW_COPY[activeView]

  const chooseReveal = (type) => setReveal((current) => (current === type ? null : type))

  const nextQuestion = () => {
    setReveal(null)
    if (index + 1 < deck.length) setIndex((value) => value + 1)
    else {
      setDeck(shuffleQuestions(bank.questions))
      setIndex(0)
      setMessage('已完成一轮，题目顺序已重新打乱')
    }
  }

  const restart = () => {
    setDeck(shuffleQuestions(bank.questions))
    setIndex(0)
    setReveal(null)
    setMessage('已重新随机排序')
  }

  const openQuestion = (questionId) => {
    const targetIndex = deck.findIndex((item) => item.id === questionId)
    if (targetIndex < 0) return
    setIndex(targetIndex)
    setReveal(null)
    setActiveView('practice')
    setMessage('已从题库进入指定题目')
  }

  const importBank = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const questions = await parseQuestionFile(file)
      const imported = { name: file.name, questions }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported))
      setBank(imported)
      setDeck(shuffleQuestions(questions))
      setIndex(0)
      setReveal(null)
      setMessage(`成功导入 ${questions.length} 道题`)
    } catch (error) {
      setMessage(error.message || '题库导入失败')
    } finally {
      event.target.value = ''
    }
  }

  if (!question) return null

  return (
    <main className="app-shell">
      <Sidebar activeView={activeView} bankName={bank.name} onViewChange={setActiveView} questionCount={bank.questions.length} />
      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{viewTitle}</h1>
            <p>{viewDescription}</p>
          </div>
          <div className="top-actions">
            {activeView === 'practice' ? <button className="icon-action" onClick={restart} title="重新随机排序" aria-label="重新随机排序"><RotateCcw size={19} /></button> : null}
            {activeView !== 'methodology' ? <button className="import-button" onClick={() => fileInput.current?.click()}><Upload size={20} />导入题库</button> : null}
            <input ref={fileInput} type="file" accept=".docx,.md,.txt,.json" onChange={importBank} hidden />
          </div>
        </header>

        {activeView === 'practice' ? <><div className="question-stage" key={question.id}>
          <div className="question-meta">
            <strong>题目 {String(index + 1).padStart(2, '0')}</strong>
            <span>所属分类</span><b>{question.category}</b>
            <span>考察点</span><b>{question.topic}</b>
          </div>
          <h2>{question.question}</h2>

          <div className="reveal-actions">
            <button className={reveal === 'hint' ? 'selected' : ''} onClick={() => chooseReveal('hint')} aria-expanded={reveal === 'hint'}><Lightbulb size={24} />提示</button>
            <button className={reveal === 'answer' ? 'selected' : ''} onClick={() => chooseReveal('answer')} aria-expanded={reveal === 'answer'}><FileText size={23} />解答</button>
          </div>
          <div className="panel-slot"><RevealPanel type={reveal} question={question} /></div>
        </div>

        <footer className="progress-footer">
          <div className="progress-copy"><strong>{index + 1} / {deck.length}</strong><div className="progress-track"><span style={{ width: `${((index + 1) / deck.length) * 100}%` }} /></div></div>
          {message && <p className="toast" role="status">{message}</p>}
          <button className="next-button" onClick={nextQuestion}>下一题<ArrowRight /></button>
        </footer></> : activeView === 'library' ? <QuestionLibrary questions={bank.questions} onSelectQuestion={openQuestion} /> : <MethodologyQuickReference methodologies={methodologies} />}
      </section>
    </main>
  )
}
