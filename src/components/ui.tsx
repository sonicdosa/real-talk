import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { ExpressionType } from '../types'
import { TYPE_LABEL } from '../data'
import { speak, ttsSupported } from '../lib/speech'

export function PageHeader({ title, back, right }: { title: ReactNode; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="pt-safe sticky top-0 z-20 bg-stone-50/95 backdrop-blur dark:bg-stone-950/95">
      <div className="flex h-14 items-center gap-2 px-4">
        {back && (
          <button
            onClick={() => (history.length > 1 ? nav(-1) : nav('/'))}
            className="-ml-2 rounded-full p-2 text-xl leading-none text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
            aria-label="뒤로"
          >
            ←
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
        {right}
      </div>
    </header>
  )
}

export function SpeakButton({
  text,
  speaker = 'A',
  className = '',
  label,
}: {
  text: string
  speaker?: 'A' | 'B'
  className?: string
  label?: string
}) {
  if (!ttsSupported) return null
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        speak(text, speaker)
      }}
      className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-full text-stone-500 hover:bg-stone-200 hover:text-indigo-600 dark:text-stone-400 dark:hover:bg-stone-800 ${
        label ? 'px-3 py-1.5 text-sm' : 'h-8 w-8'
      } ${className}`}
      aria-label="듣기"
    >
      🔊{label && <span>{label}</span>}
    </button>
  )
}

const TYPE_COLOR: Record<ExpressionType, string> = {
  reduction: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  phrasal: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  idiom: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  filler: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  slang: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  reaction: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
}

export function TypeBadge({ type }: { type: ExpressionType }) {
  return <span className={`shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold ${TYPE_COLOR[type]}`}>{TYPE_LABEL[type]}</span>
}

export function LevelDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`난이도 ${level}`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= level ? 'bg-indigo-500' : 'bg-stone-300 dark:bg-stone-700'}`} />
      ))}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 ${className}`}>
      {children}
    </div>
  )
}

export const btn = {
  primary:
    'rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40',
  secondary:
    'rounded-xl border border-stone-300 bg-white px-4 py-3 font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800',
}
