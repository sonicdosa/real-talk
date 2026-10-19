import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { db } from '../db'
import { speak, ttsSupported, useVoices } from '../lib/speech'
import { getSettings, updateSettings, useSettings } from '../lib/settings'
import { Card, PageHeader, btn } from '../components/ui'

async function exportBackup() {
  const data = {
    app: 'real-talk',
    version: 1,
    exportedAt: new Date().toISOString(),
    cards: await db.cards.toArray(),
    progress: await db.progress.toArray(),
    activity: await db.activity.toArray(),
    customDialogues: await db.customDialogues.toArray(),
    settings: getSettings(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `real-talk-backup-${data.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function importBackup(file: File) {
  const data = JSON.parse(await file.text())
  if (data?.app !== 'real-talk') throw new Error('Real Talk 백업 파일이 아니에요.')
  await db.transaction('rw', [db.cards, db.progress, db.activity, db.customDialogues], async () => {
    await db.cards.bulkPut(data.cards ?? [])
    await db.progress.bulkPut(data.progress ?? [])
    await db.activity.bulkPut(data.activity ?? [])
    await db.customDialogues.bulkPut(data.customDialogues ?? [])
  })
  if (data.settings) updateSettings(data.settings)
}

export default function Settings() {
  const s = useSettings()
  const voices = useVoices()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const voiceSelect = (which: 'voiceA' | 'voiceB', label: string, speaker: 'A' | 'B') => (
    <label className="block">
      <span className="text-sm text-stone-600 dark:text-stone-300">{label}</span>
      <div className="mt-1 flex gap-2">
        <select
          value={s[which]}
          onChange={(e) => updateSettings({ [which]: e.target.value })}
          className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
        >
          <option value="">자동 선택</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name}
            </option>
          ))}
        </select>
        <button onClick={() => speak("Hey, what's up? I'm gonna grab a coffee.", speaker)} className={`${btn.secondary} !px-3 !py-2`}>
          🔊
        </button>
      </div>
    </label>
  )

  return (
    <div>
      <PageHeader title="설정" />
      <div className="space-y-4 px-4">
        <Card className="space-y-4">
          <h2 className="font-bold">🔊 음성 (미국식)</h2>
          {ttsSupported ? (
            <>
              <label className="block">
                <span className="flex justify-between text-sm text-stone-600 dark:text-stone-300">
                  말하기 속도 <b>{s.rate.toFixed(2)}x</b>
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={1.3}
                  step={0.05}
                  value={s.rate}
                  onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
                  className="mt-2 w-full accent-indigo-600"
                />
              </label>
              {voicesNote(voices.length)}
              {voiceSelect('voiceA', '상대방 목소리 (A)', 'A')}
              {voiceSelect('voiceB', '두 번째 목소리 (B)', 'B')}
            </>
          ) : (
            <p className="text-sm text-stone-500">이 브라우저는 음성 읽기를 지원하지 않아요. Chrome이나 Safari를 사용해 주세요.</p>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-bold">📖 보기</h2>
          <label className="flex items-center justify-between">
            <span className="text-sm">한국어 해석 항상 보이기</span>
            <input type="checkbox" checked={s.showKo} onChange={(e) => updateSettings({ showKo: e.target.checked })} className="h-5 w-5 accent-indigo-600" />
          </label>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-bold">➕ 대화 추가</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">ChatGPT나 Gemini로 원하는 상황의 대화를 만들어 붙여 넣을 수 있어요.</p>
          <Link to="/import" className={`${btn.primary} block text-center`}>
            대화 가져오기
          </Link>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-bold">💾 데이터</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            학습 기록은 이 기기의 브라우저에만 저장돼요. 브라우저 데이터를 지우면 사라지니 가끔 백업해 두세요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={exportBackup} className={btn.secondary}>
              백업 내보내기
            </button>
            <button onClick={() => fileRef.current?.click()} className={btn.secondary}>
              백업 불러오기
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                await importBackup(f)
                setMsg('✓ 백업을 불러왔어요.')
              } catch (err) {
                setMsg(`불러오기 실패: ${(err as Error).message}`)
              }
            }}
          />
          <button
            onClick={async () => {
              if (!confirm('학습 기록(저장한 표현, 진도, 연속 학습일)을 모두 지울까요? 직접 추가한 대화는 남아요.')) return
              await Promise.all([db.cards.clear(), db.progress.clear(), db.activity.clear()])
              setMsg('학습 기록을 초기화했어요.')
            }}
            className="w-full py-2 text-sm text-rose-600"
          >
            학습 기록 초기화
          </button>
          {msg && <p className="text-sm text-indigo-600 dark:text-indigo-400">{msg}</p>}
        </Card>

        <Card className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
          <h2 className="font-bold text-stone-900 dark:text-stone-100">📱 폰에 설치하기</h2>
          <p>
            <b>Android (Chrome)</b>: 메뉴 ⋮ → <b>홈 화면에 추가</b> 또는 <b>앱 설치</b>
          </p>
          <p>
            <b>iPhone (Safari)</b>: 공유 버튼 → <b>홈 화면에 추가</b>
          </p>
          <p className="text-xs text-stone-400">설치하면 오프라인에서도 쓸 수 있어요.</p>
        </Card>
      </div>
    </div>
  )
}

function voicesNote(count: number) {
  if (count) return null
  return <p className="text-xs text-amber-600">미국식 음성을 불러오는 중이거나 설치된 음성이 없어요.</p>
}
