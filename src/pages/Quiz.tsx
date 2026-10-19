import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { db, logActivity, touchProgress } from '../db'
import { useDialogues } from '../hooks/useData'
import { buildQuiz } from '../lib/quiz'
import { speak } from '../lib/speech'
import { PageHeader, SpeakButton, btn } from '../components/ui'

export default function Quiz() {
  const { id } = useParams()
  const dialogues = useDialogues()
  const d = dialogues.find((x) => x.id === id)
  const [round, setRound] = useState(0)
  // Rebuild only when the dialogue or round changes, not on every live-query refresh
  const questions = useMemo(() => (d ? buildQuiz(d, dialogues) : []), [d?.id, round, dialogues.length])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  if (!d) return <PageHeader title="퀴즈" back />
  if (!questions.length) {
    return (
      <div>
        <PageHeader title="퀴즈" back />
        <p className="py-16 text-center text-stone-500">이 대화에는 퀴즈로 만들 표현이 없어요.</p>
      </div>
    )
  }

  const q = questions[idx]
  const correct = picked !== null && picked === q.answer

  const choose = (opt: string) => {
    if (picked !== null) return
    setPicked(opt)
    if (opt === q.answer) setScore((s) => s + 1)
    if (q.kind === 'fill') speak(q.line.en, q.line.s)
    else speak(q.answer)
  }

  const next = async () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1)
      setPicked(null)
      return
    }
    const pct = Math.round((score / questions.length) * 100)
    const prev = await db.progress.get(d.id)
    await touchProgress(d.id, { quizBest: Math.max(pct, prev?.quizBest ?? 0) })
    await logActivity()
    setFinished(true)
  }

  const restart = () => {
    setRound(round + 1)
    setIdx(0)
    setPicked(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div>
        <PageHeader title="퀴즈 결과" back />
        <div className="px-4 py-10 text-center">
          <p className="text-6xl">{pct === 100 ? '🏆' : pct >= 70 ? '🎉' : '💪'}</p>
          <p className="mt-4 text-4xl font-extrabold">{pct}%</p>
          <p className="mt-1 text-stone-500">
            {questions.length}문제 중 {score}개 정답
          </p>
          <div className="mt-8 grid gap-2">
            <button onClick={restart} className={btn.primary}>
              다시 풀기
            </button>
            <Link to={`/d/${d.id}`} className={btn.secondary}>
              대화로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={d.titleKo} back right={<span className="text-sm text-stone-500">{idx + 1}/{questions.length}</span>} />
      <div className="px-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
        </div>

        <div className="mt-6 min-h-40">
          {q.kind === 'fill' ? (
            <>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">빈칸에 들어갈 표현은?</p>
              <p className="mt-3 text-xl leading-relaxed font-medium">
                {q.before}
                <span
                  className={`mx-0.5 inline-block min-w-16 rounded-md border-b-2 px-1 text-center ${
                    picked === null
                      ? 'border-indigo-400 text-transparent'
                      : correct
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {picked === null ? '____' : q.answer}
                </span>
                {q.after}
              </p>
              <p className="mt-2 text-stone-500 dark:text-stone-400">{q.line.ko}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">원어민이라면 어떻게 말할까?</p>
              <div className="mt-3 rounded-xl bg-stone-100 p-3 dark:bg-stone-800">
                <p className="text-[11px] font-semibold text-stone-500">📘 교과서</p>
                <p className="mt-1 text-lg">{q.textbook}</p>
              </div>
              <p className="mt-2 text-stone-500 dark:text-stone-400">뜻: {q.expr.meaning}</p>
            </>
          )}
        </div>

        <div className="mt-4 grid gap-2">
          {q.options.map((opt) => {
            const state = picked === null ? 'idle' : opt === q.answer ? 'right' : opt === picked ? 'wrong' : 'dim'
            return (
              <button
                key={opt}
                onClick={() => choose(opt)}
                className={`rounded-xl border px-4 py-3 text-left font-medium transition ${
                  state === 'idle'
                    ? 'border-stone-300 bg-white hover:border-indigo-400 dark:border-stone-700 dark:bg-stone-900'
                    : state === 'right'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      : state === 'wrong'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        : 'border-stone-200 bg-white text-stone-400 dark:border-stone-800 dark:bg-stone-900'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {picked !== null && (
          <div className="animate-fade mt-4 space-y-3">
            <div className={`flex items-start gap-2 rounded-xl p-3 ${correct ? 'bg-emerald-50 dark:bg-emerald-950/60' : 'bg-rose-50 dark:bg-rose-950/60'}`}>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{correct ? '정답! 👏' : '아쉬워요'}</p>
                <p className="mt-1 text-sm">
                  <b>{q.expr.phrase}</b> — {q.expr.meaning}
                </p>
                {q.expr.nuance && <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">💡 {q.expr.nuance}</p>}
              </div>
              <SpeakButton text={q.kind === 'fill' ? q.line.en : q.answer} speaker={q.kind === 'fill' ? q.line.s : 'A'} />
            </div>
            <button onClick={next} className={`${btn.primary} w-full`}>
              {idx + 1 < questions.length ? '다음 →' : '결과 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
