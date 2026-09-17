import { ChevronUp, FileText, Lightbulb } from 'lucide-react'

export default function RevealPanel({ type, question }) {
  if (type === 'hint') {
    return (
      <section className="reveal-panel hint-panel" aria-live="polite">
        <div className="panel-title"><Lightbulb size={22} /><strong>提示</strong><ChevronUp size={21} /></div>
        <ol>
          {question.hints.map((hint, index) => <li key={`${hint}-${index}`}>{hint}</li>)}
        </ol>
        <p className="generated-note">提示由参考作答的步骤与关键词提炼。</p>
      </section>
    )
  }

  if (type === 'answer') {
    return (
      <section className="reveal-panel answer-panel" aria-live="polite">
        <div className="panel-title"><FileText size={22} /><strong>参考作答</strong><ChevronUp size={21} /></div>
        <p className="answer-copy">{question.answer}</p>
      </section>
    )
  }
  return null
}
