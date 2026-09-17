import { useDeferredValue, useMemo, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'

export default function QuestionLibrary({ questions, onSelectQuestion }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部分类')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const categories = useMemo(
    () => ['全部分类', ...new Set(questions.map((question) => question.category))],
    [questions],
  )

  const filteredQuestions = useMemo(() => questions.filter((question) => {
    const matchesCategory = category === '全部分类' || question.category === category
    const haystack = `${question.question} ${question.category} ${question.topic}`.toLowerCase()
    return matchesCategory && (!deferredQuery || haystack.includes(deferredQuery))
  }), [category, deferredQuery, questions])

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
        <strong className="result-count">{filteredQuestions.length} 道题</strong>
      </div>

      {filteredQuestions.length ? (
        <ol className="question-list">
          {filteredQuestions.map((question) => {
            const originalIndex = questions.findIndex((item) => item.id === question.id)
            return (
              <li key={question.id}>
                <button onClick={() => onSelectQuestion(question.id)}>
                  <span className="question-number">{String(originalIndex + 1).padStart(2, '0')}</span>
                  <span className="question-summary">
                    <span className="question-tags"><b>{question.category}</b><em>{question.topic}</em></span>
                    <strong>{question.question}</strong>
                  </span>
                  <span className="practice-link">开始练习<ArrowRight size={18} /></span>
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
