import { useDeferredValue, useMemo, useState } from 'react'
import { ArrowRight, Search, Star } from 'lucide-react'
import { getQuestionProgress, PROFICIENCY_OPTIONS } from '../lib/studyProgress'

export default function QuestionLibrary({ questions, onSelectQuestion, progress }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部分类')
  const [proficiency, setProficiency] = useState('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const categories = useMemo(
    () => ['全部分类', ...new Set(questions.map((question) => question.category))],
    [questions],
  )

  const filteredQuestions = useMemo(() => questions.filter((question) => {
    const study = getQuestionProgress(progress, question)
    const matchesCategory = category === '全部分类' || question.category === category
    const matchesProficiency = proficiency === 'all' || study.proficiency === proficiency
    const matchesFavorite = !favoritesOnly || study.favorite
    const haystack = `${question.question} ${question.category} ${question.topic}`.toLowerCase()
    return matchesCategory && matchesProficiency && matchesFavorite && (!deferredQuery || haystack.includes(deferredQuery))
  }), [category, deferredQuery, favoritesOnly, proficiency, progress, questions])

  return (
    <section className="library-stage">
      <div className="library-toolbar">
        <label className="search-field">
          <Search size={19} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索题目或考察点"
          />
        </label>
        <label className="category-field">
          <span>分类</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="category-field study-filter">
          <span>熟练度</span>
          <select value={proficiency} onChange={(event) => setProficiency(event.target.value)}>
            <option value="all">全部</option>
            {PROFICIENCY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button className={`favorite-filter ${favoritesOnly ? 'active' : ''}`} onClick={() => setFavoritesOnly((value) => !value)} aria-pressed={favoritesOnly}>
          <Star size={17} fill={favoritesOnly ? 'currentColor' : 'none'} />只看收藏
        </button>
        <strong className="result-count">{filteredQuestions.length} 道题</strong>
      </div>

      {filteredQuestions.length ? (
        <ol className="question-list">
          {filteredQuestions.map((question) => {
            const originalIndex = questions.findIndex((item) => item.id === question.id)
            const study = getQuestionProgress(progress, question)
            const proficiencyLabel = PROFICIENCY_OPTIONS.find((option) => option.value === study.proficiency)?.label || '未评估'
            return (
              <li key={question.id}>
                <button onClick={() => onSelectQuestion(question.id)}>
                  <span className="question-number">{String(originalIndex + 1).padStart(2, '0')}</span>
                  <span className="question-summary">
                    <span className="question-tags"><b>{question.category}</b><em>{question.topic}</em></span>
                    <strong>{question.question}</strong>
                  </span>
                  <span className="question-side">
                    {study.favorite ? <Star className="favorite-mark" size={18} fill="currentColor" aria-label="已收藏" /> : null}
                    <em className={`proficiency-badge level-${study.proficiency}`}>{proficiencyLabel}</em>
                    <span className="practice-link">开始练习<ArrowRight size={18} /></span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <div className="empty-result"><Search size={26} /><strong>没有找到匹配题目</strong><span>试试更换关键词或分类。</span></div>
      )}
    </section>
  )
}
