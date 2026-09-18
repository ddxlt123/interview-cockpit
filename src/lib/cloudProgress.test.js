import { describe, expect, it, vi } from 'vitest'
import { cloudRowsToProgress, progressToCloudRows, syncProgressWithCloud } from './cloudProgress'

const remoteRows = [
  {
    question_key: 'q-a',
    favorite: false,
    favorite_updated_at: '2026-09-17T08:00:00.000Z',
    proficiency: 'mastered',
    proficiency_updated_at: '2026-09-17T13:00:00.000Z',
  },
  {
    question_key: 'q-b',
    favorite: true,
    favorite_updated_at: '2026-09-17T12:00:00.000Z',
    proficiency: 'unrated',
    proficiency_updated_at: '1970-01-01T00:00:00.000Z',
  },
]

describe('cloud progress', () => {
  it('maps progress records to database rows and back', () => {
    const progress = {
      'q-a': {
        favorite: true,
        favoriteUpdatedAt: '2026-09-17T10:00:00.000Z',
        proficiency: 'practicing',
        proficiencyUpdatedAt: '2026-09-17T11:00:00.000Z',
      },
    }

    expect(cloudRowsToProgress(progressToCloudRows(progress))).toEqual(progress)
  })

  it('uploads the union and keeps the newest timestamp for each field', async () => {
    const localProgress = {
      'q-a': {
        favorite: true,
        favoriteUpdatedAt: '2026-09-17T12:00:00.000Z',
        proficiency: 'beginner',
        proficiencyUpdatedAt: '2026-09-17T09:00:00.000Z',
      },
    }
    const authoritativeRows = progressToCloudRows({
      'q-a': {
        favorite: true,
        favoriteUpdatedAt: '2026-09-17T12:00:00.000Z',
        proficiency: 'mastered',
        proficiencyUpdatedAt: '2026-09-17T13:00:00.000Z',
      },
      'q-b': cloudRowsToProgress(remoteRows)['q-b'],
    })
    let fetchCount = 0
    const rpc = vi.fn().mockResolvedValue({ error: null })
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(async () => ({
          data: fetchCount++ === 0 ? remoteRows : authoritativeRows,
          error: null,
        })),
      })),
      rpc,
    }

    const result = await syncProgressWithCloud(client, localProgress)

    expect(result).toMatchObject({
      'q-a': { favorite: true, proficiency: 'mastered' },
      'q-b': { favorite: true },
    })
    expect(rpc).toHaveBeenCalledOnce()
    expect(rpc.mock.calls[0][0]).toBe('merge_question_progress')
    expect(rpc.mock.calls[0][1].p_rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ question_key: 'q-a', favorite: true, proficiency: 'mastered' }),
      expect.objectContaining({ question_key: 'q-b', favorite: true }),
    ]))
  })

  it('surfaces database errors without overwriting local progress', async () => {
    const client = {
      from: () => ({ select: async () => ({ data: null, error: new Error('network unavailable') }) }),
    }

    await expect(syncProgressWithCloud(client, {})).rejects.toThrow('network unavailable')
  })
})
