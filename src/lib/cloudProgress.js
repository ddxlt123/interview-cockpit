import { mergeStudyProgress } from './studyProgress'

const EPOCH = '1970-01-01T00:00:00.000Z'

export function progressToCloudRows(progress = {}) {
  return Object.entries(progress).map(([questionKey, entry]) => ({
    question_key: questionKey,
    favorite: Boolean(entry.favorite),
    favorite_updated_at: entry.favoriteUpdatedAt || EPOCH,
    proficiency: entry.proficiency || 'unrated',
    proficiency_updated_at: entry.proficiencyUpdatedAt || EPOCH,
  }))
}

export function cloudRowsToProgress(rows = []) {
  return Object.fromEntries(rows.map((row) => [row.question_key, {
    favorite: Boolean(row.favorite),
    favoriteUpdatedAt: row.favorite_updated_at || '',
    proficiency: row.proficiency || 'unrated',
    proficiencyUpdatedAt: row.proficiency_updated_at || '',
  }]))
}

async function fetchCloudProgress(client) {
  const { data, error } = await client
    .from('question_progress')
    .select('question_key,favorite,favorite_updated_at,proficiency,proficiency_updated_at')

  if (error) throw error
  return cloudRowsToProgress(data)
}

export async function syncProgressWithCloud(client, localProgress = {}) {
  const remoteProgress = await fetchCloudProgress(client)
  const mergedProgress = mergeStudyProgress(localProgress, remoteProgress)
  const rows = progressToCloudRows(mergedProgress)

  if (rows.length) {
    const { error } = await client.rpc('merge_question_progress', { p_rows: rows })
    if (error) throw error
  }

  const authoritativeProgress = await fetchCloudProgress(client)
  return mergeStudyProgress(mergedProgress, authoritativeProgress)
}
