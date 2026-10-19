import type { Card } from '../db'

export type Grade = 0 | 1 | 2 | 3 // again, hard, good, easy

const DAY = 86400000
const MIN = 60000

export function newCard(key: string, dialogueId: string): Card {
  const now = Date.now()
  return { key, dialogueId, addedAt: now, due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 }
}

/** Simplified SM-2 */
export function schedule(card: Card, grade: Grade, now = Date.now()): Card {
  let { interval, ease, reps, lapses } = card
  if (grade === 0) {
    return { ...card, interval: 0, reps: 0, lapses: lapses + 1, ease: Math.max(1.3, ease - 0.2), due: now + 10 * MIN }
  }
  if (grade === 1) {
    interval = reps === 0 ? 1 : Math.max(1, interval * 1.2)
    ease = Math.max(1.3, ease - 0.15)
  } else if (grade === 2) {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : interval * ease
  } else {
    interval = reps === 0 ? 3 : interval * ease * 1.3
    ease += 0.15
  }
  interval = Math.round(interval * 10) / 10
  return { ...card, interval, ease, reps: reps + 1, lapses, due: now + interval * DAY }
}

export function intervalLabel(card: Card, grade: Grade) {
  if (grade === 0) return '10분'
  const days = schedule(card, grade).interval
  if (days < 30) return `${Math.round(days)}일`
  if (days < 365) return `${Math.round(days / 30)}달`
  return `${(days / 365).toFixed(1)}년`
}
