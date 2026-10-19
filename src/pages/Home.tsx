import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { SCENARIOS, scenarioOf, LEVEL_LABEL } from '../data'
import { useDialogues, useDueCount } from '../hooks/useData'
import { dayNumber, streakFrom } from '../lib/date'
import { Card, LevelDots, btn } from '../components/ui'

export default function Home() {
  const dialogues = useDialogues()
  const due = useDueCount()
  const savedCount = useLiveQuery(() => db.cards.count(), [], 0)
  const progress = useLiveQuery(() => db.progress.toArray(), [], [])
  const activity = useLiveQuery(() => db.activity.toArray(), [], [])

  const completed = new Set(progress.filter((p) => p.completedAt).map((p) => p.dialogueId))
  const streak = streakFrom(new Set(activity.map((a) => a.date)))
  const remaining = dialogues.filter((d) => !completed.has(d.id))
  const pool = remaining.length ? remaining : dialogues
  const today = pool[dayNumber() % pool.length]
  const sc = today && scenarioOf(today.scenario)

  return (
    <div className="pt-safe space-y-4 px-4 pt-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400">원어민처럼 말하기</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Real Talk</h1>
        </div>
        <div className="rounded-full bg-orange-100 px-3 py-1.5 text-sm font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          🔥 {streak}일 연속
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="완료한 대화" value={`${completed.size}/${dialogues.length}`} />
        <Stat label="저장한 표현" value={savedCount} />
        <Stat label="오늘 복습" value={due} highlight={due > 0} />
      </div>

      {due > 0 && (
        <Link to="/review" className={`${btn.primary} flex items-center justify-between`}>
          <span>🔁 복습할 표현 {due}개</span>
          <span>시작 →</span>
        </Link>
      )}

      {today && (
        <Link to={`/d/${today.id}`} className="block">
          <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 !border-0 text-white">
            <p className="text-xs font-semibold tracking-wide text-indigo-100">오늘의 대화</p>
            <p className="mt-2 text-xl font-bold">
              {sc.emoji} {today.titleKo}
            </p>
            <p className="text-sm text-indigo-100">{today.title}</p>
            <p className="mt-3 text-sm text-indigo-50">{today.situation}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="rounded-full bg-white/20 px-2.5 py-1">
                {LEVEL_LABEL[today.level]} · 표현 {today.expressions.length}개
              </span>
              <span className="font-semibold">시작하기 →</span>
            </div>
          </Card>
        </Link>
      )}

      <section>
        <h2 className="mb-2 font-bold">상황별로 배우기</h2>
        <div className="grid grid-cols-2 gap-2">
          {SCENARIOS.map((s) => {
            const list = dialogues.filter((d) => d.scenario === s.id)
            const done = list.filter((d) => completed.has(d.id)).length
            return (
              <Link key={s.id} to={`/learn?s=${s.id}`}>
                <Card className="!p-3 hover:border-indigo-300 dark:hover:border-indigo-700">
                  <div className="text-2xl">{s.emoji}</div>
                  <p className="mt-1 font-semibold">{s.name}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                    <div className="h-full bg-indigo-500" style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {done}/{list.length}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <p className="flex items-center justify-center gap-2 pt-2 text-xs text-stone-400">
        <LevelDots level={1} /> 초급 <LevelDots level={2} /> 중급 <LevelDots level={3} /> 고급
      </p>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <Card className="!p-3">
      <p className={`text-xl font-extrabold ${highlight ? 'text-rose-500' : ''}`}>{value}</p>
      <p className="text-[11px] text-stone-500 dark:text-stone-400">{label}</p>
    </Card>
  )
}
