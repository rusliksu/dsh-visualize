import { visualizeMetaFrom, type VisualizeMeta } from './fragment.ts'

/** PTC persists content but omits presentationMeta; keep the complete card there. */
export const PRESENTATION_PREFIX = 'dsh-visualize/v1:'

export interface NestedPresentation {
  readonly turn: number
  readonly callId: string
  readonly meta: VisualizeMeta
}

/** Read only the versioned visualization record from a nested call's durable content. */
export function nestedPresentation(content: unknown): NestedPresentation | undefined {
  if (!Array.isArray(content)) return undefined
  for (const block of content) {
    if (block?.type !== 'text' || typeof block.text !== 'string' || !block.text.startsWith(PRESENTATION_PREFIX)) continue
    try {
      const record = JSON.parse(block.text.slice(PRESENTATION_PREFIX.length)) as Partial<NestedPresentation> | null
      if (record === null || !Number.isSafeInteger(record.turn) || (record.turn as number) < 0
        || typeof record.callId !== 'string' || record.callId.length === 0) continue
      const meta = visualizeMetaFrom(record.meta)
      if (meta !== undefined) return { turn: record.turn as number, callId: record.callId, meta }
    } catch {
      // An unrelated or damaged record cannot produce an executable frame.
    }
  }
  return undefined
}
