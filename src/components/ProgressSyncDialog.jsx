import { useState } from 'react'
import { Cloud, Download, FileUp, LogOut, Mail, RefreshCw, ShieldCheck, X } from 'lucide-react'

const STATUS_COPY = {
  checking: '正在检查登录状态',
  'link-sent': '等待本机打开邮件',
  'signed-out': '未登录',
  syncing: '正在同步',
  synced: '已同步',
  offline: '离线，联网后自动同步',
  error: '同步遇到问题',
  unconfigured: '尚未配置云端',
}

function formatSyncTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export default function ProgressSyncDialog({
  assessedCount,
  cloudConfigured,
  cloudEmail,
  cloudMessage,
  cloudStatus,
  favoriteCount,
  lastSyncedAt,
  onClose,
  onCloudCheckSession,
  onCloudSignIn,
  onCloudSignOut,
  onCloudSync,
  onExport,
  onImport,
}) {
  const [email, setEmail] = useState('')
  const isBusy = cloudStatus === 'checking' || cloudStatus === 'syncing'

  const submitEmail = (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim()
    if (normalizedEmail) onCloudSignIn(normalizedEmail)
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="sync-dialog" role="dialog" aria-modal="true" aria-labelledby="sync-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="关闭同步窗口"><X size={21} /></button>
        <div className="sync-icon"><ShieldCheck size={28} /></div>
        <h2 id="sync-title">同步学习进度</h2>
        <p>{cloudConfigured ? '登录后，收藏和熟练度会在不同设备间自动合并。' : '当前仍可使用 JSON 文件备份；配置云端后即可自动同步。'}</p>

        <div className="sync-stats">
          <span><strong>{favoriteCount}</strong> 道收藏</span>
          <span><strong>{assessedCount}</strong> 道已评估</span>
        </div>

        <section className="cloud-sync-card" aria-label="云端自动同步">
          <div className="cloud-sync-heading">
            <span><Cloud size={20} /><strong>云端自动同步</strong></span>
            <em className={`cloud-status status-${cloudStatus}`}>{STATUS_COPY[cloudStatus] || cloudStatus}</em>
          </div>

          {!cloudConfigured ? (
            <p className="cloud-setup-note">自动同步代码已就绪，还需要配置 Supabase Project URL、publishable key 和数据表。</p>
          ) : cloudEmail ? (
            <div className="cloud-account">
              <div><small>当前账号</small><strong>{cloudEmail}</strong>{lastSyncedAt ? <span>上次同步 {formatSyncTime(lastSyncedAt)}</span> : null}</div>
              <div className="cloud-account-actions">
                <button onClick={onCloudSync} disabled={isBusy}><RefreshCw size={17} />立即同步</button>
                <button onClick={onCloudSignOut}><LogOut size={17} />退出</button>
              </div>
            </div>
          ) : (
            <div className="cloud-login-panel">
              <form className="cloud-login" onSubmit={submitEmail}>
                <label htmlFor="sync-email">邮箱登录</label>
                <div><Mail size={18} /><input id="sync-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="输入邮箱地址" autoComplete="email" required /><button type="submit" disabled={isBusy}>发送登录链接</button></div>
                <small>每台设备都需要各自登录，并在该设备上打开邮件链接；使用同一邮箱即可共享进度。</small>
              </form>
              {cloudStatus === 'link-sent' ? <button type="button" className="cloud-session-check" onClick={onCloudCheckSession}><RefreshCw size={16} />我已打开链接，重新检查</button> : null}
            </div>
          )}

          {cloudMessage ? <p className={`cloud-message ${cloudStatus === 'error' ? 'error' : ''}`} role="status">{cloudMessage}</p> : null}
        </section>

        <div className="sync-divider"><span>JSON 备份</span></div>
        <div className="sync-actions">
          <button onClick={onExport}><Download size={20} /><span><strong>导出本机进度</strong><small>生成 JSON 备份文件</small></span></button>
          <button onClick={onImport}><FileUp size={20} /><span><strong>导入并合并</strong><small>保留两端全部题目，冲突取最新记录</small></span></button>
        </div>
        <p className="sync-note">题库内容不上传；云端只保存题目标识、收藏和熟练度。</p>
      </section>
    </div>
  )
}
