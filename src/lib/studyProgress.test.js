import { describe, expect, it } from 'vitest'
import {
  getProgressKey,
  getQuestionProgress,
  loadStudyProgress,
  mergeStudyProgress,
  normalizeStudyProgress,
  parseProgressFile,
  PROGRESS_STORAGE_KEY,
  updateQuestionProgress,
} from './studyProgress'

const question = { id: 'q001', question: '测试问题', answer: '测试答案' }

describe('study progress', () => {
  it('updates favorite and proficiency independently', () => {
    let progress = updateQuestionProgress({}, question, { favorite: true }, '2026-09-17T10:00:00.000Z')
    progress = updateQuestionProgress(progress, question, { proficiency: 'practicing' }, '2026-09-17T11:00:00.000Z')
    expect(getQuestionProgress(progress, question)).toMatchObject({ favorite: true, proficiency: 'practicing' })
  })

  it('keeps the same progress key when question or answer copy changes', () => {
    expect(getProgressKey(question)).toBe('q001')
    expect(getProgressKey({ ...question, question: '新题干', answer: '新答案' })).toBe('q001')
  })

  it('recovers legacy answer-hash entries under the stable question id', () => {
    const recovered = normalizeStudyProgress({
      'q001:1abcxyz': {
        favorite: true,
        favoriteUpdatedAt: '2026-09-17T10:00:00.000Z',
        proficiency: 'mastered',
        proficiencyUpdatedAt: '2026-09-17T11:00:00.000Z',
      },
    })

    expect(recovered).toEqual({
      q001: expect.objectContaining({ favorite: true, proficiency: 'mastered' }),
    })
  })

  it('persists migrated legacy progress during load', () => {
    const storage = {
      value: JSON.stringify({
        'q001:1abcxyz': {
          favorite: true,
          favoriteUpdatedAt: '2026-09-17T10:00:00.000Z',
          proficiency: 'practicing',
          proficiencyUpdatedAt: '2026-09-17T11:00:00.000Z',
        },
      }),
      getItem: () => storage.value,
      setItem: (_key, value) => { storage.value = value },
    }

    expect(loadStudyProgress(storage)).toHaveProperty('q001.favorite', true)
    expect(JSON.parse(storage.value)).toHaveProperty('q001.proficiency', 'practicing')
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).not.toContain('q001:1abcxyz')
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
