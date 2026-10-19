import { NavLink } from 'react-router'
import { useDueCount } from '../hooks/useData'

const TABS = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/learn', label: '대화', icon: '💬' },
  { to: '/review', label: '복습', icon: '🔁' },
  { to: '/phrases', label: '표현장', icon: '📒' },
  { to: '/settings', label: '설정', icon: '⚙️' },
]

export default function BottomNav() {
  const due = useDueCount()
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-stone-500 dark:text-stone-400'
                }`
              }
            >
              <span className="text-xl leading-none">{t.icon}</span>
              {t.label}
              {t.to === '/review' && due > 0 && (
                <span className="absolute top-1 left-1/2 ml-2 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] leading-4 text-white">
                  {due > 99 ? '99+' : due}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
