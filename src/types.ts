export type LayoutMode = 'clock' | 'grid' | 'linear'

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
  segments: Segment[]
  activeSegmentId: string | null
  layoutMode: LayoutMode
}

export type PresentationState = {
  isOpen: boolean
  index: number
  isPlaying: boolean
  startedAt: number | null
}
