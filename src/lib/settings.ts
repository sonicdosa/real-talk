import { useSyncExternalStore } from 'react'

export interface Settings {
  rate: number
  /** Show Korean translation under each line by default */
  showKo: boolean
  voiceA: string
  voiceB: string
}

const KEY = 'real-talk-settings'
const DEFAULTS: Settings = { rate: 0.95, showKo: false, voiceA: '', voiceB: '' }

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

let current = load()
const listeners = new Set<() => void>()

export function getSettings() {
  return current
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // storage unavailable; keep in memory
  }
  listeners.forEach((l) => l())
}

export function useSettings() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}
