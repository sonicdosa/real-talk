import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, logActivity, type Card as SrsCard } from '../db'
import { useExpressionIndex } from '../hooks/useData'
import { endOfToday } from '../lib/date'
import { intervalLabel, schedule, type Grade } from '../lib/srs'
import { speak } from '../lib/speech'
import { ExpressionDetail } from '../components/ExpressionSheet'
import { Card, PageHeader, TypeBadge, btn } from '../components/ui'

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: 0, label: '다시', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' },
  { g: 1, label: '어려움', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' },
  { g: 2, label: '알맞음', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  { g: 3, label: '쉬움', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' },
]

export default function Review() {
  const index = useExpressionIndex()
  const due = useLiveQuery(() => db.cards.where('due').belowOrEqual(endOfToday()).sortBy('due'), [], undefined)
  const total = useLiveQuery(() => db.cards.count(), [], 0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)

  // Skip cards whose expression no longer exists (e.g. a deleted custom dialogue)
  const cards = (due ?? []).filter((c) => index.has(c.key))
  const card = cards[0]
  const expr = card && index.get(card.key)

  useEffect(() => setFlipped(false), [card?.key])

  const grade = async (c: SrsCard, g: Grade) => {
    await db.cards.put(schedule(c, g))
    await logActivity()
    setDone((n) => n + 1)
  }

  const flip = () => {
    setFlipped(true)
    if (expr) speak(expr.match ?? expr.phrase)
  }

  if (due === undefined) return <PageHeader title="복습" />

  if (!card || !expr) {
    return (
      <div>
        <PageHeader title="복습" />
        <div className="px-6 py-16 text-center">
          <p className="text-6xl">{done > 0 ? '🎉' : total ? '☕' : '📒'}</p>
          <p className="mt-4 text-lg font-bold">
            {done > 0 ? `오늘 ${done}개 복습 완료!` : total ? '오늘 복습할 표현이 없어요' : '아직 저장한 표현이 없어요'}
          </p>
          <p className="mt-2 text-sm text-stone-500">
            {total ? '새 대화를 배우고 표현을 더 저장해 보세요.' : '대화 속 밑줄 친 표현을 눌러 ★ 저장하면 여기서 복습할 수 있어요.'}
          </p>
          <Link to="/learn" className={`${btn.primary} mt-6 inline-block`}>
            대화 보러 가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="복습" right={<span className="text-sm text-stone-500">남은 카드 {cards.length}</span>} />
      <div className="px-4">
        <Card className="min-h-80 !p-5">
          {!flipped ? (
            <button onClick={flip} className="flex min-h-72 w-full flex-col items-center justify-center text-center">
              <TypeBadge type={expr.type} />
              <p className="mt-4 text-sm text-stone-500">원어민은 어떻게 말할까?</p>
              <p className="mt-2 text-2xl font-bold">{expr.meaning}</p>
              {expr.textbook && (
                <p className="mt-4 rounded-xl bg-stone-100 px-3 py-2 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                  📘 교과서: {expr.textbook}
                </p>
              )}
              {expr.example?.ko && <p className="mt-4 text-sm text-stone-400">예문: {expr.example.ko}</p>}
              <p className="mt-8 text-sm font-semibold text-indigo-600 dark:text-indigo-400">탭해서 정답 보기</p>
            </button>
          ) : (
            <div className="animate-fade">
              <ExpressionDetail expr={expr} />
            </div>
          )}
        </Card>

        {flipped ? (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {GRADES.map(({ g, label, cls }) => (
              <button key={g} onClick={() => grade(card, g)} className={`rounded-xl py-2.5 font-semibold ${cls}`}>
                <span className="block text-sm">{label}</span>
                <span className="block text-[11px] opacity-70">{intervalLabel(card, g)}</span>
              </button>
            ))}
          </div>
        ) : (
          <button onClick={flip} className={`${btn.primary} mt-4 w-full`}>
            정답 보기
          </button>
        )}
        <p className="mt-3 text-center text-xs text-stone-400">기억이 잘 날수록 다음 복습이 더 늦게 와요.</p>
      </div>
    </div>
  )
}
