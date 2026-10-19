import type { Dialogue, Expression, Line } from '../types'
import { findAll, matchText } from './highlight'

export type Question =
  | { kind: 'fill'; expr: Expression; line: Line; before: string; after: string; answer: string; options: string[] }
  | { kind: 'native'; expr: Expression; textbook: string; answer: string; options: string[] }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** `context` is the sentence shown in the question; options already visible there are skipped */
function pickDistractors(answer: string, own: string[], pool: string[], context = '', n = 3) {
  const lower = answer.toLowerCase()
  const uniq = (xs: string[]) => [...new Set(xs)].filter((x) => x.toLowerCase() !== lower && !findAll(context, x).length)
  const fromOwn = shuffle(uniq(own))
  const fromPool = shuffle(uniq(pool)).filter((x) => !fromOwn.includes(x))
  return [...fromOwn, ...fromPool].slice(0, n)
}

/** Options shouldn't give away the answer through punctuation */
const trimPunct = (s: string) => s.replace(/[.!?,]+$/, '')

/** Build a quiz for one dialogue. `all` supplies extra distractors. */
export function buildQuiz(d: Dialogue, all: Dialogue[], max = 8): Question[] {
  const poolMatches = all.flatMap((x) => x.expressions.map((e) => trimPunct(matchText(e))))
  const poolPhrases = all.flatMap((x) => x.expressions.map((e) => trimPunct(e.phrase)))
  const ownMatches = d.expressions.map((e) => trimPunct(matchText(e)))
  const ownPhrases = d.expressions.map((e) => trimPunct(e.phrase))

  const fills: Question[] = []
  const natives: Question[] = []
  for (const expr of d.expressions) {
    const full = matchText(expr)
    const m = trimPunct(full)
    const line = d.lines.find((ln) => findAll(ln.en, full).length)
    if (line) {
      const at = findAll(line.en, full)[0]
      const answer = line.en.slice(at, at + m.length)
      fills.push({
        kind: 'fill',
        expr,
        line,
        before: line.en.slice(0, at),
        after: line.en.slice(at + m.length),
        answer,
        options: shuffle([answer, ...pickDistractors(answer, ownMatches, poolMatches, line.en)]),
      })
    }
    if (expr.textbook) {
      natives.push({
        kind: 'native',
        expr,
        textbook: expr.textbook,
        answer: trimPunct(expr.phrase),
        options: shuffle([trimPunct(expr.phrase), ...pickDistractors(trimPunct(expr.phrase), ownPhrases, poolPhrases)]),
      })
    }
  }
  // Mostly fill-in-the-blank, with up to 3 "how would a native say it" questions mixed in
  const picked = [...shuffle(fills).slice(0, max - Math.min(3, natives.length)), ...shuffle(natives).slice(0, 3)]
  return shuffle(picked).slice(0, max)
}
