const CARD_WIDTH = 1200
const OUTER_PADDING = 42
const CONTENT_PADDING = 72
const CONTENT_WIDTH = CARD_WIDTH - (OUTER_PADDING + CONTENT_PADDING) * 2
const FONT_FAMILY = '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'

function setFont(context, size, weight = 400) {
  context.font = `${weight} ${size}px ${FONT_FAMILY}`
}

function wrapText(context, text, maxWidth) {
  const lines = []
  for (const paragraph of String(text || '').split(/\r?\n/)) {
    if (!paragraph) {
      lines.push('')
      continue
    }

    let line = ''
    for (const character of Array.from(paragraph)) {
      const candidate = line + character
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line)
        line = character
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

function roundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

function measureCard(context, question) {
  setFont(context, 42, 700)
  const questionLines = wrapText(context, question.question, CONTENT_WIDTH)

  setFont(context, 31, 500)
  const hintLines = question.hints.map((hint) => wrapText(context, hint, CONTENT_WIDTH - 92))
  const answerLines = wrapText(context, question.answer, CONTENT_WIDTH - 72)

  const questionHeight = questionLines.length * 62
  const hintHeight = hintLines.reduce((height, lines) => height + Math.max(54, lines.length * 48) + 15, 0)
  const answerHeight = answerLines.length * 50
  const cardHeight = 230 + 62 + questionHeight + 58 + 70 + hintHeight + 58 + 70 + answerHeight + 92

  return {
    answerLines,
    cardHeight: Math.max(1500, cardHeight + 180),
    hintLines,
    questionLines,
  }
}

function drawLines(context, lines, x, y, lineHeight) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
  return y + lines.length * lineHeight
}

function drawSectionLabel(context, label, x, y, color) {
  setFont(context, 27, 700)
  context.fillStyle = color
  context.fillText(label, x, y)
}

function safeFilenamePart(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-').slice(0, 36) || '面试题'
}

async function downloadCanvas(canvas, filename) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Canvas export failed')

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportQuestionCard(question, questionNumber, totalQuestions) {
  if (document.fonts?.ready) await document.fonts.ready

  const measuringCanvas = document.createElement('canvas')
  const measuringContext = measuringCanvas.getContext('2d')
  if (!measuringContext) throw new Error('Canvas is not supported')
  const layout = measureCard(measuringContext, question)

  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = layout.cardHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported')

  context.fillStyle = '#eef3f9'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.save()
  context.shadowColor = 'rgba(22, 46, 79, 0.12)'
  context.shadowBlur = 32
  context.shadowOffsetY = 12
  roundedRect(context, OUTER_PADDING, OUTER_PADDING, CARD_WIDTH - OUTER_PADDING * 2, canvas.height - OUTER_PADDING * 2, 34)
  context.fillStyle = '#ffffff'
  context.fill()
  context.restore()

  const left = OUTER_PADDING + CONTENT_PADDING
  let y = 142

  setFont(context, 46, 800)
  context.fillStyle = '#0b1828'
  context.fillText('面试舱 · 答题卡', left, y)

  setFont(context, 25, 700)
  context.fillStyle = '#0969eb'
  context.textAlign = 'right'
  context.fillText(`题目 ${String(questionNumber).padStart(2, '0')} / ${totalQuestions}`, CARD_WIDTH - left, y)
  context.textAlign = 'left'

  y += 70
  context.strokeStyle = '#dbe4ef'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(left, y)
  context.lineTo(CARD_WIDTH - left, y)
  context.stroke()

  y += 55
  setFont(context, 22, 600)
  context.fillStyle = '#6a788d'
  context.fillText('分类', left, y)
  context.fillText('考察点', left + 520, y)
  setFont(context, 27, 700)
  context.fillStyle = '#21344c'
  context.fillText(question.category, left + 72, y)
  context.fillText(question.topic, left + 610, y)

  y += 78
  drawSectionLabel(context, '题干', left, y, '#0969eb')
  y += 57
  setFont(context, 42, 700)
  context.fillStyle = '#0b172b'
  y = drawLines(context, layout.questionLines, left, y, 62)

  y += 42
  const hintBoxHeight = layout.hintLines.reduce((height, lines) => height + Math.max(54, lines.length * 48) + 15, 0) + 102
  roundedRect(context, left, y, CONTENT_WIDTH, hintBoxHeight, 22)
  context.fillStyle = '#effbf8'
  context.fill()
  context.strokeStyle = '#b9ebe0'
  context.stroke()

  y += 53
  drawSectionLabel(context, '提示', left + 36, y, '#087b66')
  y += 53
  setFont(context, 31, 500)
  context.fillStyle = '#28475a'
  layout.hintLines.forEach((lines, index) => {
    context.fillStyle = '#0d9f80'
    context.beginPath()
    context.arc(left + 54, y - 10, 20, 0, Math.PI * 2)
    context.fill()
    setFont(context, 21, 800)
    context.fillStyle = '#ffffff'
    context.textAlign = 'center'
    context.fillText(String(index + 1), left + 54, y - 2)
    context.textAlign = 'left'
    setFont(context, 31, 500)
    context.fillStyle = '#28475a'
    y = drawLines(context, lines, left + 92, y, 48)
    y += 15
  })

  y += 22
  const answerBoxHeight = layout.answerLines.length * 50 + 116
  roundedRect(context, left, y, CONTENT_WIDTH, answerBoxHeight, 22)
  context.fillStyle = '#f3f7fd'
  context.fill()
  context.strokeStyle = '#c9dcef'
  context.stroke()

  y += 53
  drawSectionLabel(context, '解答', left + 36, y, '#175ea9')
  y += 55
  setFont(context, 31, 500)
  context.fillStyle = '#2d3d53'
  drawLines(context, layout.answerLines, left + 36, y, 50)

  const filename = `答题卡-${String(questionNumber).padStart(2, '0')}-${safeFilenamePart(question.topic)}.png`
  await downloadCanvas(canvas, filename)
  return filename
}
