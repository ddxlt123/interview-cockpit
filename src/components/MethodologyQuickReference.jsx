import { useMemo, useState } from 'react'
import { BookOpenCheck, ChevronRight, EyeOff, Layers3 } from 'lucide-react'

const DOMAINS = ['用户洞察', '大数据质量体系', '系统性测试设计', 'AI应用测试与评测', '缺陷风险定级']

export default function MethodologyQuickReference({ methodologies }) {
  const [activeDomain, setActiveDomain] = useState(null)
  const [activeMethodId, setActiveMethodId] = useState(null)
  const [displayModes, setDisplayModes] = useState({})
  const countsByDomain = useMemo(
    () => new Map(DOMAINS.map((domain) => [domain, methodologies.filter((method) => method.domain === domain).length])),
    [methodologies],
  )
  const visibleMethods = activeDomain
    ? methodologies.filter((method) => method.domain === activeDomain)
    : []

  const setMode = (methodId, mode) => {
    setDisplayModes((current) => ({ ...current, [methodId]: mode }))
  }

  const chooseDomain = (domain) => {
    setActiveDomain(domain)
    setActiveMethodId(null)
  }

  const hideMethod = (methodId) => {
    setMode(methodId, 'hidden')
    setActiveMethodId(null)
  }

  return (
    <section className="methodology-stage">
      <aside className="domain-selector" aria-label="方法论领域">
        <div className="domain-heading"><Layers3 size={19} /><strong>选择领域</strong></div>
        {DOMAINS.map((domain) => (
          <button
            key={domain}
            className={activeDomain === domain ? 'active' : ''}
            onClick={() => chooseDomain(domain)}
          >
            <span>{domain}</span><b>{countsByDomain.get(domain)}</b><ChevronRight size={17} />
          </button>
        ))}
      </aside>

      <div className="methodology-content">
        {activeDomain ? (
          <>
            <div className="methodology-content-head">
              <div><span>当前领域</span><h2>{activeDomain}</h2></div>
              <strong>{visibleMethods.length} 个方法论</strong>
            </div>
            <div className="method-list">
              {visibleMethods.map((method) => {
                const mode = displayModes[method.id] || 'hidden'
                const isOpen = activeMethodId === method.id
                return (
                  <article className={`method-item ${isOpen ? `open mode-${mode}` : ''}`} key={method.id}>
                    <div className="method-row">
                      <button className="method-name-button" onClick={() => setActiveMethodId(isOpen ? null : method.id)} aria-expanded={isOpen}>
                        <h3>{method.name}</h3><ChevronRight size={18} />
                      </button>
                      {isOpen ? <div className="method-actions" aria-label={`${method.name}显示方式`}>
                        <button className={mode === 'summary' ? 'active' : ''} onClick={() => setMode(method.id, 'summary')}>概要</button>
                        <button className={mode === 'detail' ? 'active' : ''} onClick={() => setMode(method.id, 'detail')}>详情</button>
                        <button onClick={() => hideMethod(method.id)}><EyeOff size={15} />隐藏</button>
                      </div> : null}
                    </div>
                    {isOpen && mode === 'summary' ? <div className="method-summary" aria-live="polite">{method.summary}</div> : null}
                    {isOpen && mode === 'detail' ? (
                      <div className="method-detail" aria-live="polite">
                        <strong>{method.name}：{method.summary}</strong>
                        <p><b>记忆句：</b>{method.detail}</p>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </>
        ) : (
          <div className="domain-empty">
            <BookOpenCheck size={34} />
            <h2>先选择一个方法论领域</h2>
            <p>选择领域后，可逐项查看方法论概要或完整记忆句。</p>
          </div>
        )}
      </div>
    </section>
  )
}
