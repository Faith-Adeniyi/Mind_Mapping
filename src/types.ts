export type LayoutMode = 'clock' | 'grid' | 'linear'
export type PresentationViewMode = 'standard' | 'companion'

export type SegmentTone = 'primary' | 'secondary' | 'tertiary' | 'alert' | 'neutral'

export type Segment = {
  id: string
  order: number
  text: string
  keyword: string
  icon: string
  preview: string
  tone: SegmentTone
}

export type MapDraft = {
  topic: string
  rawText: string
  desiredSegmentCount: number
  segments: Segment[]
  activeSegmentId: string | null
  layoutMode: LayoutMode
  currentMapId: string | null
}

export type SavedMindMap = {
  id: string
  topic: string
  rawText: string
  desiredSegmentCount: number
  segments: Segment[]
  layoutMode: LayoutMode
  createdAt: string
  updatedAt: string
}

export type PresentationState = {
  isOpen: boolean
  index: number
  isPlaying: boolean
  startedAt: number | null
  mode: PresentationViewMode
}

export type GeneratedSegmentDraft = {
  text: string
  keyword: string
  iconTokens?: string[]
}

export type AnalyzeMapRequestPayload = {
  text: string
  minSegments: number
  maxSegments: number
}

export type AnalyzeMapResponsePayload = {
  source: 'llm' | 'local'
  topic: string
  segments: GeneratedSegmentDraft[]
  fallbackReason?: string
}
