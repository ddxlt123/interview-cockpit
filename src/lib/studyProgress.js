export const PROGRESS_STORAGE_KEY = 'interview-cockpit-progress-v1'

export const PROFICIENCY_OPTIONS = [
  { value: 'unrated', label: '未评估' },
  { value: 'beginner', label: '生疏' },
  { value: 'practicing', label: '练习中' },
  { value: 'mastered', label: '熟练' },
]

const DEFAULT_ENTRY = {
  favorite: false,
  favoriteUpdatedAt: '',
  proficiency: 'unrated',
  proficiencyUpdatedAt: '',
}

function hashText(value) {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function getProgressKey(question) {
  return `${question.id}:${hashText(`${question.question}\n${question.answer}`)}`
}

export function getQuestionProgress(progress, question) {
  return { ...DEFAULT_ENTRY, ...(progress[getProgressKey(question)] || {}) }
}

export function updateQuestionProgress(progress, question, changes, now = new Date().toISOString()) {
  const key = getProgressKey(question)
  const current = { ...DEFAULT_ENTRY, ...(progress[key] || {}) }
  const next = { ...current }

  if (Object.hasOwn(changes, 'favorite')) {
    next.favorite = Boolean(changes.favorite)
    next.favoriteUpdatedAt = now
  }
  if (Object.hasOwn(changes, 'proficiency')) {
    const allowed = new Set(PROFICIENCY_OPTIONS.map((option) => option.value))
    next.proficiency = allowed.has(changes.proficiency) ? changes.proficiency : 'unrated'
    next.proficiencyUpdatedAt = now
  }

  return { ...progress, [key]: next }
}

function pickLatest(localEntry, remoteEntry, field, timestampField) {
  const localTime = Date.parse(localEntry[timestampField]) || 0
  const remoteTime = Date.parse(remoteEntry[timestampField]) || 0
  return remoteTime > localTime ? remoteEntry[field] : localEntry[field]
}

export function mergeStudyProgress(localProgress = {}, remoteProgress = {}) {
  const merged = {}
  const keys = new Set([...Object.keys(localProgress), ...Object.keys(remoteProgress)])

  keys.forEach((key) => {
    const localEntry = { ...DEFAULT_ENTRY, ...(localProgress[key] || {}) }
    const remoteEntry = { ...DEFAULT_ENTRY, ...(remoteProgress[key] || {}) }
    const favoriteFromRemote = (Date.parse(remoteEntry.favoriteUpdatedAt) || 0) > (Date.parse(localEntry.favoriteUpdatedAt) || 0)
    const proficiencyFromRemote = (Date.parse(remoteEntry.proficiencyUpdatedAt) || 0) > (Date.parse(localEntry.proficiencyUpdatedAt) || 0)

    merged[key] = {
      favorite: pickLatest(localEntry, remoteEntry, 'favorite', 'favoriteUpdatedAt'),
      favoriteUpdatedAt: favoriteFromRemote ? remoteEntry.favoriteUpdatedAt : localEntry.favoriteUpdatedAt,
      proficiency: pickLatest(localEntry, remoteEntry, 'proficiency', 'proficiencyUpdatedAt'),
      proficiencyUpdatedAt: proficiencyFromRemote ? remoteEntry.proficiencyUpdatedAt : localEntry.proficiencyUpdatedAt,
    }
  })

  return merged
}

export function loadStudyProgress(storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY))
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
  } catch {
    return {}
  }
}

export function saveStudyProgress(progress, storage = window.localStorage) {
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
}

export function parseProgressFile(text) {
  const parsed = JSON.parse(text)
  if (parsed?.version !== 1 || !parsed.progress || typeof parsed.progress !== 'object' || Array.isArray(parsed.progress)) {
    throw new Error('请选择由面试舱导出的学习进度 JSON 文件')
  }
  return parsed.progress
}

export function downloadStudyProgress(progress) {
  const payload = {
    app: 'interview-cockpit',
    version: 1,
    exportedAt: new Date().toISOString(),
    progress,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `面试舱学习进度-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
