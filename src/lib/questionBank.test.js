import { describe, expect, it } from 'vitest'
import { deriveHints, parseQuestionText } from './questionBank'

describe('question bank parser', () => {
  it('parses the documented text template', () => {
    const result = parseQuestionText(`题目：如何设计回归测试？\n分类：测试设计\n考察点：覆盖策略\n提示：风险优先；分层覆盖\n参考作答：我会先识别风险，再分层设计用例。`)
    expect(result).toHaveLength(1)
    expect(result[0].hints).toEqual(['风险优先', '分层覆盖'])
    expect(result[0].category).toBe('测试设计')
  })

  it('derives concise hints when the source has no hint field', () => {
    expect(deriveHints('我会先确认范围，再收集日志，并通过对照实验验证。最后沉淀回归用例。')).toHaveLength(3)
  })
})
