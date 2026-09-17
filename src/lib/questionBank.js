const normalizeQuestion = (item, index) => {
  const hints = Array.isArray(item.hints)
    ? item.hints
    : String(item.hint || '')
        .split(/\n|；|;/)
        .map((value) => value.trim())
        .filter(Boolean)

  const question = String(item.question || item.title || '').trim()
  const answer = String(item.answer || item.referenceAnswer || '').trim()
  if (!question || !answer) return null

  return {
    id: String(item.id || `imported-${index + 1}`),
    category: String(item.category || '未分类').trim(),
    topic: String(item.topic || '综合能力').trim(),
    importance: String(item.importance || '★★★').trim(),
    question,
    hints: hints.length ? hints : deriveHints(answer),
    answer,
  }
}

export function deriveHints(answer) {
  const firstTwoSentences = String(answer)
    .split(/(?<=[。！？])/)
    .filter(Boolean)
    .slice(0, 2)
    .join('')

  const parts = firstTwoSentences
    .split(/[，；。]/)
    .map((value) => value.replace(/^我会(先|首先)?/, '').trim())
    .filter((value) => value.length >= 4)
    .slice(0, 3)

  return parts.length ? parts : ['先给出结论，再说明分析框架和判断标准']
}

export function parseQuestionText(text) {
  const clean = String(text).replace(/\r/g, '').trim()
  if (!clean) throw new Error('文档内容为空')

  const blocks = clean.split(/\n(?=(?:#{1,4}\s*)?(?:题目|问题)\s*(?:[:：]|\d+[.、]))/i)
  const parsed = blocks
    .map((block, index) => {
      const question = block.match(/(?:^|\n)(?:#{1,4}\s*)?(?:题目|问题)(?:\s*\d+)?\s*[:：、.]\s*(.+?)(?=\n(?:提示|参考作答|答案)\s*[:：]|$)/is)?.[1]
      const hint = block.match(/(?:^|\n)提示\s*[:：]\s*(.+?)(?=\n(?:参考作答|答案)\s*[:：]|$)/is)?.[1]
      const answer = block.match(/(?:^|\n)(?:参考作答|答案)\s*[:：]\s*([\s\S]+)$/i)?.[1]
      const category = block.match(/(?:^|\n)分类\s*[:：]\s*(.+)$/im)?.[1]
      const topic = block.match(/(?:^|\n)考察点\s*[:：]\s*(.+)$/im)?.[1]
      return normalizeQuestion(
        { question, hint, answer, category, topic, id: `imported-${index + 1}` },
        index,
      )
    })
    .filter(Boolean)

  if (!parsed.length) {
    throw new Error('未识别到题目。请按“题目：/提示：/参考作答：”格式整理文档。')
  }
  return parsed
}

export async function parseQuestionFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'json') {
    const raw = JSON.parse(await file.text())
    const source = Array.isArray(raw) ? raw : raw.questions
    if (!Array.isArray(source)) throw new Error('JSON 需要是数组，或包含 questions 数组')
    const questions = source.map(normalizeQuestion).filter(Boolean)
    if (!questions.length) throw new Error('JSON 中没有有效的 question 和 answer 字段')
    return questions
  }

  if (extension === 'docx') {
    const { default: mammoth } = await import('mammoth/mammoth.browser')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return parseQuestionText(result.value)
  }

  if (['md', 'txt'].includes(extension)) return parseQuestionText(await file.text())
  throw new Error('暂不支持该格式，请选择 .docx、.md、.txt 或 .json')
}

export function shuffleQuestions(questions) {
  const result = [...questions]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}
