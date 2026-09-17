import { Download, FileUp, ShieldCheck, X } from 'lucide-react'

export default function ProgressSyncDialog({ assessedCount, favoriteCount, onClose, onExport, onImport }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="sync-dialog" role="dialog" aria-modal="true" aria-labelledby="sync-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="关闭同步窗口"><X size={21} /></button>
        <div className="sync-icon"><ShieldCheck size={28} /></div>
        <h2 id="sync-title">同步学习进度</h2>
        <p>当前采用本地文件同步，不上传题库，也不在网页中保存 GitHub 密钥。</p>
        <div className="sync-stats">
          <span><strong>{favoriteCount}</strong> 道收藏</span>
          <span><strong>{assessedCount}</strong> 道已评估</span>
        </div>
        <div className="sync-actions">
          <button onClick={onExport}><Download size={20} /><span><strong>导出本机进度</strong><small>生成 JSON 备份文件</small></span></button>
          <button onClick={onImport}><FileUp size={20} /><span><strong>导入并合并</strong><small>保留两端全部题目，冲突取最新记录</small></span></button>
        </div>
        <p className="sync-note">推荐流程：设备 A 导出 → 设备 B 导入并合并 → 设备 B 再导出，带回设备 A。</p>
      </section>
    </div>
  )
}
