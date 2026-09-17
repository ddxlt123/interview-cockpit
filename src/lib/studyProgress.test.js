import { describe, expect, it } from 'vitest'
import { getQuestionProgress, mergeStudyProgress, parseProgressFile, updateQuestionProgress } from './studyProgress'

const question = { id: 'q001', question: '测试问题', answer: '测试答案' }

describe('study progress', () => {
  it('updates favorite and proficiency independently', () => {
    let progress = updateQuestionProgress({}, question, { favorite: true }, '2026-09-17T10:00:00.000Z')
    progress = updateQuestionProgress(progress, question, { proficiency: 'practicing' }, '2026-09-17T11:00:00.000Z')
    expect(getQuestionProgress(progress, question)).toMatchObject({ favorite: true, proficiency: 'practicing' })
  })

  it('takes the union of question entries and resolves each field by its latest timestamp', () => {
    const local = {
      a: { favorite: true, favoriteUpdatedAt: '2026-09-17T12:00:00.000Z', proficiency: 'beginner', proficiencyUpdatedAt: '2026-09-17T09:00:00.000Z' },
    }
    const remote = {
      a: { favorite: false, favoriteUpdatedAt: '2026-09-17T08:00:00.000Z', proficiency: 'mastered', proficiencyUpdatedAt: '2026-09-17T13:00:00.000Z' },
      b: { favorite: true, favoriteUpdatedAt: '2026-09-17T13:00:00.000Z', proficiency: 'unrated', proficiencyUpdatedAt: '' },
    }
    expect(mergeStudyProgress(local, remote)).toMatchObject({
      a: { favorite: true, proficiency: 'mastered' },
      b: { favorite: true },
    })
  })

  it('rejects unrelated JSON files', () => {
    expect(() => parseProgressFile('{"questions":[]}')).toThrow('面试舱导出的学习进度')
  })
})
