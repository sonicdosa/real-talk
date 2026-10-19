import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, logActivity, touchProgress } from '../db'
import { LEVEL_LABEL, scenarioOf } from '../data'
import { exprKey, useDialogues, useSavedKeys } from '../hooks/useData'
import { segment, findAll, matchText } from '../lib/highlight'
import { speak, speechToken, stopSpeaking, ttsSupported } from '../lib/speech'
import { updateSettings, useSettings } from '../lib/settings'
import ExpressionSheet, { toggleSaved } from '../components/ExpressionSheet'
import { Card, PageHeader, TypeBadge, btn } from '../components/ui'
import type { Dialogue, Expression, ExpressionRef } from '../types'

function toRef(d: Dialogue, e: Expression): ExpressionRef {
  return { ...e, key: exprKey(d.id, e.id), dialogueId: d.id, example: d.lines.find((ln) => findAll(ln.en, matchText(e)).length) }
}

const toggleCls = (on: boolean) =>
  `rounded-full px-3 py-1.5 text-sm font-medium ${
    on ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-white text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-800'
  }`

export default function DialogueView() {
  const { id } = useParams()
  const dialogues = useDialogues()
  const d = dialogues.find((x) => x.id === id)
  const settings = useSettings()
  const saved = useSavedKeys()
  const progress = useLiveQuery(() => (id ? db.progress.get(id) : undefined), [id])

  const [sheet, setSheet] = useState<ExpressionRef | null>(null)
  const [playing, setPlaying] = useState<number | null>(null)
  const [hideEn, setHideEn] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (id) touchProgress(id)
    return () => stopSpeaking()
  }, [id])

  const meSide = useMemo(() => (d && d.speakers.A === '나' ? 'A' : 'B'), [d])

  if (!d) {
    return (
      <div>
        <PageHeader title="대화" back />
        <p className="py-16 text-center text-stone-500">대화를 찾을 수 없어요.</p>
      </div>
    )
  }

  const sc = scenarioOf(d.scenario)

  const playAll = async () => {
    if (playing !== null) {
      stopSpeaking()
      setPlaying(null)
      return
    }
    for (let i = 0; i < d.lines.length; i++) {
      setPlaying(i)
      const p = speak(d.lines[i].en, d.lines[i].s)
      const t = speechToken()
      await p
      if (speechToken() !== t) return
      await new Promise((r) => setTimeout(r, 350))
      if (speechToken() !== t) return
    }
    setPlaying(null)
  }

  const playOne = (i: number) => {
    setPlaying(null)
    speak(d.lines[i].en, d.lines[i].s)
  }

  const toggleReveal = (i: number) =>
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const complete = async () => {
    await touchProgress(d.id, { completedAt: progress?.completedAt ?? Date.now() })
    await logActivity()
  }

  return (
    <div>
      <PageHeader title={d.titleKo} back />

      <div className="space-y-3 px-4">
        <Card className="!p-3.5">
          <p className="text-xs font-medium text-stone-500">
            {sc.emoji} {sc.name} · {LEVEL_LABEL[d.level]}
          </p>
          <p className="mt-1 font-semibold">{d.title}</p>
          {d.situation && <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{d.situation}</p>}
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          {ttsSupported && (
            <button onClick={playAll} className={`${btn.primary} !rounded-full !px-4 !py-1.5 text-sm`}>
              {playing !== null ? '■ 정지' : '▶ 전체 듣기'}
            </button>
          )}
          <button className={toggleCls(settings.showKo)} onClick={() => updateSettings({ showKo: !settings.showKo })}>
            해석
          </button>
          <button className={toggleCls(hideEn)} onClick={() => setHideEn(!hideEn)}>
            영어 가리기
          </button>
          {ttsSupported && (
            <button className={toggleCls(settings.rate < 0.9)} onClick={() => updateSettings({ rate: settings.rate < 0.9 ? 0.95 : 0.7 })}>
              🐢 느리게
            </button>
          )}
        </div>
      </div>

      <ol className="mt-4 space-y-3 px-4">
        {d.lines.map((ln, i) => {
          const mine = ln.s === meSide
          const showKo = settings.showKo || revealed.has(i)
          const hidden = hideEn && !revealed.has(i)
          return (
            <li key={i} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <span className="mb-1 px-1 text-[11px] text-stone-500">{d.speakers[ln.s]}</span>
              <div
                onClick={() => playOne(i)}
                className={`max-w-[85%] cursor-pointer rounded-2xl px-3.5 py-2.5 transition ${
                  mine
                    ? 'rounded-br-md bg-indigo-600 text-white'
                    : 'rounded-bl-md border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                } ${playing === i ? 'ring-4 ring-amber-300/70' : ''}`}
              >
                <p className={`leading-relaxed ${hidden ? 'select-none blur-sm' : ''}`}>
                  {segment(ln.en, d.expressions).map((s, j) =>
                    s.expr ? (
                      <button
                        key={j}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSheet(toRef(d, s.expr!))
                        }}
                        className={`rounded px-0.5 font-semibold underline decoration-2 underline-offset-4 ${
                          mine ? 'decoration-amber-300' : 'decoration-indigo-400'
                        } ${saved.has(exprKey(d.id, s.expr.id)) ? (mine ? 'bg-white/15' : 'bg-indigo-50 dark:bg-indigo-950') : ''}`}
                      >
                        {s.text}
                      </button>
                    ) : (
                      <span key={j}>{s.text}</span>
                    ),
                  )}
                </p>
                {showKo && ln.ko && (
                  <p className={`mt-1 text-sm ${mine ? 'text-indigo-100' : 'text-stone-500 dark:text-stone-400'}`}>{ln.ko}</p>
                )}
              </div>
              {(!settings.showKo || hideEn) && (
                <button onClick={() => toggleReveal(i)} className="mt-0.5 px-1 text-[11px] text-stone-400 hover:text-indigo-500">
                  {revealed.has(i) ? '숨기기' : hideEn ? '보기' : '해석'}
                </button>
              )}
            </li>
          )
        })}
      </ol>

      <section className="mt-8 px-4">
        <h2 className="mb-2 font-bold">핵심 표현 {d.expressions.length}개</h2>
        <ul className="space-y-2">
          {d.expressions.map((e) => {
            const ref = toRef(d, e)
            const isSaved = saved.has(ref.key)
            return (
              <li key={e.id}>
                <Card className="flex items-center gap-2 !p-3">
                  <button className="min-w-0 flex-1 text-left" onClick={() => setSheet(ref)}>
                    <div className="flex items-center gap-1.5">
                      <TypeBadge type={e.type} />
                      <span className="truncate font-semibold">{e.phrase}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-stone-500 dark:text-stone-400">{e.meaning}</p>
                  </button>
                  <button
                    onClick={() => toggleSaved(ref, isSaved)}
                    className={`h-9 w-9 shrink-0 rounded-full text-lg ${isSaved ? 'text-amber-500' : 'text-stone-300 dark:text-stone-600'}`}
                    aria-label={isSaved ? '저장 해제' : '저장'}
                  >
                    ★
                  </button>
                </Card>
              </li>
            )
          })}
        </ul>
        {d.expressions.length > 0 && (
          <button
            onClick={() => Promise.all(d.expressions.map((e) => (saved.has(exprKey(d.id, e.id)) ? null : toggleSaved(toRef(d, e), false))))}
            className="mt-2 w-full py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400"
          >
            ★ 모두 표현장에 저장
          </button>
        )}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-2 px-4">
        <button onClick={complete} className={btn.secondary} disabled={!!progress?.completedAt}>
          {progress?.completedAt ? '✓ 완료함' : '학습 완료'}
        </button>
        <Link to={`/d/${d.id}/quiz`} className={`${btn.primary} text-center`}>
          ✏️ 퀴즈 풀기
        </Link>
      </div>

      <ExpressionSheet expr={sheet} onClose={() => setSheet(null)} />
    </div>
  )
}
