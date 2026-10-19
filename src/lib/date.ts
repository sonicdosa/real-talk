const pad = (n: number) => String(n).padStart(2, '0')

export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayKey = () => dateKey(new Date())

export function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** Consecutive days with activity, ending today (or yesterday if today has none yet) */
export function streakFrom(dates: Set<string>) {
  const d = new Date()
  if (!dates.has(dateKey(d))) d.setDate(d.getDate() - 1)
  let streak = 0
  while (dates.has(dateKey(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/** Stable per-day number, used to rotate "today's dialogue" */
export function dayNumber() {
  const now = new Date()
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000)
}
