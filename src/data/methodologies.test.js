import { describe, expect, it } from 'vitest'
import methodologies from './methodologies.json'

describe('methodology quick reference data', () => {
  it('contains all six source domains and 47 methodologies', () => {
    expect(methodologies).toHaveLength(47)
    expect(new Set(methodologies.map((item) => item.domain)).size).toBe(6)
  })

  it('keeps the source wording for data credibility', () => {
    const method = methodologies.find((item) => item.name === '数据可信方法')
    expect(method.summary).toBe('源—口—层—证')
    expect(method.detail).toContain('先看数据从哪里来')
  })

  it('keeps all eleven methodologies from the financial high-risk section', () => {
    const financialMethods = methodologies.filter((item) => item.domain === '资金类高风险业务测试')
    expect(financialMethods).toHaveLength(11)
    expect(financialMethods[0]).toMatchObject({
      name: '总原则',
      summary: '钱不错—状态不乱—账要平—过程可追—故障能恢复',
      detail: '不多扣、不少记、不乱态、账能平、错能追回。',
    })
    expect(financialMethods.at(-1)).toMatchObject({
      name: '面试回答结构',
      summary: '先讲风险—再讲防线—说明怎么测—拿证据证明—补充适用边界',
    })
  })
})
