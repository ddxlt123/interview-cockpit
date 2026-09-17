import { BookOpen, CheckCircle2, FileText, Layers3, LockKeyhole } from 'lucide-react'
import { BrandMark } from './Icons'

export default function Sidebar({ activeView, bankName, onViewChange, questionCount }) {
  return (
    <aside className="sidebar">
      <div className="brand"><BrandMark /><span>面试舱</span></div>
      <nav className="sidebar-nav" aria-label="主导航">
        <button className={`nav-item ${activeView === 'practice' ? 'active' : ''}`} onClick={() => onViewChange('practice')}><FileText size={20} />模拟面试</button>
        <button className={`nav-item ${activeView === 'library' ? 'active' : ''}`} onClick={() => onViewChange('library')}><BookOpen size={20} />题库</button>
        <button className={`nav-item ${activeView === 'methodology' ? 'active' : ''}`} onClick={() => onViewChange('methodology')}><Layers3 size={20} />方法论速查</button>
      </nav>

      <section className="bank-status" aria-label="当前题库">
        <div className="bank-heading"><FileText size={22} /><strong>已导入题库</strong><CheckCircle2 size={19} /></div>
        <p title={bankName}>{bankName}</p>
        <span>共 {questionCount} 道题</span>
        <div className="privacy"><LockKeyhole size={15} />题库仅在本机浏览器中处理</div>
      </section>
      <p className="sidebar-foot">专注面试 · 成就更好的你</p>
    </aside>
  )
}
