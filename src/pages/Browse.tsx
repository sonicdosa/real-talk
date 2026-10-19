import { Link, useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { SCENARIOS, scenarioOf, LEVEL_LABEL } from '../data'
import { useDialogues } from '../hooks/useData'
import { Card, LevelDots, PageHeader } from '../components/ui'
import type { ScenarioId } from '../types'

const chip = (active: boolean) =>
  `shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
    active
      ? 'bg-indigo-600 text-white'
      : 'bg-white text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-800'
  }`

export default function Browse() {
  const [params, setParams] = useSearchParams()
  const scenario = params.get('s') as ScenarioId | null
  const level = Number(params.get('lv')) || 0
  const dialogues = useDialogues()
  const progress = useLiveQuery(() => db.progress.toArray(), [], [])
  const byId = new Map(progress.map((p) => [p.dialogueId, p]))

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const list = dialogues.filter((d) => (!scenario || d.scenario === scenario) && (!level || d.level === level))

  return (
    <div>
      <PageHeader
        title="대화"
        right={
          <Link to="/import" className="rounded-full px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950">
            + 추가
          </Link>
        }
      />
      <div className="space-y-2 px-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button className={chip(!scenario)} onClick={() => set('s', null)}>
            전체
          </button>
          {SCENARIOS.map((s) => (
            <button key={s.id} className={chip(scenario === s.id)} onClick={() => set('s', s.id)}>
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((lv) => (
            <button key={lv} className={chip(level === lv)} onClick={() => set('lv', lv ? String(lv) : null)}>
              {lv ? LEVEL_LABEL[lv as 1 | 2 | 3] : '모든 난이도'}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-2 px-4">
        {list.map((d) => {
          const p = byId.get(d.id)
          return (
            <li key={d.id}>
              <Link to={`/d/${d.id}`}>
                <Card className="flex items-center gap-3 !p-3.5 hover:border-indigo-300 dark:hover:border-indigo-700">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl dark:bg-stone-800">
                    {scenarioOf(d.scenario).emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {d.titleKo}
                      {d.custom && <span className="ml-1.5 rounded bg-stone-200 px-1 text-[10px] text-stone-600 dark:bg-stone-700 dark:text-stone-300">내 대화</span>}
                    </p>
                    <p className="truncate text-sm text-stone-500 dark:text-stone-400">{d.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                      <LevelDots level={d.level} />
                      <span>표현 {d.expressions.length}개</span>
                      {p?.quizBest !== undefined && <span>· 퀴즈 {p.quizBest}%</span>}
                    </div>
                  </div>
                  {p?.completedAt ? <span className="text-xl text-emerald-500">✓</span> : <span className="text-stone-300">›</span>}
                </Card>
              </Link>
            </li>
          )
        })}
        {!list.length && <p className="py-12 text-center text-stone-500">해당하는 대화가 없어요.</p>}
      </ul>
    </div>
  )
}
