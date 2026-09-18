import process from 'node:process'
import { loadEnv } from 'vite'

const env = loadEnv('production', process.cwd(), '')
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']
const missing = required.filter((name) => {
  const value = String(env[name] || '').trim()
  return !value || value.includes('your-project') || value.includes('your_key')
})

if (missing.length) {
  console.error(`发布已停止：请先在 .env.local 中填写 ${missing.join('、')}`)
  process.exit(1)
}

let url
try {
  url = new URL(env.VITE_SUPABASE_URL)
} catch {
  console.error('发布已停止：VITE_SUPABASE_URL 不是有效网址')
  process.exit(1)
}

if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) {
  console.error('发布已停止：VITE_SUPABASE_URL 应为 https://<project-ref>.supabase.co')
  process.exit(1)
}

if (!env.VITE_SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
  console.error('发布已停止：请使用 sb_publishable_ 开头的 publishable key，不要使用 secret/service_role key')
  process.exit(1)
}

console.log('云端配置检查通过，可以构建并发布。')
