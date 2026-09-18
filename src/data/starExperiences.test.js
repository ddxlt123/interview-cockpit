import { describe, expect, it } from 'vitest'
import starExperiences from './starExperiences.json'

describe('STAR collection data', () => {
  it('contains all seven source experiences with complete STAR fields', () => {
    expect(starExperiences).toHaveLength(7)
    expect(new Set(starExperiences.map((item) => item.id)).size).toBe(7)

    for (const item of starExperiences) {
      expect(item.name).toMatch(/^STAR\d：/)
      expect(item.summary.length).toBeGreaterThan(10)
      expect(item.situation.length).toBeGreaterThan(10)
      expect(item.task.length).toBeGreaterThan(10)
      expect(item.actions.length).toBeGreaterThan(0)
      expect(item.result.length).toBeGreaterThan(10)
      expect(item.interviewQuestions).toHaveLength(3)
      expect(item.interviewQuestions.every((question) => question.endsWith('？'))).toBe(true)
    }
  })

  it('contains 21 distinct interview questions', () => {
    const questions = starExperiences.flatMap((item) => item.interviewQuestions)
    expect(questions).toHaveLength(21)
    expect(new Set(questions).size).toBe(21)
  })

  it('preserves the source metrics for the quality-risk example', () => {
    const item = starExperiences.find((experience) => experience.id === 'star07')
    expect(item.situation).toContain('>2000ms')
    expect(item.situation).toContain('≤0.20%')
    expect(item.situation).toContain('0.50%')
    expect(item.situation).toContain('2.5 倍')
  })
})
