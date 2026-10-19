export type ScenarioId = 'cafe' | 'shopping' | 'home' | 'work' | 'friends' | 'travel' | 'texting'

export type ExpressionType = 'reduction' | 'phrasal' | 'idiom' | 'filler' | 'slang' | 'reaction'

export interface Expression {
  /** Unique within the dialogue; made globally unique as `${dialogueId}.${id}` when loaded */
  id: string
  /** The expression as it should be learned, e.g. "run to (somewhere)" */
  phrase: string
  /** Exact text to find in the dialogue lines for highlighting (defaults to phrase) */
  match?: string
  meaning: string
  nuance?: string
  /** What a textbook would say instead */
  textbook?: string
  type: ExpressionType
}

export interface Line {
  s: 'A' | 'B'
  en: string
  ko: string
}

export interface Dialogue {
  id: string
  title: string
  titleKo: string
  scenario: ScenarioId
  level: 1 | 2 | 3
  /** Situation description in Korean */
  situation: string
  speakers: { A: string; B: string }
  lines: Line[]
  expressions: Expression[]
  /** True for dialogues imported by the user */
  custom?: boolean
}

/** Expression with global id and a pointer back to its dialogue */
export interface ExpressionRef extends Expression {
  key: string
  dialogueId: string
  example?: Line
}
