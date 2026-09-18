export function getCloudAuthErrorMessage(error) {
  const message = String(error?.message || '').trim()
  const code = String(error?.code || '').trim()

  if (code === 'over_email_send_rate_limit' || /email rate limit exceeded/i.test(message)) {
    return '登录邮件额度已用完：Supabase 默认服务每小时最多发送 2 封。请等待额度恢复后再试；本机学习进度不会丢失。'
  }

  if (code === 'email_address_not_authorized' || /email address not authorized/i.test(message)) {
    return '当前邮箱不在项目成员列表中。Supabase 默认邮件服务只允许向项目成员邮箱发送登录邮件。'
  }

  if (/rate limit/i.test(message)) {
    return '请求过于频繁，请稍后再试；本机学习进度不会丢失。'
  }

  return message || '登录邮件发送失败，请稍后再试'
}
