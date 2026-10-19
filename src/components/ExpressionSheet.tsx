import { useEffect } from 'react'
import type { ExpressionRef } from '../types'
import { db, logActivity } from '../db'
import { newCard } from '../lib/srs'
import { useSavedKeys } from '../hooks/useData'
import { segment } from '../lib/highlight'
import { SpeakButton, TypeBadge, btn } from './ui'

export async function toggleSaved(expr: ExpressionRef, saved: boolean) {
  if (saved) await db.cards.delete(expr.key)
  else {
    await db.cards.put(newCard(expr.key, expr.dialogueId))
    await logActivity()
  }
}

export function ExpressionDetail({ expr }: { expr: ExpressionRef }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <TypeBadge type={expr.type} />
          <p className="mt-1.5 text-xl font-bold">{expr.phrase}</p>
          <p className="mt-0.5 text-stone-600 dark:text-stone-300">{expr.meaning}</p>
        </div>
        <SpeakButton text={expr.match ?? expr.phrase} />
      </div>

      {expr.textbook && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-stone-100 p-3 dark:bg-stone-800">
            <p className="text-[11px] font-semibold text-stone-500">📘 교과서</p>
            <p className="mt-1 text-stone-500 line-through decoration-stone-400/60 dark:text-stone-400">{expr.textbook}</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/60">
            <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">🗣️ 원어민</p>
            <p className="mt-1 font-semibold text-indigo-900 dark:text-indigo-100">{expr.phrase}</p>
          </div>
        </div>
      )}

      {expr.nuance && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">💡 {expr.nuance}</p>}

      {expr.example && (
        <div className="flex items-start gap-2 rounded-xl border border-stone-200 p-3 text-sm dark:border-stone-700">
          <div className="min-w-0 flex-1">
            <p>
              {segment(expr.example.en, [expr]).map((s, i) =>
                s.expr ? (
                  <mark key={i} className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/30">
                    {s.text}
                  </mark>
                ) : (
                  <span key={i}>{s.text}</span>
                ),
              )}
            </p>
            {expr.example.ko && <p className="mt-1 text-stone-500 dark:text-stone-400">{expr.example.ko}</p>}
          </div>
          <SpeakButton text={expr.example.en} speaker={expr.example.s} />
        </div>
      )}
    </div>
  )
}

export default function ExpressionSheet({ expr, onClose }: { expr: ExpressionRef | null; onClose: () => void }) {
  const saved = useSavedKeys()
  useEffect(() => {
    if (!expr) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expr, onClose])

  if (!expr) return null
  const isSaved = saved.has(expr.key)
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="animate-fade absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="animate-sheet pb-safe relative w-full max-w-md rounded-t-3xl bg-white dark:bg-stone-900">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-700" />
        <div className="max-h-[75dvh] overflow-y-auto p-5">
          <ExpressionDetail expr={expr} />
          <div className="mt-4 flex gap-2">
            <button onClick={() => toggleSaved(expr, isSaved)} className={`flex-1 ${isSaved ? btn.secondary : btn.primary}`}>
              {isSaved ? '✓ 저장됨 (해제)' : '+ 표현장에 저장'}
            </button>
            <button onClick={onClose} className={btn.secondary}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
