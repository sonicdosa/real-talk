import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { TYPE_LABEL } from '../data'
import { useExpressionIndex } from '../hooks/useData'
import ExpressionSheet from '../components/ExpressionSheet'
import { Card, PageHeader, SpeakButton, TypeBadge } from '../components/ui'
import type { ExpressionRef, ExpressionType } from '../types'

export default function Phrasebook() {
  const index = useExpressionIndex()
  const cards = useLiveQuery(() => db.cards.orderBy('due').toArray(), [], [])
  const [tab, setTab] = useState<'saved' | 'all'>('saved')
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ExpressionType | null>(null)
  const [sheet, setSheet] = useState<ExpressionRef | null>(null)

  const savedRefs = [...cards]
    .sort((a, b) => b.addedAt - a.addedAt)
    .flatMap((c) => {
      const e = index.get(c.key)
      return e ? [e] : []
    })
  const base = tab === 'saved' ? savedRefs : [...index.values()]
  const q = query.trim().toLowerCase()
  const list = base.filter(
    (e) =>
      (!type || e.type === type) &&
      (!q || e.phrase.toLowerCase().includes(q) || e.meaning.includes(q) || e.textbook?.toLowerCase().includes(q)),
  )

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1 text-sm ${active ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-white ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800'}`

  return (
    <div>
      <PageHeader title="표현장" />
      <div className="space-y-2 px-4">
        <div className="grid grid-cols-2 rounded-xl bg-stone-200 p-1 text-sm font-semibold dark:bg-stone-800">
          {(['saved', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg py-1.5 ${tab === t ? 'bg-white shadow-sm dark:bg-stone-950' : 'text-stone-500'}`}
            >
              {t === 'saved' ? `저장한 표현 ${savedRefs.length}` : `전체 표현 ${index.size}`}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="영어 또는 한국어로 검색"
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 dark:border-stone-700 dark:bg-stone-900"
        />
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          <button className={chip(!type)} onClick={() => setType(null)}>
            전체
          </button>
          {(Object.keys(TYPE_LABEL) as ExpressionType[]).map((t) => (
            <button key={t} className={chip(type === t)} onClick={() => setType(t)}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-3 space-y-2 px-4">
        {list.map((e) => (
          <li key={e.key}>
            <Card className="flex items-center gap-2 !p-3">
              <button className="min-w-0 flex-1 text-left" onClick={() => setSheet(e)}>
                <div className="flex items-center gap-1.5">
                  <TypeBadge type={e.type} />
                  <span className="truncate font-semibold">{e.phrase}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-stone-500 dark:text-stone-400">{e.meaning}</p>
              </button>
              <SpeakButton text={e.match ?? e.phrase} />
            </Card>
          </li>
        ))}
        {!list.length && (
          <p className="py-12 text-center text-sm text-stone-500">
            {tab === 'saved' && !savedRefs.length ? '대화에서 표현을 ★ 저장하면 여기에 모여요.' : '검색 결과가 없어요.'}
          </p>
        )}
      </ul>

      <ExpressionSheet expr={sheet} onClose={() => setSheet(null)} />
    </div>
  )
}
