import { useState } from 'react'
import { ChevronRight, EyeOff } from 'lucide-react'

export default function StarCollection({ experiences }) {
  const [activeStarId, setActiveStarId] = useState(null)
  const [displayModes, setDisplayModes] = useState({})

  const setMode = (starId, mode) => {
    setDisplayModes((current) => ({ ...current, [starId]: mode }))
  }

  const showStar = (starId, mode) => {
    setMode(starId, mode)
    setActiveStarId(starId)
  }

  const hideStar = (starId) => {
    setMode(starId, 'hidden')
    setActiveStarId((current) => current === starId ? null : current)
  }

  const toggleStar = (starId, mode, isOpen) => {
    if (isOpen) {
      setActiveStarId(null)
      return
    }

    if (mode === 'hidden') {
      showStar(starId, 'summary')
      return
    }

    setActiveStarId(starId)
  }

  return (
    <section className="star-stage">
      <div className="star-content-head">
        <div><span>个人经历素材</span><h2>STAR 合集</h2></div>
        <strong>{experiences.length} 条经历</strong>
      </div>

      <div className="method-list star-list">
        {experiences.map((experience) => {
          const mode = displayModes[experience.id] || 'hidden'
          const isOpen = activeStarId === experience.id

          return (
            <article className={`method-item star-item ${isOpen ? `open mode-${mode}` : ''}`} key={experience.id}>
              <div className="method-row">
                <button className="method-name-button" onClick={() => toggleStar(experience.id, mode, isOpen)} aria-expanded={isOpen}>
                  <h3>{experience.name}</h3><ChevronRight size={18} />
                </button>
                <div className="method-actions" aria-label={`${experience.name}显示方式`}>
                  <button className={isOpen && mode === 'summary' ? 'active' : ''} aria-pressed={isOpen && mode === 'summary'} onClick={() => showStar(experience.id, 'summary')}>概要</button>
                  <button className={isOpen && mode === 'detail' ? 'active' : ''} aria-pressed={isOpen && mode === 'detail'} onClick={() => showStar(experience.id, 'detail')}>详情</button>
                  <button onClick={() => hideStar(experience.id)}><EyeOff size={15} />隐藏</button>
                </div>
              </div>

              {isOpen && mode === 'summary' ? (
                <div className="method-summary star-summary" aria-live="polite">{experience.summary}</div>
              ) : null}

              {isOpen && mode === 'detail' ? (
                <div className="method-detail star-detail" aria-live="polite">
                  <section><strong><b>S</b> · 背景</strong><p>{experience.situation}</p></section>
                  <section><strong><b>T</b> · 任务</strong><p>{experience.task}</p></section>
                  <section>
                    <strong><b>A</b> · 行动</strong>
                    <ol>{experience.actions.map((action) => <li key={action}>{action}</li>)}</ol>
                  </section>
                  <section><strong><b>R</b> · 结果</strong><p>{experience.result}</p></section>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
