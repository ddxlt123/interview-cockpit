import { useMemo, useRef, useState } from 'react'
import { Cloud, Download, FileText, ImageDown, Lightbulb, RotateCcw, Star } from 'lucide-react'
import seedQuestions from './data/questions.json'
import { parseQuestionFile, shuffleQuestions } from './lib/questionBank'
import { exportQuestionCard } from './lib/exportQuestionCard'
import {
  downloadStudyProgress,
  getQuestionProgress,
  loadStudyProgress,
  mergeStudyProgress,
  parseProgressFile,
  PROFICIENCY_OPTIONS,
  saveStudyProgress,
  updateQuestionProgress,
} from './lib/studyProgress'
import Sidebar from './components/Sidebar'
import RevealPanel from './components/RevealPanel'
import QuestionLibrary from './components/QuestionLibrary'
import MethodologyQuickReference from './components/MethodologyQuickReference'
import ProgressSyncDialog from './components/ProgressSyncDialog'
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
  const [progress, setProgress] = useState(loadStudyProgress)
  const [syncOpen, setSyncOpen] = useState(false)
  const fileInput = useRef(null)
  const progressInput = useRef(null)
  const question = deck[index]
  const currentProgress = getQuestionProgress(progress, question)
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

  const exportCard = async () => {
    setMessage('正在生成答题卡图片…')
    try {
      const filename = await exportQuestionCard(question, index + 1, deck.length)
      setMessage(`已导出 ${filename}`)
    } catch {
      setMessage('答题卡导出失败，请重试')
    }
  }

  const persistProgress = (updater) => {
    setProgress((current) => {
      const next = updater(current)
      saveStudyProgress(next)
      return next
    })
  }

  const updateCurrentProgress = (changes) => {
    persistProgress((current) => updateQuestionProgress(current, question, changes))
    if (Object.hasOwn(changes, 'favorite')) setMessage(changes.favorite ? '已收藏当前题目' : '已取消收藏')
    if (Object.hasOwn(changes, 'proficiency')) {
      const label = PROFICIENCY_OPTIONS.find((option) => option.value === changes.proficiency)?.label
      setMessage(`熟练度已更新为“${label}”`)
    }
  }

  const importProgress = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const remoteProgress = parseProgressFile(await file.text())
      persistProgress((current) => mergeStudyProgress(current, remoteProgress))
      setMessage('学习进度已合并到本机')
      setSyncOpen(false)
    } catch (error) {
      setMessage(error.message || '学习进度导入失败')
    } finally {
      event.target.value = ''
    }
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
            {activeView !== 'methodology' ? <button className="import-button" onClick={() => fileInput.current?.click()} title="导入题库" aria-label="导入题库"><Download size={20} />导入题库</button> : null}
            {activeView === 'practice' ? <button className="export-button" onClick={exportCard} title="导出当前题目答题卡" aria-label="导出当前题目答题卡"><ImageDown size={20} />导出答题卡</button> : null}
            {activeView !== 'methodology' ? <button className="sync-button" onClick={() => setSyncOpen(true)} title="同步学习进度" aria-label="同步学习进度"><Cloud size={20} />同步进度</button> : null}
            <input ref={fileInput} type="file" accept=".docx,.md,.txt,.json" onChange={importBank} hidden />
            <input ref={progressInput} type="file" accept="application/json,.json" onChange={importProgress} hidden />
          </div>
        </header>

        {activeView === 'practice' ? <><div className="question-stage" key={question.id}>
          <div className="question-meta">
            <strong>题目 {String(index + 1).padStart(2, '0')}</strong>
            <span>所属分类</span><b>{question.category}</b>
            <span>考察点</span><b>{question.topic}</b>
          </div>
          <h2>{question.question}</h2>

          <div className="study-controls" aria-label="当前题目学习进度">
            <button className={`favorite-button ${currentProgress.favorite ? 'active' : ''}`} onClick={() => updateCurrentProgress({ favorite: !currentProgress.favorite })} aria-pressed={currentProgress.favorite}>
              <Star size={19} fill={currentProgress.favorite ? 'currentColor' : 'none'} />{currentProgress.favorite ? '已收藏' : '收藏'}
            </button>
            <label className="proficiency-control">
              <span>熟练度</span>
              <select value={currentProgress.proficiency} onChange={(event) => updateCurrentProgress({ proficiency: event.target.value })}>
                {PROFICIENCY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

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
        </footer></> : activeView === 'library' ? <QuestionLibrary questions={bank.questions} onSelectQuestion={openQuestion} progress={progress} /> : <MethodologyQuickReference methodologies={methodologies} />}
      </section>
      {syncOpen ? (
        <ProgressSyncDialog
          assessedCount={Object.values(progress).filter((entry) => entry.proficiency && entry.proficiency !== 'unrated').length}
          favoriteCount={Object.values(progress).filter((entry) => entry.favorite).length}
          onClose={() => setSyncOpen(false)}
          onExport={() => downloadStudyProgress(progress)}
          onImport={() => progressInput.current?.click()}
        />
      ) : null}
    </main>
  )
}
