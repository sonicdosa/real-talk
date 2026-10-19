import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BUILTIN_DIALOGUES } from '../data'
import { db } from '../db'
import type { Dialogue, ExpressionRef } from '../types'
import { findAll, matchText } from '../lib/highlight'
import { endOfToday } from '../lib/date'

export function useDialogues(): Dialogue[] {
  const custom = useLiveQuery(() => db.customDialogues.toArray(), [], [])
  return useMemo(() => [...BUILTIN_DIALOGUES, ...custom], [custom])
}

export const exprKey = (dialogueId: string, exprId: string) => `${dialogueId}.${exprId}`

/** Map of every expression by its global key */
export function useExpressionIndex() {
  const dialogues = useDialogues()
  return useMemo(() => {
    const map = new Map<string, ExpressionRef>()
    for (const d of dialogues) {
      for (const e of d.expressions) {
        const example = d.lines.find((ln) => findAll(ln.en, matchText(e)).length)
        const key = exprKey(d.id, e.id)
        map.set(key, { ...e, key, dialogueId: d.id, example })
      }
    }
    return map
  }, [dialogues])
}

export function useSavedKeys(): Set<string> {
  const keys = useLiveQuery(() => db.cards.toCollection().primaryKeys(), [], [])
  return useMemo(() => new Set(keys), [keys])
}

export function useDueCount() {
  return useLiveQuery(() => db.cards.where('due').belowOrEqual(endOfToday()).count(), [], 0)
}
