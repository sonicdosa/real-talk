import type { Dialogue, ExpressionType, ScenarioId } from '../types'
import { findAll, matchText } from './highlight'

const SCENARIO_IDS: ScenarioId[] = ['cafe', 'shopping', 'home', 'work', 'friends', 'travel', 'texting']
const TYPES: ExpressionType[] = ['reduction', 'phrasal', 'idiom', 'filler', 'slang', 'reaction']

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

export interface ValidationResult {
  dialogue?: Dialogue
  errors: string[]
  warnings: string[]
}

/** Validate and normalize one dialogue object (from user-pasted JSON) */
export function validateDialogue(raw: unknown, idx = 0): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const where = `대화 ${idx + 1}`
  if (!raw || typeof raw !== 'object') return { errors: [`${where}: 객체가 아니에요.`], warnings }
  const r = raw as Record<string, unknown>

  if (!isStr(r.title)) errors.push(`${where}: title이 없어요.`)
  if (!isStr(r.titleKo)) warnings.push(`${where}: titleKo가 없어서 title을 사용해요.`)
  const scenario = SCENARIO_IDS.includes(r.scenario as ScenarioId) ? (r.scenario as ScenarioId) : 'friends'
  if (scenario !== r.scenario) warnings.push(`${where}: scenario가 올바르지 않아 'friends'로 설정했어요.`)
  const level = [1, 2, 3].includes(Number(r.level)) ? (Number(r.level) as 1 | 2 | 3) : 2

  const sp = (r.speakers ?? {}) as Record<string, unknown>
  const speakers = { A: isStr(sp.A) ? sp.A : 'A', B: isStr(sp.B) ? sp.B : '나' }

  const lines = Array.isArray(r.lines)
    ? r.lines.flatMap((ln, i) => {
        const o = (ln ?? {}) as Record<string, unknown>
        if (!isStr(o.en)) {
          errors.push(`${where} ${i + 1}번째 줄: en이 없어요.`)
          return []
        }
        return [{ s: o.s === 'B' ? ('B' as const) : ('A' as const), en: o.en.trim(), ko: isStr(o.ko) ? o.ko.trim() : '' }]
      })
    : []
  if (lines.length < 2) errors.push(`${where}: lines가 2줄 이상 필요해요.`)

  const seen = new Set<string>()
  const expressions = Array.isArray(r.expressions)
    ? r.expressions.flatMap((ex, i) => {
        const o = (ex ?? {}) as Record<string, unknown>
        if (!isStr(o.phrase) || !isStr(o.meaning)) {
          warnings.push(`${where} 표현 ${i + 1}: phrase/meaning이 없어 건너뛰었어요.`)
          return []
        }
        let id = isStr(o.id) ? o.id : `e${i + 1}`
        while (seen.has(id)) id += '_'
        seen.add(id)
        const expr = {
          id,
          phrase: o.phrase.trim(),
          meaning: o.meaning.trim(),
          type: TYPES.includes(o.type as ExpressionType) ? (o.type as ExpressionType) : 'idiom',
          ...(isStr(o.match) && { match: o.match.trim() }),
          ...(isStr(o.nuance) && { nuance: o.nuance.trim() }),
          ...(isStr(o.textbook) && { textbook: o.textbook.trim() }),
        }
        if (!lines.some((ln) => findAll(ln.en, matchText(expr)).length)) {
          warnings.push(`${where}: "${matchText(expr)}"를 대사에서 찾지 못해 강조 표시가 안 돼요.`)
        }
        return [expr]
      })
    : []

  if (errors.length) return { errors, warnings }

  const title = (r.title as string).trim()
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
  return {
    dialogue: {
      id: isStr(r.id) ? r.id : `custom-${slug}-${Date.now().toString(36)}-${idx}`,
      title,
      titleKo: isStr(r.titleKo) ? r.titleKo.trim() : title,
      scenario,
      level,
      situation: isStr(r.situation) ? r.situation.trim() : '',
      speakers,
      lines,
      expressions,
      custom: true,
    },
    errors,
    warnings,
  }
}

/** Dev-time check that every built-in expression is found in its dialogue */
export function checkBuiltins(dialogues: Dialogue[]) {
  const ids = new Set<string>()
  for (const d of dialogues) {
    if (ids.has(d.id)) console.warn(`[data] duplicate dialogue id ${d.id}`)
    ids.add(d.id)
    const exprIds = new Set<string>()
    for (const e of d.expressions) {
      if (exprIds.has(e.id)) console.warn(`[data] ${d.id}: duplicate expression id ${e.id}`)
      exprIds.add(e.id)
      if (!d.lines.some((ln) => findAll(ln.en, matchText(e)).length)) {
        console.warn(`[data] ${d.id}: "${matchText(e)}" not found in lines`)
      }
    }
  }
}
