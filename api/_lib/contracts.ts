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
  segments: GeneratedSegmentDraft[]
  fallbackReason?: string
}
