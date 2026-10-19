import { useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { LEVEL_LABEL, SCENARIOS, scenarioOf } from '../data'
import { validateDialogue, type ValidationResult } from '../lib/validate'
import { Card, PageHeader, btn } from '../components/ui'
import type { Dialogue, ScenarioId } from '../types'

const SCHEMA = `[
  {
    "title": "English title",
    "titleKo": "한국어 제목",
    "scenario": "cafe | shopping | home | work | friends | travel | texting",
    "level": 1,
    "situation": "상황 설명 (한국어 한 문장)",
    "speakers": { "A": "상대 역할 (한국어)", "B": "나" },
    "lines": [
      { "s": "A", "en": "English line", "ko": "자연스러운 한국어 해석" }
    ],
    "expressions": [
      {
        "id": "kebab-case-id",
        "phrase": "expression to learn",
        "match": "exact text copied from a line",
        "meaning": "한국어 뜻",
        "nuance": "뉘앙스/사용 팁 (한국어, 선택)",
        "textbook": "what a textbook would say instead (optional)",
        "type": "reduction | phrasal | idiom | filler | slang | reaction"
      }
    ]
  }
]`

function buildPrompt(topic: string, scenario: ScenarioId, level: 1 | 2 | 3, count: number) {
  return `You are creating study material for a Korean learner of American English conversation.

Write ${count} short everyday dialogue${count > 1 ? 's' : ''} about: ${topic || '(pick a common everyday situation)'}
Category: ${scenario}. Level: ${level} (1 = beginner, 2 = intermediate, 3 = advanced).

Rules:
- Make it sound exactly like real native speakers talking casually in the US today: contractions, reductions (gonna, wanna, gotta), phrasal verbs, fillers, natural reactions. Avoid textbook-style phrasing.
- 7–10 lines, two speakers "A" and "B". Speaker B is the learner, labeled "나".
- Korean translations must be natural Korean, not word-for-word.
- Pick 5–10 key expressions natives really use. "match" must be copied EXACTLY (same spelling) from one of the English lines.
- "textbook" shows the stiff textbook way of saying the same thing, when there is one.
- Output ONLY a JSON array in a single code block, no explanation.

JSON format:
${SCHEMA}`
}

function parseInput(text: string): unknown[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = (fenced ? fenced[1] : text).trim()
  const parsed = JSON.parse(body)
  return Array.isArray(parsed) ? parsed : [parsed]
}

export default function Import() {
  const custom = useLiveQuery(() => db.customDialogues.toArray(), [], [])
  const [topic, setTopic] = useState('')
  const [scenario, setScenario] = useState<ScenarioId>('friends')
  const [level, setLevel] = useState<1 | 2 | 3>(2)
  const [count, setCount] = useState(1)
  const [copied, setCopied] = useState(false)
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ValidationResult[] | null>(null)
  const [parseError, setParseError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  const prompt = buildPrompt(topic, scenario, level, count)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const check = () => {
    setSavedMsg('')
    try {
      setResults(parseInput(input).map((r, i) => validateDialogue(r, i)))
      setParseError('')
    } catch (e) {
      setResults(null)
      setParseError(`JSON을 읽을 수 없어요: ${(e as Error).message}`)
    }
  }

  const valid = (results ?? []).flatMap((r) => (r.dialogue ? [r.dialogue] : []))

  const save = async () => {
    await db.customDialogues.bulkPut(valid)
    setSavedMsg(`✓ 대화 ${valid.length}개를 추가했어요.`)
    setResults(null)
    setInput('')
  }

  const remove = async (d: Dialogue) => {
    if (!confirm(`"${d.titleKo}" 대화를 삭제할까요? 이 대화에서 저장한 표현도 함께 지워져요.`)) return
    await db.transaction('rw', [db.customDialogues, db.cards, db.progress], async () => {
      await db.customDialogues.delete(d.id)
      await db.cards.where('dialogueId').equals(d.id).delete()
      await db.progress.delete(d.id)
    })
  }

  const field = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-900'

  return (
    <div>
      <PageHeader title="대화 가져오기" back />
      <div className="space-y-4 px-4">
        <Card className="space-y-3">
          <h2 className="font-bold">1. 프롬프트 만들기</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            원하는 상황을 적고 프롬프트를 복사해서 <b>ChatGPT</b>나 <b>Gemini</b>에 붙여 넣으세요.
          </p>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="예: 미용실에서 머리 자르기" className={field} />
          <div className="grid grid-cols-3 gap-2">
            <select value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioId)} className={field}>
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
            <select value={level} onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3)} className={field}>
              {([1, 2, 3] as const).map((lv) => (
                <option key={lv} value={lv}>
                  {LEVEL_LABEL[lv]}
                </option>
              ))}
            </select>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className={field}>
              {[1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n}개
                </option>
              ))}
            </select>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-stone-500">프롬프트 미리보기</summary>
            <pre className="mt-2 max-h-60 overflow-auto rounded-xl bg-stone-100 p-3 text-xs whitespace-pre-wrap dark:bg-stone-800">{prompt}</pre>
          </details>
          <button onClick={copy} className={`${btn.primary} w-full`}>
            {copied ? '✓ 복사됨' : '📋 프롬프트 복사'}
          </button>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-bold">2. 결과 붙여 넣기</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AI가 만든 JSON을 그대로 붙여 넣으세요"
            rows={7}
            className={`${field} font-mono text-xs`}
          />
          <button onClick={check} disabled={!input.trim()} className={`${btn.secondary} w-full`}>
            확인하기
          </button>
          {parseError && <p className="text-sm text-rose-600">{parseError}</p>}
          {results && (
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className="rounded-xl bg-stone-100 p-3 text-sm dark:bg-stone-800">
                  {r.dialogue ? (
                    <p className="font-semibold">
                      ✓ {scenarioOf(r.dialogue.scenario).emoji} {r.dialogue.titleKo}{' '}
                      <span className="font-normal text-stone-500">
                        · {r.dialogue.lines.length}줄 · 표현 {r.dialogue.expressions.length}개
                      </span>
                    </p>
                  ) : (
                    <p className="font-semibold text-rose-600">✗ 대화 {i + 1} 추가 불가</p>
                  )}
                  {[...r.errors, ...r.warnings].map((m, j) => (
                    <p key={j} className={`mt-1 text-xs ${r.errors.includes(m) ? 'text-rose-600' : 'text-amber-700 dark:text-amber-400'}`}>
                      {m}
                    </p>
                  ))}
                </div>
              ))}
              <button onClick={save} disabled={!valid.length} className={`${btn.primary} w-full`}>
                대화 {valid.length}개 추가하기
              </button>
            </div>
          )}
          {savedMsg && (
            <p className="text-sm text-emerald-600">
              {savedMsg}{' '}
              <Link to="/learn" className="underline">
                대화 목록 보기
              </Link>
            </p>
          )}
        </Card>

        {custom.length > 0 && (
          <Card className="space-y-2">
            <h2 className="font-bold">내가 추가한 대화 {custom.length}개</h2>
            <ul className="divide-y divide-stone-200 dark:divide-stone-800">
              {custom.map((d) => (
                <li key={d.id} className="flex items-center gap-2 py-2">
                  <Link to={`/d/${d.id}`} className="min-w-0 flex-1 truncate text-sm">
                    {scenarioOf(d.scenario).emoji} {d.titleKo}
                  </Link>
                  <button onClick={() => remove(d)} className="px-2 text-sm text-rose-600">
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
