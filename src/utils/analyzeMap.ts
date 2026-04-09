import type {
  AnalyzeMapRequestPayload,
  AnalyzeMapResponsePayload,
  GeneratedSegmentDraft,
} from '../types'
import { validateAnalyzeMapInput } from './inputValidation'
import { inferMainTopic, localAnalyzeMapText, normalizeGeneratedDrafts, type SegmentAnalysisOptions } from './mapAnalysisCore'

type AnalyzeMapOptions = SegmentAnalysisOptions & {
  onStatusChange?: (message: string) => void
}

export type AnalyzeMapResult = {
  source: 'llm' | 'local'
  topic: string
  segments: GeneratedSegmentDraft[]
  note?: string
}

async function requestRemoteAnalysis(payload: AnalyzeMapRequestPayload): Promise<AnalyzeMapResponsePayload> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch('/api/analyze-map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as
        | { error?: string | { code?: string; message?: string } }
        | null
      const normalizedError = typeof errorPayload?.error === 'string'
        ? errorPayload.error
        : errorPayload?.error?.message
      const errorMessage = normalizedError ? ` (${normalizedError})` : ''
      throw new Error(`Analysis endpoint failed: ${response.status}${errorMessage}`)
    }

    const data = (await response.json()) as Partial<AnalyzeMapResponsePayload>

    if (!Array.isArray(data.segments)) {
      throw new Error('Malformed analysis response')
    }

    return {
      source: data.source === 'local' ? 'local' : 'llm',
      topic: typeof data.topic === 'string' ? data.topic : '',
      segments: data.segments,
      fallbackReason: typeof data.fallbackReason === 'string' ? data.fallbackReason : undefined,
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function analyzeMapText(text: string, options: AnalyzeMapOptions): Promise<AnalyzeMapResult> {
  const { minSegments, maxSegments, onStatusChange } = options
  const validation = validateAnalyzeMapInput({ text, minSegments, maxSegments })

  if (!validation.ok) {
    throw new Error(validation.message)
  }

  onStatusChange?.('Analyzing key points...')

  try {
    const remote = await requestRemoteAnalysis({
      text: validation.value.text,
      minSegments: validation.value.minSegments,
      maxSegments: validation.value.maxSegments,
    })

    const normalized = normalizeGeneratedDrafts(
      remote.segments,
      { minSegments: validation.value.minSegments, maxSegments: validation.value.maxSegments },
      validation.value.text,
    )

    return {
      source: remote.source,
      topic: inferMainTopic(validation.value.text, remote.topic),
      segments: normalized,
      note: remote.source === 'local'
        ? (remote.fallbackReason ?? 'Generated with local fallback analysis.')
        : undefined,
    }
  } catch (error) {
    onStatusChange?.('Using local fallback analysis...')

    const local = localAnalyzeMapText(validation.value.text, {
      minSegments: validation.value.minSegments,
      maxSegments: validation.value.maxSegments,
    })
    const message = error instanceof Error ? error.message : 'Unknown analysis error'

    return {
      source: 'local',
      topic: inferMainTopic(validation.value.text),
      segments: local,
      note: `Generated with local fallback analysis. ${message}`,
    }
  }
}
