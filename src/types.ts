export type Segment = {
  id: number
  text: string
  keyword: string
  icon: string
  preview: string
  tone: string
}

export type PresentationState = {
  isOpen: boolean
  currentIndex: number
  isFullscreen: boolean
}

export type DraftState = {
  title: string
  subtitle: string
  rawText: string
  segments: Segment[]
  activeIndex: number
  presentation: PresentationState
}

export type GenerationResult = {
  title: string
  subtitle: string
  segments: Segment[]
}
