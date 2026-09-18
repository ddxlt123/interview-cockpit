import { describe, expect, it } from 'vitest'
import { getCloudAuthErrorMessage } from './cloudAuth'

describe('cloud auth error messages', () => {
  it('explains the built-in email quota in Chinese', () => {
    expect(getCloudAuthErrorMessage({ message: 'email rate limit exceeded' })).toContain('每小时最多发送 2 封')
  })

  it('explains the default provider member restriction', () => {
    expect(getCloudAuthErrorMessage({ code: 'email_address_not_authorized' })).toContain('项目成员邮箱')
  })

  it('keeps useful unknown error messages', () => {
    expect(getCloudAuthErrorMessage({ message: 'network unavailable' })).toBe('network unavailable')
  })
})
