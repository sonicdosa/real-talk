import clipList from '../data/audio-clips.json'

/**
 * Pre-generated neural voice clips (public/audio/<hash>.mp3), made by scripts/gen-audio.
 * Clips are looked up by a hash of the normalized text, so any place that speaks the same
 * text (a dialogue line, an expression, a quiz answer) finds the same clip.
 */
const available = new Set<string>(clipList as string[])

/** Lookup key: ignores case, extra spaces and trailing punctuation ("Got it." == "got it") */
export const clipKey = (text: string) =>
  stripEmoji(text)
    .replace(/\s+/g, ' ')
    .replace(/[.!?,]+$/, '')
    .trim()
    .toLowerCase()

/** FNV-1a 32-bit, hex */
export function clipHash(text: string) {
  let h = 0x811c9dc5
  for (const ch of clipKey(text)) {
    h ^= ch.codePointAt(0)!
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

export function clipUrl(text: string): string | undefined {
  const h = clipHash(text)
  return available.has(h) ? `${import.meta.env.BASE_URL}audio/${h}.mp3` : undefined
}

export const stripEmoji = (t: string) => t.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').trim()

/** How texting shorthand is read aloud */
const TEXTING_SAY: [RegExp, string][] = [
  [/\bu up\b/gi, 'you up'],
  [/\btbh\b/gi, 'T B H'],
  [/\baf\b/gi, 'A F'],
  [/\bidk\b/gi, 'I D K'],
  [/\bomw\b/gi, 'O M W'],
  [/\bngl\b/gi, 'N G L'],
  [/\bikr\b/gi, 'I K R'],
  [/\blmk\b/gi, 'L M K'],
  [/\beod\b/gi, 'E O D'],
  [/\bttyl\b/gi, 'T T Y L'],
  [/\bdl\b/gi, 'D L'],
  [/\basap\b/gi, 'A S A P'],
  [/\blol\b/gi, 'L O L'],
  [/\bthx\b/gi, 'thanks'],
  [/\btmrw\b/gi, 'tomorrow'],
  [/\bthurs\b/gi, 'Thursday'],
  // Single letters: lowercase only, so they don't hit letters spelled out above (e.g. "L M K")
  [/\bur\b/g, "you're"],
  [/\bu\b/g, 'you'],
  [/\bw\b(?= )/g, 'with'],
  [/\bq\b/g, 'Q'],
  [/\bya\b/g, 'yeah'],
  [/\bk\b/g, 'kay'],
]

/** Text actually sent to the voice engine */
export function sayText(text: string, texting = false) {
  let t = stripEmoji(text)
  if (texting) for (const [re, rep] of TEXTING_SAY) t = t.replace(re, rep)
  return t
}
