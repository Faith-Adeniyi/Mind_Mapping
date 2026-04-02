import type {
  AnalyzeMapRequestPayload,
  AnalyzeMapResponsePayload,
  GeneratedSegmentDraft,
} from '../types'
import { localAnalyzeMapText, normalizeGeneratedDrafts, type SegmentAnalysisOptions } from './mapAnalysisCore'

type AnalyzeMapOptions = SegmentAnalysisOptions & {
  onStatusChange?: (message: string) => void
}

export type AnalyzeMapResult = {
  source: 'llm' | 'local'
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
      const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null
      const errorMessage = errorPayload?.error ? ` (${errorPayload.error})` : ''
      throw new Error(`Analysis endpoint failed: ${response.status}${errorMessage}`)
    }

    const data = (await response.json()) as Partial<AnalyzeMapResponsePayload>

    if (!Array.isArray(data.segments)) {
      throw new Error('Malformed analysis response')
    }

    return {
      source: data.source === 'local' ? 'local' : 'llm',
      segments: data.segments,
      fallbackReason: typeof data.fallbackReason === 'string' ? data.fallbackReason : undefined,
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function analyzeMapText(text: string, options: AnalyzeMapOptions): Promise<AnalyzeMapResult> {
  const { minSegments, maxSegments, onStatusChange } = options

  onStatusChange?.('Analyzing key points...')

  try {
    const remote = await requestRemoteAnalysis({
      text,
      minSegments,
      maxSegments,
    })

    const normalized = normalizeGeneratedDrafts(remote.segments, { minSegments, maxSegments }, text)

    return {
      source: remote.source,
      segments: normalized,
      note: remote.source === 'local'
        ? (remote.fallbackReason ?? 'Generated with local fallback analysis.')
        : undefined,
    }
  } catch (error) {
    onStatusChange?.('Using local fallback analysis...')

    const local = localAnalyzeMapText(text, { minSegments, maxSegments })
    const message = error instanceof Error ? error.message : 'Unknown analysis error'

    return {
      source: 'local',
      segments: local,
      note: `Generated with local fallback analysis. ${message}`,
    }
  }
}
