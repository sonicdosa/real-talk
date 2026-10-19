import Dexie, { type EntityTable } from 'dexie'
import type { Dialogue } from './types'
import { todayKey } from './lib/date'

/** A saved expression and its spaced-repetition state */
export interface Card {
  key: string
  dialogueId: string
  addedAt: number
  due: number
  /** Days until next review */
  interval: number
  ease: number
  reps: number
  lapses: number
}

export interface Progress {
  dialogueId: string
  completedAt?: number
  quizBest?: number
  lastStudied: number
}

export interface Activity {
  date: string
  count: number
}

export const db = new Dexie('real-talk') as Dexie & {
  cards: EntityTable<Card, 'key'>
  progress: EntityTable<Progress, 'dialogueId'>
  activity: EntityTable<Activity, 'date'>
  customDialogues: EntityTable<Dialogue, 'id'>
}

db.version(1).stores({
  cards: 'key, dialogueId, due',
  progress: 'dialogueId',
  activity: 'date',
  customDialogues: 'id',
})

export async function logActivity() {
  const date = todayKey()
  const existing = await db.activity.get(date)
  await db.activity.put({ date, count: (existing?.count ?? 0) + 1 })
}

export async function touchProgress(dialogueId: string, patch: Partial<Progress> = {}) {
  const existing = await db.progress.get(dialogueId)
  await db.progress.put({ ...existing, ...patch, dialogueId, lastStudied: Date.now() })
}
