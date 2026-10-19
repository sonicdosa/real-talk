import type { Expression, ExpressionType, Line } from '../types'

export const l = (s: 'A' | 'B', en: string, ko: string): Line => ({ s, en, ko })

export const x = (
  id: string,
  phrase: string,
  meaning: string,
  type: ExpressionType,
  extra: { match?: string; nuance?: string; textbook?: string } = {},
): Expression => ({ id, phrase, meaning, type, ...extra })
