import type { ProceduralVisual } from '@/lib/procedural/types'

export type SubjectId = 'physics' | 'chemistry' | 'math' | 'biology' | 'space'

export interface KeyFact {
  label: string
  value: string
}

export interface Hotspot {
  id: string
  label: string
  /** Authored position in the model's normalized pivot space (FIT_SIZE = 3.8, centered). */
  position: [number, number, number]
  color: string
  description: string
  function: string
}

export interface QuizQuestion {
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  misconception: string
}

export interface LessonStep {
  title: string
  body: string
}

export interface ComponentContent {
  id: string
  name: string
  scientificName: string
  subject: SubjectId
  branch: string
  system: string
  /** Path under /public to the GLB asset, e.g. "/models/heart.glb" */
  model: string
  tagline: string
  summary: string
  keyFacts: KeyFact[]
  whyItMatters: string
  didYouKnow: string
  belongsTo: string[]
  conditions: string[]
  /** Authored procedural composition intent — what to draw when no GLB is wired. */
  visual?: ProceduralVisual
  hotspots: Hotspot[]
  lesson: {
    steps: LessonStep[]
    predictionPrompt: string
    practiceItem: string
    checkpoint: string
  }
  quiz: QuizQuestion[]
  /** id of the component this pairs best with for compare mode. Empty string = no meaningful pair yet. */
  compareCandidate: string
  /** Why compareCandidate is the right pairing — shown in the Compare panel so the pairing reads as intentional. */
  compareReason: string
}
