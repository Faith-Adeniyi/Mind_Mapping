import { supabase } from './supabase'
import type { LayoutMode, MapDraft, SavedMindMap, Segment } from '../types'

type MindMapRow = {
  id: string
  topic: string
  raw_text: string
  desired_segment_count: number
  segments: Segment[]
  layout_mode: LayoutMode
  created_at: string
  updated_at: string
}

const ROW_COLUMNS = 'id, topic, raw_text, desired_segment_count, segments, layout_mode, created_at, updated_at'

type SavablePart = Pick<
  MapDraft,
  'topic' | 'rawText' | 'desiredSegmentCount' | 'segments' | 'layoutMode'
>

function rowToMap(row: MindMapRow): SavedMindMap {
  return {
    id: row.id,
    topic: row.topic,
    rawText: row.raw_text,
    desiredSegmentCount: row.desired_segment_count,
    segments: Array.isArray(row.segments) ? row.segments : [],
    layoutMode: row.layout_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function draftToPayload(draft: SavablePart) {
  return {
    topic: draft.topic,
    raw_text: draft.rawText,
    desired_segment_count: draft.desiredSegmentCount,
    segments: draft.segments,
    layout_mode: draft.layoutMode,
  }
}

export async function listMaps(): Promise<SavedMindMap[]> {
  const { data, error } = await supabase
    .from('mind_maps')
    .select(ROW_COLUMNS)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as MindMapRow[]).map(rowToMap)
}

export async function createMap(draft: SavablePart, userId: string): Promise<SavedMindMap> {
  const { data, error } = await supabase
    .from('mind_maps')
    .insert({ ...draftToPayload(draft), user_id: userId })
    .select(ROW_COLUMNS)
    .single()
  if (error) throw error
  return rowToMap(data as MindMapRow)
}

export async function updateMap(id: string, draft: SavablePart): Promise<SavedMindMap> {
  const { data, error } = await supabase
    .from('mind_maps')
    .update({ ...draftToPayload(draft), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(ROW_COLUMNS)
    .single()
  if (error) throw error
  return rowToMap(data as MindMapRow)
}

export async function renameMap(id: string, topic: string): Promise<SavedMindMap> {
  const { data, error } = await supabase
    .from('mind_maps')
    .update({ topic, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(ROW_COLUMNS)
    .single()
  if (error) throw error
  return rowToMap(data as MindMapRow)
}

export async function deleteMap(id: string): Promise<void> {
  const { error } = await supabase.from('mind_maps').delete().eq('id', id)
  if (error) throw error
}

export async function duplicateMap(map: SavedMindMap, userId: string): Promise<SavedMindMap> {
  const { data, error } = await supabase
    .from('mind_maps')
    .insert({
      user_id: userId,
      topic: `${map.topic || 'Untitled map'} (copy)`,
      raw_text: map.rawText,
      desired_segment_count: map.desiredSegmentCount,
      segments: map.segments,
      layout_mode: map.layoutMode,
    })
    .select(ROW_COLUMNS)
    .single()
  if (error) throw error
  return rowToMap(data as MindMapRow)
}
