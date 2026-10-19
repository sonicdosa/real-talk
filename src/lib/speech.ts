import { useEffect, useState } from 'react'
import { getSettings } from './settings'

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

const isUS = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase() === 'en-us'

export function usVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported) return []
  const all = speechSynthesis.getVoices()
  const us = all.filter(isUS)
  // Prefer higher-quality voices (Google / Natural / Enhanced) first
  const score = (v: SpeechSynthesisVoice) => (/natural|neural|enhanced|premium|google/i.test(v.name) ? 0 : 1)
  return (us.length ? us : all.filter((v) => v.lang.toLowerCase().startsWith('en'))).sort(
    (a, b) => score(a) - score(b) || a.name.localeCompare(b.name),
  )
}

/** Re-renders when the browser finishes loading its voice list */
export function useVoices() {
  const [voices, setVoices] = useState(usVoices)
  useEffect(() => {
    if (!ttsSupported) return
    const update = () => setVoices(usVoices())
    speechSynthesis.addEventListener('voiceschanged', update)
    update()
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])
  return voices
}

function voiceFor(speaker: 'A' | 'B'): SpeechSynthesisVoice | undefined {
  const voices = usVoices()
  const { voiceA, voiceB } = getSettings()
  const wanted = speaker === 'A' ? voiceA : voiceB
  const picked = voices.find((v) => v.voiceURI === wanted)
  if (picked) return picked
  // Default: first voice for A, a different one for B when available
  return speaker === 'A' ? voices[0] : (voices.find((v) => v !== voiceFor('A')) ?? voices[0])
}

const stripEmoji = (t: string) => t.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').trim()

let token = 0

/** Speak text; resolves when finished or cancelled. */
export function speak(text: string, speaker: 'A' | 'B' = 'A', rate?: number): Promise<void> {
  if (!ttsSupported) return Promise.resolve()
  const my = ++token
  speechSynthesis.cancel()
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(stripEmoji(text))
    const v = voiceFor(speaker)
    if (v) u.voice = v
    u.lang = 'en-US'
    u.rate = rate ?? getSettings().rate
    u.onend = u.onerror = () => resolve()
    // Some engines need a tick after cancel() before speaking again
    setTimeout(() => (my === token ? speechSynthesis.speak(u) : resolve()), 50)
  })
}

export function stopSpeaking() {
  token++
  if (ttsSupported) speechSynthesis.cancel()
}

/** Token that changes whenever speech is started or stopped elsewhere; lets loops detect interruption */
export const speechToken = () => token
