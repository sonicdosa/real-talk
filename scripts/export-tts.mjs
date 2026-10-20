// Collects every text the app speaks for built-in dialogues and assigns a neural voice to each.
// Writes TEMP/tts/jobs.json for scripts/gen_audio.py. Run from the project root.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const FEMALE = ['제스', '레이첼', '프리야', '에밀리', '사라', '미아']
const MALE = ['샘', '톰', '마이크', '크리스', '타일러', '벤', '댄', '데이비스', '알렉스', '조던', '애쉬']
const VOICES = {
  female: ['en-US-AvaNeural', 'en-US-EmmaNeural'],
  male: ['en-US-AndrewNeural', 'en-US-BrianNeural'],
}

const genderOf = (name) =>
  FEMALE.some((n) => name.includes(n)) ? 'female' : MALE.some((n) => name.includes(n)) ? 'male' : null

const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } })
const { BUILTIN_DIALOGUES } = await server.ssrLoadModule('/src/data/index.ts')
const { clipHash, sayText } = await server.ssrLoadModule('/src/lib/clips.ts')
const { findAll, matchText } = await server.ssrLoadModule('/src/lib/highlight.ts')
await server.close()

const jobs = new Map()
const add = (text, voice, texting) => {
  const hash = clipHash(text)
  if (!jobs.has(hash)) jobs.set(hash, { hash, text: sayText(text, texting), voice })
}

BUILTIN_DIALOGUES.forEach((d, i) => {
  const me = d.speakers.A === '나' ? 'A' : 'B'
  const other = me === 'A' ? 'B' : 'A'
  const otherGender = genderOf(d.speakers[other]) ?? (i % 2 ? 'male' : 'female')
  const meGender = otherGender === 'male' ? 'female' : 'male'
  const pick = (g) => VOICES[g][Math.floor(i / 2) % VOICES[g].length]
  const voice = { [other]: pick(otherGender), [me]: pick(meGender) }
  const texting = d.scenario === 'texting'

  d.lines.forEach((ln) => add(ln.en, voice[ln.s], texting))
  for (const e of d.expressions) {
    const m = matchText(e)
    const line = d.lines.find((ln) => findAll(ln.en, m).length)
    const v = voice[line?.s ?? other]
    add(m, v, texting)
    // Quiz and review also speak the phrase itself when it's sayable
    if (!/[~()]/.test(e.phrase)) add(e.phrase, v, texting)
  }
})

mkdirSync('TEMP/tts', { recursive: true })
writeFileSync('TEMP/tts/jobs.json', JSON.stringify([...jobs.values()], null, 1))
console.log(`${jobs.size} clips from ${BUILTIN_DIALOGUES.length} dialogues`)
