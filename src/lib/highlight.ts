import type { Expression } from '../types'

export interface Segment {
  text: string
  expr?: Expression
}

const isWordChar = (c: string | undefined) => !!c && /[A-Za-z0-9]/.test(c)

/** All occurrences of `needle` in `text`, case-insensitive, respecting word boundaries */
export function findAll(text: string, needle: string): number[] {
  const hay = text.toLowerCase()
  const n = needle.toLowerCase()
  const hits: number[] = []
  if (!n) return hits
  let i = hay.indexOf(n)
  while (i !== -1) {
    const before = text[i - 1]
    const after = text[i + n.length]
    const okStart = !isWordChar(n[0]) || !isWordChar(before)
    const okEnd = !isWordChar(n[n.length - 1]) || !isWordChar(after)
    if (okStart && okEnd) hits.push(i)
    i = hay.indexOf(n, i + 1)
  }
  return hits
}

export const matchText = (e: Expression) => e.match ?? e.phrase

/** Split a line into plain and highlighted segments. Longer matches win on overlap. */
export function segment(text: string, expressions: Expression[]): Segment[] {
  const ranges: { start: number; end: number; expr: Expression }[] = []
  for (const expr of expressions) {
    const m = matchText(expr)
    for (const start of findAll(text, m)) ranges.push({ start, end: start + m.length, expr })
  }
  ranges.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))

  const out: Segment[] = []
  let pos = 0
  for (const r of ranges) {
    if (r.start < pos) continue
    if (r.start > pos) out.push({ text: text.slice(pos, r.start) })
    out.push({ text: text.slice(r.start, r.end), expr: r.expr })
    pos = r.end
  }
  if (pos < text.length) out.push({ text: text.slice(pos) })
  return out
}
