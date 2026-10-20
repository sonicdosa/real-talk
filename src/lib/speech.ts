import { useEffect, useState } from 'react'
import { getSettings } from './settings'
import { clipUrl, stripEmoji } from './clips'

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

/** One shared element: once a tap has unlocked it, iOS lets later clips play without another tap */
const audio = typeof Audio !== 'undefined' ? new Audio() : null

/** True if `text` can be spoken, by a recorded clip or the device voice */
export const canSpeak = (text: string) => ttsSupported || (!!audio && !!clipUrl(text))

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

let token = 0
/** Resolves the clip currently playing, so stopping or starting other speech ends it */
let endClip: (() => void) | null = null

function deviceSpeak(my: number, text: string, speaker: 'A' | 'B', rate: number): Promise<void> {
  if (!ttsSupported) return Promise.resolve()
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(stripEmoji(text))
    const v = voiceFor(speaker)
    if (v) u.voice = v
    u.lang = 'en-US'
    u.rate = rate
    u.onend = u.onerror = () => resolve()
    // Some engines need a tick after cancel() before speaking again
    setTimeout(() => (my === token ? speechSynthesis.speak(u) : resolve()), 50)
  })
}

function playClip(my: number, url: string, text: string, speaker: 'A' | 'B', rate: number): Promise<void> {
  const el = audio!
  return new Promise((resolve) => {
    // A stale play() rejection can arrive after the next clip started; it must not touch that clip
    let active = true
    const done = () => {
      if (!active) return
      active = false
      if (endClip === done) {
        endClip = null
        el.onended = el.onerror = null
      }
      resolve()
    }
    // A missing or unplayable clip falls back to the device voice
    const fallback = () => {
      if (!active) return
      done()
      if (my === token) void deviceSpeak(my, text, speaker, rate)
    }
    endClip = done
    el.onended = done
    el.onerror = fallback
    el.src = url
    el.playbackRate = rate
    el.play().catch((e: DOMException) => (e.name === 'AbortError' ? done() : fallback()))
  })
}

function stopAll() {
  if (ttsSupported) speechSynthesis.cancel()
  if (audio && !audio.paused) audio.pause()
  endClip?.()
}

/** Speak text with its recorded clip when there is one, else the device voice. Resolves when finished or stopped. */
export function speak(text: string, speaker: 'A' | 'B' = 'A', rate?: number): Promise<void> {
  const my = ++token
  stopAll()
  const r = rate ?? getSettings().rate
  const url = audio ? clipUrl(text) : undefined
  return url ? playClip(my, url, text, speaker, r) : deviceSpeak(my, text, speaker, r)
}

export function stopSpeaking() {
  token++
  stopAll()
}

/** Token that changes whenever speech is started or stopped elsewhere; lets loops detect interruption */
export const speechToken = () => token
