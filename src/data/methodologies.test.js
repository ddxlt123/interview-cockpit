import { describe, expect, it } from 'vitest'
import methodologies from './methodologies.json'

describe('methodology quick reference data', () => {
  it('contains all five source domains and 36 methodologies', () => {
    expect(methodologies).toHaveLength(36)
    expect(new Set(methodologies.map((item) => item.domain)).size).toBe(5)
  })

  it('keeps the source wording for data credibility', () => {
    const method = methodologies.find((item) => item.name === '数据可信方法')
    expect(method.summary).toBe('源—口—层—证')
    expect(method.detail).toContain('先看数据从哪里来')
  })
})
