import type { Dialogue, ExpressionType, ScenarioId } from '../types'
import { cafe } from './cafe'
import { shopping } from './shopping'
import { home } from './home'
import { work } from './work'
import { friends } from './friends'
import { travel } from './travel'
import { texting } from './texting'

export const SCENARIOS: { id: ScenarioId; name: string; emoji: string }[] = [
  { id: 'cafe', name: '카페·식당', emoji: '☕' },
  { id: 'shopping', name: '쇼핑', emoji: '🛍️' },
  { id: 'home', name: '집·이웃', emoji: '🏠' },
  { id: 'work', name: '직장', emoji: '💼' },
  { id: 'friends', name: '친구', emoji: '👋' },
  { id: 'travel', name: '여행', emoji: '✈️' },
  { id: 'texting', name: '문자·채팅', emoji: '💬' },
]

export const scenarioOf = (id: ScenarioId) => SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]

export const TYPE_LABEL: Record<ExpressionType, string> = {
  reduction: '축약',
  phrasal: '구동사',
  idiom: '관용 표현',
  filler: '말버릇',
  slang: '슬랭',
  reaction: '리액션',
}

export const LEVEL_LABEL: Record<1 | 2 | 3, string> = { 1: '초급', 2: '중급', 3: '고급' }

export const BUILTIN_DIALOGUES: Dialogue[] = [...cafe, ...shopping, ...home, ...work, ...friends, ...travel, ...texting]
