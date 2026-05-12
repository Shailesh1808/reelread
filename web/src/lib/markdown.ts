const BOT_LINE_PATTERNS = [
  /reply save/i,
  /reply last/i,
  /reply mode/i,
  /switch mode/i,
  /follow.up question/i,
  /previous summary/i,
  /just ask/i,
  /save this\?/i,
  /^─{5,}$/,
]

export function cleanSummaryText(text: string): string {
  if (!text) return ''
  return text
    .split('\n')
    .filter((line) => !BOT_LINE_PATTERNS.some((p) => p.test(line.trim())))
    .join('\n')
    .trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function applyInline(text: string): string {
  let s = escapeHtml(text)
  s = s.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
  s = s.replace(/_([^_\n]+)_/g, '<em>$1</em>')
  return s
}

// Detects lines like "🎯 *What This Is About*": emoji prefix + *entire line bold*
function isSectionHeader(line: string): boolean {
  const content = line.trim().replace(/^[^a-zA-Z0-9*]+/, '')
  return /^\*[^*]+\*$/.test(content)
}

export function getPreviewText(text: string): string {
  if (!text) return ''
  const lines = text.split('\n')
  const plain: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (isSectionHeader(trimmed)) continue
    if (/^─{3,}$/.test(trimmed)) continue
    if (/^[•\-]\s/.test(trimmed)) continue
    if (/^\d+\.\s/.test(trimmed)) continue

    const stripped = trimmed
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/_([^_\n]+)_/g, '$1')
      .trim()

    if (stripped) {
      plain.push(stripped)
      if (plain.length >= 2) break
    }
  }

  return plain.join(' ')
}

export function renderWhatsAppMarkdown(text: string): string {
  if (!text) return ''

  const lines = text.split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()

    // Divider line
    if (/^─{3,}$/.test(trimmed)) {
      out.push('<hr class="wm-hr" />')
      i++
      continue
    }

    // Empty line
    if (trimmed === '') {
      out.push('<div class="wm-gap"></div>')
      i++
      continue
    }

    // Section header: emoji + *bold entire line*
    if (isSectionHeader(trimmed)) {
      const headerText = escapeHtml(trimmed.replace(/^([^a-zA-Z0-9*]*)\*([^*]+)\*$/, '$1$2').trim())
      out.push(`<p class="wm-header">${headerText}</p>`)
      i++
      continue
    }

    // Numbered list: collect consecutive items
    if (/^\d+\.\s/.test(trimmed)) {
      out.push('<ol class="wm-ol">')
      while (i < lines.length) {
        const m = lines[i].trim().match(/^\d+\.\s+(.+)$/)
        if (!m) break
        out.push(`<li>${applyInline(m[1])}</li>`)
        i++
      }
      out.push('</ol>')
      continue
    }

    // Bullet list: • or -
    if (/^[•\-]\s/.test(trimmed)) {
      out.push('<ul class="wm-ul">')
      while (i < lines.length) {
        const bl = lines[i].trim()
        if (!/^[•\-]\s/.test(bl)) break
        out.push(`<li>${applyInline(bl.replace(/^[•\-]\s+/, ''))}</li>`)
        i++
      }
      out.push('</ul>')
      continue
    }

    // Regular line
    out.push(`<p class="wm-p">${applyInline(trimmed)}</p>`)
    i++
  }

  return out.join('')
}
